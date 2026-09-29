// ---------------------------------------------------------
// Receiver-first workflow. A receiver requests a donation
// straight from Available; the NGO's first action is accepting
// that request (which is also when they take on pickup
// responsibility). Anything that has to keep a request and its
// donation in agreement lives here, using
// donationService.canTransitionDonation so both records always
// move through the same guarded state machine.
// ---------------------------------------------------------

import {
  foodRequests,
  getFoodRequestById,
  getFoodRequestForDonation,
  getDonationById,
  persistDonationData,
} from "../data/mockData.js";
import { canTransitionDonation } from "./donationService.js";
import { createOtp, checkOtp } from "./otp.js";

export function fetchFoodRequests() {
  return Promise.resolve(foodRequests);
}

export function fetchFoodRequestById(id) {
  return Promise.resolve(getFoodRequestById(id));
}

export function fetchFoodRequestForDonation(donationId) {
  return Promise.resolve(getFoodRequestForDonation(donationId));
}

// A Food Receiver requests a still-Available donation. Re-checks
// the donation's current status at the moment this runs and flips
// it to Requested in the same synchronous step — within one
// browser tab that's race-free (nothing can interleave mid
// function call), so two clicks from the SAME tab can never both
// succeed. Two different tabs racing each other right at the same
// instant, before either has synced the other's write, is a real
// gap this localStorage-based layer can't fully close — that
// needs a real backend's atomic transactions. See syncStorage.js.
// TODO(backend): a transaction creating the request doc and
// updating the donation doc together, atomically, server-side
export function requestFood(donationId, receiverProfile, extra = {}) {
  const donation = getDonationById(donationId);
  if (!donation || !canTransitionDonation(donation.status, "Requested")) {
    return Promise.resolve({ success: false, reason: "no_longer_available" });
  }
  const now = new Date().toISOString();
  const request = {
    id: `req-${Math.floor(Math.random() * 9000) + 1000}`,
    donationId,
    donationTitle: donation.title,
    receiverId: receiverProfile.id,
    receiverName: receiverProfile.name,
    quantityNeeded: donation.quantity,
    notes: extra.notes || "",
    status: "Waiting for NGO",
    requestedAt: now,
  };
  foodRequests.unshift(request);

  donation.status = "Requested";
  donation.requestedBy = receiverProfile.name;
  donation.requestedAt = now;
  donation.requestId = request.id;

  persistDonationData();
  return Promise.resolve({ success: true, request, donation });
}

// NGO accepts the receiver's request — this is the NGO's first
// touch on the donation, and also when they take responsibility
// for arranging pickup from the donor.
// TODO(backend): a transaction setting both docs' status together
export function acceptFoodRequest(id, ngoProfile) {
  const request = getFoodRequestById(id);
  if (!request || request.status !== "Waiting for NGO") {
    return Promise.resolve({ success: false });
  }
  const donation = getDonationById(request.donationId);
  if (!donation || !canTransitionDonation(donation.status, "Pickup Pending")) {
    return Promise.resolve({ success: false });
  }
  const now = new Date().toISOString();
  request.status = "Accepted";
  request.acceptedAt = now;
  donation.status = "Pickup Pending";
  donation.ngoName = ngoProfile.name;
  donation.ngoId = ngoProfile.id;
  donation.acceptedAt = now;
  persistDonationData();
  return Promise.resolve({ success: true, request, donation });
}

// NGO declines — frees the donation back to Available so another
// receiver (or the same one) can request it.
// TODO(backend): a transaction reverting both docs
export function declineFoodRequest(id) {
  const request = getFoodRequestById(id);
  if (!request || request.status !== "Waiting for NGO") {
    return Promise.resolve({ success: false });
  }
  const donation = getDonationById(request.donationId);
  request.status = "Declined";
  request.declinedAt = new Date().toISOString();
  if (donation && canTransitionDonation(donation.status, "Available")) {
    donation.status = "Available";
    donation.requestedBy = null;
    donation.requestedAt = null;
    donation.requestId = null;
  }
  persistDonationData();
  return Promise.resolve({ success: true, request });
}

// Once the NGO has physically received the food (donation status
// "Received by NGO"), this prepares the handover to the receiver
// who already requested it: generates their distribution OTP and
// moves both records into Distribution Pending.
// TODO(backend): a transaction generating the OTP server-side
// (e.g. a Cloud Function) and updating both docs together
export function prepareHandover(donationId) {
  const donation = getDonationById(donationId);
  if (!donation || !canTransitionDonation(donation.status, "Distribution Pending")) {
    return Promise.resolve({ success: false });
  }
  const request = getFoodRequestForDonation(donationId);
  if (!request) return Promise.resolve({ success: false });

  const now = new Date().toISOString();
  donation.status = "Distribution Pending";
  donation.readyForDistributionAt = now;
  request.status = "Distribution Pending";
  request.distributionOtp = createOtp();
  persistDonationData();
  return Promise.resolve({ success: true, donation, request });
}

// Receiver can ask for a fresh code if theirs expired before pickup.
export function regenerateDistributionOtp(id) {
  const request = getFoodRequestById(id);
  if (request) {
    request.distributionOtp = createOtp();
    persistDonationData();
  }
  return Promise.resolve(request);
}

// NGO enters the code the receiver shows them at handover. Closes
// the loop by marking both the request AND its donation Completed.
// TODO(backend): a callable function checking server-side, then a
// transaction updating both documents
export function verifyDistributionOtp(id, enteredCode) {
  const request = getFoodRequestById(id);
  if (!request) {
    return Promise.resolve({ success: false, reason: "none" });
  }
  const result = checkOtp(request.distributionOtp, enteredCode);
  if (result.success) {
    const donation = getDonationById(request.donationId);
    if (donation && canTransitionDonation(donation.status, "Completed")) {
      const now = new Date().toISOString();
      request.distributionOtp.usedAt = now;
      request.distributedAt = now;
      request.status = "Completed";
      donation.status = "Completed";
      donation.distributedAt = now;
      persistDonationData();
    }
  }
  return Promise.resolve({ ...result, request });
}

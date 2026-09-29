// ---------------------------------------------------------
// All reads/writes to the shared `donations` array go through
// here — this keeps Donor/NGO/Receiver dashboards looking at one
// authoritative record instead of separate copies. Every
// mutation calls persistDonationData() so the change survives
// and syncs to other tabs (see mockData.js / syncStorage.js for
// exactly what that does and doesn't cover).
//
// Receiver-first workflow: a receiver requests directly from
// Available — no NGO action is a precondition (see
// foodRequestService.js for the request-side of this; anything
// that touches BOTH a donation and its request lives there so
// the two records never disagree with each other).
// ---------------------------------------------------------

import { donations, getDonationById, persistDonationData } from "../data/mockData.js";
import { createOtp, checkOtp } from "./otp.js";

// Which statuses a donation is allowed to move to from its
// current status. Anything not listed here is refused rather
// than silently allowed — this is what "no impossible status
// transitions" means in practice.
const ALLOWED_TRANSITIONS = {
  Available: ["Requested", "Cancelled", "Expired"],
  Requested: ["Pickup Pending", "Available"], // back to Available if the NGO declines
  "Pickup Pending": ["Received by NGO"],
  "Received by NGO": ["Distribution Pending"],
  "Distribution Pending": ["Completed"],
  Completed: [],
  Cancelled: [],
  Expired: [],
};

function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

// Exposed so foodRequestService.js can respect the same
// transition rules without duplicating this table.
export function canTransitionDonation(from, to) {
  return canTransition(from, to);
}

export function fetchDonations() {
  return Promise.resolve(donations);
}

export function fetchDonationById(id) {
  return Promise.resolve(getDonationById(id));
}

// TODO(backend): addDoc(collection(db, "donations"), donationDraft)
export function createDonation(donationDraft) {
  const newDonation = {
    id: `don-${Math.floor(Math.random() * 9000) + 1000}`,
    status: "Available",
    createdAt: new Date().toISOString(),
    ngoName: null,
    ngoId: null,
    ...donationDraft,
  };
  donations.unshift(newDonation);
  persistDonationData();
  return Promise.resolve(newDonation);
}

// Donor cancels their own donation while it's still unclaimed.
export function cancelDonation(id) {
  const donation = getDonationById(id);
  if (!donation || !canTransition(donation.status, "Cancelled")) {
    return Promise.resolve({ success: false });
  }
  donation.status = "Cancelled";
  donation.cancelledAt = new Date().toISOString();
  persistDonationData();
  return Promise.resolve({ success: true, donation });
}

// ---- Pickup handover: Donor generates, NGO enters ----
// Only the Donor Dashboard ever renders donation.pickupOtp.code —
// the NGO dashboard only ever sends a typed-in guess to
// verifyPickupOtp and gets back success/failure, never the code.

// TODO(backend): a Cloud Function so the code never reaches the browser at all
export function generatePickupOtp(id) {
  const donation = getDonationById(id);
  if (donation && donation.status === "Pickup Pending") {
    donation.pickupOtp = createOtp();
    persistDonationData();
  }
  return Promise.resolve(donation);
}

// TODO(backend): a callable function that checks server-side and
// then updates the donation — never resolve/reject with the real code.
export function verifyPickupOtp(id, enteredCode) {
  const donation = getDonationById(id);
  if (!donation) return Promise.resolve({ success: false, reason: "none" });
  const result = checkOtp(donation.pickupOtp, enteredCode);
  if (result.success && canTransition(donation.status, "Received by NGO")) {
    const now = new Date().toISOString();
    donation.pickupOtp.usedAt = now;
    donation.pickupVerifiedAt = now;
    donation.status = "Received by NGO";
    persistDonationData();
  }
  return Promise.resolve({ ...result, donation });
}

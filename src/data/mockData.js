// ---------------------------------------------------------
// Shared donation + food-request data. This is the ONE
// authoritative source both donationService.js and
// foodRequestService.js read and write — no per-dashboard
// copies. It's persisted to localStorage and kept in sync
// across browser tabs (see services/syncStorage.js); see that
// file for exactly what "real-time" means here and its limits.
// ---------------------------------------------------------

import { loadState, saveState, subscribe } from "../services/syncStorage.js";

export const DONATIONS_STORAGE_KEY = "foodbridge_donations_v2";
const STORAGE_KEY = DONATIONS_STORAGE_KEY;

// Every possible donation status, receiver-first: a receiver
// requests directly from Available — no NGO action is required
// first. The NGO's first touch is accepting that request, which
// is also the moment they take on pickup responsibility. A couple
// of adjacent steps from the original spec (e.g. "NGO Accepted" +
// "Pickup Pending", or "Ready for Distribution" + "Distribution
// Pending") are combined into one resting status here because
// nothing meaningfully happens in between them for a single NGO
// user to act on — but separate timestamp fields below
// (acceptedAt, pickupVerifiedAt, readyForDistributionAt, etc.)
// still record each moment individually for the tracking timeline.
export const donationStatuses = [
  "Available",
  "Requested",
  "Pickup Pending",
  "Received by NGO",
  "Distribution Pending",
  "Completed",
  "Cancelled",
  "Expired",
];

export const foodRequestStatuses = ["Waiting for NGO", "Accepted", "Distribution Pending", "Completed", "Declined"];

const seedDonations = [
  {
    id: "don-1001",
    donorId: "acct-1",
    donorName: "Green Leaf Bakery",
    title: "40 vegetable sandwiches",
    category: "Cooked Food",
    quantity: "40 servings",
    status: "Available",
    createdAt: "2026-09-19T08:30:00+05:30",
    bestUsedBy: "2026-09-20T13:00:00+05:30",
    pickupWindow: "Today, 6:00 PM – 8:00 PM",
    address: "12 Linking Road, Bandra West, Mumbai",
    storageRequirement: "Keep refrigerated if collected after 7 PM",
    notes: "Packed in sealed trays.",
    ngoName: null,
    ngoId: null,
  },
  {
    id: "don-1002",
    donorId: "acct-1",
    donorName: "Green Leaf Bakery",
    title: "Surplus wedding catering – rice & curries",
    category: "Cooked Food",
    quantity: "120 servings",
    status: "Pickup Pending",
    createdAt: "2026-09-19T19:10:00+05:30",
    bestUsedBy: "2026-09-20T02:00:00+05:30",
    pickupWindow: "Today, 9:00 PM – 10:00 PM",
    address: "12 Linking Road, Bandra West, Mumbai",
    storageRequirement: "Large quantity — bring two carriers.",
    notes: "",
    requestedBy: "Fatima Sheikh",
    requestedAt: "2026-09-19T19:20:00+05:30",
    requestId: "req-1001",
    ngoName: "Anna Seva Trust",
    ngoId: "acct-2",
    acceptedAt: "2026-09-19T19:30:00+05:30",
  },
  {
    id: "don-1003",
    donorId: "acct-1",
    donorName: "Green Leaf Bakery",
    title: "Bread and bakery surplus",
    category: "Bakery",
    quantity: "60 loaves",
    status: "Distribution Pending",
    createdAt: "2026-09-18T17:00:00+05:30",
    bestUsedBy: "2026-09-21T12:00:00+05:30",
    pickupWindow: "18 Sep, 6:00 PM – 7:00 PM",
    address: "12 Linking Road, Bandra West, Mumbai",
    storageRequirement: "Room temperature, use within 3 days.",
    notes: "",
    requestedBy: "Fatima Sheikh",
    requestedAt: "2026-09-18T17:05:00+05:30",
    requestId: "req-1002",
    ngoName: "Anna Seva Trust",
    ngoId: "acct-2",
    acceptedAt: "2026-09-18T17:10:00+05:30",
    pickupVerifiedAt: "2026-09-18T18:00:00+05:30",
    readyForDistributionAt: "2026-09-18T18:30:00+05:30",
  },
  {
    id: "don-1005",
    donorId: "acct-6",
    donorName: "Metro Convenience Store",
    title: "Packaged snacks – short shelf life",
    category: "Packaged",
    quantity: "35 packs",
    status: "Expired",
    createdAt: "2026-09-13T10:00:00+05:30",
    bestUsedBy: "2026-09-13T20:00:00+05:30",
    pickupWindow: "13 Sep, 5:00 PM – 6:00 PM",
    address: "Shop 4, Andheri Station Road, Mumbai",
    storageRequirement: "",
    notes: "No receiver requested it in time.",
    ngoName: null,
    ngoId: null,
  },
];

const seedFoodRequests = [
  {
    id: "req-1001",
    donationId: "don-1002",
    donationTitle: "Surplus wedding catering – rice & curries",
    receiverId: "acct-3",
    receiverName: "Fatima Sheikh",
    quantityNeeded: "120 servings",
    notes: "",
    status: "Accepted",
    requestedAt: "2026-09-19T19:20:00+05:30",
    acceptedAt: "2026-09-19T19:30:00+05:30",
  },
  {
    id: "req-1002",
    donationId: "don-1003",
    donationTitle: "Bread and bakery surplus",
    receiverId: "acct-3",
    receiverName: "Fatima Sheikh",
    quantityNeeded: "60 loaves",
    notes: "Family of 4, no cooking facilities today.",
    status: "Distribution Pending",
    requestedAt: "2026-09-18T17:05:00+05:30",
    acceptedAt: "2026-09-18T17:10:00+05:30",
    distributionOtp: { code: "482913", expiresAt: "2099-01-01T00:00:00.000Z", usedAt: null },
  },
];

const stored = loadState(STORAGE_KEY, { donations: seedDonations, foodRequests: seedFoodRequests });

export const donations = stored.donations;
export const foodRequests = stored.foodRequests;

export function persistDonationData() {
  saveState(STORAGE_KEY, { donations, foodRequests });
}

// Keep this tab's copy of the data in sync when another tab of
// the same browser changes it.
subscribe(STORAGE_KEY, () => {
  const fresh = loadState(STORAGE_KEY, { donations, foodRequests });
  donations.length = 0;
  donations.push(...fresh.donations);
  foodRequests.length = 0;
  foodRequests.push(...fresh.foodRequests);
});

// Lets a dashboard say "tell me when shared donation data changes
// in another tab" without caring about the storage-event plumbing.
export function onDonationDataChanged(callback) {
  return subscribe(STORAGE_KEY, callback);
}

export function getDonationById(id) {
  return donations.find((d) => d.id === id) || null;
}

export function getFoodRequestById(id) {
  return foodRequests.find((r) => r.id === id) || null;
}

export function getFoodRequestForDonation(donationId) {
  const matches = foodRequests.filter((r) => r.donationId === donationId);
  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

export const ngoStats = {
  completedThisMonth: 47,
  peopleFed: 1180,
  volunteersOnRoster: 14,
};

export const donorStats = {
  mealsProvided: 2140,
  co2SavedKg: 310,
};

export const receiverStats = {
  itemsReceived: 6,
  householdsLikeYoursHelped: 240,
};

export const adminOverview = {
  totalUsers: 342,
  activeDonationsNow: 19,
  mealsProvided: 68400,
};

export const volunteerStats = {
  assignedToday: 2,
  completedPickups: 32,
  hoursThisMonth: 18,
};

export const volunteerAssignments = [
  {
    id: "assign-1",
    donationId: "don-1002",
    title: "Surplus wedding catering – rice & curries",
    pickupWindow: "Today, 9:00 PM – 10:00 PM",
    address: "12 Linking Road, Bandra West, Mumbai",
    status: "Assigned",
  },
];

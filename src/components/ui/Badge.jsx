import "./Badge.css";

// Maps a status string to a visual tone. Falls back to
// "neutral" for anything not listed here.
const TONE_BY_STATUS = {
  Available: "positive",
  Requested: "warning",
  "Pickup Pending": "info",
  "Received by NGO": "info",
  "Distribution Pending": "info",
  Completed: "positive",
  Cancelled: "neutral",
  Expired: "danger",
  "Waiting for NGO": "warning",
  Accepted: "info",
  Declined: "danger",
  Pending: "warning",
  Verified: "positive",
  Rejected: "danger",
};

export default function Badge({ status, children }) {
  const tone = TONE_BY_STATUS[status] || "neutral";
  return <span className={`badge badge-${tone}`}>{children || status}</span>;
}

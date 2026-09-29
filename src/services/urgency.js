// ---------------------------------------------------------
// Automatic urgency classification. The donor never picks this
// — it's always derived from the current time vs. bestUsedBy,
// so it stays accurate as time passes instead of going stale
// like a manually-chosen label would.
// ---------------------------------------------------------

// Tweak these to change what counts as urgent/critical.
export const URGENCY_THRESHOLDS_MS = {
  critical: 1 * 60 * 60 * 1000, // < 1 hour left
  urgent: 4 * 60 * 60 * 1000, // < 4 hours left
};

export const URGENCY_META = {
  critical: { label: "Critical", emoji: "🔴" },
  urgent: { label: "Urgent", emoji: "🟠" },
  safe: { label: "Safe Window", emoji: "🟢" },
  expired: { label: "Expired", emoji: "⚫" },
};

// Returns "critical" | "urgent" | "safe" | "expired"
export function calculateFoodUrgency(bestUsedBy, now = Date.now()) {
  if (!bestUsedBy) return "safe";
  const msRemaining = new Date(bestUsedBy).getTime() - now;
  if (msRemaining <= 0) return "expired";
  if (msRemaining <= URGENCY_THRESHOLDS_MS.critical) return "critical";
  if (msRemaining <= URGENCY_THRESHOLDS_MS.urgent) return "urgent";
  return "safe";
}

export function formatTimeRemaining(bestUsedBy, now = Date.now()) {
  const msRemaining = new Date(bestUsedBy).getTime() - now;
  if (msRemaining <= 0) return "Expired";
  const hours = Math.floor(msRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `Expires in ${days} day${days > 1 ? "s" : ""}`;
  }
  if (hours >= 1) return `Expires in ${hours}h ${minutes}m`;
  return `Expires in ${minutes}m`;
}

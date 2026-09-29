// ---------------------------------------------------------
// Generic, app-agnostic localStorage sync helpers.
//
// This is what stands in for a real backend in this prototype.
// Writing to localStorage makes data outlive a single page's
// JS memory, and the browser's native "storage" event fires in
// every OTHER tab of the same browser the instant it changes —
// so a donation created in one tab shows up in another tab's
// NGO/Receiver dashboard without a manual refresh.
//
// IMPORTANT LIMITS (be upfront about these):
// - This only syncs tabs of the SAME browser on the SAME
//   computer. It does NOT sync across different devices or
//   different browsers — that needs a real backend (Firebase).
// - "storage" only fires in tabs that did NOT make the change,
//   which is exactly why same-tab code still calls its own
//   refresh() after an action — that part is unchanged.
// ---------------------------------------------------------

export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable/full — prototype, fail silently rather than crash.
  }
}

// Fires callback(parsedNewValue) whenever ANOTHER tab changes this key.
export function subscribeWithPayload(key, onChange) {
  function handler(e) {
    if (e.key !== key || e.newValue == null) return;
    try {
      onChange(JSON.parse(e.newValue));
    } catch {
      // Ignore malformed payloads rather than crash the listener.
    }
  }
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

// Fires callback() with no payload — for components that just want
// to know "something changed, go re-fetch" rather than the raw value.
export function subscribe(key, onChange) {
  function handler(e) {
    if (e.key === key) onChange();
  }
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

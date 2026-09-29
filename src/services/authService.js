// ---------------------------------------------------------
// Thin wrapper so every existing page can keep calling
// getCurrentUser() exactly as before. The real logic — sign
// up, log in, account verification, NGO admin verification —
// now lives in accountService.js, which this delegates to.
//
// Later this becomes a wrapper around Firebase Auth
// (onAuthStateChanged, etc.), but the shape returned —
// { role, profile } — stays the same either way.
// ---------------------------------------------------------

import { getCurrentUser as getSessionUser } from "./accountService.js";

export function getCurrentUser() {
  return getSessionUser();
}

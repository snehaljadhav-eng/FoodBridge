// ---------------------------------------------------------
// Shared 6-digit OTP logic used by both handover points:
//   Donor -> NGO   (pickup)
//   NGO -> Receiver (distribution)
//
// This is a local/prototype implementation only — no SMS,
// no server. The OTP record lives on the donation or request
// object itself. Later, this logic moves server-side (e.g. a
// Cloud Function) so the code is never sent to the browser of
// the person who has to enter it; the function names and
// shapes here are written so that swap is straightforward.
// ---------------------------------------------------------

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes — long enough for a face-to-face handover

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// { code, expiresAt, usedAt }
export function createOtp() {
  return {
    code: generateOtpCode(),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    usedAt: null,
  };
}

export function isOtpExpired(otp) {
  if (!otp) return true;
  return Date.now() > new Date(otp.expiresAt).getTime();
}

// Whether this OTP is still valid to show/enter (exists, unused, not expired).
export function isOtpActive(otp) {
  return Boolean(otp) && !otp.usedAt && !isOtpExpired(otp);
}

// Checks an entered code against an OTP record without mutating
// anything. Callers apply the side effects (status change,
// timestamps, marking used) only when success is true.
export function checkOtp(otp, enteredCode) {
  if (!otp) return { success: false, reason: "none" };
  if (otp.usedAt) return { success: false, reason: "used" };
  if (isOtpExpired(otp)) return { success: false, reason: "expired" };
  if (String(enteredCode || "").trim() !== otp.code) {
    return { success: false, reason: "invalid" };
  }
  return { success: true };
}

export function otpErrorMessage(reason) {
  if (reason === "expired") {
    return "This OTP has expired — ask them to regenerate it.";
  }
  if (reason === "used") {
    return "This OTP has already been used.";
  }
  return "Invalid OTP.";
}

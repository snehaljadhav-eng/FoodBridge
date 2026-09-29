import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  verifyAccountOtp,
  resendAccountOtp,
  DASHBOARD_BY_ROLE,
} from "../../services/accountService.js";

export default function VerifyAccount() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState(
    "Please check your email for the FoodBridge verification link."
  );
  const [error, setError] = useState("");

  useEffect(() => {
    checkVerification();
  }, []);

  async function checkVerification() {
    setChecking(true);
    setError("");

    const result = await verifyAccountOtp(accountId);

    if (result.success && result.account) {
      setVerified(true);

      const dashboard =
        DASHBOARD_BY_ROLE[result.account.role] || "/";

      setMessage("Your email has been verified successfully.");

      setTimeout(() => {
        navigate(dashboard, { replace: true });
      }, 1200);
    } else {
      setVerified(false);
    }

    setChecking(false);
  }

  async function resendEmail() {
    setError("");
    setMessage("Sending a new confirmation email...");

    const result = await resendAccountOtp(accountId);

    if (result.success) {
      setMessage(
        "A new confirmation email has been sent. Please check your inbox."
      );
    } else {
      setError(result.reason || "Could not resend the email.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        {checking ? (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <h1 className="text-2xl font-bold text-slate-900">
              Checking verification
            </h1>

            <p className="mt-2 text-slate-600">
              Please wait...
            </p>
          </>
        ) : verified ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Email Verified
            </h1>

            <p className="mt-3 text-slate-600">
              {message}
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
              ✉
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Verify Your Email
            </h1>

            <p className="mt-3 text-slate-600">
              {message}
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={resendEmail}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Resend Confirmation Email
            </button>

            <button
              onClick={() => navigate("/login")}
              className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
import { Navigate } from "react-router-dom";
import { getCurrentSession, DASHBOARD_BY_ROLE } from "../../services/accountService.js";

// Wrap a route's element with this to require login. Pass
// allowedRole ("donor" | "ngo" | "receiver") to also require
// that specific role — a logged-in Donor hitting /ngo gets sent
// to their own dashboard, not just turned away.
export default function RequireAuth({ allowedRole, children }) {
  const session = getCurrentSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && session.role !== allowedRole) {
    return <Navigate to={DASHBOARD_BY_ROLE[session.role] || "/"} replace />;
  }

  return children;
}

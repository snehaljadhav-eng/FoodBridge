import { Routes, Route } from "react-router-dom";
import { supabase } from "./services/supabaseClient";

import LandingPage from "./pages/LandingPage.jsx";
import DonorDashboard from "./pages/donor/DonorDashboard.jsx";
import CreateDonation from "./pages/donor/CreateDonation.jsx";
import DonationDetails from "./pages/DonationDetails.jsx";
import NgoDashboard from "./pages/ngo/NgoDashboard.jsx";
import ReceiverDashboard from "./pages/receiver/ReceiverDashboard.jsx";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import SignUp from "./pages/auth/SignUp.jsx";
import VerifyAccount from "./pages/auth/VerifyAccount.jsx";
import Login from "./pages/auth/Login.jsx";
import RequireAuth from "./components/auth/RequireAuth.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Public: anyone can view a donation's details/timeline,
          but the transactional actions inside require login. */}
      <Route path="/donations/:id" element={<DonationDetails />} />

      <Route
        path="/donor"
        element={
          <RequireAuth allowedRole="donor">
            <DonorDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/donor/new"
        element={
          <RequireAuth allowedRole="donor">
            <CreateDonation />
          </RequireAuth>
        }
      />

      <Route
        path="/ngo"
        element={
          <RequireAuth allowedRole="ngo">
            <NgoDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/receiver"
        element={
          <RequireAuth allowedRole="receiver">
            <ReceiverDashboard />
          </RequireAuth>
        }
      />

      {/* Volunteer/Admin have no sign-up flow of their own yet —
          any logged-in account can view them for this prototype. */}
      <Route
        path="/volunteer"
        element={
          <RequireAuth>
            <VolunteerDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        }
      />

      <Route path="/signup/:role" element={<SignUp />} />
      <Route path="/verify/:accountId" element={<VerifyAccount />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

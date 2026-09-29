import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Card from "../../components/ui/Card.jsx";
import {
  fetchDonations,
  generatePickupOtp,
  cancelDonation,
} from "../../services/donationService.js";
import { onDonationDataChanged } from "../../data/mockData.js";
import { getCurrentUser } from "../../services/authService.js";
import { isOtpActive } from "../../services/otp.js";
import { donorStats } from "../../data/mockData.js";
import "./DonorDashboard.css";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// Notifications are computed from the donation's own timestamps
// rather than stored separately — so they can never drift out of
// sync with what actually happened.
function buildNotifications(myDonations) {
  const items = [];
  myDonations.forEach((d) => {
    if (d.acceptedAt) {
      items.push({
        id: `${d.id}-accepted`,
        time: d.acceptedAt,
        text: `${d.ngoName} is arranging pickup for "${d.title}."`,
      });
    }
    if (d.pickupVerifiedAt) {
      items.push({
        id: `${d.id}-picked-up`,
        time: d.pickupVerifiedAt,
        text: `Your donation "${d.title}" pickup was verified.`,
      });
    }
    if (d.requestedBy) {
      items.push({
        id: `${d.id}-requested`,
        time: d.requestedAt,
        text: `"${d.title}" has been requested by a receiver.`,
      });
    }
    if (d.distributedAt) {
      items.push({
        id: `${d.id}-distributed`,
        time: d.distributedAt,
        text: `"${d.title}" has reached a receiver. Thank you!`,
      });
    }
  });
  return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
}

export default function DonorDashboard() {
  const { profile } = getCurrentUser();
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    return fetchDonations().then((all) => {
      setMyDonations(all.filter((d) => d.donorName === profile.name));
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    const unsubscribe = onDonationDataChanged(refresh);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.name]);

  function handleGenerateOtp(id) {
    generatePickupOtp(id).then(refresh);
  }

  function handleCancel(id) {
    cancelDonation(id).then(refresh);
  }

  const notifications = buildNotifications(myDonations);

  return (
    <DashboardLayout
      role="donor"
      userName={profile.name}
      title="My donations"
      description="Everything you've listed, and where it ended up."
    >
      <div className="stat-row">
        <StatCard label="Total donations" value={myDonations.length} />
        <StatCard label="Meals provided" value={donorStats.mealsProvided.toLocaleString("en-IN")} />
        <StatCard
          label="Active listings"
          value={myDonations.filter((d) => !["Completed", "Cancelled", "Expired"].includes(d.status)).length}
        />
        <StatCard label="CO₂ saved" value={`${donorStats.co2SavedKg} kg`} />
      </div>

      {notifications.length > 0 && (
        <div className="notification-list">
          {notifications.map((n) => (
            <div key={n.id} className="notification-item">
              {n.text}
            </div>
          ))}
        </div>
      )}

      <div className="section-heading-row">
        <h2>Your listings</h2>
        <Button as={Link} to="/donor/new" variant="amber">
          + Create donation
        </Button>
      </div>

      {loading && <p>Loading your donations…</p>}

      {!loading && myDonations.length === 0 && (
        <Card>
          <p style={{ margin: 0 }}>
            You haven't listed anything yet. Create your first donation to get
            it in front of nearby NGOs.
          </p>
        </Card>
      )}

      {!loading && myDonations.length > 0 && (
        <div className="donation-list">
          {myDonations.map((d) => {
            const otpActive = isOtpActive(d.pickupOtp);
            return (
              <div key={d.id}>
                <div className="donation-row donor-row">
                  <Link to={`/donations/${d.id}`} className="donation-row-main">
                    <div className="donation-row-title">{d.title}</div>
                    <div className="donation-row-meta">
                      {d.quantity} · {d.category} · {d.pickupWindow}
                    </div>
                  </Link>
                  <Badge status={d.status} />
                  {d.status === "Available" && (
                    <Button variant="ghost" onClick={() => handleCancel(d.id)}>
                      Cancel
                    </Button>
                  )}
                  {d.status === "Pickup Pending" && !otpActive && (
                    <Button variant="outline" onClick={() => handleGenerateOtp(d.id)}>
                      Generate Pickup OTP
                    </Button>
                  )}
                </div>

                {d.status === "Pickup Pending" && otpActive && (
                  <div className="otp-box">
                    <div className="otp-box-text">
                      <div className="otp-code">{d.pickupOtp.code}</div>
                      <div className="otp-meta">
                        Share this with the NGO in person at pickup. Only you can
                        see this code. Expires at {formatTime(d.pickupOtp.expiresAt)}.
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => handleGenerateOtp(d.id)}>
                      Regenerate OTP
                    </Button>
                  </div>
                )}

                {d.pickupVerifiedAt && (
                  <div className="verified-note">
                    ✓ Pickup Verified at {formatTime(d.pickupVerifiedAt)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

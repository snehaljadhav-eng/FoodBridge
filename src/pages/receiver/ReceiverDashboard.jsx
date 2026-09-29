import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Card from "../../components/ui/Card.jsx";
import { fetchDonations } from "../../services/donationService.js";
import { fetchFoodRequests, requestFood, regenerateDistributionOtp } from "../../services/foodRequestService.js";
import { onDonationDataChanged } from "../../data/mockData.js";
import { getCurrentUser } from "../../services/authService.js";
import { isOtpActive } from "../../services/otp.js";
import { receiverStats } from "../../data/mockData.js";
import "../donor/DonorDashboard.css";
import "./ReceiverDashboard.css";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;
function isNew(donation) {
  return Date.now() - new Date(donation.createdAt).getTime() < NEW_WINDOW_MS;
}

// Notifications are computed from each request's own timestamps,
// not stored separately, so they can't drift out of sync with
// what actually happened.
function buildNotifications(myRequests) {
  const items = [];
  myRequests.forEach((r) => {
    if (r.acceptedAt) {
      items.push({ id: `${r.id}-accepted`, time: r.acceptedAt, text: `Your request for "${r.donationTitle}" was accepted.` });
    }
    if (r.declinedAt) {
      items.push({ id: `${r.id}-declined`, time: r.declinedAt, text: `Your request for "${r.donationTitle}" was declined.` });
    }
    if (r.status === "Distribution Pending" && r.distributionOtp) {
      items.push({ id: `${r.id}-ready`, time: r.distributionOtp.usedAt || r.acceptedAt, text: `"${r.donationTitle}" is ready for you to collect.` });
    }
    if (r.distributedAt) {
      items.push({ id: `${r.id}-done`, time: r.distributedAt, text: `Your distribution for "${r.donationTitle}" is complete.` });
    }
  });
  return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
}

export default function ReceiverDashboard() {
  const { profile } = getCurrentUser();
  const [availableFood, setAvailableFood] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");

  function refresh() {
    return Promise.all([fetchDonations(), fetchFoodRequests()]).then(([allDonations, allRequests]) => {
      setAvailableFood(allDonations.filter((d) => d.status === "Available"));
      setMyRequests(allRequests.filter((r) => r.receiverName === profile.name));
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    const unsubscribe = onDonationDataChanged(refresh);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.name]);

  function handleRequest(donation) {
    requestFood(donation.id, profile).then((result) => {
      if (!result.success) {
        setRequestError("Someone else just requested this — it's no longer available.");
      } else {
        setRequestError("");
      }
      refresh();
    });
  }

  function handleRegenerate(id) {
    regenerateDistributionOtp(id).then(refresh);
  }

  const notifications = buildNotifications(myRequests);

  return (
    <DashboardLayout
      role="receiver"
      userName={profile.name}
      title="Available food & requests"
      description="Request food you need — an NGO will arrange pickup and let you know when it's ready."
    >
      <div className="stat-row">
        <StatCard label="Active requests" value={myRequests.filter((r) => !["Completed", "Declined"].includes(r.status)).length} />
        <StatCard label="Items received" value={receiverStats.itemsReceived} />
        <StatCard label="Households like yours helped" value={receiverStats.householdsLikeYoursHelped} />
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

      {requestError && <div className="otp-error" style={{ marginBottom: 16 }}>{requestError}</div>}

      <div className="section-heading-row">
        <h2>Available food</h2>
      </div>

      {loading && <p>Loading available food…</p>}

      {!loading && availableFood.length === 0 && (
        <p>Nothing available right now — check back soon.</p>
      )}

      {!loading && availableFood.length > 0 && (
        <div className="donation-list" style={{ marginBottom: 44 }}>
          {availableFood.map((d) => (
            <div className="donation-row receiver-row" key={d.id}>
              <Link to={`/donations/${d.id}`} className="donation-row-main">
                <div className="donation-row-title">
                  {d.title} {isNew(d) && <span className="new-tag">New</span>}
                </div>
                <div className="donation-row-meta">
                  {d.donorName} · {d.quantity}
                </div>
              </Link>
              <Button variant="amber" onClick={() => handleRequest(d)}>
                Request Food
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="section-heading-row">
        <h2>My requests</h2>
      </div>

      {!loading && myRequests.length === 0 && <p>You haven't requested anything yet.</p>}

      {!loading && myRequests.length > 0 && (
        <div className="donation-list">
          {myRequests.map((r) => {
            const otpActive = isOtpActive(r.distributionOtp);
            return (
              <div key={r.id}>
                <div className="donation-row receiver-row">
                  <div className="donation-row-main">
                    <div className="donation-row-title">{r.donationTitle}</div>
                    <div className="donation-row-meta">{r.quantityNeeded}</div>
                  </div>
                  <Badge status={r.status} />
                </div>

                {r.status === "Distribution Pending" && otpActive && (
                  <div className="otp-box">
                    <div className="otp-box-text">
                      <div className="otp-code">{r.distributionOtp.code}</div>
                      <div className="otp-meta">
                        Show this to the NGO when you collect the food. Only you can
                        see this code. Expires at {formatTime(r.distributionOtp.expiresAt)}.
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => handleRegenerate(r.id)}>
                      Regenerate OTP
                    </Button>
                  </div>
                )}

                {r.status === "Distribution Pending" && !otpActive && (
                  <div className="otp-box">
                    <div className="otp-box-text">
                      <div className="otp-meta">Your code has expired.</div>
                    </div>
                    <Button variant="ghost" onClick={() => handleRegenerate(r.id)}>
                      Regenerate OTP
                    </Button>
                  </div>
                )}

                {r.status === "Completed" && r.distributedAt && (
                  <div className="verified-note">✓ Distribution Verified at {formatTime(r.distributedAt)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="section-heading-row">
        <h2>Profile</h2>
      </div>
      <Card>
        <dl className="details-list">
          <div>
            <dt>Name</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{profile.phone}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{profile.location}</dd>
          </div>
        </dl>
      </Card>
    </DashboardLayout>
  );
}

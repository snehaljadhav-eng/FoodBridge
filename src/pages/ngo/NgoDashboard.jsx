import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { fetchDonations, verifyPickupOtp } from "../../services/donationService.js";
import {
  fetchFoodRequests,
  acceptFoodRequest,
  declineFoodRequest,
  prepareHandover,
  verifyDistributionOtp,
} from "../../services/foodRequestService.js";
import { onDonationDataChanged } from "../../data/mockData.js";
import { otpErrorMessage } from "../../services/otp.js";
import { getCurrentUser } from "../../services/authService.js";
import { calculateFoodUrgency, formatTimeRemaining, URGENCY_META } from "../../services/urgency.js";
import { ngoStats } from "../../data/mockData.js";
import "../donor/DonorDashboard.css";
import "./NgoDashboard.css";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const URGENCY_SORT_ORDER = { expired: 0, critical: 1, urgent: 2, safe: 3 };
function byUrgency(a, b) {
  return URGENCY_SORT_ORDER[calculateFoodUrgency(a.bestUsedBy)] - URGENCY_SORT_ORDER[calculateFoodUrgency(b.bestUsedBy)];
}

export default function NgoDashboard() {
  const { profile } = getCurrentUser();
  const isVerifiedNgo = true;

  const [availableNearby, setAvailableNearby] = useState([]); // informational only, no claim action here
  const [newRequests, setNewRequests] = useState([]); // request status: Waiting for NGO
  const [myPickups, setMyPickups] = useState([]); // donation status: Pickup Pending
  const [myAwaitingHandover, setMyAwaitingHandover] = useState([]); // donation status: Received by NGO
  const [myDistributions, setMyDistributions] = useState([]); // request status: Distribution Pending

  const [loading, setLoading] = useState(true);

  const [pickupCodeInputs, setPickupCodeInputs] = useState({});
  const [pickupErrors, setPickupErrors] = useState({});
  const [distCodeInputs, setDistCodeInputs] = useState({});
  const [distErrors, setDistErrors] = useState({});

  function refresh() {
    return Promise.all([fetchDonations(), fetchFoodRequests()]).then(([allDonations, allRequests]) => {
      const mine = (d) => d.ngoName === profile.name;

      setAvailableNearby(allDonations.filter((d) => d.status === "Available").sort(byUrgency));
      setNewRequests(
        allRequests
          .filter((r) => r.status === "Waiting for NGO")
          .map((r) => ({ ...r, _donation: allDonations.find((d) => d.id === r.donationId) }))
          .sort((a, b) => (a._donation && b._donation ? byUrgency(a._donation, b._donation) : 0))
      );
      setMyPickups(allDonations.filter((d) => mine(d) && d.status === "Pickup Pending"));
      setMyAwaitingHandover(allDonations.filter((d) => mine(d) && d.status === "Received by NGO"));
      setMyDistributions(
        allRequests.filter((r) => {
          const donation = allDonations.find((d) => d.id === r.donationId);
          return donation && mine(donation) && r.status === "Distribution Pending";
        })
      );
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    const unsubscribe = onDonationDataChanged(refresh);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.name]);

  function handleAccept(id) {
    acceptFoodRequest(id, profile).then(refresh);
  }

  function handleDecline(id) {
    declineFoodRequest(id).then(refresh);
  }

  function handleVerifyPickup(id) {
    verifyPickupOtp(id, pickupCodeInputs[id]).then((result) => {
      if (result.success) {
        setPickupErrors((prev) => ({ ...prev, [id]: null }));
        setPickupCodeInputs((prev) => ({ ...prev, [id]: "" }));
        refresh();
      } else {
        setPickupErrors((prev) => ({ ...prev, [id]: otpErrorMessage(result.reason) }));
      }
    });
  }

  function handlePrepareHandover(donationId) {
    prepareHandover(donationId).then(refresh);
  }

  function handleVerifyDistribution(id) {
    verifyDistributionOtp(id, distCodeInputs[id]).then((result) => {
      if (result.success) {
        setDistErrors((prev) => ({ ...prev, [id]: null }));
        setDistCodeInputs((prev) => ({ ...prev, [id]: "" }));
        refresh();
      } else {
        setDistErrors((prev) => ({ ...prev, [id]: otpErrorMessage(result.reason) }));
      }
    });
  }

  return (
    <DashboardLayout
      role="ngo"
      userName={profile.name}
      title="NGO dashboard"
      description="Accept receiver requests, verify handovers with OTPs, and track everything in one place."
    >
      <div className="verification-card">
        <span className="verification-card-label">Verification</span>
        <Badge status={profile.ngoStatus || "Verified"} />
        {!isVerifiedNgo && (
          <span className="verification-card-text">
            {profile.ngoStatus === "Rejected"
              ? "Your verification wasn't approved, so you can't accept requests yet."
              : "Pending admin verification — you can browse, but can't accept requests yet."}
          </span>
        )}
      </div>

      <div className="stat-row">
        <StatCard label="Completed this month" value={ngoStats.completedThisMonth} />
        <StatCard label="People fed" value={ngoStats.peopleFed.toLocaleString("en-IN")} />
        <StatCard label="Volunteers on roster" value={ngoStats.volunteersOnRoster} />
        <StatCard label="New food requests" value={newRequests.length} />
      </div>

      <div className="section-heading-row">
        <h2>New food requests</h2>
      </div>

      {!loading && newRequests.length === 0 && (
        <p>No receiver has requested food yet. Requests appear here the moment someone does.</p>
      )}

      {!loading && newRequests.length > 0 && (
        <div className="donation-list" style={{ marginBottom: 44 }}>
          {newRequests.map((r) => {
            const urgency = r._donation ? calculateFoodUrgency(r._donation.bestUsedBy) : "safe";
            const meta = URGENCY_META[urgency];
            return (
              <div className="donation-row ngo-row" key={r.id}>
                <div className="donation-row-main">
                  <div className="donation-row-title">
                    {meta.emoji} {r.donationTitle}
                  </div>
                  <div className="donation-row-meta">
                    Requested by {r.receiverName} · {r.quantityNeeded} ·{" "}
                    {r._donation ? formatTimeRemaining(r._donation.bestUsedBy) : ""}
                  </div>
                </div>
                <div className="request-actions">
                  <Button
                    variant={urgency === "critical" ? "amber" : "outline"}
                    disabled={!isVerifiedNgo}
                    title={!isVerifiedNgo ? "Your NGO must be verified before accepting requests" : undefined}
                    onClick={() => handleAccept(r.id)}
                  >
                    Accept &amp; Arrange Pickup
                  </Button>
                  <Button variant="danger" onClick={() => handleDecline(r.id)}>
                    Decline
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="section-heading-row">
        <h2>Available donations nearby</h2>
      </div>
      <p className="otp-meta" style={{ padding: "0 4px 12px" }}>
        For visibility only — food receivers request these directly; there's nothing to claim here.
      </p>

      {loading && <p>Loading donations…</p>}
      {!loading && availableNearby.length === 0 && <p>Nothing available right now.</p>}
      {!loading && availableNearby.length > 0 && (
        <div className="donation-list" style={{ marginBottom: 44 }}>
          {availableNearby.map((d) => {
            const urgency = calculateFoodUrgency(d.bestUsedBy);
            const meta = URGENCY_META[urgency];
            return (
              <Link to={`/donations/${d.id}`} className="donation-row ngo-row" key={d.id}>
                <div className="donation-row-main">
                  <div className="donation-row-title">
                    {meta.emoji} {d.title}
                  </div>
                  <div className="donation-row-meta">
                    {d.donorName} · {d.quantity} · {formatTimeRemaining(d.bestUsedBy)}
                  </div>
                </div>
                <Badge status={meta.label} />
              </Link>
            );
          })}
        </div>
      )}

      <div className="section-heading-row">
        <h2>Pickups</h2>
      </div>

      {!loading && myPickups.length === 0 && <p>No pickups in progress.</p>}

      {!loading && myPickups.length > 0 && (
        <div className="donation-list" style={{ marginBottom: 44 }}>
          {myPickups.map((d) => (
            <div key={d.id}>
              <div className="donation-row ngo-row">
                <Link to={`/donations/${d.id}`} className="donation-row-main">
                  <div className="donation-row-title">{d.title}</div>
                  <div className="donation-row-meta">{d.pickupWindow}</div>
                </Link>
                <Badge status={d.status} />
                <div className="otp-entry">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={pickupCodeInputs[d.id] || ""}
                    onChange={(e) => setPickupCodeInputs((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  />
                  <Button variant="outline" onClick={() => handleVerifyPickup(d.id)}>
                    Verify pickup
                  </Button>
                </div>
              </div>
              {pickupErrors[d.id] && <div className="otp-error">{pickupErrors[d.id]}</div>}
              <div className="otp-meta" style={{ padding: "0 4px" }}>
                Ask the donor for the 6-digit code they generated, then enter it above.
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-heading-row">
        <h2>Distributions</h2>
      </div>

      {!loading && myAwaitingHandover.length === 0 && myDistributions.length === 0 && (
        <p>Nothing waiting on distribution right now.</p>
      )}

      {!loading && myAwaitingHandover.length > 0 && (
        <div className="donation-list" style={{ marginBottom: myDistributions.length ? 20 : 44 }}>
          {myAwaitingHandover.map((d) => (
            <div key={d.id}>
              <div className="donation-row ngo-row">
                <Link to={`/donations/${d.id}`} className="donation-row-main">
                  <div className="donation-row-title">{d.title}</div>
                  <div className="donation-row-meta">Requested by {d.requestedBy}</div>
                </Link>
                <Badge status={d.status} />
                <Button variant="outline" onClick={() => handlePrepareHandover(d.id)}>
                  Ready for distribution
                </Button>
              </div>
              {d.pickupVerifiedAt && (
                <div className="verified-note">✓ Pickup Verified at {formatTime(d.pickupVerifiedAt)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && myDistributions.length > 0 && (
        <div className="donation-list">
          {myDistributions.map((r) => (
            <div key={r.id}>
              <div className="donation-row ngo-row">
                <div className="donation-row-main">
                  <div className="donation-row-title">{r.donationTitle}</div>
                  <div className="donation-row-meta">Requested by {r.receiverName}</div>
                </div>
                <Badge status={r.status} />
                <div className="otp-entry">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={distCodeInputs[r.id] || ""}
                    onChange={(e) => setDistCodeInputs((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  />
                  <Button variant="amber" onClick={() => handleVerifyDistribution(r.id)}>
                    Verify handover
                  </Button>
                </div>
              </div>
              {distErrors[r.id] && <div className="otp-error">{distErrors[r.id]}</div>}
              <div className="otp-meta" style={{ padding: "0 4px" }}>
                Ask the receiver for the 6-digit code on their dashboard, then enter it above.
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

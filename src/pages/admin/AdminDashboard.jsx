import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Card from "../../components/ui/Card.jsx";
import { getCurrentUser } from "../../services/authService.js";
import {
  fetchPendingNgoAccounts,
  approveNgoAccount,
  rejectNgoAccount,
} from "../../services/accountService.js";
import { fetchDonations } from "../../services/donationService.js";
import { onDonationDataChanged } from "../../data/mockData.js";
import { adminOverview } from "../../data/mockData.js";
import "../donor/DonorDashboard.css";
import "./AdminDashboard.css";

function formatTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// Built from real donation events rather than a static list, so
// it can never show something that didn't actually happen.
function buildRecentActivity(donations) {
  const items = [];
  donations.forEach((d) => {
    if (d.requestedAt) items.push({ id: `${d.id}-req`, time: d.requestedAt, text: `${d.requestedBy} requested "${d.title}"` });
    if (d.acceptedAt) items.push({ id: `${d.id}-acc`, time: d.acceptedAt, text: `${d.ngoName} accepted the request for "${d.title}"` });
    if (d.pickupVerifiedAt) items.push({ id: `${d.id}-pick`, time: d.pickupVerifiedAt, text: `Pickup verified for "${d.title}"` });
    if (d.distributedAt) items.push({ id: `${d.id}-dist`, time: d.distributedAt, text: `"${d.title}" was distributed` });
  });
  return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
}

export default function AdminDashboard() {
  const { profile } = getCurrentUser();
  const [pendingNgos, setPendingNgos] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    return Promise.all([fetchPendingNgoAccounts(), fetchDonations()]).then(([ngos, donations]) => {
      setPendingNgos(ngos);
      setRecentActivity(buildRecentActivity(donations));
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    const unsubscribe = onDonationDataChanged(refresh);
    return unsubscribe;
  }, []);

  function handleApprove(id) {
    approveNgoAccount(id).then(refresh);
  }

  function handleReject(id) {
    rejectNgoAccount(id).then(refresh);
  }

  return (
    <DashboardLayout
      role="admin"
      userName={profile.name}
      title="Platform overview"
      description="Verify NGOs and keep an eye on activity across FoodBridge."
    >
      <div className="stat-row">
        <StatCard label="Total users" value={adminOverview.totalUsers} />
        <StatCard label="Active donations now" value={adminOverview.activeDonationsNow} />
        <StatCard label="Meals provided" value={adminOverview.mealsProvided.toLocaleString("en-IN")} />
        <StatCard label="Pending NGO verifications" value={pendingNgos.length} />
      </div>

      <div className="admin-grid">
        <div>
          <div className="section-heading-row">
            <h2>NGO verification queue</h2>
            <span className="pending-count">{pendingNgos.length} pending</span>
          </div>

          {!loading && pendingNgos.length === 0 && (
            <p>No NGOs waiting on verification right now.</p>
          )}

          <div className="verification-list">
            {pendingNgos.map((ngo) => (
              <Card key={ngo.id} className="verification-card">
                <div>
                  <div className="verification-name">{ngo.name}</div>
                  <div className="verification-meta">
                    {ngo.ngoDetails?.address} · reg. {ngo.ngoDetails?.registrationNumber}
                  </div>
                </div>
                <div className="verification-actions">
                  <Button variant="outline" onClick={() => handleApprove(ngo.id)}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => handleReject(ngo.id)}>
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading-row">
            <h2>Recent activity</h2>
          </div>
          {!loading && recentActivity.length === 0 && <p>Nothing has happened yet.</p>}
          <ul className="activity-feed">
            {recentActivity.map((a) => (
              <li key={a.id}>
                <span className="activity-text">{a.text}</span>
                <span className="activity-time">{formatTime(a.time)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

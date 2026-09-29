import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Card from "../../components/ui/Card.jsx";
import { getCurrentUser } from "../../services/authService.js";
import { volunteerStats, volunteerAssignments } from "../../data/mockData.js";
import "../donor/DonorDashboard.css";
import "./VolunteerDashboard.css";

export default function VolunteerDashboard() {
  const { profile } = getCurrentUser();

  return (
    <DashboardLayout
      role="volunteer"
      userName={profile.name}
      title="My assignments"
      description={`Pickups assigned to you by ${profile.ngo}.`}
    >
      <div className="stat-row">
        <StatCard label="Assigned today" value={volunteerStats.assignedToday} />
        <StatCard label="Completed pickups" value={volunteerStats.completedPickups} />
        <StatCard label="Hours this month" value={volunteerStats.hoursThisMonth} />
      </div>

      <div className="section-heading-row">
        <h2>Upcoming pickups</h2>
      </div>

      {volunteerAssignments.length === 0 && (
        <p>You don't have any assignments right now.</p>
      )}

      <div className="assignment-list">
        {volunteerAssignments.map((a) => (
          <Card key={a.id} className="assignment-card">
            <div>
              <div className="assignment-title">{a.title}</div>
              <div className="assignment-meta">{a.pickupWindow}</div>
              <div className="assignment-meta">{a.address}</div>
            </div>
            <div className="assignment-actions">
              <Button variant="outline">Mark picked up</Button>
              <Button variant="ghost">View details</Button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

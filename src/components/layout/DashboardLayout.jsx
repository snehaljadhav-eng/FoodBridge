import Sidebar from "./Sidebar.jsx";
import "./DashboardLayout.css";

export default function DashboardLayout({ role, userName, title, description, children }) {
  return (
    <div className="dashboard-shell">
      <Sidebar role={role} userName={userName} />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}

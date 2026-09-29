import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../services/accountService.js";
import "./Sidebar.css";

const NAV_BY_ROLE = {
  donor: [
    { to: "/donor", label: "My donations" },
    { to: "/donor/new", label: "Create donation" },
  ],
  ngo: [{ to: "/ngo", label: "Claims & pickups" }],
  receiver: [{ to: "/receiver", label: "Available food & requests" }],
  volunteer: [{ to: "/volunteer", label: "My assignments" }],
  admin: [{ to: "/admin", label: "Platform overview" }],
};

const ROLE_LABEL = {
  donor: "Donor",
  ngo: "NGO",
  receiver: "Food Receiver",
  volunteer: "Volunteer",
  admin: "Admin",
};

export default function Sidebar({ role, userName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const items = NAV_BY_ROLE[role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/">FoodBridge</Link>
      </div>
      <div className="sidebar-role">{ROLE_LABEL[role]} account</div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={location.pathname === item.to ? "active" : ""}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-user-name">{userName}</div>
        <button type="button" className="sidebar-signout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}

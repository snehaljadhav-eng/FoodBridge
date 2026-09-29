import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { login } from "../../services/accountService.js";
import { DONATIONS_STORAGE_KEY } from "../../data/mockData.js";
import { ACCOUNTS_STORAGE_KEY } from "../../services/accountService.js";
import "./Auth.css";

const DASHBOARD_BY_ROLE = {
  donor: "/donor",
  ngo: "/ngo",
  receiver: "/receiver",
};

// Wipes this browser's saved FoodBridge data (donations, requests,
// accounts) and reloads with fresh demo data. Only ever touches
// FoodBridge's own two storage keys — nothing else on the device.
function resetDemoData() {
  localStorage.removeItem(DONATIONS_STORAGE_KEY);
  localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
  window.location.reload();
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await login(email, password);
    if (!result.success) {
      if (result.reason === "not_verified") {
        navigate(`/verify/${result.account.id}`);
        return;
      }
      setError(result.reason);
      return;
    }
    navigate(DASHBOARD_BY_ROLE[result.account.role] || "/");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          ← Back to FoodBridge
        </Link>

        <h1>Log in</h1>
        <p className="auth-subtitle">Welcome back to FoodBridge.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" variant="amber">
            Log in
          </Button>
        </form>

        <p className="auth-footer">
          New to FoodBridge? <Link to="/">Create an account</Link>
        </p>

        <div className="demo-accounts">
          Demo accounts (prototype only) — password for all: <strong>demo1234</strong>
          <div>Donor: contact@greenleafbakery.example</div>
          <div>NGO: contact@annasevatrust.example</div>
          <div>Receiver: fatima.sheikh@example.com</div>
          <div style={{ marginTop: 10 }}>
            Dashboards look out of sync or stuck?{" "}
            <button
              type="button"
              onClick={resetDemoData}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                color: "var(--forest)",
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

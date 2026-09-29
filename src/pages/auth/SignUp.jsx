import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { signUp } from "../../services/accountService.js";
import "./Auth.css";

const ROLE_META = {
  donor: { label: "Donor", tagline: "List surplus food for NGOs to collect." },
  receiver: { label: "Need Food", tagline: "Request food an NGO near you has ready to hand out." },
  ngo: { label: "NGO", tagline: "Claim donations and distribute them to receivers." },
};

const initialFields = {
  fullName: "",
  ngoName: "",
  contactPerson: "",
  address: "",
  registrationNumber: "",
  email: "",
  phone: "",
  location: "",
  password: "",
  confirmPassword: "",
};

export default function SignUp() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const meta = ROLE_META[role];

  function update(field, value) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  if (!meta) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Unknown account type</h1>
          <p>Please choose Donor, Need Food, or NGO from the homepage.</p>
          <Link to="/" className="auth-back">
            ← Back to FoodBridge
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nameField = role === "ngo" ? fields.ngoName : fields.fullName;
    if (!nameField || !fields.email || !fields.phone || !fields.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (role === "ngo" && (!fields.contactPerson || !fields.address || !fields.registrationNumber)) {
      setError("Please fill in all required fields.");
      return;
    }
    if (role === "receiver" && !fields.location) {
      setError("Please let us know your area so we can show nearby food.");
      return;
    }
    if (fields.password !== fields.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await signUp(role, fields);
    setSubmitting(false);
    if (!result.success) {
      setError(result.reason);
      return;
    }
    navigate(`/verify/${result.account.id}`);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          ← Back to FoodBridge
        </Link>

        <div className="auth-role-tabs">
          {Object.entries(ROLE_META).map(([key, m]) => (
            <Link
              key={key}
              to={`/signup/${key}`}
              className={`auth-role-tab ${key === role ? "active" : ""}`}
            >
              {m.label}
            </Link>
          ))}
        </div>

        <h1>Create your {meta.label} account</h1>
        <p className="auth-subtitle">{meta.tagline}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {role === "ngo" ? (
            <>
              <div className="field">
                <label htmlFor="ngoName">NGO name</label>
                <input
                  id="ngoName"
                  type="text"
                  value={fields.ngoName}
                  onChange={(e) => update("ngoName", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="contactPerson">Contact person</label>
                <input
                  id="contactPerson"
                  type="text"
                  value={fields.contactPerson}
                  onChange={(e) => update("contactPerson", e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                value={fields.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={fields.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                value={fields.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </div>

          {role === "ngo" && (
            <>
              <div className="field">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  type="text"
                  value={fields.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="registrationNumber">Registration number</label>
                <input
                  id="registrationNumber"
                  type="text"
                  value={fields.registrationNumber}
                  onChange={(e) => update("registrationNumber", e.target.value)}
                />
              </div>
            </>
          )}

          {role === "receiver" && (
            <div className="field">
              <label htmlFor="location">Location / area</label>
              <input
                id="location"
                type="text"
                placeholder="e.g. Bandra East, Mumbai"
                value={fields.location}
                onChange={(e) => update("location", e.target.value)}
              />
              <span className="hint">
                Used to show food assistance available near you.
              </span>
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={fields.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                value={fields.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" variant="amber" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

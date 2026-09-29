import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import { createDonation } from "../../services/donationService.js";
import { getCurrentUser } from "../../services/authService.js";

const CATEGORIES = ["Cooked Food", "Bakery", "Produce", "Packaged", "Dairy", "Other"];

// Default "best used by" to 4 hours from now, formatted for a
// datetime-local input, so the field starts with a sensible value.
function defaultBestUsedBy() {
  const d = new Date(Date.now() + 4 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const initialForm = {
  title: "",
  category: CATEGORIES[0],
  quantity: "",
  address: "",
  pickupWindow: "",
  bestUsedBy: defaultBestUsedBy(),
  storageRequirement: "",
  notes: "",
};

export default function CreateDonation() {
  const { profile } = getCurrentUser();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.quantity || !form.address || !form.pickupWindow || !form.bestUsedBy) {
      setError("Please fill in title, quantity, address, pickup window, and best-used-by time.");
      return;
    }
    setError("");
    setSubmitting(true);
    // datetime-local has no timezone — treat it as local time.
    const bestUsedByIso = new Date(form.bestUsedBy).toISOString();
    const created = await createDonation({
      ...form,
      bestUsedBy: bestUsedByIso,
      donorName: profile.name,
      donorId: profile.id,
    });
    setSubmitting(false);
    navigate(`/donations/${created.id}`);
  }

  return (
    <DashboardLayout
      role="donor"
      userName={profile.name}
      title="Create a donation"
      description="Tell nearby NGOs what you have and when it needs to be picked up."
    >
      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        <div className="field">
          <label htmlFor="title">What are you donating?</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. 40 vegetable sandwiches"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="text"
              placeholder="e.g. 40 servings or 20 kg"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="address">Pickup address</label>
          <input
            id="address"
            type="text"
            placeholder="Street, area, city"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="pickupWindow">Pickup window</label>
            <input
              id="pickupWindow"
              type="text"
              placeholder="e.g. Today, 6:00 PM – 8:00 PM"
              value={form.pickupWindow}
              onChange={(e) => updateField("pickupWindow", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="bestUsedBy">Best used by</label>
            <input
              id="bestUsedBy"
              type="datetime-local"
              value={form.bestUsedBy}
              onChange={(e) => updateField("bestUsedBy", e.target.value)}
            />
            <span className="hint">
              Urgency shown to NGOs is calculated from this automatically.
            </span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="storageRequirement">Storage requirement (optional)</label>
          <input
            id="storageRequirement"
            type="text"
            placeholder="e.g. Keep refrigerated"
            value={form.storageRequirement}
            onChange={(e) => updateField("storageRequirement", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="notes">Notes for the volunteer (optional)</label>
          <textarea
            id="notes"
            placeholder="Packaging, parking, anything helpful"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </div>

        {error && (
          <p style={{ color: "var(--clay)", fontSize: "0.88rem" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <Button type="submit" variant="amber" disabled={submitting}>
            {submitting ? "Posting…" : "Post donation"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate("/donor")}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

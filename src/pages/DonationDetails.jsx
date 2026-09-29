import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Timeline from "../components/ui/Timeline.jsx";
import { fetchDonationById } from "../services/donationService.js";
import { fetchFoodRequestForDonation } from "../services/foodRequestService.js";
import "./DonationDetails.css";

export default function DonationDetails() {
  const { id } = useParams();
  const [donation, setDonation] = useState(undefined); // undefined = loading, null = not found
  const [request, setRequest] = useState(null);

  useEffect(() => {
    setDonation(undefined);
    setRequest(null);
    fetchDonationById(id).then((d) => {
      setDonation(d);
      if (d) {
        fetchFoodRequestForDonation(id).then(setRequest);
      }
    });
  }, [id]);

  if (donation === undefined) {
    return (
      <div className="container details-page">
        <p>Loading donation…</p>
      </div>
    );
  }

  if (donation === null) {
    return (
      <div className="container details-page">
        <h1>Donation not found</h1>
        <p>This listing may have been removed.</p>
        <Link to="/">Back to FoodBridge</Link>
      </div>
    );
  }

  const timelineSteps = [
    { label: "Donation Posted", timestamp: donation.createdAt },
    { label: "Requested by Receiver", timestamp: donation.requestedAt },
    { label: "NGO Accepted", timestamp: donation.acceptedAt },
    { label: "Pickup Verified", timestamp: donation.pickupVerifiedAt },
    { label: "Ready for Distribution", timestamp: donation.readyForDistributionAt },
    { label: "Distribution Verified", timestamp: request?.distributionOtp?.usedAt },
    { label: "Completed", timestamp: donation.distributedAt },
  ];

  return (
    <div className="container details-page">
      <Link to="/" className="details-back">
        ← Back to FoodBridge
      </Link>

      <div className="details-header">
        <div>
          <h1>{donation.title}</h1>
          <p className="details-donor">Donated by {donation.donorName}</p>
        </div>
        <Badge status={donation.status} />
      </div>

      <div className="details-grid">
        <Card>
          <h3>Pickup details</h3>
          <dl className="details-list">
            <div>
              <dt>Quantity</dt>
              <dd>{donation.quantity}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{donation.category}</dd>
            </div>
            <div>
              <dt>Pickup window</dt>
              <dd>{donation.pickupWindow}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{donation.address}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3>Status</h3>
          <dl className="details-list">
            <div>
              <dt>Claimed by</dt>
              <dd>{donation.ngoName || "Not claimed yet"}</dd>
            </div>
            <div>
              <dt>Volunteer</dt>
              <dd>{donation.volunteerName || "Not assigned yet"}</dd>
            </div>
          </dl>
          {donation.notes && (
            <>
              <h3 style={{ marginTop: 20 }}>Notes</h3>
              <p style={{ margin: 0 }}>{donation.notes}</p>
            </>
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <h3>Tracking</h3>
        <Timeline steps={timelineSteps} />
      </Card>

      {donation.status === "Available" && (
        <div className="details-actions">
          <Button as={Link} to="/login" variant="amber">
            Log in to request this food
          </Button>
        </div>
      )}
    </div>
  );
}

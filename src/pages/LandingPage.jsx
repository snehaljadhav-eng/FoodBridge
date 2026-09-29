import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/ui/Button.jsx";
import { donorStats } from "../data/mockData.js";
import "./LandingPage.css";

const roleOptions = [
  {
    title: "Donate Food",
    role: "Donor",
    text: "List surplus food from your restaurant, store, or event so it reaches people before it spoils.",
    to: "/donor/new",
    cta: "List a donation",
  },
  {
    title: "Need Food",
    role: "Food Receiver",
    text: "See food an NGO near you has ready to hand out, and request what your household needs.",
    to: "/receiver",
    cta: "Browse available food",
  },
  {
    title: "I'm an NGO",
    role: "NGO",
    text: "Claim nearby donations, move them through pickup, and approve requests from receivers.",
    to: "/ngo",
    cta: "Open NGO dashboard",
  },
];

const steps = [
  {
    title: "A donor lists surplus food",
    text: "A restaurant, store, or event posts what's left over, how much, and when it needs to be picked up.",
  },
  {
    title: "A verified NGO claims it",
    text: "Nearby NGOs see the listing the moment it goes up and claim what they can handle before it spoils.",
  },
  {
    title: "A volunteer collects it",
    text: "The NGO assigns a volunteer, who picks up the food and brings it back for distribution.",
  },
  {
    title: "A receiver requests it",
    text: "People who need food see what's ready at the NGO and request it — the NGO approves and hands it over.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <Navbar />

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>
              Good food shouldn't go to waste while people go hungry.
            </h1>
            <p className="hero-sub">
              FoodBridge connects restaurants, stores, and event organizers
              with surplus food to verified NGOs and volunteers who get it to
              people who need it — usually within hours.
            </p>
            <div className="hero-actions">
              <Button as={Link} to="/donor/new" variant="amber">
                List a donation
              </Button>
              <Button as={Link} to="/ngo" variant="outline">
                I run an NGO
              </Button>
            </div>
          </div>
          <div className="hero-figure" aria-hidden="true">
            <div className="hero-figure-stat">
              <span>{donorStats.mealsProvided.toLocaleString("en-IN")}</span>
              meals rescued so far
            </div>
          </div>
        </div>
      </section>

      <section className="role-select" id="role-select">
        <div className="container">
          <h2>How will you use FoodBridge?</h2>
          <div className="role-options">
            {roleOptions.map((option) => (
              <div className="role-option" key={option.role}>
                <div className="role-option-tag">{option.role}</div>
                <h3>{option.title}</h3>
                <p>{option.text}</p>
                <Button as={Link} to={option.to} variant="outline">
                  {option.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="signup-cta" id="signup">
        <div className="container">
          <h2>Create an account as</h2>
          <div className="signup-options">
            <Button as={Link} to="/signup/donor" variant="outline">
              Donor
            </Button>
            <Button as={Link} to="/signup/receiver" variant="outline">
              Need Food
            </Button>
            <Button as={Link} to="/signup/ngo" variant="outline">
              NGO
            </Button>
          </div>
          <p className="signup-login-line">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <h2>How a donation moves</h2>
          <div className="steps">
            {steps.map((step, i) => (
              <div className="step" key={step.title}>
                <div className="step-index">{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="audience" id="for-ngos">
        <div className="container">
          <h2>For NGOs</h2>
          <p>
            See every nearby donation as soon as it's posted, claim what fits
            your capacity, and move it through pickup and distribution.
            Every NGO on FoodBridge is verified before they can claim food.
          </p>
          <Button as={Link} to="/ngo" variant="outline">
            Open NGO dashboard
          </Button>
          <p className="audience-footnote" id="for-volunteers">
            Pickups and deliveries are handled by volunteers working under
            each NGO — assigned from the NGO's own roster once a donation is
            claimed.{" "}
            <Link to="/volunteer">See the volunteer dashboard</Link>
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container footer-inner">
          <span>FoodBridge</span>
          <span>Built to move surplus food before it spoils.</span>
        </div>
      </footer>
    </div>
  );
}

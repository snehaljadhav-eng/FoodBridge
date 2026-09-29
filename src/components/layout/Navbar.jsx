import { Link } from "react-router-dom";
import Button from "../ui/Button.jsx";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          FoodBridge
        </Link>
        <nav className="navbar-links">
          <a href="#how-it-works">How it works</a>
          <a href="#for-ngos">For NGOs</a>
          <a href="#for-volunteers">For volunteers</a>
        </nav>
        <div className="navbar-actions">
          <Button as={Link} to="/login" variant="ghost">
            Log in
          </Button>
          <Button as="a" href="#signup" variant="amber">
            Create Account
          </Button>
        </div>
      </div>
    </header>
  );
}

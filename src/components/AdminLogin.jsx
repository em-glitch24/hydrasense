// src/components/AdminLogin.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "../styles/AdminLogin.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      // Login user
      const result = await login(email, password);
      const user = result.user;

      // Check if user is admin
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.isAdmin === true) {
          console.log("✅ Admin login successful!");
          navigate("/admin/dashboard");
        } else {
          // Not an admin, log them out
          setError("Access denied. Admin credentials required.");
          await auth.signOut();
        }
      } else {
        setError("User data not found.");
        await auth.signOut();
      }
    } catch (error) {
      console.error("❌ Admin login failed:", error);
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Failed to log in: " + error.message);
      }
    }
    setLoading(false);
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-badge-wrapper">
          <span className="admin-badge">Admin Access</span>
        </div>

        <div className="admin-icon">🔐</div>

        <h2 className="admin-title">Admin Portal</h2>
        <p className="admin-subtitle">Secure administrator login</p>

        {error && (
          <div className="admin-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-group">
            <label className="admin-label">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              placeholder="admin@hydrasense.com"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              placeholder="Enter admin password"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className={`admin-button ${loading ? "disabled" : ""}`}
          >
            {loading ? "Authenticating..." : "🔓 Access Admin Portal"}
          </button>
        </form>

        <div className="admin-footer">
          Regular user?{" "}
          <Link to="/login" className="admin-link">
            User Login
          </Link>
        </div>
      </div>
    </div>
  );
}

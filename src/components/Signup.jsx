// src/components/Signup.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    deviceId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (!formData.deviceId.trim()) {
      return setError("Device ID is required");
    }

    try {
      setError("");
      setLoading(true);
      await signup(
        formData.email,
        formData.password,
        formData.name,
        formData.deviceId
      );
      console.log("✅ Signup successful! Redirecting...");
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Signup failed:", error);
      if (error.code === "auth/email-already-in-use") {
        setError("Email already in use");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError("Failed to create account: " + error.message);
      }
    }
    setLoading(false);
  }

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      padding: "40px",
      maxWidth: "450px",
      width: "100%",
    },
    title: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "10px",
      textAlign: "center",
    },
    subtitle: {
      color: "#666",
      textAlign: "center",
      marginBottom: "30px",
    },
    error: {
      backgroundColor: "#fee",
      color: "#c33",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "15px",
      fontSize: "14px",
    },
    formGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      marginBottom: "6px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#333",
    },
    input: {
      width: "100%",
      padding: "12px",
      border: "2px solid #e0e0e0",
      borderRadius: "6px",
      fontSize: "14px",
      transition: "border-color 0.3s",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#667eea",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "background-color 0.3s",
      marginTop: "10px",
    },
    buttonDisabled: {
      backgroundColor: "#ccc",
      cursor: "not-allowed",
    },
    hint: {
      fontSize: "12px",
      color: "#888",
      marginTop: "5px",
    },
    footer: {
      textAlign: "center",
      marginTop: "20px",
      color: "#666",
    },
    link: {
      color: "#667eea",
      textDecoration: "none",
      fontWeight: "bold",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🌊 HydraSense</h2>
        <p style={styles.subtitle}>Create your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              style={styles.input}
              placeholder="John Doe"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              style={styles.input}
              placeholder="At least 6 characters"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              style={styles.input}
              placeholder="Re-enter password"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Device ID</label>
            <input
              type="text"
              required
              placeholder="e.g., ESP32_ABC123"
              value={formData.deviceId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deviceId: e.target.value.toUpperCase(),
                })
              }
              style={styles.input}
            />
            <div style={styles.hint}>
              📱 Find this on your ESP32 device screen (shown on startup)
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            style={{
              ...styles.button,
              ...(loading && styles.buttonDisabled),
            }}
            onMouseOver={(e) =>
              !loading && (e.target.style.backgroundColor = "#5568d3")
            }
            onMouseOut={(e) =>
              !loading && (e.target.style.backgroundColor = "#667eea")
            }
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

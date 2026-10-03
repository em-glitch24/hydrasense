// src/components/Login.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
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
      await login(email, password);
      console.log("✅ Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Login failed:", error);
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
      maxWidth: "400px",
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
        <p style={styles.subtitle}>Welcome back!</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
            />
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
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        <div style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

// src/components/Landing.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Landing.css";
import logo from "../assets/logo4.png";

export default function Landing() {
  const [showAuth, setShowAuth] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    deviceId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const closeAuth = () => {
    setShowAuth(null);
    setError("");
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      deviceId: "",
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(formData.email, formData.password);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

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
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: "💧",
      title: "Real-time Monitoring",
      desc: "Track your hydration levels instantly with IoT-powered sensors",
    },
    {
      icon: "📊",
      title: "Smart Analytics",
      desc: "Visualize your hydration patterns and get personalized insights",
    },
    {
      icon: "🔔",
      title: "Custom Reminders",
      desc: "Set intelligent reminders to maintain optimal hydration",
    },
    {
      icon: "📱",
      title: "Cross-Platform",
      desc: "Access your data anywhere with cloud synchronization",
    },
    {
      icon: "🎯",
      title: "Goal Tracking",
      desc: "Set and achieve your daily hydration goals effortlessly",
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      desc: "Your health data is encrypted and protected",
    },
  ];

  const processSteps = [
    {
      number: 1,
      icon: "🤚",
      title: "Place Finger",
      desc: "Put your finger on the GSR sensor on the ESP32 device",
    },
    {
      number: 2,
      icon: "🌡️",
      title: "Measure & Analyze",
      desc: "System reads skin conductance and temperature, then analyzes hydration level",
    },
    {
      number: 3,
      icon: "📡",
      title: "Send to Cloud",
      desc: "Data is transmitted via WiFi to Firebase in real-time",
    },
    {
      number: 4,
      icon: "📱",
      title: "View Results",
      desc: "Check your hydration status on the web app dashboard anytime",
    },
  ];

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src={logo} alt="HydraSense Logo" className="logo-image" />
        </div>
        <div className="auth-buttons">
          <button className="login-btn" onClick={() => setShowAuth("login")}>
            Login
          </button>
          <button className="signup-btn" onClick={() => setShowAuth("signup")}>
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Stay Hydrated,
            <br />
            Stay Healthy
          </h1>
          <p className="hero-subtitle">
            HydraSense helps you maintain optimal hydration levels throughout
            your day. Track your water intake, get personalized reminders, and
            achieve your wellness goals with intelligent hydration monitoring.
          </p>
          <button className="cta-button" onClick={() => setShowAuth("signup")}>
            Track my Hydration
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <h2 className="section-title">How It Works?</h2>

          {/* Process Steps */}
          <div className="process-steps">
            {processSteps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{step.number}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* System Architecture Flow */}
          <div className="system-flow">
            <div className="flow-item">
              <div className="flow-icon">🎛️</div>
              <div className="flow-label">ESP32 Device</div>
              <p className="step-desc">GSR + DHT22 Sensors</p>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-item">
              <div className="flow-icon">📡</div>
              <div className="flow-label">WiFi Connection</div>
              <p className="step-desc">Real-time Data Transfer</p>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-item">
              <div className="flow-icon">☁️</div>
              <div className="flow-label">Firebase Cloud</div>
              <p className="step-desc">Secure Data Storage</p>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-item">
              <div className="flow-icon">💻</div>
              <div className="flow-label">Web Dashboard</div>
              <p className="step-desc">Monitor & Analyze</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="section-title">Why Choose HydraSense?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Overlay - Login */}
      {showAuth === "login" && (
        <div className="auth-overlay" onClick={closeAuth}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeAuth}>
              ×
            </button>

            <h2 className="auth-title">Welcome Back!</h2>
            <p className="auth-subtitle">Log in to your account</p>

            {error && <div className="error-message">{error}</div>}

            <div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                onClick={handleLogin}
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Logging In..." : "Log In"}
              </button>
            </div>

            <div className="auth-footer">
              Don't have an account?{" "}
              <span className="auth-link" onClick={() => setShowAuth("signup")}>
                Sign Up
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Auth Overlay - Signup */}
      {showAuth === "signup" && (
        <div className="auth-overlay" onClick={closeAuth}>
          <div className="auth-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeAuth}>
              ×
            </button>

            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join HydraSense today</p>

            {error && <div className="error-message">{error}</div>}

            <div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Device ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.deviceId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deviceId: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., ESP32_ABC123"
                  required
                />
                <div className="input-hint">
                  📱 Find this on your ESP32 device screen
                </div>
              </div>

              <button
                onClick={handleSignup}
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </div>

            <div className="auth-footer">
              Already have an account?{" "}
              <span className="auth-link" onClick={() => setShowAuth("login")}>
                Log In
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

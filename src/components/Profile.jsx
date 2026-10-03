// src/components/Profile.jsx - Enhanced Version
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import "../styles/Profile.css";

export default function Profile() {
  const {
    userData,
    currentUser,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
  } = useAuth();

  // State for editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [editedEmergency, setEditedEmergency] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Statistics
  const [stats, setStats] = useState({
    totalMeasurements: 0,
    totalWaterIntake: 0,
    lastMeasurement: null,
    deviceStatus: { connected: false, lastSeen: null },
  });

  // Fetch user statistics
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchStats = async () => {
      try {
        // Get total measurements
        const measurementsRef = collection(
          db,
          "users",
          currentUser.uid,
          "measurements"
        );
        const measurementsSnapshot = await getDocs(measurementsRef);
        const totalMeasurements = measurementsSnapshot.size;

        // Get last measurement
        const lastMeasurementQuery = query(
          measurementsRef,
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const lastMeasurementSnapshot = await getDocs(lastMeasurementQuery);
        const lastMeasurement = lastMeasurementSnapshot.empty
          ? null
          : lastMeasurementSnapshot.docs[0].data();

        // Get total water intake (today)
        const waterIntakesRef = collection(
          db,
          "users",
          currentUser.uid,
          "waterIntakes"
        );
        const waterSnapshot = await getDocs(waterIntakesRef);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime() / 1000;

        const totalWaterIntake = waterSnapshot.docs
          .filter((doc) => doc.data().timestamp >= todayTimestamp)
          .reduce((total, doc) => total + (doc.data().amount || 0), 0);

        setStats({
          totalMeasurements,
          totalWaterIntake,
          lastMeasurement,
          deviceStatus: stats.deviceStatus,
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    fetchStats();
  }, [currentUser]);

  // Device status listener (same as Dashboard)
  useEffect(() => {
    if (!userData?.deviceId) return;

    const deviceRef = doc(db, "devices", userData.deviceId);

    // Simple fetch instead of listener to avoid permission issues
    const checkDevice = async () => {
      try {
        const deviceDoc = await getDoc(deviceRef);
        if (deviceDoc.exists()) {
          const data = deviceDoc.data();
          setStats((prev) => ({
            ...prev,
            deviceStatus: {
              connected: data.wifiConnected || false,
              lastSeen: data.lastSeen,
            },
          }));
        }
      } catch (error) {
        console.log("Device status check skipped");
      }
    };

    checkDevice();
  }, [userData]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // Handle Name Update
  const handleNameEdit = () => {
    setEditedName(userData?.name || "");
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      showMessage("error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({ name: editedName });
      setIsEditingName(false);
      showMessage("success", "Name updated successfully!");
    } catch (error) {
      showMessage("error", error.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Update
  const handleEmailEdit = () => {
    setEditedEmail(currentUser?.email || "");
    setEmailPassword("");
    setIsEditingEmail(true);
  };

  const handleEmailSave = async () => {
    if (!editedEmail.trim()) {
      showMessage("error", "Email cannot be empty");
      return;
    }
    if (!emailPassword) {
      showMessage("error", "Please enter your current password");
      return;
    }

    setLoading(true);
    try {
      await updateUserEmail(editedEmail, emailPassword);
      setIsEditingEmail(false);
      setEmailPassword("");
      showMessage("success", "Email updated successfully!");
    } catch (error) {
      showMessage("error", error.message || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  // Handle Emergency Contact Update
  const handleEmergencyEdit = () => {
    setEditedEmergency(userData?.emergencyContact || "");
    setIsEditingEmergency(true);
  };

  const handleEmergencySave = async () => {
    const phoneRegex = /^[\d\s\-\+\(\)]*$/;
    if (editedEmergency && !phoneRegex.test(editedEmergency)) {
      showMessage("error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({ emergencyContact: editedEmergency });
      setIsEditingEmergency(false);
      showMessage("success", "Emergency contact updated!");
    } catch (error) {
      showMessage(
        "error",
        error.message || "Failed to update emergency contact"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("error", "Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("success", "Password changed successfully!");
    } catch (error) {
      showMessage("error", error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Never";
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!userData) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p className="profile-loading">Loading profile...</p>
        </div>
      </div>
    );
  }

  const pinDigits = userData.devicePin ? userData.devicePin.split("") : [];

  return (
    <div className="profile-container">
      {/* Message Bar */}
      {message.text && (
        <div className={`profile-message-bar ${message.type}`}>
          <span>{message.type === "success" ? "✓" : "⚠"}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Grid */}
      <div className="profile-grid">
        {/* Account Information Card */}
        <div className="profile-card">
          <h2 className="profile-section-title">
            <span>👤</span>
            <span>Account Information</span>
          </h2>

          {/* Name */}
          <div className="profile-info-row">
            <span className="profile-label">
              <span>📝</span>
              Name
            </span>
            {isEditingName ? (
              <div className="profile-editable-value">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="profile-input"
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && handleNameSave()}
                />
                <button
                  onClick={handleNameSave}
                  className="profile-save-btn"
                  disabled={loading}
                >
                  {loading ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="profile-cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-editable-value">
                <span className="profile-value">{userData.name || "N/A"}</span>
                <button onClick={handleNameEdit} className="profile-edit-btn">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="profile-info-row">
            <span className="profile-label">
              <span>✉️</span>
              Email
            </span>
            {isEditingEmail ? (
              <div style={{ flex: 1 }}>
                <div className="profile-editable-value">
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="profile-input"
                    disabled={loading}
                    placeholder="New email"
                  />
                </div>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="profile-input"
                  style={{ marginTop: "10px" }}
                  disabled={loading}
                  placeholder="Current password (required)"
                />
                <div
                  style={{ display: "flex", gap: "12px", marginTop: "12px" }}
                >
                  <button
                    onClick={handleEmailSave}
                    className="profile-save-btn"
                    disabled={loading}
                  >
                    {loading ? "..." : "Update Email"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingEmail(false);
                      setEmailPassword("");
                    }}
                    className="profile-cancel-btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-editable-value">
                <span className="profile-value">
                  {currentUser?.email || "N/A"}
                </span>
                <button onClick={handleEmailEdit} className="profile-edit-btn">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="profile-info-row">
            <span className="profile-label">
              <span>🚨</span>
              Emergency Contact
            </span>
            {isEditingEmergency ? (
              <div className="profile-editable-value">
                <input
                  type="tel"
                  value={editedEmergency}
                  onChange={(e) => setEditedEmergency(e.target.value)}
                  className="profile-input"
                  disabled={loading}
                  placeholder="+1 234 567 8900"
                  onKeyPress={(e) => e.key === "Enter" && handleEmergencySave()}
                />
                <button
                  onClick={handleEmergencySave}
                  className="profile-save-btn"
                  disabled={loading}
                >
                  {loading ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditingEmergency(false)}
                  className="profile-cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-editable-value">
                <span className="profile-value">
                  {userData.emergencyContact || "Not set"}
                </span>
                <button
                  onClick={handleEmergencyEdit}
                  className="profile-edit-btn"
                >
                  {userData.emergencyContact ? "Edit" : "Add"}
                </button>
              </div>
            )}
          </div>

          {/* Password Change */}
          <div className="profile-info-row">
            <span className="profile-label">
              <span>🔒</span>
              Password
            </span>
            <div className="profile-editable-value">
              <span className="profile-value">••••••••</span>
              <button
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="profile-edit-btn"
              >
                {isChangingPassword ? "Cancel" : "Change"}
              </button>
            </div>
          </div>

          {/* Password Change Form */}
          {isChangingPassword && (
            <div className="profile-password-section">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="profile-password-input"
                placeholder="Current Password"
                disabled={loading}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="profile-password-input"
                placeholder="New Password (min 6 characters)"
                disabled={loading}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="profile-password-input"
                placeholder="Confirm New Password"
                disabled={loading}
              />
              <div className="profile-password-buttons">
                <button
                  onClick={handlePasswordChange}
                  className="profile-save-btn"
                  disabled={loading}
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="profile-cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Device & Statistics Card */}
        <div className="profile-card">
          <h2 className="profile-section-title">
            <span>📊</span>
            <span>Statistics & Device</span>
          </h2>

          <div className="profile-info-row">
            <span className="profile-label">
              <span>🆔</span>
              Device ID
            </span>
            <span className="profile-value">
              {userData.deviceId || "Not paired"}
            </span>
          </div>

          <div className="profile-info-row">
            <span className="profile-label">
              <span>📡</span>
              Status
            </span>
            <div className="profile-editable-value">
              <span
                className={`profile-status-badge ${
                  stats.deviceStatus.connected ? "online" : "offline"
                }`}
              >
                <span className="profile-status-dot"></span>
                {stats.deviceStatus.connected ? "Connected" : "Offline"}
              </span>
            </div>
          </div>

          <div className="profile-device-info">
            <div className="profile-device-stat">
              <div className="profile-device-stat-label">
                <span>💧</span>
                Total Measurements
              </div>
              <div className="profile-device-stat-value">
                {stats.totalMeasurements}
              </div>
            </div>

            <div className="profile-device-stat">
              <div className="profile-device-stat-label">
                <span>🚰</span>
                Today's Water
              </div>
              <div className="profile-device-stat-value">
                {stats.totalWaterIntake} ml
              </div>
            </div>

            <div
              className="profile-device-stat"
              style={{ gridColumn: "1 / -1" }}
            >
              <div className="profile-device-stat-label">
                <span>⏰</span>
                Last Measurement
              </div>
              <div
                className="profile-device-stat-value"
                style={{ fontSize: "14px" }}
              >
                {stats.lastMeasurement
                  ? formatTime(stats.lastMeasurement.timestamp)
                  : "No measurements yet"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Login PIN - Full Width */}
      <div className="profile-pin-card">
        <h2 className="profile-pin-title">
          <span>🔐</span>
          <span>Device Login PIN</span>
        </h2>

        <div className="profile-warning-box">
          <span>⚠️</span>
          <strong>Important:</strong> Use this PIN to login on your ESP32 device
          before taking measurements
        </div>

        {userData.devicePin ? (
          <>
            <div className="profile-pin-display">
              {pinDigits.map((digit, index) => (
                <div key={index} className="profile-pin-digit">
                  {digit}
                </div>
              ))}
            </div>

            <button
              onClick={() => copyToClipboard(userData.devicePin)}
              className={`profile-copy-btn ${copied ? "copied" : ""}`}
            >
              <span>{copied ? "✓" : "📋"}</span>
              <span>{copied ? "Copied!" : "Copy PIN"}</span>
            </button>

            <div className="profile-instructions">
              <div className="profile-instruction-title">
                <span>📱</span>
                How to login on your device:
              </div>
              <ol className="profile-instruction-list">
                <li>
                  Press <strong>Button 3</strong> to open Menu
                </li>
                <li>
                  Navigate to <strong>"USER LOGIN"</strong>
                </li>
                <li>
                  Enter your PIN: <strong>{userData.devicePin}</strong>
                </li>
                <li>Use Button 1 to change digits (0-9)</li>
                <li>Use Button 2 to move to next digit</li>
                <li>
                  Press <strong>Button 4</strong> to submit and login
                </li>
                <li>✅ Now you can take measurements!</li>
              </ol>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p style={{ color: "#ef4444", fontSize: "14px" }}>
              ⚠️ No PIN found. Please contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

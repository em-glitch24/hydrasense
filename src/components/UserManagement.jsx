// src/components/UserManagement.jsx
import { useState } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import "../styles/UserManagement.css";

export default function UserManagement({ users, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userMeasurements, setUserMeasurements] = useState([]);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.deviceId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleUserStatus = async (userId, currentStatus) => {
    // currentStatus is the DISABLED field (true = disabled, false = enabled)
    const confirmMessage = currentStatus
      ? "Enable this user account? They will be able to log in again."
      : "Are you sure you want to disable this user? They will not be able to log in.";

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        disabled: !currentStatus,
        updatedAt: new Date().toISOString(),
      });

      console.log(
        `✅ User ${!currentStatus ? "disabled" : "enabled"} successfully`
      );
      alert(
        `User has been ${!currentStatus ? "disabled" : "enabled"} successfully!`
      );
      onRefresh();
    } catch (error) {
      console.error("❌ Error updating user status:", error);
      alert("Failed to update user status. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const viewUserDetails = async (user) => {
    try {
      setSelectedUser(user);
      setShowModal(true);

      // Fetch user's measurements
      const measurementsSnapshot = await getDocs(
        collection(db, "users", user.id, "measurements")
      );
      const measurements = measurementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by timestamp descending
      measurements.sort((a, b) => b.timestamp - a.timestamp);

      setUserMeasurements(measurements);
    } catch (error) {
      console.error("❌ Error fetching user details:", error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserMeasurements([]);
  };

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2 className="section-title">User Management</h2>
        <div className="user-stats">
          <span className="user-count">
            Total Users: <strong>{users.length}</strong>
          </span>
          <span className="user-count disabled">
            Disabled: <strong>{users.filter((u) => u.disabled).length}</strong>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search by name, email, or device ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Device ID</th>
              <th>Device PIN</th>
              <th>Emergency Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={user.disabled ? "disabled-row" : ""}>
                <td>
                  <div className="user-name-cell">
                    <span className="user-avatar">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                    <span>{user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <code className="code-badge">{user.deviceId}</code>
                </td>
                <td>
                  <code className="code-badge pin">{user.devicePin}</code>
                </td>
                <td>{user.emergencyContact || "—"}</td>
                <td>
                  <span
                    className={`status-badge ${
                      user.disabled ? "disabled" : "active"
                    }`}
                  >
                    {user.disabled ? "🔴 Disabled" : "🟢 Active"}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-view"
                      onClick={() => viewUserDetails(user)}
                      title="View Details"
                    >
                      👁️ View
                    </button>
                    <button
                      className={`btn-toggle ${
                        user.disabled ? "enable" : "disable"
                      }`}
                      onClick={() =>
                        handleToggleUserStatus(user.id, user.disabled)
                      }
                      disabled={actionLoading}
                      title={user.disabled ? "Enable User" : "Disable User"}
                    >
                      {user.disabled ? "✅ Enable" : "🚫 Disable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>No users found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* User Info Section */}
              <div className="user-info-section">
                <h4>Personal Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{selectedUser.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{selectedUser.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Device ID:</span>
                    <span className="info-value">
                      <code>{selectedUser.deviceId}</code>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Device PIN:</span>
                    <span className="info-value">
                      <code>{selectedUser.devicePin}</code>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Emergency Contact:</span>
                    <span className="info-value">
                      {selectedUser.emergencyContact || "Not set"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created At:</span>
                    <span className="info-value">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value">
                      <span
                        className={`status-badge ${
                          selectedUser.disabled ? "disabled" : "active"
                        }`}
                      >
                        {selectedUser.disabled ? "🔴 Disabled" : "🟢 Active"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Measurements Section */}
              <div className="measurements-section">
                <h4>Recent Measurements ({userMeasurements.length} total)</h4>
                {userMeasurements.length > 0 ? (
                  <div className="measurements-list">
                    {userMeasurements.slice(0, 10).map((measurement) => (
                      <div key={measurement.id} className="measurement-item">
                        <div className="measurement-status">
                          <span
                            className={`status-dot ${measurement.status
                              ?.toLowerCase()
                              .replace(" ", "-")}`}
                          ></span>
                          <span className="measurement-status-text">
                            {measurement.status}
                          </span>
                        </div>
                        <div className="measurement-details">
                          <span className="measurement-gsr">
                            GSR: {measurement.gsrValue} μS
                          </span>
                          <span className="measurement-time">
                            {new Date(
                              measurement.timestamp * 1000
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No measurements recorded yet</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-close" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

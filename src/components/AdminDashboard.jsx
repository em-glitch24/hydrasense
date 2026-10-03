// src/components/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import AdminAnalytics from "./AdminAnalytics";
import UserManagement from "./UserManagement";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import "../styles/AdminDashboard.css";
import logo from "../assets/logo4.png";

export default function AdminDashboard() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [allMeasurements, setAllMeasurements] = useState([]);
  const [allAdvancedMeasurements, setAllAdvancedMeasurements] = useState([]);
  const [allWaterIntakes, setAllWaterIntakes] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDevices: 0,
    totalMeasurements: 0,
    onlineDevices: 0,
  });

  // Check if user is admin
  useEffect(() => {
    if (!currentUser) {
      navigate("/admin/login");
      return;
    }

    const checkAdmin = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists() || userDoc.data().isAdmin !== true) {
          console.log("❌ Unauthorized access attempt");
          navigate("/admin/login");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate("/admin/login");
      }
    };

    checkAdmin();
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);

      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const devicesSnapshot = await getDocs(collection(db, "devices"));
      const devicesData = devicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let allUserMeasurements = [];
      let allUserAdvancedMeasurements = [];
      let allUserWaterIntakes = [];
      let totalMeasurements = 0;

      for (const user of usersData) {
        const measurementsSnapshot = await getDocs(
          collection(db, "users", user.id, "measurements"),
        );
        totalMeasurements += measurementsSnapshot.size;
        const userMeasurements = measurementsSnapshot.docs.map((doc) => ({
          id: doc.id,
          userId: user.id,
          ...doc.data(),
        }));
        allUserMeasurements = [...allUserMeasurements, ...userMeasurements];

        const advancedMeasurementsSnapshot = await getDocs(
          collection(db, "users", user.id, "advancedMeasurements"),
        );
        const userAdvancedMeasurements = advancedMeasurementsSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            userId: user.id,
            ...doc.data(),
          }),
        );
        allUserAdvancedMeasurements = [
          ...allUserAdvancedMeasurements,
          ...userAdvancedMeasurements,
        ];

        const waterIntakesSnapshot = await getDocs(
          collection(db, "users", user.id, "waterIntakes"),
        );
        const userWaterIntakes = waterIntakesSnapshot.docs.map((doc) => ({
          id: doc.id,
          userId: user.id,
          ...doc.data(),
        }));
        allUserWaterIntakes = [...allUserWaterIntakes, ...userWaterIntakes];
      }

      setAllMeasurements(allUserMeasurements);
      setAllAdvancedMeasurements(allUserAdvancedMeasurements);
      setAllWaterIntakes(allUserWaterIntakes);

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const onlineDevices = devicesData.filter(
        (device) => device.lastSeen > fiveMinutesAgo && device.wifiConnected,
      ).length;

      setUsers(usersData);
      setDevices(devicesData);
      setStats({
        totalUsers: usersData.length,
        activeDevices: devicesData.length,
        totalMeasurements,
        onlineDevices,
      });

      console.log("✅ Admin data loaded:", {
        users: usersData.length,
        devices: devicesData.length,
        measurements: totalMeasurements,
        advancedMeasurements: allUserAdvancedMeasurements.length,
        waterIntakes: allUserWaterIntakes.length,
      });
    } catch (error) {
      console.error("❌ Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        {/* LEFT: Logo */}
        <div className="admin-header-left">
          <img src={logo} alt="HydraSense Logo" className="admin-logo" />
        </div>

        {/* CENTER: Title */}
        <div className="admin-header-center">
          <span className="admin-user-badge">👤 Admin Portal</span>
        </div>

        {/* RIGHT: Logout */}
        <button className="admin-logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <button
          className={`admin-nav-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span>📊</span>
          <span>Overview</span>
        </button>
        <button
          className={`admin-nav-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <span>👥</span>
          <span>User Management</span>
        </button>
        <button
          className={`admin-nav-btn ${activeTab === "devices" ? "active" : ""}`}
          onClick={() => setActiveTab("devices")}
        >
          <span>📱</span>
          <span>Devices</span>
        </button>
        <button
          className={`admin-nav-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <span>📈</span>
          <span>Analytics</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="admin-content">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="admin-overview">
            <h2 className="section-title">System Overview</h2>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card users">
                <div className="stat-icon">
                  <span>👥</span>
                </div>
                <div className="stat-info">
                  <p className="stat-label">Total Users</p>
                  <p className="stat-value">{stats.totalUsers}</p>
                  <p className="stat-subtitle">Registered accounts</p>
                </div>
              </div>

              <div className="stat-card devices">
                <div className="stat-icon">
                  <span>📱</span>
                </div>
                <div className="stat-info">
                  <p className="stat-label">Active Devices</p>
                  <p className="stat-value">{stats.activeDevices}</p>
                  <p className="stat-subtitle">Paired IoT devices</p>
                </div>
              </div>

              <div className="stat-card measurements">
                <div className="stat-icon">
                  <span>📊</span>
                </div>
                <div className="stat-info">
                  <p className="stat-label">Total Measurements</p>
                  <p className="stat-value">{stats.totalMeasurements}</p>
                  <p className="stat-subtitle">Hydration readings</p>
                </div>
              </div>

              <div className="stat-card online">
                <div className="stat-icon">
                  <span>🟢</span>
                </div>
                <div className="stat-info">
                  <p className="stat-label">Online Devices</p>
                  <p className="stat-value">{stats.onlineDevices}</p>
                  <p className="stat-subtitle">Currently connected</p>
                </div>
              </div>
            </div>

            {/* Recent Users Table */}
            <div className="recent-section">
              <h3 className="subsection-title">Recent Users</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Device ID</th>
                      <th>Device PIN</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <code className="code-badge">{user.deviceId}</code>
                        </td>
                        <td>
                          <code className="code-badge pin">
                            {user.devicePin}
                          </code>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <AdminAnalytics
            users={users}
            advancedMeasurements={allAdvancedMeasurements}
            waterIntakes={allWaterIntakes}
          />
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <UserManagement users={users} onRefresh={fetchAllData} />
        )}

        {/* Devices Tab */}
        {activeTab === "devices" && (
          <div className="devices-section">
            <h2 className="section-title">Device Management</h2>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>WiFi Connected</th>
                    <th>Last Seen</th>
                    <th>Paired At</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => {
                    const user = users.find((u) => u.id === device.userId);
                    const isOnline =
                      device.lastSeen > Date.now() - 5 * 60 * 1000 &&
                      device.wifiConnected;

                    return (
                      <tr key={device.id}>
                        <td>
                          <code className="code-badge device-id">
                            {device.deviceId}
                          </code>
                        </td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar small">
                              {user?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <span>{user?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${isOnline ? "online" : "offline"}`}
                          >
                            {isOnline ? "🟢 Online" : "⚫ Offline"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${device.wifiConnected ? "connected" : "disconnected"}`}
                          >
                            {device.wifiConnected
                              ? "✅ Connected"
                              : "❌ Disconnected"}
                          </span>
                        </td>
                        <td className="timestamp-cell">
                          {device.lastSeen
                            ? new Date(device.lastSeen).toLocaleString()
                            : "Never"}
                        </td>
                        <td className="timestamp-cell">
                          {device.pairedAt
                            ? new Date(device.pairedAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

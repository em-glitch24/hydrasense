// src/components/Dashboard.jsx - Updated: daily intake reverted to glasses (purple), daily streak replaced by Average GSR (metric card)
// Solid backgrounds kept for requested cards:
// - GSR: solid light-blue
// - Temperature: warm tone (opaque)
// - Device: green (opaque)
// - Intake (daily glasses): purple (opaque)
// Average GSR is shown in the metrics grid (replacing daily streak)

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { logWaterIntake, updateDailyGoal } from "../firebase/waterIntake";
import {
  collection,
  query,
  limit,
  onSnapshot,
  doc,
  orderBy,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import Navigation from "./Navigation";
import History from "./History";
import Reminders from "./Reminders";
import AdvancedAnalytics from "./AdvancedAnalytics";
import Profile from "./Profile";
import AdvancedMeasurement from "./AdvancedMeasurement";
import "../styles/Dashboard.css";
import logo from "../assets/logo4.png";
import { triggerRemoteMeasurement } from "../firebase/deviceControl";

function EnhancedIntakeCard({
  todaysIntake,
  todaysGlasses,
  glassesTarget,
  glassesPercentage,
  GLASS_ML,
  radius,
  circumference,
  glassesStrokeOffset,
  onLogWater,
  onUpdateGoal,
  currentGoalMl,
}) {
  const [waterAmount, setWaterAmount] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [newGoalGlasses, setNewGoalGlasses] = useState(glassesTarget);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  const handleLogWater = async (e) => {
    e.preventDefault();

    const amount = parseInt(waterAmount);
    if (!amount || amount <= 0 || amount > 5000) {
      alert("Please enter a valid amount (1-5000 ml)");
      return;
    }

    setIsLogging(true);
    try {
      await onLogWater(amount);
      setWaterAmount("");
      alert(`✅ Logged ${amount}ml successfully!`);
    } catch (error) {
      alert("❌ Failed to log water intake. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  const handleUpdateGoal = async () => {
    const newGoalMl = newGoalGlasses * GLASS_ML;

    if (newGoalGlasses < 1 || newGoalGlasses > 20) {
      alert("Please set a goal between 1-20 glasses");
      return;
    }

    setIsUpdatingGoal(true);
    try {
      await onUpdateGoal(newGoalMl);
      setShowGoalEdit(false);
      alert(
        `✅ Daily goal updated to ${newGoalGlasses} glasses (${newGoalMl}ml)!`,
      );
    } catch (error) {
      alert("❌ Failed to update goal. Please try again.");
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  return (
    <div className="intake-card">
      <div className="intake-decoration-1"></div>
      <div className="intake-decoration-2"></div>
      <div className="intake-content">
        {/* Header */}
        <div className="intake-header">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
            <path d="M7 10v6a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-6" />
          </svg>
          <span className="intake-header-label">Daily Water Intake</span>
        </div>

        {/* Current Progress */}
        <div className="intake-values">
          <div className="intake-current">
            <span className="intake-number">{todaysGlasses}</span>
            <span className="intake-unit">glasses</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p className="intake-target">
              Target: {glassesTarget} glasses ({glassesTarget * GLASS_ML}ml)
            </p>
            <button
              onClick={() => setShowGoalEdit(!showGoalEdit)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                opacity: 0.7,
                transition: "opacity 0.2s",
                color: "rgb(255, 255, 255)",
                marginTop: "2px",
                fontSize: "15px",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
              title="Edit daily goal"
            >
              <span>Edit goal 📝</span>
            </button>
          </div>
        </div>

        {/* Goal Edit Section */}
        {showGoalEdit && (
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "12px",
              marginTop: "12px",
              backdropFilter: "blur(10px)",
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                marginBottom: "8px",
                opacity: 0.9,
              }}
            >
              Set Daily Goal (glasses)
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                min="1"
                max="20"
                value={newGoalGlasses}
                onChange={(e) =>
                  setNewGoalGlasses(parseInt(e.target.value) || 1)
                }
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "0.875rem",
                }}
              />
              <button
                onClick={handleUpdateGoal}
                disabled={isUpdatingGoal}
                style={{
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "0.875rem",
                  cursor: isUpdatingGoal ? "not-allowed" : "pointer",
                  opacity: isUpdatingGoal ? 0.6 : 1,
                  fontWeight: "500",
                }}
              >
                {isUpdatingGoal ? "..." : "Save"}
              </button>
              <button
                onClick={() => setShowGoalEdit(false)}
                style={{
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", marginTop: "6px", opacity: 0.7 }}>
              = {newGoalGlasses * GLASS_ML}ml per day
            </p>
          </div>
        )}

        {/* Circular Progress */}
        <div className="intake-circular-progress">
          <svg className="intake-circular-svg">
            <circle cx="64" cy="64" r={radius} className="intake-circular-bg" />
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="intake-circular-fill"
              strokeDasharray={circumference}
              strokeDashoffset={glassesStrokeOffset}
            />
          </svg>
          <div className="intake-circular-text">
            <span>{glassesPercentage}%</span>
          </div>
        </div>

        {/* Water Logging Form */}
        <form onSubmit={handleLogWater} style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginTop: "16px",
            }}
          >
            <button
              type="submit"
              disabled={isLogging || !waterAmount}
              className="intake-button"
              style={{
                padding: "12px 24px",
                width: "100%",
                opacity: isLogging || !waterAmount ? 0.6 : 1,
                cursor: isLogging || !waterAmount ? "not-allowed" : "pointer",
              }}
            >
              {isLogging ? (
                <span>Logging...</span>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Log Water</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Add Input */}
        <div
          style={{
            marginTop: "12px",
          }}
        >
          <input
            type="number"
            placeholder="Quick add (e.g., 200, 250, 500)"
            value={waterAmount}
            onChange={(e) => setWaterAmount(e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "rgba(255, 255, 255, 0.47)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.875rem",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.45)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.56)";
            }}
          />
        </div>

        <p
          style={{
            fontSize: "0.75rem",
            textAlign: "center",
            opacity: 0.7,
            marginTop: "10px",
            marginBottom: "-18px",
          }}
        >
          💡 Tip: Click to quickly enter any amount
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState([]);
  const [latestMeasurement, setLatestMeasurement] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState({
    connected: false,
    lastSeen: null,
    pin: null,
    deviceId: null,
  });
  const [userDailyGoal, setUserDailyGoal] = useState(2500);
  const [reminders, setReminders] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [waterIntakes, setWaterIntakes] = useState([]);
  const [combinedHistory, setCombinedHistory] = useState([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [triggerError, setTriggerError] = useState(null);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedMeasurements, setAdvancedMeasurements] = useState([]);
  const [displayMode, setDisplayMode] = useState("standard"); // "standard" or "advanced"
  const [latestAdvancedMeasurement, setLatestAdvancedMeasurement] =
    useState(null);

  // Real-time listener for measurements
  useEffect(() => {
    if (!currentUser?.uid) return;

    const measurementsRef = collection(
      db,
      "users",
      currentUser.uid,
      "measurements",
    );
    const q = query(measurementsRef, orderBy("timestamp", "desc"), limit(2));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        console.log("📊 Standard measurements loaded:", data.length);

        setMeasurements(data);
        if (data.length > 0) {
          setLatestMeasurement(data[0]); // Only the most recent one
          console.log("✅ Latest standard measurement:", {
            gsrValue: data[0].gsrValue,
            status: data[0].status,
            temperature: data[0].temperature,
            timestamp: data[0].timestamp,
          });
        } else {
          setLatestMeasurement(null);
        }
      },
      (error) => {
        console.error("Error fetching measurements:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const waterIntakesRef = collection(
      db,
      "users",
      currentUser.uid,
      "waterIntakes",
    );
    // ✅ REMOVED limit(50) to fetch ALL water intakes from both device and web
    const q = query(waterIntakesRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // ✅ Normalize data: handle both device entries (no source field) and web entries (source: "web")
        const data = snapshot.docs.map((d) => {
          const docData = d.data();

          return {
            id: d.id,
            type: "water_intake",
            amount: docData.amount || 0,
            timestamp: docData.timestamp || 0,
            // ✅ If source doesn't exist (device entries), mark as "device"
            source: docData.source || "device",
            // Include deviceId and userName if they exist (from device entries)
            ...(docData.deviceId && { deviceId: docData.deviceId }),
            ...(docData.userName && { userName: docData.userName }),
          };
        });

        // Enhanced logging
        const webEntries = data.filter((w) => w.source === "web");
        const deviceEntries = data.filter((w) => w.source === "device");

        console.log("========================================");
        console.log("💧 WATER INTAKES LOADED");
        console.log("========================================");
        console.log("   Total: " + data.length);
        console.log("   From Web: " + webEntries.length);
        console.log("   From Device: " + deviceEntries.length);
        console.log("========================================");

        // Log sample entries for debugging
        if (data.length > 0) {
          console.log("📋 First 3 entries:");
          data.slice(0, 3).forEach((entry, idx) => {
            const timeStr = new Date(entry.timestamp * 1000).toLocaleString();
            console.log(
              `   [${idx + 1}] ${entry.amount}ml | Source: ${entry.source} | ${timeStr}`,
            );
          });
          console.log("========================================");
        }

        setWaterIntakes(data);
        console.log("✅ Water intakes loaded:", data.length);
      },
      (error) => {
        console.error("❌ Error fetching water intakes:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Device status listener
  useEffect(() => {
    if (!userData?.deviceId) return;

    const deviceRef = doc(db, "devices", userData.deviceId);

    const unsubscribe = onSnapshot(
      deviceRef,
      (d) => {
        if (d.exists()) {
          const data = d.data();
          setDeviceStatus({
            connected: data.wifiConnected || false,
            lastSeen: data.lastSeen || null,
            pin: data.pin || null,
            deviceId: userData.deviceId || null,
          });
        }
      },
      (error) => {
        console.error("Error monitoring device:", error);
      },
    );

    return () => unsubscribe();
  }, [userData]);

  // Real-time listener for advanced measurements
  useEffect(() => {
    if (!currentUser?.uid) return;

    const advancedMeasurementsRef = collection(
      db,
      "users",
      currentUser.uid,
      "advancedMeasurements",
    );
    const q = query(
      advancedMeasurementsRef,
      orderBy("timestamp", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          type: "advanced_measurement",
          ...d.data(),
        }));

        // ✅ SET LATEST ADVANCED MEASUREMENT
        if (data.length > 0) {
          setLatestAdvancedMeasurement(data[0]);
          console.log("✅ Latest advanced measurement:", data[0]);
        } else {
          setLatestAdvancedMeasurement(null);
        }

        setAdvancedMeasurements(data);
        console.log("✅ Advanced measurements loaded:", data.length);
      },
      (error) => {
        console.error("Error fetching advanced measurements:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time listener for advanced measurements
  useEffect(() => {
    if (!currentUser?.uid) return;

    const advancedMeasurementsRef = collection(
      db,
      "users",
      currentUser.uid,
      "advancedMeasurements",
    );
    const q = query(
      advancedMeasurementsRef,
      orderBy("timestamp", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          type: "advanced_measurement",
          ...d.data(),
        }));

        // ✅ SET LATEST ADVANCED MEASUREMENT
        if (data.length > 0) {
          setLatestAdvancedMeasurement(data[0]);
          console.log("✅ Latest advanced measurement:", data[0]);
        } else {
          setLatestAdvancedMeasurement(null);
        }

        setAdvancedMeasurements(data);
        console.log("✅ Advanced measurements loaded:", data.length);
      },
      (error) => {
        console.error("Error fetching advanced measurements:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time listener for reminders
  useEffect(() => {
    if (!currentUser?.uid) return;

    const remindersRef = collection(db, "users", currentUser.uid, "reminders");
    const q = query(remindersRef, orderBy("hour", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setReminders(data);
        console.log("✅ Reminders loaded:", data.length);
      },
      (error) => {
        console.error("Error fetching reminders:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Combine measurements, water intakes, and advanced measurements
    const combined = [
      ...waterIntakes.map((w) => ({ ...w, type: "water_intake" })),
      ...advancedMeasurements, // Already has type: 'advanced_measurement'
    ];

    // Sort by timestamp (newest first)
    // Sort by timestamp (newest first)
    combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    setCombinedHistory(combined);

    console.log("✅ Combined history updated (NO standard measurements):", {
      // measurements: 0, // Always 0 now - not included in history
      waterIntakes: waterIntakes.length,
      advancedMeasurements: advancedMeasurements.length,
      total: combined.length,
    });
  }, [waterIntakes, advancedMeasurements]);

  const handleLogWater = async (amount) => {
    if (!currentUser?.uid) {
      throw new Error("User not authenticated");
    }
    await logWaterIntake(currentUser.uid, amount);
    console.log(`✅ Water logged: ${amount}ml`);
  };

  const handleUpdateGoal = async (newGoalMl) => {
    if (!currentUser?.uid) {
      throw new Error("User not authenticated");
    }
    await updateDailyGoal(currentUser.uid, newGoalMl);
    setUserDailyGoal(newGoalMl);
    console.log(`✅ Goal updated: ${newGoalMl}ml`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Redirect to landing page
    } catch (error) {
      console.error("Failed to logout:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  // Delete functions
  const deleteMeasurement = async (measurementId) => {
    if (!currentUser?.uid) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this measurement?",
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const measurementRef = doc(
        db,
        "users",
        currentUser.uid,
        "measurements",
        measurementId,
      );
      await deleteDoc(measurementRef);
    } catch (error) {
      console.error("Error deleting measurement:", error);
      alert("Failed to delete measurement. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteWaterIntake = async (intakeId) => {
    if (!currentUser?.uid) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this water intake log?",
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const intakeRef = doc(
        db,
        "users",
        currentUser.uid,
        "waterIntakes",
        intakeId,
      );
      await deleteDoc(intakeRef);
    } catch (error) {
      console.error("Error deleting water intake:", error);
      alert("Failed to delete water intake. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAdvancedMeasurement = async (measurementId) => {
    if (!currentUser?.uid) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this advanced measurement?",
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const measurementRef = doc(
        db,
        "users",
        currentUser.uid,
        "advancedMeasurements",
        measurementId,
      );
      await deleteDoc(measurementRef);
      console.log("✅ Advanced measurement deleted successfully");
    } catch (error) {
      console.error("Error deleting advanced measurement:", error);
      alert("Failed to delete advanced measurement. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearAllMeasurements = async () => {
    if (!currentUser?.uid) return;

    setIsDeleting(true);

    try {
      const batch = writeBatch(db);

      const advancedMeasurementsRef = collection(
        db,
        "users",
        currentUser.uid,
        "advancedMeasurements",
      );
      const advancedSnapshot = await getDocs(advancedMeasurementsRef);
      advancedSnapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });

      // ✅ Delete all water intakes
      const waterIntakesRef = collection(
        db,
        "users",
        currentUser.uid,
        "waterIntakes",
      );
      const waterSnapshot = await getDocs(waterIntakesRef);
      waterSnapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });

      await batch.commit();

      console.log("✅ History cleared (standard measurements kept)!");
      alert(
        `History cleared!\n\n` +
          `Deleted:\n` +
          `• ${advancedSnapshot.size} advanced measurements\n` +
          `• ${waterSnapshot.size} water logs\n\n` +
          `⚡ ${measurements.length} standard measurement(s) kept for dashboard`,
      );
    } catch (error) {
      console.error("Error clearing history:", error);
      alert("Failed to clear history. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Remote measurement handler
  const handleRemoteMeasurement = async () => {
    if (!currentUser?.uid || !userData?.deviceId) {
      alert("Device not paired. Please pair your device first.");
      return;
    }

    if (!deviceStatus.connected) {
      alert(
        "Device is offline. Please ensure your device is connected to WiFi.",
      );
      return;
    }

    setIsTriggering(true);
    setTriggerError(null);
    setTriggerSuccess(false);

    try {
      await triggerRemoteMeasurement(currentUser.uid, userData.deviceId);

      // Show success feedback
      setTriggerSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setTriggerSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Remote measurement failed:", error);
      setTriggerError("Failed to trigger measurement. Please try again.");

      // Clear error after 5 seconds
      setTimeout(() => {
        setTriggerError(null);
      }, 5000);
    } finally {
      setIsTriggering(false);
    }
  };

  // Helper functions
  const GSR_MIN = 0;
  const GSR_MAX = 2400;

  function clamp(v, a = 0, b = 100) {
    if (typeof v !== "number" || Number.isNaN(v)) return a;
    return Math.max(a, Math.min(b, v));
  }

  // compute hydration percentage from GSR value (0..2400)
  function getHydrationPercentageFromGSR(gsrValue) {
    const gsr = typeof gsrValue === "number" ? gsrValue : 0;
    const ratio = (gsr - GSR_MIN) / (GSR_MAX - GSR_MIN);
    // Inverted: High GSR (dehydrated) = Low %, Low GSR (hydrated) = High %
    return clamp(Math.round((1 - ratio) * 100), 0, 100);
  }

  function getStatusClass(status) {
    if (status === "Hydrated") return "hydrated";
    if (status === "Mild Dehydrated") return "mild";
    if (status === "Dehydrated") return "dehydrated";
    return "hydrated";
  }

  const getHydrationTrend = () => {
    if (measurements.length < 3) {
      return { trend: "Insufficient Data", color: "#7fb2f9" };
    }

    // Get last 3-5 measurements (max 5)
    const recentMeasurements = measurements.slice(
      0,
      Math.min(5, measurements.length),
    );

    // Convert GSR to hydration percentages
    const percentages = recentMeasurements.map((m) =>
      getHydrationPercentageFromGSR(m.gsrValue || 0),
    );

    // Calculate average change between consecutive readings
    let totalChange = 0;
    for (let i = 0; i < percentages.length - 1; i++) {
      totalChange += percentages[i] - percentages[i + 1];
    }
    const avgChange = totalChange / (percentages.length - 1);

    // Determine trend based on average change
    if (avgChange > 5) {
      return { trend: "Increasing", color: "#10b981", icon: "↑" };
    } else if (avgChange < -5) {
      return { trend: "Decreasing", color: "#ef4444", icon: "↓" };
    } else {
      // Check for instability (high variance)
      const variance =
        percentages.reduce((sum, val, idx) => {
          if (idx === 0) return 0;
          return sum + Math.abs(percentages[idx] - percentages[idx - 1]);
        }, 0) /
        (percentages.length - 1);

      if (variance > 10) {
        return { trend: "Unstable", color: "#f59e0b", icon: "~" };
      } else {
        return { trend: "Stable", color: "#06b6d4", icon: "→" };
      }
    }
  };

  // Generate personalized advice based on hydration level and trend
  const getAdvancedAdvice = (hydrationPercent, trendData) => {
    const trend = trendData.trend;

    // Critical dehydration (0-30%)
    if (hydrationPercent < 30) {
      if (trend === "Decreasing") {
        return {
          text: "⚠️ Critical: Your hydration is dropping rapidly. Drink water immediately and consistently throughout the day.",
          priority: "critical",
        };
      } else if (trend === "Increasing") {
        return {
          text: "✓ Good progress! Continue drinking water regularly to reach optimal hydration levels.",
          priority: "warning",
        };
      } else if (trend === "Unstable") {
        return {
          text: "⚠️ Your hydration is fluctuating. Try to maintain consistent water intake throughout the day.",
          priority: "warning",
        };
      } else {
        return {
          text: "⚠️ You are dehydrated. Drink 2-3 glasses of water now and set regular reminders.",
          priority: "critical",
        };
      }
    }

    // Mild dehydration (30-60%)
    else if (hydrationPercent < 60) {
      if (trend === "Decreasing") {
        return {
          text: "⚠️ Hydration is decreasing. Drink water now to prevent further dehydration.",
          priority: "warning",
        };
      } else if (trend === "Increasing") {
        return {
          text: "✓ You're improving! Keep drinking water regularly to reach optimal levels.",
          priority: "info",
        };
      } else if (trend === "Unstable") {
        return {
          text: "Your hydration varies throughout the day. Try drinking water at consistent intervals.",
          priority: "info",
        };
      } else {
        return {
          text: "You're moderately hydrated. Aim to drink 1-2 more glasses of water.",
          priority: "info",
        };
      }
    }

    // Good hydration (60-85%)
    else if (hydrationPercent < 85) {
      if (trend === "Decreasing") {
        return {
          text: "Your hydration is dropping. Maintain your water intake to stay in the optimal range.",
          priority: "info",
        };
      } else if (trend === "Increasing") {
        return {
          text: "✓ Excellent! You're reaching optimal hydration. Maintain this pattern.",
          priority: "success",
        };
      } else if (trend === "Unstable") {
        return {
          text: "You're well-hydrated but levels fluctuate. Consistent intake will help stabilize.",
          priority: "info",
        };
      } else {
        return {
          text: "✓ Great job! You're well-hydrated. Keep up your current water intake routine.",
          priority: "success",
        };
      }
    }

    // Optimal hydration (85%+)
    else {
      if (trend === "Increasing") {
        return {
          text: "✓ Perfect! You're optimally hydrated. Monitor to avoid over-hydration.",
          priority: "success",
        };
      } else if (trend === "Decreasing") {
        return {
          text: "✓ Still well-hydrated, but levels are dropping. Maintain regular water intake.",
          priority: "success",
        };
      } else {
        return {
          text: "✓ Excellent! Your hydration is optimal and stable. Keep up the great work!",
          priority: "success",
        };
      }
    }
  };

  const getTimePeriodStats = () => {
    if (measurements.length === 0) {
      return { morning: 0, afternoon: 0, evening: 0 };
    }

    // Define time periods (in hours - 24-hour format)
    const MORNING_START = 5; // 5:00 AM
    const MORNING_END = 12; // 12:00 PM (noon)
    const AFTERNOON_END = 18; // 6:00 PM
    const EVENING_END = 23; // 11:00 PM

    // Filter measurements by time period
    const morningMeasurements = measurements.filter((m) => {
      const date = new Date(m.timestamp * 1000); // Convert to milliseconds
      const hour = date.getHours();
      return hour >= MORNING_START && hour < MORNING_END;
    });

    const afternoonMeasurements = measurements.filter((m) => {
      const date = new Date(m.timestamp * 1000);
      const hour = date.getHours();
      return hour >= MORNING_END && hour < AFTERNOON_END;
    });

    const eveningMeasurements = measurements.filter((m) => {
      const date = new Date(m.timestamp * 1000);
      const hour = date.getHours();
      return (
        (hour >= AFTERNOON_END && hour <= EVENING_END) || hour < MORNING_START
      );
    });

    // Calculate average hydration percentage for each period
    const calculateAvgPercentage = (periodMeasurements) => {
      if (periodMeasurements.length === 0) return 0;

      const avgGSR =
        periodMeasurements.reduce((sum, m) => sum + (m.gsrValue || 0), 0) /
        periodMeasurements.length;

      // Use your existing hydration calculation
      return getHydrationPercentageFromGSR(avgGSR);
    };

    return {
      morning: calculateAvgPercentage(morningMeasurements),
      afternoon: calculateAvgPercentage(afternoonMeasurements),
      evening: calculateAvgPercentage(eveningMeasurements),
    };
  };

  function debugTimestamp(timestamp, label = "Timestamp") {
    const date = new Date(timestamp * 1000);
    console.log(`${label}:`, {
      raw: timestamp,
      converted: date.toString(),
      hours: date.getHours(),
      minutes: date.getMinutes(),
      formatted: formatTime(timestamp),
    });
  }

  // 2. Call the function to get the stats (place this right after the function)
  const timePeriodStats = getTimePeriodStats();

  // âœ… ADD THESE THREE FUNCTIONS
  const getLatestTemperature = () => {
    if (!latestMeasurement || !latestMeasurement.temperature) {
      return null;
    }
    return latestMeasurement.temperature;
  };

  const getTemperatureStatus = (temp) => {
    if (!temp) return "Unknown";
    if (temp < 20) return "Cold";
    if (temp >= 20 && temp <= 30) return "Normal";
    if (temp > 30) return "Hot";
    return "Normal";
  };

  const getTemperatureProgress = (temp) => {
    if (!temp) return 0;
    const min = 0;
    const max = 40;
    return Math.round(((temp - min) / (max - min)) * 100);
  };

  // âœ… CALL IT
  const currentTemperature = getLatestTemperature();

  function formatTime(timestamp) {
    // Arduino sends Unix timestamp in SECONDS (in Philippines local time from RTC)
    // JavaScript Date expects MILLISECONDS
    const date = new Date(timestamp * 1000);

    // Get hours and minutes directly (RTC is already in Philippines time)
    let hours = date.getHours();
    const minutes = date.getMinutes();

    // Convert to 12-hour format
    const isPM = hours >= 12;
    hours = hours % 12;
    if (hours === 0) hours = 12;

    // Format with leading zeros
    const hoursStr = hours.toString().padStart(2, "0");
    const minutesStr = minutes.toString().padStart(2, "0");
    const period = isPM ? "PM" : "AM";

    return `${hoursStr}:${minutesStr} ${period}`;
  }

  function formatTimeReminder(hour, minute) {
    // Convert 24-hour to 12-hour format for display
    const isPM = hour >= 12;
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;

    const h = displayHour.toString().padStart(2, "0");
    const m = minute.toString().padStart(2, "0");
    const period = isPM ? "PM" : "AM";

    return `${h}:${m} ${period}`;
  }

  function formatTime24Hour(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const h = hours.toString().padStart(2, "0");
    const m = minutes.toString().padStart(2, "0");

    return `${h}:${m}`;
  }

  function getUpcomingReminders() {
    if (reminders.length === 0) return [];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const upcoming = reminders.map((reminder) => {
      const reminderTimeInMinutes = reminder.hour * 60 + reminder.minute;
      return {
        ...reminder,
        timeInMinutes: reminderTimeInMinutes,
        completed: reminderTimeInMinutes <= currentTimeInMinutes,
      };
    });

    return upcoming;
  }

  const upcomingReminders = getUpcomingReminders();

  // Calculate today's total water intake (ml)
  const getTodaysIntake = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime() / 1000;

    return waterIntakes
      .filter((intake) => intake.timestamp >= todayTimestamp)
      .reduce((total, intake) => total + (intake.amount || 0), 0);
  };

  const todaysIntake = getTodaysIntake();
  const targetIntake = userDailyGoal; // ✅ Use dynamic goal
  const intakePercentage = Math.round((todaysIntake / targetIntake) * 100);

  const GLASS_ML = 250;
  const todaysGlasses = Math.round(todaysIntake / GLASS_ML);
  const glassesTarget = Math.round(userDailyGoal / GLASS_ML); // ✅ Calculate from goal
  const glassesPercentage = Math.round((todaysGlasses / glassesTarget) * 100);

  // Circular progress values
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - intakePercentage / 100);
  const glassesStrokeOffset = circumference * (1 - glassesPercentage / 100);

  // Average Score from advanced measurements
  const averageScore =
    advancedMeasurements.length > 0
      ? Math.round(
          advancedMeasurements.reduce((s, m) => s + (m.overallScore || 0), 0) /
            advancedMeasurements.length,
        )
      : 0;

  // Calculate hydration trend from last 5 advanced measurements
  const getHydrationTrendFromAdvanced = () => {
    if (advancedMeasurements.length < 2) {
      return { trend: "Insufficient Data", color: "#94a3b8", icon: "📊" };
    }

    const recentMeasurements = advancedMeasurements.slice(
      0,
      Math.min(5, advancedMeasurements.length),
    );
    const scores = recentMeasurements.map((m) => m.overallScore || 0);

    // Calculate average change
    let totalChange = 0;
    for (let i = 0; i < scores.length - 1; i++) {
      totalChange += scores[i] - scores[i + 1];
    }
    const avgChange = totalChange / (scores.length - 1);

    // Calculate variance for stability check
    const variance =
      scores.reduce((sum, val, idx) => {
        if (idx === 0) return 0;
        return sum + Math.abs(scores[idx] - scores[idx - 1]);
      }, 0) /
      (scores.length - 1);

    // Determine trend
    if (avgChange > 15) {
      return { trend: "Rapid Increase", color: "#10b981", icon: "⬆️⬆️" };
    } else if (avgChange > 5) {
      return { trend: "Increasing", color: "#34d399", icon: "📈" };
    } else if (avgChange < -15) {
      return { trend: "Rapid Decrease", color: "#ef4444", icon: "⬇️⬇️" };
    } else if (avgChange < -5) {
      return { trend: "Decreasing", color: "#f87171", icon: "📉" };
    } else if (variance > 15) {
      return { trend: "Unstable", color: "#f59e0b", icon: "⚠️" };
    } else {
      return { trend: "Stable", color: "#06b6d4", icon: "➡️" };
    }
  };

  const hydrationTrend = getHydrationTrendFromAdvanced();

  // hydration percent from latest measurement
  const hydrationPercentFromGSR = latestMeasurement
    ? getHydrationPercentageFromGSR(latestMeasurement.gsrValue)
    : 0;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <img src={logo} alt="HydraSense Logo" className="logo-image" />
        </div>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="header-actions">
          <button
            className="profile-btn"
            onClick={() => setActiveTab("profile")}
          >
            <span>👤</span>
            <span>Profile</span>
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="content-wrapper">
          {/* Welcome Section */}
          {activeTab === "dashboard" && (
            <div className="welcome-section">
              <div className="welcome-info">
                <h1 className="welcome-title">
                  Hello, {userData?.name || "User"}
                </h1>
                <p className="welcome-subtitle">
                  Here's your hydration summary for today
                </p>
              </div>

              {/* Device status and Remote Measure button */}
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                {/* Remote Measurement Button */}
                {userData?.deviceId && (
                  <button
                    className={`remote-measure-btn ${
                      deviceStatus.connected ? "enabled" : "disabled"
                    } ${triggerSuccess ? "success" : ""}`}
                    onClick={handleRemoteMeasurement}
                    disabled={!deviceStatus.connected || isTriggering}
                    title={
                      !deviceStatus.connected
                        ? "Device is offline"
                        : "Trigger remote measurement"
                    }
                  >
                    {isTriggering ? (
                      <>
                        <svg
                          className="spinner"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span>Measuring...</span>
                      </>
                    ) : triggerSuccess ? (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Sent!</span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        <span>Measure Now</span>
                      </>
                    )}
                  </button>
                )}

                {/* Device Status Badge */}
                <div
                  className={`device-badge ${
                    deviceStatus.connected ? "online" : "offline"
                  }`}
                >
                  <span className="status-dot" />
                  <span>
                    {deviceStatus.connected
                      ? "Device Connected"
                      : "Device Offline"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error message display */}
          {triggerError && activeTab === "dashboard" && (
            <div className="trigger-error-message">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{triggerError}</span>
            </div>
          )}

          {/* Dashboard Page */}
          {activeTab === "dashboard" && (
            <>
              {latestMeasurement ? (
                <>
                  {/* Hero Grid - Main Status Cards */}
                  <div className="grid-hero">
                    {/* Hydration Card */}
                    <div className="hydration-card">
                      <div className="hydration-header">
                        <div>
                          <div className="hydration-icon-wrapper">
                            <div className="hydration-icon">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                              </svg>
                            </div>
                            <span className="hydration-label">
                              Latest Reading
                            </span>
                          </div>
                          <div className="hydration-time">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>
                              Real-time •{" "}
                              {formatTime(latestMeasurement.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* ✅ TWO BUTTONS: Toggle + New Measurement */}
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          {/* Button 1: Toggle Display Mode */}
                          <button
                            className="action-btn"
                            onClick={() =>
                              setDisplayMode(
                                displayMode === "standard"
                                  ? "advanced"
                                  : "standard",
                              )
                            }
                            title={`Switch to ${displayMode === "standard" ? "advanced" : "standard"} view`}
                            style={{
                              background:
                                displayMode === "advanced"
                                  ? "linear-gradient(135deg, #c766ea, #764ba2)"
                                  : "linear-gradient(135deg, #7d00f2, #6904d5)",
                              boxShadow:
                                displayMode === "advanced"
                                  ? "0 6px 18px rgba(136, 0, 255, 0.45)"
                                  : "0 6px 18px rgba(103, 16, 185, 0.45)",
                            }}
                          >
                            {displayMode === "standard" ? (
                              <>
                                <span>🚀 Advanced</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span>Standard</span>
                              </>
                            )}
                          </button>

                          {/* Button 2: New Advanced Measurement */}
                          <button
                            className="action-btn"
                            onClick={() => setShowAdvancedModal(true)}
                            title="Take new advanced measurement"
                            disabled={!latestMeasurement}
                            style={{
                              background: latestMeasurement
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #9ca3af, #6b7280)",
                              boxShadow: latestMeasurement
                                ? "0 6px 18px rgba(16, 185, 129, 0.45)"
                                : "none",
                              opacity: latestMeasurement ? 1 : 0.6,
                            }}
                          >
                            <span>✚ New Measure</span>
                          </button>
                        </div>
                      </div>

                      {/* Conditional Rendering: Standard vs Advanced */}
                      {displayMode === "standard" ? (
                        // STANDARD MODE
                        <>
                          <div className="hydration-status">
                            <h2 className="hydration-title">
                              {latestMeasurement.status}
                            </h2>
                            <p className="hydration-message">
                              {latestMeasurement.status === "Hydrated"
                                ? "Your hydration levels are optimal. Keep it up!"
                                : latestMeasurement.status === "Mild Dehydrated"
                                  ? "Consider drinking more water soon."
                                  : "Please drink water immediately."}
                            </p>
                          </div>

                          <div className="hydration-progress-section">
                            <div className="hydration-progress-bar">
                              <div
                                className="hydration-progress-fill"
                                style={{ width: `${hydrationPercentFromGSR}%` }}
                              ></div>
                            </div>
                            <div className="hydration-progress-labels">
                              <span className="label-start">Dehydrated</span>
                              <span className="label-current">
                                {hydrationPercentFromGSR}%
                              </span>
                              <span className="label-end">Hydrated</span>
                            </div>
                          </div>

                          <div className="hydration-stats">
                            <div>
                              <p className="hydration-stat-label">⛅ Morning</p>
                              <p className="hydration-stat-value">
                                {timePeriodStats.morning}%
                              </p>
                            </div>
                            <div>
                              <p className="hydration-stat-label">
                                ☀️ Afternoon
                              </p>
                              <p className="hydration-stat-value">
                                {timePeriodStats.afternoon}%
                              </p>
                            </div>
                            <div>
                              <p className="hydration-stat-label">🌃 Evening</p>
                              <p className="hydration-stat-value">
                                {timePeriodStats.evening}%
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        // ADVANCED MODE
                        <>
                          {latestAdvancedMeasurement ? (
                            <div className="advanced-mode-wrapper">
                              {/* Main Score Display */}
                              <div className="advanced-score-card">
                                <div className="advanced-score-grid">
                                  {/* Overall Score */}
                                  <div className="advanced-score-item">
                                    <p className="advanced-score-label">
                                      Overall Score
                                    </p>
                                    <div className="advanced-score-value">
                                      {latestAdvancedMeasurement.overallScore}
                                    </div>
                                    <p className="advanced-score-sublabel">
                                      / 100 points
                                    </p>
                                  </div>

                                  {/* Divider */}
                                  <div className="advanced-score-divider" />

                                  {/* Hydration Rating */}
                                  <div className="advanced-score-item">
                                    <p className="advanced-score-label">
                                      Rating
                                    </p>
                                    <div className="advanced-rating-circle">
                                      {(() => {
                                        const match =
                                          latestAdvancedMeasurement.hydrationRating.match(
                                            /^(\d+)/,
                                          );
                                        return match ? match[1] : "?";
                                      })()}
                                    </div>
                                    <p className="advanced-rating-text">
                                      {(() => {
                                        const match =
                                          latestAdvancedMeasurement.hydrationRating.match(
                                            /^\d+\s*-\s*(.+)$/,
                                          );
                                        return match
                                          ? match[1]
                                          : latestAdvancedMeasurement.hydrationRating;
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Detailed Metrics Grid */}
                              <div className="advanced-metrics-grid">
                                {/* GSR Reading */}
                                <div className="advanced-metric-box">
                                  <div className="advanced-metric-header">
                                    <span className="advanced-metric-icon">
                                      📊
                                    </span>
                                    <span className="advanced-metric-title">
                                      GSR Level
                                    </span>
                                  </div>
                                  <div className="advanced-metric-value">
                                    {latestAdvancedMeasurement.gsrValue}
                                    <span className="advanced-metric-unit">
                                      Ω
                                    </span>
                                  </div>
                                </div>

                                {/* BMI */}
                                <div className="advanced-metric-box">
                                  <div className="advanced-metric-header">
                                    <span className="advanced-metric-icon">
                                      🧮
                                    </span>
                                    <span className="advanced-metric-title">
                                      BMI
                                    </span>
                                  </div>
                                  <div className="advanced-metric-value">
                                    {latestAdvancedMeasurement.bmi?.toFixed(
                                      1,
                                    ) || "N/A"}
                                    <span className="advanced-metric-badge">
                                      {(() => {
                                        const bmi =
                                          latestAdvancedMeasurement.bmi;
                                        if (!bmi) return "N/A";
                                        if (bmi < 18.5) return "Underweight";
                                        if (bmi < 25) return "Normal";
                                        if (bmi < 30) return "Overweight";
                                        return "Obese";
                                      })()}
                                    </span>
                                  </div>
                                  <div className="advanced-metric-sublabel">
                                    {latestAdvancedMeasurement.weight}kg •{" "}
                                    {latestAdvancedMeasurement.height}cm
                                  </div>
                                </div>
                              </div>

                              {/* Recommendation Banner */}
                              <div className="advanced-recommendation">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <div>
                                  <div className="advanced-recommendation-title">
                                    Personalized Recommendation
                                  </div>
                                  <div className="advanced-recommendation-text">
                                    {(() => {
                                      const score =
                                        latestAdvancedMeasurement.overallScore;
                                      if (score >= 80)
                                        return "Excellent hydration! Maintain your current water intake routine.";
                                      if (score >= 60)
                                        return "Good hydration levels. Keep up your water intake throughout the day.";
                                      if (score >= 40)
                                        return "Your hydration could improve. Try drinking 1-2 more glasses of water.";
                                      return "Low hydration detected. Drink water now and set regular reminders.";
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // No advanced measurement yet
                            <div className="advanced-mode-empty">
                              <div className="advanced-empty-icon">🔬</div>
                              <h3 className="advanced-empty-title">
                                No Advanced Measurement Yet
                              </h3>
                              <p className="advanced-empty-text">
                                Click "New Measure" above to create your first
                                comprehensive hydration assessment
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Intake Card (Daily intake in glasses) */}
                    <EnhancedIntakeCard
                      todaysIntake={todaysIntake}
                      todaysGlasses={todaysGlasses}
                      glassesTarget={glassesTarget}
                      glassesPercentage={glassesPercentage}
                      GLASS_ML={GLASS_ML}
                      radius={radius}
                      circumference={circumference}
                      glassesStrokeOffset={glassesStrokeOffset}
                      onLogWater={handleLogWater}
                      onUpdateGoal={handleUpdateGoal}
                      currentGoalMl={userDailyGoal}
                    />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid-metrics">
                    {/* Hydration Trend (was Hydration Level) */}
                    <div className="metric-card gsr-card">
                      <div className="metric-header">
                        <div className="metric-icon gradient-cyan">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </div>
                        <span
                          className="metric-status"
                          style={{
                            background: "rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.95)",
                          }}
                        >
                          Last 5 Readings
                        </span>
                      </div>

                      <div className="metric-info">
                        <p className="metric-label">Hydration Trend</p>
                        <div className="metric-value-container">
                          <span
                            className="metric-value"
                            style={{
                              color: "rgba(255,255,255,0.9)",
                              fontSize: "1.5rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span style={{ fontSize: "1.8rem" }}>
                              {hydrationTrend.icon}
                            </span>
                            {hydrationTrend.trend}
                          </span>
                        </div>
                        <p
                          className="metric-sublabel"
                          style={{
                            fontSize: "0.75rem",
                            opacity: 0.7,
                            color: "white",
                            marginTop: "17px",
                          }}
                        >
                          Based on {Math.min(5, advancedMeasurements.length)}{" "}
                          recent measurements
                        </p>
                      </div>

                      <div className="metric-progress-bar">
                        <div
                          className="metric-progress-fill gradient-cyan"
                          style={{
                            width: "100%",
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="metric-card temp-card">
                      <div className="metric-header">
                        <div className="metric-icon gradient-orange">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                          </svg>
                        </div>
                        <span
                          className="metric-status"
                          style={{
                            background: "rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.95)",
                          }}
                        >
                          {currentTemperature
                            ? getTemperatureStatus(currentTemperature)
                            : "N/A"}
                        </span>
                      </div>

                      <div className="metric-info">
                        <p className="metric-label">Temperature</p>
                        <div className="metric-value-container ">
                          <span
                            className="metric-value"
                            style={{ color: "rgb(100, 37, 0)" }}
                          >
                            {currentTemperature !== null
                              ? currentTemperature.toFixed(1)
                              : "--"}
                          </span>
                          <span
                            className="metric-unit"
                            style={{
                              color: "rgb(100, 37, 0)",
                              fontWeight: "bold",
                            }}
                          >
                            °C
                          </span>
                        </div>
                        <p
                          className="metric-sublabel"
                          style={{
                            fontSize: "0.75rem",
                            opacity: 0.7,
                            color: "white",
                            marginTop: "7px",
                          }}
                        >
                          Weather Temperature
                        </p>
                      </div>

                      <div className="metric-progress-bar">
                        <div
                          className="metric-progress-fill gradient-orange"
                          style={{
                            width: `${
                              currentTemperature
                                ? getTemperatureProgress(currentTemperature)
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Device Info (replaces Water Quality) */}
                    <div className="metric-card device-card">
                      <div className="metric-header">
                        <div className="metric-icon gradient-emerald">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 2a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2z" />
                          </svg>
                        </div>
                        <span
                          className="metric-status"
                          style={{
                            background: "rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.95)",
                          }}
                        >
                          Device
                        </span>
                      </div>

                      <div className="metric-info">
                        <p className="metric-label">Device Info</p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            color: "white",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                            }}
                          >
                            <span
                              style={{ color: "#ffffff", fontSize: "0.9rem" }}
                            >
                              Device ID
                            </span>
                            <span style={{ fontWeight: 700 }}>
                              {deviceStatus.deviceId ||
                                userData?.deviceId ||
                                "â€”"}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                            }}
                          >
                            <span
                              style={{ color: "#ffffff", fontSize: "0.9rem" }}
                            >
                              Device PIN
                            </span>
                            <span style={{ fontWeight: 700 }}>
                              {deviceStatus.devicePin ||
                                userData?.devicePin ||
                                "â€”"}
                            </span>
                          </div>
                          <p
                            className="metric-sublabel"
                            style={{
                              fontSize: "0.75rem",
                              opacity: 0.7,
                              color: "white",
                            }}
                          >
                            Device pin and ID
                          </p>
                        </div>
                      </div>

                      <div className="metric-progress-bar" aria-hidden="true">
                        <div
                          className="metric-progress-fill gradient-emerald"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                    </div>

                    {/* Average Score (was Average GSR) */}
                    <div className="metric-card avg-gsr">
                      <div className="metric-header">
                        <div className="metric-icon gradient-purple">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 2l3 7h7l-5.5 4 2 7L12 17l-6.5 3 2-7L2 9h7z" />
                          </svg>
                        </div>
                        <span
                          className="metric-status"
                          style={{
                            background: "rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.95)",
                          }}
                        >
                          Overall Performance
                        </span>
                      </div>

                      <div className="metric-info">
                        <p
                          className="metric-label"
                          style={{ color: "rgba(255,255,255,0.9)" }}
                        >
                          Average Score
                        </p>
                        <div className="metric-value-container">
                          <span
                            className="metric-value"
                            style={{ color: "white" }}
                          >
                            {averageScore}
                          </span>
                          <span
                            className="metric-unit"
                            style={{ color: "rgba(255,255,255,0.9)" }}
                          >
                            /100
                          </span>
                        </div>
                        <p
                          className="metric-sublabel"
                          style={{
                            fontSize: "0.75rem",
                            opacity: 0.7,
                            color: "rgba(255,255,255,0.8)",
                            marginTop: "6px",
                          }}
                        >
                          From {advancedMeasurements.length} advanced
                          measurements
                        </p>
                      </div>

                      <div
                        className="metric-progress-bar"
                        aria-hidden="true"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                      >
                        <div
                          className="metric-progress-fill gradient-purple"
                          style={{
                            width: `${averageScore}%`,
                            height: "100%",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Grid */}
                  <div className="grid-secondary">
                    {/* Recent Intake Card */}
                    <div className="recent-intake-card">
                      <div className="recent-header">
                        <div>
                          <h3 className="recent-title">Recent Water Intake</h3>
                          <p className="recent-subtitle">
                            Your latest hydration entries
                          </p>
                        </div>
                        <div className="recent-total">
                          <p className="recent-total-label">Today's Total</p>
                          <p className="recent-total-value">{todaysIntake}ml</p>
                        </div>
                      </div>

                      <div className="intake-list">
                        {waterIntakes.slice(0, 6).map((entry) => {
                          const isToday =
                            new Date(entry.timestamp * 1000).toDateString() ===
                            new Date().toDateString();

                          return (
                            <div
                              key={entry.id}
                              className={
                                isToday ? "intake-entry today" : "intake-entry"
                              }
                            >
                              <div
                                className={
                                  isToday
                                    ? "intake-entry-icon today"
                                    : "intake-entry-icon"
                                }
                              >
                                💧
                              </div>

                              <div className="intake-entry-details">
                                <div className="intake-entry-row">
                                  <p
                                    className={
                                      isToday
                                        ? "intake-entry-type today"
                                        : "intake-entry-type"
                                    }
                                  >
                                    Water
                                  </p>
                                  <p
                                    className={
                                      isToday
                                        ? "intake-entry-amount today"
                                        : "intake-entry-amount"
                                    }
                                  >
                                    {entry.amount}ml
                                  </p>
                                </div>
                                <div className="intake-entry-time">
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>{formatTime(entry.timestamp)}</span>
                                </div>
                              </div>

                              <div
                                className={
                                  isToday
                                    ? "intake-entry-dot today"
                                    : "intake-entry-dot"
                                }
                              ></div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="intake-stats">
                        <div className="intake-stat">
                          <p className="intake-stat-label">Entries Today</p>
                          <p className="intake-stat-value">
                            {
                              waterIntakes.filter(
                                (entry) =>
                                  new Date(
                                    entry.timestamp * 1000,
                                  ).toDateString() ===
                                  new Date().toDateString(),
                              ).length
                            }
                          </p>
                        </div>
                        <div className="intake-stat">
                          <p className="intake-stat-label">Avg Per Entry</p>
                          <p className="intake-stat-value">
                            {waterIntakes.length > 0
                              ? Math.round(
                                  todaysIntake /
                                    waterIntakes.filter(
                                      (entry) =>
                                        new Date(
                                          entry.timestamp * 1000,
                                        ).toDateString() ===
                                        new Date().toDateString(),
                                    ).length,
                                )
                              : 0}
                            ml
                          </p>
                        </div>
                        <div className="intake-stat">
                          <div className="intake-stat-header">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                              <polyline points="17 6 23 6 23 12" />
                            </svg>
                            <p className="intake-stat-label">vs Yesterday</p>
                          </div>
                          <p className="intake-stat-value trend">+15%</p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Card */}
                    <div className="schedule-card">
                      <div className="schedule-header">
                        <div className="schedule-icon">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="schedule-title">Schedule</h3>
                          <p className="schedule-subtitle">Today's reminders</p>
                        </div>
                      </div>

                      <div className="schedule-list">
                        {upcomingReminders.length > 0 ? (
                          upcomingReminders.map((reminder) => (
                            <div
                              key={reminder.id}
                              className={
                                reminder.completed
                                  ? "reminder-item completed"
                                  : "reminder-item"
                              }
                            >
                              <div
                                className={
                                  reminder.completed
                                    ? "reminder-check completed"
                                    : "reminder-check"
                                }
                              >
                                {reminder.completed ? (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                )}
                              </div>
                              <div className="reminder-content">
                                <p
                                  className={
                                    reminder.completed
                                      ? "reminder-label completed"
                                      : "reminder-label"
                                  }
                                >
                                  {reminder.label || "Hydration reminder"}
                                </p>
                                <p
                                  className={
                                    reminder.completed
                                      ? "reminder-time completed"
                                      : "reminder-time"
                                  }
                                >
                                  {formatTimeReminder(
                                    reminder.hour,
                                    reminder.minute,
                                  )}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-reminders">
                            <p>No reminders set</p>
                          </div>
                        )}
                      </div>

                      <button
                        className="schedule-button"
                        onClick={() => setActiveTab("reminders")}
                      >
                        Customize Schedule
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state-container">
                  <div className="empty-state">
                    <div className="empty-icon">ðŸ’§</div>
                    <h3 className="empty-title">
                      Ready to track your hydration?
                    </h3>
                    <p className="empty-text">
                      {userData?.deviceId
                        ? "Press the measure button on your device to get started"
                        : "Pair your device to begin tracking"}
                    </p>
                    <p className="empty-text" style={{ marginTop: "15px" }}>
                      Your first reading will appear here
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Other Pages */}
          {activeTab === "history" && (
            <History
              waterIntakes={waterIntakes}
              advancedMeasurements={advancedMeasurements} // ✅ ADD THIS
              combinedHistory={combinedHistory}
              onDeleteWaterIntake={deleteWaterIntake}
              onDeleteAdvancedMeasurement={deleteAdvancedMeasurement}
              onClearAll={clearAllMeasurements}
              isDeleting={isDeleting}
            />
          )}

          {activeTab === "analytics" && (
            <AdvancedAnalytics advancedMeasurements={advancedMeasurements} />
          )}

          {activeTab === "reminders" && <Reminders />}

          {activeTab === "profile" && <Profile />}
        </div>

        {/* Advanced Measurement Modal */}
        {showAdvancedModal && latestMeasurement && (
          <AdvancedMeasurement
            latestGSR={latestMeasurement.gsrValue}
            onClose={() => setShowAdvancedModal(false)}
            onSuccess={(data) => {
              console.log("✅ Advanced measurement saved:", data);
              setShowAdvancedModal(false);
              // ✅ AUTO-SWITCH to advanced display mode
              setDisplayMode("advanced");
            }}
          />
        )}
      </main>
    </div>
  );
}

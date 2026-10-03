// History.jsx - UPDATED: Removed standard measurements completely

import { useState, useMemo } from "react";
import "../styles/History.css";

export default function History({
  // ❌ REMOVED: measurements = [],
  waterIntakes = [],
  advancedMeasurements = [],
  combinedHistory = [],
  // ❌ REMOVED: onDeleteMeasurement,
  onDeleteWaterIntake,
  onDeleteAdvancedMeasurement,
  onClearAll,
  isDeleting,
}) {
  // 🔥 KEY CHANGE: displayData no longer includes standard measurements
  const displayData =
    combinedHistory.length > 0 ? combinedHistory : advancedMeasurements;

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [selectedAdvanced, setSelectedAdvanced] = useState(null);

  console.log("📊 History Debug:", {
    displayDataLength: displayData.length,
    waterIntakesLength: waterIntakes.length,
    advancedMeasurementsLength: advancedMeasurements.length,
    combinedHistoryLength: combinedHistory.length,
    filterType,
    note: "Standard measurements are NOT included in history",
  });

  // Calculate total water intake
  const totalWaterData = useMemo(() => {
    const totalMl = waterIntakes.reduce((sum, w) => sum + (w.amount || 0), 0);
    const glasses = totalMl / 200;

    return {
      totalMl,
      glasses: glasses.toFixed(1),
      glassesText:
        glasses >= 2
          ? `${glasses.toFixed(1)} glasses`
          : glasses >= 1
            ? `${glasses.toFixed(1)} glass`
            : glasses >= 0.5
              ? `${glasses.toFixed(1)} glass`
              : "0 glasses",
    };
  }, [waterIntakes]);

  // 🔥 UPDATED: Calculate insights WITHOUT standard measurements
  const insights = useMemo(() => {
    if (displayData.length === 0) {
      return {
        status: "No Data",
        message: "Complete advanced measurements to see insights!",
        color: "#64748b",
        icon: "📊",
      };
    }

    // 🔥 KEY CHANGE: Only check advanced measurements
    const measurementData = displayData.filter(
      (d) => d.type === "advanced_measurement",
    );

    if (measurementData.length === 0) {
      return {
        status: "Water Logged Only",
        message: `You've logged ${totalWaterData.glassesText} of water. Complete advanced measurements for hydration tracking.`,
        color: "#3b82f6",
        icon: "💧",
      };
    }

    const recentMeasurements = measurementData.slice(0, 5);

    const dehydratedCount = recentMeasurements.filter(
      (m) =>
        m.hydrationRating?.includes("Dehydrated") ||
        m.hydrationRating?.includes("1 -") ||
        m.hydrationRating?.includes("2 -"),
    ).length;

    const mildDehydratedCount = recentMeasurements.filter(
      (m) =>
        m.hydrationRating?.includes("3 -") ||
        m.hydrationRating?.includes("Slightly Hydrated"),
    ).length;

    const hydratedCount = recentMeasurements.filter(
      (m) =>
        m.hydrationRating?.includes("4 -") ||
        m.hydrationRating?.includes("5 -") ||
        m.hydrationRating?.includes("Hydrated"),
    ).length;

    const now = Date.now() / 1000;
    const last24Hours = waterIntakes.filter((w) => now - w.timestamp < 86400);
    const totalWater24h = last24Hours.reduce(
      (sum, w) => sum + (w.amount || 0),
      0,
    );
    const glassesNeeded = Math.max(1, Math.ceil((2000 - totalWater24h) / 200));

    if (dehydratedCount >= 3) {
      return {
        status: "⚠️ Needs Attention",
        message: `You've been dehydrated frequently. Drink ${glassesNeeded} more ${
          glassesNeeded > 1 ? "glasses" : "glass"
        } of water today!`,
        color: "#ef4444",
        icon: "🚨",
      };
    } else if (mildDehydratedCount >= 3 || dehydratedCount >= 1) {
      return {
        status: "⚡ Could Be Better",
        message:
          "Your hydration is inconsistent. Try drinking water every 2 hours.",
        color: "#fb923c",
        icon: "⚡",
      };
    } else if (hydratedCount >= 3) {
      return {
        status: "✅ Doing Great",
        message: `Excellent hydration! You've consumed ${totalWaterData.glassesText}. Keep it up!`,
        color: "#4ade80",
        icon: "🎉",
      };
    } else {
      return {
        status: "📈 Building Habits",
        message: "Complete more assessments to track your hydration patterns!",
        color: "#3b82f6",
        icon: "💪",
      };
    }
  }, [displayData, totalWaterData, waterIntakes]);

  function getStatusColor(status) {
    // 🔥 REMOVED: Standard measurement status colors
    // Only advanced measurement ratings
    if (status?.includes("5 -") || status?.includes("Optimally Hydrated"))
      return "#10b981";
    if (status?.includes("4 -") || status?.includes("Well Hydrated"))
      return "#4ade80";
    if (status?.includes("3 -") || status?.includes("Slightly Hydrated"))
      return "#fb923c";
    if (status?.includes("2 -") || status?.includes("Mildly Dehydrated"))
      return "#f97316";
    if (status?.includes("1 -") || status?.includes("Severely Dehydrated"))
      return "#ef4444";

    return "#94a3b8";
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago • ${date.toLocaleDateString()} ${date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      )}`;
    } else if (hours > 0) {
      return `${hours}h ago • ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes > 0) {
        return `${minutes}m ago • ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
      return `Just now • ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  }

  function mlToGlassText(ml) {
    const glasses = ml / 200;
    if (glasses >= 2) return `${glasses.toFixed(1)} glasses`;
    if (glasses >= 1) return `${glasses.toFixed(1)} glass`;
    if (glasses >= 0.5) return `${glasses.toFixed(1)} glass`;
    return `${glasses.toFixed(1)} glass`;
  }

  const handleClearAll = () => {
    setShowClearConfirm(false);
    onClearAll();
  };

  // 🔥 UPDATED: Filter data - only advanced + water
  const filteredData = useMemo(() => {
    if (filterType === "all") return displayData;
    if (filterType === "water")
      return displayData.filter((d) => d.type === "water_intake");
    if (filterType === "measurement")
      return displayData.filter((d) => d.type === "advanced_measurement");
    return displayData;
  }, [displayData, filterType]);

  return (
    <>
      <div className="history-container">
        {/* Insights Card */}
        <div
          className="insights-card"
          style={{ borderLeftColor: insights.color }}
        >
          <div className="insights-header">
            <div className="insights-icon">{insights.icon}</div>
            <div className="insights-content">
              <h3 className="insights-status" style={{ color: insights.color }}>
                {insights.status}
              </h3>
              <p className="insights-message">{insights.message}</p>
            </div>
          </div>
          {displayData.length > 0 && (
            <div className="insights-stats">
              {/* ❌ REMOVED: Standard measurements count */}
              <div className="stat-item">
                <span className="stat-value">
                  {
                    displayData.filter((d) => d.type === "advanced_measurement")
                      .length
                  }
                </span>
                <span className="stat-label">Advanced</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">{waterIntakes.length}</span>
                <span className="stat-label">Water Logs</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">{displayData.length}</span>
                <span className="stat-label">Total Records</span>
              </div>
            </div>
          )}
        </div>

        {/* History Card */}
        <div className="history-card">
          <div className="history-header">
            <h2 className="history-title">📜 History Log</h2>
            <div className="header-actions">
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterType === "all" ? "active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterType === "water" ? "active" : ""}`}
                  onClick={() => setFilterType("water")}
                >
                  💧 Water
                </button>
                <button
                  className={`filter-btn ${filterType === "measurement" ? "active" : ""}`}
                  onClick={() => setFilterType("measurement")}
                >
                  🔬 Advanced
                </button>
              </div>

              {displayData.length > 0 && (
                <button
                  className="clear-btn"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Clearing..." : "🗑️ Clear All"}
                </button>
              )}
            </div>
          </div>

          {filteredData.length > 0 ? (
            <div className="history-list">
              {filteredData.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="item-header">
                    <div className="item-type-badge">
                      {/* ❌ REMOVED: Standard measurement badge */}
                      {entry.type === "advanced_measurement" ? (
                        <>
                          <span className="badge-icon">🔬</span>
                          <span>Advanced</span>
                        </>
                      ) : (
                        <>
                          <span className="badge-icon">💧</span>
                          <span>Water Intake</span>
                        </>
                      )}
                    </div>
                    <div className="item-timestamp">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>

                  <div className="item-body">
                    {/* ❌ REMOVED: Standard measurement body */}
                    {entry.type === "advanced_measurement" ? (
                      <>
                        <div className="item-main-info advanced-info">
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: `${getStatusColor(entry.hydrationRating)}15`,
                              color: getStatusColor(entry.hydrationRating),
                            }}
                          >
                            {entry.hydrationRating}
                          </span>
                          <span className="score-badge">
                            Score: {entry.overallScore}/100
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedAdvanced(entry)}
                          style={{
                            marginTop: "8px",
                            padding: "8px 16px",
                            background: "rgba(59, 130, 246, 0.1)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "6px",
                            color: "#3b82f6",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            fontWeight: "500",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background =
                              "rgba(59, 130, 246, 0.2)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background =
                              "rgba(59, 130, 246, 0.1)";
                          }}
                        >
                          📋 View Details
                        </button>
                      </>
                    ) : (
                      <div className="item-main-info">
                        <span className="water-amount-large">
                          {entry.amount} ml
                        </span>
                        <span className="water-glasses">
                          ({mlToGlassText(entry.amount)})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="item-footer">
                    <button
                      className="delete-btn"
                      onClick={() => {
                        // ❌ REMOVED: onDeleteMeasurement call
                        if (entry.type === "advanced_measurement") {
                          onDeleteAdvancedMeasurement(entry.id);
                        } else {
                          onDeleteWaterIntake(entry.id);
                        }
                      }}
                      disabled={isDeleting}
                    >
                      <span className="delete-icon">🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3 className="empty-title">
                No{" "}
                {filterType === "all"
                  ? "History"
                  : filterType === "water"
                    ? "Water Logs"
                    : "Advanced Measurements"}{" "}
                Yet
              </h3>
              <p className="empty-text">
                {filterType === "all"
                  ? "Your advanced assessments and water logs will appear here."
                  : filterType === "water"
                    ? "No water intake logs found. Start logging your water consumption!"
                    : "No advanced measurements found. Complete an advanced assessment on the dashboard!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowClearConfirm(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">⚠️</span>
              <h3 className="modal-title">Clear History?</h3>
            </div>
            <p className="modal-text">
              This will permanently delete:
              <br />•{" "}
              <strong>
                {
                  displayData.filter((d) => d.type === "advanced_measurement")
                    .length
                }
              </strong>{" "}
              advanced measurements
              <br />•{" "}
              <strong>
                {displayData.filter((d) => d.type === "water_intake").length}
              </strong>{" "}
              water intake logs
              <br />
              <br />⚡{" "}
              <strong>Standard measurements will be kept for dashboard.</strong>
              <br />
              <br />
              This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn confirm-btn"
                onClick={handleClearAll}
              >
                Yes, Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Details Modal - NO CHANGES NEEDED */}
      {selectedAdvanced && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAdvanced(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <span className="modal-icon">🔬</span>
              <h3 className="modal-title">Advanced Measurement Details</h3>
            </div>

            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Score */}
              <div
                style={{
                  textAlign: "center",
                  padding: "24px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "12px",
                  color: "white",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.9,
                    marginBottom: "8px",
                  }}
                >
                  Overall Hydration Score
                </div>
                <div style={{ fontSize: "3rem", fontWeight: "700" }}>
                  {selectedAdvanced.overallScore}
                </div>
                <div
                  style={{
                    fontSize: "1.25rem",
                    marginTop: "8px",
                    fontWeight: "600",
                  }}
                >
                  {selectedAdvanced.hydrationRating}
                </div>
              </div>

              {/* Metrics */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <MetricBox
                  label="Urine Color"
                  value={selectedAdvanced.urineColor}
                />
                <MetricBox
                  label="Mouth Dryness"
                  value={selectedAdvanced.mouthDryness}
                />
                <MetricBox
                  label="Mood/Behavior"
                  value={selectedAdvanced.mood}
                />
                <MetricBox
                  label="GSR Value"
                  value={`${selectedAdvanced.gsrValue} Ω`}
                />
                <MetricBox
                  label="BMI"
                  value={selectedAdvanced.bmi?.toFixed(1) || "N/A"}
                />
                <MetricBox
                  label="Timestamp"
                  value={formatTimestamp(selectedAdvanced.timestamp)}
                  small
                />
              </div>

              {/* Recommendation */}
              {selectedAdvanced.recommendation && (
                <div
                  style={{
                    padding: "16px",
                    background: "#eff6ff",
                    borderRadius: "8px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#1e40af",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    💡 Recommendation
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#1e3a8a",
                      lineHeight: "1.5",
                    }}
                  >
                    {selectedAdvanced.recommendation}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setSelectedAdvanced(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper component - NO CHANGES NEEDED
function MetricBox({ label, value, small }) {
  return (
    <div
      style={{
        padding: "16px",
        background: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: small ? "0.875rem" : "1.125rem",
          fontWeight: "600",
          color: "#1e293b",
        }}
      >
        {value}
      </div>
    </div>
  );
}

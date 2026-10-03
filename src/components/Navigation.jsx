// src/components/Navigation.jsx
import "../styles/Navigation.css";

export default function Navigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "history", label: "History", icon: "📜" },
    { id: "analytics", label: "Analysis", icon: "📈" },
    { id: "reminders", label: "Reminders", icon: "⏰" },
  ];

  return (
    <nav className="navigation-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`nav-tab ${activeTab === tab.id ? "active" : "inactive"}`}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

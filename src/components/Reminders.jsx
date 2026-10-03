import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { updateReminderMetadata } from "../firebase/deviceControl";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import "../styles/Reminders.css";

export default function Reminders() {
  const { currentUser } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formHour, setFormHour] = useState(8);
  const [formMinute, setFormMinute] = useState(0);
  const [formPeriod, setFormPeriod] = useState("AM");
  const [formType, setFormType] = useState("Drink");

  // Real-time listener for reminders
  useEffect(() => {
    if (!currentUser?.uid) return;

    const remindersRef = collection(db, "users", currentUser.uid, "reminders");
    const q = query(remindersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by time
      data.sort((a, b) => {
        if (a.hour !== b.hour) return a.hour - b.hour;
        return a.minute - b.minute;
      });

      setReminders(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const openAddForm = () => {
    setFormHour(8);
    setFormMinute(0);
    setFormPeriod("AM");
    setFormType("Drink");
    setEditingReminder(null);
    setShowAddForm(true);
  };

  const openEditForm = (reminder) => {
    const hour24 = reminder.hour;
    const isPM = hour24 >= 12;
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;

    setFormHour(hour12);
    setFormMinute(reminder.minute);
    setFormPeriod(isPM ? "PM" : "AM");
    setFormType(reminder.type);
    setEditingReminder(reminder);
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingReminder(null);
  };

  const saveReminder = async () => {
    if (!currentUser?.uid) return;

    let hour24 = formHour;
    if (formPeriod === "PM" && formHour !== 12) {
      hour24 += 12;
    } else if (formPeriod === "AM" && formHour === 12) {
      hour24 = 0;
    }

    const reminderData = {
      hour: hour24,
      minute: formMinute,
      type: formType,
      enabled: true,
      recurring: true,
      createdAt: serverTimestamp(),
    };

    setIsLoading(true);

    try {
      if (editingReminder) {
        const reminderRef = doc(
          db,
          "users",
          currentUser.uid,
          "reminders",
          editingReminder.id
        );
        await updateDoc(reminderRef, reminderData);

        // ✅ NEW: Notify device of change
        await updateReminderMetadata(currentUser.uid, "edited");

        console.log("✅ Reminder updated");
      } else {
        if (reminders.length >= 10) {
          alert("Maximum 10 reminders allowed!");
          setIsLoading(false);
          return;
        }

        const remindersRef = collection(
          db,
          "users",
          currentUser.uid,
          "reminders"
        );
        await addDoc(remindersRef, reminderData);

        // ✅ NEW: Notify device of change
        await updateReminderMetadata(currentUser.uid, "added");

        console.log("✅ Reminder added");
      }

      closeForm();
    } catch (error) {
      console.error("❌ Error saving reminder:", error);
      alert("Failed to save reminder. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReminder = async (reminderId) => {
    if (!currentUser?.uid) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this reminder?"
    );
    if (!confirmDelete) return;

    setIsLoading(true);

    try {
      const reminderRef = doc(
        db,
        "users",
        currentUser.uid,
        "reminders",
        reminderId
      );
      await deleteDoc(reminderRef);

      // ✅ NEW: Notify device of change
      await updateReminderMetadata(currentUser.uid, "deleted");

      console.log("✅ Reminder deleted");
    } catch (error) {
      console.error("❌ Error deleting reminder:", error);
      alert("Failed to delete reminder. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllReminders = async () => {
    if (!currentUser?.uid) return;

    const confirmClear = window.confirm(
      `Delete all ${reminders.length} reminders? This cannot be undone.`
    );
    if (!confirmClear) return;

    setIsLoading(true);

    try {
      const remindersRef = collection(
        db,
        "users",
        currentUser.uid,
        "reminders"
      );
      const snapshot = await getDocs(remindersRef);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // ✅ NEW: Notify device of change
      await updateReminderMetadata(currentUser.uid, "cleared");

      console.log("✅ All reminders cleared");
      alert("All reminders have been cleared!");
    } catch (error) {
      console.error("❌ Error clearing reminders:", error);
      alert("Failed to clear reminders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (hour, minute) => {
    const isPM = hour >= 12;
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;

    const minuteStr = minute < 10 ? `0${minute}` : minute;
    return `${displayHour}:${minuteStr} ${isPM ? "PM" : "AM"}`;
  };

  return (
    <div className="reminders-page">
      <div className="reminders-container">
        {/* Header */}
        <div className="reminders-header">
          <div className="header-title">
            <span className="title-icon">⏰</span>
            <h2 className="reminders-title">Device Reminders</h2>
          </div>
          <div className="header-actions">
            {reminders.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={clearAllReminders}
                disabled={isLoading}
              >
                <span>🗑️</span>
                <span>Clear All</span>
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={openAddForm}
              disabled={isLoading || reminders.length >= 10}
            >
              <span>+</span>
              <span>Add Reminder</span>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <span className="info-icon">ℹ️</span>
          <span>
            Reminders will be sent to your device. Device must be connected to
            WiFi to receive updates.
          </span>
          <span className="reminder-count">
            {reminders.length}/10 reminders
          </span>
        </div>

        {/* Reminders List */}
        {reminders.length > 0 ? (
          <div className="reminders-list">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="reminder-card">
                <div className="reminder-info">
                  <div className="reminder-icon">
                    {reminder.type === "Medicine" ? "💊" : "💧"}
                  </div>
                  <div className="reminder-details">
                    <div className="reminder-time">
                      {formatTime(reminder.hour, reminder.minute)}
                    </div>
                    <div className="reminder-type">{reminder.type}</div>
                  </div>
                </div>
                <div className="reminder-actions">
                  <button
                    className="action-btn action-btn-edit"
                    onClick={() => openEditForm(reminder)}
                    disabled={isLoading}
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button
                    className="action-btn action-btn-delete"
                    onClick={() => deleteReminder(reminder.id)}
                    disabled={isLoading}
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⏰</div>
            <h3 className="empty-title">No Reminders Set</h3>
            <p className="empty-text">
              Add your first reminder to get started!
            </p>
            <p className="empty-text">
              Your device will alert you at the scheduled times.
            </p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">
                {editingReminder ? "Edit Reminder" : "Add New Reminder"}
              </h3>

              {/* Time Input */}
              <div className="form-group">
                <label className="form-label">Time</label>
                <div className="time-inputs">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formHour}
                    onChange={(e) =>
                      setFormHour(
                        Math.max(1, Math.min(12, parseInt(e.target.value) || 1))
                      )
                    }
                    className="time-input"
                  />
                  <span className="time-separator">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formMinute}
                    onChange={(e) =>
                      setFormMinute(
                        Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                      )
                    }
                    className="time-input"
                  />
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    className="select-input select-auto"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Type Select */}
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="select-input select-full"
                >
                  <option value="Drink">💧 Drink Water</option>
                  <option value="Medicine">💊 Take Medicine</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="modal-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={closeForm}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveReminder}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Reminder"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

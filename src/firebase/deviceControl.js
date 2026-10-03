// src/firebase/deviceControl.js
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

/**
 * Triggers a remote measurement on the ESP32 device
 * @param {string} userId - The current user's ID
 * @param {string} deviceId - The device ID to trigger
 * @returns {Promise<boolean>} - Success status
 */
export async function triggerRemoteMeasurement(userId, deviceId) {
  if (!userId || !deviceId) {
    throw new Error("User ID and Device ID are required");
  }

  try {
    const deviceControlRef = doc(
      db,
      "users",
      userId,
      "deviceControl",
      deviceId
    );

    await setDoc(
      deviceControlRef,
      {
        triggerMeasurement: true,
        requestedAt: serverTimestamp(),
        requestedBy: userId,
      },
      { merge: true }
    );

    console.log("✅ Remote measurement triggered successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to trigger remote measurement:", error);
    throw error;
  }
}

/**
 * Resets the trigger flag (optional - ESP32 does this automatically)
 * @param {string} userId - The current user's ID
 * @param {string} deviceId - The device ID
 */
export async function resetRemoteTrigger(userId, deviceId) {
  try {
    const deviceControlRef = doc(
      db,
      "users",
      userId,
      "deviceControl",
      deviceId
    );

    await setDoc(
      deviceControlRef,
      {
        triggerMeasurement: false,
        resetAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ Remote trigger reset");
  } catch (error) {
    console.error("❌ Failed to reset trigger:", error);
  }
}

/**
 * 🔥 KEY FIX: Updates reminder metadata to notify device of changes
 * This is what triggers the device to sync reminders from Firebase
 *
 * @param {string} userId - The current user's ID
 * @param {string} action - Type of change: 'added', 'edited', 'deleted', 'cleared'
 * @returns {Promise<void>}
 */
export async function updateReminderMetadata(userId, action = "modified") {
  if (!userId) {
    console.error("❌ updateReminderMetadata: No userId provided");
    throw new Error("User ID is required");
  }

  try {
    const metaRef = doc(db, "users", userId, "reminderMeta", "lastModified");

    // ✅ Use Date.now() instead of serverTimestamp() for device compatibility
    // The ESP32 compares timestamps as integers, not Firestore Timestamp objects
    const now = Date.now();

    await setDoc(metaRef, {
      timestamp: now, // 🔑 Critical: Integer timestamp for ESP32
      action: action, // Type of change made
      updatedAt: serverTimestamp(), // For web app display purposes
    });

    console.log(`✅ Reminder metadata updated: ${action} (timestamp: ${now})`);
  } catch (error) {
    console.error("❌ Failed to update reminder metadata:", error);
    throw error;
  }
}

/**
 * 🆕 BONUS: Force immediate reminder sync on device
 * Creates a sync trigger that the device checks every 10 seconds
 *
 * @param {string} userId - The current user's ID
 * @returns {Promise<void>}
 */
export async function forceSyncReminders(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const syncRef = doc(db, "users", userId, "reminderMeta", "syncTrigger");

    await setDoc(syncRef, {
      forceSyncNow: true,
      triggeredAt: Date.now(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Force sync triggered");

    // Auto-reset after 5 seconds to prevent repeated syncs
    setTimeout(async () => {
      await setDoc(
        syncRef,
        {
          forceSyncNow: false,
          resetAt: serverTimestamp(),
        },
        { merge: true }
      );
    }, 5000);
  } catch (error) {
    console.error("❌ Failed to force sync:", error);
    throw error;
  }
}

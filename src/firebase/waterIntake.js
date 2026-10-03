import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./config";

// Add water intake log (Web App)
export const logWaterIntake = async (userId, amount) => {
  try {
    const waterIntakesRef = collection(db, "users", userId, "waterIntakes");
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    console.log("========================================");
    console.log("💧 WEB APP: Logging water intake");
    console.log("   User ID: " + userId);
    console.log("   Amount: " + amount + "ml");
    console.log("   Timestamp: " + timestamp);
    console.log("   Source: web");
    console.log("========================================");

    const docRef = await addDoc(waterIntakesRef, {
      amount: parseInt(amount),
      timestamp: timestamp,
      source: "web", // Identifies web app entries
    });

    console.log("✅ Water intake logged successfully!");
    console.log("   Document ID: " + docRef.id);
    console.log("========================================");

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("❌ Error logging water intake:", error);
    throw error;
  }
};

// Update daily goal
export const updateDailyGoal = async (userId, goalMl) => {
  try {
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      dailyWaterGoal: parseInt(goalMl),
      updatedAt: Math.floor(Date.now() / 1000),
    });

    console.log("✅ Daily goal updated: " + goalMl + "ml");

    return { success: true };
  } catch (error) {
    console.error("❌ Error updating daily goal:", error);
    throw error;
  }
};

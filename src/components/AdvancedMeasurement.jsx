// src/components/AdvancedMeasurement.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../styles/AdvancedMeasurement.css";

export default function AdvancedMeasurement({ latestGSR, onClose, onSuccess }) {
  const { currentUser } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    urineColor: "",
    mouthDryness: "",
    mood: "",
    weight: "",
    height: "",
  });

  const [bmi, setBmi] = useState(null);
  const [overallScore, setOverallScore] = useState(null);
  const [hydrationRating, setHydrationRating] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate BMI when weight/height changes
  useEffect(() => {
    if (formData.weight && formData.height) {
      const weightKg = parseFloat(formData.weight);
      const heightM = parseFloat(formData.height) / 100; // cm to meters

      if (weightKg > 0 && heightM > 0) {
        const calculatedBMI = (weightKg / (heightM * heightM)).toFixed(1);
        setBmi(calculatedBMI);
      }
    } else {
      setBmi(null);
    }
  }, [formData.weight, formData.height]);

  // Check if form is complete
  const isFormComplete = () => {
    return (
      formData.urineColor &&
      formData.mouthDryness &&
      formData.mood &&
      formData.weight &&
      formData.height &&
      latestGSR !== null &&
      latestGSR !== undefined
    );
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===== SCORING ALGORITHM =====
  const calculateAdvancedScore = () => {
    if (!isFormComplete()) {
      alert("Please complete all fields before measuring");
      return;
    }

    setIsCalculating(true);

    // 1. GSR Score (0-20 points) - Skin Resistance Sensor
    // Higher GSR = Higher resistance = Drier skin = Dehydrated = Lower score
    // Lower GSR = Lower resistance = Moist skin = Hydrated = Higher score
    const GSR_MIN = 600; // Well hydrated (low resistance)
    const GSR_MAX = 2399; // Dehydrated (high resistance, above = no contact)

    // Check for no skin contact
    if (latestGSR >= 2400) {
      alert(
        "⚠️ No skin contact detected (GSR ≥ 2400Ω). Please ensure proper sensor contact.",
      );
      setIsCalculating(false);
      return;
    }

    const gsrClamped = Math.max(GSR_MIN, Math.min(GSR_MAX, latestGSR));

    // Calculate score: Lower GSR → Higher score (better hydration)
    const gsrScore = 20 - ((gsrClamped - GSR_MIN) / (GSR_MAX - GSR_MIN)) * 20;

    // 2. Urine Color Score (0-20 points)
    let urineScore = 0;
    if (formData.urineColor === "pale_yellow")
      urineScore = 20; // Well hydrated
    else if (formData.urineColor === "dark_yellow")
      urineScore = 8; // Dehydrated
    else if (formData.urineColor === "white") urineScore = 5; // Over-hydrated (abnormal)

    // 3. Mouth Dryness Score (0-20 points)
    let mouthScore = 0;
    if (formData.mouthDryness === "no")
      mouthScore = 20; // No dryness
    else if (formData.mouthDryness === "slightly")
      mouthScore = 12; // Slightly dry
    else if (formData.mouthDryness === "dry") mouthScore = 0; // Very dry

    // 4. Mood/Behavior Score (0-20 points)
    let moodScore = 0;
    if (formData.mood === "stable")
      moodScore = 20; // Stable
    else if (formData.mood === "fatigued")
      moodScore = 10; // Fatigued
    else if (formData.mood === "dizzy") moodScore = 0; // Dizzy (severe dehydration)

    // 5. BMI Score (0-20 points)
    let bmiScore = 0;
    const bmiValue = parseFloat(bmi);

    if (bmiValue < 18.5) {
      // Underweight - moderate concern
      bmiScore = 12;
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      // Normal weight - optimal
      bmiScore = 20;
    } else if (bmiValue >= 25 && bmiValue < 30) {
      // Overweight - slightly lower score
      bmiScore = 15;
    } else {
      // Obese - lowest score (higher dehydration risk)
      bmiScore = 8;
    }

    // Calculate total score (0-100)
    const totalScore =
      gsrScore + urineScore + mouthScore + moodScore + bmiScore;

    // Map to 1-5 rating
    let rating = "";
    let ratingColor = "";

    if (totalScore >= 80) {
      rating = "5 - Overly Hydrated";
      ratingColor = "#06b6d4"; // Cyan
    } else if (totalScore >= 60) {
      rating = "4 - Hydrated";
      ratingColor = "#10b981"; // Green
    } else if (totalScore >= 40) {
      rating = "3 - Slightly Hydrated";
      ratingColor = "#f59e0b"; // Orange
    } else if (totalScore >= 20) {
      rating = "2 - Slightly Dehydrated";
      ratingColor = "#fb923c"; // Dark orange
    } else {
      rating = "1 - Dehydrated";
      ratingColor = "#ef4444"; // Red
    }

    // Update state
    setOverallScore(totalScore.toFixed(1));
    setHydrationRating({ text: rating, color: ratingColor });
    setIsCalculating(false);

    // Show results section
    setTimeout(() => {
      document.querySelector(".results-section")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  // ===== SAVE TO FIREBASE =====
  const handleSave = async () => {
    if (!overallScore || !hydrationRating) {
      alert("Please calculate the score first");
      return;
    }

    setIsSaving(true);

    try {
      const advancedMeasurementData = {
        // GSR data
        gsrValue: latestGSR,

        // User inputs
        urineColor: formData.urineColor,
        mouthDryness: formData.mouthDryness,
        mood: formData.mood,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),

        // Calculated values
        bmi: parseFloat(bmi),
        overallScore: parseFloat(overallScore),
        hydrationRating: hydrationRating.text,

        // Metadata
        timestamp: Math.floor(Date.now() / 1000),
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        type: "advanced_measurement",
      };

      // Save to Firebase
      await addDoc(
        collection(db, "users", currentUser.uid, "advancedMeasurements"),
        advancedMeasurementData,
      );

      console.log("✅ Advanced measurement saved to Firebase");

      // Success callback
      if (onSuccess) {
        onSuccess(advancedMeasurementData);
      }

      // Show success message
      alert("✅ Advanced measurement saved successfully!");

      // Close modal
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("❌ Error saving advanced measurement:", error);
      alert("Failed to save measurement. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="advanced-measurement-modal">
      <div className="advanced-measurement-container">
        {/* Header */}
        <div className="advanced-header">
          <div>
            <h2 className="advanced-title">🔬 Advanced Hydration Assessment</h2>
            <p className="advanced-subtitle">
              Complete all fields for comprehensive analysis
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* GSR Display */}
        <div className="gsr-display">
          <div className="gsr-icon">📊</div>
          <div>
            <p className="gsr-label">Latest GSR Reading</p>
            <p className="gsr-value">{latestGSR || "N/A"} Ω</p>
          </div>
        </div>

        {/* Input Form */}
        <div className="input-form">
          {/* Urine Color */}
          <div className="form-group">
            <label className="form-label">
              💧 Urine Color
              <span className="required">*</span>
            </label>
            <div className="options-grid">
              <button
                className={`option-btn ${formData.urineColor === "pale_yellow" ? "selected" : ""}`}
                onClick={() => handleInputChange("urineColor", "pale_yellow")}
              >
                <span className="option-icon">🟡</span>
                <span>Pale Yellow</span>
              </button>
              <button
                className={`option-btn ${formData.urineColor === "dark_yellow" ? "selected" : ""}`}
                onClick={() => handleInputChange("urineColor", "dark_yellow")}
              >
                <span className="option-icon">🟠</span>
                <span>Dark Yellow</span>
              </button>
              <button
                className={`option-btn ${formData.urineColor === "white" ? "selected" : ""}`}
                onClick={() => handleInputChange("urineColor", "white")}
              >
                <span className="option-icon">⚪</span>
                <span>White/Clear</span>
              </button>
            </div>
          </div>

          {/* Mouth Dryness */}
          <div className="form-group">
            <label className="form-label">
              👄 Mouth Dryness
              <span className="required">*</span>
            </label>
            <div className="options-grid">
              <button
                className={`option-btn ${formData.mouthDryness === "no" ? "selected" : ""}`}
                onClick={() => handleInputChange("mouthDryness", "no")}
              >
                <span className="option-icon">✅</span>
                <span>No Dryness</span>
              </button>
              <button
                className={`option-btn ${formData.mouthDryness === "slightly" ? "selected" : ""}`}
                onClick={() => handleInputChange("mouthDryness", "slightly")}
              >
                <span className="option-icon">⚠️</span>
                <span>Slightly Dry</span>
              </button>
              <button
                className={`option-btn ${formData.mouthDryness === "dry" ? "selected" : ""}`}
                onClick={() => handleInputChange("mouthDryness", "dry")}
              >
                <span className="option-icon">🚨</span>
                <span>Very Dry</span>
              </button>
            </div>
          </div>

          {/* Mood/Behavior */}
          <div className="form-group">
            <label className="form-label">
              😊 Mood / Behavior
              <span className="required">*</span>
            </label>
            <div className="options-grid">
              <button
                className={`option-btn ${formData.mood === "stable" ? "selected" : ""}`}
                onClick={() => handleInputChange("mood", "stable")}
              >
                <span className="option-icon">😊</span>
                <span>Stable</span>
              </button>
              <button
                className={`option-btn ${formData.mood === "fatigued" ? "selected" : ""}`}
                onClick={() => handleInputChange("mood", "fatigued")}
              >
                <span className="option-icon">😴</span>
                <span>Fatigued</span>
              </button>
              <button
                className={`option-btn ${formData.mood === "dizzy" ? "selected" : ""}`}
                onClick={() => handleInputChange("mood", "dizzy")}
              >
                <span className="option-icon">😵</span>
                <span>Dizzy</span>
              </button>
            </div>
          </div>

          {/* Weight & Height */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                ⚖️ Weight (kg)
                <span className="required">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 70"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                min="20"
                max="300"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                📏 Height (cm)
                <span className="required">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 170"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                min="100"
                max="250"
                step="0.1"
              />
            </div>
          </div>

          {/* BMI Display */}
          {bmi && (
            <div className="bmi-display">
              <div className="bmi-icon">🧮</div>
              <div>
                <p className="bmi-label">Calculated BMI</p>
                <p className="bmi-value">
                  {bmi}
                  <span className="bmi-category">
                    {parseFloat(bmi) < 18.5
                      ? " (Underweight)"
                      : parseFloat(bmi) < 25
                        ? " (Normal)"
                        : parseFloat(bmi) < 30
                          ? " (Overweight)"
                          : " (Obese)"}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <button
          className="calculate-btn"
          onClick={calculateAdvancedScore}
          disabled={!isFormComplete() || isCalculating}
        >
          {isCalculating ? (
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
              <span>Calculating...</span>
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
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>Calculate Overall Score</span>
            </>
          )}
        </button>

        {/* Results Section */}
        {overallScore && hydrationRating && (
          <div className="results-section">
            <h3 className="results-title">📊 Assessment Results</h3>

            <div className="results-grid">
              <div className="result-card">
                <p className="result-label">Overall Score</p>
                <p className="result-value">{overallScore}/100</p>
              </div>

              <div
                className="result-card"
                style={{ borderColor: hydrationRating.color }}
              >
                <p className="result-label">Hydration Rating</p>
                <p
                  className="result-value"
                  style={{ color: hydrationRating.color }}
                >
                  {hydrationRating.text}
                </p>
              </div>
            </div>

            {/* Save Button */}
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
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
                  <span>Saving...</span>
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
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Save Measurement</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

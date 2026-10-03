import { useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Droplet,
  BarChart3,
  Calendar,
  Download,
  AlertTriangle,
  Clock,
  ThermometerSun,
  Smile,
  Scale,
} from "lucide-react";
import "../styles/Analytics.css";

export default function AdvancedAnalytics({ advancedMeasurements = [] }) {
  const [timeRange, setTimeRange] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const analyticsRef = useRef(null);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to draw section divider
      const drawDivider = () => {
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
      };

      // ============================================
      // 1. COVER PAGE
      // ============================================

      // Header gradient background (simulated with rectangles)
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 60, "F");

      // Logo/Icon area
      const logoWidth = 80;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = 25;

      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(logoX, logoY, logoWidth, logoHeight, 3, 3, "F");

      // Add subtle border
      pdf.setDrawColor(139, 92, 246);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(logoX, logoY, logoWidth, logoHeight, 3, 3, "S");

      pdf.setFillColor(139, 92, 246);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("HYDRA SENSE", pageWidth / 2, logoY + 13, { align: "center" });

      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      yPosition = 80;
      pdf.text("HYDRATION ANALYTICS REPORT", pageWidth / 2, yPosition, {
        align: "center",
      });

      // Subtitle
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      yPosition += 10;
      pdf.text(
        "Advanced Multi-Factor Assessment Analysis",
        pageWidth / 2,
        yPosition,
        {
          align: "center",
        },
      );

      // Date range
      yPosition += 20;
      pdf.setFontSize(10);
      const dateRange =
        timeRange === "all"
          ? "All Time Data"
          : timeRange === "week"
            ? "Last 7 Days"
            : "Last 30 Days";
      pdf.text(`Period: ${dateRange}`, pageWidth / 2, yPosition, {
        align: "center",
      });

      // Generation date
      yPosition += 8;
      const generatedDate = new Date().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      pdf.text(`Generated: ${generatedDate}`, pageWidth / 2, yPosition, {
        align: "center",
      });

      // Summary box
      yPosition = 140;
      pdf.setFillColor(249, 250, 251);
      pdf.roundedRect(margin, yPosition, contentWidth, 80, 3, 3, "F");

      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      yPosition += 15;
      pdf.text("EXECUTIVE SUMMARY", pageWidth / 2, yPosition, {
        align: "center",
      });

      // Key metrics in summary
      yPosition += 15;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const summaryLines = [
        `Total Assessments: ${analyticsData.stats.totalMeasurements}`,
        `Average Hydration Score: ${analyticsData.stats.avgScore}/100`,
        `Hydration Rate: ${analyticsData.stats.hydrationRate}%`,
        `Best Streak: ${analyticsData.stats.longestStreak} days`,
        `Current Streak: ${analyticsData.stats.currentStreak} days`,
      ];

      summaryLines.forEach((line, index) => {
        pdf.text(line, pageWidth / 2, yPosition + index * 8, {
          align: "center",
        });
      });

      // Footer
      yPosition = pageHeight - 30;
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(
        "HydraSense - Hydration Monitoring System",
        pageWidth / 2,
        yPosition,
        {
          align: "center",
        },
      );

      // ============================================
      // 2. PERFORMANCE METRICS PAGE
      // ============================================
      pdf.addPage();
      yPosition = margin;

      // Page header
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 15, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("PERFORMANCE METRICS", margin, 10);
      pdf.setTextColor(0, 0, 0);

      yPosition = 25;

      // Section title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Overall Performance", margin, yPosition);
      yPosition += 12;

      // Performance cards
      const performanceMetrics = [
        {
          label: "Average Score",
          value: `${analyticsData.stats.avgScore}/100`,
          status:
            analyticsData.stats.avgScore >= 70
              ? "Excellent"
              : analyticsData.stats.avgScore >= 50
                ? "Good"
                : "Needs Improvement",
          color:
            analyticsData.stats.avgScore >= 70
              ? [16, 185, 129]
              : analyticsData.stats.avgScore >= 50
                ? [59, 130, 246]
                : [239, 68, 68],
        },
        {
          label: "Highest Score",
          value: `${analyticsData.stats.maxScore}/100`,
          status: "Peak Performance",
          color: [16, 185, 129],
        },
        {
          label: "Lowest Score",
          value: `${analyticsData.stats.minScore}/100`,
          status: "Minimum Recorded",
          color: [239, 68, 68],
        },
        {
          label: "Hydration Rate",
          value: `${analyticsData.stats.hydrationRate}%`,
          status: "Optimal Readings",
          color: [6, 182, 212],
        },
      ];

      const cardWidth = (contentWidth - 10) / 2;
      const cardHeight = 35;
      let cardX = margin;
      let cardY = yPosition;

      performanceMetrics.forEach((metric, index) => {
        if (index % 2 === 0 && index > 0) {
          cardY += cardHeight + 8;
          cardX = margin;
        } else if (index > 0) {
          cardX = margin + cardWidth + 10;
        }

        // Card background
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, "F");

        // Colored accent bar
        pdf.setFillColor(...metric.color);
        pdf.rect(cardX, cardY, 4, cardHeight, "F");

        // Metric label
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(107, 114, 128);
        pdf.text(metric.label, cardX + 8, cardY + 8);

        // Metric value
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(31, 41, 55);
        pdf.text(metric.value, cardX + 8, cardY + 22);

        // Status badge
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...metric.color);
        pdf.text(metric.status, cardX + 8, cardY + 30);
      });

      yPosition = cardY + cardHeight + 20;
      drawDivider();

      // Score Range Analysis
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Score Distribution", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(75, 85, 99);

      const ratingCounts = analyticsData.ratingDistribution.reduce(
        (acc, item) => {
          acc[item.name] = item.value;
          return acc;
        },
        {},
      );

      const distributionText = [
        `Excellent (80-100): ${ratingCounts["Optimally Hydrated"] || 0} assessments`,
        `Good (60-79): ${ratingCounts["Well Hydrated"] || 0} assessments`,
        `Fair (40-59): ${ratingCounts["Slightly Hydrated"] || 0} assessments`,
        `Poor (20-39): ${ratingCounts["Mildly Dehydrated"] || 0} assessments`,
        `Critical (0-19): ${ratingCounts["Severely Dehydrated"] || 0} assessments`,
      ];

      distributionText.forEach((text, index) => {
        pdf.text(`• ${text}`, margin + 5, yPosition + index * 7);
      });

      yPosition += distributionText.length * 7 + 15;

      // ============================================
      // 3. HEALTH INDICATORS PAGE
      // ============================================
      checkPageBreak(100);

      // Page header
      if (yPosition === margin) {
        pdf.setFillColor(139, 92, 246);
        pdf.rect(0, 0, pageWidth, 15, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("HEALTH INDICATORS", margin, 10);
        pdf.setTextColor(0, 0, 0);
        yPosition = 25;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Multi-Factor Assessment", margin, yPosition);
      yPosition += 12;

      // BMI Section
      if (analyticsData.stats.avgBMI > 0) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Body Mass Index (BMI)", margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(75, 85, 99);
        pdf.text(
          `Average BMI: ${analyticsData.stats.avgBMI}`,
          margin + 5,
          yPosition,
        );
        yPosition += 7;

        const bmiStatus =
          analyticsData.stats.avgBMI < 18.5
            ? "Underweight"
            : analyticsData.stats.avgBMI < 25
              ? "Normal Weight"
              : analyticsData.stats.avgBMI < 30
                ? "Overweight"
                : "Obese";
        pdf.text(`Status: ${bmiStatus}`, margin + 5, yPosition);
        yPosition += 15;
      }

      // Common Symptoms
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Most Common Symptoms", margin, yPosition);
      yPosition += 10;

      const symptoms = [
        { label: "Urine Color", value: analyticsData.stats.mostCommonUrine },
        { label: "Mouth Dryness", value: analyticsData.stats.mostCommonMouth },
        { label: "Mood/Behavior", value: analyticsData.stats.mostCommonMood },
      ];

      symptoms.forEach((symptom) => {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(75, 85, 99);
        pdf.text(`${symptom.label}:`, margin + 5, yPosition);
        pdf.setFont("helvetica", "bold");
        pdf.text(symptom.value, margin + 50, yPosition);
        yPosition += 8;
      });

      yPosition += 10;
      drawDivider();

      // ============================================
      // 4. TRENDS & PATTERNS PAGE
      // ============================================
      checkPageBreak(100);

      if (yPosition === margin) {
        pdf.setFillColor(139, 92, 246);
        pdf.rect(0, 0, pageWidth, 15, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("TRENDS & PATTERNS", margin, 10);
        pdf.setTextColor(0, 0, 0);
        yPosition = 25;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Activity Patterns", margin, yPosition);
      yPosition += 12;

      // Assessment frequency
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Assessment Frequency", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(75, 85, 99);
      const avgPerDay = (
        analyticsData.stats.totalMeasurements /
        Math.max(1, analyticsData.frequencyData.length)
      ).toFixed(1);
      pdf.text(
        `Average: ${avgPerDay} assessments per day`,
        margin + 5,
        yPosition,
      );
      yPosition += 7;
      pdf.text(
        `Total: ${analyticsData.stats.totalMeasurements} assessments`,
        margin + 5,
        yPosition,
      );
      yPosition += 15;

      // Risk times
      if (analyticsData.riskTimes.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(239, 68, 68);
        pdf.text("WARNING: High Risk Times", margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(75, 85, 99);
        pdf.text(
          "Times when low hydration scores occur most frequently:",
          margin + 5,
          yPosition,
        );
        yPosition += 8;

        analyticsData.riskTimes.forEach((time) => {
          pdf.text(
            `• ${time.hour} - ${time.incidents} incident(s)`,
            margin + 8,
            yPosition,
          );
          yPosition += 7;
        });
        yPosition += 10;
      }

      drawDivider();

      // ============================================
      // 5. RECOMMENDATIONS PAGE
      // ============================================
      checkPageBreak(100);

      if (yPosition === margin) {
        pdf.setFillColor(139, 92, 246);
        pdf.rect(0, 0, pageWidth, 15, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("RECOMMENDATIONS", margin, 10);
        pdf.setTextColor(0, 0, 0);
        yPosition = 25;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Personalized Recommendations", margin, yPosition);
      yPosition += 12;

      // Generate smart recommendations
      const recommendations = [];

      if (analyticsData.stats.avgScore < 60) {
        recommendations.push({
          icon: "[!]",
          title: "Increase Water Intake",
          text: "Your average score indicates room for improvement. Aim to drink water every 2 hours.",
        });
      }

      if (analyticsData.stats.currentStreak < 3) {
        recommendations.push({
          icon: "[#]",
          title: "Build Consistency",
          text: "Regular assessments help track progress. Try to maintain daily measurements.",
        });
      }

      if (analyticsData.riskTimes.length > 0) {
        recommendations.push({
          icon: "[*]",
          title: "Focus on Risk Times",
          text: `Set reminders for ${analyticsData.riskTimes[0].hour} when you're most likely to be dehydrated.`,
        });
      }

      if (analyticsData.stats.hydrationRate < 70) {
        recommendations.push({
          icon: "[+]",
          title: "Improve Hydration Rate",
          text: "Aim for consistent optimal readings. Small, frequent water intake works best.",
        });
      }

      recommendations.push({
        icon: "[>]",
        title: "Continue Monitoring",
        text: "Keep tracking your hydration with advanced assessments for best results.",
      });

      recommendations.forEach((rec, index) => {
        checkPageBreak(35);

        // Recommendation box
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(margin, yPosition, contentWidth, 28, 2, 2, "F");

        // Icon box with colored background
        pdf.setFillColor(139, 92, 246);
        pdf.circle(margin + 8, yPosition + 10, 4, "F");
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text(rec.icon, margin + 6, yPosition + 12);

        // Title
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(31, 41, 55);
        pdf.text(rec.title, margin + 18, yPosition + 10);

        // Description
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(75, 85, 99);
        const textLines = pdf.splitTextToSize(rec.text, contentWidth - 25);
        pdf.text(textLines, margin + 18, yPosition + 18);

        yPosition += 35;
      });

      // ============================================
      // 6. FOOTER ON LAST PAGE
      // ============================================
      yPosition = pageHeight - 40;
      drawDivider();

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(107, 114, 128);
      pdf.text(
        "This report is generated based on your recorded hydration assessments.",
        margin,
        yPosition,
      );
      yPosition += 6;
      pdf.text(
        "Consult healthcare professionals for medical advice.",
        margin,
        yPosition,
      );

      yPosition = pageHeight - 20;
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(
        `Generated by HydraSense on ${generatedDate}`,
        pageWidth / 2,
        yPosition,
        {
          align: "center",
        },
      );
      pdf.text(
        `Page ${pdf.internal.getNumberOfPages()}`,
        pageWidth / 2,
        yPosition + 5,
        {
          align: "center",
        },
      );

      // Save the PDF
      const fileName = `HydraSense_Analytics_${new Date()
        .toLocaleDateString()
        .replace(/\//g, "-")}.pdf`;
      pdf.save(fileName);

      setIsGenerating(false);
      alert("✅ Analytics report generated successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("❌ Failed to generate PDF. Please try again.");
      setIsGenerating(false);
    }
  };

  const analyticsData = useMemo(() => {
    if (advancedMeasurements.length === 0) return null;

    let filteredMeasurements = advancedMeasurements;
    if (timeRange !== "all") {
      const now = Date.now() / 1000;
      const daysAgo = timeRange === "week" ? 7 : 30;
      const cutoff = now - daysAgo * 24 * 60 * 60;
      filteredMeasurements = advancedMeasurements.filter(
        (m) => m.timestamp >= cutoff,
      );
    }

    if (filteredMeasurements.length === 0) {
      filteredMeasurements = advancedMeasurements;
    }

    // Overall Score Trend
    const scoreTrendData = filteredMeasurements
      .slice()
      .reverse()
      .map((m) => ({
        time: new Date(m.timestamp * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        score: m.overallScore || 0,
        date: new Date(m.timestamp * 1000).toLocaleDateString(),
      }));

    // Hydration Rating Distribution
    const ratingCount = filteredMeasurements.reduce((acc, m) => {
      const rating = m.hydrationRating || "Unknown";
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    const ratingDistribution = Object.entries(ratingCount).map(
      ([rating, count]) => ({
        name: rating.replace(/^\d+\s*-\s*/, ""), // Remove number prefix
        value: count,
        fullName: rating,
      }),
    );

    // Daily Measurement Frequency
    const dailyCount = filteredMeasurements.reduce((acc, m) => {
      const date = new Date(m.timestamp * 1000).toLocaleDateString("en-US", {
        weekday: "short",
      });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const frequencyData = Object.entries(dailyCount).map(([day, count]) => ({
      day,
      count,
    }));

    // Hourly Pattern
    const hourlyCount = filteredMeasurements.reduce((acc, m) => {
      const date = new Date(m.timestamp * 1000);
      const hour = date.getHours();
      const period = hour < 12 ? "AM" : "PM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const label = `${displayHour}${period}`;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const hourlyData = Object.entries(hourlyCount).map(([hour, count]) => ({
      hour,
      count,
    }));

    // Average Metrics
    const scores = filteredMeasurements.map((m) => m.overallScore || 0);
    const avgScore = (
      scores.reduce((a, b) => a + b, 0) / scores.length
    ).toFixed(1);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // BMI Trend
    const bmiData = filteredMeasurements
      .filter((m) => m.bmi && m.bmi > 0)
      .slice()
      .reverse()
      .map((m) => ({
        date: new Date(m.timestamp * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        bmi: parseFloat(m.bmi.toFixed(1)),
      }));

    const avgBMI =
      bmiData.length > 0
        ? (bmiData.reduce((sum, d) => sum + d.bmi, 0) / bmiData.length).toFixed(
            1,
          )
        : 0;

    // Symptom Analysis (Radar Chart Data)
    const getSymptomScore = (value, type) => {
      if (type === "urine") {
        const urineMap = {
          "Pale Yellow": 100,
          "Light Yellow": 85,
          Yellow: 70,
          "Dark Yellow": 50,
          Amber: 30,
          "Dark Amber": 10,
        };
        return urineMap[value] || 50;
      } else if (type === "mouth") {
        const mouthMap = {
          "Very Moist": 100,
          Moist: 80,
          Normal: 60,
          Dry: 40,
          "Very Dry": 20,
        };
        return mouthMap[value] || 50;
      } else if (type === "mood") {
        const moodMap = {
          Energetic: 100,
          Normal: 80,
          Tired: 60,
          Irritable: 40,
          Lethargic: 20,
        };
        return moodMap[value] || 50;
      }
      return 50;
    };

    const latestMeasurement = filteredMeasurements[0];
    const symptomRadarData = latestMeasurement
      ? [
          {
            symptom: "Hydration",
            score: latestMeasurement.overallScore || 0,
            fullMark: 100,
          },
          {
            symptom: "Urine Color",
            score: getSymptomScore(latestMeasurement.urineColor, "urine"),
            fullMark: 100,
          },
          {
            symptom: "Mouth",
            score: getSymptomScore(latestMeasurement.mouthDryness, "mouth"),
            fullMark: 100,
          },
          {
            symptom: "Mood",
            score: getSymptomScore(latestMeasurement.mood, "mood"),
            fullMark: 100,
          },
          {
            symptom: "GSR Level",
            score: Math.round(
              ((2400 - (latestMeasurement.gsrValue || 0)) / 2400) * 100,
            ),
            fullMark: 100,
          },
        ]
      : [];

    // Hydration Rate Calculation
    const excellentCount = filteredMeasurements.filter((m) =>
      m.hydrationRating?.includes("5 -"),
    ).length;
    const goodCount = filteredMeasurements.filter((m) =>
      m.hydrationRating?.includes("4 -"),
    ).length;
    const hydrationRate = (
      ((excellentCount + goodCount) / filteredMeasurements.length) *
      100
    ).toFixed(1);

    // Best Streak Calculation
    let currentStreak = 0;
    let longestStreak = 0;
    filteredMeasurements.forEach((m) => {
      if (
        m.hydrationRating?.includes("4 -") ||
        m.hydrationRating?.includes("5 -")
      ) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Score Comparison (Earlier vs Recent)
    const weeklyComparison = [];
    if (filteredMeasurements.length >= 2) {
      const mid = Math.floor(filteredMeasurements.length / 2);
      const firstHalf = filteredMeasurements.slice(0, mid);
      const secondHalf = filteredMeasurements.slice(mid);

      const firstAvg = (
        firstHalf.reduce((sum, m) => sum + (m.overallScore || 0), 0) /
        firstHalf.length
      ).toFixed(1);
      const secondAvg = (
        secondHalf.reduce((sum, m) => sum + (m.overallScore || 0), 0) /
        secondHalf.length
      ).toFixed(1);

      weeklyComparison.push(
        { period: "Earlier", score: Number(firstAvg) },
        { period: "Recent", score: Number(secondAvg) },
      );
    }

    // Risk Times (when scores are low)
    const dehydrationByHour = filteredMeasurements.reduce((acc, m) => {
      const hour = new Date(m.timestamp * 1000).getHours();
      const score = m.overallScore || 0;
      if (score < 60) {
        // Score below 60 = risk
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {});

    const riskTimes = Object.entries(dehydrationByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([hour, count]) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        incidents: count,
      }));

    // Symptom Frequency Analysis
    const urineColorFreq = {};
    const mouthDrynessFreq = {};
    const moodFreq = {};

    filteredMeasurements.forEach((m) => {
      if (m.urineColor)
        urineColorFreq[m.urineColor] = (urineColorFreq[m.urineColor] || 0) + 1;
      if (m.mouthDryness)
        mouthDrynessFreq[m.mouthDryness] =
          (mouthDrynessFreq[m.mouthDryness] || 0) + 1;
      if (m.mood) moodFreq[m.mood] = (moodFreq[m.mood] || 0) + 1;
    });

    const mostCommonUrine =
      Object.entries(urineColorFreq).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "N/A";
    const mostCommonMouth =
      Object.entries(mouthDrynessFreq).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "N/A";
    const mostCommonMood =
      Object.entries(moodFreq).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

    return {
      scoreTrendData,
      ratingDistribution,
      frequencyData,
      hourlyData,
      bmiData,
      symptomRadarData,
      weeklyComparison,
      riskTimes,
      stats: {
        avgScore,
        maxScore,
        minScore,
        hydrationRate,
        longestStreak,
        currentStreak,
        totalMeasurements: filteredMeasurements.length,
        avgBMI,
        mostCommonUrine,
        mostCommonMouth,
        mostCommonMood,
      },
    };
  }, [advancedMeasurements, timeRange]);

  const RATING_COLORS = {
    // Original names
    "Severely Dehydrated": "#ef4444",
    "Mildly Dehydrated": "#f97316",
    "Slightly Hydrated": "#f59e0b",
    "Well Hydrated": "#10b981",
    "Optimally Hydrated": "#059669",
    // ADD THESE - Your actual data names:
    "Slightly Dehydrated": "#f97316",
    Hydrated: "#10b981",
    "Overly Hydrated": "#2457ff",
  };

  if (!analyticsData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(to bottom right, #faf5ff, #eff6ff, #ecfeff)",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.6 }}>
            📊
          </div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "#6b7280",
              margin: "0 0 0.75rem 0",
            }}
          >
            No Advanced Analytics Data Yet
          </h3>
          <p style={{ fontSize: "1rem", color: "#9ca3af", margin: 0 }}>
            Complete advanced measurements to see comprehensive hydration
            insights!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-wrapper" ref={analyticsRef}>
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="header-left">
            <div className="header-title-row">
              <div className="header-icon-box">
                <BarChart3 className="header-icon" />
              </div>
              <h1 className="analytics-main-title">Advanced Analytics</h1>
            </div>
            <p className="analytics-subtitle">
              Comprehensive insights from multi-factor assessments
            </p>
          </div>

          <div className="header-actions">
            <div className="time-filter-group">
              <button
                className={`time-filter-btn ${
                  timeRange === "week" ? "active" : ""
                }`}
                onClick={() => setTimeRange("week")}
              >
                7 Days
              </button>
              <button
                className={`time-filter-btn ${
                  timeRange === "month" ? "active" : ""
                }`}
                onClick={() => setTimeRange("month")}
              >
                30 Days
              </button>
              <button
                className={`time-filter-btn ${
                  timeRange === "all" ? "active" : ""
                }`}
                onClick={() => setTimeRange("all")}
              >
                All Time
              </button>
            </div>
            <button
              className="download-btn"
              disabled={isGenerating}
              onClick={handleDownloadPDF}
            >
              <Download style={{ width: "1rem", height: "1rem" }} />
              {isGenerating ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="metrics-grid">
          <div className="metric-card metric-purple">
            <div className="metric-header">
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f3e8ff",
                  flexShrink: 0,
                }}
              >
                <Activity
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    color: "#9333ea",
                    strokeWidth: 2,
                  }}
                />
              </div>
              <span className="metric-badge metric-badge-green">
                {analyticsData.stats.avgScore >= 70
                  ? "Excellent"
                  : analyticsData.stats.avgScore >= 50
                    ? "Good"
                    : "Needs Improvement"}
              </span>
            </div>
            <p className="metric-label">AVG SCORE</p>
            <p className="metric-value">{analyticsData.stats.avgScore}/100</p>
          </div>

          <div className="metric-card metric-cyan">
            <div className="metric-header">
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#cffafe",
                  flexShrink: 0,
                }}
              >
                <Droplet
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    color: "#0891b2",
                    strokeWidth: 2,
                  }}
                />
              </div>
              <span className="metric-badge metric-badge-green">Optimal</span>
            </div>
            <p className="metric-label">Hydration Rate</p>
            <p className="metric-value">{analyticsData.stats.hydrationRate}%</p>
          </div>

          <div className="metric-card metric-orange">
            <div className="metric-header">
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ffedd5",
                  flexShrink: 0,
                }}
              >
                <TrendingUp
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    color: "#ea580c",
                    strokeWidth: 2,
                  }}
                />
              </div>
              <span className="metric-badge metric-badge-gray">Record</span>
            </div>
            <p className="metric-label">Best Streak</p>
            <p className="metric-value">
              {analyticsData.stats.longestStreak} days
            </p>
          </div>

          <div className="metric-card metric-blue">
            <div className="metric-header">
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#dbeafe",
                  flexShrink: 0,
                }}
              >
                <BarChart3
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    color: "#2563eb",
                    strokeWidth: 2,
                  }}
                />
              </div>
              <span className="metric-badge metric-badge-blue">Total</span>
            </div>
            <p className="metric-label">Assessments</p>
            <p className="metric-value">
              {analyticsData.stats.totalMeasurements}
            </p>
          </div>
        </div>

        {/* Secondary Cards */}
        <div className="secondary-grid">
          <div className="secondary-card">
            <div className="card-header">
              <Scale className="card-header-icon card-icon-blue" />
              <h3 className="card-title">BMI Tracking</h3>
            </div>
            <p className="card-description">Body Mass Index monitoring</p>
            <div className="gsr-range-display">
              <div className="gsr-range-item">
                <p className="gsr-range-label">Average BMI</p>
                <p className="gsr-range-value">{analyticsData.stats.avgBMI}</p>
              </div>
              <div className="gsr-gradient-bar"></div>
              <div className="gsr-range-item">
                <p className="gsr-range-label">Status</p>
                <p className="gsr-range-value" style={{ fontSize: "1rem" }}>
                  {analyticsData.stats.avgBMI < 18.5
                    ? "Under"
                    : analyticsData.stats.avgBMI < 25
                      ? "Normal"
                      : analyticsData.stats.avgBMI < 30
                        ? "Over"
                        : "Obese"}
                </p>
              </div>
            </div>
          </div>

          <div className="secondary-card streak-card">
            <div className="card-header">
              <TrendingUp className="card-header-icon card-icon-orange" />
              <h3 className="card-title">Current Streak</h3>
            </div>
            <p className="card-description">Consecutive optimal readings</p>
            <div className="streak-display">
              <div className="streak-number">
                {analyticsData.stats.currentStreak}
              </div>
              <div className="streak-info">
                <p className="streak-text">Days in a row</p>
                <p className="streak-progress">
                  {analyticsData.stats.longestStreak -
                    analyticsData.stats.currentStreak >
                  0
                    ? `${
                        analyticsData.stats.longestStreak -
                        analyticsData.stats.currentStreak
                      } more to beat your record!`
                    : "You're at your best!"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Symptom Analysis Card */}
        <div className="insights-section">
          <div className="section-header">
            <ThermometerSun
              style={{ width: "1.25rem", height: "1.25rem", color: "#f59e0b" }}
            />
            <h2 className="section-title">Multi-Factor Analysis</h2>
          </div>

          <div className="insights-grid">
            <div
              className="insight-card"
              style={{ borderLeft: "4px solid #8b5cf6" }}
            >
              <div className="card-header">
                <Smile className="card-header-icon card-icon-purple" />
                <h3 className="card-title">Common Symptoms</h3>
              </div>
              <p className="card-description">
                Most frequent indicators from your assessments
              </p>
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    background: "#faf5ff",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Urine Color:
                  </span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>
                    {analyticsData.stats.mostCommonUrine}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    background: "#faf5ff",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Mouth Dryness:
                  </span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>
                    {analyticsData.stats.mostCommonMouth}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    background: "#faf5ff",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Mood/Behavior:
                  </span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>
                    {analyticsData.stats.mostCommonMood}
                  </span>
                </div>
              </div>
            </div>

            {analyticsData.symptomRadarData.length > 0 && (
              <div
                className="insight-card"
                style={{ borderLeft: "4px solid #06b6d4" }}
              >
                <div className="card-header">
                  <Activity className="card-header-icon card-icon-cyan" />
                  <h3 className="card-title">Health Radar</h3>
                </div>
                <p className="card-description">Latest assessment breakdown</p>
                <div className="chart-wrapper chart-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={analyticsData.symptomRadarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="symptom"
                        style={{ fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        style={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Risk Times Section */}
        {analyticsData.riskTimes.length > 0 && (
          <div className="insights-section">
            <div className="section-header">
              <AlertTriangle
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  color: "#f59e0b",
                }}
              />
              <h2 className="section-title">Risk Analysis</h2>
            </div>

            <div className="insights-grid">
              <div className="insight-card">
                <div className="card-header">
                  <Clock className="card-header-icon card-icon-red" />
                  <h3 className="card-title">High Risk Times</h3>
                </div>
                <p className="card-description">
                  Times when low scores occur most
                </p>
                <div className="risk-times-list">
                  {analyticsData.riskTimes.map((time, idx) => (
                    <div key={idx} className="risk-time-row">
                      <span className="risk-time">{time.hour}</span>
                      <span className="risk-count">
                        {time.incidents} incidents
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {analyticsData.weeklyComparison.length > 0 && (
                <div className="insight-card">
                  <div className="card-header">
                    <Calendar className="card-header-icon card-icon-blue" />
                    <h3 className="card-title">Score Comparison</h3>
                  </div>
                  <p className="card-description">
                    Earlier vs. recent assessments
                  </p>
                  <div className="chart-wrapper chart-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.weeklyComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="period" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" domain={[0, 100]} />
                        <Tooltip />
                        <Bar
                          dataKey="score"
                          fill="#3b82f6"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="card-header">
              <TrendingUp className="card-header-icon card-icon-blue" />
              <h3 className="card-title">Score Trend</h3>
            </div>
            <p className="card-description">
              Overall hydration score over time
            </p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.scoreTrendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    stroke="#9ca3af"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    style={{ fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="card-header">
              <Activity className="card-header-icon card-icon-purple" />
              <h3 className="card-title">Hydration Rating Distribution</h3>
            </div>
            <p className="card-description">Breakdown of assessment ratings</p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.ratingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {analyticsData.ratingDistribution.map((entry, index) => {
                      // Get color based on entry name
                      const getColor = (name) => {
                        if (name.includes("Optimally") || name.includes("5"))
                          return "#059669";
                        if (name.includes("Well") || name.includes("4"))
                          return "#10b981";
                        if (name.includes("Slightly H") || name.includes("3"))
                          return "#f59e0b";
                        if (name.includes("Mildly") || name.includes("2"))
                          return "#f97316";
                        if (name.includes("Severely") || name.includes("1"))
                          return "#ef4444";
                        return RATING_COLORS[name] || "#94a3b8";
                      };

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={getColor(entry.name)}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="card-header">
              <Calendar className="card-header-icon card-icon-green" />
              <h3 className="card-title">Assessment Frequency</h3>
            </div>
            <p className="card-description">Measurements per day</p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="day"
                    stroke="#9ca3af"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="card-header">
              <Clock className="card-header-icon card-icon-cyan" />
              <h3 className="card-title">Hourly Pattern</h3>
            </div>
            <p className="card-description">When you assess most</p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    stroke="#9ca3af"
                    style={{ fontSize: 11 }}
                  />
                  <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: "#06b6d4", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {analyticsData.bmiData.length > 0 && (
            <div className="chart-card" style={{ gridColumn: "span 2" }}>
              <div className="card-header">
                <Scale className="card-header-icon card-icon-orange" />
                <h3 className="card-title">BMI Trend</h3>
              </div>
              <p className="card-description">Body Mass Index over time</p>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.bmiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      style={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      style={{ fontSize: 12 }}
                      domain={[15, 35]}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bmi"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: "#f97316", r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

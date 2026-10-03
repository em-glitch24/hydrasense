import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Droplet,
  Activity,
  Target,
  Calendar,
  Award,
} from "lucide-react";

export default function AdminAnalytics({
  users = [],
  advancedMeasurements = [],
  waterIntakes = [],
}) {
  const [timeRange, setTimeRange] = useState("week");

  // Filter data by time range
  const getFilteredData = (data) => {
    if (timeRange === "all") return data;

    const now = Date.now() / 1000;
    const days = timeRange === "week" ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60;

    return data.filter((item) => item.timestamp >= cutoff);
  };

  const filteredMeasurements = getFilteredData(advancedMeasurements);
  const filteredIntakes = getFilteredData(waterIntakes);

  const analyticsData = useMemo(() => {
    if (filteredMeasurements.length === 0 && filteredIntakes.length === 0) {
      return null;
    }

    // === ADVANCED MEASUREMENTS ANALYTICS ===

    // 1. Score Distribution
    const scoreRanges = {
      "80-100 (Excellent)": 0,
      "60-79 (Good)": 0,
      "40-59 (Fair)": 0,
      "20-39 (Poor)": 0,
      "0-19 (Critical)": 0,
    };

    filteredMeasurements.forEach((m) => {
      const score = m.overallScore || 0;
      if (score >= 80) scoreRanges["80-100 (Excellent)"]++;
      else if (score >= 60) scoreRanges["60-79 (Good)"]++;
      else if (score >= 40) scoreRanges["40-59 (Fair)"]++;
      else if (score >= 20) scoreRanges["20-39 (Poor)"]++;
      else scoreRanges["0-19 (Critical)"]++;
    });

    const scoreDistribution = Object.entries(scoreRanges).map(
      ([name, value]) => ({
        name,
        value,
        color: name.includes("Excellent")
          ? "#10b981"
          : name.includes("Good")
            ? "#06b6d4"
            : name.includes("Fair")
              ? "#f59e0b"
              : name.includes("Poor")
                ? "#f97316"
                : "#ef4444",
      }),
    );

    // 2. Average Score Trend by Day
    const dailyScores = {};
    filteredMeasurements.forEach((m) => {
      const date = new Date(m.timestamp * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!dailyScores[date]) {
        dailyScores[date] = { total: 0, count: 0 };
      }
      dailyScores[date].total += m.overallScore || 0;
      dailyScores[date].count++;
    });

    const scoreTrend = Object.entries(dailyScores).map(([date, data]) => ({
      date,
      avgScore: Math.round(data.total / data.count),
      assessments: data.count,
    }));

    // 3. User Performance Analysis
    const userScores = {};
    filteredMeasurements.forEach((m) => {
      if (!userScores[m.userId]) {
        userScores[m.userId] = { scores: [], count: 0 };
      }
      userScores[m.userId].scores.push(m.overallScore || 0);
      userScores[m.userId].count++;
    });

    const userPerformance = Object.entries(userScores)
      .map(([userId, data]) => {
        const user = users.find((u) => u.id === userId);
        const avgScore = Math.round(
          data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
        );

        return {
          userId,
          name: user?.name || "Unknown",
          email: user?.email || "",
          avgScore,
          assessments: data.count,
          status:
            avgScore >= 70
              ? "Excellent"
              : avgScore >= 50
                ? "Good"
                : "Needs Attention",
        };
      })
      .sort((a, b) => a.avgScore - b.avgScore);

    // Users needing attention (bottom 5 with score < 70)
    const usersAtRisk = userPerformance
      .filter((u) => u.avgScore < 70)
      .slice(0, 5);

    // Top performers (top 5)
    const topPerformers = [...userPerformance]
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // 4. Most Active Users (by assessment count)
    const mostActiveUsers = [...userPerformance]
      .sort((a, b) => b.assessments - a.assessments)
      .slice(0, 5);

    // === WATER INTAKE ANALYTICS ===

    // 5. Daily Goal Achievement Analysis
    const userIntakeData = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime() / 1000;

    // Get today's intakes per user
    filteredIntakes
      .filter((intake) => intake.timestamp >= todayTimestamp)
      .forEach((intake) => {
        if (!userIntakeData[intake.userId]) {
          userIntakeData[intake.userId] = 0;
        }
        userIntakeData[intake.userId] += intake.amount || 0;
      });

    // Classify users by goal achievement
    let goalsAchieved = 0;
    let moderate = 0;
    let underGoal = 0;

    Object.entries(userIntakeData).forEach(([userId, totalIntake]) => {
      const user = users.find((u) => u.id === userId);
      const goal = user?.dailyWaterGoal || 2500;
      const percentage = (totalIntake / goal) * 100;

      if (percentage >= 100) goalsAchieved++;
      else if (percentage >= 50) moderate++;
      else underGoal++;
    });

    const goalAchievementData = [
      { name: "Achieved Goal", value: goalsAchieved, color: "#10b981" },
      { name: "Moderate (50-99%)", value: moderate, color: "#f59e0b" },
      { name: "Under 50%", value: underGoal, color: "#ef4444" },
    ];

    // 6. Daily Intake Trend
    const dailyIntakes = {};
    filteredIntakes.forEach((intake) => {
      const date = new Date(intake.timestamp * 1000).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        },
      );
      dailyIntakes[date] = (dailyIntakes[date] || 0) + (intake.amount || 0);
    });

    const intakeTrend = Object.entries(dailyIntakes).map(([date, total]) => ({
      date,
      totalMl: total,
      totalL: (total / 1000).toFixed(1),
    }));

    // === OVERALL STATISTICS ===

    const avgScore =
      filteredMeasurements.length > 0
        ? Math.round(
            filteredMeasurements.reduce(
              (sum, m) => sum + (m.overallScore || 0),
              0,
            ) / filteredMeasurements.length,
          )
        : 0;

    const excellentCount = filteredMeasurements.filter(
      (m) => (m.overallScore || 0) >= 80,
    ).length;

    const excellentRate =
      filteredMeasurements.length > 0
        ? Math.round((excellentCount / filteredMeasurements.length) * 100)
        : 0;

    const activeUsers = new Set([
      ...filteredMeasurements.map((m) => m.userId),
      ...filteredIntakes.map((i) => i.userId),
    ]).size;

    const avgIntakePerUser =
      Object.keys(userIntakeData).length > 0
        ? Math.round(
            Object.values(userIntakeData).reduce((sum, v) => sum + v, 0) /
              Object.keys(userIntakeData).length,
          )
        : 0;

    const goalAchievementRate =
      activeUsers > 0 ? Math.round((goalsAchieved / activeUsers) * 100) : 0;

    // Compare with previous period
    const previousPeriodMeasurements = advancedMeasurements.filter((m) => {
      const now = Date.now() / 1000;
      const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 7;
      const currentCutoff = now - days * 24 * 60 * 60;
      const previousCutoff = currentCutoff - days * 24 * 60 * 60;
      return m.timestamp >= previousCutoff && m.timestamp < currentCutoff;
    });

    const previousAvgScore =
      previousPeriodMeasurements.length > 0
        ? Math.round(
            previousPeriodMeasurements.reduce(
              (sum, m) => sum + (m.overallScore || 0),
              0,
            ) / previousPeriodMeasurements.length,
          )
        : 0;

    const scoreChange = avgScore - previousAvgScore;

    return {
      scoreDistribution,
      scoreTrend,
      goalAchievementData,
      intakeTrend,
      usersAtRisk,
      topPerformers,
      mostActiveUsers,
      stats: {
        avgScore,
        scoreChange,
        excellentRate,
        activeUsers,
        totalAssessments: filteredMeasurements.length,
        totalIntakeLogs: filteredIntakes.length,
        avgIntakePerUser,
        goalAchievementRate,
        goalsAchieved,
        moderate,
        underGoal,
      },
    };
  }, [filteredMeasurements, filteredIntakes, users, timeRange]);

  if (!analyticsData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.6 }}>
          📊
        </div>
        <h3
          style={{
            fontSize: "1.5rem",
            color: "#6b7280",
            marginBottom: "0.5rem",
          }}
        >
          No Analytics Data Available
        </h3>
        <p style={{ color: "#9ca3af" }}>
          Waiting for users to start tracking their hydration...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.875rem",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "0.5rem",
            }}
          >
            System Analytics
          </h2>
          <p style={{ color: "#6b7280" }}>
            Advanced measurements and water intake insights across all users
          </p>
        </div>

        {/* Time Range Filter */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            background: "#f3f4f6",
            padding: "0.25rem",
            borderRadius: "0.5rem",
          }}
        >
          {["week", "month", "all"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                background: timeRange === range ? "white" : "transparent",
                color: timeRange === range ? "#111827" : "#6b7280",
                fontWeight: timeRange === range ? 600 : 400,
                cursor: "pointer",
                fontSize: "0.875rem",
                boxShadow:
                  timeRange === range ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              {range === "week"
                ? "7 Days"
                : range === "month"
                  ? "30 Days"
                  : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <MetricCard
          icon={<Activity />}
          label="Avg Hydration Score"
          value={`${analyticsData.stats.avgScore}/100`}
          change={analyticsData.stats.scoreChange}
          color="#8b5cf6"
        />
        <MetricCard
          icon={<Award />}
          label="Excellent Rate"
          value={`${analyticsData.stats.excellentRate}%`}
          subtitle="Scores 80+"
          color="#10b981"
        />
        <MetricCard
          icon={<Target />}
          label="Goal Achievement"
          value={`${analyticsData.stats.goalAchievementRate}%`}
          subtitle={`${analyticsData.stats.goalsAchieved} users reached goal today`}
          color="#06b6d4"
        />
        <MetricCard
          icon={<Users />}
          label="Active Users"
          value={analyticsData.stats.activeUsers}
          subtitle={`${analyticsData.stats.totalAssessments} assessments`}
          color="#f59e0b"
        />
      </div>

      {/* Main Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Score Distribution */}
        <ChartCard
          title="Hydration Score Distribution"
          subtitle="Assessment quality levels"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.scoreDistribution}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {analyticsData.scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Goal Achievement */}
        <ChartCard
          title="Daily Goal Achievement"
          subtitle="Today's water intake goals"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.goalAchievementData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${value} users`}
              >
                {analyticsData.goalAchievementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Trend Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Score Trend */}
        <ChartCard
          title="Average Score Trend"
          subtitle="Daily hydration scores"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.scoreTrend}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12 }} />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="avgScore"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Intake Trend */}
        <ChartCard
          title="Water Intake Trend"
          subtitle="Daily water consumption"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.intakeTrend}>
              <defs>
                <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="totalMl"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#colorIntake)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* User Tables */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Users Needing Attention */}
        {analyticsData.usersAtRisk.length > 0 && (
          <UserTable
            title="Users Needing Attention"
            subtitle="Lowest hydration scores"
            icon={<Droplet size={20} color="#ef4444" />}
            users={analyticsData.usersAtRisk}
            type="risk"
          />
        )}

        {/* Top Performers */}
        {analyticsData.topPerformers.length > 0 && (
          <UserTable
            title="Top Performers"
            subtitle="Highest hydration scores"
            icon={<Award size={20} color="#10b981" />}
            users={analyticsData.topPerformers}
            type="top"
          />
        )}

        {/* Most Active */}
        {analyticsData.mostActiveUsers.length > 0 && (
          <UserTable
            title="Most Active Users"
            subtitle="By assessment frequency"
            icon={<Activity size={20} color="#8b5cf6" />}
            users={analyticsData.mostActiveUsers}
            type="active"
          />
        )}
      </div>
    </div>
  );
}

// Reusable Components

function MetricCard({ icon, label, value, subtitle, change, color }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "0.5rem",
            background: `${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
          }}
        >
          {icon}
        </div>

        {change !== undefined && (
          <span
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              background: change >= 0 ? "#dcfce7" : "#fee2e2",
              color: change >= 0 ? "#166534" : "#991b1b",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            {change >= 0 ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {Math.abs(change)}
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: "0.875rem",
          color: "#6b7280",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "#111827",
          marginBottom: "0.25rem",
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{subtitle}</p>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "0.25rem",
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function UserTable({ title, subtitle, icon, users, type }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "0.75rem",
        border: "1px solid #e5e7eb",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {icon}
        <div>
          <h3
            style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}
          >
            {title}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "#6b7280",
                }}
              >
                User
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#6b7280",
                }}
              >
                Avg Score
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#6b7280",
                }}
              >
                Assessments
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 500, color: "#111827" }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      {user.email}
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    padding: "0.75rem",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {user.avgScore}/100
                </td>
                <td
                  style={{
                    padding: "0.75rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  {user.assessments}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

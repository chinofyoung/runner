"use client";

import {
  BarChart3,
  Settings,
  Search,
  Calendar,
  MoreVertical,
  ChevronRight,
  Target,
  Timer,
  TrendingUp,
  Heart,
  Footprints,
  Flame,
  MessageSquare,
  MessageCircle,
  Activity,
  MapPin,
  Clock,
  X,
  Send,
  Bot,
  CheckCircle,
  AlertCircle,
  Menu,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from "recharts";
import AIChat from "../components/AIChat";
import TrainingPlan from "../components/TrainingPlan";
import SavedPlans from "../components/SavedPlans";
import Zone2RunsWidget from "../components/Zone2RunsWidget";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Function to generate tracking data from Strava activities
const generateTrackingData = (stravaData: StravaData | null) => {
  if (
    !stravaData?.recentActivities ||
    stravaData.recentActivities.length === 0
  ) {
    // Fallback to demo data if no real data available
    return [
      {
        activityName: "Morning Run",
        speed: 18,
        pace: 3.3,
        distance: 5.2,
        date: "Dec 15",
      },
      {
        activityName: "Evening Jog",
        speed: 15,
        pace: 4.0,
        distance: 6.1,
        date: "Dec 17",
      },
      {
        activityName: "Speed Work",
        speed: 25,
        pace: 2.4,
        distance: 4.8,
        date: "Dec 19",
      },
      {
        activityName: "Long Run",
        speed: 28,
        pace: 2.1,
        distance: 7.3,
        date: "Dec 21",
      },
      {
        activityName: "Recovery Run",
        speed: 22,
        pace: 2.7,
        distance: 5.9,
        date: "Dec 23",
      },
      {
        activityName: "Hill Training",
        speed: 18,
        pace: 3.3,
        distance: 6.5,
        date: "Dec 25",
      },
      {
        activityName: "Easy Run",
        speed: 12,
        pace: 5.0,
        distance: 4.2,
        date: "Dec 27",
      },
      {
        activityName: "Tempo Run",
        speed: 20,
        pace: 3.0,
        distance: 8.1,
        date: "Dec 29",
      },
      {
        activityName: "Weekend Long",
        speed: 26,
        pace: 2.3,
        distance: 7.5,
        date: "Jan 2",
      },
    ];
  }

  // Use last 10 runs to show pace progression
  const recentRuns = stravaData.recentActivities.slice(0, 10).reverse();

  return recentRuns.map((run, index) => {
    // Convert pace (min/km) to speed (km/h)
    const speed = 60 / run.pace;

    // Format date for display
    const runDate = new Date(run.rawDate || run.date);
    const dateLabel = runDate.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    });

    // Truncate activity name for x-axis display
    const displayName =
      run.name.length > 15 ? run.name.substring(0, 15) + "..." : run.name;

    return {
      activityName: displayName,
      speed: Math.round(speed * 10) / 10, // Round to 1 decimal
      pace: run.pace,
      distance: run.distance,
      date: dateLabel,
      fullName: run.name,
      heartrate: run.heartrate || null,
      elevation: run.elevation || null,
    };
  });
};

interface StravaData {
  performanceData: Array<{
    month: string;
    pace: number;
    distance: number;
    calories: number;
    heartrate: number;
    runs: number;
  }>;
  weeklyData: Array<{
    week: string;
    fullWeek: string;
    distance: number;
    runs: number;
    weekStart: string;
    weekEnd: string;
  }>;
  recentActivities: Array<{
    id: number;
    name: string;
    date: string;
    rawDate: string;
    distance: number;
    duration: string;
    pace: number;
    calories: number;
    heartrate: number;
    elevation: number;
    type: string;
  }>;
  summary: {
    totalDistance: number;
    totalTime: number;
    avgPace: number;
    totalCalories: number;
    totalRuns: number;
    avgHeartrate: number;
  };
  isCachedData?: boolean;
  dataRange?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stravaData, setStravaData] = useState<StravaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");
  const [trainingPlanRefresh, setTrainingPlanRefresh] = useState(0);

  // Widget sizing and layout state
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetSizes, setWidgetSizes] = useState<{
    [key: string]: "small" | "medium" | "large";
  }>({
    todaysActivity: "medium",
    metrics: "medium",
    performanceChart: "large",
    trainingPlan: "large",
    recentRuns: "medium",
    zone2: "large",
  });
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    "todaysActivity",
    "metrics",
    "performanceChart",
    "trainingPlan",
    "recentRuns",
    "zone2",
  ]);

  // Drag and drop state
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<string | null>(null);

  // Mini chat state
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [miniChatMessages, setMiniChatMessages] = useState<
    Array<{
      id: string;
      content: string;
      sender: "ai" | "user";
      timestamp: Date;
    }>
  >([
    {
      id: "1",
      content: "Hi! Quick question about your training?",
      sender: "ai" as const,
      timestamp: new Date(),
    },
  ]);
  const [miniChatInput, setMiniChatInput] = useState("");
  const [miniChatLoading, setMiniChatLoading] = useState(false);
  const miniChatEndRef = useRef<HTMLDivElement>(null);

  // Widget sizing functions
  const getWidgetSpan = (size: "small" | "medium" | "large") => {
    switch (size) {
      case "small":
        return "1";
      case "medium":
        return "2";
      case "large":
        return "3";
      default:
        return "1";
    }
  };

  const getRowSpan = (
    widgetType: string,
    size: "small" | "medium" | "large"
  ) => {
    // Base row calculations - more conservative to prevent overlaps
    const baseRows = {
      todaysActivity: todaysActivity ? 3 : 4,
      metrics: 3,
      performanceChart: 6,
      trainingPlan: 6,
      recentRuns: 5,
      zone2: 6,
    };

    // Adjust based on widget size
    const sizeMultiplier = {
      small: 0.8,
      medium: 1.0,
      large: 1.2,
    };

    const baseSpan = baseRows[widgetType as keyof typeof baseRows] || 3;
    return Math.max(2, Math.ceil(baseSpan * sizeMultiplier[size]));
  };

  const updateWidgetSize = (
    widgetId: string,
    size: "small" | "medium" | "large"
  ) => {
    setWidgetSizes((prev) => ({
      ...prev,
      [widgetId]: size,
    }));
  };

  // Layout management functions
  const saveLayout = async () => {
    try {
      const layoutData = {
        widgetSizes,
        widgetOrder,
      };

      // Save to localStorage as fallback
      localStorage.setItem("dashboardLayout", JSON.stringify(layoutData));

      // Here you could also save to a backend API
      // await fetch('/api/dashboard-layout', { method: 'POST', body: JSON.stringify(layoutData) });

      setIsEditMode(false);

      // Show success feedback
      // You could add a toast notification here
      console.log("Layout saved successfully!");
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };

  const loadLayout = () => {
    try {
      const savedLayout = localStorage.getItem("dashboardLayout");
      if (savedLayout) {
        const layoutData = JSON.parse(savedLayout);
        if (layoutData.widgetSizes) {
          setWidgetSizes(layoutData.widgetSizes);
        }
        if (layoutData.widgetOrder) {
          setWidgetOrder(layoutData.widgetOrder);
        }
      }
    } catch (error) {
      console.error("Failed to load layout:", error);
    }
  };

  const resetLayout = () => {
    setWidgetSizes({
      todaysActivity: "medium",
      metrics: "medium",
      performanceChart: "large",
      trainingPlan: "large",
      recentRuns: "medium",
      zone2: "large",
    });
    setWidgetOrder([
      "todaysActivity",
      "metrics",
      "performanceChart",
      "trainingPlan",
      "recentRuns",
      "zone2",
    ]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    if (!isEditMode) return;
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", widgetId);
  };

  const handleDragOver = (e: React.DragEvent, widgetId: string) => {
    if (!isEditMode || !draggedWidget) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverWidget(widgetId);
  };

  const handleDragLeave = () => {
    setDragOverWidget(null);
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    if (!isEditMode || !draggedWidget) return;
    e.preventDefault();

    if (draggedWidget === targetWidgetId) {
      setDraggedWidget(null);
      setDragOverWidget(null);
      return;
    }

    const newOrder = [...widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedWidget);
    const targetIndex = newOrder.indexOf(targetWidgetId);

    // Remove the dragged widget from its current position
    newOrder.splice(draggedIndex, 1);
    // Insert it at the target position
    newOrder.splice(targetIndex, 0, draggedWidget);

    setWidgetOrder(newOrder);
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const WidgetResizeControls = ({
    widgetId,
    currentSize,
  }: {
    widgetId: string;
    currentSize: "small" | "medium" | "large";
  }) => {
    if (!isEditMode) return null;

    return (
      <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        {/* Drag Handle */}
        <div
          className="w-6 h-6 rounded text-xs font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors cursor-move flex items-center justify-center"
          title="Drag to reorder"
        >
          ⋮⋮
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateWidgetSize(widgetId, "small");
          }}
          className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
            currentSize === "small"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          title="1/3 width"
        >
          S
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateWidgetSize(widgetId, "medium");
          }}
          className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
            currentSize === "medium"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          title="1/2 width"
        >
          M
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateWidgetSize(widgetId, "large");
          }}
          className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
            currentSize === "large"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          title="Full width"
        >
          L
        </button>
      </div>
    );
  };

  const getTodaysActivity = () => {
    if (
      !stravaData?.recentActivities ||
      stravaData.recentActivities.length === 0
    ) {
      return null;
    }

    const today = new Date().toDateString();
    return stravaData.recentActivities.find((activity) => {
      const activityDate = new Date(activity.rawDate || activity.date);
      return activityDate.toDateString() === today;
    });
  };

  // Dynamic widget rendering function
  const renderWidget = (widgetId: string) => {
    const getWidgetClasses = (widgetId: string) => {
      const baseClasses = "group relative";
      const editModeClasses = isEditMode
        ? "ring-2 ring-blue-200 hover:ring-blue-300"
        : "";
      const dragClasses = `${draggedWidget === widgetId ? "opacity-50" : ""} ${
        dragOverWidget === widgetId ? "ring-4 ring-blue-400" : ""
      }`;

      if (widgetId === "trainingPlan") {
        return `${baseClasses} ${editModeClasses} ${dragClasses}`;
      }

      return `bg-white rounded-xl shadow-sm p-4 sm:p-6 ${baseClasses} ${editModeClasses} ${dragClasses}`;
    };

    const getWidgetProps = (widgetId: string) => ({
      className: getWidgetClasses(widgetId),
      style: {
        gridRowEnd: `span ${getRowSpan(widgetId, widgetSizes[widgetId])}`,
        gridColumnEnd: `span ${getWidgetSpan(widgetSizes[widgetId])}`,
      },
      draggable: isEditMode,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, widgetId),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, widgetId),
      onDragLeave: handleDragLeave,
      onDrop: (e: React.DragEvent) => handleDrop(e, widgetId),
      onDragEnd: handleDragEnd,
    });

    const todaysActivity = getTodaysActivity();

    switch (widgetId) {
      case "todaysActivity":
        return (
          <div key={widgetId} {...getWidgetProps(widgetId)}>
            <WidgetResizeControls
              widgetId={widgetId}
              currentSize={widgetSizes[widgetId]}
            />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Today's Activity
              </h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            {todaysActivity ? (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏃</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {todaysActivity.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>{todaysActivity.distance}km</span>
                    <span>•</span>
                    <span>{todaysActivity.duration}</span>
                    <span>•</span>
                    <span>{todaysActivity.pace}'/km</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {todaysActivity.calories}
                  </div>
                  <div className="text-xs text-gray-500">calories</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏃‍♂️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  No activity today yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Ready to get moving? Your next run is waiting!
                </p>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors">
                  Plan Today's Run
                </button>
              </div>
            )}
          </div>
        );

      case "metrics":
        return (
          <div key={widgetId} {...getWidgetProps(widgetId)}>
            <WidgetResizeControls
              widgetId={widgetId}
              currentSize={widgetSizes[widgetId]}
            />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Key Metrics
              </h2>
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {stravaData?.summary.totalCalories || 520}
                </div>
                <div className="text-xs text-gray-500">kcal</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {stravaData?.summary.avgHeartrate || 102}
                </div>
                <div className="text-xs text-gray-500">bpm</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Footprints className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {Math.round((stravaData?.summary.totalDistance || 67) * 1300)}
                </div>
                <div className="text-xs text-gray-500">steps</div>
              </div>
            </div>
          </div>
        );

      case "performanceChart":
        return (
          <div key={widgetId} {...getWidgetProps(widgetId)}>
            <WidgetResizeControls
              widgetId={widgetId}
              currentSize={widgetSizes[widgetId]}
            />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Recent Pace Trends
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {stravaData?.recentActivities &&
                  stravaData.recentActivities.length > 0
                    ? `Your last ${Math.min(
                        stravaData.recentActivities.length,
                        10
                      )} runs`
                    : "Your running speed over time"}
                </p>
              </div>
              {stravaData?.isCachedData && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Cached Data
                </span>
              )}
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackingData}>
                  <XAxis
                    dataKey="activityName"
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold text-gray-800 mb-2">
                              {data.fullName || data.activityName}
                            </p>
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-600">
                                <span className="font-medium">Date:</span>{" "}
                                {data.date}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Speed:</span>{" "}
                                {data.speed} km/h
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Pace:</span>{" "}
                                {data.pace}'/km
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Distance:</span>{" "}
                                {data.distance} km
                              </p>
                              {data.heartrate && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Avg HR:</span>{" "}
                                  {data.heartrate} bpm
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="speed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "trainingPlan":
        return (
          <div
            key={widgetId}
            {...getWidgetProps(widgetId)}
            className={`${getWidgetClasses(widgetId)} ${
              isEditMode ? "rounded-xl" : ""
            }`}
          >
            <WidgetResizeControls
              widgetId={widgetId}
              currentSize={widgetSizes[widgetId]}
            />
            <TrainingPlan refreshTrigger={trainingPlanRefresh} />
          </div>
        );

      case "recentRuns":
        return (
          <div key={widgetId} {...getWidgetProps(widgetId)}>
            <WidgetResizeControls
              widgetId={widgetId}
              currentSize={widgetSizes[widgetId]}
            />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">Recent Runs</h3>
                <p className="text-xs text-gray-500">
                  {stravaConnected
                    ? "Your latest activities"
                    : "Connect Strava to see runs"}
                </p>
              </div>
              <button
                onClick={() => router.push("/runs")}
                className="text-green-500 text-xs font-medium hover:underline"
              >
                View All →
              </button>
            </div>
            {stravaData?.recentActivities &&
            stravaData.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {stravaData.recentActivities.slice(0, 4).map((run) => (
                  <div
                    key={run.id}
                    className="group p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs">🏃</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm truncate group-hover:text-green-800 transition-colors">
                          {run.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-1">{run.date}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>{run.distance}km</span>
                          <span>•</span>
                          <span>{run.duration}</span>
                          <span>•</span>
                          <span>{run.pace}'/km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !stravaConnected ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🏃‍♂️</span>
                </div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">
                  Connect Strava
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  See your recent runs here
                </p>
                <button
                  onClick={() => router.push("/settings")}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-orange-600 transition-colors"
                >
                  Connect →
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🏃‍♂️</span>
                </div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">
                  No Recent Runs
                </h4>
                <p className="text-xs text-gray-600">
                  Your activities will appear here
                </p>
              </div>
            )}
          </div>
        );

      case "zone2":
        return (
          <div key={widgetId} {...getWidgetProps(widgetId)}>
            <WidgetResizeControls
              widgetId={widgetId}
              currentSize={widgetSizes[widgetId]}
            />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">
                  Zone 2 / Easy Runs
                </h3>
                <p className="text-xs text-gray-500">
                  {stravaConnected
                    ? "Aerobic base training runs"
                    : "Connect Strava to analyze zones"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-xs text-gray-500">Zone 2</span>
              </div>
            </div>
            <Zone2RunsWidget stravaConnected={stravaConnected} />
          </div>
        );

      default:
        return null;
    }
  };

  const syncStravaData = async () => {
    try {
      setSyncing(true);
      setSyncProgress(0);
      setSyncMessage("Starting sync...");

      const response = await fetch("/api/strava/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.progress !== undefined) {
                  setSyncProgress(data.progress);
                }
                if (data.message) {
                  setSyncMessage(data.message);
                }
                if (data.completed) {
                  setSyncMessage("Sync completed successfully!");
                  // Refresh data after successful sync
                  setTimeout(() => {
                    fetchStravaData();
                    fetchSyncStatus();
                  }, 1000);
                }
              } catch (e) {
                // Ignore parsing errors for non-JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncMessage("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
      setTimeout(() => {
        setSyncProgress(0);
        setSyncMessage("");
      }, 3000);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/strava/status");
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
        setStravaConnected(data.connected);
      }
    } catch (error) {
      console.error("Error fetching sync status:", error);
    }
  };

  const fetchStravaData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/strava/activities-cached");

      if (response.ok) {
        const data = await response.json();
        setStravaData(data);
        setStravaConnected(data.connected);
      } else {
        console.error("Failed to fetch Strava data");
        setStravaConnected(false);
      }
    } catch (error) {
      console.error("Error fetching Strava data:", error);
      setStravaConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMiniChatSend = async () => {
    if (!miniChatInput.trim() || miniChatLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: miniChatInput,
      sender: "user" as const,
      timestamp: new Date(),
    };

    setMiniChatMessages((prev) => [...prev, userMessage]);
    const currentInput = miniChatInput;
    setMiniChatInput("");
    setMiniChatLoading(true);

    try {
      // Prepare conversation history for Claude
      const conversationHistory = miniChatMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: conversationHistory.slice(-6), // Keep last 6 messages for context in mini chat
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: "ai" as const,
        timestamp: new Date(),
      };

      setMiniChatMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I'm having trouble responding right now. Please try again.",
        sender: "ai" as const,
        timestamp: new Date(),
      };
      setMiniChatMessages((prev) => [...prev, errorResponse]);
    } finally {
      setMiniChatLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchStravaData(), fetchSyncStatus()]);
      setLoading(false);

      // Load saved layout
      loadLayout();
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (miniChatEndRef.current) {
      miniChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [miniChatMessages]);

  const trackingData = generateTrackingData(stravaData);
  const todaysActivity = getTodaysActivity();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Cb</span>
              </div>
              <span className="font-bold text-xl text-gray-800">ChinoBot</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 font-medium text-green-500"
              >
                <Activity className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => router.push("/progress")}
                className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-700"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => router.push("/chat")}
                className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-700"
              >
                <MessageSquare className="w-5 h-5" />
                <span>AI Coach</span>
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-700"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search */}
            <div className="relative hidden sm:block">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search here..."
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-green-500 w-48 lg:w-64 text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* AI Chat Button (Mobile) */}
            <button
              onClick={() => setShowAIPopup(true)}
              className="md:hidden p-2 text-green-500 hover:text-green-600 bg-green-50 rounded-lg"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div>
          <div className="mb-6 sm:mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Welcome back, Chino! 🏃‍♂️
              </h1>
              <p className="text-gray-600">
                Here's your training overview and today's insights
              </p>
            </div>

            {/* Layout Controls */}
            <div className="flex items-center space-x-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={resetLayout}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveLayout}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Save Layout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit Layout</span>
                </button>
              )}
            </div>
          </div>

          {/* Strava Connection Notice */}
          {!stravaConnected && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">
                    Connect to Strava for Real Data
                  </h3>
                  <p className="text-orange-700 mb-4">
                    Connect your Strava account to see your actual running
                    activities, progress, and performance metrics instead of
                    placeholder data.
                  </p>
                  <button
                    onClick={() => router.push("/settings")}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Connect Strava →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode Notice */}
          {isEditMode && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-800 font-medium">
                  Edit Mode Active
                </span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Drag widgets using the ⋮⋮ handle to reorder them, or use S/M/L
                buttons to resize. Click Save Layout when done.
              </p>
            </div>
          )}

          {/* Dashboard Content - Masonry Grid */}
          <div
            className={`grid gap-4 sm:gap-6 ${
              isEditMode ? "transition-all duration-300" : ""
            }`}
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gridAutoRows: "minmax(120px, auto)",
              gridAutoFlow: "row",
            }}
          >
            {/* Dynamic Widget Rendering */}
            {widgetOrder.map((widgetId) => renderWidget(widgetId))}
          </div>
        </div>
      </main>

      {/* Floating AI Coach Chat Button */}
      <button
        onClick={() => setShowAIPopup(!showAIPopup)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* AI Coach Popup */}
      {showAIPopup && (
        <div className="fixed bottom-4 sm:bottom-24 right-4 sm:right-6 w-full max-w-sm sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-slide-in-from-bottom mx-4 sm:mx-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">AI Coach</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowAIPopup(false);
                    router.push("/chat");
                  }}
                  className="text-green-500 text-xs font-medium hover:underline"
                >
                  Full Chat →
                </button>
                <button
                  onClick={() => setShowAIPopup(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {miniChatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg text-sm ${
                    message.sender === "user"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {miniChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[75%]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={miniChatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={miniChatInput}
                onChange={(e) => setMiniChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleMiniChatSend();
                  }
                }}
                placeholder="Ask about training..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                disabled={miniChatLoading}
              />
              <button
                onClick={handleMiniChatSend}
                disabled={miniChatLoading || !miniChatInput.trim()}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

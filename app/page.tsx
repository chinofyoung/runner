"use client";

import {
  BarChart3,
  Settings,
  Search,
  Bell,
  User,
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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import AIChat from "./components/AIChat";
import TrainingPlan from "./components/TrainingPlan";
import SavedPlans from "./components/SavedPlans";
import { useState, useEffect, useRef } from "react";

// Function to generate tracking data from Strava activities
const generateTrackingData = (stravaData: StravaData | null) => {
  if (!stravaData?.recentActivities || stravaData.recentActivities.length === 0) {
    // Fallback to demo data if no real data available
    return [
      { time: "6:00", speed: 18 },
      { time: "6:20", speed: 15 },
      { time: "6:40", speed: 25 },
      { time: "7:00", speed: 28 },
      { time: "7:20", speed: 22 },
      { time: "7:40", speed: 18 },
      { time: "8:00", speed: 12 },
    ];
  }

  // Use last 7 runs to show pace progression
  const recentRuns = stravaData.recentActivities.slice(0, 7).reverse();
  
  return recentRuns.map((run, index) => {
    // Convert pace (min/km) to speed (km/h)
    const speed = 60 / run.pace;
    
    // Create time labels based on run order
    const baseTime = new Date();
    baseTime.setHours(6, 0, 0, 0);
    baseTime.setMinutes(baseTime.getMinutes() + (index * 20));
    
    return {
      time: baseTime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      speed: Math.round(speed * 10) / 10, // Round to 1 decimal
      runName: run.name.length > 15 ? run.name.substring(0, 15) + '...' : run.name,
      pace: run.pace
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
  }>;
  weeklyData: Array<{
    week: string;
    distance: number;
    runs: number;
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

type ActiveTab = "dashboard" | "progress" | "chat" | "settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [stravaData, setStravaData] = useState<StravaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [showAIPopup, setShowAIPopup] = useState(false);
  
  // Mini chat state
  const [miniChatMessages, setMiniChatMessages] = useState<Array<{
    id: string;
    content: string;
    sender: "user" | "ai";
    timestamp: Date;
  }>>([
    {
      id: "1",
      content: "Hi! I'm your AI running coach. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [miniChatInput, setMiniChatInput] = useState("");
  const [miniChatLoading, setMiniChatLoading] = useState(false);
  const miniChatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of mini chat
  useEffect(() => {
    if (showAIPopup && miniChatEndRef.current) {
      miniChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [miniChatMessages, showAIPopup]);

  // Get today's activity
  const getTodaysActivity = () => {
    if (!stravaData?.recentActivities) return null;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return stravaData.recentActivities.find(activity => {
      return activity.rawDate === today;
    });
  };

  const todaysActivity = getTodaysActivity();

  const syncStravaData = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/strava/sync", {
        method: "POST",
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh data after successful sync
        await fetchStravaData();
        await fetchSyncStatus();
      } else {
        console.error("Sync failed:", result.message);
      }
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/strava/sync");
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    }
  };

  const fetchStravaData = async () => {
    try {
      // Try cached data first, fallback to direct API
      const [cachedResponse, statusResponse] = await Promise.all([
        fetch("/api/strava/activities-cached"),
        fetch("/api/strava/status"),
      ]);

      const statusData = await statusResponse.json();
      setStravaConnected(statusData.connected);

      if (cachedResponse.ok) {
        const cachedData = await cachedResponse.json();
        setStravaData(cachedData);
      } else if (cachedResponse.status === 404) {
        // No cached data, try direct API
        const activitiesResponse = await fetch("/api/strava/activities");
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setStravaData(activitiesData);
        } else {
          // Set empty data structure for disconnected state
          setStravaData({
            performanceData: [],
            weeklyData: [],
            recentActivities: [],
            summary: {
              totalDistance: 0,
              totalTime: 0,
              avgPace: 0,
              totalCalories: 0,
              totalRuns: 0,
              avgHeartrate: 0,
            },
          });
        }
      } else {
        throw new Error("Failed to fetch activities");
      }
    } catch (error) {
      console.error("Failed to fetch Strava data:", error);
      // Set empty data structure on error
      setStravaData({
        performanceData: [],
        weeklyData: [],
        recentActivities: [],
        summary: {
          totalDistance: 0,
          totalTime: 0,
          avgPace: 0,
          totalCalories: 0,
          totalRuns: 0,
          avgHeartrate: 0,
        },
      });
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

    setMiniChatMessages(prev => [...prev, userMessage]);
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

      setMiniChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        sender: "ai" as const,
        timestamp: new Date(),
      };
      setMiniChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setMiniChatLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStravaData(),
        fetchSyncStatus()
      ]);
      setLoading(false);
    };

    initializeData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="font-bold text-xl text-gray-800">Fitflex</span>
            </div>

            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center space-x-2 font-medium ${
                  activeTab === "dashboard"
                    ? "text-green-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Activity className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("progress")}
                className={`flex items-center space-x-2 font-medium ${
                  activeTab === "progress"
                    ? "text-green-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center space-x-2 font-medium ${
                  activeTab === "chat"
                    ? "text-green-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>AI Coach</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center space-x-2 font-medium ${
                  activeTab === "settings"
                    ? "text-green-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search here..."
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-green-500 w-64 text-gray-900 placeholder-gray-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-gray-700">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, Runner! 🏃‍♂️
              </h1>
              <p className="text-gray-600">
                Here's your training overview and today's insights
              </p>
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
                      onClick={() => setActiveTab("settings")}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                      Connect Strava →
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Today's Run Card */}
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path
                        d="M20,80 Q40,60 60,80 T100,80 L100,100 L20,100 Z"
                        fill="currentColor"
                      />
                      <path
                        d="M0,90 Q20,70 40,90 T80,90 L80,100 L0,100 Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold mb-4">
                      Today's Achievement
                    </h3>
                    {todaysActivity ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <Target className="w-5 h-5" />
                          <div>
                            <div className="text-sm opacity-90">Distance</div>
                            <div className="font-bold text-lg">{todaysActivity.distance} km</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Timer className="w-5 h-5" />
                          <div>
                            <div className="text-sm opacity-90">Duration</div>
                            <div className="font-bold text-lg">{todaysActivity.duration}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-5 h-5" />
                          <div>
                            <div className="text-sm opacity-90">Pace</div>
                            <div className="font-bold text-lg">{todaysActivity.pace}'/km</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Heart className="w-5 h-5" />
                          <div>
                            <div className="text-sm opacity-90">Heart Rate</div>
                            <div className="font-bold text-lg">
                              {todaysActivity.heartrate > 0 ? `${todaysActivity.heartrate} bpm` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="flex items-center justify-center mb-3">
                          <Calendar className="w-8 h-8 opacity-60" />
                        </div>
                        <div className="text-lg font-medium opacity-90 mb-1">
                          No run today yet
                        </div>
                        <div className="text-sm opacity-70">
                          {stravaConnected 
                            ? "Time to get moving!" 
                            : "Connect Strava to see today's activity"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking History */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Pace History
                      </h2>
                      <p className="text-gray-500">
                        {stravaData?.summary.avgPace 
                          ? `Your average pace is ${stravaData.summary.avgPace}'/km` 
                          : "Your running pace progression"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span>Recent Runs</span>
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={generateTrackingData(stravaData)}>
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis hide />
                        <Bar
                          dataKey="speed"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="bg-black text-white px-4 py-2 rounded-full">
                      <span className="text-2xl font-bold">
                        {stravaData?.summary.avgPace 
                          ? Math.round(60 / stravaData.summary.avgPace * 10) / 10
                          : "12.5"}
                      </span>
                      <span className="text-sm ml-1">km/h</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <Flame className="w-6 h-6 text-orange-500" />
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-800">
                        {stravaData?.summary.totalCalories || 520}
                      </div>
                      <div className="text-sm text-gray-500">kcal</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Calories</div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <Heart className="w-6 h-6 text-red-500" />
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-800">
                        {stravaData?.summary.avgHeartrate || 102}
                      </div>
                      <div className="text-sm text-gray-500">bpm</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Heart Rate</div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <Footprints className="w-6 h-6 text-purple-500" />
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-800">
                        {Math.round(
                          (stravaData?.summary.totalDistance || 67) * 1300
                        )}
                      </div>
                      <div className="text-sm text-gray-500">steps</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Steps</div>
                  </div>
                </div>


              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Recent Runs */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Recent Runs
                      </h3>
                      <p className="text-xs text-gray-500">
                        {stravaConnected
                          ? "Your latest activities"
                          : "Connect Strava to see runs"}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("progress")}
                      className="text-green-500 text-xs font-medium hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                              <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : stravaData?.recentActivities &&
                    stravaData.recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {stravaData.recentActivities
                        .slice(0, 3)
                        .map((run, index) => (
                          <div
                            key={run.id}
                            className="group p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs">🏃</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 text-sm truncate group-hover:text-green-800 transition-colors">
                                  {run.name}
                                </h4>
                                <p className="text-xs text-gray-500 mb-1">
                                  {run.date}
                                </p>
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
                        onClick={() => setActiveTab("settings")}
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




              </div>
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Training Progress
              </h1>
              <p className="text-gray-600">
                Track your performance and achievements
              </p>
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
                      No Real Data Available
                    </h3>
                    <p className="text-orange-700 mb-4">
                      Connect your Strava account to see your actual training
                      progress, performance charts, and running statistics.
                    </p>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                      Connect Strava →
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Performance Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Pace Improvement
                  </h2>
                  {loading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-gray-500">
                        Loading performance data...
                      </div>
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stravaData?.performanceData || []}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Line
                            type="monotone"
                            dataKey="pace"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ fill: "#10B981", r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Weekly Distance Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Weekly Distance
                  </h2>
                  {loading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-gray-500">
                        Loading weekly data...
                      </div>
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stravaData?.weeklyData || []}>
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Bar
                            dataKey="distance"
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Training Summary
                  </h2>
                  {loading ? (
                    <div className="text-gray-500">Loading summary...</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {stravaData?.summary.totalDistance || 0}km
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Distance
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {stravaData?.summary.totalRuns || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Runs</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {stravaData?.summary.avgPace || 0}'
                        </div>
                        <div className="text-sm text-gray-600">Avg Pace</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {stravaData?.summary.avgHeartrate || 0}
                        </div>
                        <div className="text-sm text-gray-600">Avg HR</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Saved Training Plans */}
                <SavedPlans />
              </div>

              <div>
                <TrainingPlan />
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                AI Running Coach
              </h1>
              <p className="text-gray-600">
                Get personalized training advice and motivation
              </p>
            </div>

            <div className="h-[600px]">
              <AIChat />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Settings
              </h1>
              <p className="text-gray-600">
                Connect your accounts and manage preferences
              </p>
            </div>

            <div className="max-w-2xl">
              {/* Strava Connection */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Strava
                      </h3>
                      <p className="text-sm text-gray-600">
                        Connect to sync your real running activities
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {stravaConnected ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600 font-medium">
                            Connected
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await fetch("/api/strava/status", {
                                method: "DELETE",
                              });
                              setStravaConnected(false);
                              // Refresh data
                              window.location.reload();
                            } catch (error) {
                              console.error("Failed to disconnect:", error);
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <a
                        href="/api/strava/auth"
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                      >
                        <span>Connect to Strava</span>
                      </a>
                    )}
                  </div>
                </div>
                {stravaConnected && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ Your Strava account is connected! Real activity data is
                      being used in your progress charts and metrics.
                    </p>
                  </div>
                )}
                {!stravaConnected && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Connect your Strava account to automatically sync your
                      running activities and get real performance insights.
                    </p>
                  </div>
                )}
              </div>

              {/* Sync Activities */}
              {stravaConnected && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Sync Activities
                      </h3>
                      <p className="text-sm text-gray-600">
                        Sync all your Strava activities to enable faster loading and AI recommendations
                      </p>
                    </div>
                    <button
                      onClick={syncStravaData}
                      disabled={syncing}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        syncing
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {syncing ? "Syncing..." : "Sync Now"}
                    </button>
                  </div>
                  
                  {syncStatus && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Last Sync</span>
                        <span className="text-gray-800">
                          {syncStatus.lastSync 
                            ? new Date(syncStatus.lastSync.started_at).toLocaleDateString("en", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Activities in Cache</span>
                        <span className="text-gray-800 font-medium">
                          {syncStatus.totalActivities || 0}
                        </span>
                      </div>
                      {syncStatus.lastSync && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Sync Status</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            syncStatus.lastSync.status === 'completed' 
                              ? "bg-green-100 text-green-800"
                              : syncStatus.lastSync.status === 'failed'
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {syncStatus.lastSync.status}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!syncStatus?.hasData && stravaConnected && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 First time setup: Click "Sync Now" to cache all your Strava activities for faster loading and better AI recommendations.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Data Status */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Data Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Data Source</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        syncStatus?.hasData
                          ? "bg-green-100 text-green-800"
                          : stravaConnected
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {syncStatus?.hasData 
                        ? "Cached Strava Data" 
                        : stravaConnected 
                        ? "Live Strava Data" 
                        : "Demo Data"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Activities Shown</span>
                    <span className="text-gray-800 font-medium">
                      {stravaData?.summary.totalRuns || 0} runs
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Distance</span>
                    <span className="text-gray-800 font-medium">
                      {stravaData?.summary.totalDistance || 0} km
                    </span>
                  </div>
                  {stravaData?.isCachedData && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Data Range</span>
                      <span className="text-gray-800 font-medium">
                        {stravaData.dataRange || "All time"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Coach Chat Button */}
      <button
        onClick={() => setShowAIPopup(!showAIPopup)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* AI Coach Popup */}
      {showAIPopup && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in slide-in-from-bottom-2 duration-200">
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
                    setActiveTab("chat");
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
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {miniChatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-green-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            
                         {miniChatLoading && (
               <div className="flex justify-start">
                 <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[75%]">
                   <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
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
                placeholder="Ask me about running..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                disabled={miniChatLoading}
              />
              <button
                onClick={handleMiniChatSend}
                disabled={miniChatLoading || !miniChatInput.trim()}
                className={`p-2 rounded-lg transition-colors ${
                  miniChatLoading || !miniChatInput.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
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

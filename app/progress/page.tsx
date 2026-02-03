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
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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

export default function Progress() {
  const router = useRouter();
  const [stravaData, setStravaData] = useState<StravaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [miniChatInput, setMiniChatInput] = useState("");
  const [miniChatLoading, setMiniChatLoading] = useState(false);
  const miniChatEndRef = useRef<HTMLDivElement>(null);

  const fetchStravaData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/strava/activities-cached");

      if (response.ok) {
        const data = await response.json();
        setStravaData(data);
        setStravaConnected(data.connected);
      } else {
        // Only log error if it's not a 401 (not connected) status
        if (response.status !== 401) {
          console.error("Failed to fetch Strava data");
        }
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
      sender: "user" as "user" | "ai",
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
        sender: "ai" as "user" | "ai",
        timestamp: new Date(),
      };

      setMiniChatMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I'm having trouble responding right now. Please try again.",
        sender: "ai" as "user" | "ai",
        timestamp: new Date(),
      };
      setMiniChatMessages((prev) => [...prev, errorResponse]);
    } finally {
      setMiniChatLoading(false);
    }
  };

  useEffect(() => {
    fetchStravaData();
  }, []);

  useEffect(() => {
    if (miniChatEndRef.current) {
      miniChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [miniChatMessages]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Cb</span>
            </div>
            <span className="font-bold text-xl text-white">ChinoBot</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAIPopup(true)}
              className="p-2 text-green-400 hover:text-green-300 bg-gray-700 rounded-lg"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="p-2 text-gray-400 hover:text-gray-200 bg-gray-700/50 rounded-lg"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 pb-24 text-white">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Training Progress 📊
          </h1>
          <p className="text-gray-400">
            Track your performance trends and achievements
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="h-32 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">
                    Monthly Performance
                  </h3>
                  <p className="text-sm text-gray-400">
                    {stravaData?.isCachedData
                      ? "Cached performance data"
                      : "Live performance metrics"}
                  </p>
                </div>
                {stravaData?.isCachedData && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Cached
                  </span>
                )}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={
                      stravaData?.performanceData || [
                        {
                          month: "Aug",
                          pace: 4.2,
                          distance: 45,
                          calories: 2800,
                          heartrate: 145,
                          runs: 12,
                        },
                        {
                          month: "Sep",
                          pace: 4.0,
                          distance: 52,
                          calories: 3200,
                          heartrate: 142,
                          runs: 14,
                        },
                        {
                          month: "Oct",
                          pace: 3.8,
                          distance: 58,
                          calories: 3600,
                          heartrate: 140,
                          runs: 16,
                        },
                        {
                          month: "Nov",
                          pace: 3.7,
                          distance: 62,
                          calories: 3850,
                          heartrate: 138,
                          runs: 18,
                        },
                        {
                          month: "Dec",
                          pace: 3.5,
                          distance: 68,
                          calories: 4200,
                          heartrate: 136,
                          runs: 20,
                        },
                      ]
                    }
                  >
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
                              <p className="font-semibold text-white mb-2">
                                {label}
                              </p>
                              <div className="space-y-1 text-sm">
                                <p className="text-gray-300">
                                  <span className="font-medium">Pace:</span>{" "}
                                  {data.pace}'/km
                                </p>
                                <p className="text-gray-300">
                                  <span className="font-medium">Distance:</span>{" "}
                                  {data.distance}km
                                </p>
                                <p className="text-gray-300">
                                  <span className="font-medium">Runs:</span>{" "}
                                  {data.runs}
                                </p>
                                <p className="text-gray-300">
                                  <span className="font-medium">Avg HR:</span>{" "}
                                  {data.heartrate} bpm
                                </p>
                                <p className="text-gray-300">
                                  <span className="font-medium">Calories:</span>{" "}
                                  {data.calories}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pace"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "#10B981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Distance */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">
                    Weekly Distance
                  </h3>
                  <p className="text-sm text-gray-400">
                    {stravaData?.dataRange || "Last 8 weeks"}
                  </p>
                </div>
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      stravaData?.weeklyData || [
                        {
                          week: "W1",
                          fullWeek: "Nov 1-7",
                          distance: 15,
                          runs: 3,
                        },
                        {
                          week: "W2",
                          fullWeek: "Nov 8-14",
                          distance: 18,
                          runs: 4,
                        },
                        {
                          week: "W3",
                          fullWeek: "Nov 15-21",
                          distance: 22,
                          runs: 4,
                        },
                        {
                          week: "W4",
                          fullWeek: "Nov 22-28",
                          distance: 16,
                          runs: 3,
                        },
                        {
                          week: "W5",
                          fullWeek: "Nov 29-Dec 5",
                          distance: 20,
                          runs: 4,
                        },
                        {
                          week: "W6",
                          fullWeek: "Dec 6-12",
                          distance: 25,
                          runs: 5,
                        },
                        {
                          week: "W7",
                          fullWeek: "Dec 13-19",
                          distance: 23,
                          runs: 4,
                        },
                        {
                          week: "W8",
                          fullWeek: "Dec 20-26",
                          distance: 19,
                          runs: 3,
                        },
                      ]
                    }
                  >
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-semibold text-gray-800 mb-2">
                                {data.fullWeek}
                              </p>
                              <div className="space-y-1 text-sm">
                                <p className="text-gray-600">
                                  <span className="font-medium">Distance:</span>{" "}
                                  {data.distance}km
                                </p>
                                <p className="text-gray-600">
                                  <span className="font-medium">Runs:</span>{" "}
                                  {data.runs}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="distance"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      className="opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200 mb-6">
                  Training Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Footprints className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {stravaData?.summary.totalDistance || 138}
                    </div>
                    <div className="text-xs text-gray-400">Total km</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {Math.round((stravaData?.summary.totalTime || 850) / 60)}h
                    </div>
                    <div className="text-xs text-gray-400">Total time</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Timer className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {stravaData?.summary.avgPace || 3.8}'
                    </div>
                    <div className="text-xs text-gray-400">Avg pace</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Heart className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {stravaData?.summary.avgHeartrate || 142}
                    </div>
                    <div className="text-xs text-gray-400">Avg HR</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Flame className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {stravaData?.summary.totalCalories || 8650}
                    </div>
                    <div className="text-xs text-gray-400">Calories</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
        <div className="fixed bottom-4 sm:bottom-24 right-4 sm:right-6 w-full max-w-sm sm:w-96 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 animate-slide-in-from-bottom mx-4 sm:mx-0">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-white">AI Coach</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowAIPopup(false);
                    router.push("/chat");
                  }}
                  className="text-green-400 text-xs font-medium hover:underline"
                >
                  Full Chat →
                </button>
                <button
                  onClick={() => setShowAIPopup(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
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
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg text-sm ${message.sender === "user"
                    ? "bg-green-500 text-white"
                    : "bg-gray-700 text-gray-200"
                    }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {miniChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-200 rounded-lg p-3 max-w-[75%]">
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
          <div className="p-4 border-t border-gray-700">
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
                className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-white placeholder-gray-400 bg-gray-700"
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
      {/* Mobile Bottom Navigation */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[540px] bg-gray-800 border-t border-gray-700 px-6 py-3 z-50">
        <nav className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-200"
          >
            <Activity className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => router.push("/progress")}
            className="flex flex-col items-center space-y-1 text-green-400"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-medium">Progress</span>
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-200"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-medium">AI Coach</span>
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-200"
          >
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}

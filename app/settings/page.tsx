"use client";

import {
  BarChart3,
  Settings,
  Search,
  MessageSquare,
  MessageCircle,
  Activity,
  Menu,
  X,
  Send,
  Bot,
} from "lucide-react";
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

export default function SettingsPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stravaData, setStravaData] = useState<StravaData | null>(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");

  // User preferences state
  const [preferences, setPreferences] = useState({
    maxHR: "",
    lthr: "",
    restingHR: "",
    zone2Method: "maxhr",
    units: "metric",
    timeFormat: "24hour",
    privacy: "public",
    notifications: true,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");

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

  // Load user preferences
  const loadPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const response = await fetch("/api/preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences({
          maxHR: data.preferences.maxHR?.toString() || "",
          lthr: data.preferences.lthr?.toString() || "",
          restingHR: data.preferences.restingHR?.toString() || "",
          zone2Method: data.preferences.zone2Method || "maxhr",
          units: data.preferences.units || "metric",
          timeFormat: data.preferences.timeFormat || "24hour",
          privacy: data.preferences.privacy || "public",
          notifications: data.preferences.notifications !== false,
        });
      } else {
        console.error("Error loading preferences:", await response.text());
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Save user preferences
  const savePreferences = async () => {
    try {
      setPreferencesSaving(true);
      setPreferencesMessage("");
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxHR: preferences.maxHR ? parseInt(preferences.maxHR) : null,
          lthr: preferences.lthr ? parseInt(preferences.lthr) : null,
          restingHR: preferences.restingHR
            ? parseInt(preferences.restingHR)
            : null,
          zone2Method: preferences.zone2Method,
          units: preferences.units,
          timeFormat: preferences.timeFormat,
          privacy: preferences.privacy,
          notifications: preferences.notifications,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPreferencesMessage("✅ " + data.message);
        // Clear message after 3 seconds
        setTimeout(() => setPreferencesMessage(""), 3000);
      } else {
        setPreferencesMessage("❌ " + data.message);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setPreferencesMessage("❌ Failed to save preferences");
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      await Promise.all([
        loadPreferences(),
        fetchStravaData(),
        fetchSyncStatus(),
      ]);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (miniChatEndRef.current) {
      miniChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [miniChatMessages]);

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
                className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-700"
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
                className="flex items-center space-x-2 font-medium text-green-500"
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2 mt-4">
              <button
                onClick={() => {
                  router.push("/dashboard");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Activity className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  router.push("/progress");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => {
                  router.push("/chat");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <MessageSquare className="w-5 h-5" />
                <span>AI Coach</span>
              </button>
              <button
                onClick={() => {
                  router.push("/settings");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-green-500 bg-green-50"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>

              {/* Mobile Search */}
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search here..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Connect your accounts and manage preferences
          </p>
        </div>

        {/* Grid Layout for Better Space Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Account Connections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Strava Connection */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Strava Integration
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sync real running activities
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
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <a
                      href="/api/strava/auth"
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2 text-sm"
                    >
                      <span>Connect to Strava</span>
                    </a>
                  )}
                </div>
              </div>

              {stravaConnected && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Connected! Real activity data is being used in your
                    charts.
                  </p>
                </div>
              )}
              {!stravaConnected && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Connect to automatically sync activities and get performance
                    insights.
                  </p>
                </div>
              )}
            </div>

            {/* Sync Activities - Compact Layout */}
            {stravaConnected && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Activity Sync
                    </h3>
                    <p className="text-sm text-gray-600">
                      Cache activities for faster loading
                    </p>
                  </div>
                  <button
                    onClick={syncStravaData}
                    disabled={syncing}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      syncing
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {syncing ? "Syncing..." : "Sync Now"}
                  </button>
                </div>

                {/* Progress Bar */}
                {syncing && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        {syncMessage}
                      </span>
                      <span className="text-sm text-gray-500">
                        {syncProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Compact Sync Status */}
                {syncStatus && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Sync</span>
                        <span className="text-gray-800 text-xs">
                          {syncStatus.lastSync
                            ? new Date(
                                syncStatus.lastSync.started_at
                              ).toLocaleDateString("en", {
                                month: "short",
                                day: "numeric",
                              })
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cached</span>
                        <span className="text-gray-800 font-medium text-xs">
                          {syncStatus.totalActivities || 0} activities
                        </span>
                      </div>
                    </div>

                    {syncStatus.lastSync && (
                      <div className="flex items-center justify-end">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            syncStatus.lastSync.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : syncStatus.lastSync.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {syncStatus.lastSync.status}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!syncStatus?.hasData && stravaConnected && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 First sync recommended for better performance
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* App Preferences */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    App Preferences
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Customize your app experience and training settings
                  </p>
                </div>
                {preferencesLoading && (
                  <div className="text-sm text-gray-500">Loading...</div>
                )}
              </div>

              {/* General Settings */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  General Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Units
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={preferences.units}
                      onChange={(e) =>
                        handlePreferenceChange("units", e.target.value)
                      }
                    >
                      <option value="metric">Metric (km)</option>
                      <option value="imperial">Imperial (mi)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Time Format
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={preferences.timeFormat}
                      onChange={(e) =>
                        handlePreferenceChange("timeFormat", e.target.value)
                      }
                    >
                      <option value="24hour">24 Hour</option>
                      <option value="12hour">12 Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Privacy
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={preferences.privacy}
                      onChange={(e) =>
                        handlePreferenceChange("privacy", e.target.value)
                      }
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Notifications
                    </label>
                    <div className="flex items-center h-10">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                          checked={preferences.notifications}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "notifications",
                              e.target.checked
                            )
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Enable notifications
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Heart Rate Settings */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  Heart Rate Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Max HR <span className="text-gray-400">(bpm)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="190"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="120"
                      max="220"
                      value={preferences.maxHR}
                      onChange={(e) =>
                        handlePreferenceChange("maxHR", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Resting HR <span className="text-gray-400">(bpm)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="60"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="40"
                      max="100"
                      value={preferences.restingHR}
                      onChange={(e) =>
                        handlePreferenceChange("restingHR", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      LTHR <span className="text-gray-400">(bpm)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="170"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="100"
                      max="200"
                      value={preferences.lthr}
                      onChange={(e) =>
                        handlePreferenceChange("lthr", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Zone 2 Method
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={preferences.zone2Method}
                      onChange={(e) =>
                        handlePreferenceChange("zone2Method", e.target.value)
                      }
                    >
                      <option value="maxhr">Max HR</option>
                      <option value="lthr">LTHR</option>
                      <option value="hrr">HRR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Button and Messages */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={savePreferences}
                    disabled={preferencesSaving}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {preferencesSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
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
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>

                  {preferencesMessage && (
                    <div className="text-sm text-green-600 flex items-center space-x-1">
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
                      <span>{preferencesMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Panel */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-500 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">
                      Heart Rate Reference
                    </h5>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p>
                        <strong>Max HR:</strong> Maximum heart rate (220 - age
                        is a common estimate)
                      </p>
                      <p>
                        <strong>LTHR:</strong> Lactate Threshold Heart Rate
                        (usually 85-90% of Max HR)
                      </p>
                      <p>
                        <strong>Resting HR:</strong> Heart rate at complete rest
                        (needed for HRR method)
                      </p>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="font-medium mb-1">
                          Zone 2 Calculation Methods:
                        </p>
                        <ul className="space-y-0.5 ml-2">
                          <li>
                            • <strong>Max HR:</strong> 60-70% of Max HR
                            (traditional)
                          </li>
                          <li>
                            • <strong>LTHR:</strong> 65-80% of LTHR
                            (lactate-based)
                          </li>
                          <li>
                            • <strong>HRR:</strong> 60-70% of Heart Rate Reserve
                            (Karvonen formula)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status & Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Data Overview - Compact Cards */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Data Overview
              </h3>
              <div className="space-y-4">
                {/* Data Source Card */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Source</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        syncStatus?.hasData
                          ? "bg-green-100 text-green-800"
                          : stravaConnected
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {syncStatus?.hasData
                        ? "Cached"
                        : stravaConnected
                        ? "Live"
                        : "Demo"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {syncStatus?.hasData
                      ? "Fast cached data"
                      : stravaConnected
                      ? "Direct from Strava"
                      : "Sample data"}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {stravaData?.summary.totalRuns || 0}
                    </div>
                    <div className="text-xs text-blue-600">Runs</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">
                      {Math.round(stravaData?.summary.totalDistance || 0)}
                    </div>
                    <div className="text-xs text-green-600">KM</div>
                  </div>
                </div>

                {stravaData?.isCachedData && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Range</span>
                      <span className="text-xs text-purple-600 font-medium">
                        {stravaData.dataRange || "All time"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Account
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 font-medium text-sm">
                      DU
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      Chino Young
                    </div>
                    <div className="text-xs text-gray-500">
                      chinofyoung@gmail.com
                    </div>
                  </div>
                </div>
                <hr className="border-gray-200" />
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Member since</span>
                    <span>Dec 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                </div>
              </div>
            </div>
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

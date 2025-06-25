"use client";

import {
  BarChart3,
  Users,
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
  Activity,
  MapPin,
  Clock,
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
import { useState, useEffect } from "react";

const trackingData = [
  { time: "6:00", speed: 18 },
  { time: "6:20", speed: 15 },
  { time: "6:40", speed: 25 },
  { time: "7:00", speed: 28 },
  { time: "7:20", speed: 22 },
  { time: "7:40", speed: 18 },
  { time: "8:00", speed: 12 },
];

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
}

const friends = [
  {
    name: "Kim Minji",
    activity: "Lets have a jogg...",
    time: "10:20",
    status: "online",
    avatar: "👩‍🦰",
  },
  {
    name: "Devon Lane",
    activity: "I just ran 10km to...",
    time: "09:10",
    status: "online",
    avatar: "👨‍💼",
  },
  {
    name: "Cody Fisher",
    activity: "Do you have sche...",
    time: "08:40",
    status: "online",
    avatar: "👨‍🎓",
  },
  {
    name: "Cameron Jane",
    activity: "Tomorrow at sun...",
    time: "08:20",
    status: "away",
    avatar: "👩‍🦱",
  },
  {
    name: "Wade Waren",
    activity: "Hey lets have jog...",
    time: "07:30",
    status: "offline",
    avatar: "👨‍🦲",
  },
];

const recentActivities = [
  {
    name: "Running at Digulis Park",
    date: "Tue 10 • 6:00 - 8:00",
    calories: 520,
    bpm: 102,
    icon: "🏃‍♂️",
  },
  {
    name: "Running at Ridge Walk",
    date: "Tue 11 • 16:00 - 17:30",
    calories: 480,
    bpm: 110,
    icon: "🚶‍♂️",
  },
  {
    name: "Running at Ayodya Park",
    date: "Tue 12 • 8:00 - 9:30",
    calories: 320,
    bpm: 101,
    icon: "🏃‍♀️",
  },
];

type ActiveTab = "dashboard" | "progress" | "chat" | "settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [stravaData, setStravaData] = useState<StravaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stravaConnected, setStravaConnected] = useState(false);

  useEffect(() => {
    const fetchStravaData = async () => {
      try {
        const [activitiesResponse, statusResponse] = await Promise.all([
          fetch("/api/strava/activities"),
          fetch("/api/strava/status"),
        ]);

        const statusData = await statusResponse.json();
        setStravaConnected(statusData.connected);

        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setStravaData(activitiesData);
        } else {
          // Handle when user is not connected to Strava
          const errorData = await activitiesResponse.json();
          console.log("Strava not connected:", errorData.message);
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
      } finally {
        setLoading(false);
      }
    };

    fetchStravaData();
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5" />
                        <div>
                          <div className="text-sm opacity-90">Distance</div>
                          <div className="font-bold text-lg">11.45 km</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Timer className="w-5 h-5" />
                        <div>
                          <div className="text-sm opacity-90">Duration</div>
                          <div className="font-bold text-lg">02:10:40</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking History */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Tracking History
                      </h2>
                      <p className="text-gray-500">
                        Your average speed is 20 km/h
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span>Today</span>
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trackingData}>
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
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
                      <span className="text-2xl font-bold">28</span>
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

                {/* Recent Strava Runs */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Recent Runs
                      </h2>
                      <p className="text-gray-500">
                        {stravaConnected
                          ? "Your latest Strava activities"
                          : "Connect Strava to see real runs"}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("progress")}
                      className="text-green-500 text-sm font-medium hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : stravaData?.recentActivities &&
                    stravaData.recentActivities.length > 0 ? (
                    <div className="space-y-4">
                      {stravaData.recentActivities
                        .slice(0, 5)
                        .map((run, index) => (
                          <div
                            key={run.id}
                            className="group p-4 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-bold text-lg">
                                    🏃
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-800 group-hover:text-green-800 transition-colors">
                                    {run.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 mb-2">
                                    {run.date}
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm">
                                    <div className="flex items-center space-x-1 text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>{run.distance}km</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-gray-600">
                                      <Clock className="w-4 h-4" />
                                      <span>{run.duration}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-gray-600">
                                      <TrendingUp className="w-4 h-4" />
                                      <span>{run.pace}'/km</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    <span>{run.calories}</span>
                                  </div>
                                  {run.heartrate > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <Heart className="w-3 h-3 text-red-500" />
                                      <span>{run.heartrate}</span>
                                    </div>
                                  )}
                                  {run.elevation > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <TrendingUp className="w-3 h-3 text-blue-500" />
                                      <span>{run.elevation}m</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : !stravaConnected ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🏃‍♂️</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Connect Strava to See Your Runs
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Link your Strava account to automatically display your
                        recent running activities here.
                      </p>
                      <button
                        onClick={() => setActiveTab("settings")}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                      >
                        Connect Strava
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🏃‍♂️</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No Recent Runs Found
                      </h3>
                      <p className="text-gray-600">
                        Start running and your activities will appear here
                        automatically!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Quick AI Chat */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      AI Coach Quick Chat
                    </h3>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="text-green-500 text-sm font-medium"
                    >
                      Full Chat →
                    </button>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">🤖</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-green-800">
                          Great job on today's run! Your pace is improving.
                          Ready for tomorrow's tempo workout?
                        </p>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className="text-green-600 text-xs font-medium mt-2 hover:underline"
                        >
                          Ask me anything →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Friends List */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-800">
                      Running Buddies
                    </h3>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">5</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {friends.slice(0, 4).map((friend, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-lg">{friend.avatar}</span>
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              friend.status === "online"
                                ? "bg-green-500"
                                : friend.status === "away"
                                ? "bg-yellow-500"
                                : "bg-gray-400"
                            }`}
                          ></div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {friend.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {friend.activity}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {friend.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Recent Activities
                  </h3>
                  <div className="space-y-4">
                    {(stravaData?.recentActivities.length
                      ? stravaData.recentActivities
                      : recentActivities
                    )
                      .slice(0, 2)
                      .map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">
                              {"icon" in activity ? activity.icon : "🏃"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">
                              {activity.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {activity.date}
                            </div>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-gray-400">
                                <Flame className="w-3 h-3 inline mr-1" />
                                {activity.calories} kcal
                              </span>
                              <span className="text-xs text-gray-400">
                                <Heart className="w-3 h-3 inline mr-1" />
                                {"heartrate" in activity
                                  ? activity.heartrate
                                  : "bpm" in activity
                                  ? activity.bpm
                                  : 0}{" "}
                                bpm
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
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
                        stravaConnected
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {stravaConnected ? "Real Strava Data" : "Demo Data"}
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
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

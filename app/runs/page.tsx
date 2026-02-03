"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Heart,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  MessageSquare,
  Settings,
  Trophy,
  Dumbbell,
  Sparkles,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Run {
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
  ai_analysis?: string | null;
}

interface StravaData {
  recentActivities: Run[];
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

export default function AllRunsPage() {
  const router = useRouter();
  const [allRuns, setAllRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [summary, setSummary] = useState<StravaData["summary"] | null>(null);
  const [isCachedData, setIsCachedData] = useState(false);
  const [analyzingActivityId, setAnalyzingActivityId] = useState<number | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<{ [key: number]: boolean }>({});

  const analyzeActivity = async (activityId: number) => {
    try {
      setAnalyzingActivityId(activityId);
      const response = await fetch("/api/ai-activity-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityId }),
      });

      if (response.ok) {
        // Refresh runs to get the new analysis
        await fetchAllRunsData();
      } else {
        console.error("Failed to analyze activity");
      }
    } catch (error) {
      console.error("Error analyzing activity:", error);
    } finally {
      setAnalyzingActivityId(null);
    }
  };

  const runsPerPage = 10;
  const totalPages = Math.ceil(allRuns.length / runsPerPage);
  const startIndex = (currentPage - 1) * runsPerPage;
  const endIndex = startIndex + runsPerPage;
  const currentRuns = allRuns.slice(startIndex, endIndex);

  useEffect(() => {
    fetchAllRunsData();
  }, []);

  const fetchAllRunsData = async () => {
    try {
      setLoading(true);

      // Fetch Strava connection status
      const statusResponse = await fetch("/api/strava/status");
      const statusData = await statusResponse.json();
      setStravaConnected(statusData.connected);

      if (statusData.connected) {
        // Fetch all activities from the database via a new API endpoint
        const allActivitiesResponse = await fetch("/api/strava/all-activities");

        if (allActivitiesResponse.ok) {
          const allActivitiesData = await allActivitiesResponse.json();
          setAllRuns(allActivitiesData.activities || []);
          setSummary(allActivitiesData.summary);
          setIsCachedData(true);
        } else {
          // Fallback to existing cached data if new endpoint doesn't exist yet
          const cachedResponse = await fetch("/api/strava/activities-cached");
          if (cachedResponse.ok) {
            const cachedData: StravaData = await cachedResponse.json();
            setAllRuns(cachedData.recentActivities || []);
            setSummary(cachedData.summary);
            setIsCachedData(cachedData.isCachedData || false);
          }
        }
      } else {
        setAllRuns([]);
      }
    } catch (error) {
      console.error("Error fetching runs data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRunTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "run":
        return <Activity className="w-5 h-5" />;
      case "race":
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case "workout":
        return <Dumbbell className="w-5 h-5 text-orange-500" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getRunTypeColor = (distance: number) => {
    if (distance < 5) return "from-green-400 to-emerald-500";
    if (distance < 10) return "from-blue-400 to-cyan-500";
    if (distance < 21) return "from-orange-400 to-red-500";
    return "from-purple-400 to-pink-500";
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700 fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[540px] z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  All Runs
                </h1>
                <p className="text-xs text-gray-400">
                  {loading
                    ? "Loading..."
                    : `${allRuns.length} activities`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-24 pb-24">
        {/* Summary Stats */}
        {summary && stravaConnected && (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700 shadow-sm">
                <div className="text-2xl font-bold text-blue-400">
                  {summary.totalRuns}
                </div>
                <div className="text-sm text-gray-300">Total Runs</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700 shadow-sm">
                <div className="text-2xl font-bold text-green-400">
                  {summary.totalDistance}km
                </div>
                <div className="text-sm text-gray-300">Distance</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700 shadow-sm">
                <div className="text-2xl font-bold text-purple-400">
                  {summary.avgPace}'
                </div>
                <div className="text-sm text-gray-300">Avg Pace</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700 shadow-sm">
                <div className="text-2xl font-bold text-red-400">
                  {summary.totalCalories}
                </div>
                <div className="text-sm text-gray-300">Calories</div>
              </div>
            </div>
          </div>
        )}

        {/* Strava Connection Notice */}
        {!stravaConnected && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Connect to Strava to See Your Runs
                </h3>
                <p className="text-orange-700 mb-4">
                  Connect your Strava account to view all your running
                  activities with detailed statistics and progress tracking.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Go to Settings →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Runs List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(runsPerPage)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse border border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-gray-700 rounded mb-2 w-1/3"></div>
                    <div className="flex space-x-4">
                      <div className="h-3 bg-gray-700 rounded w-12"></div>
                      <div className="h-3 bg-gray-700 rounded w-12"></div>
                      <div className="h-3 bg-gray-700 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : allRuns.length > 0 ? (
          <>
            {/* Compact Runs List */}
            <div className="space-y-3">
              {currentRuns.map((run) => (
                <div
                  key={run.id}
                  className="bg-gray-800 rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-gray-700 hover:border-green-500/50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${getRunTypeColor(
                        run.distance
                      )} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white text-sm">
                        {getRunTypeIcon(run.type)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-white truncate">
                            {run.name}
                          </h3>
                          {run.ai_analysis && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedActivities(prev => ({
                                  ...prev,
                                  [run.id]: !prev[run.id]
                                }));
                              }}
                              className="text-[10px] font-medium bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-800/30 flex items-center space-x-1 hover:bg-green-800/40 transition-colors flex-shrink-0"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI Analysis</span>
                              {expandedActivities[run.id] ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {!run.ai_analysis && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                analyzeActivity(run.id);
                              }}
                              disabled={analyzingActivityId === run.id}
                              className="text-[10px] font-medium bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600 hover:bg-green-600 hover:text-white hover:border-green-500 transition-colors disabled:opacity-50"
                            >
                              {analyzingActivityId === run.id ? "Analyzing..." : "Analyze Run"}
                            </button>
                          )}
                          <span className="text-sm text-gray-400 flex-shrink-0">
                            {formatDate(run.rawDate || run.date)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="font-medium text-gray-200">
                            {run.distance}km
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="font-medium text-gray-200">
                            {run.duration}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-gray-500" />
                          <span className="font-medium text-gray-200">
                            {run.pace}'/km
                          </span>
                        </div>

                        {run.heartrate > 0 && (
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-gray-500" />
                            <span className="font-medium text-gray-200">
                              {run.heartrate}bpm
                            </span>
                          </div>
                        )}

                        <div className="text-gray-500 text-xs">
                          {run.calories} cal
                        </div>
                      </div>

                      {run.ai_analysis && expandedActivities[run.id] && (
                        <div className="mt-4 p-4 bg-gray-900 border-l-2 border-green-500 rounded-r-lg shadow-inner text-sm text-gray-200 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-start space-x-2">
                            <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed italic">
                              {run.ai_analysis}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, allRuns.length)}{" "}
                  of {allRuns.length} runs
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${currentPage === 1
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                      }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page;
                      if (totalPages <= 7) {
                        page = i + 1;
                      } else if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? "bg-green-500 text-white"
                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${currentPage === totalPages
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                      }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : stravaConnected ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No Runs Found
            </h3>
            <p className="text-gray-500">
              Your running activities will appear here once you start logging
              runs.
            </p>
          </div>
        ) : null}
      </main>
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
            className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-200"
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

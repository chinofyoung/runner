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
        return "🏃‍♂️";
      case "race":
        return "🏆";
      case "workout":
        return "💪";
      default:
        return "🏃‍♂️";
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  All Runs
                </h1>
                <p className="text-sm text-gray-500">
                  {loading
                    ? "Loading..."
                    : `${allRuns.length} total activities`}
                  {isCachedData && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Cached Data
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Summary Stats */}
        {summary && stravaConnected && (
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.totalRuns}
                </div>
                <div className="text-sm text-gray-600">Total Runs</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.totalDistance}km
                </div>
                <div className="text-sm text-gray-600">Distance</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.avgPace}'
                </div>
                <div className="text-sm text-gray-600">Avg Pace</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {summary.totalCalories}
                </div>
                <div className="text-sm text-gray-600">Calories</div>
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
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-1/3"></div>
                    <div className="flex space-x-4">
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
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
                  className="bg-white rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-200"
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
                        <h3 className="font-medium text-gray-900 truncate">
                          {run.name}
                        </h3>
                        <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                          {formatDate(run.rawDate || run.date)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {run.distance}km
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {run.duration}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {run.pace}'/km
                          </span>
                        </div>

                        {run.heartrate > 0 && (
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {run.heartrate}bpm
                            </span>
                          </div>
                        )}

                        <div className="text-gray-500 text-xs">
                          {run.calories} cal
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white rounded-lg p-4">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, allRuns.length)}{" "}
                  of {allRuns.length} runs
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? "bg-green-500 text-white"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Runs Found
            </h3>
            <p className="text-gray-500">
              Your running activities will appear here once you start logging
              runs.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

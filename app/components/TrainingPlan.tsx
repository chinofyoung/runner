"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Play,
  MoreVertical,
} from "lucide-react";

interface TrainingSession {
  id: string;
  day: string;
  date: string;
  type: "easy" | "tempo" | "long" | "interval" | "race" | "rest";
  duration: string;
  distance?: string;
  description: string;
  completed?: boolean;
  actualActivity?: {
    name: string;
    distance: number;
    duration: string;
    pace: number;
  };
}

interface TrainingPlanData {
  trainingPlan: TrainingSession[];
  summary: {
    completedSessions: number;
    totalSessions: number;
    progressPercentage: number;
    weekNumber: number;
    totalWeeks: number;
    planType: string;
  };
  connected: boolean;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "easy":
      return "bg-green-100 text-green-800";
    case "tempo":
      return "bg-orange-100 text-orange-800";
    case "interval":
      return "bg-red-100 text-red-800";
    case "long":
      return "bg-blue-100 text-blue-800";
    case "rest":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "easy":
      return "🚶‍♂️";
    case "tempo":
      return "🏃‍♂️";
    case "interval":
      return "⚡";
    case "long":
      return "🏃‍♀️";
    case "rest":
      return "😴";
    default:
      return "🏃";
  }
};

export default function TrainingPlan() {
  const [trainingData, setTrainingData] = useState<TrainingPlanData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainingPlan = async () => {
      try {
        const response = await fetch("/api/strava/training-plan");

        if (!response.ok) {
          throw new Error("Failed to fetch training plan");
        }

        const data = await response.json();
        setTrainingData(data);
      } catch (err) {
        console.error("Error fetching training plan:", err);
        setError("Failed to load training plan");
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingPlan();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !trainingData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Unable to Load Training Plan
          </h3>
          <p className="text-gray-600">
            {error || "There was an error loading your training plan."}
          </p>
        </div>
      </div>
    );
  }

  const { trainingPlan, summary } = trainingData;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            This Week's Training Plan
          </h2>
          <p className="text-gray-500">
            {summary.planType} - Week {summary.weekNumber} of{" "}
            {summary.totalWeeks}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {summary.completedSessions}/{summary.totalSessions}
            </div>
            <div className="text-xs text-gray-500">Sessions</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Weekly Progress
          </span>
          <span className="text-sm text-gray-500">
            {summary.progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${summary.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Strava Connection Notice */}
      {!trainingData.connected && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h4 className="font-medium text-orange-800">
                Connect Strava for Real Progress
              </h4>
              <p className="text-sm text-orange-700">
                Connect your Strava account to automatically track completed
                training sessions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Training Sessions */}
      <div className="space-y-3">
        {trainingPlan.map((session) => (
          <div
            key={session.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              session.completed
                ? "border-green-200 bg-green-50"
                : session.type === "rest"
                ? "border-gray-200 bg-gray-50"
                : "border-gray-200 bg-white hover:border-green-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{getTypeIcon(session.type)}</div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-800">{session.day}</h3>
                    <span className="text-sm text-gray-500">
                      {session.date}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        session.type
                      )}`}
                    >
                      {session.type.charAt(0).toUpperCase() +
                        session.type.slice(1)}
                    </span>
                  </div>

                  {/* Show actual activity details if completed */}
                  {session.completed && session.actualActivity ? (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-green-800 mb-1">
                        ✅ Completed: {session.actualActivity.name}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-green-700">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{session.actualActivity.distance}km</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{session.actualActivity.duration}</span>
                        </div>
                        <div>
                          <span>{session.actualActivity.pace}'/km pace</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mb-2">
                      {session.description}
                    </p>
                  )}

                  {/* Show planned session details */}
                  {!session.completed && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {session.duration !== "Rest" && (
                        <>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{session.duration}</span>
                          </div>
                          {session.distance && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{session.distance}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {session.completed ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                ) : session.type !== "rest" ? (
                  <button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </button>
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm">💤</span>
                  </div>
                )}
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Coaching Tip */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Coach's Tip</h4>
            <p className="text-sm text-blue-800">
              {summary.completedSessions > 0
                ? `Great progress! You've completed ${
                    summary.completedSessions
                  } out of ${summary.totalSessions} sessions this week. ${
                    summary.progressPercentage >= 70
                      ? "You're on track for a strong week!"
                      : "Keep pushing to reach your weekly goals!"
                  }`
                : "Your training plan is ready! Start with today's session to build momentum for the week."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

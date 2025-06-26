"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Play,
  MoreVertical,
  X,
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
  selectedPlan?: {
    id: string;
    title: string;
    description: string;
  } | null;
}

interface TrainingPlanProps {
  refreshTrigger?: number;
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

export default function TrainingPlan({
  refreshTrigger,
}: TrainingPlanProps = {}) {
  const [trainingData, setTrainingData] = useState<TrainingPlanData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainingPlan = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchTrainingPlan();
  }, [refreshTrigger]);

  const clearActivePlan = async () => {
    try {
      const response = await fetch("/api/strava/training-plan", {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTrainingPlan(); // Refresh the data
      }
    } catch (error) {
      console.error("Error clearing active plan:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="h-16 sm:h-20 bg-gray-200 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !trainingData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
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

  const { trainingPlan, summary, selectedPlan } = trainingData;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            This Week's Training Plan
          </h2>
          <p className="text-gray-500 text-sm">
            {summary.planType} - Week {summary.weekNumber} of{" "}
            {summary.totalWeeks}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {summary.completedSessions}/{summary.totalSessions}
          </div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>
      </div>

      {/* Selected Plan Indicator */}
      {selectedPlan && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-green-800">
                📋 {selectedPlan.title}
              </h4>
            </div>
            <button
              onClick={clearActivePlan}
              className="text-green-600 hover:text-green-800 transition-colors"
              title="Clear active plan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">
            Weekly Progress
          </span>
          <span className="text-xs text-gray-500">
            {summary.progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${summary.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Strava Connection Notice */}
      {!trainingData.connected && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <div>
              <p className="text-xs text-orange-800">
                Connect Strava to track completed sessions automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Training Sessions */}
      <div className="space-y-2">
        {trainingPlan.map((session) => (
          <div
            key={session.id}
            className={`p-2 rounded-lg border transition-all ${
              session.completed
                ? "border-green-200 bg-green-50"
                : session.type === "rest"
                ? "border-gray-200 bg-gray-50"
                : "border-gray-200 bg-white hover:border-green-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="text-lg flex-shrink-0">
                  {getTypeIcon(session.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-800 text-sm">
                      {session.day}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {session.date}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTypeColor(
                        session.type
                      )}`}
                    >
                      {session.type.charAt(0).toUpperCase() +
                        session.type.slice(1)}
                    </span>
                  </div>

                  {/* Show actual activity details if completed */}
                  {session.completed && session.actualActivity ? (
                    <div className="mb-1">
                      <p className="text-xs font-medium text-green-800 mb-0.5">
                        ✅ {session.actualActivity.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-green-700">
                        <span>{session.actualActivity.distance}km</span>
                        <span>{session.actualActivity.duration}</span>
                        <span>{session.actualActivity.pace}'/km</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mb-1">
                      {session.description}
                    </p>
                  )}

                  {/* Show planned session details */}
                  {!session.completed && session.duration !== "Rest" && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{session.duration}</span>
                      {session.distance && <span>{session.distance}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0">
                {session.completed ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : session.type !== "rest" ? (
                  <button className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  </button>
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs">💤</span>
                  </div>
                )}
                <button className="p-0.5 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Coaching Tip */}
      <div className="mt-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-blue-900 mb-0.5">
              Coach's Tip
            </h4>
            <p className="text-xs text-blue-800">
              {summary.completedSessions > 0
                ? `${summary.completedSessions}/${
                    summary.totalSessions
                  } sessions completed. ${
                    summary.progressPercentage >= 70
                      ? "You're on track!"
                      : "Keep pushing!"
                  }`
                : "Start with today's session to build momentum."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

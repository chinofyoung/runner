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
      return "bg-green-600 text-white";
    case "tempo":
      return "bg-orange-600 text-white";
    case "interval":
      return "bg-red-600 text-white";
    case "long":
      return "bg-blue-600 text-white";
    case "rest":
      return "bg-gray-600 text-white";
    default:
      return "bg-gray-600 text-white";
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
      <div className="bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded-lg mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded-lg mb-6 w-1/2"></div>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="h-16 sm:h-20 bg-gray-700 rounded-2xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !trainingData) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-700">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2 text-2xl">⚠️</div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Unable to Load Training Plan
          </h3>
          <p className="text-gray-500">
            {error || "There was an error loading your training plan."}
          </p>
        </div>
      </div>
    );
  }

  const { trainingPlan, summary, selectedPlan } = trainingData;

  return (
    <div className="bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-300">
            This Week's Training Plan
          </h2>
          <p className="text-gray-500 text-sm">
            {summary.planType} - Week {summary.weekNumber} of{" "}
            {summary.totalWeeks}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-400">
            {summary.completedSessions}/{summary.totalSessions}
          </div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>
      </div>

      {/* Selected Plan Indicator */}
      {selectedPlan && (
        <div className="mb-3 p-3 bg-green-900/50 border border-green-700/50 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-green-300">
                📋 {selectedPlan.title}
              </h4>
            </div>
            <button
              onClick={clearActivePlan}
              className="text-green-400 hover:text-green-300 transition-colors"
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
          <span className="text-xs font-medium text-gray-400">
            Weekly Progress
          </span>
          <span className="text-xs text-gray-500">
            {summary.progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${summary.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Strava Connection Notice */}
      {!trainingData.connected && (
        <div className="bg-orange-900/50 border border-orange-700/50 rounded-2xl p-3 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <div>
              <p className="text-xs text-orange-300">
                Connect Strava to track completed sessions automatically
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
            className={`p-3 rounded-2xl border transition-all ${
              session.completed
                ? "border-green-500/50 bg-green-900/20"
                : session.type === "rest"
                ? "border-gray-600/50 bg-gray-800/30"
                : "border-gray-700/50 bg-gray-800/50 hover:border-green-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-lg flex-shrink-0">
                  {getTypeIcon(session.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-300 text-sm">
                      {session.day}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {session.date}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-xl text-xs font-medium ${getTypeColor(
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
                      <p className="text-xs font-medium text-green-400 mb-0.5">
                        ✅ {session.actualActivity.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-green-300">
                        <span>{session.actualActivity.distance}km</span>
                        <span>{session.actualActivity.duration}</span>
                        <span>{session.actualActivity.pace}'/km</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mb-1">
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

              <div className="flex items-center space-x-2 flex-shrink-0">
                {session.completed ? (
                  <div className="w-7 h-7 bg-green-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : session.type !== "rest" ? (
                  <button className="w-7 h-7 bg-green-500 rounded-2xl flex items-center justify-center hover:bg-green-600 transition-all">
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  </button>
                ) : (
                  <div className="w-7 h-7 bg-gray-600 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-300 text-xs">💤</span>
                  </div>
                )}
                <button className="p-1 text-gray-400 hover:text-gray-300 transition-colors">
                  <MoreVertical className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Coaching Tip */}
      <div className="mt-4 p-3 bg-blue-900/50 rounded-2xl border border-blue-700/50">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-blue-300 mb-1">
              Coach's Tip
            </h4>
            <p className="text-xs text-blue-200">
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

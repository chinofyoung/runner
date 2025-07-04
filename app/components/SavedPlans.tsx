"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle,
  Play,
} from "lucide-react";

interface TrainingSession {
  day: string;
  type: "easy" | "tempo" | "long" | "interval" | "race" | "rest";
  duration: string;
  distance?: string;
  description: string;
}

interface TrainingPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  sessions: TrainingSession[];
  created_at: string;
  user_id?: string;
}

interface SavedPlansProps {
  onPlanSelected?: () => void;
}

export default function SavedPlans({ onPlanSelected }: SavedPlansProps = {}) {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchActivePlan();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/training-plans");
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching saved plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePlan = async () => {
    try {
      const response = await fetch("/api/strava/training-plan");
      if (response.ok) {
        const data = await response.json();
        setSelectedPlanId(data.selectedPlan?.id || null);
      }
    } catch (error) {
      console.error("Error fetching active plan:", error);
    }
  };

  const selectPlan = async (planId: string) => {
    setSelectingPlan(planId);
    try {
      const response = await fetch("/api/strava/training-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        setSelectedPlanId(planId);
        onPlanSelected?.();
        // Show success message or notification here if needed
      } else {
        console.error("Failed to select plan");
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
    } finally {
      setSelectingPlan(null);
    }
  };

  const clearActivePlan = async () => {
    try {
      const response = await fetch("/api/strava/training-plan", {
        method: "DELETE",
      });

      if (response.ok) {
        setSelectedPlanId(null);
        onPlanSelected?.();
      }
    } catch (error) {
      console.error("Error clearing active plan:", error);
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/training-plans?id=${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPlans(plans.filter((plan) => plan.id !== planId));
        // Collapse if we're deleting the expanded plan
        if (expandedPlan === planId) {
          setExpandedPlan(null);
        }
        // Clear active plan if we're deleting it
        if (selectedPlanId === planId) {
          clearActivePlan();
        }
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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

  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Saved Training Plans
          </h3>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            You haven't saved any training plans yet. Ask the AI coach to create
            a training plan and save it!
          </p>
          <div className="text-sm text-gray-500">
            💡 Try asking: "Create a 5K training plan for beginners"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Saved Training Plans
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            {plans.length} saved plan{plans.length !== 1 ? "s" : ""}
            {selectedPlanId && (
              <span className="ml-2">
                • Active:{" "}
                {plans.find((p) => p.id === selectedPlanId)?.title || "Unknown"}
              </span>
            )}
          </p>
        </div>
        {selectedPlanId && (
          <button
            onClick={clearActivePlan}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear Active Plan
          </button>
        )}
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg ${
              selectedPlanId === plan.id
                ? "border-green-300 bg-green-50"
                : "border-gray-200"
            }`}
          >
            {/* Plan Header */}
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-start sm:items-center">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="break-words">{plan.title}</span>
                    {selectedPlanId === plan.id && (
                      <CheckCircle className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {plan.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500">
                    <span>Duration: {plan.duration}</span>
                    <span>•</span>
                    <span>
                      Saved: {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{plan.sessions.length} sessions</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-2">
                  {selectedPlanId !== plan.id && (
                    <button
                      onClick={() => selectPlan(plan.id)}
                      disabled={selectingPlan === plan.id}
                      className={`flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm ${
                        selectingPlan === plan.id
                          ? "bg-blue-300 text-blue-700 cursor-not-allowed"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {selectingPlan === plan.id ? "Selecting..." : "Select"}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
                    }
                    className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View</span>
                    {expandedPlan === plan.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Plan Details */}
            {expandedPlan === plan.id && (
              <div className="p-3 sm:p-4">
                <div className="space-y-2">
                  {plan.sessions.map((session, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className="text-lg sm:text-2xl flex-shrink-0">
                          {getTypeIcon(session.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                            <h4 className="font-medium text-gray-800 text-sm sm:text-base">
                              {session.day}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                                session.type
                              )} self-start sm:self-auto`}
                            >
                              {session.type.charAt(0).toUpperCase() +
                                session.type.slice(1)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            {session.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

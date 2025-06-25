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

export default function SavedPlans() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Saved Training Plans
          </h3>
          <p className="text-gray-600 mb-4">
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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Saved Training Plans
          </h2>
          <p className="text-gray-500">
            {plans.length} saved plan{plans.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border border-gray-200 rounded-lg">
            {/* Plan Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {plan.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {plan.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Duration: {plan.duration}</span>
                    <span>•</span>
                    <span>
                      Saved: {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{plan.sessions.length} sessions</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
                    }
                    className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                    {expandedPlan === plan.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Plan Details */}
            {expandedPlan === plan.id && (
              <div className="p-4">
                <div className="space-y-2">
                  {plan.sessions.map((session, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getTypeIcon(session.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-800">
                              {session.day}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                                session.type
                              )}`}
                            >
                              {session.type.charAt(0).toUpperCase() +
                                session.type.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {session.description}
                          </p>
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

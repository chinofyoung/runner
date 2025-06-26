"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Save,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  trainingPlan?: TrainingPlan;
}

interface TrainingPlan {
  title: string;
  description: string;
  duration: string;
  sessions: TrainingSession[];
}

interface TrainingSession {
  day: string;
  type: "easy" | "tempo" | "long" | "interval" | "race" | "rest";
  duration: string;
  distance?: string;
  description: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi! I'm your AI running coach. I can help you with training plans, pace guidance, nutrition advice, and answer any running-related questions. What would you like to know?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const focusInput = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
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

  const savePlan = async (messageId: string, plan: TrainingPlan) => {
    try {
      const response = await fetch("/api/training-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error("Failed to save plan");
      }

      // Mark as saved locally
      setSavedPlans((prev) => [...prev, messageId]);

      // Show success message
      const successMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        content: `✅ Training plan "${plan.title}" has been saved successfully! You can view and manage your saved plans in the Progress tab.`,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      console.error("Error saving plan:", error);
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        content:
          "❌ Sorry, there was an error saving your training plan. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare conversation history for Claude
      const conversationHistory = messages.map((msg) => ({
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
          conversationHistory: conversationHistory.slice(-10), // Keep last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: "ai",
        timestamp: new Date(),
        trainingPlan: data.trainingPlan, // Include training plan if provided
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      focusInput(); // Refocus input after AI response
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
              Fitflex AI Coach
            </h3>
            <p className="text-xs sm:text-sm text-green-500">
              Powered by Claude • Online
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 sm:p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex items-start space-x-2 sm:space-x-3 ${
                message.sender === "user"
                  ? "flex-row-reverse space-x-reverse"
                  : ""
              }`}
            >
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === "user" ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                {message.sender === "user" ? (
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                )}
              </div>
              <div
                className={`max-w-[80%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            {/* Training Plan Display */}
            {message.trainingPlan && (
              <div className="mt-4 ml-2 sm:ml-11 max-w-full">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  {/* Plan Header */}
                  <div className="p-3 sm:p-4 border-b border-gray-100 bg-green-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-green-800 flex items-center">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {message.trainingPlan.title}
                          </span>
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                          {message.trainingPlan.description}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Duration: {message.trainingPlan.duration}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          savePlan(message.id, message.trainingPlan!)
                        }
                        disabled={savedPlans.includes(message.id)}
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm flex-shrink-0 ${
                          savedPlans.includes(message.id)
                            ? "bg-green-500 text-white cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {savedPlans.includes(message.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span className="hidden sm:inline">Save Plan</span>
                            <span className="sm:hidden">Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Training Sessions Table */}
                  <div className="p-3 sm:p-4">
                    <div className="space-y-2">
                      {message.trainingPlan.sessions.map((session, index) => (
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
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
              <div className="flex space-x-1">
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && !e.shiftKey && handleSendMessage()
            }
            placeholder="Ask about training, pacing, nutrition, recovery..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          💡 Try asking: "Create a 5K training plan" or "What pace for easy
          runs?"
        </div>
      </div>
    </div>
  );
}

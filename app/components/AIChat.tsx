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
  History,
  Plus,
  Archive,
  Search,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  trainingPlan?: TrainingPlan;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
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
  // Current conversation state
  const [currentConversationId, setCurrentConversationId] =
    useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi! I'm your AI running coach. I can help you with training plans, pace guidance, nutrition advice, and answer any running-related questions. What would you like to know?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  // Conversation history state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    loadConversations();

    // Auto-generate conversation ID if starting fresh
    if (!currentConversationId) {
      setCurrentConversationId(generateConversationId());
    }
  }, []);

  // Save conversation when messages change
  useEffect(() => {
    if (currentConversationId && messages.length > 1) {
      saveCurrentConversation();
    }
  }, [messages, currentConversationId]);

  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const loadConversations = () => {
    try {
      const saved = localStorage.getItem("aiChatConversations");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        const conversations = parsed.map((conv: any) => ({
          ...conv,
          created_at: new Date(conv.created_at),
          updated_at: new Date(conv.updated_at),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(conversations);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const saveCurrentConversation = async () => {
    try {
      const now = new Date();
      const existingIndex = conversations.findIndex(
        (c) => c.id === currentConversationId
      );

      // Generate title for new conversations
      let title = "New Chat";
      if (messages.length >= 2) {
        try {
          const response = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "generateTitle",
              conversationData: { messages },
            }),
          });
          if (response.ok) {
            const data = await response.json();
            title = data.title;
          }
        } catch (error) {
          console.error("Error generating title:", error);
        }
      }

      const conversation: Conversation = {
        id: currentConversationId,
        title,
        messages: [...messages],
        created_at:
          existingIndex >= 0 ? conversations[existingIndex].created_at : now,
        updated_at: now,
      };

      let updatedConversations;
      if (existingIndex >= 0) {
        updatedConversations = [...conversations];
        updatedConversations[existingIndex] = conversation;
      } else {
        updatedConversations = [conversation, ...conversations];
      }

      setConversations(updatedConversations);
      localStorage.setItem(
        "aiChatConversations",
        JSON.stringify(updatedConversations)
      );
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
      setShowHistory(false);
    }
  };

  const startNewConversation = () => {
    const newId = generateConversationId();
    setCurrentConversationId(newId);
    setMessages([
      {
        id: "1",
        content:
          "Hi! I'm your AI running coach. I can help you with training plans, pace guidance, nutrition advice, and answer any running-related questions. What would you like to know?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
    setShowHistory(false);
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(
      (c) => c.id !== conversationId
    );
    setConversations(updatedConversations);
    localStorage.setItem(
      "aiChatConversations",
      JSON.stringify(updatedConversations)
    );

    // If we're deleting the current conversation, start a new one
    if (conversationId === currentConversationId) {
      startNewConversation();
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.messages.some((msg) =>
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

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
      // Prepare conversation history for Claude with memory context
      const conversationHistory = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      // Add context from conversation history
      let contextMessage = "";
      if (messages.length > 1) {
        contextMessage = `Previous conversation context: The user and I have been discussing running-related topics. `;

        // Add recent context
        const recentMessages = messages.slice(-6, -1); // Get last 6 messages excluding the current one
        const topics = extractTopicsFromMessages(recentMessages);
        if (topics.length > 0) {
          contextMessage += `Recent topics: ${topics.join(", ")}. `;
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextMessage + currentInput,
          conversationHistory: conversationHistory.slice(-12), // Keep last 12 messages for context
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
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  const extractTopicsFromMessages = (messages: Message[]): string[] => {
    const topics = new Set<string>();
    const keywords = {
      training: ["training", "workout", "plan", "exercise"],
      pace: ["pace", "speed", "tempo", "fast", "slow"],
      distance: ["5k", "10k", "marathon", "half marathon", "mile"],
      health: ["injury", "pain", "recovery", "rest"],
      nutrition: ["eat", "food", "hydration", "fuel"],
    };

    messages.forEach((message) => {
      const content = message.content.toLowerCase();
      Object.entries(keywords).forEach(([topic, words]) => {
        if (words.some((word) => content.includes(word))) {
          topics.add(topic);
        }
      });
    });

    return Array.from(topics);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Conversation History Sidebar */}
      {showHistory && (
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Chat History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              onClick={startNewConversation}
              className="w-full flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm
                  ? "No conversations found"
                  : "No conversation history"}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      conversation.id === currentConversationId
                        ? "bg-green-50 border border-green-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => loadConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm truncate">
                          {conversation.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.messages.length} messages
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.updated_at.toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="text-gray-400 hover:text-red-500 ml-2"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  AI Running Coach
                </h1>
                <p className="text-sm text-gray-500">
                  Your personal training assistant with conversation memory
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {messages.length - 1} messages
              </span>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Chat History"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-3xl ${
                  message.sender === "user"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-800"
                } rounded-lg p-4 shadow-sm`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {message.sender === "user" ? (
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>

                    {/* Training Plan Display */}
                    {message.trainingPlan && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800">
                            📋 {message.trainingPlan.title}
                          </h4>
                          {!savedPlans.includes(message.id) && (
                            <button
                              onClick={() =>
                                savePlan(message.id, message.trainingPlan!)
                              }
                              className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save Plan</span>
                            </button>
                          )}
                          {savedPlans.includes(message.id) && (
                            <div className="flex items-center space-x-1 text-green-600 text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              <span>Saved</span>
                            </div>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-3">
                          {message.trainingPlan.description}
                        </p>

                        <div className="text-xs text-gray-500 mb-4">
                          <span className="font-medium">Duration:</span>{" "}
                          {message.trainingPlan.duration}
                        </div>

                        <div className="space-y-2">
                          {message.trainingPlan.sessions.map(
                            (session, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="text-lg">
                                  {getTypeIcon(session.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-800 text-sm">
                                      {session.day}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                                        session.type
                                      )}`}
                                    >
                                      {session.type.charAt(0).toUpperCase() +
                                        session.type.slice(1)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-1">
                                    {session.description}
                                  </p>
                                  {session.duration !== "Rest" && (
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-75">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-lg p-4 shadow-sm max-w-3xl">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
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
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about training plans, pacing, nutrition, or any running questions..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 Your conversations are saved locally. Ask follow-up questions and
            I'll remember our chat!
          </div>
        </div>
      </div>
    </div>
  );
}

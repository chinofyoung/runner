"use client";

import {
  BarChart3,
  Settings,
  MessageSquare,
  Activity,
  Menu,
} from "lucide-react";
import AIChat from "../components/AIChat";
import { useRouter } from "next/navigation";

export default function Chat() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700 px-4 py-3 sm:px-6 sm:py-4 flex-none z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Cb</span>
            </div>
            <span className="font-bold text-xl text-white">ChinoBot</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Placeholder for future header actions if needed, consistent with Dashboard style */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto sm:px-6 py-0 sm:py-6 pb-[80px] sm:pb-6 overflow-hidden">
        <div className="hidden sm:block mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            AI Coach 🤖
          </h1>
          <p className="text-gray-400">
            Get personalized training advice and support
          </p>
        </div>

        {/* Chat Container - Fixed height calculation for mobile to prevent double scrollbar */}
        <div className="flex-1 min-h-0 w-full relative">
          <AIChat />
        </div>
      </main>

      {/* Mobile Bottom Navigation - Standardized Footer */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[540px] bg-gray-800 border-t border-gray-700 px-6 py-3 z-50 sm:hidden">
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
            className="flex flex-col items-center space-y-1 text-green-400"
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

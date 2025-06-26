"use client";

import {
  BarChart3,
  Settings,
  Search,
  MessageSquare,
  MessageCircle,
  Activity,
  Menu,
} from "lucide-react";
import AIChat from "../components/AIChat";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Chat() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Cb</span>
              </div>
              <span className="font-bold text-xl text-gray-800">ChinoBot</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-700"
              >
                <Activity className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => router.push("/progress")}
                className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-700"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => router.push("/chat")}
                className="flex items-center space-x-2 font-medium text-green-500"
              >
                <MessageSquare className="w-5 h-5" />
                <span>AI Coach</span>
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center space-x-2 font-medium text-gray-500 hover:text-gray-700"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search */}
            <div className="relative hidden sm:block">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search here..."
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-green-500 w-48 lg:w-64 text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2 mt-4">
              <button
                onClick={() => {
                  router.push("/dashboard");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Activity className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  router.push("/progress");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => {
                  router.push("/chat");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-green-500 bg-green-50"
              >
                <MessageSquare className="w-5 h-5" />
                <span>AI Coach</span>
              </button>
              <button
                onClick={() => {
                  router.push("/settings");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>

              {/* Mobile Search */}
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search here..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            AI Coach 🤖
          </h1>
          <p className="text-gray-600">
            Get personalized training advice and support
          </p>
        </div>

        <AIChat />
      </main>
    </div>
  );
}

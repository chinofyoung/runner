"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, MapPin, TrendingUp, Activity, Info } from "lucide-react";

interface Zone2Run {
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
  zone2Method: "heartrate" | "pace";
  hrZone?: {
    zone2Range: string;
    actualHR: number;
  } | null;
}

interface Zone2Data {
  zone2Runs: Zone2Run[];
  summary: {
    totalZone2Runs: number;
    totalZone2Distance: number;
    avgZone2Pace: number;
    zone2Percentage: number;
  };
  hrZones?: {
    zone1: { min: number; max: number };
    zone2: { min: number; max: number };
    zone3: { min: number; max: number };
    zone4: { min: number; max: number };
    zone5: { min: number; max: number };
  };
  analysisMethod?: {
    heartRateAvailable: number;
    paceBasedAnalysis: number;
    totalActivitiesAnalyzed: number;
  };
  calculationMethod?: string;
  isCachedData?: boolean;
  dataRange?: string;
}

interface Zone2RunsWidgetProps {
  stravaConnected: boolean;
}

export default function Zone2RunsWidget({
  stravaConnected,
}: Zone2RunsWidgetProps) {
  const [zone2Data, setZone2Data] = useState<Zone2Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (stravaConnected) {
      fetchZone2Data();
    } else {
      setLoading(false);
    }
  }, [stravaConnected]);

  const fetchZone2Data = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/strava/zone2-runs");

      if (response.ok) {
        const data = await response.json();
        setZone2Data(data);
      } else {
        console.error("Failed to fetch Zone 2 data");
        setZone2Data(null);
      }
    } catch (error) {
      console.error("Error fetching Zone 2 data:", error);
      setZone2Data(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    });
  };

  const getZone2Color = (method: string) => {
    return method === "heartrate"
      ? "from-blue-400 to-blue-500"
      : "from-green-400 to-green-500";
  };

  const getZone2Icon = (method: string) => {
    return method === "heartrate" ? "💙" : "🟢";
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stravaConnected) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-lg">💙</span>
        </div>
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Connect Strava for Zone Analysis
        </h4>
        <p className="text-xs text-gray-600 mb-3">
          Analyze your easy runs and aerobic base training
        </p>
      </div>
    );
  }

  if (!zone2Data || zone2Data.zone2Runs.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-lg">💙</span>
        </div>
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          No Zone 2 Runs Found
        </h4>
        <p className="text-xs text-gray-600">
          Your easy runs will appear here when detected
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Zone 2 HR Range Display */}
      {zone2Data.hrZones?.zone2 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">
                  Zone 2 Heart Rate Range
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-blue-600">
                    {zone2Data.hrZones.zone2.min}-{zone2Data.hrZones.zone2.max}
                  </span>
                  <span className="text-sm text-blue-700">bpm</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {zone2Data.calculationMethod && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {zone2Data.calculationMethod === "maxhr"
                    ? "Max HR"
                    : zone2Data.calculationMethod === "lthr"
                    ? "LTHR"
                    : zone2Data.calculationMethod === "hrr"
                    ? "HRR"
                    : "Max HR"}{" "}
                  Method
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {zone2Data.summary.totalZone2Runs}
          </div>
          <div className="text-xs text-blue-700">Zone 2 Runs</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {zone2Data.summary.totalZone2Distance}km
          </div>
          <div className="text-xs text-blue-700">Distance</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {zone2Data.summary.avgZone2Pace}'
          </div>
          <div className="text-xs text-blue-700">Avg Pace</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {zone2Data.summary.zone2Percentage}%
          </div>
          <div className="text-xs text-blue-700">of Total</div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mb-4">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Info className="w-3 h-3" />
          <span>Zone 2 Analysis Info</span>
        </button>

        {showInfo && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p className="mb-2">
              <strong>Detection Methods:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                💙 Heart Rate:{" "}
                {zone2Data.analysisMethod?.heartRateAvailable || 0} runs with HR
                data
              </li>
              <li>
                🟢 Pace-based:{" "}
                {zone2Data.analysisMethod?.paceBasedAnalysis || 0} runs analyzed
                by pace
              </li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              <strong>About Zone 2:</strong> Builds aerobic base and fat-burning
              efficiency.
              {zone2Data.calculationMethod === "maxhr" &&
                " Max HR method uses 60-70% of maximum heart rate."}
              {zone2Data.calculationMethod === "lthr" &&
                " LTHR method uses 65-80% of lactate threshold for more precise zones."}
              {zone2Data.calculationMethod === "hrr" &&
                " HRR method accounts for individual fitness using heart rate reserve."}
            </p>
            {zone2Data.isCachedData && (
              <p className="mt-2 text-xs text-gray-400">
                📊 Using cached data from{" "}
                {zone2Data.dataRange || "recent activities"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Zone 2 Runs */}
      <div className="space-y-3">
        {zone2Data.zone2Runs.slice(0, 5).map((run) => (
          <div
            key={run.id}
            className="group p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 bg-gradient-to-br ${getZone2Color(
                  run.zone2Method
                )} rounded-lg flex items-center justify-center`}
              >
                <span className="text-white text-xs">
                  {getZone2Icon(run.zone2Method)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 text-sm truncate group-hover:text-blue-800 transition-colors">
                  {run.name}
                </h4>
                <p className="text-xs text-gray-500 mb-1">
                  {formatDate(run.rawDate || run.date)}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{run.distance}km</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{run.duration}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{run.pace}'/km</span>
                  </div>
                  {run.heartrate > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{run.heartrate}bpm</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {zone2Data.zone2Runs.length > 5 && (
        <div className="mt-3 text-center">
          <button className="text-blue-500 text-xs font-medium hover:underline">
            View All Zone 2 Runs ({zone2Data.zone2Runs.length}) →
          </button>
        </div>
      )}
    </div>
  );
}

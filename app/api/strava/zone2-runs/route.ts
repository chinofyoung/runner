import { NextRequest, NextResponse } from "next/server";

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Demo user ID (same as training plans)
const getCurrentUserId = (): string => {
  return "123e4567-e89b-12d3-a456-426614174000";
};

// Supabase request helper
const supabaseRequest = async (
  method: string,
  endpoint: string,
  body?: any,
  queryParams?: Record<string, string>
) => {
  let url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Supabase API Error:", {
      status: response.status,
      statusText: response.statusText,
      url,
      method,
      errorResponse: errorText,
    });
    throw new Error(
      `Supabase API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const responseText = await response.text();
  if (!responseText) return [];

  return JSON.parse(responseText);
};

function convertToKmPace(speedMs: number): number {
  if (!speedMs || speedMs <= 0) return 0;
  return Math.round((1000 / speedMs / 60) * 100) / 100; // minutes per km
}

function formatDistance(meters: number): number {
  return Math.round((meters / 1000) * 100) / 100; // km with 2 decimal places
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  }
}

// Calculate heart rate zones based on different methods
function calculateHeartRateZones(
  method: string = "maxhr",
  maxHR?: number,
  lthr?: number,
  restingHR?: number,
  age: number = 30
) {
  let zones;

  switch (method) {
    case "lthr":
      // LTHR-based zones (65-80% of LTHR for Zone 2)
      if (!lthr) {
        // Fallback to Max HR method if LTHR not available
        const actualMaxHR = maxHR || 220 - age;
        zones = calculateMaxHRZones(actualMaxHR);
      } else {
        zones = {
          zone1: { min: Math.round(lthr * 0.5), max: Math.round(lthr * 0.65) }, // Recovery
          zone2: { min: Math.round(lthr * 0.65), max: Math.round(lthr * 0.8) }, // Aerobic Base
          zone3: { min: Math.round(lthr * 0.8), max: Math.round(lthr * 0.9) }, // Aerobic
          zone4: { min: Math.round(lthr * 0.9), max: Math.round(lthr * 1.0) }, // Threshold
          zone5: { min: Math.round(lthr * 1.0), max: Math.round(lthr * 1.1) }, // Neuromuscular
        };
      }
      break;

    case "hrr":
      // Heart Rate Reserve (Karvonen) method (60-70% of HRR for Zone 2)
      if (!maxHR || !restingHR) {
        // Fallback to Max HR method if HRR data not available
        const actualMaxHR = maxHR || 220 - age;
        zones = calculateMaxHRZones(actualMaxHR);
      } else {
        const hrr = maxHR - restingHR; // Heart Rate Reserve
        zones = {
          zone1: {
            min: Math.round(restingHR + hrr * 0.5),
            max: Math.round(restingHR + hrr * 0.6),
          }, // Recovery
          zone2: {
            min: Math.round(restingHR + hrr * 0.6),
            max: Math.round(restingHR + hrr * 0.7),
          }, // Aerobic Base
          zone3: {
            min: Math.round(restingHR + hrr * 0.7),
            max: Math.round(restingHR + hrr * 0.8),
          }, // Aerobic
          zone4: {
            min: Math.round(restingHR + hrr * 0.8),
            max: Math.round(restingHR + hrr * 0.9),
          }, // Threshold
          zone5: {
            min: Math.round(restingHR + hrr * 0.9),
            max: maxHR,
          }, // Neuromuscular
        };
      }
      break;

    default: // "maxhr"
      // Traditional Max HR method (60-70% of Max HR for Zone 2)
      const actualMaxHR = maxHR || 220 - age;
      zones = calculateMaxHRZones(actualMaxHR);
      break;
  }

  return zones;
}

// Helper function for Max HR based zones
function calculateMaxHRZones(maxHR: number) {
  return {
    zone1: {
      min: Math.round(maxHR * 0.5),
      max: Math.round(maxHR * 0.6),
    }, // Recovery
    zone2: {
      min: Math.round(maxHR * 0.6),
      max: Math.round(maxHR * 0.7),
    }, // Aerobic Base
    zone3: {
      min: Math.round(maxHR * 0.7),
      max: Math.round(maxHR * 0.8),
    }, // Aerobic
    zone4: {
      min: Math.round(maxHR * 0.8),
      max: Math.round(maxHR * 0.9),
    }, // Threshold
    zone5: { min: Math.round(maxHR * 0.9), max: maxHR }, // Neuromuscular
  };
}

// Analyze if a run is majority Zone 2 based on average heart rate
function isZone2Run(avgHeartRate: number, zones: any): boolean {
  if (!avgHeartRate || avgHeartRate === 0) {
    return false; // Can't determine without heart rate data
  }

  // Check if average heart rate falls in Zone 2 range
  return avgHeartRate >= zones.zone2.min && avgHeartRate <= zones.zone2.max;
}

// Alternative method: use pace to estimate easy runs if no HR data
function isEasyRunByPace(pace: number, avgPace: number): boolean {
  if (!pace || !avgPace) return false;

  // Consider runs that are 15-30% slower than average pace as "easy"
  const easyPaceThreshold = avgPace * 1.15; // 15% slower than average
  return pace >= easyPaceThreshold;
}

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();

  try {
    // Check if user has synced data
    const profile = await supabaseRequest("GET", "user_profiles", null, {
      user_id: `eq.${userId}`,
      limit: "1",
    });

    if (!profile || profile.length === 0) {
      return NextResponse.json(
        {
          error: "No synced data found",
          message: "Please sync your Strava activities first",
          zone2Runs: [],
          summary: {
            totalZone2Runs: 0,
            totalZone2Distance: 0,
            avgZone2Pace: 0,
            zone2Percentage: 0,
          },
          hasData: false,
          needsSync: true,
        },
        { status: 404 }
      );
    }

    const userProfile = profile[0];

    // Fetch all running activities from cache (last 6 months for analysis)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const runningActivities = await supabaseRequest("GET", "activities", null, {
      user_id: `eq.${userId}`,
      type: `in.("Run")`,
      start_date_local: `gte.${sixMonthsAgo.toISOString()}`,
      order: "start_date_local.desc",
      limit: "200",
    });

    if (!runningActivities || runningActivities.length === 0) {
      return NextResponse.json({
        zone2Runs: [],
        summary: {
          totalZone2Runs: 0,
          totalZone2Distance: 0,
          avgZone2Pace: 0,
          zone2Percentage: 0,
        },
        isRealData: true,
        isCachedData: true,
        connected: true,
        lastSync: userProfile.last_sync_at,
        message: "No running activities found in the last 6 months",
      });
    }

    // Fetch user preferences for heart rate zones
    let userMaxHR = null;
    let userLTHR = null;
    let userRestingHR = null;
    let zone2Method = "maxhr";
    let userAge = 30; // default age

    try {
      const profiles = await supabaseRequest("GET", "user_profiles", null, {
        user_id: `eq.${userId}`,
        limit: "1",
      });

      if (profiles && profiles.length > 0) {
        const settings = profiles[0].settings || {};
        userMaxHR = settings.maxHR;
        userLTHR = settings.lthr;
        userRestingHR = settings.restingHR;
        zone2Method = settings.zone2Method || "maxhr";
        userAge = settings.age || 30;
      }
    } catch (error) {
      console.log("Could not fetch user preferences, using defaults");
    }

    // Calculate heart rate zones using user preferences or defaults
    const hrZones = calculateHeartRateZones(
      zone2Method,
      userMaxHR,
      userLTHR,
      userRestingHR,
      userAge
    );

    // Calculate average pace for easy run estimation
    const totalPace = runningActivities.reduce(
      (sum: number, act: any) => sum + convertToKmPace(act.average_speed),
      0
    );
    const avgPace = totalPace / runningActivities.length;

    // Identify Zone 2 / Easy runs
    const zone2Runs = runningActivities.filter((activity: any) => {
      const avgHeartRate = activity.average_heartrate;
      const pace = convertToKmPace(activity.average_speed);

      // Primary method: use heart rate if available
      if (avgHeartRate && avgHeartRate > 0) {
        return isZone2Run(avgHeartRate, hrZones);
      }

      // Fallback method: use pace analysis
      return isEasyRunByPace(pace, avgPace);
    });

    // Format Zone 2 runs for display
    const formattedZone2Runs = zone2Runs.slice(0, 20).map((activity: any) => {
      const activityDate = new Date(activity.start_date_local);
      const pace = convertToKmPace(activity.average_speed);

      return {
        id: activity.id,
        name: activity.name,
        date: activityDate.toLocaleDateString("en", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        rawDate: activityDate.toISOString().split("T")[0],
        distance: formatDistance(activity.distance),
        duration: formatDuration(activity.moving_time),
        pace: pace,
        calories:
          activity.calories || Math.round((activity.distance / 1000) * 65),
        heartrate: activity.average_heartrate || 0,
        elevation: activity.total_elevation_gain || 0,
        type: activity.type,
        zone2Method:
          activity.average_heartrate && activity.average_heartrate > 0
            ? "heartrate"
            : "pace",
        hrZone: activity.average_heartrate
          ? {
              zone2Range: `${hrZones.zone2.min}-${hrZones.zone2.max} bpm`,
              actualHR: activity.average_heartrate,
            }
          : null,
      };
    });

    // Calculate summary statistics
    const totalZone2Distance =
      zone2Runs.reduce((sum: number, act: any) => sum + act.distance, 0) / 1000; // Convert to km

    const avgZone2Pace =
      zone2Runs.length > 0
        ? zone2Runs.reduce(
            (sum: number, act: any) => sum + convertToKmPace(act.average_speed),
            0
          ) / zone2Runs.length
        : 0;

    const zone2Percentage =
      runningActivities.length > 0
        ? Math.round((zone2Runs.length / runningActivities.length) * 100)
        : 0;

    const response = {
      zone2Runs: formattedZone2Runs,
      summary: {
        totalZone2Runs: zone2Runs.length,
        totalZone2Distance: Math.round(totalZone2Distance * 10) / 10,
        avgZone2Pace: Math.round(avgZone2Pace * 10) / 10,
        zone2Percentage: zone2Percentage,
      },
      hrZones: hrZones,
      calculationMethod: zone2Method,
      analysisMethod: {
        heartRateAvailable: zone2Runs.filter(
          (r: any) => r.average_heartrate > 0
        ).length,
        paceBasedAnalysis: zone2Runs.filter(
          (r: any) => !r.average_heartrate || r.average_heartrate === 0
        ).length,
        totalActivitiesAnalyzed: runningActivities.length,
      },
      isRealData: true,
      isCachedData: true,
      connected: true,
      lastSync: userProfile.last_sync_at,
      dataRange: "Last 6 months",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error analyzing Zone 2 runs:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze Zone 2 runs",
        message: "There was an error analyzing your running activities",
        zone2Runs: [],
        summary: {
          totalZone2Runs: 0,
          totalZone2Distance: 0,
          avgZone2Pace: 0,
          zone2Percentage: 0,
        },
        hasData: false,
      },
      { status: 500 }
    );
  }
}

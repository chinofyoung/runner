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
          activities: [],
          summary: {
            totalDistance: 0,
            totalTime: 0,
            avgPace: 0,
            totalCalories: 0,
            totalRuns: 0,
            avgHeartrate: 0,
          },
          hasData: false,
          needsSync: true,
        },
        { status: 404 }
      );
    }

    const userProfile = profile[0];

    // Fetch ALL running activities from cache (no limit for pagination)
    const allRunningActivities = await supabaseRequest(
      "GET",
      "activities",
      null,
      {
        user_id: `eq.${userId}`,
        type: `in.("Run")`,
        order: "start_date_local.desc",
        // Remove limit to get all activities
      }
    );

    if (!allRunningActivities || allRunningActivities.length === 0) {
      return NextResponse.json({
        activities: [],
        summary: {
          totalDistance: 0,
          totalTime: 0,
          avgPace: 0,
          totalCalories: 0,
          totalRuns: 0,
          avgHeartrate: 0,
        },
        isRealData: true,
        isCachedData: true,
        connected: true,
        lastSync: userProfile.last_sync_at,
        message: "No running activities found",
      });
    }

    // Format ALL activities for the frontend
    const allActivities = allRunningActivities.map((activity: any) => {
      const activityDate = new Date(activity.start_date_local);
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
        rawDate: activityDate.toISOString().split("T")[0], // YYYY-MM-DD format
        distance: formatDistance(activity.distance),
        duration: formatDuration(activity.moving_time),
        pace: convertToKmPace(activity.average_speed),
        calories:
          activity.calories || Math.round((activity.distance / 1000) * 65),
        heartrate: activity.average_heartrate || 0,
        elevation: activity.total_elevation_gain || 0,
        type: activity.type,
      };
    });

    // Calculate summary stats for all activities
    const totalDistance =
      allRunningActivities.reduce(
        (sum: number, act: any) => sum + act.distance,
        0
      ) / 1000; // km

    const totalTime =
      allRunningActivities.reduce(
        (sum: number, act: any) => sum + act.moving_time,
        0
      ) / 3600; // hours

    const avgPace =
      allRunningActivities.length > 0
        ? allRunningActivities.reduce(
            (sum: number, act: any) => sum + convertToKmPace(act.average_speed),
            0
          ) / allRunningActivities.length
        : 0;

    const totalCalories = allRunningActivities.reduce(
      (sum: number, act: any) =>
        sum + (act.calories || Math.round((act.distance / 1000) * 65)),
      0
    );

    const avgHeartrate =
      allRunningActivities.length > 0
        ? allRunningActivities.reduce(
            (sum: number, act: any) => sum + (act.average_heartrate || 0),
            0
          ) / allRunningActivities.length
        : 0;

    const response = {
      activities: allActivities,
      summary: {
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalTime: Math.round(totalTime * 10) / 10,
        avgPace: Math.round(avgPace * 10) / 10,
        totalCalories: Math.round(totalCalories),
        totalRuns: allRunningActivities.length,
        avgHeartrate: Math.round(avgHeartrate),
      },
      isRealData: true,
      isCachedData: true,
      connected: true,
      lastSync: userProfile.last_sync_at,
      totalActivitiesReturned: allActivities.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching all activities:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch all activities",
        message: "There was an error fetching your activities",
        activities: [],
        summary: {
          totalDistance: 0,
          totalTime: 0,
          avgPace: 0,
          totalCalories: 0,
          totalRuns: 0,
          avgHeartrate: 0,
        },
        hasData: false,
      },
      { status: 500 }
    );
  }
}

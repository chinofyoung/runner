import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function convertToKmPace(speedMs: number): number {
  // Convert m/s to min/km
  const kmh = speedMs * 3.6; // km/h
  const minPerKm = 60 / kmh; // min/km
  return Math.round(minPerKm * 10) / 10;
}

function formatDistance(meters: number): number {
  return Math.round(meters / 100) / 10; // km with 1 decimal
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:00`;
  }
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

async function fetchRealStravaData(accessToken: string) {
  try {
    const response = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=20",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Strava activities: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching real Strava data:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;

    // Return error if not connected to Strava
    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Not connected to Strava",
          message: "Please connect your Strava account to view activities",
          connected: false,
        },
        { status: 401 }
      );
    }

    // Fetch real Strava data
    const activities = await fetchRealStravaData(accessToken);

    if (!activities || activities.length === 0) {
      return NextResponse.json({
        performanceData: [],
        weeklyData: [],
        recentActivities: [],
        summary: {
          totalDistance: 0,
          totalTime: 0,
          avgPace: 0,
          totalCalories: 0,
          totalRuns: 0,
          avgHeartrate: 0,
        },
        isRealData: true,
        connected: true,
        message: "No activities found in your Strava account",
      });
    }

    // Filter only running activities
    const runningActivities = activities.filter(
      (activity: any) =>
        activity.type === "Run" || activity.sport_type === "Run"
    );

    // Process data for charts
    const performanceData = runningActivities
      .slice(0, 6)
      .reverse()
      .map((activity: any) => {
        const date = new Date(activity.start_date_local || activity.start_date);
        const monthName = date.toLocaleDateString("en", { month: "short" });

        // Calculate calories if not provided (rough estimate: 65 cal per km)
        const calories =
          activity.calories || Math.round((activity.distance / 1000) * 65);
        const heartrate = activity.average_heartrate || 0;

        return {
          month: monthName,
          pace: convertToKmPace(activity.average_speed),
          distance: formatDistance(activity.distance),
          calories: calories,
          heartrate: heartrate,
        };
      });

    // Weekly distance data (last 8 weeks)
    const weeklyData = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Filter activities for this week
      const weekActivities = runningActivities.filter((activity: any) => {
        const activityDate = new Date(
          activity.start_date_local || activity.start_date
        );
        return activityDate >= weekStart && activityDate < weekEnd;
      });

      const weekDistance = weekActivities.reduce(
        (sum: number, act: any) => sum + act.distance / 1000,
        0
      );

      weeklyData.push({
        week: `W${8 - i}`,
        distance: Math.round(weekDistance * 10) / 10,
        runs: weekActivities.length,
      });
    }

    // Recent activities for dashboard
    const recentActivities = runningActivities
      .slice(0, 3)
      .map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        date: new Date(
          activity.start_date_local || activity.start_date
        ).toLocaleDateString("en", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        distance: formatDistance(activity.distance),
        duration: formatDuration(activity.moving_time),
        pace: convertToKmPace(activity.average_speed),
        calories:
          activity.calories || Math.round((activity.distance / 1000) * 65),
        heartrate: activity.average_heartrate || 0,
        elevation: activity.total_elevation_gain || 0,
        type: activity.type || activity.sport_type,
      }));

    // Summary stats
    const totalDistance =
      runningActivities.reduce(
        (sum: number, act: any) => sum + act.distance,
        0
      ) / 1000; // km
    const totalTime =
      runningActivities.reduce(
        (sum: number, act: any) => sum + act.moving_time,
        0
      ) / 3600; // hours
    const avgPace =
      runningActivities.length > 0
        ? runningActivities.reduce(
            (sum: number, act: any) => sum + convertToKmPace(act.average_speed),
            0
          ) / runningActivities.length
        : 0;
    const totalCalories = runningActivities.reduce(
      (sum: number, act: any) =>
        sum + (act.calories || Math.round((act.distance / 1000) * 65)),
      0
    );
    const avgHeartrate =
      runningActivities.length > 0
        ? runningActivities.reduce(
            (sum: number, act: any) => sum + (act.average_heartrate || 0),
            0
          ) / runningActivities.length
        : 0;

    const response = {
      performanceData,
      weeklyData,
      recentActivities,
      summary: {
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalTime: Math.round(totalTime * 10) / 10,
        avgPace: Math.round(avgPace * 10) / 10,
        totalCalories: Math.round(totalCalories),
        totalRuns: runningActivities.length,
        avgHeartrate: Math.round(avgHeartrate),
      },
      isRealData: true,
      connected: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching Strava data:", error);

    // If it's an authentication error, clear the token
    if (error instanceof Error && error.message.includes("401")) {
      const response = NextResponse.json(
        {
          error: "Strava authentication expired",
          message: "Please reconnect your Strava account",
          connected: false,
        },
        { status: 401 }
      );
      response.cookies.delete("strava_access_token");
      response.cookies.delete("strava_refresh_token");
      return response;
    }

    return NextResponse.json(
      {
        error: "Failed to fetch activities",
        message: "There was an error fetching your Strava data",
        connected: !!(await cookies()).get("strava_access_token")?.value,
      },
      { status: 500 }
    );
  }
}

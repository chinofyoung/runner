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
      "https://www.strava.com/api/v3/athlete/activities?per_page=100",
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

    // Process data for monthly performance charts (last 12 months)
    const monthlyData = new Map();
    const currentDate = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthDate.toLocaleDateString("en", { month: "short" });
      
      monthlyData.set(monthKey, {
        month: monthName,
        year: monthDate.getFullYear(),
        totalDistance: 0,
        totalTime: 0,
        totalCalories: 0,
        totalHeartrate: 0,
        runCount: 0,
        totalPaceSum: 0
      });
    }

    // Aggregate activities by month
    runningActivities.forEach((activity: any) => {
      const date = new Date(activity.start_date_local || activity.start_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.has(monthKey)) {
        const monthStats = monthlyData.get(monthKey);
        const pace = convertToKmPace(activity.average_speed);
        const calories = activity.calories || Math.round((activity.distance / 1000) * 65);
        
        monthStats.totalDistance += activity.distance / 1000; // Convert to km
        monthStats.totalTime += activity.moving_time / 60; // Convert to minutes
        monthStats.totalCalories += calories;
        monthStats.totalHeartrate += activity.average_heartrate || 0;
        monthStats.runCount += 1;
        monthStats.totalPaceSum += pace;
      }
    });

    // Calculate averages and format performance data
    const performanceData = Array.from(monthlyData.values())
      .filter(monthStats => monthStats.runCount > 0) // Only include months with runs
      .map(monthStats => ({
        month: monthStats.month,
        pace: Math.round((monthStats.totalPaceSum / monthStats.runCount) * 10) / 10,
        distance: Math.round(monthStats.totalDistance * 10) / 10,
        calories: Math.round(monthStats.totalCalories / monthStats.runCount),
        heartrate: Math.round(monthStats.totalHeartrate / monthStats.runCount),
        runs: monthStats.runCount
      }));

    // Weekly distance data (last 8 weeks)
    const weeklyData = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      // Start week on Monday
      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(weekStart.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Filter activities for this week
      const weekActivities = runningActivities.filter((activity: any) => {
        const activityDate = new Date(
          activity.start_date_local || activity.start_date
        );
        return activityDate >= weekStart && activityDate <= weekEnd;
      });

      const weekDistance = weekActivities.reduce(
        (sum: number, act: any) => sum + act.distance / 1000,
        0
      );

      // Format week label with actual dates
      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      const fullWeekLabel = `${weekStart.toLocaleDateString("en", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en", { month: "short", day: "numeric" })}`;

      weeklyData.push({
        week: weekLabel,
        fullWeek: fullWeekLabel,
        distance: Math.round(weekDistance * 10) / 10,
        runs: weekActivities.length,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
      });
    }

    // Recent activities for dashboard
    const recentActivities = runningActivities
      .slice(0, 10)
      .map((activity: any) => {
        const activityDate = new Date(
          activity.start_date_local || activity.start_date
        );
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
          rawDate: activityDate.toISOString().split('T')[0], // YYYY-MM-DD format for easier comparison
          distance: formatDistance(activity.distance),
          duration: formatDuration(activity.moving_time),
          pace: convertToKmPace(activity.average_speed),
          calories:
            activity.calories || Math.round((activity.distance / 1000) * 65),
          heartrate: activity.average_heartrate || 0,
          elevation: activity.total_elevation_gain || 0,
          type: activity.type || activity.sport_type,
        };
      });

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

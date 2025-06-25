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
    return `${hours}:${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
}

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();
  
  try {
    // Check if user has synced data
    const profile = await supabaseRequest("GET", "user_profiles", null, {
      user_id: `eq.${userId}`,
      limit: "1"
    });

    if (!profile || profile.length === 0) {
      return NextResponse.json({
        error: "No synced data found",
        message: "Please sync your Strava activities first",
        hasData: false,
        needsSync: true,
      }, { status: 404 });
    }

    const userProfile = profile[0];

    // Fetch running activities from cache (last 12 months for proper monthly analysis)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const runningActivities = await supabaseRequest("GET", "activities", null, {
      user_id: `eq.${userId}`,
      type: `in.("Run")`,
      start_date_local: `gte.${twelveMonthsAgo.toISOString()}`,
      order: "start_date_local.desc",
      limit: "500"
    });

    if (!runningActivities || runningActivities.length === 0) {
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
        isCachedData: true,
        connected: true,
        lastSync: userProfile.last_sync_at,
        message: "No running activities found in the last 12 months",
      });
    }

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
      const date = new Date(activity.start_date_local);
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
        const activityDate = new Date(activity.start_date_local);
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

    // Recent activities for dashboard (last 10)
    const recentActivities = runningActivities
      .slice(0, 10)
      .map((activity: any) => {
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
          rawDate: activityDate.toISOString().split('T')[0], // YYYY-MM-DD format
          distance: formatDistance(activity.distance),
          duration: formatDuration(activity.moving_time),
          pace: convertToKmPace(activity.average_speed),
          calories: activity.calories || Math.round((activity.distance / 1000) * 65),
          heartrate: activity.average_heartrate || 0,
          elevation: activity.total_elevation_gain || 0,
          type: activity.type,
        };
      });

    // Summary stats (all running activities in cache)
    const totalDistance = runningActivities.reduce(
      (sum: number, act: any) => sum + act.distance,
      0
    ) / 1000; // km
    
    const totalTime = runningActivities.reduce(
      (sum: number, act: any) => sum + act.moving_time,
      0
    ) / 3600; // hours
    
    const avgPace = runningActivities.length > 0
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
    
    const avgHeartrate = runningActivities.length > 0
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
      isCachedData: true,
      connected: true,
      lastSync: userProfile.last_sync_at,
      totalActivitiesInCache: userProfile.activities_count || 0,
      dataRange: "Last 30 days",
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching cached Strava data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch cached activities",
        message: "There was an error fetching your cached Strava data",
        hasData: false,
        needsSync: true,
      },
      { status: 500 }
    );
  }
} 
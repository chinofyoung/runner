import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Demo user ID (same as training plans)
const getCurrentUserId = (): string => {
  return "123e4567-e89b-12d3-a456-426614174000";
};

function convertToKmPace(speedMs: number): number {
  if (!speedMs || speedMs <= 0) return 0;
  // Convert m/s to min/km
  const paceSecs = 1000 / speedMs;
  const minutes = Math.floor(paceSecs / 60);
  const seconds = Math.floor(paceSecs % 60);
  return minutes + seconds / 60; // Returns decimal pace, e.g., 5.5 for 5:30
}

function formatDistance(meters: number): number {
  return Math.round((meters / 1000) * 100) / 100; // km with 2 decimals
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value || process.env.STRAVA_ACCESS_TOKEN;

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

    // Fetch running activities from Firebase Firestore (last 100)
    const q = query(
      collection(db, "activities"),
      where("user_id", "==", userId),
      where("type", "==", "Run"),
      orderBy("start_date_local", "desc"),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const runningActivities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

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
        connected: true,
        message: "No activities found in your account. Please click Sync to fetch your Strava data.",
      });
    }

    // Recent activities for dashboard
    const recentActivities = runningActivities.slice(0, 10).map((activity: any) => {
      const activityDate = new Date(activity.start_date_local || activity.start_date);
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
        rawDate: activityDate.toISOString().split('T')[0],
        distance: formatDistance(activity.distance),
        duration: formatDuration(activity.moving_time),
        pace: Math.round(convertToKmPace(activity.average_speed) * 10) / 10,
        calories: activity.calories || Math.round((activity.distance / 1000) * 65),
        heartrate: activity.average_heartrate || 0,
        elevation: activity.total_elevation_gain || 0,
        type: activity.type || activity.sport_type,
      };
    });

    // Summary stats
    const totalDistance = runningActivities.reduce((sum: number, act: any) => sum + act.distance, 0) / 1000;
    const totalTime = runningActivities.reduce((sum: number, act: any) => sum + act.moving_time, 0) / 3600;
    const avgPace = runningActivities.length > 0
      ? runningActivities.reduce((sum: number, act: any) => sum + convertToKmPace(act.average_speed), 0) / runningActivities.length
      : 0;
    const totalCalories = runningActivities.reduce(
      (sum: number, act: any) => sum + (act.calories || Math.round((act.distance / 1000) * 65)),
      0
    );
    const avgHeartrate = runningActivities.length > 0
      ? runningActivities.reduce((sum: number, act: any) => sum + (act.average_heartrate || 0), 0) / runningActivities.length
      : 0;

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching Strava activities from Firestore:", error);

    // Check for missing index error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("index")) {
      return NextResponse.json(
        {
          error: "Database index missing",
          message: "The database is still being optimized. Please try again in a minute.",
          details: errorMessage
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch activities",
        message: "There was an error retrieving your Strava data from our database.",
        connected: !!(await cookies()).get("strava_access_token")?.value,
      },
      { status: 500 }
    );
  }
}

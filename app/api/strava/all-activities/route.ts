import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Demo user ID (same as training plans)
const getCurrentUserId = (): string => {
  return "123e4567-e89b-12d3-a456-426614174000";
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
    const profileRef = doc(db, "user_profiles", userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
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

    const userProfile = profileSnap.data();

    // Fetch ALL running activities from cache (no limit for pagination)
    const q = query(
      collection(db, "activities"),
      where("user_id", "==", userId),
      where("type", "==", "Run"),
      orderBy("start_date_local", "desc")
    );

    const querySnapshot = await getDocs(q);
    const allRunningActivities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

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
        ai_analysis: activity.ai_analysis || null,
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

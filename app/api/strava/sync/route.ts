import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  collection,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  getCountFromServer
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Demo user ID (same as training plans)
const getCurrentUserId = (): string => {
  return "123e4567-e89b-12d3-a456-426614174000";
};

// Fetch all activities from Strava with pagination
async function fetchAllStravaActivities(accessToken: string, per_page = 200) {
  let allActivities: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching page ${page} of Strava activities...`);

    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${per_page}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("401");
      }
      throw new Error(`Strava API error: ${response.status}`);
    }

    const activities = await response.json();

    if (activities.length === 0) {
      hasMore = false;
    } else {
      allActivities = allActivities.concat(activities);
      page++;

      // Add a small delay to respect rate limits
      if (activities.length === per_page) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Safety check to prevent infinite loops
    if (page > 100) {
      console.log("Reached maximum page limit (100), stopping sync");
      break;
    }
  }

  console.log(`Fetched ${allActivities.length} total activities from Strava`);
  return allActivities;
}

// Transform Strava activity to database format
function transformActivity(activity: any, userId: string) {
  return {
    id: String(activity.id), // Firestore IDs are strings
    user_id: userId,
    name: activity.name || null,
    type: activity.type || null,
    sport_type: activity.sport_type || null,
    start_date: activity.start_date || null,
    start_date_local: activity.start_date_local || null,
    distance: activity.distance || 0,
    moving_time: activity.moving_time || 0,
    elapsed_time: activity.elapsed_time || 0,
    total_elevation_gain: activity.total_elevation_gain || 0,
    average_speed: activity.average_speed || null,
    max_speed: activity.max_speed || null,
    average_heartrate: activity.average_heartrate || null,
    max_heartrate: activity.max_heartrate || null,
    calories: activity.calories || null,
    suffer_score: activity.suffer_score || null,
    description: activity.description || null,
    gear_id: activity.gear_id || null,
    trainer: activity.trainer === true,
    commute: activity.commute === true,
    manual: activity.manual === true,
    private: activity.private === true,
    visibility: activity.visibility || 'everyone',
    flagged: activity.flagged === true,
    workout_type: activity.workout_type || null,
    upload_id: activity.upload_id || null,
    external_id: activity.external_id || null,
    from_accepted_tag: activity.from_accepted_tag === true,
    segment_efforts: activity.segment_efforts || null,
    splits_metric: activity.splits_metric || null,
    splits_standard: activity.splits_standard || null,
    best_efforts: activity.best_efforts || null,
    device_name: activity.device_name || null,
    embed_token: activity.embed_token || null,
    photos: activity.photos || null,
    stats_visibility: activity.stats_visibility || null,
    similar_activities: activity.similar_activities || null,
    available_zones: activity.available_zones || null,
    raw_data: activity || null, // Store complete Strava response
    synced_at: new Date().toISOString(),
  };
}

// Log sync operation
async function logSyncOperation(
  userId: string,
  syncType: string,
  status: string,
  activitiesSynced?: number,
  activitiesUpdated?: number,
  errorMessage?: string,
  startTime?: Date
) {
  const logData: any = {
    user_id: userId,
    sync_type: syncType,
    status: status,
    started_at: startTime ? startTime.toISOString() : new Date().toISOString(),
  };

  if (activitiesSynced !== undefined) logData.activities_synced = activitiesSynced;
  if (activitiesUpdated !== undefined) logData.activities_updated = activitiesUpdated;
  if (errorMessage) logData.error_message = errorMessage;
  if (startTime) {
    logData.completed_at = new Date().toISOString();
    logData.duration_seconds = Math.round((Date.now() - startTime.getTime()) / 1000);
  }

  try {
    const logId = `${userId}_${Date.now()}`;
    await setDoc(doc(db, "sync_logs", logId), logData);
  } catch (error) {
    console.error("Failed to log sync operation:", error);
  }
}

// Update user profile with latest sync info
async function updateUserProfile(userId: string, athleteInfo: any, totalActivities: number) {
  const profileData = {
    user_id: userId,
    strava_athlete_id: athleteInfo.id,
    first_name: athleteInfo.firstname,
    last_name: athleteInfo.lastname,
    profile_medium: athleteInfo.profile_medium,
    profile: athleteInfo.profile,
    city: athleteInfo.city,
    state: athleteInfo.state,
    country: athleteInfo.country,
    sex: athleteInfo.sex,
    premium: athleteInfo.premium || false,
    summit: athleteInfo.summit || false,
    last_sync_at: new Date().toISOString(),
    activities_count: totalActivities,
  };

  try {
    await setDoc(doc(db, "user_profiles", userId), profileData, { merge: true });
  } catch (error) {
    console.error("Failed to update user profile:", error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = new Date();
  const userId = getCurrentUserId();

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value || process.env.STRAVA_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not connected to Strava", connected: false },
        { status: 401 }
      );
    }

    // Log sync start
    await logSyncOperation(userId, "full", "started", undefined, undefined, undefined, startTime);

    console.log("Starting full Strava sync...");

    // Fetch athlete info
    const athleteResponse = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!athleteResponse.ok) {
      throw new Error("Failed to fetch athlete info");
    }

    const athleteInfo = await athleteResponse.json();

    // Fetch all activities
    const activities = await fetchAllStravaActivities(accessToken);

    if (activities.length === 0) {
      await logSyncOperation(userId, "full", "completed", 0, 0, undefined, startTime);
      return NextResponse.json({
        success: true,
        message: "No activities found to sync",
        activitiesSynced: 0,
        activitiesUpdated: 0,
      });
    }

    // Transform activities for database
    const transformedActivities = activities.map(activity =>
      transformActivity(activity, userId)
    );

    console.log(`Inserting ${transformedActivities.length} activities into database...`);

    // Batch insert activities (using setDoc with merge: true for upsert behavior)
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < transformedActivities.length; i += batchSize) {
      const batchItems = transformedActivities.slice(i, i + batchSize);
      const batch = writeBatch(db);

      batchItems.forEach(activity => {
        const activityRef = doc(db, "activities", String(activity.id));
        batch.set(activityRef, activity, { merge: true });
      });

      try {
        await batch.commit();
        totalInserted += batchItems.length;
        console.log(`Processed ${Math.min(i + batchSize, transformedActivities.length)} of ${transformedActivities.length} activities`);
      } catch (error) {
        console.error(`Failed to commit batch ${i}-${i + batchSize}:`, error);

        // Try individual setDoc if batch fails
        for (const item of batchItems) {
          try {
            await setDoc(doc(db, "activities", String(item.id)), item, { merge: true });
            totalInserted += 1;
          } catch (singleError) {
            console.error(`Failed to insert individual activity ${item.id}:`, singleError);
          }
        }
      }
    }

    // Update user profile
    await updateUserProfile(userId, athleteInfo, activities.length);

    // Log successful completion
    await logSyncOperation(userId, "full", "completed", totalInserted, 0, undefined, startTime);

    console.log(`Sync completed successfully. Synced ${totalInserted} activities.`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalInserted} activities`,
      activitiesSynced: totalInserted,
      activitiesUpdated: 0,
      athleteInfo: {
        name: `${athleteInfo.firstname} ${athleteInfo.lastname}`,
        totalActivities: activities.length,
      },
    });

  } catch (error) {
    console.error("Sync failed:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logSyncOperation(userId, "full", "failed", 0, 0, errorMessage, startTime);

    if (errorMessage.includes("401")) {
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
        error: "Sync failed",
        message: errorMessage,
        connected: true,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();

  try {
    // Get latest sync log
    const syncLogsQuery = query(
      collection(db, "sync_logs"),
      where("user_id", "==", userId),
      orderBy("started_at", "desc"),
      limit(1)
    );
    const syncLogsSnap = await getDocs(syncLogsQuery);
    const lastSync = !syncLogsSnap.empty ? syncLogsSnap.docs[0].data() : null;

    // Get user profile
    const profileRef = doc(db, "user_profiles", userId);
    const profileSnap = await getDoc(profileRef);
    const profile = profileSnap.exists() ? profileSnap.data() : null;

    // Get activities count
    const activitiesQuery = query(
      collection(db, "activities"),
      where("user_id", "==", userId)
    );
    const activitiesCountSnap = await getCountFromServer(activitiesQuery);
    const totalActivities = activitiesCountSnap.data().count;

    return NextResponse.json({
      lastSync: lastSync,
      profile: profile,
      totalActivities: totalActivities,
      hasData: totalActivities > 0,
    });

  } catch (error) {
    console.error("Failed to get sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}
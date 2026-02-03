import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StravaActivity {
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
}

interface StravaSummary {
  totalDistance: number;
  totalTime: number;
  avgPace: number;
  totalCalories: number;
  totalRuns: number;
  avgHeartrate: number;
}

interface StravaData {
  recentActivities: StravaActivity[];
  summary: StravaSummary;
  isCachedData?: boolean;
}

// Demo user ID
const getCurrentUserId = (): string => {
  return "123e4567-e89b-12d3-a456-426614174000";
};

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("force") === "true";

  try {
    // 1. Check if we have a recent summary in Firestore (unless force refresh)
    if (!forceRefresh) {
      const summaryRef = doc(db, "fitness_summaries", userId);
      const summarySnap = await getDoc(summaryRef);

      if (summarySnap.exists()) {
        const data = summarySnap.data();
        const lastUpdated = data.updated_at?.toDate() || new Date(0);
        const now = new Date();
        const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceUpdate < 7) {
          console.log("Returning cached AI fitness summary (", daysSinceUpdate.toFixed(1), "days old )");
          return NextResponse.json({
            summary: data.summary,
            dataSource: "cached_analysis",
            lastUpdated: lastUpdated.toISOString(),
            activityCount: data.activityCount || 0,
            isFresh: false
          });
        }
      }
    }

    // 2. Fetch current Strava data
    const stravaResponse = await fetch(
      `${request.nextUrl.origin}/api/strava/activities-cached`,
      {
        method: "GET",
        headers: {
          Cookie: request.headers.get("Cookie") || "",
        },
      }
    );

    if (!stravaResponse.ok) {
      const status = stravaResponse.status;
      let errorMessage = "Failed to fetch Strava data";
      let summaryMessage = "Unable to generate fitness summary - Strava data unavailable";

      if (status === 401) {
        errorMessage = "Not connected to Strava";
        summaryMessage = "Please connect your Strava account in Settings to see your fitness analysis.";
      } else if (status === 404) {
        errorMessage = "No synced data found";
        summaryMessage = "Your Strava data hasn't been synced to the new database yet. Please click 'Sync' to import your activities.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          summary: summaryMessage,
          status: status
        },
        { status: status === 401 || status === 404 ? status : 500 }
      );
    }

    const stravaData: StravaData = await stravaResponse.json();

    // 3. Generate new AI fitness summary
    console.log("Generating NEW AI fitness summary...");
    const summary = await generateFitnessSummary(stravaData);

    // 4. Save to Firestore
    const summaryRef = doc(db, "fitness_summaries", userId);
    const summaryData = {
      user_id: userId,
      summary: summary,
      activityCount: stravaData.recentActivities?.length || 0,
      updated_at: serverTimestamp(),
    };

    await setDoc(summaryRef, summaryData);

    return NextResponse.json({
      summary,
      dataSource: stravaData.isCachedData ? "cached_strava" : "live_strava",
      lastUpdated: new Date().toISOString(),
      activityCount: stravaData.recentActivities?.length || 0,
      isFresh: true
    });
  } catch (error) {
    console.error("Error generating fitness summary:", error);
    return NextResponse.json(
      {
        error: "Failed to generate fitness summary",
        summary:
          "Unable to analyze your fitness data at the moment. Please try again later.",
      },
      { status: 500 }
    );
  }
}

async function generateFitnessSummary(stravaData: StravaData): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not set");
    }

    const { recentActivities, summary } = stravaData;

    // Prepare analysis data
    const analysisPrompt = createAnalysisPrompt(recentActivities, summary);

    // Initialize Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: analysisPrompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return "Unable to generate textual summary.";
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    // Fallback to rule-based summary
    return generateRuleBasedSummary(stravaData);
  }
}

function createAnalysisPrompt(
  activities: StravaActivity[],
  summary: StravaSummary
): string {
  const recentActivity = activities?.[0];
  const totalRuns = activities?.length || 0;

  // Calculate recent trends
  const last7Days = activities?.slice(0, 7) || [];
  const avgPaceLast7 =
    last7Days.length > 0
      ? last7Days.reduce((sum, act) => sum + act.pace, 0) / last7Days.length
      : summary.avgPace;

  const avgDistanceLast7 =
    last7Days.length > 0
      ? last7Days.reduce((sum, act) => sum + act.distance, 0) / last7Days.length
      : 0;

  // Calculate weekly frequency
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const runsThisWeek =
    activities?.filter((activity) => {
      const activityDate = new Date(activity.rawDate || activity.date);
      return activityDate >= oneWeekAgo;
    }).length || 0;

  return `Analyze this runner's fitness data and provide a brief, encouraging summary (150-200 words):

RECENT ACTIVITY DATA:
- Total activities: ${totalRuns}
- Last run: ${recentActivity
      ? `${recentActivity.name} - ${recentActivity.distance}km in ${recentActivity.duration} (${recentActivity.pace}'/km pace)`
      : "No recent activity"
    }
- Runs this week: ${runsThisWeek}
- Average pace (last 7 runs): ${avgPaceLast7.toFixed(1)}'/km
- Average distance (last 7 runs): ${avgDistanceLast7.toFixed(1)}km

OVERALL STATS:
- Total distance: ${summary.totalDistance}km
- Average pace: ${summary.avgPace}'/km
- Average heart rate: ${summary.avgHeartrate} bpm
- Total calories: ${summary.totalCalories}

Please provide:
1. Current fitness assessment (strengths, areas for improvement)
2. Recent training trends and patterns
3. Actionable recommendations for the next week
4. Motivational insight

Keep it personal, specific, and actionable. Focus on positive reinforcement while providing valuable coaching insights.`;
}

function generateRuleBasedSummary(stravaData: StravaData): string {
  const { recentActivities, summary } = stravaData;
  const recentActivity = recentActivities?.[0];
  const totalRuns = recentActivities?.length || 0;

  // Calculate training consistency
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const runsThisWeek =
    recentActivities?.filter((activity) => {
      const activityDate = new Date(activity.rawDate || activity.date);
      return activityDate >= oneWeekAgo;
    }).length || 0;

  let consistencyNote = "";
  if (runsThisWeek >= 4) {
    consistencyNote = "excellent training consistency this week";
  } else if (runsThisWeek >= 2) {
    consistencyNote = "good training consistency";
  } else if (runsThisWeek >= 1) {
    consistencyNote = "some training activity this week";
  } else {
    consistencyNote = "limited recent activity";
  }

  // Pace analysis
  let paceNote = "";
  if (summary.avgPace <= 4.0) {
    paceNote = "strong pace performance";
  } else if (summary.avgPace <= 5.0) {
    paceNote = "solid pace consistency";
  } else if (summary.avgPace <= 6.0) {
    paceNote = "steady endurance pace";
  } else {
    paceNote = "building endurance foundation";
  }

  // Distance analysis
  const avgDistance = totalRuns > 0 ? summary.totalDistance / totalRuns : 0;
  let distanceNote = "";
  if (avgDistance >= 8) {
    distanceNote = "focusing on longer distances";
  } else if (avgDistance >= 5) {
    distanceNote = "maintaining good run distances";
  } else {
    distanceNote = "building distance gradually";
  }

  return `🏃‍♂️ **Current Fitness Overview**

You're showing ${consistencyNote} with ${totalRuns} total activities recorded. Your ${paceNote} at an average of ${summary.avgPace
    }'/km demonstrates ${avgDistance >= 5 ? "strong" : "developing"
    } endurance capacity.

**Recent Performance**: ${recentActivity
      ? `Your latest ${recentActivity.distance}km run in ${recentActivity.duration
      } shows ${recentActivity.pace <= summary.avgPace ? "improved" : "consistent"
      } pacing.`
      : "Ready for your next run!"
    }

**Training Focus**: You're ${distanceNote}, which is ${avgDistance >= 5
      ? "excellent for building aerobic base"
      : "perfect for injury prevention and gradual progression"
    }.

**Recommendations**: 
- ${runsThisWeek < 3
      ? "Aim for 3-4 runs this week to build consistency"
      : "Maintain your current training frequency"
    }
- ${summary.avgPace > 5.5
      ? "Focus on easy conversational pace for 80% of runs"
      : "Consider adding one tempo session weekly"
    }
- Track your heart rate data to optimize training zones

Keep up the momentum! Your dedication is building a strong foundation for long-term running success. 🎯`;
}

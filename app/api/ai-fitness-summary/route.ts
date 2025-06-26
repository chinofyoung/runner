import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  try {
    // Fetch current Strava data
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
      return NextResponse.json(
        {
          error: "Failed to fetch Strava data",
          summary:
            "Unable to generate fitness summary - Strava data unavailable",
        },
        { status: 500 }
      );
    }

    const stravaData: StravaData = await stravaResponse.json();

    // Generate AI fitness summary
    const summary = await generateFitnessSummary(stravaData);

    return NextResponse.json({
      summary,
      dataSource: stravaData.isCachedData ? "cached" : "live",
      lastUpdated: new Date().toISOString(),
      activityCount: stravaData.recentActivities?.length || 0,
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
    const { recentActivities, summary } = stravaData;

    // Prepare analysis data
    const analysisPrompt = createAnalysisPrompt(recentActivities, summary);

    // Call Claude API for intelligent analysis
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get AI analysis");
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Error calling Claude API:", error);
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
- Last run: ${
    recentActivity
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

You're showing ${consistencyNote} with ${totalRuns} total activities recorded. Your ${paceNote} at an average of ${
    summary.avgPace
  }'/km demonstrates ${
    avgDistance >= 5 ? "strong" : "developing"
  } endurance capacity.

**Recent Performance**: ${
    recentActivity
      ? `Your latest ${recentActivity.distance}km run in ${
          recentActivity.duration
        } shows ${
          recentActivity.pace <= summary.avgPace ? "improved" : "consistent"
        } pacing.`
      : "Ready for your next run!"
  }

**Training Focus**: You're ${distanceNote}, which is ${
    avgDistance >= 5
      ? "excellent for building aerobic base"
      : "perfect for injury prevention and gradual progression"
  }.

**Recommendations**: 
- ${
    runsThisWeek < 3
      ? "Aim for 3-4 runs this week to build consistency"
      : "Maintain your current training frequency"
  }
- ${
    summary.avgPace > 5.5
      ? "Focus on easy conversational pace for 80% of runs"
      : "Consider adding one tempo session weekly"
  }
- Track your heart rate data to optimize training zones

Keep up the momentum! Your dedication is building a strong foundation for long-term running success. 🎯`;
}

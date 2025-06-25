import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

interface TrainingSession {
  id: string;
  day: string;
  date: string;
  type: "easy" | "tempo" | "long" | "interval" | "race" | "rest";
  duration: string;
  distance?: string;
  description: string;
  completed?: boolean;
  actualActivity?: {
    name: string;
    distance: number;
    duration: string;
    pace: number;
  };
}

async function fetchStravaActivities(accessToken: string) {
  try {
    const response = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=30",
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
    console.error("Error fetching Strava activities:", error);
    throw error;
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:00`;
  }
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function convertToKmPace(speedMs: number): number {
  const kmh = speedMs * 3.6;
  const minPerKm = 60 / kmh;
  return Math.round(minPerKm * 10) / 10;
}

function getWeekDates() {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDay + 1); // Get Monday of current week

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
}

function generateTrainingPlan(): TrainingSession[] {
  const weekDates = getWeekDates();
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const planTemplate = [
    {
      type: "easy" as const,
      duration: "45 min",
      distance: "6-7 km",
      description: "Easy run at conversational pace",
    },
    {
      type: "interval" as const,
      duration: "50 min",
      distance: "8 km",
      description: "4x 1km intervals at 5K pace with 2min recovery",
    },
    {
      type: "rest" as const,
      duration: "Rest",
      description: "Rest day or gentle yoga/stretching",
    },
    {
      type: "tempo" as const,
      duration: "55 min",
      distance: "9 km",
      description: "3km warm-up, 5km tempo, 1km cool-down",
    },
    {
      type: "rest" as const,
      duration: "Rest",
      description: "Rest day or light cross-training",
    },
    {
      type: "long" as const,
      duration: "90 min",
      distance: "15 km",
      description: "Long steady run at easy pace",
    },
    {
      type: "easy" as const,
      duration: "30 min",
      distance: "4-5 km",
      description: "Recovery run at very easy pace",
    },
  ];

  return weekDates.map((date, index) => ({
    id: (index + 1).toString(),
    day: days[index],
    date: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
    ...planTemplate[index],
    completed: false,
  }));
}

function matchActivitiesToPlan(
  trainingPlan: TrainingSession[],
  activities: any[]
): TrainingSession[] {
  const weekDates = getWeekDates();

  return trainingPlan.map((session, index) => {
    const sessionDate = weekDates[index];
    const dayStart = new Date(sessionDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(sessionDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Find activities on this day
    const dayActivities = activities.filter((activity: any) => {
      const activityDate = new Date(
        activity.start_date_local || activity.start_date
      );
      return (
        activityDate >= dayStart &&
        activityDate <= dayEnd &&
        (activity.type === "Run" || activity.sport_type === "Run")
      );
    });

    if (dayActivities.length > 0) {
      // Use the longest run of the day
      const mainActivity = dayActivities.reduce((longest: any, current: any) =>
        current.distance > longest.distance ? current : longest
      );

      return {
        ...session,
        completed: true,
        actualActivity: {
          name: mainActivity.name,
          distance: Math.round(mainActivity.distance / 100) / 10, // Convert to km
          duration: formatDuration(mainActivity.moving_time),
          pace: convertToKmPace(mainActivity.average_speed),
        },
      };
    }

    return session;
  });
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;

    // Generate base training plan
    let trainingPlan = generateTrainingPlan();

    if (accessToken) {
      try {
        // Fetch real Strava activities
        const activities = await fetchStravaActivities(accessToken);

        // Match activities to training plan
        trainingPlan = matchActivitiesToPlan(trainingPlan, activities);
      } catch (error) {
        console.error("Error fetching Strava data for training plan:", error);
        // Continue with base plan if Strava fetch fails
      }
    }

    const completedSessions = trainingPlan.filter(
      (session) => session.completed
    ).length;
    const progressPercentage = (completedSessions / trainingPlan.length) * 100;

    return NextResponse.json({
      trainingPlan,
      summary: {
        completedSessions,
        totalSessions: trainingPlan.length,
        progressPercentage: Math.round(progressPercentage),
        weekNumber: 8, // Could be calculated based on training start date
        totalWeeks: 12,
        planType: "Half Marathon Training",
      },
      connected: !!accessToken,
    });
  } catch (error) {
    console.error("Error generating training plan:", error);
    return NextResponse.json(
      {
        error: "Failed to generate training plan",
        message: "There was an error generating your training plan",
      },
      { status: 500 }
    );
  }
}

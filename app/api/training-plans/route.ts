import { NextRequest, NextResponse } from "next/server";

interface TrainingSession {
  day: string;
  type: "easy" | "tempo" | "long" | "interval" | "race" | "rest";
  duration: string;
  distance?: string;
  description: string;
}

interface TrainingPlan {
  id?: string;
  title: string;
  description: string;
  duration: string;
  sessions: TrainingSession[];
  created_at?: string;
  user_id?: string;
}

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For now, we'll use a simple user ID since we don't have auth implemented
const getCurrentUserId = (): string => {
  // Use a valid UUID format for the demo user
  return "123e4567-e89b-12d3-a456-426614174000";
};

// Direct Supabase REST API calls
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
    Prefer: method === "POST" ? "return=representation" : "return=minimal",
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
      body,
      errorResponse: errorText,
    });
    throw new Error(
      `Supabase API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  if (method === "DELETE") {
    return null;
  }

  return response.json();
};

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const plans = await supabaseRequest("GET", "training_plans", null, {
      user_id: `eq.${userId}`,
      order: "created_at.desc",
    });

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error("Error fetching saved plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!plan || !plan.title || !plan.sessions) {
      return NextResponse.json(
        { error: "Invalid training plan data" },
        { status: 400 }
      );
    }

    const userId = getCurrentUserId();

    const newPlan = {
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      sessions: plan.sessions,
      user_id: userId,
    };

    const result = await supabaseRequest("POST", "training_plans", newPlan);

    return NextResponse.json({
      success: true,
      plan: result[0],
    });
  } catch (error) {
    console.error("Error saving training plan:", error);
    return NextResponse.json(
      { error: "Failed to save training plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("id");

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    const userId = getCurrentUserId();

    await supabaseRequest("DELETE", "training_plans", null, {
      id: `eq.${planId}`,
      user_id: `eq.${userId}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting training plan:", error);
    return NextResponse.json(
      { error: "Failed to delete training plan" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// Create Supabase client on demand (server-side only)
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: -1,
      },
    },
  });
};

// For now, we'll use a simple user ID since we don't have auth implemented
// In a real app, this would come from the authenticated user session
const getCurrentUserId = (): string => {
  // For demo purposes, using a fixed user ID
  // In production, this would be extracted from the authenticated session
  return "demo-user-001";
};

export async function GET() {
  try {
    const userId = getCurrentUserId();
    const supabase = getSupabaseClient();

    const { data: plans, error } = await supabase
      .from("training_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch training plans" },
        { status: 500 }
      );
    }

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
    const supabase = getSupabaseClient();

    const newPlan = {
      title: plan.title,
      description: plan.description,
      duration: plan.duration,
      sessions: plan.sessions,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from("training_plans")
      .insert([newPlan])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save training plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: data,
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
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("training_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete training plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting training plan:", error);
    return NextResponse.json(
      { error: "Failed to delete training plan" },
      { status: 500 }
    );
  }
}

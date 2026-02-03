import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  created_at?: any;
  user_id?: string;
}

// For now, we'll use a simple user ID since we don't have auth implemented
const getCurrentUserId = (): string => {
  // Use a valid UUID format for the demo user
  return "123e4567-e89b-12d3-a456-426614174000";
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("id");
    const userId = getCurrentUserId();

    if (planId) {
      // Fetch specific plan by ID
      const docRef = doc(db, "training_plans", planId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists() || docSnap.data().user_id !== userId) {
        return NextResponse.json(
          { error: "Training plan not found" },
          { status: 404 }
        );
      }

      const plan = { id: docSnap.id, ...docSnap.data() } as TrainingPlan;
      return NextResponse.json({ plan });
    } else {
      // Fetch all plans for the user
      const q = query(
        collection(db, "training_plans"),
        where("user_id", "==", userId),
        orderBy("created_at", "desc")
      );

      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ plans });
    }
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
      description: plan.description || "",
      duration: plan.duration || "",
      sessions: plan.sessions,
      user_id: userId,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "training_plans"), newPlan);
    const savedDoc = await getDoc(docRef);

    return NextResponse.json({
      success: true,
      plan: { id: docRef.id, ...savedDoc.data() },
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
    const docRef = doc(db, "training_plans", planId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized or plan not found" },
        { status: 403 }
      );
    }

    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting training plan:", error);
    return NextResponse.json(
      { error: "Failed to delete training plan" },
      { status: 500 }
    );
  }
}

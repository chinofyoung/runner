import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Anthropic from "@anthropic-ai/sdk";

// Demo user ID
const getCurrentUserId = (): string => {
    return "123e4567-e89b-12d3-a456-426614174000";
};

export async function POST(request: NextRequest) {
    const userId = getCurrentUserId();

    try {
        const { activityId } = await request.json();

        if (!activityId) {
            return NextResponse.json(
                { error: "Activity ID is required" },
                { status: 400 }
            );
        }

        // 1. Fetch activity from Firestore
        const activityRef = doc(db, "activities", String(activityId));
        const activitySnap = await getDoc(activityRef);

        if (!activitySnap.exists()) {
            return NextResponse.json(
                { error: "Activity not found" },
                { status: 404 }
            );
        }

        const activityData = activitySnap.data();

        // Verify ownership
        if (activityData.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Generate analysis with Claude
        const analysis = await generateActivityAnalysis(activityData);

        // 3. Save analysis to Firestore
        await updateDoc(activityRef, {
            ai_analysis: analysis,
            ai_analysis_updated_at: serverTimestamp()
        });

        return NextResponse.json({
            success: true,
            analysis,
            updated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error analyzing activity:", error);
        return NextResponse.json(
            { error: "Failed to analyze activity" },
            { status: 500 }
        );
    }
}

async function generateActivityAnalysis(activity: any): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY not set");
    }

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const paceInMinutes = (speedMs: number) => {
        if (!speedMs || speedMs <= 0) return "0:00";
        const paceSeconds = 1000 / speedMs;
        const minutes = Math.floor(paceSeconds / 60);
        const seconds = Math.round(paceSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const distanceKm = (activity.distance / 1000).toFixed(2);
    const avgPace = paceInMinutes(activity.average_speed);
    const movingTimeMin = Math.round(activity.moving_time / 60);

    const prompt = `Analyze this specific running activity and provide a brief coaching insight (50-80 words).
  
Activity Details:
- Name: ${activity.name}
- Type: ${activity.type}
- Distance: ${distanceKm} km
- Duration: ${movingTimeMin} minutes
- Average Pace: ${avgPace} /km
- Average Heart Rate: ${activity.average_heartrate || "N/A"} bpm
- Max Heart Rate: ${activity.max_heartrate || "N/A"} bpm
- Total Elevation Gain: ${activity.total_elevation_gain || 0} m
- Suffer Score: ${activity.suffer_score || "N/A"}

Please provide:
1. A quick assessment of this specific run (effort level, performance).
2. One specific coaching tip based on these stats.
3. A motivational comment.

Keep it concise, supportive and professional.`;

    const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
        return content.text;
    }
    return "Unable to generate textual analysis.";
}

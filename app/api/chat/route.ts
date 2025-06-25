import { NextRequest, NextResponse } from "next/server";

interface TrainingSession {
  day: string;
  type: "easy" | "tempo" | "long" | "interval" | "race" | "rest";
  duration: string;
  distance?: string;
  description: string;
}

interface TrainingPlan {
  title: string;
  description: string;
  duration: string;
  sessions: TrainingSession[];
}

function detectTrainingPlanRequest(message: string): boolean {
  const trainingPlanKeywords = [
    "training plan",
    "workout plan",
    "running plan",
    "training schedule",
    "create a plan",
    "make a plan",
    "plan for",
    "training program",
    "5k plan",
    "10k plan",
    "half marathon plan",
    "marathon plan",
    "beginner plan",
    "intermediate plan",
    "advanced plan",
  ];

  const lowerMessage = message.toLowerCase();
  return trainingPlanKeywords.some((keyword) => lowerMessage.includes(keyword));
}

function parseTrainingPlan(aiResponse: string): TrainingPlan | null {
  try {
    // Look for structured training plan content in the AI response
    const lines = aiResponse
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    // Try to extract plan title
    let title = "Training Plan";
    let description = "AI-generated training plan";
    let duration = "Variable";
    const sessions: TrainingSession[] = [];

    // Look for title patterns
    const titleMatch = aiResponse.match(
      /(?:plan|program|schedule).*?(?:for|:)\s*([^.\n]+)/i
    );
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // Look for duration patterns
    const durationMatch = aiResponse.match(
      /(\d+[-\s]?weeks?|\d+[-\s]?months?)/i
    );
    if (durationMatch) {
      duration = durationMatch[1];
    }

    // Parse weekly schedule - look for day patterns
    const dayPatterns = [
      /monday|mon\b/i,
      /tuesday|tue\b/i,
      /wednesday|wed\b/i,
      /thursday|thu\b/i,
      /friday|fri\b/i,
      /saturday|sat\b/i,
      /sunday|sun\b/i,
    ];

    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line contains a day
      const dayIndex = dayPatterns.findIndex((pattern) => pattern.test(line));
      if (dayIndex !== -1) {
        const dayName = dayNames[dayIndex];

        // Determine workout type based on keywords
        let type: TrainingSession["type"] = "easy";
        let duration = "30-45 min";
        let distance = "";
        let description = "Training session";

        const lineLower = line.toLowerCase();

        if (lineLower.includes("rest") || lineLower.includes("off")) {
          type = "rest";
          duration = "Rest";
          description = "Rest day or light stretching";
        } else if (
          lineLower.includes("interval") ||
          lineLower.includes("speed") ||
          lineLower.includes("track")
        ) {
          type = "interval";
          duration = "45-60 min";
          description = "Interval training session";
        } else if (
          lineLower.includes("tempo") ||
          lineLower.includes("threshold")
        ) {
          type = "tempo";
          duration = "45-60 min";
          description = "Tempo run at comfortably hard pace";
        } else if (
          lineLower.includes("long") ||
          lineLower.includes("endurance")
        ) {
          type = "long";
          duration = "60-120 min";
          description = "Long steady run at easy pace";
        } else if (
          lineLower.includes("easy") ||
          lineLower.includes("recovery") ||
          lineLower.includes("jog")
        ) {
          type = "easy";
          duration = "30-45 min";
          description = "Easy run at conversational pace";
        }

        // Extract distance if mentioned
        const distanceMatch = line.match(
          /(\d+(?:\.\d+)?)\s*(?:k|km|miles?|mi)\b/i
        );
        if (distanceMatch) {
          distance = distanceMatch[0];
        }

        // Extract duration if mentioned
        const durationMatch = line.match(
          /(\d+)\s*(?:min|minutes?|hrs?|hours?)/i
        );
        if (durationMatch) {
          const num = parseInt(durationMatch[1]);
          const unit = durationMatch[0].toLowerCase();
          if (unit.includes("hr") || unit.includes("hour")) {
            duration = `${num * 60} min`;
          } else {
            duration = `${num} min`;
          }
        }

        // Use the rest of the line as description if it's substantial
        const cleanLine = line
          .replace(
            /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s:,-]*/i,
            ""
          )
          .trim();
        if (cleanLine.length > 10) {
          description = cleanLine;
        }

        sessions.push({
          day: dayName,
          type,
          duration,
          distance,
          description,
        });
      }
    }

    // If we found sessions, return the plan
    if (sessions.length >= 3) {
      return {
        title,
        description,
        duration,
        sessions,
      };
    }

    // Fallback: create a basic plan structure if keywords suggest it's a training plan
    if (aiResponse.toLowerCase().includes("plan") && aiResponse.length > 200) {
      // Extract target distance/race
      let raceType = "running";
      if (aiResponse.toLowerCase().includes("5k")) raceType = "5K";
      else if (aiResponse.toLowerCase().includes("10k")) raceType = "10K";
      else if (aiResponse.toLowerCase().includes("half marathon"))
        raceType = "Half Marathon";
      else if (aiResponse.toLowerCase().includes("marathon"))
        raceType = "Marathon";

      return {
        title: `${raceType} Training Plan`,
        description: `Personalized ${raceType.toLowerCase()} training program`,
        duration: "8-12 weeks",
        sessions: [
          {
            day: "Monday",
            type: "easy",
            duration: "30-45 min",
            distance: "5-7 km",
            description: "Easy run at conversational pace",
          },
          {
            day: "Tuesday",
            type: "interval",
            duration: "45-60 min",
            distance: "6-8 km",
            description: "Speed work and intervals",
          },
          {
            day: "Wednesday",
            type: "rest",
            duration: "Rest",
            description: "Rest day or cross-training",
          },
          {
            day: "Thursday",
            type: "tempo",
            duration: "45-60 min",
            distance: "6-8 km",
            description: "Tempo run at comfortably hard pace",
          },
          {
            day: "Friday",
            type: "rest",
            duration: "Rest",
            description: "Rest day or easy cross-training",
          },
          {
            day: "Saturday",
            type: "long",
            duration: "60-90 min",
            distance: "10-15 km",
            description: "Long run at steady, comfortable pace",
          },
          {
            day: "Sunday",
            type: "easy",
            duration: "30-45 min",
            distance: "4-6 km",
            description: "Recovery run at very easy pace",
          },
        ],
      };
    }

    return null;
  } catch (error) {
    console.error("Error parsing training plan:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const isTrainingPlanRequest = detectTrainingPlanRequest(message);

    // Enhanced system prompt for training plan requests
    const systemPrompt = isTrainingPlanRequest
      ? `You are an expert AI running coach assistant named Fitflex Coach. You specialize in creating personalized training plans.

When creating training plans, structure your response clearly with:
1. A brief introduction to the plan
2. Weekly schedule with specific days, workout types, and descriptions
3. Important training notes and tips

For training plans, always include:
- Monday through Sunday schedule
- Workout types: easy, tempo, interval, long, rest
- Specific distances and durations when possible
- Clear descriptions of each workout

Example format for training plans:
Monday: Easy Run - 30-45 minutes, 5-7km easy pace
Tuesday: Interval Training - 45 minutes with speed work
Wednesday: Rest Day - Complete rest or light stretching
Thursday: Tempo Run - 45 minutes at comfortably hard pace
Friday: Rest Day - Easy cross-training optional
Saturday: Long Run - 60-90 minutes at steady pace
Sunday: Recovery Run - 30 minutes very easy pace

Always be encouraging and provide practical, actionable advice.`
      : `You are an expert AI running coach assistant named Fitflex Coach. You specialize in:
        - Creating personalized training plans for 5K, 10K, Half Marathon, and Full Marathon distances
        - Providing pace guidance and workout recommendations
        - Offering nutrition and hydration advice for runners
        - Injury prevention and recovery strategies
        - Motivation and mental training tips
        
        Always be encouraging, knowledgeable, and provide practical advice. Keep responses concise but helpful.
        Focus on actionable running advice tailored to the user's questions.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500, // Increased for training plans
        system: systemPrompt,
        messages: [
          ...conversationHistory,
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API Error:", response.status, errorText);
      throw new Error(
        `Failed to get response from Claude: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const aiMessage = data.content[0].text;

    // Try to parse training plan if this was a training plan request
    let trainingPlan: TrainingPlan | null = null;
    if (isTrainingPlanRequest) {
      trainingPlan = parseTrainingPlan(aiMessage);
    }

    return NextResponse.json({
      message: aiMessage,
      trainingPlan,
    });
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}

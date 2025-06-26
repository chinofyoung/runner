import { NextRequest, NextResponse } from "next/server";

interface Message {
  id: string;
  content: string;
  sender: "ai" | "user";
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
}

// GET - Return conversation structure (client handles localStorage)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Conversation API ready. Use POST to save conversations.",
    structure: {
      conversations: "Array of conversation objects",
      format: {
        id: "string",
        title: "string",
        messages: "Array of message objects",
        created_at: "Date",
        updated_at: "Date",
      },
    },
  });
}

// POST - Process and enhance conversation data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, conversationData } = body;

    switch (action) {
      case "generateTitle":
        // Generate a title based on the first few messages
        const messages = conversationData.messages || [];
        const firstUserMessage = messages.find(
          (m: Message) => m.sender === "user"
        );

        if (firstUserMessage) {
          const content = firstUserMessage.content;
          let title = content.substring(0, 50);

          // Smart title generation based on content
          if (
            content.toLowerCase().includes("training") ||
            content.toLowerCase().includes("plan")
          ) {
            title = `Training Discussion - ${new Date().toLocaleDateString()}`;
          } else if (
            content.toLowerCase().includes("pace") ||
            content.toLowerCase().includes("speed")
          ) {
            title = `Pace & Performance Chat`;
          } else if (
            content.toLowerCase().includes("injury") ||
            content.toLowerCase().includes("pain")
          ) {
            title = `Health & Recovery Discussion`;
          } else {
            title =
              content.substring(0, 30) + (content.length > 30 ? "..." : "");
          }

          return NextResponse.json({ title });
        }

        return NextResponse.json({
          title: `Chat - ${new Date().toLocaleDateString()}`,
        });

      case "summarize":
        // Generate a summary of the conversation for context
        const allMessages = conversationData.messages || [];
        const summary = {
          messageCount: allMessages.length,
          topics: extractTopics(allMessages),
          lastActivity:
            allMessages[allMessages.length - 1]?.timestamp || new Date(),
          userQuestions: allMessages.filter(
            (m: Message) => m.sender === "user" && m.content.includes("?")
          ).length,
        };

        return NextResponse.json({ summary });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractTopics(messages: Message[]): string[] {
  const topics = new Set<string>();
  const keywords = {
    training: ["training", "workout", "plan", "exercise"],
    running: ["run", "pace", "distance", "marathon", "5k", "10k"],
    health: ["injury", "pain", "recovery", "rest", "sleep"],
    nutrition: ["eat", "food", "hydration", "fuel", "diet"],
    gear: ["shoes", "gear", "equipment", "watch"],
  };

  messages.forEach((message) => {
    const content = message.content.toLowerCase();
    Object.entries(keywords).forEach(([topic, words]) => {
      if (words.some((word) => content.includes(word))) {
        topics.add(topic);
      }
    });
  });

  return Array.from(topics);
}

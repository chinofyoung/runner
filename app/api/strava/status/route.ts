import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("strava_access_token")?.value;
  const athleteId = cookieStore.get("strava_athlete_id")?.value;

  return NextResponse.json({
    connected: !!accessToken,
    athleteId: athleteId || null,
  });
}

export async function DELETE(request: NextRequest) {
  // Disconnect Strava - clear cookies
  const cookieStore = await cookies();
  cookieStore.delete("strava_access_token");
  cookieStore.delete("strava_refresh_token");
  cookieStore.delete("strava_athlete_id");

  return NextResponse.json({ success: true, connected: false });
}

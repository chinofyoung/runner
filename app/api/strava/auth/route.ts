import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}api/strava/callback&approval_prompt=force&scope=read,activity:read_all`;

  return NextResponse.redirect(stravaAuthUrl);
}

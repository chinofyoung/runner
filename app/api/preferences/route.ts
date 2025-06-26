import { NextRequest, NextResponse } from "next/server";

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Demo user ID (same as training plans)
const getCurrentUserId = (): string => {
  return "123e4567-e89b-12d3-a456-426614174000";
};

// Supabase request helper
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
      errorResponse: errorText,
    });
    throw new Error(
      `Supabase API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const responseText = await response.text();
  if (!responseText) return method === "DELETE" ? {} : [];

  return JSON.parse(responseText);
};

// GET - Fetch user preferences
export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();

  try {
    // Try to get existing user profile with settings
    const profiles = await supabaseRequest("GET", "user_profiles", null, {
      user_id: `eq.${userId}`,
      limit: "1",
    });

    if (profiles && profiles.length > 0) {
      const userProfile = profiles[0];
      const settings = userProfile.settings || {};

      return NextResponse.json({
        success: true,
        preferences: {
          maxHR: settings.maxHR || null,
          lthr: settings.lthr || null,
          restingHR: settings.restingHR || null,
          zone2Method: settings.zone2Method || "maxhr",
          units: settings.units || "metric",
          timeFormat: settings.timeFormat || "24hour",
          privacy: settings.privacy || "public",
          notifications: settings.notifications !== false, // default true
          age: settings.age || null,
        },
        message: "Preferences loaded successfully",
      });
    } else {
      // Return default preferences
      return NextResponse.json({
        success: true,
        preferences: {
          maxHR: null,
          lthr: null,
          restingHR: null,
          zone2Method: "maxhr",
          units: "metric",
          timeFormat: "24hour",
          privacy: "public",
          notifications: true,
          age: null,
        },
        message: "Default preferences loaded",
      });
    }
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load preferences",
        message: "There was an error loading your preferences",
        preferences: {
          maxHR: null,
          lthr: null,
          restingHR: null,
          zone2Method: "maxhr",
          units: "metric",
          timeFormat: "24hour",
          privacy: "public",
          notifications: true,
          age: null,
        },
      },
      { status: 500 }
    );
  }
}

// POST - Save user preferences
export async function POST(request: NextRequest) {
  const userId = getCurrentUserId();

  try {
    const body = await request.json();
    const {
      maxHR,
      lthr,
      restingHR,
      zone2Method,
      units,
      timeFormat,
      privacy,
      notifications,
      age,
    } = body;

    // Validate input
    if (maxHR && (maxHR < 120 || maxHR > 220)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Max HR",
          message: "Max HR must be between 120 and 220 bpm",
        },
        { status: 400 }
      );
    }

    if (lthr && (lthr < 100 || lthr > 200)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid LTHR",
          message: "LTHR must be between 100 and 200 bpm",
        },
        { status: 400 }
      );
    }

    if (restingHR && (restingHR < 40 || restingHR > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Resting HR",
          message: "Resting HR must be between 40 and 100 bpm",
        },
        { status: 400 }
      );
    }

    if (maxHR && lthr && lthr >= maxHR) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid heart rate values",
          message: "LTHR must be lower than Max HR",
        },
        { status: 400 }
      );
    }

    // Check if user profile already exists
    const existingProfiles = await supabaseRequest(
      "GET",
      "user_profiles",
      null,
      {
        user_id: `eq.${userId}`,
        limit: "1",
      }
    );

    // Prepare the new settings object
    const newSettings = {
      maxHR: maxHR || null,
      lthr: lthr || null,
      restingHR: restingHR || null,
      zone2Method: zone2Method || "maxhr",
      units: units || "metric",
      timeFormat: timeFormat || "24hour",
      privacy: privacy || "public",
      notifications: notifications !== false,
      age: age || null,
    };

    if (existingProfiles && existingProfiles.length > 0) {
      // Update existing user profile with new settings
      const currentProfile = existingProfiles[0];
      const currentSettings = currentProfile.settings || {};

      // Merge existing settings with new preferences
      const updatedSettings = { ...currentSettings, ...newSettings };

      const updateData = {
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      };

      await supabaseRequest("PATCH", "user_profiles", updateData, {
        user_id: `eq.${userId}`,
      });

      return NextResponse.json({
        success: true,
        message: "Preferences updated successfully",
        preferences: newSettings,
      });
    } else {
      // Create new user profile with preferences
      const profileData = {
        user_id: userId,
        settings: newSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabaseRequest("POST", "user_profiles", profileData);

      return NextResponse.json({
        success: true,
        message: "Preferences saved successfully",
        preferences: newSettings,
      });
    }
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save preferences",
        message: "There was an error saving your preferences",
      },
      { status: 500 }
    );
  }
}

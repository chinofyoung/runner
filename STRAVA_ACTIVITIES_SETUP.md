# Strava Activities Sync & Storage Setup

## Overview

This setup implements a comprehensive Strava activities sync system that:
- Fetches all historical activities from Strava
- Stores them in Supabase for fast access and AI recommendations
- Implements incremental sync for new activities
- Enables rich analytics and personalized AI coaching

## Database Schema

### 1. Create Activities Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id BIGINT PRIMARY KEY, -- Use Strava activity ID as primary key
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    sport_type TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    start_date_local TIMESTAMPTZ NOT NULL,
    distance REAL NOT NULL, -- in meters
    moving_time INTEGER NOT NULL, -- in seconds
    elapsed_time INTEGER NOT NULL, -- in seconds
    total_elevation_gain REAL DEFAULT 0, -- in meters
    average_speed REAL, -- in m/s
    max_speed REAL, -- in m/s
    average_heartrate REAL,
    max_heartrate REAL,
    calories REAL,
    suffer_score REAL,
    description TEXT,
    gear_id TEXT,
    trainer BOOLEAN DEFAULT FALSE,
    commute BOOLEAN DEFAULT FALSE,
    manual BOOLEAN DEFAULT FALSE,
    private BOOLEAN DEFAULT FALSE,
    visibility TEXT DEFAULT 'everyone',
    flagged BOOLEAN DEFAULT FALSE,
    workout_type INTEGER,
    upload_id BIGINT,
    external_id TEXT,
    from_accepted_tag BOOLEAN DEFAULT FALSE,
    segment_efforts JSONB,
    splits_metric JSONB,
    splits_standard JSONB,
    best_efforts JSONB,
    device_name TEXT,
    embed_token TEXT,
    photos JSONB,
    stats_visibility JSONB,
    similar_activities JSONB,
    available_zones JSONB,
    raw_data JSONB, -- Store complete Strava response
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_profiles table for Strava connection info
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL, -- Demo user ID for now
    strava_athlete_id BIGINT UNIQUE,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    strava_token_expires_at TIMESTAMPTZ,
    first_name TEXT,
    last_name TEXT,
    profile_medium TEXT,
    profile TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    sex TEXT,
    premium BOOLEAN DEFAULT FALSE,
    summit BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ,
    activities_count INTEGER DEFAULT 0,
    total_distance REAL DEFAULT 0, -- in meters
    total_time INTEGER DEFAULT 0, -- in seconds
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync_logs table to track sync operations
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    sync_type TEXT NOT NULL, -- 'full', 'incremental', 'manual'
    status TEXT NOT NULL, -- 'started', 'completed', 'failed'
    activities_synced INTEGER DEFAULT 0,
    activities_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON activities(user_id);
CREATE INDEX IF NOT EXISTS activities_start_date_idx ON activities(start_date DESC);
CREATE INDEX IF NOT EXISTS activities_type_idx ON activities(type);
CREATE INDEX IF NOT EXISTS activities_user_date_idx ON activities(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS activities_user_type_idx ON activities(user_id, type);

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_strava_athlete_id_idx ON user_profiles(strava_athlete_id);

CREATE INDEX IF NOT EXISTS sync_logs_user_id_idx ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS sync_logs_started_at_idx ON sync_logs(started_at DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Sample Data Views

```sql
-- Create a view for running activities with calculated metrics
CREATE OR REPLACE VIEW running_activities AS
SELECT 
    id,
    user_id,
    name,
    start_date,
    start_date_local,
    distance,
    moving_time,
    total_elevation_gain,
    average_speed,
    average_heartrate,
    calories,
    -- Calculated fields
    ROUND((distance / 1000.0)::numeric, 2) as distance_km,
    ROUND((moving_time / 60.0)::numeric, 1) as duration_minutes,
    CASE 
        WHEN average_speed > 0 THEN ROUND((1000.0 / average_speed / 60.0)::numeric, 2)
        ELSE NULL 
    END as pace_per_km,
    ROUND((calories / (distance / 1000.0))::numeric, 0) as calories_per_km,
    DATE(start_date_local) as activity_date,
    EXTRACT(DOW FROM start_date_local) as day_of_week,
    EXTRACT(HOUR FROM start_date_local) as hour_of_day
FROM activities 
WHERE type = 'Run' OR sport_type = 'Run'
ORDER BY start_date DESC;

-- Create a view for weekly summaries
CREATE OR REPLACE VIEW weekly_running_summary AS
SELECT 
    user_id,
    DATE_TRUNC('week', start_date_local) as week_start,
    COUNT(*) as runs,
    ROUND(SUM(distance / 1000.0)::numeric, 2) as total_distance_km,
    ROUND((SUM(moving_time) / 60.0)::numeric, 1) as total_time_minutes,
    ROUND(AVG(average_speed * 3.6)::numeric, 2) as avg_speed_kmh,
    ROUND(AVG(average_heartrate)::numeric, 0) as avg_heartrate,
    SUM(calories) as total_calories,
    MAX(distance / 1000.0) as longest_run_km
FROM activities 
WHERE type = 'Run' OR sport_type = 'Run'
GROUP BY user_id, DATE_TRUNC('week', start_date_local)
ORDER BY user_id, week_start DESC;
```

## Implementation Steps

### Phase 1: Database Setup
1. ✅ Run the SQL schema above
2. ✅ Verify tables are created in Supabase dashboard

### Phase 2: API Implementation
1. Create `/api/strava/sync` endpoint for full sync
2. Create `/api/strava/sync/incremental` for daily updates
3. Update existing endpoints to use cached data
4. Add webhook support for real-time sync

### Phase 3: Frontend Updates
1. Add sync status indicator
2. Create activities history page
3. Update AI chat to use historical data
4. Add analytics dashboard

### Phase 4: AI Enhancement
1. Create activity analysis prompts
2. Add training load calculations
3. Implement personalized recommendations
4. Add injury prevention insights

## Benefits of This Approach

1. **Performance**: Fast loading from local database vs API calls
2. **Analytics**: Rich querying capabilities for trends and insights
3. **AI Context**: Complete activity history for better recommendations
4. **Offline Access**: Data available even when Strava API is down
5. **Custom Metrics**: Calculate derived metrics and aggregations
6. **Privacy**: User controls their data storage and access

## Next Steps

1. Run the database migration
2. Implement the sync API endpoints
3. Test with your Strava account
4. Gradually migrate frontend to use cached data
5. Enhance AI prompts with activity history 
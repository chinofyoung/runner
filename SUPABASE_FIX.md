# Fix for UUID Error

## The Problem

The database table was created with `user_id` as UUID type, but we're sending a string. Here are two solutions:

## Solution 1: Use UUID in Code (Already Applied)

I've updated the code to use a valid UUID format: `123e4567-e89b-12d3-a456-426614174000`

This should work immediately without changing the database.

## Solution 2: Update Database to Use TEXT (Alternative)

If you prefer to use string user IDs, run this SQL in your Supabase SQL Editor:

```sql
-- Drop the existing table if it exists
DROP TABLE IF EXISTS training_plans;

-- Create training_plans table with TEXT user_id
CREATE TABLE training_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    sessions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT NOT NULL
);

-- Create indexes
CREATE INDEX training_plans_user_id_idx ON training_plans(user_id);
CREATE INDEX training_plans_created_at_idx ON training_plans(created_at DESC);
```

## Test Now

Try saving a training plan again. It should work with the UUID fix!

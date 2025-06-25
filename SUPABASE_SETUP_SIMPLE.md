# Simple Supabase Setup (No Authentication Required)

## Quick Setup for Demo

Since we're using a demo user ID and don't have authentication set up yet, let's create a simpler table structure.

1. **Go to your Supabase Dashboard**

   - Navigate to: https://app.supabase.com/project/gmajmfrubdghyvcrbfxe

2. **Open SQL Editor**

   - Click on "SQL Editor" in the left sidebar

3. **Create the training_plans table (simplified version)**
   - Copy and paste the following SQL and click "Run":

```sql
-- Create training_plans table (simplified for demo)
CREATE TABLE IF NOT EXISTS training_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    sessions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT NOT NULL
);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS training_plans_user_id_idx ON training_plans(user_id);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS training_plans_created_at_idx ON training_plans(created_at DESC);

-- Note: No RLS policies for now since we're not using authentication
```

## Key Differences from Full Setup

- ✅ **No RLS (Row Level Security)**: Allows operations without authentication
- ✅ **user_id as TEXT**: No foreign key constraint to auth.users
- ✅ **Simpler structure**: Works immediately with demo user ID

## Test the Setup

After running the SQL:

1. Go to "Table Editor" in your Supabase dashboard
2. You should see a new `training_plans` table
3. Try saving a training plan from the AI coach
4. Check if it appears in the table

## When You're Ready for Authentication

Later, when you implement proper authentication:

1. Add authentication to your app
2. Update the table to use UUID for user_id
3. Add foreign key constraint to auth.users
4. Enable RLS policies for security

This simplified setup gets you running immediately!

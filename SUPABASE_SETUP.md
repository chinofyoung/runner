# Supabase Setup for Training Plans

## Quick Setup Instructions

1. **Go to your Supabase Dashboard**

   - Navigate to: https://app.supabase.com/project/gmajmfrubdghyvcrbfxe

2. **Open SQL Editor**

   - Click on "SQL Editor" in the left sidebar

3. **Create the training_plans table**
   - Copy and paste the following SQL and click "Run":

```sql
-- Create training_plans table
CREATE TABLE IF NOT EXISTS training_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    sessions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own training plans
CREATE POLICY "Users can view own training plans" ON training_plans
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own training plans
CREATE POLICY "Users can insert own training plans" ON training_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own training plans
CREATE POLICY "Users can update own training plans" ON training_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own training plans
CREATE POLICY "Users can delete own training plans" ON training_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS training_plans_user_id_idx ON training_plans(user_id);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS training_plans_created_at_idx ON training_plans(created_at DESC);
```

## What's Been Updated

✅ **Supabase Client**: Added `lib/supabase.ts` for database connections  
✅ **API Routes**: Updated `/api/training-plans/route.ts` to use Supabase  
✅ **Components**: Updated `SavedPlans.tsx` to handle Supabase data format  
✅ **Dependencies**: Installed `@supabase/supabase-js`

## Current Status

- The app is configured to use Supabase for training plans storage
- Currently using a demo user ID (`demo-user-001`) since authentication isn't implemented yet
- All saved training plans will be stored in your Supabase database
- The file-based storage in `data/saved-plans.json` is no longer used

## Next Steps

1. Run the SQL migration above
2. Test saving and viewing training plans
3. Later: Implement proper user authentication with Supabase Auth

## Verification

After running the SQL, you should see a new `training_plans` table in your Supabase dashboard under "Table Editor".

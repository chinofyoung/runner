🏃‍♂️ Running Assistant / Coach Web App – Requirements Specification
1. 🔖 Project Summary
Create a web-based Running Assistant that helps runners train towards specific distance goals (5K, 10K, Half Marathon, Full Marathon). The app includes:

AI-powered personalized coaching (via Claude)

User training plan generation & tracking

Training logs, pace guidance, and metrics

Supabase backend for authentication, data storage, and real-time updates

2. 🎯 Target Users
Beginner to intermediate runners

Users training for personal bests

Runners targeting specific race distances and dates

3. 🌐 Tech Stack
Frontend: React (with TailwindCSS or similar)

Backend: Supabase (PostgreSQL, Auth, Edge Functions, Storage)

AI Integration: Claude (via Anthropic API)

Optional: Stripe (for premium features), PWA support for mobile

4. 🧩 Core Features
4.1 User Authentication
Sign up / Login via email, Google, or Apple (Supabase Auth)

Profile creation with running level, goal, and preferred training days

4.2 Training Plan Generator (AI-powered)
User inputs: current performance, target race type/date

Output: custom weekly plan (easy runs, intervals, long runs, rest)

Claude generates plans and adjusts based on progress

4.3 Training Log & Calendar
Users log runs manually or via import (e.g., Strava, GPX)

Calendar view with completed/planned sessions

View stats: distance, pace, HR (optional), type (easy, tempo, etc.)

4.4 Progress Tracker
Graphs for weekly mileage, pace improvements

Track milestones (e.g., longest run, new PRs)

4.5 AI Assistant (Claude)
Chat UI for asking questions (e.g., "what’s my pace goal this week?")

Adaptive responses based on training history from Supabase

Suggests modifications if injured, tired, or behind plan

4.6 Training Plan Adjustments
Mid-plan adjustments based on user performance/logs

Ask Claude to "regenerate" next week's plan

Smart tapering before race day

4.7 Notifications & Reminders
Daily reminders for training

Weekly summary via email or in-app

Race countdowns

5. 📦 Supabase Schema (Example)
Tables:
users
id (uuid, PK)

email

created_at

current_goal: enum("5K", "10K", "HM", "FM")

training_days: array[string]

fitness_level: enum("beginner", "intermediate", "advanced")

training_plans
id

user_id (FK)

goal_type

start_date

end_date

plan_json (jsonb)

runs
id

user_id (FK)

date

type: enum("easy", "tempo", "long", "interval", "race", "rest")

distance_km

duration_minutes

pace_per_km

notes

perceived_effort: 1–10

6. 📡 API Integrations
Claude Integration
Endpoint for sending prompt and receiving response

Middleware to format Supabase data into prompt context

Optional: Strava API (for auto-importing workouts)
OAuth support

Sync latest runs into Supabase

7. 🧠 Claude AI Assistant - Prompts (Example)
vbnet
Copy
Edit
User: I have a half marathon in 6 weeks. I currently run 3x a week and can do a 10K in 1:10. Make me a plan.
Claude: Based on your current performance and time frame, here's your weekly training plan...
8. 🧪 Testing Requirements
Unit tests for training logic (weekly mileage, intensity distribution)

Integration tests for Claude prompt > plan > storage cycle

Frontend tests (React Testing Library / Cypress)

9. 📱 UX Considerations
Mobile-first UI

Clean dashboard with weekly view

Minimal data entry friction (pre-fill common distances/paces)

10. 📈 Future Features (v2+)
Race simulator (what pace to run per km)

GPS run tracking via phone

Cross-training support (bike, gym)

Community features (club training, sharing plans)

Premium tier with deeper analysis
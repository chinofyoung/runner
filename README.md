# 🏃‍♂️ Fitflex - AI-Powered Running Assistant

A beautiful, modern web application that serves as your personal AI running coach, helping you achieve your running goals with personalized training plans, real-time guidance, and comprehensive progress tracking.

## ✨ Features

### 🏠 **Dashboard**

- **Activity Overview**: Clean, modern interface showing today's running statistics
- **Tracking History**: Interactive bar charts displaying speed and performance over time
- **Health Metrics**: Real-time display of calories burned, heart rate, and step count
- **Friends Activity**: Social feed showing running buddy activities and status
- **Recent Activities**: Detailed log of past running sessions with location and metrics

### 📊 **Progress Tracking**

- **Performance Analytics**: Comprehensive charts tracking pace improvements over time
- **Weekly Distance Trends**: Visual representation of training volume progression
- **Achievement System**: Badges and milestones for personal bests and goals
- **Training Metrics**: Detailed analysis of running consistency and performance gains

### 🤖 **AI Running Coach** (Powered by Claude)

- **Intelligent Conversations**: Natural language chat interface for running advice
- **Personalized Guidance**: Tailored recommendations based on your training history
- **Pace Optimization**: Smart suggestions for different types of runs (easy, tempo, intervals)
- **Injury Prevention**: Proactive advice on rest, recovery, and form
- **Nutrition Guidance**: Pre and post-run fueling strategies

### 📅 **Training Plan Management**

- **Weekly Training Schedule**: Organized view of your training week
- **Session Types**: Color-coded workouts (easy runs, tempo, intervals, long runs, rest days)
- **Progress Tracking**: Visual indicators for completed vs. planned sessions
- **Smart Adjustments**: AI-powered plan modifications based on performance and feedback

### 💬 **Social Features**

- **Friend Messaging**: Connect and chat with running buddies
- **AI Coach Chat**: 24/7 access to your personal running assistant
- **Group Challenges**: Community-driven motivation and accountability
- **Activity Sharing**: Celebrate achievements with your running network

## 🛠 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful, consistent icons
- **Recharts** - Interactive data visualizations

### Backend (Planned)

- **Supabase** - PostgreSQL database with real-time subscriptions
- **Supabase Auth** - User authentication and management
- **Supabase Edge Functions** - Serverless API endpoints

### AI Integration

- **Claude API** (Anthropic) - Advanced AI coaching and conversation
- **Real-time responses** - Intelligent training advice and motivation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd runner
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Development Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📱 Pages & Navigation

### 🏠 **Home** (`/`)

The main dashboard featuring today's running overview, activity charts, health metrics, and social feed.

### 📊 **Progress** (`/progress`)

Comprehensive analytics showing performance trends, weekly distance tracking, achievements, and detailed training plan progress.

### 💬 **Messages** (`/messages`)

Communication hub with AI coach chat and friend messaging capabilities.

### ⚙️ **Additional Pages** (Coming Soon)

- **Tasks**: Goal setting and training objectives
- **Friends**: Social network and running buddy management
- **Settings**: Profile customization and app preferences

## 🎨 Design Philosophy

**Fitflex** follows a clean, modern design inspired by fitness tracking applications with:

- **Green Color Scheme**: Representing health, growth, and energy
- **Card-Based Layout**: Organized information in digestible sections
- **Mobile-First Design**: Responsive interface optimized for all devices
- **Intuitive Navigation**: Clear, icon-driven menu system
- **Data Visualization**: Beautiful charts making metrics easy to understand

## 🔮 Future Roadmap

### Version 2.0 Features

- **GPS Run Tracking**: Real-time location and route mapping
- **Wearable Integration**: Sync with fitness watches and heart rate monitors
- **Race Preparation**: Specialized training for 5K, 10K, Half Marathon, Full Marathon
- **Cross-Training**: Integrate cycling, swimming, and strength training
- **Premium Analytics**: Advanced performance insights and predictions

### Integration Plans

- **Strava API**: Import existing running data
- **Apple Health / Google Fit**: Sync with mobile health platforms
- **Calendar Integration**: Smart scheduling based on training plans
- **Weather API**: Training recommendations based on conditions

## 📋 Requirements Implementation

This application implements all core features outlined in the original requirements:

✅ **User Interface**: Modern, responsive design matching the Fitflex aesthetic  
✅ **Training Plans**: AI-generated weekly schedules with progress tracking  
✅ **Activity Logging**: Comprehensive run tracking and history  
✅ **Progress Analytics**: Visual charts and performance metrics  
✅ **AI Assistant**: Claude-powered conversational coach  
✅ **Social Features**: Friends list and messaging system  
✅ **Mobile-First**: Optimized for all screen sizes

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on how to submit pull requests, report issues, and suggest improvements.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💡 Support

For questions, feature requests, or support:

- Open an issue on GitHub
- Contact the development team
- Join our community discussions

---

**Built with ❤️ for the running community**

_Fitflex - Your AI Running Coach: Train Smarter, Run Faster, Achieve More_

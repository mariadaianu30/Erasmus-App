# Erasmus+ Connect

**by Scout Society**

A modern event management platform built with Next.js 14, TypeScript, Tailwind CSS, and Supabase, designed to help young people and organizations connect, discover verified opportunities, and manage applications with ease.

## 🌟 Features

- **User Authentication**: Login/Register with user type selection (Participant/Organization)
- **Profile Management**: Complete profiles for participants and organizations
- **Event Management**: Create, edit, and manage verified events
- **Application System**: Participants can apply to events with motivation letters
- **Dashboard**: Personalized dashboards for both user types
- **Real-time Updates**: Live data synchronization with Supabase
- **Statistics**: Comprehensive analytics and statistics tracking
- **Search & Filter**: Advanced search and filtering capabilities
- **Verified Opportunities**: All events are verified by Scout Society

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel (recommended)

## 📋 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Copy `env.template` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Set up the database (SIMPLE!)**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the entire `complete-setup.sql` file
   - Click Run and wait for "Erasmus+ Connect database setup completed successfully!"
   - Disable email confirmation in Auth settings

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Test the application**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Register a new user (participant or organization)
   - Explore the dashboard and features!

📖 **For detailed setup instructions, see `SETUP_GUIDE.md`**

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/          # User dashboards
│   ├── events/             # Event management
│   │   ├── [id]/          # Event details
│   │   ├── create/        # Create event
│   │   └── manage/        # Manage events
│   ├── organizations/      # Organization pages
│   ├── profile/           # User profiles
│   ├── my-applications/   # User applications
│   └── applications/      # Organization applications
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
│   ├── supabase.ts       # Supabase client
│   └── auth.ts           # Authentication helpers
└── middleware.ts         # Route protection
```

## 🎯 Key Features

### For Participants
- Browse and search verified events
- Apply to events with motivation letters
- Track application status
- Manage profile information
- View statistics and engagement metrics

### For Organizations
- Create and manage events
- Review and manage applications
- Track event statistics
- Manage organization profile
- View participant analytics

### Platform Features
- Real-time statistics on the home page
- Advanced search and filtering
- Responsive design for all devices
- Secure authentication and authorization
- Verified opportunities system

## 🗄️ Database Schema

The platform uses a PostgreSQL database with the following main tables:
- `profiles`: User profiles (participants and organizations)
- `events`: Event information and details
- `applications`: Event applications with status tracking

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built by Scout Society for the Erasmus+ Connect initiative, helping young people and organizations build meaningful connections across Europe.
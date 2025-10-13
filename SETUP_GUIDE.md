# Erasmus+ Connect - Complete Setup Guide

## 🎯 Quick Start (5 minutes)

### Step 1: Database Setup
1. **Open Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the entire contents of `complete-setup.sql`
3. **Click Run** to execute the script
4. **Wait for success message**: "Erasmus+ Connect database setup completed successfully!"

### Step 2: Disable Email Confirmation
1. **Go to Authentication** → **Settings** in Supabase
2. **Turn OFF** "Enable email confirmations"
3. **Save changes**

### Step 3: Start the Application
```bash
npm run dev
```

### Step 4: Test Registration
1. **Go to** `http://localhost:3000/auth`
2. **Register a new user** (participant or organization)
3. **Check dashboard** - should work perfectly!

## 🗄️ Database Schema

The `complete-setup.sql` file includes:
- ✅ **All tables**: profiles, events, applications
- ✅ **RLS policies**: Secure data access
- ✅ **Triggers**: Automatic profile creation
- ✅ **Sample data**: 9 events ready to use
- ✅ **Indexes**: Optimized performance
- ✅ **Functions**: Statistics and utilities

## 📊 Sample Data Included

### 9 Sample Events:
- **3 Technology Events** (AI Workshop, Engineering Conference, Entrepreneurship Bootcamp)
- **3 Arts Events** (Theater Production, Acting Workshop, Film Festival)
- **3 Social Impact Events** (Community Garden, Leadership Summit, Digital Literacy)

### Event Categories:
- Technology, Engineering, Business
- Arts, Theater, Film
- Environment, Social Impact

## 🔧 Features Ready

### For Participants:
- ✅ **Registration** with birth date
- ✅ **Profile management** with bio, location, website
- ✅ **Browse opportunities** (events)
- ✅ **Apply to events** with motivation letters
- ✅ **Dashboard** with application tracking
- ✅ **Real-time statistics**

### For Organizations:
- ✅ **Registration** as organization
- ✅ **Profile management** with organization details
- ✅ **Event management** (create, edit, publish)
- ✅ **Application review** and status updates
- ✅ **Dashboard** with event analytics

## 🚀 Next Steps After Setup

### 1. Create Organization Accounts
- **Register organizations** through the app
- **Link events** to organizations in the database
- **Publish events** for participants to see

### 2. Customize Content
- **Edit event details** in the database
- **Add more events** through the app
- **Customize categories** and locations

### 3. User Management
- **Monitor user registrations** in Supabase
- **Manage profiles** through the app
- **Review applications** and make decisions

## 🛠️ Troubleshooting

### If Registration Fails:
- ✅ Check email confirmation is disabled
- ✅ Verify database setup completed successfully
- ✅ Check browser console for errors

### If Dashboard Doesn't Load:
- ✅ Ensure user profile was created
- ✅ Check RLS policies are active
- ✅ Verify user is authenticated

### If Events Don't Show:
- ✅ Check events are published (`is_published = true`)
- ✅ Verify dates are in the future
- ✅ Check category filters

## 📁 Project Structure

```
event-platform/
├── complete-setup.sql          # 🎯 ONLY SQL FILE NEEDED
├── SETUP_GUIDE.md             # 📖 This guide
├── README.md                  # 📖 Project overview
└── src/                       # 💻 Next.js application
    ├── app/                   # 📱 Pages and routes
    ├── components/            # 🧩 Reusable components
    └── lib/                   # 🔧 Utilities and config
```

## ✅ Verification Checklist

After setup, verify these work:
- [ ] User registration (participant)
- [ ] User registration (organization)
- [ ] Profile editing and saving
- [ ] Events page shows 9 sample events
- [ ] Organizations page loads
- [ ] Dashboard loads for both user types
- [ ] Age calculation from birth date
- [ ] Website field updates without timeout

## 🎉 You're Ready!

Your Erasmus+ Connect application is now fully set up and ready to help young people discover verified opportunities and manage applications with ease!

---

**Need help?** Check the browser console for any errors or refer to the troubleshooting section above.
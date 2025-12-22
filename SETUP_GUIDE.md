# Event Platform - Setup Guide

Welcome to the **Erasmus+ Connect** project! Follow these steps to set up your local development environment.

## 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Version 18.17.0 or better, recommended: **v20+**)
- [Git](https://git-scm.com/)

## 2. Clone the Repository
Open your terminal and run:

```bash
git clone https://github.com/Andrei8cristea/Erasmus_App.git
cd Erasmus_App
```

## 3. Install Dependencies
Install the required packages using npm:

```bash
npm install
```

## 4. Environment Variables ⚠️ (Important)
This project uses **Supabase** for authentication and database. You need the API keys to run the app.
These keys are kept secret and are **not** in GitHub.

1.  Create a file named `.env.local` in the root folder (where `package.json` is).
2.  Ask your colleague (Andrei) for the contents of this file.
3.  Paste the contents into your `.env.local`. It should look something like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Run the App
Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting
- **Hydration Errors**: Some browser extensions (like password managers) can cause "Hydration Mismatch" errors in the console. These are usually harmless in dev.
- **Node Version**: If you get errors about "unsupported engine", update your Node.js to the latest LTS version.

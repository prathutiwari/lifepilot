# LifePilot

An AI-powered personal life management app that lets you track expenses, habits, health, meetings, tasks, workouts, study sessions, and notes — all through natural language.

## How AI is Used

LifePilot uses **Llama 3.3 70B** (via Groq) in two core ways:

1. **Natural Language Input Parsing** — Speak or type anything like "spent 400 on dinner" or "meeting with Raj at 3pm tomorrow" and the AI converts it into structured data (expenses, calendar events, tasks, etc.). It asks follow-up questions when required info is missing.

2. **Daily AI Insights** — The AI analyzes your last 7 days of activity and generates a personalized summary with actionable tips (spending patterns, workout consistency, task completion rate, study streaks).

## Features

- **8 Tracking Modules** — Expenses, Habits, Health, Meetings, Tasks, Workouts, Study, Notes
- **Voice Input** — Speech-to-text with automatic AI processing
- **Smart Parsing** — Single message can create multiple actions ("meeting at 3 and spent 500 on lunch")
- **AI Clarification Flow** — Asks for missing details instead of guessing
- **Google Calendar Sync** — Actions auto-sync to Google Calendar & Tasks
- **Profile Management** — Update name and profile image with fallback avatar
- **Customizable Sidebar** — Favorites, reorder tabs, persistent preferences
- **Responsive Design** — Full mobile and desktop support
- **Daily AI Insights** — Floating AI button with personalized weekly summary and tips

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | Turso (libSQL) |
| AI | Groq API (Llama 3.3 70B) |
| Auth | JWT + Google OAuth |
| Integrations | Google Calendar, Google Tasks |

## Setup

### Server

```bash
cd server
npm install
```


```bash
npm start
```

### Client

```bash
cd client
npm install
npm run dev
```

## Project Structure

```
lifepilot/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components (Sidebar, VoiceInput, AiInsights, tabs/)
│       ├── hooks/          # Custom hooks (speech recognition)
│       └── services/       # API client
├── server/                 # Express backend
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── services/       # Business logic (AI, Google, activities)
│       ├── prompts/        # AI prompt templates
│       ├── routes/         # API routes
│       └── middleware/     # Auth middleware
└── README.md
```

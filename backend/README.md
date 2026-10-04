# Team Attendance System - Backend

A clean, production-oriented backend API for the Team Attendance System built with Node.js, Express, TypeScript, and MongoDB/Mongoose.

## Project Overview

The Team Attendance System is designed to manage and track team member attendance reliably and securely.


## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or local MongoDB instance
- [Discord Developer Portal](https://discord.com/developers/applications) Bot Application (with Message Content Intent enabled)

---

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Configuration (`.env`)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and configure your settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/team_attendance
   CORS_ORIGIN=http://localhost:5173

   DISCORD_TOKEN=<your_bot_token>
   DISCORD_GUILD_ID=<your_guild_id>
   ATTENDANCE_CHANNEL_ID=<your_attendance_channel_id>
   ```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Starts server and Discord bot in development mode with `tsx watch` |
| `build` | `npm run build` | Compiles TypeScript to `dist/` using `tsc` |
| `start` | `npm start` | Runs the compiled production server |
| `seed` | `npm run seed` | Idempotently seeds initial development team members |
| `db:test` | `npm run db:test` | Connects to MongoDB, prints registered users, and disconnects |
| `test:models` | `npm run test:models` | Tests Mongoose model constraints, validations, and partial indexes |
| `test:attendance` | `npm run test:attendance` | Tests full check-in/out business logic and concurrency race conditions |
| `test:api` | `npm run test:api` | Tests all 15 Phase 4 REST API endpoints, validations, and status codes |

---



## Discord Bot Commands & Interactions

| Command / Trigger | Action | Behavior |
|---|---|---|
| `ci` (chat message) | Check-in prompt | Prompts member with `[Enter Task]` and `[Skip]` buttons |
| `co` (chat message) | Instant check-out | Completes active session, logs duration, records `CHECK_OUT` event |
| `/ci` (slash command) | Check-in prompt | Ephemeral check-in prompt |
| `/co` (slash command) | Instant check-out | Ephemeral checkout response |
| `[Enter Task]` | Modal Dialog | Opens modal input for task description (max 500 characters) |
| `[Skip]` | Direct Check-In | Starts active session with `"Not specified"` task |
| Attendance Panel | Persistent Embed | Displays `🟢 CHECK IN` and `🔴 CHECK OUT` buttons in the configured channel |

---

## Testing Health Endpoint

```bash
curl -X GET http://localhost:5000/api/health
```

Expected Response (HTTP 200):
```json
{
  "success": true,
  "message": "Team Attendance API is healthy",
  "database": "connected"
}
```

---

## Project Structure

```text
team-attendance/
├── backend/
│   ├── src/
│   │   ├── bot/
│   │   │   ├── client.ts            # Discord client initialization
│   │   │   ├── startBot.ts          # Bot startup, listeners & channel panel deployment
│   │   │   ├── commands/            # /ci, /co, and guild registration
│   │   │   ├── components/          # Persistent attendance panel & task modals
│   │   │   └── handlers/            # Message & interaction dispatchers
│   │   ├── config/                  # Environment validation & DB connection
│   │   ├── controllers/             # REST controllers for Users & Attendance
│   │   ├── middleware/              # Error, 404, and Zod validation middleware
│   │   ├── models/                  # User, AttendanceSession, AttendanceEvent
│   │   ├── routes/                  # Express HTTP routers (health, users, attendance)
│   │   ├── services/                # Attendance and User business logic
│   │   ├── types/                   # Shared TypeScript types & enums
│   │   ├── utils/                   # Duration calculation, eventId, date utils, test suites
│   │   ├── validators/              # Zod schemas for query parameter validation
│   │   └── server.ts                # Application entry point
│   ├── .env                         # Local environment variables
│   ├── .env.example                 # Environment template
│   ├── package.json
│   └── tsconfig.json
└── dashboard/                       # Frontend dashboard (Future)
```

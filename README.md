# Ascendia Hire

A full-stack campus hiring and startup launchpad platform built for NITK — connecting students with job opportunities, startup teams, and each other, with real-time chat, AI-assisted writing, and skill-based matching throughout.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Demo Data & Login Credentials](#demo-data--login-credentials)
- [API Overview](#api-overview)
- [Real-Time Events (Socket.IO)](#real-time-events-socketio)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)

---

## Overview

Ascendia Hire is a role-based platform with two account types:

- **Students** (must register with a `@nitk.edu.in` email) — build a profile, browse and apply to jobs, check their skill match against any listing, pitch and join startups, message recruiters, and endorse peers' skills.
- **Recruiters** (any email) — post jobs, review applicants, track them through a hiring pipeline, message shortlisted candidates, and view analytics on their listings.

The backend is a single Express + Socket.IO server backed by MongoDB, serving both the REST API and the static frontend from one process — no separate frontend build or deployment needed.

---

## Features

### Authentication & Access Control
- Role-based signup/login (Student vs Recruiter)
- Student accounts restricted to `@nitk.edu.in` emails, enforced on both frontend and backend
- Passwords hashed with bcrypt (never stored in plain text)
- Student access auto-expires based on expected graduation year

### Profiles & Skills
- Editable profile: bio, phone, GitHub, LinkedIn, portfolio links
- Skill list with autocomplete (130+ curated tech skills)
- Case-insensitive skill matching throughout the app (`React` = `react` = `REACT`)
- **Resume upload (PDF)** with automatic skill extraction from the resume text
- **Skill endorsements** — students can endorse each other's listed skills, LinkedIn-style

### Jobs
- Recruiters post jobs with required skills, location, and job type (Full-time / Part-time / Internship / Remote)
- Students see a live **match %** on every job card, computed against their own profile
- **Skill Gap analysis** — per-job breakdown of matched vs. missing skills, each missing skill linked to a free learning resource
- **Filtering** — students filter by match %, job type, and location; recruiters filter applicants by match %
- **Application status tracking** — Applied → Reviewed → Shortlisted → Rejected/Offered, updated live by recruiters and visible to students
- **Email notifications** — students automatically notified when a newly posted job matches their skills
- **AI-generated cover letters** — one click drafts a factual, personalized cover letter using the student's real profile data and the job's requirements (no invented experience)

### Startups
- Students can pitch a startup idea with required skills
- Other students can browse, check their skill match, and join a team
- **Real-time group chat** per startup (Socket.IO), scoped to team members only

### Messaging
- **1-on-1 real-time chat** between a recruiter and a student, automatically unlocked the moment a recruiter marks that student "Shortlisted" or "Offered" on a job

### Analytics (Recruiter-only)
- Overview stats: jobs posted, total applicants, skill-gap checks, average applicant match %
- Status breakdown doughnut chart and per-job applicant bar chart (Chart.js)
- Per-job table with applicant count, gap-check count, average match, and conversion rate

### UI/UX
- Fully custom dark theme (no UI framework), mobile-responsive with a collapsible sidebar
- Toast notifications for every action
- Current page persists across browser refresh

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript, Chart.js (CDN), Font Awesome (CDN) |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Real-time | Socket.IO |
| Auth | bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| File handling | Multer (uploads), pdf-parse (resume text extraction) |
| AI | Groq API (Llama 3.3 70B) for cover letter generation |

---

## Project Structure

```
Ascendia-Hire/
├── backend/
│   ├── auth/
│   │   ├── signup.js
│   │   └── login.js
│   ├── profile/
│   │   └── profile.js
│   ├── jobs/
│   │   └── jobs.js
│   ├── startup/
│   │   └── startup.js
│   ├── messages/
│   │   └── messages.js
│   ├── coverletter/
│   │   └── coverletter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Profile.js
│   │   ├── Job.js
│   │   ├── Startup.js
│   │   └── Conversation.js
│   ├── utils/
│   │   └── skillsList.js
│   ├── uploads/resumes/      (auto-created at runtime, gitignored)
│   ├── db.js                  MongoDB connection
│   ├── mailer.js              Email notification logic
│   ├── server.js               Express + Socket.IO entry point
│   ├── seed.js                  Demo data loader (destructive — wipes DB first)
│   ├── package.json
│   ├── .env                     Your real secrets (gitignored, not committed)
│   └── .env.example             Template showing required variables
├── frontend/
│   ├── index.html               Login / signup page
│   ├── dashboard.html            Dashboard shell (sidebar, header)
│   └── JS/
│       └── dashboard.js          All dashboard logic, rendering, and API calls
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or later
- A **MongoDB Atlas** account (free tier) — or a local MongoDB instance
- A **Gmail account** with an App Password, for job-match email notifications *(optional — app runs without it, just skips sending emails)*
- A **Groq API key** (free, no card required) from [console.groq.com](https://console.groq.com), for AI cover letter generation *(optional — app runs without it, that one feature just returns an error)*

---

## Setup Instructions

### 1. Clone and install dependencies
```bash
git clone https://github.com/yourusername/ascendia-hire.git
cd Ascendia-Hire/backend
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in your real values (see [Environment Variables](#environment-variables) below).

### 3. Load demo data (recommended for first run)
```bash
npm run seed
```
This wipes any existing data and loads a full demo dataset — 12 students, 6 recruiters, 15 jobs, 22 applications, 6 startups, and skill endorsements. See [Demo Data](#demo-data--login-credentials) below.

### 4. Start the server
```bash
npm start
```

### 5. Open the app
Go to **http://localhost:3000** in your browser.

---

## Environment Variables

Create `backend/.env` with the following:

| Variable | Required? | Description |
|---|---|---|
| `MONGO_URI` | **Yes** | Your MongoDB connection string (Atlas or local) |
| `EMAIL_USER` | No | Gmail address used to send job-match notifications |
| `EMAIL_PASS` | No | Gmail **App Password** (not your regular password — generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), requires 2-Step Verification enabled) |
| `GROQ_API_KEY` | No | Free API key from [console.groq.com](https://console.groq.com), powers the AI cover letter generator |

The app degrades gracefully if the optional variables are missing — email notifications and cover letter generation simply won't work, but everything else runs normally.

---

## Available Scripts

Run these from inside the `backend/` folder.

| Command | What it does |
|---|---|
| `npm start` | Starts the server at `http://localhost:3000` (or `process.env.PORT` if set, for deployment) |
| `npm run seed` | **Destructive.** Wipes all Users, Profiles, Jobs, Startups, and Conversations, then loads a full demo dataset. Use for local development/demo prep only. |

---

## Demo Data & Login Credentials

After running `npm run seed`, every account uses the same password:

```
Demo@123
```

**Good accounts to start with:**

| Role | Email | Why |
|---|---|---|
| Recruiter | `neha.kulkarni@technova.com` | 3 posted jobs with applicants across multiple statuses — good for Analytics |
| Student | `ananya.rao@nitk.edu.in` | Has an Offered application, a startup with team chat, and endorsed skills |
| Student | `nikhil.joshi@nitk.edu.in` | Applied to 3 jobs across 3 companies with 3 different statuses |

The full list of seeded accounts is printed to the console at the end of the seed script.

---

## API Overview

All routes are prefixed by the server's base URL (e.g. `http://localhost:3000`).

| Method | Route | Description |
|---|---|---|
| `POST` | `/signup` | Create a student or recruiter account |
| `POST` | `/login` | Log in |
| `GET/PUT` | `/profile/:email` | Get / update a profile |
| `POST` | `/profile/add-skill`, `/profile/delete-skill` | Manage skills |
| `POST` | `/profile/upload-resume` | Upload a PDF resume, get back parsed skill suggestions |
| `POST` | `/profile/endorse` | Toggle an endorsement on someone's skill |
| `GET` | `/profiles` | List all student profiles |
| `GET/POST` | `/jobs/all`, `/jobs/post` | Browse / post jobs |
| `POST` | `/jobs/apply` | Apply to a job |
| `GET` | `/jobs/skill-gap/:email/:jobId` | Skill gap analysis for a job |
| `POST` | `/jobs/applicants/status` | Recruiter updates an applicant's status |
| `GET` | `/jobs/analytics/:recruiterEmail` | Recruiter analytics data |
| `GET/POST` | `/startup/all`, `/startup/post` | Browse / pitch startups |
| `POST` | `/startup/join` | Join a startup team |
| `GET` | `/messages/conversations/:email` | List a user's 1-on-1 conversations |
| `POST` | `/cover-letter/generate` | Generate an AI cover letter for a job |

---

## Real-Time Events (Socket.IO)

| Event | Direction | Purpose |
|---|---|---|
| `joinRoom` | client → server | Join a startup's group chat room |
| `sendMessage` | client → server | Send a message in a startup's group chat |
| `newMessage` | server → client | Broadcast a new group chat message |
| `joinConversation` | client → server | Join a 1-on-1 conversation room |
| `sendDirectMessage` | client → server | Send a direct message |
| `newDirectMessage` | server → client | Broadcast a new direct message |

---

## Deployment

This app is a single Express server that serves both the API and the static frontend, making it straightforward to deploy on any Node-friendly host (Render, Railway, Fly.io, etc.).

**Before deploying, confirm:**
- `server.js` uses `process.env.PORT || 3000` (not a hardcoded port)
- The frontend's `API` constant uses `window.location.origin` (not a hardcoded `localhost` URL)
- MongoDB Atlas → Network Access allows connections from your host (`0.0.0.0/0` is simplest for most free-tier hosts, which don't have a fixed IP)
- All environment variables from `.env` are re-entered in your hosting platform's dashboard (never commit `.env` itself)

**Note on file uploads:** resume PDFs are saved to local disk (`backend/uploads/resumes/`). On hosts with ephemeral storage (most free tiers), this folder is wiped on every restart/redeploy. Fine for demos; for persistent storage in production, migrate to a cloud storage service instead.

---

## Known Limitations

- Refreshing the browser restores the last *page* you were on (e.g. Job Portal, Messages), but not a specific *item* within it (e.g. one exact startup's chat) — full deep-linking would require URL-based routing
- Resume file storage is local disk, not cloud storage — see deployment note above
- The demo dataset password (`Demo@123`) is the same for every seeded account — fine for a demo, not meant for real use

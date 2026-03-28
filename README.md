# 🎰 Counterstack

> **A cybersecurity defense simulation battle arena. Train security teams through tactical card-based combat scenarios.**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![Built for](https://img.shields.io/badge/built%20for-Hacklanta%202025-darkred)
![Hackathon](https://img.shields.io/badge/hackathon-12%20hours-blueviolet)

> **🏆 Built in 12 hours at Hacklanta 2025 - Georgia State University Cybersecurity Hackathon**

---

## Overview

Counterstack transforms security training into an interactive tactical battle arena. Instead of reading about threat scenarios, security teams *play through them*.

Defend your systems against simulated cyber threats by deploying security controls (represented as playing cards from the NIST Cybersecurity Framework). Manage resources, respond to escalating threats, and watch your decisions play out in real-time with dynamic visual feedback.

**This hybrid card game + security simulator helps teams:**
- 🎯 Learn security decision-making under time pressure
- 🛡️ Practice incident response in a low-stakes environment
- 📊 Understand trade-offs between different security controls
- 🧠 Build threat modeling intuition through gameplay
- 👥 Create shared security awareness across technical and non-technical team members

---

## Core Game Features

### 🃏 Battle Arena

Face off against computerized threat actors that evolve with each turn:

- **System Patch** — The foundational threat every organization faces
- **Wesker** — A red-team adversary with exposé mechanics and tactical stuns
- **AI Adapter** — An intelligent opponent that learns from your defense strategies

Each boss has unique attack patterns, animation sequences, and adaptive tactics that force players to think strategically.

### 💳 NIST Card System

Deploy security controls using playing cards mapped to the NIST Cybersecurity Framework:

- **Spades ♠️** — Threat Detection & Response
- **Clubs ♣️** — Security Operations
- **Diamonds ♦️** — Infrastructure Hardening
- **Hearts ❤️** — Recovery & Health

Cards have different ranks, costs, and effects. High-value cards (face cards and aces) pack more punch but drain your mana faster.

### 📈 Posture Visualization

Real-time dashboards show:
- Your organization's security posture across NIST domains
- Vulnerability severity and exposure context
- Attack surface mapping
- Threat intel scoring powered by Google Gemini AI

### 🎮 Two Game Modes

**Simulate Mode** — Battle individual threat actors in tactical scenarios
**Dashboard Mode** — Analyze your organization's real security posture (with mock integration data)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **npm** or **yarn**
- A Render PostgreSQL database (free tier available at [render.com](https://render.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/abrar-sarwar/Counterstack.git
cd Counterstack

# Install dependencies (frontend)
cd frontend && npm install

# Install dependencies (backend)
cd ../backend && npm install
```

### Environment Setup

#### Backend Configuration

Create `backend/.env`:

```env
# Render PostgreSQL Database (free at render.com)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]?sslmode=require

# JWT Secret (generate a random string for production)
JWT_SECRET=your-secure-random-string-here

# Google Gemini API (for AI threat analysis)
GEMINI_API_KEY=your-gemini-api-key

# Server configuration
PORT=4000
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration (Optional)

Frontend uses Vite and automatically connects to the backend.

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Application runs on http://localhost:5173
```

Once both are running, open your browser to:
```
http://localhost:5173
```

### Database Setup

The database migrations run automatically on first connection. To manually run migrations:

```bash
cd backend
npm run db:migrate
# Creates users, organizations, and org_profiles tables
```

### Verify Database Connection

```bash
psql "YOUR_DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

You should see:
- ✅ `users`
- ✅ `organizations`
- ✅ `org_profiles`

---

## 🎮 How to Play

### Landing Screen

1. **Log In** — Use existing account credentials
2. **Create Account** — Set up a new account (requires email, password, and organization tier)
3. **Simulate as Guest** — Play without authentication (no progress saved)
4. **Joker Card** — Load pre-configured security posture for Grayson and Co. (demo organization)

### Game Flow

1. **Onboarding** — Answer 4 quick security questions to calibrate your starting posture
2. **Dashboard** — View your organization's security posture across NIST domains
3. **Battle Selection** — Choose a threat actor to face
4. **Combat** — Deploy cards to defend against incoming attacks
   - Spades = Detect threats
   - Clubs = Respond and operate
   - Diamonds = Harden infrastructure
   - Hearts = Recover from damage
5. **Debrief** — Get AI-powered analysis of your defense strategy

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + TypeScript
- **Vite** — Lightning-fast build tooling
- **Framer Motion** — Smooth character and card animations
- **TailwindCSS** — Utility-first styling
- **Gemini AI API** — Threat analysis and recommendations

### Backend
- **Node.js** + Express
- **TypeScript**
- **PostgreSQL** — Render-hosted relational database
- **JWT** — Session authentication
- **Bcrypt** — Password hashing

### Infrastructure
- **Render.com** — PostgreSQL database hosting
- **Vite Dev Server** — Hot module reloading
- **CORS** — Secure cross-origin requests

---

## 🎯 Key Features Implemented

✅ **User Authentication** — Login and account creation with JWT tokens
✅ **Persistent Sessions** — Auth tokens stored in localStorage
✅ **Cloud Database** — Render PostgreSQL for reliable data persistence
✅ **Real-time Animations** — Sprite-based character combat with Framer Motion
✅ **Floating Damage Indicators** — Visual feedback for game events (damage, healing, mana)
✅ **Adaptive AI Opponents** — Each boss has unique mechanics and learning behavior
✅ **NIST Framework Integration** — Security controls mapped to official framework
✅ **AI Threat Analysis** — Gemini-powered debrief and recommendations
✅ **Responsive Design** — Works on desktop and tablet devices

---

## 📁 Project Structure

```
Counterstack/
├── frontend/                    # React/Vite web application
│   ├── src/
│   │   ├── app/                # Game simulation logic
│   │   ├── components/         # React components
│   │   ├── pages/              # Application pages
│   │   ├── services/           # API and external service integrations
│   │   ├── engine/             # Game engine (posture scoring, combat)
│   │   ├── interfaces/         # TypeScript interfaces
│   │   ├── styles/             # Global CSS
│   │   └── App.tsx             # Root component
│   └── public/                 # Static assets (images, data files)
│
├── backend/                     # Express.js API server
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API route definitions
│   │   ├── db/                 # Database connection and migrations
│   │   ├── middleware/         # Authentication and middleware
│   │   └── index.ts            # Server entry point
│   ├── .env                    # Environment variables
│   └── package.json
│
└── README.md                    # This file
```

---

## 🔐 Authentication Flow

1. **User Registration** — POST `/api/auth/register` with email, password, name
2. **Password Hashing** — Bcrypt with 12 salt rounds
3. **JWT Token Generation** — 7-day expiring tokens
4. **Session Persistence** — Token stored in browser localStorage
5. **Auto-Login** — App checks localStorage on load and validates token with backend
6. **Protected Routes** — `/api/auth/me` verifies token on sensitive operations

---

## 🚢 Deployment

### Deploy to Production

#### Backend (Render)
1. Connect your GitHub repo to Render
2. Create a new Web Service pointing to `backend/` directory
3. Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`)
4. Deploy

#### Frontend (Vercel or Render)
1. Connect your GitHub repo
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`
4. Deploy

#### Database (Render)
Render PostgreSQL database is already running. Ensure migrations have been run:
```bash
cd backend && npm run db:migrate
```

---

## 📊 Current Limitations & Future Work

### Known Limitations
- Single-player only (no multiplayer battles yet)
- Mock integration data for SIEM/EDR (Splunk, CrowdStrike)
- No persistent battle history across sessions
- Threat actors don't learn across multiple games

### Planned Features
🔜 Multiplayer co-op battles
🔜 Leaderboards and skill ranking
🔜 Real SIEM/EDR integrations
🔜 Campaign mode with story progression
🔜 Mobile app version
🔜 Real vulnerability data feeds

---

## 🤝 Contributing

Counterstack is open to community contributions!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with clear, descriptive commits
4. Push and open a Pull Request against `main`

All contributions should align with the core principle: **make security training engaging and intuitive for defenders**.

---

## 📝 License

This project is licensed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

## 🏆 Credits

**Built at Hacklanta 2025** — A 12-hour cybersecurity hackathon hosted by Georgia State University.

*Thank you to the security community for inspiration, feedback, and mission alignment.*

---

## 🎯 Questions or Feedback?

Open an issue or reach out to the team. We'd love to hear how you use Counterstack and what scenarios you'd like to see next.

**Let's make security training fun and effective.** 🛡️🎮


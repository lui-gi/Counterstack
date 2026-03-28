# � Counterstack

<div align="center">

**A cybersecurity defense simulation battle arena masquerading as a casino card game.**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Built for Hacklanta](https://img.shields.io/badge/built%20for-Hacklanta%202025-darkred)
![Duration](https://img.shields.io/badge/duration-12%20hours-blueviolet)
![Status](https://img.shields.io/badge/status-active-brightgreen)

*Train security teams through tactical card-based combat scenarios.*

</div>

---

## What is Counterstack?

Counterstack transforms security training into an **interactive battle arena**. Instead of reading threat scenarios, security teams *play through them*.

Deploy NIST security controls (as playing cards) to defend against simulated cyber threats. Manage resources, respond to escalating attacks, and watch your decisions play out in real-time with character animations and dynamic visual feedback.

**Who it's for:**
- 🎯 Security teams learning decision-making under pressure
- 🛡️ Incident responders practicing response procedures
- 📊 Organizations building threat modeling intuition
- 👥 Anyone wanting to understand security trade-offs through gameplay

---

## 🎮 Game Features

### Battle Modes
- **Simulate Mode** — Face off against adaptive threat actors with unique mechanics
- **Dashboard Mode** — Analyze your organization's security posture

### Boss Types
- **System Patch** — The foundational threat every org faces
- **Wesker** — Red-team adversary with tactical stuns and exposure mechanics
- **AI Adapter** — Intelligent opponent that learns from your defense strategies

### NIST Card System
Deploy security controls using playing cards:
- **Spades ♠️** — Detect & Respond
- **Clubs ♣️** — Operate & Investigate
- **Diamonds ♦️** — Harden & Protect
- **Hearts ❤️** — Recover & Respond

Higher-value cards pack more effect but drain resources faster.

### Additional Features
✅ Real-time animations with sprite-based characters  
✅ User authentication with JWT tokens  
✅ Cloud database persistence (Render PostgreSQL)  
✅ AI-powered threat analysis (Google Gemini)  
✅ CISA KEV vulnerability scoring  
✅ Responsive design (desktop & tablet)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **npm** or **yarn**
- Render PostgreSQL database (free tier at [render.com](https://render.com))

### Setup

**1. Clone & Install**
```bash
git clone https://github.com/abrar-sarwar/Counterstack.git
cd Counterstack

cd frontend && npm install
cd ../backend && npm install
```

**2. Configure Backend** — Create `backend/.env`:
```env
DATABASE_URL=postgresql://[user]:[pass]@[host]:[port]/[db]?sslmode=require
JWT_SECRET=your-random-secret-here
GEMINI_API_KEY=your-gemini-key
PORT=4000
FRONTEND_URL=http://localhost:5173
```

**3. Run Database Migration**
```bash
cd backend
npm run db:migrate
```

**4. Start Development Servers**

Terminal 1:
```bash
cd backend && npm run dev
# Runs on http://localhost:4000
```

Terminal 2:
```bash
cd frontend && npm run dev
# Runs on http://localhost:5173
```

**5. Open Browser**
```
http://localhost:5173
```

---

## 🎮 How to Play

1. **Create Account** or **Log In**
2. **Answer 4 Security Questions** to calibrate your starting posture
3. **Choose a Battle** (System Patch, Wesker, or AI Adapter)
4. **Deploy Cards** from your hand to defend against incoming attacks
5. **Get AI Debrief** analyzing your defense strategy

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite + Framer Motion |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL (Render) |
| **Auth** | JWT + Bcrypt |
| **AI** | Google Gemini API |

---

## 📁 Project Structure

```
Counterstack/
├── frontend/           # React + Vite SPA
│   └── src/
│       ├── app/       # Game simulation logic
│       ├── components/ # React components
│       ├── engine/    # Combat & posture scoring
│       └── services/  # API integrations
│
├── backend/           # Express API server
│   └── src/
│       ├── controllers/ # Route handlers
│       ├── routes/      # API endpoints
│       ├── db/          # Migrations & connection
│       └── middleware/  # Auth & utilities
│
└── README.md          # This file
```

---

## 🚢 Deploy to Production

**Backend** → Render Web Service  
**Frontend** → Vercel or Render  
**Database** → Render PostgreSQL (already set up)

---

## 📝 License

MIT License — See [`LICENSE`](./LICENSE) for details.

---

## 🏆 About

Built at **Hacklanta 2025** — a 12-hour cybersecurity hackathon at Georgia State University.

**Mission:** Make security training engaging, intuitive, and fun for defenders.

---

## ❓ Questions?

Open an issue on GitHub or reach out to the team. We'd love to hear how you use Counterstack!

**Let's make security training awesome.** 🛡️🎮


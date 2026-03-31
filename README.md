# 📚 ShikshaTrack

A mobile-first, offline-capable web app for teachers in low-resource schools to record student assessments, track learning progress, detect learning gaps, and receive AI-powered teaching recommendations.

---

## 🎯 Product Overview

| Aspect | Detail |
|---|---|
| Primary User | Teachers in low-resource schools |
| Device | Smartphone |
| Connectivity | Low / No internet |
| Core Goal | Record assessments in < 2 minutes |

---

## ✨ Features

### 1. Quick Assessment Recording
- Student name, class, reading level, arithmetic level
- Works offline — queues data in LocalStorage, syncs when online

### 2. Performance Dashboard
- Summary cards: total students, below grade, at grade, total assessments
- Charts: reading level distribution (bar), arithmetic distribution (pie)

### 3. Learning Gap Detection
- Auto-classifies each student as **At Grade Level** or **Below Grade Level**
- Rule: Class 3 student below Paragraph reading = Below Grade Level

### 4. AI Recommendation Engine
- Calls OpenAI GPT-3.5 with student's skill levels
- Returns 4 practical teaching suggestions
- Falls back to rule-based suggestions if offline/API unavailable

### 5. Offline-First Sync
- Saves assessments to LocalStorage queue when offline
- Auto-flushes queue to server when internet is restored

### 6. Role-Based Access
- **Teacher**: input data, view own class insights
- **Admin**: (extendable) view school/district performance

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB (Atlas) |
| AI | OpenAI API (GPT-3.5-turbo) |
| Offline | LocalStorage queue |
| Auth | JWT |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 🧠 Data Flow

```
Teacher Input (React)
    ↓
LocalStorage Queue (if offline)
    ↓ (when online)
Express REST API
    ↓
MongoDB Atlas
    ↓
AI Processing (OpenAI)
    ↓
Dashboard Insights + Recommendations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- OpenAI API key

### Backend Setup

```bash
cd server
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY
npm install
npm start
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Create a Teacher Account

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teacher Name","email":"teacher@school.com","password":"password123"}'
```

---

## 📱 Key Screens

| Screen | Purpose |
|---|---|
| Login | JWT auth |
| Dashboard | Summary cards + charts |
| Assessment Form | Quick data entry (< 2 min) |
| Students List | All students with grade status |
| Student Detail | Progress chart + AI recommendations |

---

## 🎨 Design Principles

- Mobile-first, large tap targets
- Color coding: 🟢 At Grade Level / 🔴 Below Grade Level
- Minimal UI — only essential elements
- Offline indicator in header

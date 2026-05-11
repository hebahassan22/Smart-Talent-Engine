# 🚀 Smart Talent Selection Engine
### AI-Powered Recruitment Intelligence Platform

> *Beyond keyword matching. Understand real talent.*

---

## 📌 Problem Statement

Traditional ATS systems rely on **keyword matching** — rejecting qualified candidates who use synonymous terminology. Recruiters spend just **6 seconds per resume**, missing deep technical experience while "keyword stuffers" game the system.

**Smart Talent Engine** solves this by using **semantic AI** to understand the *meaning and intent* behind resumes — not just characters.

---

## ✨ Features

### 🗂️ Multi-Format Resume Ingestion
- Upload **PDF, DOCX, JPG, PNG** resumes
- Drag & drop bulk upload (up to 20 files)
- Real-time per-file processing status log
- 6-method PDF parsing (handles tables, columns, broken files)
- OCR support for image-based resumes via Tesseract.js
- Corrupt file detection with clear error messages
- Group resumes by **Job Role** and **Batch Date**

### 🧠 Semantic AI Analysis
- Powered by **Groq LLaMA 3.3 70B** (free, ultra-fast)
- Understands skill synonyms and hierarchies
  - *PyTorch → Machine Learning*
  - *React → Frontend Development*
  - *JVM expertise → Java Developer*
- Works for **any profession** — tech, medical, legal, design, finance, education, and more
- Extracts structured profiles: name, email, phone, skills, education, certifications

### 📊 JD-to-Candidate Ranking Dashboard
- Paste or upload any Job Description
- Compatibility Score (0–100%) using semantic matching
- Weighted ranking by experience depth
- **AI Justification** for top 5 candidates
- Matched skills, skill gaps, and strengths per candidate
- AI-generated interview questions per candidate

### 🎛️ Advanced Filtering & Sorting
- Filter by experience level (Junior / Mid / Senior / Lead)
- Filter by score range (min/max)
- Filter by specific skill
- Sort by score, experience, level, or name
- Search across name, skills, and AI summary
- Toggle between **Table** and **Cards** view
- **Export to CSV** with all candidate data

### 📈 Recruiter Dashboard
- Active job roles with resume counts and avg scores
- Top talent preview per job role
- Batch history with timestamps
- Score distribution chart
- Most common skills chart
- Recent candidate activity
- Analytics & insights page

### 🔐 Authentication
- Recruiter login & register
- JWT-based authentication
- Persistent sessions (stays logged in after restart)
- Secure file uploads

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| AI/NLP | Groq API (LLaMA 3.3 70B) |
| PDF Parsing | pdf-parse + pdf2json + pdfjs-dist |
| DOCX Parsing | Mammoth.js |
| Image OCR | Tesseract.js |
| Auth | JWT + bcryptjs |
| Storage | JSON file persistence |

---

## 📁 Folder Structure

```
smart-talent-engine/
├── backend/
│   ├── data/
│   │   ├── users.json          # Persisted user accounts
│   │   └── analytics.json      # Persisted dashboard analytics
│   ├── routes/
│   │   ├── rank.js             # POST /rank — AI resume analysis
│   │   ├── auth.js             # POST /auth/login, /register
│   │   └── dashboard.js        # GET/POST /dashboard/stats
│   ├── uploads/                # Temp file storage (auto-cleaned)
│   ├── server.js               # Express server entry point
│   ├── package.json
│   └── .env                    # API keys (create this manually)
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── rank.js          # Axios API calls
    │   │   └── dashboard.js     # Dashboard API calls
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── AuthPage.jsx
    │   │   ├── dashboard/
    │   │   │   └── DashboardPage.jsx
    │   │   ├── ranking/
    │   │   │   └── CandidateCard.jsx
    │   │   ├── UploadZone.jsx
    │   │   ├── JDInput.jsx
    │   │   ├── ResultsDashboard.jsx
    │   │   ├── LoadingState.jsx
    │   │   └── ScoreRing.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18 or higher
- A free **Groq API key** from [console.groq.com](https://console.groq.com)

### Step 1 — Clone the repository
```bash
git clone https://github.com/yourusername/smart-talent-engine.git
cd smart-talent-engine
```

### Step 2 — Backend Setup
```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Open `.env` and add your Groq API key:
```
GROQ_API_KEY=key
PORT=5000
```

Start the backend:
```bash
npm run dev
```

✅ Backend running at `http://localhost:5000`

### Step 3 — Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running at `http://localhost:3000`

### Step 4 — Open the app
Go to **http://localhost:3000** in your browser.

Register a recruiter account and start analyzing resumes!

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GROQ_API_KEY` | Free API key from console.groq.com | ✅ Yes |
| `PORT` | Backend port (default: 5000) | ❌ Optional |
| `JWT_SECRET` | Secret for JWT tokens | ❌ Optional (has default) |

---

## 🎯 How It Works

```
Resume Upload (PDF/DOCX/JPG/PNG)
        ↓
Text Extraction (6-method PDF pipeline + OCR)
        ↓
AI Semantic Analysis (Groq LLaMA 3.3 70B)
        ↓
Structured Profile Generation
        ↓
JD Comparison & Compatibility Scoring
        ↓
Ranked Results with AI Justification
```

### Scoring Guide
| Score | Meaning |
|---|---|
| 85–100% | Excellent match — strong domain alignment |
| 70–84% | Good match — solid experience, minor gaps |
| 55–69% | Decent match — relevant background, some gaps |
| 40–54% | Partial match — limited relevant experience |
| 20–39% | Weak match — few relevant skills |
| 0–19% | Poor match — different domain |

### Experience Levels
| Years | Level |
|---|---|
| 0–1 year | Junior |
| 2–4 years | Mid |
| 5–8 years | Senior |
| 9+ years | Lead |

---

## 📸 Screenshots

### Login Page
> Secure recruiter authentication with JWT

### Recruiter Dashboard
> Analytics overview with score distribution, top skills, and recent activity

### Upload & Analysis
> Real-time per-file processing log with status indicators

### Ranking Table
> Filterable, sortable candidate table with AI justification for top 5

### Candidate Profile
> Skills, education, certifications, strengths, and AI interview questions

---

## 🆓 Free Tier Limits (Groq)

| Metric | Limit |
|---|---|
| Cost | $0 forever |
| Requests/day | 14,400 |
| Speed | 500+ tokens/second |
| Model | LLaMA 3.3 70B |
| Credit card | Not required |

14,400 requests/day = analyzing **thousands of resumes daily** for free.

---

## 🚀 Deployment

### Frontend — Vercel
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend — Railway / Render
```bash
# Set environment variables in Railway/Render dashboard
# GROQ_API_KEY=key
# PORT=5000
```

---

## 👩‍💻 Author

**Heba Hassan**
- 📍 Kerala, India
- 📧 hebahas105@gmail.com
- 🔗 [linkedin.com/in/hebahas105](https://linkedin.com/in/hebahas105)
- 🎓 B.Tech Computer Science Engineering
- College of Engineering Trikaripur (2022–2026)


---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

**Smart Talent Engine**


</div>

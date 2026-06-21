# NEXUS — The Operating System for Student Employability

NEXUS is a full-stack employability platform that bridges the gap between student skills and industry expectations — combining a proctored coding-assessment ground, a multi-stage AI mock interviewer, a mentor directory, and a credential wallet behind one student dashboard.

Built as a Final Year B.Tech Project at IIIT Kota by **Tanishq Sharma** (Electronics & Communication Engineering).

---

## 🚀 Features

### 🤖 AI Mock Interview System
- Role-based, multi-stage interview simulations for **SDE, ML, Analyst, Frontend, and DevOps** tracks. Each role runs through a fixed stage sequence (e.g. SDE: `Warm-up → DSA → System Design → Core CS Concepts → Behavioral`).
- Each stage has an exchange budget (2–5 exchanges) before the interview auto-advances to the next stage.
- **Automated per-stage scoring**: when a stage ends, a separate Claude call scores the candidate on technical accuracy, communication clarity, and depth — kept deliberately separate from the conversational reply so scoring never leaks into what the candidate sees mid-interview.
- Live webcam proctoring during the session via **MediaPipe Face Detection** (face-presence tracking with on-screen warnings) and tab-switch detection (`visibilitychange` listener) — same proctoring pattern used in the coding round.

### 💻 Coding Assessment Platform
- Multi-domain problem bank: **DSA, SQL, ML, and React/Web** question pools, selectable by domain.
- Remote code execution and judging via the [Piston API](https://github.com/engineer-man/piston) — supports **Python, JavaScript, TypeScript, Java, C, C++, and Go**.
- Same webcam face-detection + tab-switch proctoring as the mock interview.

### 📊 Student Dashboard
- Employability score breakdown, skills overview, interview history, and notifications.

### 🎓 Credential Wallet
- View and manage earned credentials in a dedicated wallet view.

### 👨‍🏫 Mentor Directory & Multi-Role Support
- Role-aware platform with **student, mentor, recruiter, and TPO** accounts (each with role-specific profile fields — e.g. `domain_expertise` for mentors, `company`/`linkedin_url` for recruiters, `department`/`employee_id` for TPOs).
- TPO batch view for placement-officer-level analytics.
- Mentor browsing by domain expertise.

### 💬 AI Advisor Chat
- Lightweight chat endpoint for student career queries.

---

## 🏗️ System Architecture

```text
                ┌─────────────────────────┐
                │   Frontend (static)     │
                │  HTML / CSS / vanilla JS│
                └────────────┬────────────┘
                             │ REST (fetch)
                             ▼
                ┌─────────────────────────┐
                │     FastAPI Backend     │
                │        (main.py)        │
                └──┬───────────┬──────────┘
                   │           │
        ┌──────────▼───┐   ┌───▼────────────┐
        │ Supabase     │   │  Outbound calls │
        │ Auth + Postgres│ │  ┌────────────┐ │
        │ (profiles table)│ │  Piston API  │ │ ← code execution/judging
        └──────────────┘   │  └────────────┘ │
                            │  ┌────────────┐ │
                            │  Claude API   │ │ ← mock interview + scoring
                            │  └────────────┘ │
                            └────────────────┘
```

Piston and Claude are independent outbound calls from the backend, not a linear pipeline — code execution and AI interviewing don't depend on each other.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript (ES6+), MediaPipe Face Detection (CDN) |
| Backend | FastAPI, Python, Pydantic |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) |
| Code Execution | Piston API (public instance) |
| AI Interviewer | Anthropic Claude API (separate calls for conversation vs. stage scoring) |

> **Note on legacy code:** `backend/auth.py`, `database.py`, `models.py`, `schemas.py`, and `nexus.db` are leftovers from an earlier SQLAlchemy + JWT design and are **not imported by `main.py`**. The live backend uses Supabase exclusively for auth and persistence. Safe to ignore or remove unless reverting to a self-hosted DB.

---

## 📂 Project Structure

```text
NEXUS/
├── index.html / login.html / signup.html        # Landing, auth pages
├── dashboard.html + dashboard.js                 # Student dashboard (+ proctoring)
├── interview.html + interview.js + interview.css # Coding assessment UI
├── mock-interview.js                             # AI mock interview UI (+ proctoring)
├── mentors.html + mentors.js                     # Mentor directory
├── credentials.html + credentials.js             # Credential wallet
├── chat.js                                       # AI advisor chat widget
├── main.js / login.js / style.css / style2.css   # Shared logic & styles
└── backend/
    ├── main.py             # FastAPI app, all routes
    ├── claude_prompts.py   # Stage definitions, labels, exchange budgets, prompts
    ├── mock_interview.py   # Mock interview session + per-stage scoring logic
    ├── harnesses.py        # Per-language execution harnesses + Piston config
    ├── problems.py         # DSA / SQL / ML / React problem pools
    ├── profiles.sql        # Supabase table setup script
    ├── nexus.db            # Legacy SQLite DB (unused)
    └── auth.py / database.py / models.py / schemas.py  # Unused legacy SQLAlchemy code
```

---

## ⚙️ Installation

### Backend

```bash
cd backend
pip install fastapi uvicorn supabase pydantic anthropic
```

Currently, `SUPABASE_URL`/`SUPABASE_KEY` are hardcoded near the top of `main.py`, and `ANTHROPIC_API_KEY` is read with `os.environ.get(...)` (no `.env` loader wired in yet). To run it as-is:

```bash
export ANTHROPIC_API_KEY="your-key-here"
```

…and edit `SUPABASE_URL` / `SUPABASE_KEY` in `main.py` directly to point at your own Supabase project.

**To use a proper `.env` file instead** (recommended, not yet implemented):
```bash
pip install python-dotenv
```
then add `from dotenv import load_dotenv; load_dotenv()` to the top of `main.py` and switch the hardcoded Supabase values to `os.environ.get(...)` — they currently aren't read from environment variables.

Run the server:
```bash
python -m uvicorn main:app --reload --port 8000
```
- API: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/api/docs`

### Supabase
1. Create a Supabase project.
2. Run `backend/profiles.sql` in the SQL Editor — creates the `profiles` table (roles: `student`, `tpo`, `recruiter`, `mentor`).
3. Point `main.py` at your project's URL/key.

### Frontend
No build step — static files only.
```bash
python -m http.server 3000
```
Open `http://localhost:3000/index.html`. Frontend pages call the backend directly at `http://localhost:8000` (hardcoded in `login.js`, `dashboard.js`, `interview.js`, `mock-interview.js`), so the backend must be running first.

---

## 📈 API Reference

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | POST/GET | Auth |
| `/api/student/profile`, `/api/student/score-breakdown` | GET | Student data |
| `/api/skills` | GET | Skills list |
| `/api/interviews`, `/api/questions/random`, `/api/leetcode/random` | GET | Question pools |
| `/api/execute` | POST | Run submitted code via Piston, judge against expected output |
| `/api/credentials` | GET | Credential wallet |
| `/api/mentors` | GET | Mentor directory |
| `/api/chat` | POST | AI advisor chat |
| `/api/notifications` | GET | Notifications |
| `/api/tpo/batch` | GET | TPO batch analytics |
| `/api/mi/start` | POST | Start a mock interview session (role, experience, duration) |
| `/api/mi/message` | POST | Send a candidate message, get interviewer reply + stage status |
| `/api/mi/session/{session_id}` | GET | Fetch current session state |
| `/api/mi/end` | POST | End session, get final stage scores |
| `/api/health` | GET | Health check |

Full schema-level docs at `/api/docs` once the backend is running.

---

## 🎯 Target Users

- **Students** — track readiness, practice proctored coding rounds and AI interviews, build a credential profile.
- **Mentors** — browse by domain expertise, guide students.
- **Recruiters** — view verified, recruiter-ready student profiles.
- **TPOs** — batch-level placement readiness analytics.

---

## 🔮 Future Enhancements

- Blockchain-based credential verification
- LLM-based resume analysis
- AI career roadmap generator
- Job/internship recommendation engine
- Predictive placement analytics

---

## ⚠️ Known Gaps

- Supabase credentials and the `localhost:8000` API base are hardcoded — should move to environment variables before any deployment.
- Row Level Security is explicitly disabled on `profiles` (see `profiles.sql`) — fine for local dev, not production.
- Legacy SQLAlchemy/JWT files (`auth.py`, `database.py`, `models.py`, `schemas.py`, `nexus.db`) are dead code; safe to delete once confirmed unused elsewhere.
- No automated tests or CI configured yet.

---

## 👨‍💻 Author

**Tanishq Sharma** — B.Tech Electronics & Communication Engineering, IIIT Kota

## 📄 License

Developed for academic and research purposes. Free to modify and extend for educational use.

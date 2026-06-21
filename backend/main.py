"""
NEXUS — FastAPI Backend (Supabase Edition)
==========================================
Auth: Supabase Auth (email + password, built-in JWT)
DB:   Supabase PostgreSQL (via supabase-py REST client)

Tables:
  - auth.users        ← managed by Supabase Auth automatically
  - public.profiles   ← our custom metadata (run profiles.sql first)

Run:
    python -m uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from supabase import create_client, Client
import random

# ── Supabase Client ───────────────────────────────────────────
SUPABASE_URL = "https://qqyzyypodbaytbkgeeue.supabase.co"
SUPABASE_KEY = "sb_publishable_m_4AY0an3ybPeTmdCAklsg_KAbLFX3g"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── App Setup ─────────────────────────────────────────────────
app = FastAPI(
    title="NEXUS API",
    description="Student Employability Platform — Supabase Auth + PostgreSQL",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer(auto_error=False)


# ── Auth Dependency ───────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """
    Verifies the JWT token via Supabase Auth.
    Returns the Supabase user object.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")
    try:
        response = supabase.auth.get_user(credentials.credentials)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


def get_profile(user_id: str) -> dict:
    """Fetch the user's profile row from the profiles table."""
    try:
        res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        return res.data or {}
    except Exception:
        return {}


# ═══════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════

class SignupRequest(BaseModel):
    name:     str
    email:    str
    password: str
    role:     str = "student"
    college:  Optional[str] = None
    branch:   Optional[str] = None
    year:     Optional[str] = None
    department:       Optional[str] = None
    employee_id:      Optional[str] = None
    company:          Optional[str] = None
    designation:      Optional[str] = None
    linkedin_url:     Optional[str] = None
    current_role:     Optional[str] = None
    domain_expertise: Optional[str] = None

class LoginRequest(BaseModel):
    email:    str
    password: str

class ChatMessage(BaseModel):
    message: str


# ═══════════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════════

@app.post("/api/auth/signup", tags=["Auth"])
def signup(body: SignupRequest):
    """
    1. Creates user in Supabase Auth (handles password hashing internally)
    2. Inserts profile metadata into public.profiles table
    3. Returns Supabase JWT access_token
    """
    # Basic validation
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    if not body.name.strip():
        raise HTTPException(400, "Name is required.")

    try:
        # Step 1: Create user in Supabase Auth
        res = supabase.auth.sign_up({
            "email": body.email.lower().strip(),
            "password": body.password,
        })

        if not res.user:
            raise HTTPException(400, "Signup failed. Email may already be registered.")

        user = res.user
        session = res.session

        # Step 2: Insert profile metadata
        profile_data = {
            "id":               user.id,
            "name":             body.name.strip(),
            "role":             body.role,
            "college":          body.college,
            "branch":           body.branch,
            "year":             body.year,
            "department":       body.department,
            "employee_id":      body.employee_id,
            "company":          body.company,
            "designation":      body.designation,
            "linkedin_url":     body.linkedin_url,
            "current_role":     body.current_role,
            "domain_expertise": body.domain_expertise,
        }
        # Remove None values
        profile_data = {k: v for k, v in profile_data.items() if v is not None}
        supabase.table("profiles").insert(profile_data).execute()

        first_name = body.name.strip().split()[0]
        initials   = "".join(w[0].upper() for w in body.name.strip().split()[:2])

        return {
            "access_token": session.access_token if session else None,
            "token_type":   "bearer",
            "message":      f"Welcome to NEXUS, {first_name}!",
            "user": {
                "id":       user.id,
                "email":    user.email,
                "name":     body.name.strip(),
                "role":     body.role,
                "initials": initials,
                "college":  body.college,
                "branch":   body.branch,
            },
            # Note: if email confirmation is enabled in Supabase,
            # session will be None until user confirms email.
            "email_confirmation_required": session is None,
        }

    except HTTPException:
        raise
    except Exception as e:
        err = str(e)
        if "already registered" in err or "already been registered" in err:
            raise HTTPException(400, "An account with this email already exists.")
        raise HTTPException(500, f"Signup error: {err}")


@app.post("/api/auth/login", tags=["Auth"])
def login(body: LoginRequest):
    """
    Authenticates via Supabase Auth and returns a JWT token.
    """
    try:
        res = supabase.auth.sign_in_with_password({
            "email":    body.email.lower().strip(),
            "password": body.password,
        })

        if not res.user or not res.session:
            raise HTTPException(401, "Incorrect email or password.")

        user    = res.user
        session = res.session

        # Fetch profile metadata
        profile = get_profile(user.id)
        name     = profile.get("name", user.email.split("@")[0])
        initials = "".join(w[0].upper() for w in name.split()[:2])

        return {
            "access_token": session.access_token,
            "token_type":   "bearer",
            "message":      f"Welcome back, {name.split()[0]}!",
            "user": {
                "id":       user.id,
                "email":    user.email,
                "name":     name,
                "role":     profile.get("role", "student"),
                "initials": initials,
                "college":  profile.get("college"),
                "branch":   profile.get("branch"),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        err = str(e)
        if "Invalid login" in err or "invalid_grant" in err or "invalid credentials" in err.lower():
            raise HTTPException(401, "Incorrect email or password.")
        raise HTTPException(500, f"Login error: {err}")


@app.post("/api/auth/logout", tags=["Auth"])
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """Signs out the current user from Supabase Auth."""
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully."}
    except Exception:
        return {"message": "Logged out."}


@app.get("/api/auth/me", tags=["Auth"])
def get_me(current_user=Depends(get_current_user)):
    """Returns the current user's profile. Requires Bearer token."""
    profile  = get_profile(current_user.id)
    name     = profile.get("name", current_user.email.split("@")[0])
    initials = "".join(w[0].upper() for w in name.split()[:2])
    return {
        "id":       current_user.id,
        "email":    current_user.email,
        "name":     name,
        "role":     profile.get("role", "student"),
        "initials": initials,
        "college":  profile.get("college"),
        "branch":   profile.get("branch"),
        "year":     profile.get("year"),
        "company":  profile.get("company"),
    }


# ═══════════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
def root():
    return {
        "status":    "ok",
        "service":   "NEXUS API",
        "version":   "3.0.0",
        "auth":      "Supabase Auth",
        "database":  "Supabase PostgreSQL",
        "timestamp": datetime.now().isoformat(),
        "docs":      "/api/docs",
    }

@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "healthy", "db": "Supabase PostgreSQL"}


# ═══════════════════════════════════════════════════════════════
# STUDENT (protected)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/student/profile", tags=["Student"])
def get_student_profile(current_user=Depends(get_current_user)):
    profile  = get_profile(current_user.id)
    name     = profile.get("name", current_user.email.split("@")[0])
    initials = "".join(w[0].upper() for w in name.split()[:2])
    return {
        "id":                  current_user.id,
        "name":                name,
        "email":               current_user.email,
        "role":                profile.get("role", "student"),
        "college":             profile.get("college", ""),
        "branch":              profile.get("branch", "CSE"),
        "year":                profile.get("year", "Final Year"),
        "avatar_initials":     initials,
        "employability_score": 68,
        "score_change_week":   +2,
        "score_trend":         "improving",
        "total_interviews":    12,
        "total_credentials":   7,
        "active_streak_days":  30,
        "last_activity":       "GitHub push · 3 minutes ago",
        "target_role":         "SDE-1 at Series B Startup",
    }


@app.get("/api/student/score-breakdown", tags=["Student"])
def get_score_breakdown(current_user=Depends(get_current_user)):
    return {
        "total": 68,
        "components": [
            {"label": "Projects",        "score": 22, "max": 30, "pct": 73},
            {"label": "Mock Interviews", "score": 18, "max": 25, "pct": 72},
            {"label": "Certifications",  "score": 12, "max": 20, "pct": 60},
            {"label": "GitHub Activity", "score": 10, "max": 15, "pct": 67},
            {"label": "Workshops",       "score": 6,  "max": 10, "pct": 60},
        ],
        "model":        "NEXUS-ScoreNet v2.1",
        "last_updated": datetime.now().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════
# SKILLS, INTERVIEWS, CREDENTIALS, MENTORS, CHAT, NOTIFICATIONS
@app.get("/api/skills", tags=["Skills"])
def get_skill_gaps(current_user=Depends(get_current_user)):
    return {
        "target_role": "SDE-1",
        "jds_analyzed": 50,
        "gaps": [
            {"skill": "System Design",  "demand_pct": 82, "your_level": "Beginner",      "status": "gap",     "priority": 1},
            {"skill": "DSA / Algorithms","demand_pct": 78, "your_level": "Intermediate",  "status": "partial", "priority": 2},
            {"skill": "Cloud / AWS",    "demand_pct": 64, "your_level": "Beginner",       "status": "gap",     "priority": 3},
            {"skill": "React.js",       "demand_pct": 58, "your_level": "Advanced",       "status": "covered", "priority": 4},
            {"skill": "SQL / PostgreSQL","demand_pct": 54, "your_level": "Intermediate",  "status": "covered", "priority": 5},
            {"skill": "Machine Learning","demand_pct": 42, "your_level": "Intermediate",  "status": "partial", "priority": 6},
            {"skill": "Docker / K8s",   "demand_pct": 38, "your_level": "Beginner",       "status": "gap",     "priority": 7},
        ],
    }

@app.get("/api/interviews", tags=["Interviews"])
def get_interviews(current_user=Depends(get_current_user)):
    return {
        "total": 12, "average_score": 71,
        "history": [
            {"date": "2026-06-14", "topic": "System Design", "score": 74, "status": "cleared"},
            {"date": "2026-06-02", "topic": "DSA Round",     "score": 81, "status": "cleared"},
            {"date": "2026-05-28", "topic": "LRU Cache",     "score": 68, "status": "cleared"},
            {"date": "2026-04-30", "topic": "System Design", "score": 63, "status": "failed"},
        ],
    }

import urllib.request as _urllib_req
import json as _json
from problems import DOMAIN_POOLS, PROBLEM_POOL
from harnesses import HARNESSES, PISTON_LANGS

# Per-domain shuffle state (avoids repeating same question back-to-back)
_used = {d: [] for d in DOMAIN_POOLS}

# ── Question endpoint — domain-aware ─────────────────────────
@app.get("/api/questions/random", tags=["Interviews"])
def get_random_question(domain: str = "dsa"):
    global _used
    pool = DOMAIN_POOLS.get(domain.lower(), DOMAIN_POOLS["dsa"])
    used = _used.get(domain.lower(), [])
    available = [i for i in range(len(pool)) if i not in used]
    if not available:
        _used[domain.lower()] = []
        available = list(range(len(pool)))
    idx = random.choice(available)
    _used[domain.lower()].append(idx)
    q = pool[idx]
    lang_display = {
        "python3": "Python 3", "javascript": "JavaScript", "java": "Java",
        "cpp": "C++", "c": "C", "typescript": "TypeScript", "golang": "Go",
        "sql": "SQL",
    }
    return {
        "id":            q["id"],
        "title":         q["title"],
        "slug":          q["slug"],
        "difficulty":    q["difficulty"],
        "source":        q.get("source", "LeetCode"),
        "question_type": q.get("question_type", "coding"),
        "default_lang":  q.get("default_lang", "python3"),
        "content":       q["content"],
        "editorial":     q["editorial"],
        "test_cases":    q.get("test_cases", []),
        "snippets":      q["snippets"],
        "lang_display":  lang_display,
    }

# Keep backwards-compat alias
@app.get("/api/leetcode/random", tags=["Interviews"])
def get_random_leetcode():
    return get_random_question(domain="dsa")

# ── Code Execution — Real Sandboxed Judge via Piston API ─────
class ExecuteRequest(BaseModel):
    slug:     str
    language: str
    code:     str

PISTON_URL = "https://emkc.org/api/v2/piston/execute"

def _call_piston(language_key: str, full_code: str) -> dict:
    """POST to Piston API and return {stdout, stderr, exit_code}."""
    lang_cfg = PISTON_LANGS.get(language_key, {"language": "python", "version": "3.10.0"})
    payload = _json.dumps({
        "language": lang_cfg["language"],
        "version":  lang_cfg["version"],
        "files":    [{"name": "main", "content": full_code}],
        "stdin":    "",
        "run_timeout": 6000,   # 6 s wall-clock
        "compile_timeout": 10000,
    }).encode("utf-8")
    req = _urllib_req.Request(
        PISTON_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with _urllib_req.urlopen(req, timeout=15) as resp:
        data = _json.loads(resp.read().decode())
    run = data.get("run", {})
    compile_out = data.get("compile", {}).get("stderr", "") or data.get("compile", {}).get("output", "")
    return {
        "stdout":       (run.get("stdout") or "").strip(),
        "stderr":       (run.get("stderr") or ""),
        "exit_code":    run.get("code", 0),
        "compile_err":  compile_out,
    }

@app.post("/api/execute", tags=["Interviews"])
def execute_code(body: ExecuteRequest):
    """
    Real sandboxed code execution via Piston API.
    Steps:
      1. Look up per-question harness for the chosen language
      2. Inject user code into {{USER_CODE}} placeholder
      3. POST to Piston (actual OS sandbox, separate process)
      4. Compare trimmed stdout against stored expected output
      5. Return structured verdict: Accepted / Wrong Answer /
         Runtime Error / Compilation Error / Unsupported Language
    """
    slug = body.slug
    lang = body.language

    # ── SQL questions: force run as python3 using sqlite3 wrapper ─
    q_type = "coding"
    for pool in DOMAIN_POOLS.values():
        for q in pool:
            if q["slug"] == slug:
                q_type = q.get("question_type", "coding")
                break

    harness_lang = lang
    if q_type == "sql":
        harness_lang = "python3"   # SQL harnesses execute via sqlite3 in Python

    # ── Get harness ────────────────────────────────────────────
    problem_harnesses = HARNESSES.get(slug)
    if not problem_harnesses:
        return {
            "verdict": "Unsupported",
            "message": f"No harness defined for '{slug}'. Syntax check only.",
        }

    lang_harness = problem_harnesses.get(harness_lang) or problem_harnesses.get("python3")
    if not lang_harness:
        return {
            "verdict": "Unsupported",
            "message": f"Language '{lang}' not supported for this problem. Try Python 3.",
        }

    # ── Inject user code ───────────────────────────────────────
    template = lang_harness["code"]
    expected = lang_harness["expected"].strip()
    full_code = template.replace("{{USER_CODE}}", body.code)

    # ── Execute via Piston ──────────────────────────────────────
    try:
        result = _call_piston(harness_lang, full_code)
    except Exception as exc:
        return {"verdict": "Sandbox Error", "message": str(exc)}

    # ── Compile error ───────────────────────────────────────────
    if result["compile_err"] and result["exit_code"] != 0:
        return {
            "verdict": "Compilation Error",
            "stderr":  result["compile_err"],
            "stdout":  result["stdout"],
        }

    # ── Runtime error ───────────────────────────────────────────
    if result["exit_code"] != 0:
        return {
            "verdict": "Runtime Error",
            "stderr":  result["stderr"],
            "stdout":  result["stdout"],
        }

    actual = result["stdout"].strip()

    # ── Normalise for comparison (collapse whitespace in each line) ─
    def normalise(s: str) -> str:
        return "\n".join(line.strip() for line in s.strip().splitlines())

    passed = normalise(actual) == normalise(expected)

    # ── Build per-line diff for the frontend ───────────────────
    actual_lines   = actual.splitlines()
    expected_lines = expected.splitlines()
    cases = []
    for i, exp_line in enumerate(expected_lines):
        act_line = actual_lines[i] if i < len(actual_lines) else "(missing)"
        cases.append({
            "index":    i + 1,
            "expected": exp_line.strip(),
            "actual":   act_line.strip(),
            "pass":     act_line.strip() == exp_line.strip(),
        })

    return {
        "verdict":        "Accepted" if passed else "Wrong Answer",
        "passed":         passed,
        "actual":         actual,
        "expected":       expected,
        "cases":          cases,
        "stdout":         result["stdout"],
        "stderr":         result["stderr"],
    }


@app.get("/api/credentials", tags=["Credentials"])
def get_credentials(current_user=Depends(get_current_user)):
    return {
        "total": 7, "verified_onchain": 7, "blockchain": "Polygon Mumbai Testnet",
        "credentials": [
            {"id": "cred_001", "type": "Mock Interview",      "title": "System Design",                "score": "74/100",   "date": "14 June 2026",     "tx_hash": "0x3f4a8bC91D2e4F6c7A8d9E0F1B2c3D4e5F6a7B8c"},
            {"id": "cred_002", "type": "GitHub Contribution", "title": "NEXUS Backend — 30-Day Streak","score": "Active",   "date": "31 May 2026",      "tx_hash": "0x7d3e4f9a2b8c1d5e6f7a8b9c0d1e2f3a4b5c6d7e"},
            {"id": "cred_003", "type": "Certification",       "title": "HuggingFace NLP Course",       "score": "Completed","date": "3 April 2026",     "tx_hash": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"},
            {"id": "cred_004", "type": "Hackathon",           "title": "SIH 2025 — Finalist",          "score": "Finalist", "date": "18 Dec 2025",      "tx_hash": "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"},
            {"id": "cred_005", "type": "Mock Interview",      "title": "DSA Round",                    "score": "81/100",   "date": "2 June 2026",      "tx_hash": "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2"},
            {"id": "cred_006", "type": "Workshop",            "title": "Docker + Kubernetes",           "score": "Attended", "date": "8 February 2026",  "tx_hash": "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3"},
            {"id": "cred_007", "type": "Project Milestone",   "title": "Sakhi.ai v1.0 — Deployed",     "score": "Deployed", "date": "22 May 2026",      "tx_hash": "0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4"},
        ],
    }

@app.get("/api/mentors", tags=["Mentors"])
def get_mentors(current_user=Depends(get_current_user)):
    return {
        "total": 6,
        "mentors": [
            {"id": "men_001", "initials": "VN", "name": "Vikram Nair",   "role": "SDE-3",         "company": "Amazon",            "domains": ["System Design","DSA","Backend"], "match_score": 92, "reputation": 4.9},
            {"id": "men_002", "initials": "NK", "name": "Neha Kulkarni", "role": "ML Engineer",   "company": "Microsoft Research","domains": ["ML","NLP","Python"],             "match_score": 88, "reputation": 5.0},
            {"id": "men_003", "initials": "AB", "name": "Arjun Bose",    "role": "Frontend Lead", "company": "PhonePe",           "domains": ["Frontend","React","TypeScript"], "match_score": 81, "reputation": 4.6},
            {"id": "men_004", "initials": "SP", "name": "Shruti Patel",  "role": "DevOps Lead",   "company": "Flipkart",          "domains": ["DevOps","Cloud","K8s"],          "match_score": 79, "reputation": 4.8},
            {"id": "men_005", "initials": "RS", "name": "Rohan Sen",     "role": "Backend SDE",   "company": "Razorpay",          "domains": ["Backend","APIs","Microservices"],"match_score": 76, "reputation": 4.5},
            {"id": "men_006", "initials": "DI", "name": "Divya Iyer",   "role": "Blockchain Dev", "company": "Polygon Labs",      "domains": ["Blockchain","Web3","Solidity"],  "match_score": 72, "reputation": 4.7},
        ],
    }

CHAT_RESPONSES = {
    "default":  "I've reviewed your profile. Your biggest gap is System Design. For the role you're targeting, prioritize Grokking System Design + one mock interview per week.",
    "razorpay": "For Razorpay SDE-2: (1) Distributed systems — rate limiting, idempotency. (2) High-availability patterns. (3) PostgreSQL optimization.",
    "flipkart": "Flipkart heavily tests System Design and DSA. Focus on consistent hashing, database sharding, Trees/Graphs on LeetCode.",
    "score":    "Your score of 68: Projects 22/30, Mock Interviews 18/25, Certifications 12/20, GitHub 10/15, Workshops 6/10.",
    "plan":     "4-week plan: Week 1 — System Design. Week 2 — DSA. Week 3 — Cloud/DevOps. Week 4 — 2 mock interviews + resume. Projected: 79/100.",
}

@app.post("/api/chat", tags=["AI Advisor"])
def chat(body: ChatMessage, current_user=Depends(get_current_user)):
    msg = body.message.lower()
    key = next((k for k in ["razorpay","flipkart","score","plan"] if k in msg), "default")
    return {"response": CHAT_RESPONSES[key], "powered_by": "Claude API (mock)", "tokens_used": random.randint(120, 340)}

@app.get("/api/notifications", tags=["Notifications"])
def get_notifications(current_user=Depends(get_current_user)):
    return {
        "unread": 5,
        "notifications": [
            {"id": "n1", "icon": "🟢", "text": "Score updated: +2 (GitHub push)",                   "time": "3 minutes ago", "read": False},
            {"id": "n2", "icon": "🎙️","text": "Mock interview reminder: DSA Round · Tomorrow 6pm",  "time": "1 hour ago",    "read": False},
            {"id": "n3", "icon": "📋", "text": "Action plan updated by Claude",                      "time": "Today 2:30 PM", "read": False},
            {"id": "n4", "icon": "⛓️","text": "Credential verified by recruiter · Infosys",         "time": "Yesterday",     "read": False},
            {"id": "n5", "icon": "🧑‍🏫","text": "Mentor accepted your session request",             "time": "2 days ago",    "read": False},
        ],
    }

@app.get("/api/tpo/batch", tags=["TPO"])
def get_batch_analytics(current_user=Depends(get_current_user)):
    profile = get_profile(current_user.id)
    return {
        "college": profile.get("college", "Your College"),
        "batch_year": "2025-26",
        "total_students": 184,
        "avg_score": 61.4,
        "score_distribution": {"ready": {"pct": 42}, "developing": {"pct": 38}, "critical": {"pct": 20}},
        "at_risk_students": [
            {"name": "Student A", "branch": "CSE", "score": 38, "trend": "down",   "last_active": "8 days ago"},
            {"name": "Student B", "branch": "ECE", "score": 44, "trend": "down",   "last_active": "5 days ago"},
            {"name": "Student C", "branch": "CSE", "score": 47, "trend": "stable", "last_active": "2 days ago"},
        ],
    }


# ═══════════════════════════════════════════════════════════════
# MOCK INTERVIEW — Conversational AI (Claude-backed)
# ═══════════════════════════════════════════════════════════════
from mock_interview import (
    create_session    as _mi_create,
    send_message      as _mi_send,
    end_session       as _mi_end,
    get_session_state as _mi_state,
)

class MIStartRequest(BaseModel):
    role:          str
    experience:    str
    duration_mins: int = 45

class MIMessageRequest(BaseModel):
    session_id: str
    text:       str

class MIEndRequest(BaseModel):
    session_id: str

@app.post("/api/mi/start", tags=["MockInterview"])
def mi_start(body: MIStartRequest):
    valid_roles = {"sde", "ml", "analyst", "frontend", "devops"}
    if body.role not in valid_roles:
        raise HTTPException(400, f"Invalid role. Must be one of: {valid_roles}")
    try:
        return _mi_create(body.role, body.experience, body.duration_mins)
    except RuntimeError as e:
        print(f"[ERROR] /api/mi/start failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[ERROR] /api/mi/start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mi/message", tags=["MockInterview"])
def mi_message(body: MIMessageRequest):
    if not body.text.strip():
        raise HTTPException(400, "Message text cannot be empty.")
    try:
        return _mi_send(body.session_id, body.text)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(500, f"Message failed: {e}")

@app.get("/api/mi/session/{session_id}", tags=["MockInterview"])
def mi_get_state(session_id: str):
    try:
        return _mi_state(session_id)
    except ValueError as e:
        raise HTTPException(404, str(e))

@app.post("/api/mi/end", tags=["MockInterview"])
def mi_end(body: MIEndRequest):
    try:
        return _mi_end(body.session_id)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(500, f"End session failed: {e}")

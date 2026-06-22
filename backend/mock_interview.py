"""
NEXUS — Mock Interview Session Manager
======================================
Manages Groq conversation sessions for the Mock Interview product.

Key design decisions:
  - Sessions stored in-memory (dict). Short-lived; restart = session lost. Fine for demo.
  - Groq llama-3.3-70b for interview conversation (free, fast, high quality).
  - Groq llama-3.3-70b for meta-calls: scoring, summary.
  - Scoring is a SEPARATE API call after each stage — never embedded in conversation reply.
  - Stage advancement is server-side state machine (exchange count budget),
    NOT model-signalled. More reliable.

Setup:
  pip install groq
  Set GROQ_API_KEY below (or via environment variable).
  Get your free key at: https://console.groq.com
"""

import uuid
import json
import os
from datetime import datetime
from typing import Optional

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

try:
    from groq import Groq
    _GROQ_AVAILABLE = True
except ImportError:
    _GROQ_AVAILABLE = False

from claude_prompts import (
    get_system_prompt,
    ROLE_STAGES,
    STAGE_LABELS,
    STAGE_EXCHANGE_BUDGET,
)

# ─────────────────────────────────────────────────────────────
# CONFIG — paste your Groq API key here
# Get a free key at: https://console.groq.com
# ─────────────────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
INTERVIEW_MODEL = "llama-3.3-70b-versatile"
SCORING_MODEL   = "llama-3.3-70b-versatile"

MAX_TOKENS_REPLY   = 500
MAX_TOKENS_SCORING = 250
MAX_TOKENS_SUMMARY = 400

# ─────────────────────────────────────────────────────────────
# SESSION STATE
# ─────────────────────────────────────────────────────────────
class InterviewSession:
    def __init__(self, role: str, experience: str, duration_mins: int):
        self.session_id    = str(uuid.uuid4())
        self.role          = role
        self.experience    = experience
        self.duration_mins = duration_mins
        self.stages        = ROLE_STAGES.get(role, ROLE_STAGES["sde"])
        self.stage_idx     = 0
        self.exchange_count  = 0
        self.stage_scores    = {}
        self.messages        = []
        self.start_time      = datetime.now()
        self.ended           = False

    @property
    def current_stage(self) -> str:
        return self.stages[self.stage_idx] if self.stage_idx < len(self.stages) else self.stages[-1]

    @property
    def time_remaining_secs(self) -> int:
        elapsed = (datetime.now() - self.start_time).seconds
        return max(0, self.duration_mins * 60 - elapsed)

    @property
    def elapsed_mins(self) -> int:
        return (datetime.now() - self.start_time).seconds // 60

    def should_advance(self) -> bool:
        budget = STAGE_EXCHANGE_BUDGET.get(self.current_stage, 4)
        return self.exchange_count >= budget and self.stage_idx < len(self.stages) - 1


# In-memory session store
SESSIONS: dict[str, InterviewSession] = {}


# ─────────────────────────────────────────────────────────────
# CLIENT HELPER
# ─────────────────────────────────────────────────────────────
def _get_client():
    """Returns a configured Groq client."""
    if not _GROQ_AVAILABLE:
        raise RuntimeError(
            "groq package not installed. Run: pip install groq"
        )
    if GROQ_API_KEY == "PASTE_YOUR_GROQ_KEY_HERE":
        raise RuntimeError(
            "Groq API key not set. Edit GROQ_API_KEY in backend/mock_interview.py "
            "or set the GROQ_API_KEY environment variable. "
            "Get a free key at: https://console.groq.com"
        )
    return Groq(api_key=GROQ_API_KEY)


def _call_groq(system_prompt: str, messages: list, max_tokens: int = 500) -> str:
    """Call Groq with full conversation history."""
    client = _get_client()

    groq_messages = [{"role": "system", "content": system_prompt}]
    for m in messages:
        groq_messages.append({"role": m["role"], "content": m["content"]})

    response = client.chat.completions.create(
        model=INTERVIEW_MODEL,
        messages=groq_messages,
        max_tokens=max_tokens,
        temperature=0.8,
    )
    return response.choices[0].message.content.strip()


def _call_groq_once(prompt: str, max_tokens: int = 400) -> str:
    """Single-turn Groq call — for scoring and summary."""
    client = _get_client()
    response = client.chat.completions.create(
        model=SCORING_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────────────────────
# SCORING CALL
# ─────────────────────────────────────────────────────────────
def _score_stage(sess: InterviewSession, stage_name: str) -> dict:
    recent = sess.messages[-min(10, len(sess.messages)):]
    convo_lines = "\n".join(
        f"{'INTERVIEWER' if m['role'] == 'assistant' else 'CANDIDATE'}: {m['content']}"
        for m in recent
    )

    scoring_prompt = f"""You just conducted the '{STAGE_LABELS.get(stage_name, stage_name)}' \
stage of a technical interview for a {sess.role.upper()} role with a {sess.experience} candidate.

CONVERSATION EXCERPT:
{convo_lines}

Score the candidate on these 3 dimensions (each 0–100):
- technical_accuracy: correctness of their technical answers
- communication_clarity: how clearly they explained their thinking
- depth_of_thought: depth, nuance, and completeness of their responses

Reply in valid JSON ONLY — no preamble, no explanation, no markdown fences:
{{"technical_accuracy": <int>, "communication_clarity": <int>, "depth_of_thought": <int>, "brief_comment": "<one sentence>"}}"""

    try:
        raw = _call_groq_once(scoring_prompt, max_tokens=MAX_TOKENS_SCORING)
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[Scoring] Warning: could not parse score for stage '{stage_name}': {e}")
        return {
            "technical_accuracy": 70,
            "communication_clarity": 70,
            "depth_of_thought": 70,
            "brief_comment": "Scoring unavailable for this stage.",
        }


# ─────────────────────────────────────────────────────────────
# SESSION: CREATE
# ─────────────────────────────────────────────────────────────
def create_session(role: str, experience: str, duration_mins: int) -> dict:
    sess = InterviewSession(role, experience, duration_mins)
    SESSIONS[sess.session_id] = sess

    try:
        system = get_system_prompt(
            role, experience, sess.current_stage, sess.time_remaining_secs
        )
        opening_messages = [{"role": "user", "content": "Please begin the interview now."}]
        first_msg = _call_groq(system, opening_messages, max_tokens=MAX_TOKENS_REPLY)
    except Exception as e:
        first_msg = (
            f"Hello! Welcome to your {role.upper()} technical interview. "
            f"I'm your AI interviewer today. Let's dive right in — "
            f"could you start by telling me a bit about yourself and your background?"
        )
        print(f"[MockInterview] Warning on session create: {e}")

    sess.messages.append({"role": "user",      "content": "Please begin the interview now."})
    sess.messages.append({"role": "assistant", "content": first_msg})

    return {
        "session_id":    sess.session_id,
        "first_message": first_msg,
        "stage":         sess.current_stage,
        "stages":        sess.stages,
        "stage_labels":  {s: STAGE_LABELS.get(s, s) for s in sess.stages},
    }


# ─────────────────────────────────────────────────────────────
# SESSION: SEND MESSAGE
# ─────────────────────────────────────────────────────────────
def send_message(session_id: str, user_text: str) -> dict:
    sess = SESSIONS.get(session_id)
    if not sess:
        raise ValueError(f"Session '{session_id}' not found.")
    if sess.ended:
        raise ValueError("Session has already ended.")

    sess.messages.append({"role": "user", "content": user_text})
    sess.exchange_count += 1

    try:
        system = get_system_prompt(
            sess.role, sess.experience,
            sess.current_stage, sess.time_remaining_secs,
        )
        reply = _call_groq(system, sess.messages, max_tokens=MAX_TOKENS_REPLY)
        print(f"[MockInterview] Session {session_id} exchange #{sess.exchange_count} in stage '{sess.current_stage}'")
    except RuntimeError:
        raise
    except Exception as e:
        print(f"[MockInterview] ERROR in send_message: {e}")
        raise RuntimeError(f"Groq API call failed: {e}")

    sess.messages.append({"role": "assistant", "content": reply})

    stage_changed = False
    if sess.should_advance():
        try:
            score = _score_stage(sess, sess.current_stage)
        except Exception:
            score = {"technical_accuracy": 70, "communication_clarity": 70,
                     "depth_of_thought": 70, "brief_comment": "Score unavailable."}
        sess.stage_scores[sess.current_stage] = score

        sess.stage_idx += 1
        sess.exchange_count = 0
        stage_changed = True

    return {
        "reply":             reply,
        "stage":             sess.current_stage,
        "stage_label":       STAGE_LABELS.get(sess.current_stage, sess.current_stage),
        "stage_changed":     stage_changed,
        "exchanges_in_stage": sess.exchange_count,
        "budget_for_stage":  STAGE_EXCHANGE_BUDGET.get(sess.current_stage, 4),
    }


# ─────────────────────────────────────────────────────────────
# SESSION: END + GENERATE REPORT
# ─────────────────────────────────────────────────────────────
def end_session(session_id: str) -> dict:
    sess = SESSIONS.get(session_id)
    if not sess:
        raise ValueError(f"Session '{session_id}' not found.")
    sess.ended = True

    try:
        if sess.current_stage not in sess.stage_scores:
            score = _score_stage(sess, sess.current_stage)
            sess.stage_scores[sess.current_stage] = score

        recent = sess.messages[-min(20, len(sess.messages)):]
        convo_text = "\n".join(
            f"{'INTERVIEWER' if m['role']=='assistant' else 'CANDIDATE'}: {m['content']}"
            for m in recent
        )
        summary_prompt = f"""You just conducted a {sess.role.upper()} technical interview \
for a {sess.experience} candidate over {sess.elapsed_mins} minutes.

CONVERSATION:
{convo_text}

Write 2-3 sentences of honest, constructive feedback for the candidate.
Focus on: one clear strength, one area for improvement, one actionable tip.
Write in natural prose — no bullet points, no headers.
Reply with ONLY the feedback text."""

        summary_text = _call_groq_once(summary_prompt, max_tokens=MAX_TOKENS_SUMMARY)

    except Exception as e:
        summary_text = (
            "Thank you for completing the interview. "
            "Review your stage scores above for detailed feedback on each section. "
            "Keep practicing and you'll improve with every session."
        )
        print(f"[MockInterview] Warning on end_session: {e}")

    all_scores = list(sess.stage_scores.values())
    if all_scores:
        total = sum(
            (s.get("technical_accuracy", 70) +
             s.get("communication_clarity", 70) +
             s.get("depth_of_thought", 70)) / 3
            for s in all_scores
        )
        overall = round(total / len(all_scores))
    else:
        overall = 70

    stage_breakdown = []
    for stage in sess.stages:
        sc = sess.stage_scores.get(stage)
        if sc:
            avg = round((sc["technical_accuracy"] +
                         sc["communication_clarity"] +
                         sc["depth_of_thought"]) / 3)
            status = "Strong" if avg >= 78 else ("Fair" if avg >= 60 else "Needs Work")
            stage_breakdown.append({
                "stage":   stage,
                "label":   STAGE_LABELS.get(stage, stage),
                "score":   avg,
                "status":  status,
                "comment": sc.get("brief_comment", ""),
            })
        else:
            stage_breakdown.append({
                "stage":  stage,
                "label":  STAGE_LABELS.get(stage, stage),
                "score":  None,
                "status": "Not Reached",
                "comment": "",
            })

    return {
        "session_id":      session_id,
        "role":            sess.role,
        "experience":      sess.experience,
        "duration_mins":   sess.elapsed_mins,
        "overall_score":   overall,
        "summary":         summary_text,
        "stage_breakdown": stage_breakdown,
        "transcript": [
            {"role": m["role"], "content": m["content"]}
            for m in sess.messages
        ],
    }


# ─────────────────────────────────────────────────────────────
# SESSION: GET STATE
# ─────────────────────────────────────────────────────────────
def get_session_state(session_id: str) -> dict:
    sess = SESSIONS.get(session_id)
    if not sess:
        raise ValueError(f"Session '{session_id}' not found.")
    return {
        "session_id":          sess.session_id,
        "role":                sess.role,
        "experience":          sess.experience,
        "stage":               sess.current_stage,
        "stage_label":         STAGE_LABELS.get(sess.current_stage, sess.current_stage),
        "stage_idx":           sess.stage_idx,
        "stages":              sess.stages,
        "elapsed_mins":        sess.elapsed_mins,
        "time_remaining_secs": sess.time_remaining_secs,
        "exchange_count":      sess.exchange_count,
        "ended":               sess.ended,
    }
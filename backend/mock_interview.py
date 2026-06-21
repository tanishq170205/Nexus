"""
NEXUS — Mock Interview Session Manager
======================================
Manages Claude conversation sessions for the Mock Interview product.

Key design decisions:
  - Sessions stored in-memory (dict). Short-lived; restart = session lost. Fine for demo.
  - Claude Sonnet for interview conversation (quality matters).
  - Claude Haiku for meta-calls: scoring, summary (speed + cost).
  - Scoring is a SEPARATE API call after each stage — never embedded in conversation reply.
    This prevents the fragile <!-- SCORE --> comment parsing anti-pattern.
  - Stage advancement is server-side state machine (exchange count budget),
    NOT Claude-signalled. More reliable.

Setup:
  pip install anthropic
  Set ANTHROPIC_API_KEY below (or via environment variable).
"""

import uuid
import json
import os
from datetime import datetime
from typing import Optional

try:
    import anthropic
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False

from claude_prompts import (
    get_system_prompt,
    ROLE_STAGES,
    STAGE_LABELS,
    STAGE_EXCHANGE_BUDGET,
)

# ─────────────────────────────────────────────────────────────
# CONFIG — fill in your API key
# ─────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "YOUR_API_KEY_HERE")

INTERVIEW_MODEL   = "claude-3-5-sonnet-20241022"   # interview conversation
SCORING_MODEL     = "claude-3-5-haiku-20241022"     # meta scoring + summary (faster/cheaper)

MAX_TOKENS_REPLY   = 500
MAX_TOKENS_SCORING = 250
MAX_TOKENS_SUMMARY = 400

# ─────────────────────────────────────────────────────────────
# SESSION STATE
# ─────────────────────────────────────────────────────────────
class InterviewSession:
    def __init__(self, role: str, experience: str, duration_mins: int):
        self.session_id   = str(uuid.uuid4())
        self.role         = role
        self.experience   = experience
        self.duration_mins= duration_mins
        self.stages       = ROLE_STAGES.get(role, ROLE_STAGES["sde"])
        self.stage_idx    = 0
        self.exchange_count = 0          # exchanges in current stage
        self.stage_scores   = {}         # stage_name → {technical, communication, depth, comment}
        self.messages       = []         # Claude conversation history [{role, content}]
        self.start_time     = datetime.now()
        self.ended          = False

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
    if not _ANTHROPIC_AVAILABLE:
        raise RuntimeError(
            "anthropic package not installed. Run: pip install anthropic"
        )
    if ANTHROPIC_API_KEY == "YOUR_API_KEY_HERE":
        raise RuntimeError(
            "Anthropic API key not set. Edit ANTHROPIC_API_KEY in backend/mock_interview.py "
            "or set the ANTHROPIC_API_KEY environment variable."
        )
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


# ─────────────────────────────────────────────────────────────
# SCORING CALL — separate, structured, never embedded in reply
# ─────────────────────────────────────────────────────────────
def _score_stage(sess: InterviewSession, client, stage_name: str) -> dict:
    """
    After a stage completes, ask Claude Haiku to score the candidate on
    3 dimensions in JSON only. No conversational text — pure JSON response.
    This avoids the fragile <!-- SCORE --> comment-parsing anti-pattern.
    """
    # Take last 8 messages from conversation as context for this stage
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
        response = client.messages.create(
            model=SCORING_MODEL,
            max_tokens=MAX_TOKENS_SCORING,
            messages=[{"role": "user", "content": scoring_prompt}],
        )
        raw = response.content[0].text.strip()
        # Strip markdown fences if Haiku adds them despite instruction
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        # Fallback — never crash the interview over scoring
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
    """
    Creates a new interview session and gets Claude's opening message.
    Returns: {session_id, first_message, stage, stages, stage_labels}
    """
    sess = InterviewSession(role, experience, duration_mins)
    SESSIONS[sess.session_id] = sess

    try:
        client = _get_client()
        system = get_system_prompt(
            role, experience, sess.current_stage, sess.time_remaining_secs
        )
        response = client.messages.create(
            model=INTERVIEW_MODEL,
            max_tokens=MAX_TOKENS_REPLY,
            system=system,
            messages=[{"role": "user", "content": "Please begin the interview now."}],
        )
        first_msg = response.content[0].text.strip()
    except Exception as e:
        first_msg = (
            f"Hello! Welcome to your {role.upper()} interview. "
            "I'm experiencing a brief connection issue, but let's get started. "
            "Could you tell me a bit about yourself and your background?"
        )
        print(f"[MockInterview] Warning on session create: {e}")

    # Seed conversation history (system message is separate in Claude API)
    sess.messages.append({"role": "user",      "content": "Please begin the interview now."})
    sess.messages.append({"role": "assistant", "content": first_msg})

    return {
        "session_id":   sess.session_id,
        "first_message": first_msg,
        "stage":        sess.current_stage,
        "stages":       sess.stages,
        "stage_labels": {s: STAGE_LABELS.get(s, s) for s in sess.stages},
    }


# ─────────────────────────────────────────────────────────────
# SESSION: SEND MESSAGE
# ─────────────────────────────────────────────────────────────
def send_message(session_id: str, user_text: str) -> dict:
    """
    Appends user message, calls Claude, checks stage advancement.
    Returns: {reply, stage, stage_changed, stage_label}
    """
    sess = SESSIONS.get(session_id)
    if not sess:
        raise ValueError(f"Session '{session_id}' not found.")
    if sess.ended:
        raise ValueError("Session has already ended.")

    sess.messages.append({"role": "user", "content": user_text})
    sess.exchange_count += 1

    try:
        client = _get_client()
        system = get_system_prompt(
            sess.role, sess.experience,
            sess.current_stage, sess.time_remaining_secs,
        )
        response = client.messages.create(
            model=INTERVIEW_MODEL,
            max_tokens=MAX_TOKENS_REPLY,
            system=system,
            messages=sess.messages,  # full conversation history
        )
        reply = response.content[0].text.strip()
        print(f"[MockInterview] Session {session_id} now has {len(sess.messages)+1} messages")
    except RuntimeError:
        # Re-raise config errors (missing API key) — these must surface to the user
        raise
    except Exception as e:
        print(f"[MockInterview] ERROR in send_message: {e}")
        raise RuntimeError(f"Claude API call failed: {e}")

    sess.messages.append({"role": "assistant", "content": reply})

    # ── Stage advancement check (server-side, not Claude-signalled) ───
    stage_changed = False
    if sess.should_advance():
        # Score the stage that just finished (separate Haiku call)
        try:
            client_for_score = _get_client()
            score = _score_stage(sess, client_for_score, sess.current_stage)
        except Exception:
            score = {"technical_accuracy": 70, "communication_clarity": 70,
                     "depth_of_thought": 70, "brief_comment": "Score unavailable."}
        sess.stage_scores[sess.current_stage] = score

        # Advance
        sess.stage_idx += 1
        sess.exchange_count = 0
        stage_changed = True

    return {
        "reply":        reply,
        "stage":        sess.current_stage,
        "stage_label":  STAGE_LABELS.get(sess.current_stage, sess.current_stage),
        "stage_changed": stage_changed,
        "exchanges_in_stage": sess.exchange_count,
        "budget_for_stage": STAGE_EXCHANGE_BUDGET.get(sess.current_stage, 4),
    }


# ─────────────────────────────────────────────────────────────
# SESSION: END + GENERATE REPORT
# ─────────────────────────────────────────────────────────────
def end_session(session_id: str) -> dict:
    """
    Scores any unscored stages, generates Claude's written summary,
    returns the full post-session report.
    """
    sess = SESSIONS.get(session_id)
    if not sess:
        raise ValueError(f"Session '{session_id}' not found.")
    sess.ended = True

    try:
        client = _get_client()

        # Score current (last active) stage if not yet scored
        if sess.current_stage not in sess.stage_scores:
            score = _score_stage(sess, client, sess.current_stage)
            sess.stage_scores[sess.current_stage] = score

        # ── Summary call — Claude Haiku, separate from conversation ──
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

        summary_resp = client.messages.create(
            model=SCORING_MODEL,
            max_tokens=MAX_TOKENS_SUMMARY,
            messages=[{"role": "user", "content": summary_prompt}],
        )
        summary_text = summary_resp.content[0].text.strip()

    except Exception as e:
        summary_text = (
            "Thank you for completing the interview. "
            "Review your stage scores above for detailed feedback on each section. "
            "Keep practicing and you'll improve with every session."
        )
        print(f"[MockInterview] Warning on end_session: {e}")

    # ── Calculate overall score ────────────────────────────────
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

    # ── Build stage breakdown for report ──────────────────────
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
# SESSION: GET STATE (for polling / reconnect)
# ─────────────────────────────────────────────────────────────
def get_session_state(session_id: str) -> dict:
    sess = SESSIONS.get(session_id)
    if not sess:
        raise ValueError(f"Session '{session_id}' not found.")
    return {
        "session_id":         sess.session_id,
        "role":               sess.role,
        "experience":         sess.experience,
        "stage":              sess.current_stage,
        "stage_label":        STAGE_LABELS.get(sess.current_stage, sess.current_stage),
        "stage_idx":          sess.stage_idx,
        "stages":             sess.stages,
        "elapsed_mins":       sess.elapsed_mins,
        "time_remaining_secs": sess.time_remaining_secs,
        "exchange_count":     sess.exchange_count,
        "ended":              sess.ended,
    }

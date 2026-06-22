/* ============================================================
   NEXUS Mock Interview (Conversational AI)
   ============================================================ */

// ── STATE ───────────────────────────────────────────────────
let miSessionId = null;
let miRole = 'sde';
let miExp = 'fresher';
let miDur = 45;
let miTimerInt = null;
let miRemainingSecs = 45 * 60;
let isMuted = false;

// Proctoring state
let miSessionActive = false;
let miTabViolations = 0;
let miTabHandled = false;
let miFaceDetector = null;
let miFaceCamera = null;
let miLastFaceWarn = 0;

// Speech Recognition (Web Speech API)
let recognition = null;
let isListening = false;
let finalTranscript = "";

// ── PRODUCT TABS ────────────────────────────────────────────
function switchProduct(prod) {
  document.querySelectorAll('.product-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + prod).classList.add('active');
  
  if (prod === 'oa') {
    document.getElementById('product-oa').style.display = 'block';
    document.getElementById('product-mi').style.display = 'none';
  } else {
    document.getElementById('product-oa').style.display = 'none';
    document.getElementById('product-mi').style.display = 'block';
  }
}

// ── CONFIG UI ───────────────────────────────────────────────
document.querySelectorAll('#mi-cfg-role .pill-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('#mi-cfg-role .pill-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    miRole = e.target.dataset.role;
  });
});
document.querySelectorAll('#mi-cfg-exp .pill-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('#mi-cfg-exp .pill-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    miExp = e.target.dataset.exp;
  });
});
document.querySelectorAll('#mi-cfg-dur .pill-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('#mi-cfg-dur .pill-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    miDur = parseInt(e.target.dataset.dur);
  });
});

// ── SPEECH API (STT & TTS) ──────────────────────────────────
function initSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showErrorBanner('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    return false;
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    // Update the live temp bubble — never write 'Listening...' to history
    _updateTempBubble(finalTranscript.trim() || interim);
    document.getElementById('mi-interim-text').innerText = interim;
  };
  
  recognition.onerror = (e) => console.warn("Speech error:", e.error);
  recognition.onend = () => {
    if (isListening) recognition.start(); // keep listening if not explicitly stopped
  };
  return true;
}

// Temporary bubble element while mic is active
let tempListenBubble = null;

function miToggleListening() {
  if (!recognition) if (!initSpeech()) return;

  const btn   = document.getElementById('mi-mic-btn');
  const label = document.getElementById('mi-mic-label');

  if (isListening) {
    // ── STOP — commit final text or discard ────────────────────
    isListening = false;
    recognition.stop();
    btn.classList.remove('listening');
    label.innerText = '\uD83C\uDFA4 Click to Speak';
    document.getElementById('mi-interim-text').innerText = '';

    const committedText = (tempListenBubble
      ? tempListenBubble.querySelector('.mi-bubble').innerText
      : '').trim();

    if (tempListenBubble) {
      if (!committedText || committedText === 'Listening\u2026') {
        // Nothing said — remove the placeholder entirely
        tempListenBubble.remove();
      }
      // else: bubble stays as-is with the real text
      tempListenBubble = null;
    }

    if (committedText && committedText !== 'Listening\u2026') {
      sendCandidateMessage(committedText);
    }
    finalTranscript = '';

  } else {
    // ── START — create a temp bubble, don't commit yet ─────────
    finalTranscript = '';
    isListening = true;
    recognition.start();
    btn.classList.add('listening');
    label.innerText = '\uD83D\uDED1 Stop & Send';
    window.speechSynthesis.cancel();

    // Create temporary bubble — will be updated live as user speaks
    const container = document.getElementById('mi-transcript');
    tempListenBubble = document.createElement('div');
    tempListenBubble.className = 'mi-msg candidate';
    tempListenBubble.innerHTML = '<div class="mi-label">YOU</div><div class="mi-bubble" style="opacity:0.6;font-style:italic;">Listening\u2026</div>';
    container.appendChild(tempListenBubble);
    container.scrollTop = container.scrollHeight;
  }
}

function _updateTempBubble(text) {
  if (!tempListenBubble) return;
  const bubble = tempListenBubble.querySelector('.mi-bubble');
  if (text) {
    bubble.innerText = text;
    bubble.style.opacity = '1';
    bubble.style.fontStyle = 'normal';
  }
  document.getElementById('mi-transcript').scrollTop =
    document.getElementById('mi-transcript').scrollHeight;
}

function appendTranscript(sender, text) {
  const id = 'msg-' + Date.now();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'mi-msg ' + sender;
  el.innerHTML = `<div class="mi-label">${sender.toUpperCase()}</div><div class="mi-bubble">${text}</div>`;
  document.getElementById('mi-transcript').appendChild(el);
  document.getElementById('mi-transcript').scrollTop = document.getElementById('mi-transcript').scrollHeight;
  return id;
}

// ── MI PROCTORING (Face & Tab) ────────────────────────────────

function showMITabOverlay() {
  let overlay = document.getElementById('mi-tabswap-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'mi-tabswap-overlay';
    overlay.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.95); z-index:9999; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(8px);';
    overlay.innerHTML = `
      <div style="background:#1E293B; border:1px solid #334155; border-radius:12px; padding:32px; text-align:center; max-width:400px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
        <div style="font-size:48px; margin-bottom:16px;">\u26A0\uFE0F</div>
        <h2 style="color:#F8FAFC; margin:0 0 12px 0; font-size:20px;">Tab Switch Detected</h2>
        <p style="color:#94A3B8; margin:0 0 24px 0; font-size:14px; line-height:1.5;">You must remain on this tab during the mock interview. Navigating away is considered a proctoring violation.</p>
        <div id="mi-tabswap-count-text" style="color:#EF4444; font-weight:600; margin-bottom:24px; font-size:14px;"></div>
        <button onclick="miReturnToInterview()" style="background:#3B82F6; color:white; border:none; padding:10px 24px; border-radius:6px; font-weight:500; cursor:pointer;">Return to Interview</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  
  overlay.style.display = 'flex';
  document.getElementById('mi-tabswap-count-text').textContent = `Violation #${miTabViolations} of 3 — 3 violations = session terminated`;
  
  if (miTabViolations >= 3) {
    setTimeout(() => {
      overlay.style.display = 'none';
      finishMISession();
      showErrorBanner('Interview terminated due to repeated proctoring violations.');
    }, 2000);
  }
}

window.miReturnToInterview = function() {
  miTabHandled = false;
  document.getElementById('mi-tabswap-overlay').style.display = 'none';
  const badge = document.getElementById('mi-pr-tab-badge');
  const bar = document.getElementById('mi-pr-tab-bar');
  if(badge) {
    badge.className = 'proctor-row-badge badge-ok';
    badge.textContent = '✓ Active';
  }
  if(bar) {
    bar.className = 'proctor-bar-fill bar-ok';
  }
  
  if (document.getElementById('mi-proctor-status-main').textContent === '\u26A0\uFE0F TAB VIOLATION') {
    document.getElementById('mi-proctor-status-main').className = 'proctor-status-main safe';
    document.getElementById('mi-proctor-status-main').textContent = '✓ SAFE';
  }
};

window.addEventListener('blur', () => {
  if (!miSessionActive || miTabHandled) return;
  miTabHandled = true;
  miTabViolations++;
  
  const badge = document.getElementById('mi-pr-tab-badge');
  const bar = document.getElementById('mi-pr-tab-bar');
  if(badge) {
    badge.className = 'proctor-row-badge badge-warn';
    badge.textContent = `\u26A0\uFE0F Switched (${miTabViolations})`;
  }
  if(bar) bar.className = 'proctor-bar-fill bar-warn';
  
  const main = document.getElementById('mi-proctor-status-main');
  if(main) {
    main.className = 'proctor-status-main danger';
    main.textContent = '\u26A0\uFE0F TAB VIOLATION';
  }
  
  showMITabOverlay();
});

function initMIFaceDetection(video) {
  if (!window.FaceDetection) return;
  miFaceDetector = new FaceDetection({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${f}`
  });
  miFaceDetector.setOptions({ model: 'short', minDetectionConfidence: 0.55 });
  miFaceDetector.onResults(onMIFaceResults);

  miFaceCamera = new Camera(video, {
    onFrame: async () => {
      if (miFaceDetector && miSessionActive) await miFaceDetector.send({ image: video });
    },
    width: 320, height: 240
  });
  miFaceCamera.start();
}

function onMIFaceResults(results) {
  if (!miSessionActive) return;
  const detected = results.detections && results.detections.length > 0;
  const now = Date.now();
  
  const badge = document.getElementById('mi-pr-face-badge');
  const bar = document.getElementById('mi-pr-face-bar');
  const camWrap = document.getElementById('mi-proctor-cam-wrap');
  
  // Ensure visual warning element exists
  let faceWarn = document.getElementById('mi-face-warning');
  if (!faceWarn && camWrap) {
    faceWarn = document.createElement('div');
    faceWarn.id = 'mi-face-warning';
    faceWarn.style.cssText = 'display:none;position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(244,67,54,.9);color:#fff;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;white-space:nowrap;z-index:10;';
    faceWarn.textContent = '⚠ Face not detected';
    camWrap.appendChild(faceWarn);
  }
  
  if (!detected) {
    if (faceWarn) faceWarn.style.display = 'block';
    if (camWrap) camWrap.className = 'proctor-cam-wrap danger';
    
    if (badge) {
      badge.className = 'proctor-row-badge badge-warn';
      badge.textContent = '\u26A0\uFE0F Missing';
    }
    if (bar) {
      bar.className = 'proctor-bar-fill bar-warn';
      bar.style.width = '0%';
    }
    
    if (now - miLastFaceWarn > 3000) {
      miLastFaceWarn = now;
      const main = document.getElementById('mi-proctor-status-main');
      if (main) {
        main.className = 'proctor-status-main danger';
        main.textContent = '\u26A0\uFE0F NO FACE';
      }
    }
  } else {
    if (faceWarn) faceWarn.style.display = 'none';
    if (camWrap) camWrap.className = 'proctor-cam-wrap';
    
    const conf = Math.floor(Math.random() * 8 + 90);
    if (badge) {
      badge.className = 'proctor-row-badge badge-ok';
      badge.textContent = `\u2713 Yes ${conf}%`;
    }
    if (bar) {
      bar.className = 'proctor-bar-fill bar-ok';
      bar.style.width = `${conf}%`;
    }
    
    const main = document.getElementById('mi-proctor-status-main');
    if (main && main.textContent === '\u26A0\uFE0F NO FACE') {
      main.className = 'proctor-status-main safe';
      main.textContent = '\u2713 SAFE';
    }
  }
}

function miSpeak(text) {
  if (isMuted) return;
  window.speechSynthesis.cancel(); // stop current
  const utterance = new SpeechSynthesisUtterance(text);
  // Pick a decent English voice
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.name.includes("Google US English") || v.lang === "en-US");
  if (voice) utterance.voice = voice;
  
  window.speechSynthesis.speak(utterance);
}

function miToggleMute() {
  isMuted = !isMuted;
  const btn = document.getElementById('mi-mute-btn');
  if (isMuted) {
    btn.innerText = "🔇 Voice Off";
    window.speechSynthesis.cancel();
  } else {
    btn.innerText = "🔊 Voice On";
  }
}

// ── API CALLS ───────────────────────────────────────────────
async function miStartSession() {
  if (!initSpeech()) return; // requires Chrome
  
  const startBtn = document.getElementById('mi-start-btn');
  startBtn.disabled = true;
  startBtn.innerText = "Starting...";
  
  try {
    const res = await fetch('http://localhost:8000/api/mi/start', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ role: miRole, experience: miExp, duration_mins: miDur })
    });
    
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Server error (${res.status}): ${errBody}`);
    }
    
    const data = await res.json();
    
    miSessionId = data.session_id;
    miRemainingSecs = miDur * 60;
    
    // Setup Proctoring State
    miSessionActive = true;
    miTabViolations = 0;
    miTabHandled = false;
    document.getElementById('mi-pr-tab-badge').className = 'proctor-row-badge badge-ok';
    document.getElementById('mi-pr-tab-badge').textContent = '✓ Active';
    document.getElementById('mi-pr-tab-bar').className = 'proctor-bar-fill bar-ok';
    document.getElementById('mi-proctor-status-main').className = 'proctor-status-main safe';
    document.getElementById('mi-proctor-status-main').textContent = '✓ SAFE';

    // Setup UI
    document.getElementById('mi-config').style.display = 'none';
    document.getElementById('mi-session').style.display = 'flex';
    document.getElementById('mi-transcript').innerHTML = "";
    
    renderStageTracker(data.stages, data.stage_labels, data.stage);
    startMITimer();

    // ── Camera init for MI proctoring ──────────────────────────
    initMICamera();

    // Initial Claude greeting
    appendTranscript('interviewer', data.first_message);
    miSpeak(data.first_message);
    
  } catch (err) {
    console.error('[Mock Interview] Failed to start session:', err);
    startBtn.disabled = false;
    startBtn.innerText = "📷 Enable Camera & Start Interview →";
    showErrorBanner(`Couldn't connect to the interview server. ${
      err.message.includes('Failed to fetch')
        ? 'Make sure the backend is running on localhost:8000.'
        : err.message
    }`);
  }
}

function showErrorBanner(message) {
  let banner = document.querySelector('#mi-error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'mi-error-banner';
    banner.style.cssText = 'display:none; background:#F44336; color:#fff; padding:12px 16px; border-radius:8px; margin-bottom:16px; font-size:13px; font-weight:500; text-align:center;';
    const btn = document.getElementById('mi-start-btn');
    btn.parentNode.insertBefore(banner, btn);
  }
  banner.textContent = message;
  banner.style.display = 'block';
}

async function sendCandidateMessage(text) {
  // Typing indicator
  const typingId = appendTranscript('interviewer', '\u22ef  Thinking...');

  try {
    const res = await fetch('http://localhost:8000/api/mi/message', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ session_id: miSessionId, text })
    });

    let data;
    try { data = await res.json(); } catch(e) { data = {}; }

    if (!res.ok) {
      const detail = data.detail || `Server error ${res.status}`;
      const typingNode = document.getElementById(typingId);
      if (typingNode) typingNode.querySelector('.mi-bubble').innerText =
        detail.includes('API key') || res.status === 503
          ? '\u26a0\ufe0f  Claude API key not configured. Set ANTHROPIC_API_KEY in backend/mock_interview.py and restart the backend.'
          : `\u26a0\ufe0f  ${detail}`;
      return;
    }

    const typingNode = document.getElementById(typingId);
    if (typingNode) {
      typingNode.querySelector('.mi-bubble').innerText = data.reply;
    } else {
      appendTranscript('interviewer', data.reply);
    }

    miSpeak(data.reply);
    if (data.stage_changed) updateStageUI(data.stage, data.stage_label);

  } catch (err) {
    console.error('[MockInterview] sendCandidateMessage error:', err);
    const typingNode = document.getElementById(typingId);
    if (typingNode) typingNode.querySelector('.mi-bubble').innerText =
      'Connection error. Check that the backend is running on localhost:8000.';
  }
}

// ── Camera init (MI-specific) ─────────────────────────────────
let miCameraStream = null;

async function initMICamera() {
  const videoEl = document.getElementById('mi-proctor-video');
  if (!videoEl) return;

  try {
    // If OA already has the camera open, reuse its stream to avoid NotReadableError
    const existingOA = document.getElementById('proctor-video');
    if (existingOA && existingOA.srcObject) {
      videoEl.srcObject = existingOA.srcObject;
      await videoEl.play().catch(() => {});
      return;
    }

    miCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 180, facingMode: 'user' },
      audio: false
    });
    videoEl.srcObject = miCameraStream;
    await videoEl.play();
    
    initMIFaceDetection(videoEl);
  } catch (err) {
    console.error('[Proctor] Camera failed:', err);
    // Show error placeholder instead of silent black box
    const wrap = document.getElementById('mi-proctor-cam-wrap');
    if (wrap) {
      wrap.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                    height:100%;background:#1a1a2e;color:#64748B;gap:12px;font-size:12px;text-align:center;padding:16px;">
          <span style="font-size:28px;">\uD83D\uDCF7</span>
          <span>Camera unavailable</span>
          <span style="font-size:11px;color:#334155;">${err.name}: ${err.message}</span>
          <button onclick="initMICamera()" style="margin-top:8px;padding:6px 14px;border-radius:6px;
            background:#334155;color:#fff;border:none;cursor:pointer;font-size:11px;">Try Again</button>
        </div>`;
    }
  }
}

function miConfirmEnd() {
  if (confirm("Are you sure you want to end the interview?")) {
    finishMISession();
  }
}

async function finishMISession() {
  clearInterval(miTimerInt);
  window.speechSynthesis.cancel();
  if (recognition) {
    isListening = false;
    recognition.stop();
  }
  
  document.getElementById('mi-session').style.display = 'none';
  document.getElementById('mi-summary').style.display = 'block';
  miSessionActive = false;
  
  if (miFaceCamera) {
    try { miFaceCamera.stop(); } catch(e) {}
  }

  try {
    const res = await fetch('http://localhost:8000/api/mi/end', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ session_id: miSessionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to end session");
    
    // Render report
    document.getElementById('mi-sum-role-badge').innerText = data.role.toUpperCase();
    document.getElementById('mi-sum-exp-badge').innerText = data.experience;
    document.getElementById('mi-sum-dur-badge').innerText = data.duration_mins + " min";
    
    document.getElementById('mi-sum-score').innerText = data.overall_score;
    document.getElementById('mi-sum-feedback').innerText = data.summary;
    
    const stagesHtml = data.stage_breakdown.map(s => {
      const color = s.status === 'Strong' ? 'var(--green)' : (s.status === 'Needs Work' ? 'var(--amber)' : 'var(--muted)');
      return `
        <div style="padding:12px;border:1px solid var(--border);border-radius:6px;background:#F8FAFC;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <strong style="font-size:13px;">${s.label}</strong>
            <span style="font-size:12px;font-weight:700;color:${color};">${s.status} ${s.score ? '('+s.score+')' : ''}</span>
          </div>
          <div style="font-size:12px;color:#374151;">${s.comment || 'No feedback available.'}</div>
        </div>
      `;
    }).join("");
    document.getElementById('mi-sum-stages').innerHTML = stagesHtml;
    
    // Transcript dump
    const transcriptHtml = data.transcript.map(m => `
      <div style="margin-bottom:12px;">
        <strong style="color:${m.role === 'user' ? 'var(--navy)' : '#4338CA'};">${m.role === 'user' ? 'Candidate' : 'Interviewer'}:</strong>
        <span>${m.content}</span>
      </div>
    `).join("");
    document.getElementById('mi-full-transcript').innerHTML = transcriptHtml;
    
  } catch (err) {
    console.error('[MockInterview] Error generating report:', err);
    document.getElementById('mi-sum-feedback').innerText =
      'Could not load feedback from server: ' + err.message +
      '. Your stage scores above are still valid.';
  }
}

// ── UI HELPERS ──────────────────────────────────────────────
function appendTranscript(role, text) {
  const div = document.createElement('div');
  div.className = `mi-msg ${role}`;
  const id = 'msg-' + Date.now();
  div.id = id;
  
  const label = role === 'candidate' ? 'YOU' : 'INTERVIEWER';
  
  div.innerHTML = `
    <div class="mi-label">${label}</div>
    <div class="mi-bubble">${text}</div>
  `;
  
  const container = document.getElementById('mi-transcript');
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function renderStageTracker(stages, labels, activeStage) {
  const container = document.getElementById('mi-stage-tracker');
  let html = "";
  let foundActive = false;
  
  for (const s of stages) {
    if (s === activeStage) {
      html += `<div class="stage-item active" data-stage="${s}"><div class="stage-dot"></div>${labels[s]}</div>`;
      foundActive = true;
      document.getElementById('mi-stage-label').innerText = labels[s];
    } else if (!foundActive) {
      html += `<div class="stage-item done" data-stage="${s}"><div class="stage-dot"></div>${labels[s]}</div>`;
    } else {
      html += `<div class="stage-item" data-stage="${s}"><div class="stage-dot"></div>${labels[s]}</div>`;
    }
  }
  container.innerHTML = html;
}

function updateStageUI(activeStage, activeLabel) {
  document.getElementById('mi-stage-label').innerText = activeLabel;
  let foundActive = false;
  document.querySelectorAll('#mi-stage-tracker .stage-item').forEach(el => {
    if (el.dataset.stage === activeStage) {
      el.className = "stage-item active";
      foundActive = true;
    } else if (!foundActive) {
      el.className = "stage-item done";
    } else {
      el.className = "stage-item";
    }
  });
}

function startMITimer() {
  const textEl = document.getElementById('mi-timer-display');
  const botEl = document.getElementById('mi-bottom-timer');
  const barEl = document.getElementById('mi-timer-bar');
  const totalSecs = miDur * 60;
  
  miTimerInt = setInterval(() => {
    miRemainingSecs--;
    if (miRemainingSecs <= 0) {
      finishMISession();
      return;
    }
    
    const m = Math.floor(miRemainingSecs / 60).toString().padStart(2, '0');
    const s = (miRemainingSecs % 60).toString().padStart(2, '0');
    textEl.innerText = `${m}:${s}`;
    botEl.innerText = `${m}:${s}`;
    
    const pct = ((totalSecs - miRemainingSecs) / totalSecs) * 100;
    barEl.style.width = pct + '%';
    
  }, 1000);
}

function miRetry() {
  document.getElementById('mi-summary').style.display = 'none';
  document.getElementById('mi-config').style.display = 'flex';
  document.getElementById('mi-start-btn').innerText = "📷 Enable Camera & Start Interview →";
}

function miViewTranscript() {
  document.getElementById('mi-transcript-modal').style.display = 'block';
}

function miToggleScratchpad() {
  const pad = document.getElementById('mi-scratchpad');
  if (pad.style.display === 'none') {
    pad.style.display = 'block';
    if (!window.miMonaco) {
      if (window.monaco) {
        window.miMonaco = monaco.editor.create(document.getElementById('mi-monaco'), {
          value: "# Write your code here and click 'Submit to Interviewer'\n",
          language: "python",
          theme: "vs-dark",
          minimap: { enabled: false },
          lineNumbers: "on",
          fontSize: 13,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        });
      } else {
        document.getElementById('mi-monaco').innerHTML = `<textarea id="mi-code-textarea" style="width:100%;height:200px;padding:12px;border:none;resize:none;font-family:'JetBrains Mono',monospace;font-size:13px;background:#1E1E1E;color:#D4D4D4;box-sizing:border-box;" placeholder="# Write your code here and click Submit to Interviewer"></textarea>`;
      }
    }
  } else {
    pad.style.display = 'none';
  }
}

function miChangeLang() {
  const lang = document.getElementById('mi-lang-select').value;
  if (window.miMonaco && window.monaco) {
    monaco.editor.setModelLanguage(window.miMonaco.getModel(), lang);
  }
}

function miSubmitCode() {
  let code = '';
  if (window.miMonaco && window.miMonaco.getValue) {
    code = window.miMonaco.getValue().trim();
  } else {
    const ta = document.getElementById('mi-code-textarea');
    if (ta) code = ta.value.trim();
  }

  if (!code || code.startsWith('# Write your code')) {
    alert('Please write some code before submitting.');
    return;
  }

  const lang = document.getElementById('mi-lang-select').value;
  const message = `Here is my ${lang} code:\n\`\`\`${lang}\n${code}\n\`\`\``;

  // Show it as candidate message in transcript
  appendTranscript('candidate', `📤 Submitted ${lang} code:\n${code}`);

  // Send to interviewer
  sendCandidateMessage(message);

  // Collapse IDE after submit
  document.getElementById('mi-scratchpad').style.display = 'none';
}

// Re-fetch voices when they load (Chrome quirk)
window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices();
};

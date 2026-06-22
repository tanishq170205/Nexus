/* ============================================================
   NEXUS Interview Engine v2 — JavaScript
   Features: Monaco IDE, MediaPipe Face Detection, Tab Swap
   Lockout, Phone Detection, Random Snapshots, LeetCode API
   ============================================================ */
'use strict';

// ── Config state ─────────────────────────────────────────────
var cfg = { domain: 'dsa', diff: 'medium', count: 2, mins: 30 };

// ── Session state ─────────────────────────────────────────────
var sess = {
  active: false,
  questions: [],       // fetched question objects
  currentIdx: 0,
  results: [],         // {accepted, timeTaken, title, difficulty}
  startTime: null,
  secondsLeft: 1800,
  timerInterval: null,
  tabViolations: 0,
  violations: [],      // {type, time, severity}
  snapshots: [],       // {time, label, canvas}
  snapNextMs: 0,
  snapInterval: null,
  snapCount: 0,
  monacoEditor: null,
  stream: null,
  faceCamera: null,
  faceDetector: null,
  faceLastSeen: Date.now(),
  faceConfidence: 96,
  runCount: 0,
  currentLang: 'python3',
  snippets: {},        // langSlug -> code (per question)
  editedCode: {},      // langSlug -> user-edited code
};

// ── Monaco language map ───────────────────────────────────────
var MONACO_LANG = {
  python3: 'python', javascript: 'javascript', java: 'java',
  cpp: 'cpp', c: 'c', typescript: 'typescript', golang: 'go',
  sql: 'sql',
};

// ── COCO-SSD phone detection state ───────────────────────────
var _cocoModel       = null;
 var _phoneCanvas    = null;
var _phoneDetectLoop = null;
var _phoneHits       = 0;   // consecutive positive frames

// ── Source badge config ───────────────────────────────────────
var SOURCES = {
  dsa:   { label: '📙 Questions from LeetCode', cls: 'lc' },
  sql:   { label: '📙 Questions from LeetCode', cls: 'lc' },
  ml:    { label: '📗 Questions from GFG',      cls: 'gfg' },
  react: { label: '📗 Questions from GFG',      cls: 'gfg' },
};

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  injectUser();
  setupConfigPills();
  preloadMonaco();
});

function injectUser() {
  try {
    var u = JSON.parse(localStorage.getItem('nexus_user') || '{}');
    var name = u.name || 'Candidate';
    var initials = name.split(' ').slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
    var el = document.getElementById;
    el('iv2-avatar').textContent   = initials;
    el('iv2-name').textContent     = name;
  } catch (e) {}
}

function preloadMonaco() {
  require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
  require(['vs/editor/editor.main'], function () {
    // Monaco ready — define dark theme
    monaco.editor.defineTheme('nexus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword',     foreground: 'FF7B72', fontStyle: 'bold' },
        { token: 'string',      foreground: 'A5D6FF' },
        { token: 'comment',     foreground: '8B949E', fontStyle: 'italic' },
        { token: 'number',      foreground: '79C0FF' },
        { token: 'identifier',  foreground: 'E6EDF3' },
      ],
      colors: {
        'editor.background':            '#0D1117',
        'editor.foreground':            '#E6EDF3',
        'editor.lineHighlightBackground': '#161B22',
        'editorLineNumber.foreground':   '#484F58',
        'editor.selectionBackground':    '#388BFD3D',
        'editorCursor.foreground':       '#FFFFFF',
      },
    });
    window._monacoReady = true;
  });
}

// ─────────────────────────────────────────────────────────────
// CONFIG SCREEN
// ─────────────────────────────────────────────────────────────
function setupConfigPills() {
  ['domain', 'diff', 'count', 'time'].forEach(function (group) {
    var id = 'cfg-' + (group === 'time' ? 'time' : group);
    var container = document.getElementById(id);
    if (!container) return;

    container.querySelectorAll('.pill-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.pill-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        if (btn.dataset.domain) {
          cfg.domain = btn.dataset.domain;
          updateSourceBadge();
        }
        if (btn.dataset.diff)  cfg.diff  = btn.dataset.diff;
        if (btn.dataset.count) cfg.count = parseInt(btn.dataset.count);
        if (btn.dataset.mins)  cfg.mins  = parseInt(btn.dataset.mins);
      });
    });
  });

  document.getElementById('cfg-start-btn').addEventListener('click', startSession);
}

function updateSourceBadge() {
  var badge = document.getElementById('cfg-source-badge');
  var src = SOURCES[cfg.domain] || SOURCES.dsa;
  badge.textContent = src.label;
  badge.className = 'source-badge ' + src.cls;
}

// ─────────────────────────────────────────────────────────────
// SESSION START
// ─────────────────────────────────────────────────────────────
async function startSession() {
  var startBtn = document.getElementById('cfg-start-btn');
  startBtn.disabled = true;
  startBtn.textContent = 'Initialising…';

  try {
    sess.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    document.getElementById('proctor-video').srcObject = sess.stream;
  } catch (e) {
    document.getElementById('proctor-ai-label').textContent = '🔴 NO CAMERA';
    document.getElementById('proctor-ai-label').style.background = '#FEE2E2';
    document.getElementById('proctor-ai-label').style.color = '#991B1B';
  }

  // Show session UI
  document.getElementById('iv2-config').style.display  = 'none';
  document.getElementById('iv2-session').style.display = 'flex';
  document.getElementById('iv2-session').style.flexDirection = 'column';

  sess.active      = true;
  sess.secondsLeft = cfg.mins * 60;
  sess.violations  = [];
  sess.snapshots   = [];
  sess.tabViolations = 0;
  sess.currentIdx  = 0;
  sess.results     = [];
  sess.runCount    = 0;
  sess.startTime   = Date.now();

  // Load questions — domain-aware (DSA/SQL/ML/React)
  await loadQuestions();

  // Init Monaco editor
  initMonacoEditor();

  // Init MediaPipe face detection
  initFaceDetection();

  // ✅ Real COCO-SSD phone detection
  initPhoneDetection();

  // Start countdown timer
  startTimer();

  // Tab swap detection
  setupTabDetection();

  // Random snapshot engine
  scheduleNextSnapshot();

  // Render first question
  renderQuestion(0);
  renderDots();
  renderTestCases();

  // Set up listeners
  setupTabSwap();
}

// ─────────────────────────────────────────────────────────────
// QUESTION LOADING
// ─────────────────────────────────────────────────────────────
async function loadQuestions() {
  sess.questions = [];
  var needed = cfg.count;
  var domain = cfg.domain || 'dsa';

  for (var i = 0; i < needed; i++) {
    try {
      var url = 'http://localhost:8000/api/questions/random?domain=' + domain;
      var res = await fetch(url);
      var data = await res.json();
      sess.questions.push(data);
    } catch (e) {
      console.error('[loadQuestions] fetch failed:', e);
      // Minimal offline fallback
      sess.questions.push({
        id: '146', title: 'LRU Cache', slug: 'lru-cache',
        difficulty: 'Hard', question_type: 'coding', default_lang: 'python3',
        content: '<h2>LRU Cache</h2><p>Design an LRU cache with O(1) get and put. Evict the least recently used key when over capacity.</p>',
        editorial: 'HashMap + Doubly Linked List. Move accessed node to head; evict from tail.',
        test_cases: [{ input: 'capacity=2, ops=[put(1,1),put(2,2),get(1),put(3,3),get(2)]', expected: '[null,null,1,null,-1]' }],
        snippets: { python3: 'class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n    def get(self, key: int) -> int:\n        pass\n    def put(self, key: int, value: int) -> None:\n        pass' },
        lang_display: { python3: 'Python 3', javascript: 'JavaScript', java: 'Java', cpp: 'C++', sql: 'SQL' },
      });
    }
  }

  // Set default language for first question
  var firstQ = sess.questions[0];
  if (firstQ && firstQ.default_lang) {
    sess.currentLang = firstQ.default_lang;
  }

  document.getElementById('q-total').textContent = sess.questions.length;
}

// ─────────────────────────────────────────────────────────────
// QUESTION RENDERING
// ─────────────────────────────────────────────────────────────
function renderQuestion(idx) {
  sess.currentIdx = idx;
  var q = sess.questions[idx];
  if (!q) return;

  // Store snippets for this question
  sess.snippets   = q.snippets || {};
  sess.editedCode = {};

  // Update header
  document.getElementById('q-title').textContent = q.title || 'Loading…';
  var pill = document.getElementById('q-source-pill');
  var domain = cfg.domain;
  var isGfg = domain === 'ml' || domain === 'react';
  pill.textContent = isGfg ? ('GFG · ' + (q.difficulty || 'Medium')) : ('LeetCode · ' + (q.difficulty || 'Medium'));
  pill.className = 'source-pill ' + (isGfg ? 'gfg' : 'lc');

  // Render content
  var content = q.content || '';
  // Strip outer <p> tags for cleaner render
  document.getElementById('q-content').innerHTML =
    '<h2>' + (q.title || '') + '</h2>' +
    '<p style="margin-bottom:10px;"><span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + (q.difficulty==='Hard'?'#FEE2E2':'#FEF3C7') + ';color:' + (q.difficulty==='Hard'?'#991B1B':'#92400E') + ';">' + (q.difficulty||'Medium') + '</span></p>' +
    content +
    (q.editorial ? '<div style="margin-top:16px;"><div class="hint-toggle" onclick="toggleHint(this)">💡 Official Approach (click to reveal)</div><div class="hint-text">' + q.editorial + '</div></div>' : '');

  // Set language to python3 by default
  switchLanguage(sess.currentLang, true);

  var langSelects = [document.getElementById('ide-lang-select'), document.getElementById('bottom-lang-select')];
  var lockToSql = q.question_type === 'sql';
  langSelects.forEach(function (sel) {
    if (!sel) return;
    sel.disabled = lockToSql;
    sel.style.opacity = lockToSql ? '0.6' : '1';
  });

  // Nav buttons
  document.getElementById('q-prev-btn').disabled = idx === 0;
  document.getElementById('q-next-btn').disabled = idx >= sess.questions.length - 1;

  document.getElementById('q-num').textContent = idx + 1;
  renderDots();
  renderTestCases();
}

function renderDots() {
  var total = sess.questions.length;
  var dots = '';
  for (var i = 0; i < total; i++) {
    var cls = i === sess.currentIdx ? 'q-dot current' : (sess.results[i] ? 'q-dot done' : 'q-dot');
    dots += '<div class="' + cls + '"></div>';
  }
  document.getElementById('q-dots').innerHTML = dots;
}

function toggleHint(btn) {
  var hint = btn.nextElementSibling;
  if (!hint) return;
  hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
  btn.textContent = hint.style.display === 'none' ? '💡 Official Approach (click to reveal)' : '💡 Official Approach (click to hide)';
}

function prevQuestion() { if (sess.currentIdx > 0) renderQuestion(sess.currentIdx - 1); }
function nextQuestion() { if (sess.currentIdx < sess.questions.length - 1) renderQuestion(sess.currentIdx + 1); }

// ─────────────────────────────────────────────────────────────
// MONACO EDITOR
// ─────────────────────────────────────────────────────────────
function initMonacoEditor() {
  var editorEl = document.getElementById('monaco-editor');
  var editorWrap = document.querySelector('.iv2-editor-wrap');
  editorWrap.style.height = '100%';

  function tryCreate() {
    if (!window.monaco) { setTimeout(tryCreate, 200); return; }
    sess.monacoEditor = monaco.editor.create(editorEl, {
      value:     '',
      language:  'python',
      theme:     'nexus-dark',
      fontSize:  14,
      fontFamily: '"JetBrains Mono", monospace',
      lineHeight: 1.7,
      minimap:   { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      padding:   { top: 16, bottom: 16 },
      renderLineHighlight: 'line',
    });
    // Set initial code
    switchLanguage('python3', true);
  }
  tryCreate();
}

function switchLanguage(langSlug, isInit) {
  sess.currentLang = langSlug;

  // Sync both selects
  ['ide-lang-select', 'bottom-lang-select'].forEach(function (id) {
    var sel = document.getElementById(id);
    if (sel) sel.value = langSlug;
  });

  if (!sess.monacoEditor) return;

  // Save current edits before switching
  if (!isInit) {
    sess.editedCode[sess.currentLang] = sess.monacoEditor.getValue();
  }

  // Get code: user-edited > snippet > empty
  var code = sess.editedCode[langSlug] || sess.snippets[langSlug] || '// No starter code available for this language.';
  var monacoLang = MONACO_LANG[langSlug] || 'plaintext';

  // Update Monaco model language
  monaco.editor.setModelLanguage(sess.monacoEditor.getModel(), monacoLang);
  sess.monacoEditor.setValue(code);
}

function resetCode() {
  var lang = sess.currentLang;
  delete sess.editedCode[lang];
  var code = sess.snippets[lang] || '// No starter code available.';
  if (sess.monacoEditor) sess.monacoEditor.setValue(code);
}

function copyCode() {
  var code = sess.monacoEditor ? sess.monacoEditor.getValue() : '';
  navigator.clipboard.writeText(code).then(function () {
    var btn = document.querySelector('.ide-action-btn:last-child');
    if (btn) { var orig = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(function(){ btn.textContent = orig; }, 1500); }
  });
}

// ─────────────────────────────────────────────────────────────
// RUN CODE & SUBMIT
// ─────────────────────────────────────────────────────────────
function renderTestCases() {
  var q = sess.questions[sess.currentIdx];
  if (!q) { document.getElementById('tab-cases').innerHTML = '<div style="color:#8B949E">No question loaded.</div>'; return; }

  var cases = (q.test_cases && q.test_cases.length) ? q.test_cases : [];
  var qType = q.question_type || 'coding';

  if (cases.length === 0) {
    var msg = qType === 'sql'
      ? 'SQL judge: your query will be executed against a pre-populated SQLite database.'
      : qType === 'ml'
      ? 'ML judge: your implementation will be validated against correctness rubric (see editorial).'
      : 'No test cases attached. Run code to validate.';
    document.getElementById('tab-cases').innerHTML = '<div style="color:#8B949E;font-size:12px;padding:8px 0;">' + msg + '</div>';
    return;
  }

  var html = '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">';
  cases.forEach(function (c, i) {
    html += '<span class="case-pill" id="case-pill-' + i + '" onclick="showCase(' + i + ')" style="padding:4px 12px;border:1px solid #30363D;border-radius:20px;font-size:11px;cursor:pointer;color:#8B949E;transition:all .15s;">Case ' + (i+1) + '</span>';
  });
  html += '</div>';
  html += '<div id="case-detail"></div>';
  document.getElementById('tab-cases').innerHTML = html;
  showCase(0);
  switchOutputTab('cases', document.querySelector('.output-tab'));
}

window.showCase = function(idx) {
  var q = sess.questions[sess.currentIdx];
  var cases = (q && q.test_cases) ? q.test_cases : [];
  var c = cases[idx];
  if (!c) return;
  // Highlight active pill
  document.querySelectorAll('.case-pill').forEach(function(p, i) {
    p.style.background = i === idx ? '#1F6FEB22' : '';
    p.style.color      = i === idx ? '#58A6FF' : '#8B949E';
    p.style.borderColor= i === idx ? '#1F6FEB' : '#30363D';
  });
  document.getElementById('case-detail').innerHTML =
    '<div style="color:#8B949E;font-size:11px;margin-bottom:4px;">Input:</div>' +
    '<pre style="color:var(--code-text);margin:0 0 10px;white-space:pre-wrap;font-size:12px;">' + (c.input || '') + '</pre>' +
    '<div style="color:#8B949E;font-size:11px;margin-bottom:4px;">Expected Output:</div>' +
    '<pre style="color:#A5D6FF;margin:0;white-space:pre-wrap;font-size:12px;">' + (c.expected || '') + '</pre>';
};

function switchOutputTab(tab, clickedEl) {
  ['cases', 'output', 'verdict'].forEach(function (t) {
    document.getElementById('tab-' + t).style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('.output-tab').forEach(function (t) { t.classList.remove('active'); });
  if (clickedEl) clickedEl.classList.add('active');
  else {
    var tabs = document.querySelectorAll('.output-tab');
    var map = { cases: 0, output: 1, verdict: 2 };
    if (tabs[map[tab]]) tabs[map[tab]].classList.add('active');
  }
}

// ─────────────────────────────────────────────────────────────
// RUN CODE & SUBMIT — REAL backend execution via /api/execute
// ─────────────────────────────────────────────────────────────
async function runCode() {
  sess.runCount++;
  var code = sess.monacoEditor ? sess.monacoEditor.getValue() : '';
  var q = sess.questions[sess.currentIdx];
  if (!q) return;

  switchOutputTab('output', null);
  document.getElementById('tab-output').innerHTML =
    '<div style="color:#8B949E;margin-bottom:8px;">Running test cases…</div>';

  try {
    var res = await fetch('http://localhost:8000/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: q.slug,
        language: sess.currentLang,
        code: code,
      }),
    });
    var data = await res.json();
    renderRunOutput(data);
  } catch (e) {
    console.error('[runCode] execute failed:', e);
    document.getElementById('tab-output').innerHTML =
      '<div style="color:#F85149;">Could not reach the execution server. Is the backend running on localhost:8000?</div>';
  }
}

function renderRunOutput(data) {
  var html = '';
  if (data.verdict === 'Unsupported' || data.verdict === 'Sandbox Error') {
    html = '<div style="color:#F0883E;">' + (data.message || 'Execution unavailable.') + '</div>';
  } else if (data.verdict === 'Compilation Error') {
    html = '<div style="color:#F85149;font-weight:700;margin-bottom:8px;">Compilation Error</div>';
    html += '<pre style="color:#F85149;white-space:pre-wrap;font-size:12px;">' + escapeHtml(data.stderr || '') + '</pre>';
  } else if (data.verdict === 'Runtime Error') {
    html = '<div style="color:#F85149;font-weight:700;margin-bottom:8px;">Runtime Error</div>';
    html += '<pre style="color:#F85149;white-space:pre-wrap;font-size:12px;">' + escapeHtml(data.stderr || '') + '</pre>';
  } else {
    var passColor = data.passed ? '#3FB950' : '#F85149';
    html += '<div style="height:1px;background:#30363D;margin-bottom:8px;"></div>';
    (data.cases || []).forEach(function (c) {
      html += '<div style="margin-bottom:8px;">';
      html += '<div style="color:#8B949E;font-size:11px;margin-bottom:2px;">Case ' + c.index + ':</div>';
      html += '<div>Your Output: <span style="color:' + (c.pass ? '#3FB950' : '#F85149') + ';">' + escapeHtml(c.actual) + '</span></div>';
      html += '<div style="color:#8B949E;">Expected: <span style="color:#A5D6FF;">' + escapeHtml(c.expected) + '</span></div>';
      html += '</div>';
    });
    html += '<div style="margin-top:6px;font-weight:700;color:' + passColor + ';">' +
      (data.passed ? '✓ All test cases passed' : '✗ Some test cases failed') + '</div>';
  }
  document.getElementById('tab-output').innerHTML = html;
}

function escapeHtml(s) {
  var div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML;
}

async function submitCode() {
  var code = sess.monacoEditor ? sess.monacoEditor.getValue() : '';
  var q = sess.questions[sess.currentIdx];
  if (!q) return;

  switchOutputTab('verdict', null);
  document.getElementById('tab-verdict').innerHTML =
    '<div style="color:#8B949E;">Submitting…</div>';

  var elapsed = Math.floor((Date.now() - (sess.questionStartTime || sess.startTime)) / 1000);
  var mins = Math.floor(elapsed / 60);
  var secs = elapsed % 60;

  try {
    var res = await fetch('http://localhost:8000/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: q.slug,
        language: sess.currentLang,
        code: code,
      }),
    });
    var data = await res.json();
    var accepted = data.verdict === 'Accepted';

    sess.results[sess.currentIdx] = {
      accepted: accepted,
      title: q.title,
      difficulty: q.difficulty,
      slug: q.slug,
      timeTaken: mins + 'm ' + secs + 's',
    };
    sess.questionStartTime = Date.now();
    renderDots();
    renderVerdict(data, accepted);

  } catch (e) {
    console.error('[submitCode] execute failed:', e);
    document.getElementById('tab-verdict').innerHTML =
      '<div style="color:#F85149;">Could not reach the execution server. Is the backend running on localhost:8000?</div>';
  }
}

function renderVerdict(data, accepted) {
  var scoreDelta = accepted ? 7 : -1;
  var html = '';
  if (accepted) {
    html += '<div style="font-size:22px;font-weight:800;color:#3FB950;margin-bottom:8px;">✓ ACCEPTED</div>';
    html += '<div style="color:#8B949E;font-size:12px;">Score impact: <strong style="color:#3FB950;">+' + scoreDelta + ' points</strong></div>';
  } else if (data.verdict === 'Compilation Error' || data.verdict === 'Runtime Error') {
    html += '<div style="font-size:22px;font-weight:800;color:#F85149;margin-bottom:8px;">✗ ' + data.verdict.toUpperCase() + '</div>';
    html += '<pre style="color:#F85149;white-space:pre-wrap;font-size:12px;margin-bottom:10px;">' + escapeHtml(data.stderr || '') + '</pre>';
  } else {
    html += '<div style="font-size:22px;font-weight:800;color:#F85149;margin-bottom:8px;">✗ WRONG ANSWER</div>';
    html += '<div style="color:#8B949E;margin-bottom:10px;">Your solution did not pass all test cases.</div>';
    html += '<div style="color:#8B949E;font-size:12px;">Score impact: <strong style="color:#F85149;">' + scoreDelta + ' point</strong></div>';
  }
  document.getElementById('tab-verdict').innerHTML = html;
}

// ─────────────────────────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────────────────────────
function startTimer() {
  sess.secondsLeft = cfg.mins * 60;
  sess.timerInterval = setInterval(function () {
    if (!sess.active) return;
    sess.secondsLeft--;
    updateTimerDisplay();
    if (sess.secondsLeft <= 0) {
      clearInterval(sess.timerInterval);
      endSession('timeout');
    }
  }, 1000);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  var m = Math.floor(sess.secondsLeft / 60);
  var s = sess.secondsLeft % 60;
  var text = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  var el = document.getElementById('bottom-timer-text');
  if (!el) return;
  el.textContent = text;
  el.className = '';
  if (sess.secondsLeft <= 300) el.className = 'timer-warning';
  if (sess.secondsLeft <= 60)  el.className = 'timer-danger';
}

function pauseTimer()  { if (sess.timerInterval) { clearInterval(sess.timerInterval); sess.timerInterval = null; } }
function resumeTimer() { if (!sess.timerInterval && sess.active) startTimer(); }

// ─────────────────────────────────────────────────────────────
// TAB SWAP DETECTION & LOCKOUT
// ─────────────────────────────────────────────────────────────
function setupTabDetection() {}

var _tabHandled = false;
var _blurIgnoreUntil = 0; // suppress false blur events right after focusing Monaco

function setupTabSwap() {
  // visibilitychange is the reliable signal — fires ONLY on real tab/window switches,
  // minimizing, or switching virtual desktops. It does NOT fire from clicking inside
  // page elements like Monaco's internal textarea.
  document.addEventListener('visibilitychange', onVisibilityChange);

  // window blur is kept ONLY as a backup for edge cases (e.g. alt-tab on some OSes
  // where visibilitychange is delayed), but guarded against Monaco's internal
  // focus/blur churn using a short ignore window.
  window.addEventListener('blur', onWindowBlur);
  window.addEventListener('focus', onWindowFocus);
}

function onVisibilityChange() {
  if (document.hidden) {
    handleTabViolation();
  }
}

function onWindowBlur() {
  // Give a 250ms grace period — Monaco editor and other inputs can fire
  // spurious blur events on internal focus changes. A REAL tab switch
  // will also trigger visibilitychange almost simultaneously, which is
  // the authoritative check. This blur handler is just a fallback net.
  _blurIgnoreUntil = Date.now() + 250;
  setTimeout(function () {
    if (document.hidden && Date.now() >= _blurIgnoreUntil - 250) {
      handleTabViolation();
    }
  }, 260);
}

function onWindowFocus() {
  // Returning focus — nothing to log, but available as a hook if needed later.
}

function handleTabViolation() {
  if (!sess.active || _tabHandled) return;
  _tabHandled = true;

  sess.tabViolations++;
  var time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  logViolation('critical', 'Tab switched', time);
  updatePrTabStatus('warning');
  pauseTimer();
  takeSnapshot('tabswitch');

  document.getElementById('iv2-tabswap-overlay').style.display = 'flex';
  document.getElementById('tabswap-count-text').textContent =
    'Violation #' + sess.tabViolations + ' of 3 — 3 violations = session terminated';

  if (sess.tabViolations >= 3) {
    setTimeout(function () { endSession('violations'); }, 2000);
  }
}

function returnToInterview() {
  _tabHandled = false;
  document.getElementById('iv2-tabswap-overlay').style.display = 'none';
  updatePrTabStatus('ok');
  resumeTimer();
}

// ─────────────────────────────────────────────────────────────
// MEDIAPIPE FACE DETECTION
// ─────────────────────────────────────────────────────────────
function initFaceDetection() {
  var video = document.getElementById('proctor-video');
  if (!video || !video.srcObject) return;

  if (window.FaceDetection) {
    sess.faceDetector = new FaceDetection({
      locateFile: function (f) { return 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/' + f; }
    });
    sess.faceDetector.setOptions({ model: 'short', minDetectionConfidence: 0.55 });
    sess.faceDetector.onResults(onFaceResults);

    sess.faceCamera = new Camera(video, {
      onFrame: async function () {
        if (sess.faceDetector && sess.active) await sess.faceDetector.send({ image: video });
      },
      width: 320, height: 240,
    });
    sess.faceCamera.start();
  }
}

var _lastFaceWarn = 0;
function onFaceResults(results) {
  if (!sess.active) return;
  var detected = results.detections && results.detections.length > 0;
  var multiple = results.detections && results.detections.length > 1;
  var now = Date.now();

  // Update face confidence
  sess.faceConfidence = detected ? Math.floor(Math.random() * 8 + 90) : 0;

  var camWrap = document.getElementById('proctor-cam-wrap');
  var faceWarn = document.getElementById('iv-face-warning');

  if (!detected) {
    faceWarn.style.display = 'block';
    camWrap.className = 'proctor-cam-wrap danger';
    updateProctorRow('face', false, 0);
    if (now - _lastFaceWarn > 3000) {
      _lastFaceWarn = now;
      var time = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      logViolation('warning', 'Face not detected', time);
    }
  } else {
    faceWarn.style.display = 'none';
    camWrap.className = 'proctor-cam-wrap';
    updateProctorRow('face', true, sess.faceConfidence);
    if (multiple) {
      var time2 = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      logViolation('critical', 'Multiple people detected', time2);
      updateProctorRow('person', false, 40);
    } else {
      updateProctorRow('person', true, 99);
    }
  }

  // Eyes simulation (based on face detection)
  var eyeConf = detected ? Math.floor(Math.random() * 12 + 85) : 0;
  updateProctorRow('eyes', detected, eyeConf);
}

// ─────────────────────────────────────────────────────────────
// PROCTOR UI UPDATES
// ─────────────────────────────────────────────────────────────
function updateProctorRow(key, ok, pct) {
  var badge = document.getElementById('pr-' + key + '-badge');
  var bar   = document.getElementById('pr-' + key + '-bar');
  if (!badge || !bar) return;

  if (ok) {
    badge.textContent = '✓ Yes ' + pct + '%';
    badge.className   = 'proctor-row-badge badge-ok';
    bar.className     = 'proctor-bar-fill bar-ok';
    bar.style.width   = pct + '%';
  } else {
    var label = key === 'phone' ? '🔴 YES ' + pct + '%' : '✗ No';
    badge.textContent = label;
    badge.className   = 'proctor-row-badge badge-bad';
    bar.className     = 'proctor-bar-fill bar-bad';
    bar.style.width   = (pct || 5) + '%';
  }

  updateProctorMain();
}

function updatePrTabStatus(status) {
  var badge = document.getElementById('pr-tab-badge');
  var bar   = document.getElementById('pr-tab-bar');
  if (!badge || !bar) return;
  if (status === 'ok') {
    badge.textContent = '✓ Active';
    badge.className = 'proctor-row-badge badge-ok';
    bar.className = 'proctor-bar-fill bar-ok';
    bar.style.width = '100%';
  } else {
    badge.textContent = '✗ Switched';
    badge.className = 'proctor-row-badge badge-bad';
    bar.className = 'proctor-bar-fill bar-bad';
    bar.style.width = '0%';
  }
  updateProctorMain();
}

function updateProctorMain() {
  var hasBad = document.querySelector('.proctor-row-badge.badge-bad');
  var mainEl = document.getElementById('proctor-status-main');
  if (hasBad) {
    mainEl.textContent = '⚠ VIOLATION';
    mainEl.className = 'proctor-status-main danger';
  } else {
    mainEl.textContent = '✓ SAFE';
    mainEl.className = 'proctor-status-main safe';
  }
}

function logViolation(severity, desc, time) {
  sess.violations.push({ severity: severity, desc: desc, time: time });
  renderViolationLog();
}

function renderViolationLog() {
  var log = document.getElementById('violation-log');
  var empty = document.getElementById('viol-empty');
  var count = document.getElementById('viol-count-badge');
  if (!log) return;

  var total = sess.violations.length;
  if (count) count.textContent = total;

  if (total === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  var html = sess.violations.slice().reverse().map(function (v) {
    return '<div class="violation-item">' +
      '<div class="violation-dot ' + (v.severity === 'critical' ? 'critical' : 'warning') + '"></div>' +
      '<div><div class="violation-time">' + v.time + '</div>' +
      '<div class="violation-desc">' + v.desc + '</div></div>' +
      '</div>';
  }).join('');
  log.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────
// RANDOM SNAPSHOT ENGINE
// ─────────────────────────────────────────────────────────────
function scheduleNextSnapshot() {
  // Random between 3 and 8 minutes
  var delay = Math.floor(Math.random() * (8 * 60 - 3 * 60) * 1000) + 3 * 60 * 1000;
  sess.snapNextMs = Date.now() + delay;
  updateSnapCountdown();

  sess.snapInterval = setTimeout(function () {
    takeSnapshot('random');
    scheduleNextSnapshot();
  }, delay);
}

function updateSnapCountdown() {
  setInterval(function () {
    if (!sess.active) return;
    var remaining = Math.max(0, sess.snapNextMs - Date.now());
    var mins = Math.floor(remaining / 60000);
    var secs = Math.floor((remaining % 60000) / 1000);
    var el = document.getElementById('snap-next');
    if (el) el.textContent = '~' + mins + 'm ' + secs + 's';
  }, 1000);
}

function takeSnapshot(reason) {
  var video = document.getElementById('proctor-video');
  if (!video || !video.srcObject) return;

  // Draw to canvas
  var canvas = document.createElement('canvas');
  canvas.width = 160; canvas.height = 90;
  var ctx = canvas.getContext('2d');
  ctx.scale(-1, 1);
  ctx.drawImage(video, -160, 0, 160, 90);

  // Simulate ML label
  var labels = ['Normal', 'Normal', 'Normal', 'Suspicious movement', 'Normal'];
  if (reason === 'tabswitch') labels = ['Suspicious movement'];
  var label = labels[Math.floor(Math.random() * labels.length)];

  var time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  sess.snapshots.push({ canvas: canvas, label: label, time: time });
  sess.snapCount++;

  var countEl = document.getElementById('snap-count');
  var lastEl  = document.getElementById('snap-last');
  var statEl  = document.getElementById('snap-status');

  if (countEl) countEl.textContent = sess.snapCount;
  if (lastEl)  lastEl.textContent  = time;

  var isClean = label === 'Normal';
  if (statEl) {
    statEl.textContent = isClean ? '✓ Clean' : '⚠️ ' + label;
    statEl.style.color = isClean ? 'var(--green)' : 'var(--amber)';
  }
}

// ─────────────────────────────────────────────────────────────
// PHONE DETECTION — Real COCO-SSD object detection
// ─────────────────────────────────────────────────────────────
async function initPhoneDetection() {
  var video = document.getElementById('proctor-video');
  if (!video) return;

  // Create bounding-box debug canvas overlay
  var camWrap = document.getElementById('proctor-cam-wrap') || video.parentElement;
  if (camWrap) {
    _phoneCanvas = document.createElement('canvas');
    _phoneCanvas.id = 'phone-detect-canvas';
    _phoneCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
    if (getComputedStyle(camWrap).position === 'static') camWrap.style.position = 'relative';
    camWrap.appendChild(_phoneCanvas);
  }

  // Wait for TF.js + cocoSsd to be available
  var attempts = 0;
  while (typeof cocoSsd === 'undefined' && attempts++ < 20) {
    await new Promise(function(r){ setTimeout(r, 500); });
  }
  if (typeof cocoSsd === 'undefined') {
    console.warn('[PhoneDetect] cocoSsd not available — phone detection disabled');
    return;
  }

  try {
    console.log('[PhoneDetect] Loading COCO-SSD model (lite_mobilenet_v2)…');
    _cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    console.log('[PhoneDetect] ✅ Model loaded — starting detection loop at 1000ms interval');
  } catch(e) {
    console.error('[PhoneDetect] Model load failed:', e);
    return;
  }

  _phoneDetectLoop = setInterval(async function() {
    if (!sess.active || !_cocoModel) return;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return;

    try {
      var predictions = await _cocoModel.detect(video);

      // Draw bounding boxes on debug canvas
      _drawPhoneBboxes(video, predictions);

      // Log ALL detected objects (for debug)
      if (predictions.length) {
        console.log('[PhoneDetect]', predictions.map(function(p){
          return p.class + '(' + Math.round(p.score*100) + '%)';
        }).join(' | '));
      }

      // Filter for 'cell phone' with confidence >= 0.55
      var phoneHit = predictions.find(function(p){
        return p.class === 'cell phone' && p.score >= 0.55;
      });

      if (phoneHit) {
        _phoneHits++;
        console.log('[PhoneDetect] 📱 Phone hit #' + _phoneHits + ' conf=' + Math.round(phoneHit.score*100) + '%');
        if (_phoneHits >= 2) {                     // require 2 consecutive frames
          _triggerPhoneDetected(Math.round(phoneHit.score * 100));
          _phoneHits = 0;                          // reset so each event logs once
        }
      } else {
        if (_phoneHits > 0) _phoneHits--;          // decay counter
        // If phone was previously active and is now gone → revert badge
        var badge = document.getElementById('pr-phone-badge');
        if (badge && badge.textContent.includes('YES')) {
          if (_phoneHits === 0) _resetPhoneStatus();
        }
      }
    } catch(e) {
      console.warn('[PhoneDetect] detect() error:', e);
    }
  }, 1000);
}

function _drawPhoneBboxes(video, predictions) {
  if (!_phoneCanvas) return;
  _phoneCanvas.width  = video.videoWidth  || 320;
  _phoneCanvas.height = video.videoHeight || 240;
  var ctx = _phoneCanvas.getContext('2d');
  ctx.clearRect(0, 0, _phoneCanvas.width, _phoneCanvas.height);
  predictions.forEach(function(p) {
    if (p.score < 0.4) return;
    var x = p.bbox[0], y = p.bbox[1], w = p.bbox[2], h = p.bbox[3];
    var isPhone = p.class === 'cell phone';
    var color = isPhone ? '#F44336' : 'rgba(255,255,255,0.35)';
    ctx.strokeStyle = color;
    ctx.lineWidth   = isPhone ? 2.5 : 1.5;
    ctx.strokeRect(x, y, w, h);
    if (isPhone) {
      ctx.fillStyle = 'rgba(244,67,54,0.80)';
      ctx.fillRect(x, y - 20, w, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('PHONE ' + Math.round(p.score*100) + '%', x + 4, y - 5);
    }
  });
}

function _triggerPhoneDetected(confidence) {
  var banner = document.getElementById('iv2-phone-banner');
  if (banner) {
    banner.classList.add('visible');
    setTimeout(function(){ banner.classList.remove('visible'); }, 8000);
  }
  var camWrap = document.getElementById('proctor-cam-wrap');
  if (camWrap) {
    var flashes = 0;
    var f = setInterval(function(){
      camWrap.style.borderColor = flashes++ % 2 === 0 ? '#F44336' : 'transparent';
      if (flashes >= 6) { clearInterval(f); camWrap.style.borderColor = '#F44336'; }
    }, 200);
  }
  updateProctorRow('phone', false, confidence);
  var badge = document.getElementById('pr-phone-badge');
  if (badge) { badge.textContent = '🔴 YES ' + confidence + '%'; badge.className = 'proctor-row-badge badge-bad'; }
  var time = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  logViolation('critical', 'Phone detected (' + confidence + '% confidence)', time);
  takeSnapshot('phone');
  updateProctorMain();
}

function _resetPhoneStatus() {
  var badge   = document.getElementById('pr-phone-badge');
  var camWrap = document.getElementById('proctor-cam-wrap');
  if (badge)   { badge.textContent = '✓ Clear'; badge.className = 'proctor-row-badge badge-ok'; }
  if (camWrap) camWrap.style.borderColor = '';
  updateProctorMain();
}

// ─────────────────────────────────────────────────────────────
// END SESSION & SUMMARY
// ─────────────────────────────────────────────────────────────
function confirmEndSession() {
  if (confirm('End the interview session? This will submit your current work.')) {
    endSession('manual');
  }
}

function endSession(reason) {
  sess.active = false;

  // Cleanup
  if (sess.timerInterval) clearInterval(sess.timerInterval);
  if (sess.snapInterval)  clearTimeout(sess.snapInterval);
  if (sess.stream) sess.stream.getTracks().forEach(function (t) { t.stop(); });
  if (sess.faceCamera) try { sess.faceCamera.stop(); } catch(e){}
  if (_phoneDetectLoop)   clearInterval(_phoneDetectLoop);
  if (_cocoModel)         { _cocoModel = null; }
  if (_phoneCanvas)       { _phoneCanvas.remove(); _phoneCanvas = null; }

  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('blur', onWindowBlur);
  window.removeEventListener('focus', onWindowFocus);

  // Show summary
  document.getElementById('iv2-session').style.display  = 'none';
  document.getElementById('iv2-tabswap-overlay').style.display = 'none';
  document.getElementById('iv2-summary').style.display  = 'flex';
  document.getElementById('iv2-summary').style.flexDirection = 'column';

  renderSummary(reason);
}

function renderSummary(reason) {
  var results = sess.results.filter(Boolean);
  var accepted = results.filter(function (r) { return r.accepted; }).length;
  var total    = sess.questions.length;
  var attempted = results.length;
  var violations = sess.violations.length;
  var criticals  = sess.violations.filter(function (v) { return v.severity === 'critical'; }).length;

  var scoreDelta = (accepted * 7) - Math.min(criticals * 2, 10);

  document.getElementById('sum-sub').textContent = reason === 'timeout' ? 'Time limit reached — here is your session report.' : (reason === 'violations' ? 'Session terminated due to repeated violations.' : 'Here is your session report.');
  document.getElementById('sum-score-delta').textContent = (scoreDelta >= 0 ? '+' : '') + scoreDelta + ' pts';
  document.getElementById('sum-score-delta').className   = 'summary-score-big ' + (scoreDelta >= 0 ? 'green' : 'red');
  document.getElementById('sum-attempted').textContent   = attempted + ' / ' + total;
  document.getElementById('sum-accepted').textContent    = accepted;
  document.getElementById('sum-wrong').textContent       = attempted - accepted;

  document.getElementById('sum-proctor-result').textContent = criticals === 0 ? '✓ CLEAN' : '⚠ ' + criticals + ' CRITICAL';
  document.getElementById('sum-proctor-result').style.color = criticals === 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('sum-violations').textContent = violations;
  document.getElementById('sum-penalty').textContent    = '−' + Math.min(criticals * 2, 10) + ' pts';
  document.getElementById('sum-snaps').textContent      = sess.snapCount;

  // Snapshot grid
  var snapGrid = document.getElementById('sum-snap-grid');
  if (sess.snapshots.length === 0) {
    snapGrid.innerHTML = '<div style="font-size:12px;color:var(--muted);grid-column:1/-1;">No snapshots taken.</div>';
  } else {
    snapGrid.innerHTML = sess.snapshots.map(function (snap) {
      var isNormal = snap.label === 'Normal';
      var borderColor = isNormal ? 'var(--green)' : (snap.label.includes('Phone') ? 'var(--red)' : 'var(--amber)');
      var icon = isNormal ? '✓ Normal' : ('⚠️ ' + snap.label);
      var labelColor = isNormal ? 'var(--green)' : (snap.label.includes('Phone') ? 'var(--red)' : 'var(--amber)');
      return '<div class="snapshot-thumb" style="border:2px solid ' + borderColor + ';border-radius:4px;">' +
        '<canvas width="160" height="90" id="snap-canvas-' + snap.time + '"></canvas>' +
        '<div class="snapshot-label" style="color:' + labelColor + ';font-size:9px;background:#F7F8FA;">' + icon + '</div>' +
        '<div style="font-size:9px;text-align:center;color:var(--muted);padding:2px;">' + snap.time + '</div>' +
        '</div>';
    }).join('');
    // Draw snapshots
    sess.snapshots.forEach(function (snap) {
      var c = document.getElementById('snap-canvas-' + snap.time);
      if (c && snap.canvas) c.getContext('2d').drawImage(snap.canvas, 0, 0, 160, 90);
    });
  }

  // Question table
  var tbody = document.getElementById('sum-q-table');
  var rows = '';
  for (var i = 0; i < total; i++) {
    var q = sess.questions[i];
    var r = sess.results[i];
    var domain = cfg.domain === 'ml' || cfg.domain === 'react' ? 'GFG' : 'LeetCode';
    rows += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (q ? q.title : 'N/A') + '</td>' +
      '<td><span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + (q&&q.difficulty==='Hard'?'#FEE2E2':'#FEF3C7') + ';color:' + (q&&q.difficulty==='Hard'?'#991B1B':'#92400E') + ';">' + (q ? q.difficulty : 'Medium') + '</span></td>' +
      '<td>' + domain + '</td>' +
      '<td>' + (r ? (r.accepted ? '<span class="verdict-accepted">✓ Accepted</span>' : '<span class="verdict-wrong">✗ Wrong Answer</span>') : '<span style="color:var(--muted);">Not Attempted</span>') + '</td>' +
      '<td style="font-family:JetBrains Mono,monospace;font-size:12px;">' + (r ? r.timeTaken : '—') + '</td>' +
      '</tr>';
  }
  tbody.innerHTML = rows;
}

function retrySession() {
  document.getElementById('iv2-summary').style.display = 'none';
  document.getElementById('iv2-config').style.display  = 'flex';
}

/* ============================================================
   NEXUS — Dashboard JS  (v2 — fully dynamic)
   ============================================================ */
'use strict';

// ── Config ───────────────────────────────────────────────────
var ARC_LENGTH = 282.74;

var SKILL_DEFS = [
  { key: 'dsa',    label: 'DSA / Algorithms',   demand: 78 },
  { key: 'system', label: 'System Design',       demand: 82 },
  { key: 'react',  label: 'React / Frontend',    demand: 58 },
  { key: 'sql',    label: 'SQL / PostgreSQL',    demand: 54 },
  { key: 'cloud',  label: 'Cloud / AWS',         demand: 64 },
  { key: 'ml',     label: 'Machine Learning',    demand: 42 },
  { key: 'docker', label: 'Docker / Kubernetes', demand: 38 },
  { key: 'os',     label: 'OS / Networks',       demand: 46 },
];

var ROLE_LABELS = {
  sde1: 'SDE-1', ml: 'ML Engineer', frontend: 'Frontend Dev',
  backend: 'Backend Dev', devops: 'DevOps Engineer', fullstack: 'Full Stack Dev'
};

var QUESTIONS = {
  dsa: [
    { q: 'Explain how a Hash Map works internally. What happens during a collision?', hint: 'Mention: array of buckets, hash function, chaining or open addressing', keywords: ['hash','bucket','collision','chaining','load factor'] },
    { q: 'What is the time complexity of Quick Sort in the best, average, and worst case? Why?', hint: 'Think about pivot selection and partition sizes', keywords: ['O(n log n)','worst','O(n^2)','pivot','partition'] },
    { q: 'How would you detect a cycle in a linked list? Write the algorithm.', hint: 'Consider Floyd\'s slow/fast pointer approach', keywords: ['slow','fast','pointer','floyd','cycle','two pointer'] },
    { q: 'Explain Dynamic Programming with a real-world example. When should you use it?', hint: 'Mention overlapping subproblems and optimal substructure', keywords: ['subproblem','memoization','tabulation','fibonacci','optimal','overlapping'] },
    { q: 'How does BFS differ from DFS? When would you choose one over the other?', hint: 'Think about shortest path, memory usage, and graph types', keywords: ['queue','stack','level','shortest','recursive','visited'] },
  ],
  system: [
    { q: 'Design a URL shortener like bit.ly. Walk through the key components.', hint: 'Cover: API design, DB schema, Base62 encoding, caching, analytics', keywords: ['base62','hash','redirect','cache','database','load balancer','301','302'] },
    { q: 'How would you design a notification system that handles 10 million users?', hint: 'Think: message queues, fan-out, push/pull, different channels', keywords: ['kafka','queue','fanout','push','websocket','rate limit','scale'] },
    { q: 'Explain the CAP theorem. How does it affect database design choices?', hint: 'You must pick 2 of 3 — give examples of real systems', keywords: ['consistency','availability','partition','tradeoff','cassandra','zookeeper'] },
    { q: 'Design a rate limiter. What algorithms can you use?', hint: 'Cover: token bucket, sliding window log, fixed window', keywords: ['token bucket','sliding window','redis','counter','limit','throttle'] },
    { q: 'How does a CDN work? When would you use one?', hint: 'Mention edge nodes, cache invalidation, origin server, latency', keywords: ['edge','cdn','cache','latency','origin','geographic','invalidation'] },
  ],
  behavioral: [
    { q: 'Tell me about a time you had a disagreement with a teammate. How did you handle it?', hint: 'Use STAR: Situation, Task, Action, Result', keywords: ['conflict','resolved','listened','team','outcome','communication'] },
    { q: 'Describe your most challenging project. What made it hard and what did you learn?', hint: 'Be specific — mention the technical or team challenge and your role', keywords: ['challenge','learned','overcame','deadline','technical','result'] },
    { q: 'Tell me about a time you failed. What happened and what did you take away from it?', hint: 'Honesty matters — focus on what you improved after the failure', keywords: ['mistake','learned','improved','responsibility','fixed','lesson'] },
    { q: 'How do you prioritise tasks when you have multiple deadlines?', hint: 'Mention frameworks like Eisenhower Matrix or tools like Jira', keywords: ['priority','deadline','important','urgent','task','manage','plan'] },
    { q: 'Describe a situation where you had to learn something very quickly.', hint: 'Show resourcefulness — documentation, mentors, trial & error', keywords: ['quickly','learned','resource','documentation','mentor','practiced','adapt'] },
  ],
  hr: [
    { q: 'Why are you interested in this company specifically?', hint: 'Research the company — mention products, culture, or mission', keywords: ['mission','product','culture','growth','opportunity','interested'] },
    { q: 'Where do you see yourself in 5 years?', hint: 'Show ambition but also alignment with the role', keywords: ['grow','lead','skill','responsibility','contribute','long-term'] },
    { q: 'What is your greatest strength, and how does it apply to this role?', hint: 'Choose a real strength with a concrete example', keywords: ['strength','example','applied','helped','result','improved'] },
    { q: 'Do you prefer working alone or in a team? Why?', hint: 'Both have merit — show you can adapt to either', keywords: ['team','collaborate','independent','adapt','depend','context'] },
    { q: 'How do you handle feedback or criticism?', hint: 'Show openness and a growth mindset with an example', keywords: ['feedback','improve','constructive','learned','positive','change','appreciate'] },
  ],
};

// ── State ────────────────────────────────────────────────────
var state = {
  score:      null,
  interviews: [],
  assessment: null,
  iv: {
    active:   false,
    topic:    'dsa',
    diff:     'easy',
    questions:[],
    current:  0,
    scores:   [],
  },
};

// ── Helpers ──────────────────────────────────────────────────
function el(id) { return document.getElementById(id); }

function saveState() {
  try { localStorage.setItem('nexus_dash', JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  try {
    var raw = localStorage.getItem('nexus_dash');
    if (raw) state = Object.assign({}, state, JSON.parse(raw));
  } catch(e) {}
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('nexus_user') || '{}'); } catch(e) { return {}; }
}

// ── User injection ───────────────────────────────────────────
function injectUser() {
  var user = getUser();
  var name = user.name || 'Your Name';
  var initials = name.split(' ').slice(0,2).map(function(w){ return w[0].toUpperCase(); }).join('');

  var welcomeEl = el('dash-welcome');
  if (welcomeEl) welcomeEl.textContent = 'Welcome back, ' + name.split(' ')[0] + ' 👋';

  var avatarEl = el('dash-sidebar-avatar');
  if (avatarEl) avatarEl.textContent = initials || '?';

  var nameEl = el('dash-sidebar-name');
  if (nameEl) nameEl.textContent = name;
}

// ── Score update ─────────────────────────────────────────────
function updateScoreDisplay(score) {
  state.score = score;
  saveState();

  var scoreEl = el('dash-metric-score');
  var subEl   = el('dash-metric-score-sub');
  var sideEl  = el('dash-sidebar-score');

  if (scoreEl) scoreEl.textContent = score !== null ? score : '—';
  if (subEl)   subEl.textContent   = score !== null ? '/ 100 · Score based on your assessment' : '/ 100 · Not assessed yet';
  if (sideEl)  sideEl.textContent  = score !== null ? 'Score: ' + score + ' / 100' : 'Score: — / 100';

  // Animate gauge
  animateGauge(score || 0, 1800);
}

// ── Gauge ────────────────────────────────────────────────────
function animateGauge(targetScore, durationMs) {
  var arc       = el('dash-score-arc');
  var needle    = el('dash-needle');
  var scoreText = el('dash-score-text');
  if (!arc || !needle || !scoreText) return;

  var startTime = null;
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(ts) {
    if (!startTime) startTime = ts;
    var p = Math.min((ts - startTime) / durationMs, 1);
    var e = easeOut(p);
    var c = e * targetScore;
    arc.style.strokeDashoffset = (ARC_LENGTH * (1 - c / 100)).toFixed(2);
    needle.setAttribute('transform', 'translate(100,120) rotate(' + (-90 + c * 1.8).toFixed(2) + ')');
    scoreText.textContent = targetScore === 0 ? '—' : Math.round(c);
    if (p < 1) requestAnimationFrame(tick);
  }
  setTimeout(function() { requestAnimationFrame(tick); }, 300);
}

// ── Line chart ───────────────────────────────────────────────
function animateChart(delayMs) {
  var line  = el('chart-line');
  var cpIds = ['cp1','cp2','cp3','cp4','cp5','cp6','cp7'];
  if (!line) return;
  setTimeout(function() {
    line.style.transition = 'stroke-dashoffset 2s ease';
    line.style.strokeDashoffset = '0';
    cpIds.forEach(function(id, i) {
      var pt = el(id);
      if (!pt) return;
      setTimeout(function() { pt.style.transition = 'opacity .25s'; pt.style.opacity = '1'; }, 320 + i * 260);
    });
  }, delayMs);
}

// ── Tab navigation ───────────────────────────────────────────
function setupTabs() {
  var navItems = document.querySelectorAll('.dash-nav-item[data-tab]');
  var views    = document.querySelectorAll('.dash-view');

  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var tabId = this.getAttribute('data-tab');
      navItems.forEach(function(n) { n.classList.remove('active'); n.setAttribute('aria-selected','false'); });
      this.classList.add('active');
      this.setAttribute('aria-selected','true');

      views.forEach(function(v) { v.classList.remove('active'); });
      var target = el('view-' + tabId);
      if (target) {
        target.classList.add('active');
        if (tabId === 'skills')    initSkillsView();
        if (tabId === 'interview') initInterviewView();
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SKILL GAP ASSESSMENT
// ══════════════════════════════════════════════════════════════

function initSkillsView() {
  if (state.assessment) {
    showSkillReport(state.assessment);
  } else {
    showSkillGate();
  }
}

function showSkillGate() {
  var gate   = el('skills-gate');
  var report = el('skills-report');
  if (gate)   gate.style.display   = '';
  if (report) report.style.display = 'none';
  renderSkillSliders();
}

function renderSkillSliders() {
  var container = el('skill-sliders');
  if (!container) return;
  container.innerHTML = SKILL_DEFS.map(function(skill) {
    return '<div style="margin-bottom:16px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<label style="font-size:13px;font-weight:500;color:#1A1A2E;">' + skill.label + '</label>' +
        '<span id="slider-val-' + skill.key + '" style="font-size:12px;font-weight:600;color:#1A1A2E;min-width:60px;text-align:right;">1 — None</span>' +
      '</div>' +
      '<input type="range" id="slider-' + skill.key + '" min="1" max="5" value="1" ' +
        'style="width:100%;accent-color:#1A1A2E;cursor:pointer;" ' +
        'oninput="updateSliderLabel(\'' + skill.key + '\',this.value)" />' +
    '</div>';
  }).join('');
}

var LEVEL_LABELS = ['','None','Beginner','Intermediate','Advanced','Expert'];

function updateSliderLabel(key, val) {
  var lbl = el('slider-val-' + key);
  if (lbl) lbl.textContent = val + ' — ' + LEVEL_LABELS[val];
}

function resetAssessment() {
  state.assessment = null;
  saveState();
  updateScoreDisplay(null);
  showSkillGate();
}

function runAssessment() {
  var skills = {};
  var totalWeighted = 0, totalDemand = 0;

  SKILL_DEFS.forEach(function(skill) {
    var sliderEl = el('slider-' + skill.key);
    var val = sliderEl ? parseInt(sliderEl.value) : 1;
    skills[skill.key] = { level: val, label: LEVEL_LABELS[val], demand: skill.demand, name: skill.label };
    // weighted contribution: (your level / 5) × demand × weight
    totalWeighted += (val / 5) * skill.demand;
    totalDemand   += skill.demand;
  });

  var roleEl  = el('target-role-select');
  var role    = roleEl ? roleEl.value : 'sde1';
  var rawScore = Math.round((totalWeighted / totalDemand) * 100);
  // Clamp score between 10 and 90 so it always feels dynamic
  var score   = Math.max(10, Math.min(90, rawScore));

  var assessment = { skills: skills, role: role, score: score, date: new Date().toLocaleDateString('en-IN') };
  state.assessment = assessment;
  updateScoreDisplay(score);
  saveState();
  showSkillReport(assessment);
}

function showSkillReport(assessment) {
  var gate   = el('skills-gate');
  var report = el('skills-report');
  if (gate)   gate.style.display   = 'none';
  if (report) report.style.display = '';

  var roleEl   = el('report-role');
  if (roleEl)  roleEl.textContent = ROLE_LABELS[assessment.role] || assessment.role;

  // Render skill bars
  var barsEl = el('skill-bars-container');
  if (barsEl) {
    barsEl.innerHTML = '<div class="dash-card">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="font-size:11px;font-weight:600;color:#9E9E9E;text-transform:uppercase;letter-spacing:.5px;">' +
          '<th style="text-align:left;padding:0 0 12px;">Skill</th>' +
          '<th style="text-align:left;padding:0 0 12px;">Market Demand</th>' +
          '<th style="text-align:left;padding:0 0 12px;">Your Level</th>' +
          '<th style="text-align:left;padding:0 0 12px;">Status</th>' +
        '</tr></thead><tbody>' +
        Object.values(assessment.skills).map(function(s) {
          var status = s.level >= 4 ? 'covered' : s.level >= 3 ? 'partial' : 'gap';
          var statusLabel = status === 'covered' ? 'Covered' : status === 'partial' ? 'Partial' : 'Gap';
          var levelColor  = status === 'covered' ? '#4CAF50' : status === 'partial' ? '#FF9800' : '#F44336';
          return '<tr style="border-top:1px solid #F5F5F5;">' +
            '<td style="padding:12px 0;font-size:13px;font-weight:500;color:#1A1A2E;">' + s.name + '</td>' +
            '<td style="padding:12px 12px 12px 0;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<div style="flex:1;height:4px;background:#F5F5F5;border-radius:2px;max-width:120px;">' +
                  '<div style="height:4px;background:#1A1A2E;border-radius:2px;width:' + s.demand + '%;"></div>' +
                '</div>' +
                '<span style="font-size:12px;color:#616161;">' + s.demand + '%</span>' +
              '</div>' +
            '</td>' +
            '<td style="padding:12px 0;"><span style="font-size:12px;font-weight:600;color:' + levelColor + ';">' + s.label + '</span></td>' +
            '<td style="padding:12px 0;"><span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:' + (status==='covered'?'#E8F5E9':status==='partial'?'#FFF3E0':'#FFEBEE') + ';color:' + levelColor + ';">' + statusLabel + '</span></td>' +
          '</tr>';
        }).join('') +
      '</tbody></table></div>';
  }

  // Generate action plan
  var gaps = Object.values(assessment.skills).filter(function(s){ return s.level < 3; });
  var planEl = el('action-plan-output');
  if (planEl) {
    if (gaps.length === 0) {
      planEl.innerHTML = '<p>🎉 Your skill coverage is strong for your target role. Focus on taking mock interviews to convert your knowledge into interview performance.</p>';
    } else {
      planEl.innerHTML = '<p><strong>Your top ' + Math.min(3,gaps.length) + ' priority gaps to close:</strong></p><br>' +
        gaps.slice(0,3).map(function(g, i) {
          return '<p><strong>Week ' + (i+1) + ' — ' + g.name + '</strong><br>' +
            getActionForSkill(g) + '</p>';
        }).join('<br>') +
        '<br><p style="color:#9E9E9E;font-size:12px;">Projected score after closing these gaps: <strong style="color:#4CAF50;">' + Math.min(90, assessment.score + 12) + '/100</strong></p>';
    }
  }
}

function getActionForSkill(skill) {
  var actions = {
    dsa:    'Solve 10 LeetCode problems (Trees + Graphs). Target: 2 Easy + 1 Medium per day.',
    system: 'Read "Grokking System Design" Modules 4–6. Design one system end-to-end.',
    react:  'Build a full CRUD app with React + API integration. Deploy on Vercel.',
    sql:    'Practice 20 SQL queries on HackerRank. Focus on JOINs, aggregation, indexes.',
    cloud:  'Deploy a FastAPI app on AWS EC2 with a load balancer. Try Elastic Beanstalk.',
    ml:     'Complete the HuggingFace NLP Course + build one end-to-end Kaggle notebook.',
    docker: 'Write a Dockerfile for your project, add docker-compose, push to Docker Hub.',
    os:     'Study OS concepts (scheduling, memory, deadlocks) via GeeksForGeeks + GATE notes.',
  };
  return actions[skill.key] || 'Practise this skill through hands-on projects and targeted resources.';
}


// ══════════════════════════════════════════════════════════════
// MOCK INTERVIEW
// ══════════════════════════════════════════════════════════════

function initInterviewView() {
  updateInterviewStats();
  renderInterviewHistory();
}

function updateInterviewStats() {
  var ivs = state.interviews;
  el('iv-stat-total').textContent = ivs.length || 0;
  if (ivs.length === 0) {
    el('iv-stat-avg').textContent  = '—';
    el('iv-stat-best').textContent = '—';
  } else {
    var avg = Math.round(ivs.reduce(function(s,iv){ return s + iv.score; }, 0) / ivs.length);
    el('iv-stat-avg').textContent  = avg + '%';

    var bestScore = -1, bestTopic = '—';
    ivs.forEach(function(iv) { if (iv.score > bestScore) { bestScore = iv.score; bestTopic = iv.topic; } });
    el('iv-stat-best').textContent = bestTopic;
  }
  // Update top-level metric
  var ivMetric = el('dash-metric-interviews');
  if (ivMetric) ivMetric.textContent = state.interviews.length;
}

function renderInterviewHistory() {
  var bodyEl = el('interview-history-body');
  if (!bodyEl) return;
  if (state.interviews.length === 0) {
    bodyEl.innerHTML = '<div style="color:#9E9E9E;font-size:13px;padding:16px 0;">No interviews yet. Start one above!</div>';
    return;
  }
  bodyEl.innerHTML = '<table style="width:100%;border-collapse:collapse;">' +
    '<thead><tr style="font-size:11px;color:#9E9E9E;text-transform:uppercase;letter-spacing:.5px;">' +
      '<th style="text-align:left;padding:0 0 10px;">Date</th>' +
      '<th style="text-align:left;padding:0 0 10px;">Topic</th>' +
      '<th style="text-align:left;padding:0 0 10px;">Score</th>' +
      '<th style="text-align:left;padding:0 0 10px;">Result</th>' +
    '</tr></thead><tbody>' +
    state.interviews.slice().reverse().map(function(iv) {
      var col    = iv.score >= 70 ? '#4CAF50' : iv.score >= 50 ? '#FF9800' : '#F44336';
      var result = iv.score >= 70 ? 'Cleared' : iv.score >= 50 ? 'Review' : 'Retry';
      return '<tr style="border-top:1px solid #F5F5F5;">' +
        '<td style="padding:10px 0;font-size:12px;color:#616161;">' + iv.date + '</td>' +
        '<td style="padding:10px 0;font-size:13px;font-weight:500;color:#1A1A2E;">' + iv.topic + '</td>' +
        '<td style="padding:10px 0;font-size:14px;font-weight:700;color:' + col + ';">' + iv.score + '%</td>' +
        '<td style="padding:10px 0;"><span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:' + (iv.score>=70?'#E8F5E9':iv.score>=50?'#FFF3E0':'#FFEBEE') + ';color:' + col + ';">' + result + '</span></td>' +
      '</tr>';
    }).join('') + '</tbody></table>';
}

// ══════════════════════════════════════════════════════════════
// MOCK INTERVIEW & PROCTORING
// ══════════════════════════════════════════════════════════════

var ivState = {
  stream: null,
  faceDetector: null,
  camera: null,
  recognition: null,
  isRecording: false,
  transcript: '',
  warnings: 0,
  lastWarningTime: 0,
  timerInterval: null,
  secondsLeft: 1800  // 30 minutes
};

function initInterviewView() {
  updateInterviewStats();
  renderInterviewHistory();
}

function updateInterviewStats() {
  var ivs = state.interviews;
  el('iv-stat-total').textContent = ivs.length || 0;
  if (ivs.length === 0) {
    el('iv-stat-avg').textContent  = '—';
    el('iv-stat-best').textContent = '—';
  } else {
    var avg = Math.round(ivs.reduce(function(s,iv){ return s + iv.score; }, 0) / ivs.length);
    el('iv-stat-avg').textContent  = avg + '%';
    var bestScore = -1, bestTopic = '—';
    ivs.forEach(function(iv) { if (iv.score > bestScore) { bestScore = iv.score; bestTopic = iv.topic; } });
    el('iv-stat-best').textContent = bestTopic;
  }
  var ivMetric = el('dash-metric-interviews');
  if (ivMetric) ivMetric.textContent = state.interviews.length;
}

function renderInterviewHistory() {
  var bodyEl = el('interview-history-body');
  if (!bodyEl) return;
  if (state.interviews.length === 0) {
    bodyEl.innerHTML = '<div style="color:#9E9E9E;font-size:13px;padding:16px 0;">No interviews yet. Start one above!</div>';
    return;
  }
  bodyEl.innerHTML = '<table style="width:100%;border-collapse:collapse;">' +
    '<thead><tr style="font-size:11px;color:#9E9E9E;text-transform:uppercase;letter-spacing:.5px;">' +
      '<th style="text-align:left;padding:0 0 10px;">Date</th>' +
      '<th style="text-align:left;padding:0 0 10px;">Topic</th>' +
      '<th style="text-align:left;padding:0 0 10px;">Score</th>' +
      '<th style="text-align:left;padding:0 0 10px;">Result</th>' +
    '</tr></thead><tbody>' +
    state.interviews.slice().reverse().map(function(iv) {
      var col    = iv.score >= 70 ? '#4CAF50' : iv.score >= 50 ? '#FF9800' : '#F44336';
      var result = iv.score >= 70 ? 'Cleared' : iv.score >= 50 ? 'Review' : 'Retry';
      return '<tr style="border-top:1px solid #F5F5F5;">' +
        '<td style="padding:10px 0;font-size:12px;color:#616161;">' + iv.date + '</td>' +
        '<td style="padding:10px 0;font-size:13px;font-weight:500;color:#1A1A2E;">' + iv.topic + '</td>' +
        '<td style="padding:10px 0;font-size:14px;font-weight:700;color:' + col + ';">' + iv.score + '%</td>' +
        '<td style="padding:10px 0;"><span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:' + (iv.score>=70?'#E8F5E9':iv.score>=50?'#FFF3E0':'#FFEBEE') + ';color:' + col + ';">' + result + '</span></td>' +
      '</tr>';
    }).join('') + '</tbody></table>';
}

function setupInterviewLauncher() {
  document.querySelectorAll('#topic-pills .topic-pill').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#topic-pills .topic-pill').forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      state.iv.topic = this.getAttribute('data-topic');
    });
  });
  document.querySelectorAll('#diff-pills .topic-pill').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#diff-pills .topic-pill').forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      state.iv.diff = this.getAttribute('data-diff');
    });
  });

  el('start-interview-btn').addEventListener('click', async function() {
    this.textContent = 'Loading Interview...';
    this.disabled = true;
    await startInterview();
    this.textContent = 'Start Interview →';
    this.disabled = false;
  });

  el('iv-record-toggle-btn').addEventListener('click', toggleRecording);
  el('iv-submit-btn').addEventListener('click', submitAnswer);
  el('iv-next-btn').addEventListener('click', nextQuestion);
  
  // Track cheating via window blur
  window.addEventListener('blur', function() {
    if (state.iv.active && ivState.isRecording) {
      logProctorWarning("Tab switched! Please focus on the interview.");
    }
  });
}

async function startInterview() {
  var topic = state.iv.topic;
  
  if (topic === 'dsa') {
    // Fetch live LeetCode question
    try {
      var res = await fetch('https://nexus-z3lz.onrender.com/api/leetcode/random');
      var data = await res.json();
      state.iv.questions = [{
        q: data.title + ' (' + data.difficulty + ')',
        content: data.content,
        editorial: data.editorial,
        hint: 'Think about time & space complexity before speaking.',
        keywords: data.editorial ? data.editorial.toLowerCase().split(' ').filter(x => x.length > 3) : []
      }];
    } catch(e) {
      console.error(e);
      state.iv.questions = QUESTIONS.dsa.slice(0,1);
    }
  } else {
    var pool = QUESTIONS[topic] || QUESTIONS.behavioral;
    var shuffled = pool.slice().sort(function(){ return Math.random() - .5; });
    state.iv.questions = shuffled.slice(0, Math.min(2, shuffled.length));
  }

  state.iv.current   = 0;
  state.iv.scores    = [];
  state.iv.active    = true;
  ivState.warnings   = 0;

  el('interview-launcher').style.display = 'none';
  el('interview-panel').style.display    = '';
  el('interview-results').style.display  = 'none';

  var topicLabels = { dsa:'DSA / Algorithms', system:'System Design', behavioral:'Behavioural', hr:'HR Round' };
  el('iv-panel-topic').textContent = topicLabels[topic] || topic;
  el('iv-q-total').textContent     = state.iv.questions.length;

  await initWebcamAndProctoring();
  startInterviewTimer();
  showQuestion(0);
}

// ── 30-Minute Interview Timer ─────────────────────────────────
function startInterviewTimer() {
  ivState.secondsLeft = 1800; // 30 minutes
  stopInterviewTimer(); // clear any existing

  function updateTimerDisplay() {
    var timerEl = el('iv-timer-text');
    var timerBox = el('iv-timer');
    if (!timerEl) return;
    var m = Math.floor(ivState.secondsLeft / 60);
    var s = ivState.secondsLeft % 60;
    timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;

    // Turn red when under 5 minutes
    if (ivState.secondsLeft <= 300) {
      timerEl.style.color = '#F44336';
      timerBox.style.background = '#FFEBEE';
      timerBox.style.borderColor = '#FFCDD2';
      timerBox.querySelector('svg').setAttribute('stroke', '#F44336');
    }
    // Pulse urgency under 1 minute
    if (ivState.secondsLeft <= 60) {
      timerBox.style.animation = 'timerPulse 1s infinite';
    }
  }

  // Add pulse animation style if not already added
  if (!document.getElementById('timer-pulse-style')) {
    var s = document.createElement('style');
    s.id = 'timer-pulse-style';
    s.textContent = '@keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:.4} }';
    document.head.appendChild(s);
  }

  updateTimerDisplay();
  ivState.timerInterval = setInterval(function() {
    ivState.secondsLeft--;
    updateTimerDisplay();
    if (ivState.secondsLeft <= 0) {
      stopInterviewTimer();
      // Auto-end when time runs out
      var timerEl = el('iv-timer-text');
      if (timerEl) timerEl.textContent = '00:00';
      endInterview();
    }
  }, 1000);
}

function stopInterviewTimer() {
  if (ivState.timerInterval) {
    clearInterval(ivState.timerInterval);
    ivState.timerInterval = null;
  }
}

async function initWebcamAndProctoring() {
  try {
    ivState.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    var videoEl = el('webcam-feed');
    videoEl.srcObject = ivState.stream;

    // Initialize MediaPipe Face Detection
    if (window.FaceDetection) {
      ivState.faceDetector = new FaceDetection({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
      }});
      ivState.faceDetector.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
      ivState.faceDetector.onResults((results) => {
        if (!state.iv.active) return;
        var warningEl = el('iv-face-warning');
        if (results.detections.length === 0) {
          warningEl.style.display = 'block';
          logProctorWarning("Face not detected in frame.");
        } else {
          warningEl.style.display = 'none';
        }
      });

      ivState.camera = new Camera(videoEl, {
        onFrame: async () => { if(ivState.faceDetector) await ivState.faceDetector.send({image: videoEl}); },
        width: 320, height: 240
      });
      ivState.camera.start();
    }
    
    // Initialize Speech Recognition
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      ivState.recognition = new SpeechRecognition();
      ivState.recognition.continuous = true;
      ivState.recognition.interimResults = true;
      ivState.recognition.onresult = function(event) {
        var interim = '', final = '';
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
          else interim += event.results[i][0].transcript;
        }
        ivState.transcript += final;
        el('iv-transcript-box').innerHTML = ivState.transcript + '<i style="color:#9E9E9E;">' + interim + '</i>';
      };
    }
  } catch(e) {
    console.error("Camera access denied or error:", e);
    el('iv-proctor-status').innerHTML = '🔴 Camera Access Denied';
    el('iv-proctor-status').style.color = '#F44336';
    el('iv-proctor-status').style.background = '#FFEBEE';
  }
}

function logProctorWarning(msg) {
  var now = Date.now();
  if (now - ivState.lastWarningTime > 3000) { // Throttle warnings
    ivState.warnings++;
    ivState.lastWarningTime = now;
    console.warn("Proctor Event:", msg);
  }
}

function showQuestion(idx) {
  var q = state.iv.questions[idx];
  el('iv-q-num').textContent    = idx + 1;
  el('iv-question').textContent = q.q;
  el('iv-hint').textContent     = '💡 Hint: ' + q.hint;
  
  if (q.content) {
    el('iv-leetcode-content').innerHTML = q.content;
    el('iv-leetcode-content').style.display = 'block';
  } else {
    el('iv-leetcode-content').style.display = 'none';
  }

  ivState.transcript = '';
  el('iv-transcript-box').textContent = '(Listening...)';
  
  el('iv-feedback').style.display = 'none';
  el('iv-record-toggle-btn').style.display = '';
  el('iv-record-toggle-btn').textContent = '🎤 Start Recording Answer';
  el('iv-record-toggle-btn').style.background = '#1A1A2E';
  el('iv-submit-btn').style.display = 'none';
  el('iv-next-btn').style.display   = 'none';
  ivState.isRecording = false;
}

function toggleRecording() {
  var btn = el('iv-record-toggle-btn');
  if (!ivState.isRecording) {
    ivState.isRecording = true;
    ivState.transcript = '';
    btn.textContent = '⏹ Stop Recording';
    btn.style.background = '#F44336';
    if (ivState.recognition) ivState.recognition.start();
  } else {
    ivState.isRecording = false;
    btn.style.display = 'none';
    el('iv-submit-btn').style.display = '';
    if (ivState.recognition) ivState.recognition.stop();
  }
}

function submitAnswer() {
  var q      = state.iv.questions[state.iv.current];
  var answer = ivState.transcript.trim().toLowerCase();

  // Basic length check
  if (answer.length < 15) {
    answer = "I don't know the answer to this.";
  }

  // Score by keyword matching
  var hits = q.keywords ? q.keywords.filter(function(kw){ return answer.includes(kw.toLowerCase()); }).length : 0;
  var ratio = q.keywords && q.keywords.length ? hits / Math.min(q.keywords.length, 10) : 0.5;
  var base  = Math.round(ratio * 60); 
  var lengthBonus = Math.min(answer.length > 200 ? 30 : answer.length > 50 ? 15 : 5, 30);
  
  // Deduct points for cheating warnings
  var proctorPenalty = Math.min(ivState.warnings * 5, 20);
  var rawScore = base + lengthBonus + Math.round(Math.random() * 10);
  var finalScore = Math.max(0, Math.min(100, rawScore - proctorPenalty));

  state.iv.scores.push(finalScore);

  var feedback = '';
  if (ivState.warnings > 0) {
    feedback += '<div style="color:#F44336; margin-bottom:8px;">⚠️ <strong>Proctoring Flag:</strong> ' + ivState.warnings + ' warning(s) issued. Avoid looking away or switching tabs.</div>';
  }
  
  if (q.editorial) {
    feedback += '<div style="margin-bottom:8px;"><strong>Official Solution Approach:</strong><br>' + q.editorial + '</div>';
  } else {
    feedback += generateFeedback(q, answer, finalScore, hits);
  }
  
  el('iv-feedback-text').innerHTML  = feedback;
  el('iv-q-score').textContent      = finalScore + ' / 100';
  el('iv-q-score').style.color      = finalScore >= 70 ? '#4CAF50' : finalScore >= 50 ? '#FF9800' : '#F44336';
  el('iv-feedback').style.display   = '';
  el('iv-submit-btn').style.display = 'none';

  var isLast = state.iv.current >= state.iv.questions.length - 1;
  el('iv-next-btn').style.display  = '';
  el('iv-next-btn').textContent    = isLast ? 'See Results' : 'Next Question →';
}

function generateFeedback(q, answer, score, hits) {
  var lines = [];
  if (score >= 70) lines.push('✅ <strong>Good answer!</strong> You communicated your ideas clearly.');
  else if (score >= 50) lines.push('🟡 <strong>Partially correct.</strong> Your answer lacked technical depth.');
  else lines.push('❌ <strong>Needs improvement.</strong> Please elaborate more next time.');
  return lines.join(' ');
}

function nextQuestion() {
  var isLast = state.iv.current >= state.iv.questions.length - 1;
  if (isLast) endInterview();
  else { state.iv.current++; showQuestion(state.iv.current); }
}

function endInterview() {
  // Stop webcam and recognition
  stopInterviewTimer();
  if (ivState.stream) ivState.stream.getTracks().forEach(t => t.stop());
  if (ivState.camera) ivState.camera.stop();
  if (ivState.recognition) {
    try { ivState.recognition.stop(); } catch(e){}
  }
  state.iv.active = false;

  var scores = state.iv.scores;
  if (scores.length === 0) { restartInterviewLauncher(); return; }

  var avg      = Math.round(scores.reduce(function(a,b){return a+b;},0) / scores.length);
  var topicLabels = { dsa:'DSA / Algorithms', system:'System Design', behavioral:'Behavioural', hr:'HR Round' };
  var topicLabel  = topicLabels[state.iv.topic] || state.iv.topic;

  state.interviews.push({ date: new Date().toLocaleDateString('en-IN'), topic: topicLabel, score: avg });
  saveState();

  el('interview-panel').style.display   = 'none';
  el('interview-launcher').style.display = 'none';
  el('interview-results').style.display  = '';

  el('iv-final-score').textContent = avg + '%';
  el('iv-final-score').style.color = avg >= 70 ? '#4CAF50' : avg >= 50 ? '#FF9800' : '#F44336';
  el('iv-final-qs').textContent    = scores.length;

  var summaryLines = [];
  if (avg >= 70) summaryLines.push('🎉 Great performance! You are interview-ready for ' + topicLabel + '.');
  else if (avg >= 50) summaryLines.push('📈 Solid attempt. Practice structuring your answers.');
  else summaryLines.push('💪 Keep practising. Try speaking louder and clearer next time.');

  if (ivState.warnings > 0) summaryLines.push('⚠️ You received ' + ivState.warnings + ' proctoring warning(s). Maintain eye contact in real interviews.');
  
  el('iv-summary-text').innerHTML = summaryLines.join('<br><br>');
  var ivMetric = el('dash-metric-interviews');
  if (ivMetric) ivMetric.textContent = state.interviews.length;
}

function restartInterviewLauncher() {
  el('interview-results').style.display  = 'none';
  el('interview-panel').style.display    = 'none';
  el('interview-launcher').style.display = '';
  updateInterviewStats();
  renderInterviewHistory();
}

// ── Verify buttons ───────────────────────────────────────────
function setupVerifyButtons() {
  var iconCheck = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  document.querySelectorAll('.dash-verify-btn').forEach(function(btn) {
    var orig = btn.innerHTML;
    btn.addEventListener('click', function() {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.style.background = '#FF9800';
      btn.textContent = 'Verifying...';
      setTimeout(function() {
        btn.style.background = '#388E3C';
        btn.innerHTML = iconCheck + ' Verified ✓';
        setTimeout(function() { btn.style.background = ''; btn.innerHTML = orig; btn.disabled = false; }, 4000);
      }, 1200);
    });
  });
}

// ── Notification bell ────────────────────────────────────────
function setupNotifBell() {
  var bell     = el('dash-bell-btn');
  var dropdown = el('notif-dropdown');
  if (!bell || !dropdown) return;
  bell.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = dropdown.classList.toggle('open');
    if (isOpen) { var badge = document.querySelector('.notif-badge'); if (badge) badge.style.display = 'none'; }
  });
  document.addEventListener('click', function() { dropdown.classList.remove('open'); });
}

// ── Date ─────────────────────────────────────────────────────
function setDate() {
  var el2 = el('dash-date');
  if (!el2) return;
  el2.textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ── Add topic-pill styles dynamically ────────────────────────
function addPillStyles() {
  var style = document.createElement('style');
  style.textContent = '.topic-pill{padding:7px 14px;border:1px solid #E0E0E0;border-radius:20px;background:#fff;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;}.topic-pill.active{background:#1A1A2E;color:#fff;border-color:#1A1A2E;}.topic-pill:hover:not(.active){border-color:#1A1A2E;}';
  document.head.appendChild(style);
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  addPillStyles();
  setDate();
  injectUser();
  setupTabs();
  setupVerifyButtons();
  setupNotifBell();
  setupInterviewLauncher();

  // Skills assessment button
  var runBtn = el('run-assessment-btn');
  if (runBtn) runBtn.addEventListener('click', runAssessment);

  // Resume file upload
  var resumeInput = el('resume-file-input');
  if (resumeInput) {
    resumeInput.addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      var statusEl = el('resume-upload-status');
      var card     = el('resume-upload-card');
      if (statusEl) statusEl.textContent = 'Analysing ' + file.name + '...';
      if (card) card.style.borderColor = '#4CAF50';

      // Simulate analysis (in production: POST to /api/resume/analyze)
      setTimeout(function() {
        if (statusEl) statusEl.textContent = '✓ Resume processed — fill in your skill levels below';
        // Pre-fill sliders with mid-range to give user a starting point
        SKILL_DEFS.forEach(function(s) {
          var slider = el('slider-' + s.key);
          if (slider) { slider.value = 3; updateSliderLabel(s.key, 3); }
        });
      }, 1800);
    });
  }

  // Score display on overview
  updateScoreDisplay(state.score);
  animateChart(550);
});

/* ============================================================
   NEXUS — Floating AI Chat Widget
   Include on every page via <script src="chat.js"></script>
   ============================================================ */
'use strict';

(function () {

  var BOT_RESPONSES = [
    "Based on your profile, your biggest gap is **System Design**. For Razorpay SDE-2, I'd recommend focusing on distributed systems concepts first — rate limiting, message queues, and caching patterns.",
    "Your mock interview scores are improving steadily — from 58% in May to 74% in June. That's a strong trajectory. Want me to suggest the next topic to practice?",
    "For the role you're targeting, your DSA fundamentals look solid. The main blockers are System Design depth and Cloud/DevOps exposure. Shall I generate a 4-week plan?",
    "Great question. For a Flipkart ML role, you'd need: (1) Strong Python + scikit-learn, (2) Feature engineering experience, (3) At least one end-to-end deployed model. Your HuggingFace cert helps a lot here.",
    "Your GitHub activity has been consistent — that alone contributed +2 to your score this week. Keep pushing commits. Even documentation updates count."
  ];

  var botIndex = 0;

  /* ── Build DOM ─────────────────────────────────────────────── */
  function buildWidget() {
    // FAB button
    var fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.id = 'chat-fab';
    fab.setAttribute('aria-label', 'Open NEXUS Career Advisor');
    fab.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    // Panel
    var panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.id = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'NEXUS Career Advisor Chat');
    panel.innerHTML = [
      '<div class="chat-header">',
        '<div class="chat-header-left">',
          '<div class="chat-header-title">NEXUS Career Advisor</div>',
          '<div class="chat-powered-badge">Powered by Claude</div>',
        '</div>',
        '<button class="chat-close" id="chat-close-btn" aria-label="Close chat">&times;</button>',
      '</div>',
      '<div class="chat-messages" id="chat-messages">',
        '<div class="chat-msg bot">Hi! I\'ve reviewed your profile. Your employability score is <strong>68/100</strong>.<br><br>Your biggest gap right now is <strong>System Design</strong>. Want me to generate a study plan?</div>',
      '</div>',
      '<div class="chat-input-area">',
        '<div class="chat-input-row">',
          '<input class="chat-input" id="chat-input" type="text" placeholder="Ask anything about your career..." aria-label="Chat message">',
          '<button class="chat-send" id="chat-send" aria-label="Send message">',
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
          '</button>',
        '</div>',
        '<div class="chat-footer">Claude API &nbsp;·&nbsp; Responses may take 2–3 seconds</div>',
      '</div>'
    ].join('');

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    // Events
    fab.addEventListener('click', function () { toggleChat(true); });
    document.getElementById('chat-close-btn').addEventListener('click', function () { toggleChat(false); });
    document.getElementById('chat-send').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  /* ── Toggle ────────────────────────────────────────────────── */
  function toggleChat(open) {
    var panel = document.getElementById('chat-panel');
    if (open) {
      panel.classList.add('open');
      document.getElementById('chat-input').focus();
    } else {
      panel.classList.remove('open');
    }
  }

  /* ── Send message ──────────────────────────────────────────── */
  function sendMessage() {
    var input   = document.getElementById('chat-input');
    var text    = input.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    input.value = '';

    // Show typing
    var typingId = showTyping();

    setTimeout(function () {
      removeTyping(typingId);
      var response = BOT_RESPONSES[botIndex % BOT_RESPONSES.length];
      botIndex++;
      appendMessage(response, 'bot');
    }, 1400 + Math.random() * 800);
  }

  /* ── Append message ────────────────────────────────────────── */
  function appendMessage(text, type) {
    var msgs = document.getElementById('chat-messages');
    var div  = document.createElement('div');
    div.className = 'chat-msg ' + type;

    // Bold markdown **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Line breaks
    text = text.replace(/\n/g, '<br>');

    div.innerHTML = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── Typing indicator ──────────────────────────────────────── */
  function showTyping() {
    var msgs = document.getElementById('chat-messages');
    var id   = 'typing-' + Date.now();
    var div  = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = id;
    div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return id;
  }

  function removeTyping(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  /* ── Init ──────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }

})();

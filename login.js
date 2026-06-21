/* ============================================================
   NEXUS — Login & Signup JS
   ============================================================ */
'use strict';

var QUOTES = [
  '"Your score updated. A recruiter just searched for you."',
  '"3 students from your batch just cleared their mock interviews."',
  '"Your System Design credential was verified by a recruiter."'
];

var COLLEGES = [
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kharagpur', 'IIT Kanpur',
  'IIIT Hyderabad', 'IIIT Allahabad', 'IIIT Kota',
  'NIT Trichy', 'NIT Warangal', 'NIT Surathkal', 'NIT Calicut',
  'VIT Vellore', 'Manipal Institute of Technology', 'SRM Institute',
  'PES University', 'BITS Pilani', 'BITS Hyderabad', 'DTU Delhi', 'NSIT Delhi'
];

/* ── Rotating Quotes ────────────────────────────────────────── */
(function initQuotes() {
  var quoteEl  = document.getElementById('auth-quote-text');
  var dotsEl   = document.getElementById('auth-quote-dots');
  if (!quoteEl || !dotsEl) return;

  var current = QUOTES.findIndex(function (q) {
    return quoteEl.textContent.trim().replace(/^"/, '\u201c').replace(/"$/, '\u201d').includes(
      q.replace(/^"/, '').replace(/"$/, '')
    );
  });
  if (current < 0) current = 0;

  var dots = dotsEl.querySelectorAll('.auth-quote-dot');

  function rotateTo(idx) {
    quoteEl.classList.add('fade-out');
    setTimeout(function () {
      current = idx % QUOTES.length;
      quoteEl.textContent = QUOTES[current];
      quoteEl.classList.remove('fade-out');
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === current);
      });
    }, 400);
  }

  setInterval(function () {
    rotateTo(current + 1);
  }, 5000);
})();

/* ── Role Tabs ──────────────────────────────────────────────── */
(function initRoleTabs() {
  var tabs = document.querySelectorAll('.role-tab');
  if (!tabs.length) return;

  // Login page tabs — no field switching needed
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Signup page — switch fields
      var role = tab.getAttribute('data-role');
      var allFields = document.querySelectorAll('.role-fields');
      if (allFields.length) {
        allFields.forEach(function (f) { f.classList.remove('active'); });
        var target = document.getElementById('fields-' + role);
        if (target) target.classList.add('active');
      }
    });
  });
})();

/* ── Password Eye Toggle ────────────────────────────────────── */
(function initEyeToggles() {
  var toggles = document.querySelectorAll('.eye-toggle');
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inputId = btn.id === 'eye-login' ? 'login-password' : 'su-password';
      var input   = document.getElementById(inputId);
      if (!input) return;
      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      var svg = btn.querySelector('svg');
      if (svg) {
        svg.innerHTML = isPassword
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      }
    });
  });
})();

/* ── College Autocomplete ───────────────────────────────────── */
(function initAutocomplete() {
  var input    = document.getElementById('su-college');
  var dropdown = document.getElementById('college-dropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', function () {
    var val = input.value.toLowerCase().trim();
    if (!val) { dropdown.classList.remove('open'); return; }

    var matches = COLLEGES.filter(function (c) {
      return c.toLowerCase().includes(val);
    }).slice(0, 6);

    // Rebuild items
    dropdown.innerHTML = '';
    matches.forEach(function (college) {
      var item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = college;
      item.addEventListener('mousedown', function (e) {
        e.preventDefault();
        input.value = college;
        dropdown.classList.remove('open');
      });
      dropdown.appendChild(item);
    });

    dropdown.classList.toggle('open', matches.length > 0);
  });

  input.addEventListener('blur', function () {
    setTimeout(function () { dropdown.classList.remove('open'); }, 200);
  });
  input.addEventListener('focus', function () {
    if (input.value.length > 1) dropdown.classList.add('open');
  });
})();

/* ── Domain Chip Toggles (Mentor signup) ───────────────────── */
(function initChipToggles() {
  var chips = document.querySelectorAll('.chip-toggle');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chip.classList.toggle('selected');
    });
  });
})();

/* ── Form Submit — Real API calls ───────────────────────────── */
(function initFormSubmit() {
  var API = 'http://localhost:8000';

  function showError(formId, message) {
    var existing = document.getElementById(formId + '-error');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = formId + '-error';
    el.style.cssText = 'background:#fff5f5;border:1px solid #f44336;color:#c62828;padding:10px 14px;border-radius:6px;font-size:13px;margin-top:12px;';
    el.textContent = message;
    var form = document.getElementById(formId);
    if (form) form.appendChild(el);
  }

  function clearError(formId) {
    var el = document.getElementById(formId + '-error');
    if (el) el.remove();
  }

  // ── Login ────────────────────────────────────────────────────
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError('login-form');

      var btn      = document.getElementById('login-submit');
      var email    = document.getElementById('login-email').value.trim();
      var password = document.getElementById('login-password').value;

      if (!email || !password) {
        return showError('login-form', 'Please enter your email and password.');
      }

      btn.textContent = 'Signing in…';
      btn.disabled    = true;
      btn.style.opacity = '0.7';

      fetch(API + '/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password }),
      })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (r) {
          if (!r.ok) {
            btn.textContent = 'Log In';
            btn.disabled    = false;
            btn.style.opacity = '1';
            return showError('login-form', r.data.detail || 'Login failed. Please try again.');
          }
          // Store token + user info
          localStorage.setItem('nexus_token', r.data.access_token);
          localStorage.setItem('nexus_user',  JSON.stringify(r.data.user));
          btn.textContent = '✓ Signed in!';
          setTimeout(function () { window.location.href = 'dashboard.html'; }, 500);
        })
        .catch(function () {
          btn.textContent   = 'Log In';
          btn.disabled      = false;
          btn.style.opacity = '1';
          showError('login-form', 'Cannot reach server. Make sure the backend is running on port 8000.');
        });
    });
  }

  // ── Signup ───────────────────────────────────────────────────
  var signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError('signup-form');

      var btn  = document.getElementById('signup-submit');
      var role = (document.querySelector('.role-tab.active') || {}).getAttribute('data-role') || 'student';

      // Common fields
      var payload = {
        name:     (document.getElementById('su-name') || {}).value || '',
        email:    (document.getElementById('su-email') || {}).value || '',
        password: (document.getElementById('su-password') || {}).value || '',
        role:     role,
      };

      // Role-specific fields
      if (role === 'student') {
        payload.college = (document.getElementById('su-college') || {}).value || '';
        payload.branch  = (document.getElementById('su-branch') || {}).value || '';
        payload.year    = (document.getElementById('su-year') || {}).value || '';
      } else if (role === 'tpo') {
        payload.college     = (document.getElementById('su-tpo-college') || {}).value || '';
        payload.department  = (document.getElementById('su-department') || {}).value || '';
        payload.employee_id = (document.getElementById('su-empid') || {}).value || '';
      } else if (role === 'recruiter') {
        payload.company     = (document.getElementById('su-company') || {}).value || '';
        payload.designation = (document.getElementById('su-designation') || {}).value || '';
        payload.linkedin_url = (document.getElementById('su-linkedin') || {}).value || '';
      } else if (role === 'mentor') {
        payload.current_role = (document.getElementById('su-current-role') || {}).value || '';
        payload.company      = (document.getElementById('su-mentor-company') || {}).value || '';
        var chips = document.querySelectorAll('.chip-toggle.selected');
        payload.domain_expertise = Array.from(chips).map(function (c) { return c.textContent.trim(); }).join(',');
      }

      if (!payload.name || !payload.email || !payload.password) {
        return showError('signup-form', 'Name, email and password are required.');
      }
      if (payload.password.length < 6) {
        return showError('signup-form', 'Password must be at least 6 characters.');
      }

      btn.textContent   = 'Creating account…';
      btn.disabled      = true;
      btn.style.opacity = '0.7';

      fetch(API + '/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (r) {
          if (!r.ok) {
            btn.textContent   = 'Create Account';
            btn.disabled      = false;
            btn.style.opacity = '1';
            return showError('signup-form', r.data.detail || 'Signup failed. Please try again.');
          }

          if (r.data.email_confirmation_required) {
            btn.textContent = '✓ Check your email!';
            showError('signup-form', '📧 Please check your email and click the confirmation link before logging in.');
            return;
          }

          localStorage.setItem('nexus_token', r.data.access_token);
          localStorage.setItem('nexus_user',  JSON.stringify(r.data.user));
          btn.textContent = '✓ Account created!';
          setTimeout(function () { window.location.href = 'dashboard.html'; }, 600);
        })
        .catch(function () {
          btn.textContent   = 'Create Account';
          btn.disabled      = false;
          btn.style.opacity = '1';
          showError('signup-form', 'Cannot reach server. Make sure the backend is running on port 8000.');
        });
    });
  }
})();


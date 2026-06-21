'use strict';

/* ── Date ───────────────────────────────────────────────────── */
(function () {
  var el = document.getElementById('cred-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
})();

/* ── Copy hash buttons ──────────────────────────────────────── */
(function () {
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var hash = btn.getAttribute('data-hash');
      if (!hash) return;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(hash).then(function () { showCopied(btn); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = hash;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopied(btn);
      }
    });
  });

  function showCopied(btn) {
    btn.classList.add('copied');
    var orig = btn.innerHTML;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    setTimeout(function () {
      btn.classList.remove('copied');
      btn.innerHTML = orig;
    }, 1600);
  }
})();

/* ── Share buttons ──────────────────────────────────────────── */
(function () {
  document.querySelectorAll('.btn-share-cred').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = window.location.href.split('#')[0] + '#' + Date.now();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          var orig = btn.textContent;
          btn.textContent = 'Link Copied!';
          setTimeout(function () { btn.textContent = orig; }, 1600);
        });
      }
    });
  });
})();

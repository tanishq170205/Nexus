/* ============================================================
   NEXUS — Landing Page JS
   ============================================================ */

'use strict';

// ── Count-up animation ──────────────────────────────────────
function countUp(el, target, suffix, duration) {
  const startTime = Date.now();

  function tick() {
    const elapsed  = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── Trigger count-up on scroll into view ───────────────────
(function initCountUp() {
  const problemGrid = document.getElementById('problem-grid');
  if (!problemGrid) return;

  let triggered = false;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !triggered) {
        triggered = true;
        observer.disconnect();

        const els = problemGrid.querySelectorAll('[data-target]');
        els.forEach(function(el) {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          // Small stagger
          const delay  = parseInt(el.id.replace('count-', ''), 10) * 120;
          setTimeout(function() { countUp(el, target, suffix, 1100); }, delay);
        });
      }
    });
  }, { threshold: 0.35 });

  observer.observe(problemGrid);
})();

// ── Landing page verify button interaction ──────────────────
(function initVerifyBtn() {
  const btn = document.getElementById('verify-btn-landing');
  if (!btn) return;

  const iconSVG = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  const originalHTML = btn.innerHTML;

  btn.addEventListener('click', function() {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.style.background = '#FF9800';
    btn.innerHTML = iconSVG + ' Verifying...';

    setTimeout(function() {
      btn.style.background = '#388E3C';
      btn.innerHTML = iconSVG + ' Verified ✓';

      setTimeout(function() {
        btn.style.background = '';
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }, 3500);
    }, 1100);
  });
})();

// ── Smooth scroll for hash links ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    const id     = this.getAttribute('href');
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── Navbar scroll shadow ─────────────────────────────────────
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 8) {
      nav.style.boxShadow = '0 1px 12px rgba(0,0,0,0.07)';
    } else {
      nav.style.boxShadow = 'none';
    }
  }, { passive: true });
})();

'use strict';

/* ── Date ───────────────────────────────────────────────────── */
(function () {
  var el = document.getElementById('mentors-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
})();

/* ── Filter pills ───────────────────────────────────────────── */
(function () {
  var pills = document.querySelectorAll('.filter-pill');
  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var group = pill.getAttribute('data-group');
      // In each group, only one active at a time
      document.querySelectorAll('.filter-pill[data-group="' + group + '"]').forEach(function (p) {
        p.classList.remove('active');
      });
      pill.classList.add('active');
      applyFilters();
    });
  });

  function applyFilters() {
    var domain  = getActive('domain');
    var exp     = getActive('exp');
    var company = getActive('company');
    var avail   = getActive('avail');

    document.querySelectorAll('.mentor-card').forEach(function (card) {
      var cardDomains  = (card.getAttribute('data-domains')  || '').split(',');
      var cardCompany  = card.getAttribute('data-company')  || '';
      var cardExp      = card.getAttribute('data-exp')      || '';
      var cardAvail    = card.getAttribute('data-avail')    || '';

      var show =
        (domain  === 'all' || cardDomains.includes(domain)) &&
        (exp     === 'any' || cardExp     === exp)          &&
        (company === 'any' || cardCompany === company)      &&
        (avail   === 'any' || cardAvail   === avail);

      card.style.display = show ? '' : 'none';
    });
  }

  function getActive(group) {
    var active = document.querySelector('.filter-pill[data-group="' + group + '"].active');
    return active ? active.getAttribute('data-val') : 'all';
  }
})();

/* ── Match score tooltip ────────────────────────────────────── */
(function () {
  document.querySelectorAll('.mentor-match-pct').forEach(function (pct) {
    var id      = pct.getAttribute('data-mentor');
    var tooltip = document.getElementById('tooltip-' + id);
    if (!tooltip) return;

    pct.addEventListener('mouseenter', function () { tooltip.classList.add('visible'); });
    pct.addEventListener('mouseleave', function () { tooltip.classList.remove('visible'); });
  });
})();

/* ── Mentor profile modal ───────────────────────────────────── */
var MENTOR_DATA = {
  '1': {
    initials: 'VN', name: 'Vikram Nair', role: 'SDE-3 · Amazon · 7 years experience',
    bio: 'Amazon SDE-3 with 7 years in distributed systems and backend infrastructure. Previously at Swiggy and Thoughtworks. Helped 18 students land roles at product companies. Specialises in system design interview preparation and backend architecture patterns.',
    reviews: [
      { text: '"Vikram broke down CAP theorem in a way no YouTube video ever did. I cleared Amazon SDE-1 in my first attempt."', name: 'Student, IIT Delhi', delta: '+24 pts' },
      { text: '"The mock sessions were harder than the real interview. That\'s exactly what I needed."', name: 'Student, NIT Trichy', delta: '+19 pts' },
      { text: '"Honest, detailed feedback every session. Not just telling you what you want to hear."', name: 'Student, BITS Pilani', delta: '+21 pts' }
    ]
  },
  '2': {
    initials: 'NK', name: 'Neha Kulkarni', role: 'ML Engineer · Microsoft Research · 6 years experience',
    bio: 'ML researcher and engineer at Microsoft Research India. Published papers on NLP and recommendation systems. Passionate about helping students navigate the ML career path — from interview prep to research internships. Response rate: 100% because mentorship is a commitment.',
    reviews: [
      { text: '"Neha helped me structure my ML project to actually show business impact. That changed how I talked about it in interviews."', name: 'Student, IIIT Hyderabad', delta: '+18 pts' },
      { text: '"Clear roadmap for ML roles. No fluff, just what recruiters actually look for."', name: 'Student, VIT Vellore', delta: '+14 pts' },
      { text: '"Referred me to 2 internship opportunities. Got one. Will always be grateful."', name: 'Student, IIT Madras', delta: '+16 pts' }
    ]
  },
  '3': {
    initials: 'AB', name: 'Arjun Bose', role: 'Frontend Lead · PhonePe · 4 years experience',
    bio: 'Frontend engineer at PhonePe, leading a team building payment UX at scale. Deep expertise in React, TypeScript, and web performance optimisation. Mentors students aiming for frontend or full-stack roles at fintech and consumer-tech companies.',
    reviews: [
      { text: '"Arjun had me building real features from day one. No theory sessions — just code review and feedback."', name: 'Student, Manipal Institute', delta: '+12 pts' },
      { text: '"My GitHub got significantly stronger after 4 sessions. Arjun knows what recruiters look at."', name: 'Student, NIT Calicut', delta: '+15 pts' },
      { text: '"Straight talk about what skills actually get you hired at fintech companies."', name: 'Student, PES University', delta: '+11 pts' }
    ]
  },
  '4': {
    initials: 'SP', name: 'Shruti Patel', role: 'DevOps Lead · Flipkart · 8 years experience',
    bio: 'DevOps and cloud infrastructure lead at Flipkart\'s platform team. Manages CI/CD pipelines at massive scale. The mentor to go to if your profile is missing Cloud and DevOps exposure — the skills most students underestimate until they\'re interviewing for backend roles.',
    reviews: [
      { text: '"Shruti assigned me real infrastructure tasks every week. I now have 3 solid DevOps projects on GitHub."', name: 'Student, DTU Delhi', delta: '+22 pts' },
      { text: '"Explains AWS concepts in terms of actual production problems, not documentation."', name: 'Student, NSIT Delhi', delta: '+19 pts' },
      { text: '"Got my first cloud certification after 3 sessions. Shruti\'s structured approach made it fast."', name: 'Student, IIT Kharagpur', delta: '+17 pts' }
    ]
  },
  '5': {
    initials: 'RS', name: 'Rohan Sen', role: 'Backend SDE · Razorpay · 3 years experience',
    bio: 'Backend engineer at Razorpay building payment APIs that process millions of transactions daily. Not far removed from the student experience — interviews for the same companies you\'re targeting. Specialises in API design, microservices, and system design basics.',
    reviews: [
      { text: '"Rohan was exactly where I wanted to be 2 years ago. His advice was practical and current."', name: 'Student, IIT Bombay', delta: '+13 pts' },
      { text: '"Helped me reverse-engineer what Razorpay\'s interview loop actually tests."', name: 'Student, BITS Hyderabad', delta: '+10 pts' },
      { text: '"The feedback on my API design project made it 10x better."', name: 'Student, NIT Warangal', delta: '+12 pts' }
    ]
  },
  '6': {
    initials: 'DI', name: 'Divya Iyer', role: 'Blockchain Developer · Polygon Labs · 4 years experience',
    bio: 'Smart contract developer at Polygon, building the infrastructure behind NFT credentials and DeFi protocols. The right mentor if your final-year project involves Web3, blockchain, or on-chain verification — areas most college professors can\'t guide you on.',
    reviews: [
      { text: '"Divya helped me make my NEXUS credential feature actually work on testnet. First-hand knowledge."', name: 'Student, IIIT Allahabad', delta: '+9 pts' },
      { text: '"Web3 career path was a mystery to me. Divya mapped it out clearly."', name: 'Student, NIT Surathkal', delta: '+11 pts' },
      { text: '"Got an internship at a Web3 startup after Divya reviewed my project repo."', name: 'Student, VIT Vellore', delta: '+14 pts' }
    ]
  }
};

(function () {
  var overlay    = document.getElementById('mentor-modal-overlay');
  var modalCard  = document.getElementById('mentor-modal-card');
  var closeBtn   = document.getElementById('modal-close-btn');
  var modalContent = document.getElementById('modal-content');

  document.querySelectorAll('.view-profile-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id   = btn.getAttribute('data-mentor');
      var data = MENTOR_DATA[id];
      if (!data) return;

      modalContent.innerHTML = [
        '<div class="modal-avatar-large">' + data.initials + '</div>',
        '<div class="modal-mentor-name">' + data.name + '</div>',
        '<div class="modal-mentor-role">' + data.role + '</div>',
        '<div class="modal-bio">' + data.bio + '</div>',

        '<div class="modal-section-title">Student Reviews</div>',
        '<div class="modal-reviews">',
          data.reviews.map(function (r) {
            return [
              '<div class="review-card">',
                '<div class="review-quote">' + r.text + '</div>',
                '<div class="review-meta">' + r.name + ' <span class="score-improve-badge">' + r.delta + '</span></div>',
              '</div>'
            ].join('');
          }).join(''),
        '</div>',

        '<button class="btn btn-primary modal-book-btn" onclick="void(0)">Request Session with ' + data.name.split(' ')[0] + ' →</button>'
      ].join('');

      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();

/* ============================================================
   PLESSI — scroll choreography
   Vanilla JS · IntersectionObserver + rAF parallax
   ============================================================ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal on enter ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, [data-reveal]').forEach(function (el) { io.observe(el); });

  /* ---------- counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = (el.getAttribute('data-dec') === '1');
    var dur = 1600;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = dec ? val.toFixed(1).replace('.', ',') : Math.round(val).toLocaleString('it-IT');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = dec ? target.toFixed(1).replace('.', ',') : target.toLocaleString('it-IT');
    }
    requestAnimationFrame(tick);
  }
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if (reduce) { el.textContent = el.getAttribute('data-count'); }
    else countIO.observe(el);
  });

  /* ---------- kinetic titles: word-by-word slam-in ---------- */


  /* ---------- kinetic titles: word-by-word slam-in ---------- */
  function kineticize(root, step) {
    var idx = 0;
    function wrapNode(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var parts = ch.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'kw';
            var inner = document.createElement('span');
            inner.textContent = p;
            inner.style.transitionDelay = Math.min(idx * step, 1100) + 'ms';
            idx++;
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          wrapNode(ch);
        }
      });
    }
    wrapNode(root);
  }

  if (!reduce) {
    var kinEls = document.querySelectorAll('.hero h1, .subhero h1, h2.h2, .cta h2, .statement .big, .pill h3');
    var kinIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          kinIO.unobserve(el);
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            el.classList.add('kin-in');
          }); });
        }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -6% 0px' });
    kinEls.forEach(function (el) {
      kineticize(el, el.matches('.statement .big') ? 35 : 75);
      el.classList.remove('reveal', 'd1', 'd2', 'd3', 'd4');
      kinIO.observe(el);
    });
  }

  /* ---------- hero video: reveal only once actually playing ---------- */
  (function () {
    var hv = document.querySelector('.hero-video');
    if (!hv) return;
    function show() { if (hv.readyState >= 2 && !hv.paused) hv.classList.add('playing'); }
    hv.addEventListener('playing', show);
    hv.addEventListener('timeupdate', show);
    // if the source is missing/unplayable, stay hidden so the photo poster shows
    hv.addEventListener('error', function () { hv.classList.remove('playing'); });
    var src = hv.querySelector('source');
    if (src) src.addEventListener('error', function () { hv.classList.remove('playing'); });
  })();

  /* ---------- nav solidify ---------- */
  var nav = document.querySelector('.nav');
  function onNav() { nav.classList.toggle('solid', window.scrollY > 60); }
  onNav();

  /* ---------- progress bar ---------- */
  var prog = document.querySelector('.progress');
  function onProg() {
    var h = docEl.scrollHeight - window.innerHeight;
    var p = h > 0 ? (window.scrollY / h) * 100 : 0;
    prog.style.width = p + '%';
  }

  /* ---------- parallax (hero + about + tagged) ---------- */
  var heroMedia = document.querySelector('.hero-media');
  var aboutImg = document.querySelector('.about-media img');
  var heroInner = document.querySelector('.hero-inner');
  var divPars = document.querySelectorAll('.div-panel .par');

  function parallax() {
    var y = window.scrollY;
    if (heroMedia) {
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.32) + 'px,0) scale(' + (1 + Math.min(y / 4000, 0.12)) + ')';
    }
    if (heroInner) {
      heroInner.style.transform = 'translate3d(0,' + (y * 0.14) + 'px,0)';
      heroInner.style.opacity = String(Math.max(1 - y / 620, 0));
    }
    if (aboutImg) {
      var r = aboutImg.parentElement.getBoundingClientRect();
      var prog2 = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      var shift = (prog2 - 0.5) * -16;
      aboutImg.style.transform = 'translateY(' + shift + '%)';
    }
    if (divPars.length) {
      divPars.forEach(function (p) {
        var pr = p.parentElement.getBoundingClientRect();
        if (pr.bottom < 0 || pr.top > window.innerHeight) return;
        var prog3 = (pr.top + pr.height / 2 - window.innerHeight / 2) / window.innerHeight;
        p.style.transform = 'translate3d(0,' + (prog3 * -46) + 'px,0) scale(1.08)';
      });
    }
  }

  /* ---------- horizontal pinned projects ---------- */
  var pin = document.querySelector('.pin');
  var pinTrack = document.querySelector('.pin-track');
  var pinProg = document.querySelector('.pin-prog i');
  var isMobile = window.matchMedia('(max-width: 860px)').matches;

  function horizontal() {
    if (!pin || !pinTrack || isMobile) return;
    var rect = pin.getBoundingClientRect();
    var total = pin.offsetHeight - window.innerHeight;
    var scrolled = Math.min(Math.max(-rect.top, 0), total);
    var p = total > 0 ? scrolled / total : 0;
    var maxX = pinTrack.scrollWidth - window.innerWidth + 0;
    var pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 60;
    var dist = pinTrack.scrollWidth - window.innerWidth + pad * 1.2;
    pinTrack.style.transform = 'translate3d(' + (-dist * p) + 'px,0,0)';
    if (pinProg) pinProg.style.width = (p * 100) + '%';
  }

  /* ---------- ticker duplicate for seamless loop ---------- */
  document.querySelectorAll('.ticker-track').forEach(function (track) {
    track.innerHTML = track.innerHTML + track.innerHTML;
  });

  /* ---------- rAF loop ---------- */
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        onNav();
        onProg();
        if (!reduce) { parallax(); horizontal(); }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    isMobile = window.matchMedia('(max-width: 860px)').matches;
    onScroll();
  });
  onScroll();

  /* ---------- magnetic cursor accent on service rows (subtle) ---------- */
  document.querySelectorAll('[data-magnetic]').forEach(function (el) {
    el.addEventListener('mousemove', function (ev) {
      var r = el.getBoundingClientRect();
      var mx = ((ev.clientX - r.left) / r.width - 0.5) * 12;
      el.style.setProperty('--mx', mx + 'px');
    });
    el.addEventListener('mouseleave', function () { el.style.setProperty('--mx', '0px'); });
  });

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector('.nav-burger');
  var navLinks = document.querySelector('.nav-links');
  var navCta = document.querySelector('.nav-cta');
  var navEl = document.querySelector('.nav');
  var mobileMQ = window.matchMedia('(max-width: 900px)');

  /* On mobile, move the menu (and CTA) OUT of the fixed nav bar into <body>:
     backdrop-filter on .nav/.solid makes the bar a containing block on iOS,
     trapping the fixed full-screen menu inside the 60px bar. */
  function placeMenu() {
    if (!navLinks || !navEl) return;
    if (mobileMQ.matches) {
      if (navLinks.parentNode !== document.body) document.body.appendChild(navLinks);
      if (navCta && navCta.parentNode !== document.body) document.body.appendChild(navCta);
    } else {
      document.body.classList.remove('menu-open');
      if (navLinks.parentNode !== navEl) navEl.insertBefore(navLinks, navEl.querySelector('.nav-burger'));
      if (navCta && navCta.parentNode !== navEl) navEl.insertBefore(navCta, navEl.querySelector('.nav-burger'));
    }
  }
  placeMenu();
  if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', placeMenu);
  else window.addEventListener('resize', placeMenu);

  if (burger) {
    burger.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
  }
  document.querySelectorAll('.nav-links a, .nav-cta').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
  });
})();

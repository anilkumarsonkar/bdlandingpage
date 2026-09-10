/* ============================================================
   GLOBAL CARE HEALTH — BANGLADESH LANDING PAGE
   script.js  |  Vanilla JS interactions (no framework)
   ------------------------------------------------------------
   Features:
   1. Sticky header shadow on scroll
   2. Active nav link highlighting (scroll spy)
   3. Auto-close mobile menu on link click
   4. Scroll-reveal animations (IntersectionObserver)
   5. Animated stat counters
   6. Back-to-top button
   7. Treatment plan form validation + demo submit
   8. Video testimonial play (placeholder hook)
   9. Current year in footer
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- 1. Sticky header shadow ---------- */
    var header = document.getElementById('siteHeader');
    var onScrollHeader = function () {
      if (window.scrollY > 10) { header.classList.add('scrolled'); }
      else { header.classList.remove('scrolled'); }
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();

    /* ---------- 2. Scroll spy for active nav link ---------- */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.navbar-nav .nav-link'));
    var sections = navLinks
      .map(function (link) {
        var id = link.getAttribute('href');
        return id && id.startsWith('#') ? document.querySelector(id) : null;
      })
      .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = '#' + entry.target.id;
            navLinks.forEach(function (l) {
              l.classList.toggle('active', l.getAttribute('href') === id);
            });
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---------- 3. Auto-close mobile menu on link click ---------- */
    var navCollapse = document.getElementById('mainNav');
    if (navCollapse) {
      navCollapse.querySelectorAll('a.nav-link, .header-cta a').forEach(function (link) {
        link.addEventListener('click', function () {
          if (navCollapse.classList.contains('show') && window.bootstrap) {
            var bsCollapse = bootstrap.Collapse.getInstance(navCollapse) || new bootstrap.Collapse(navCollapse, { toggle: false });
            bsCollapse.hide();
          }
        });
      });
    }

    /* ---------- 4. Scroll-reveal animations ---------- */
    var animated = document.querySelectorAll('[data-animate]');
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = entry.target.getAttribute('data-animate-delay') || 0;
            setTimeout(function () { entry.target.classList.add('in-view'); }, parseInt(delay, 10));
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      animated.forEach(function (el) { revealObserver.observe(el); });

      /* Failsafe: if anything hasn't revealed shortly after full load
         (slow observer, tab restored, edge cases), reveal it so no
         section can ever stay invisible. */
      window.addEventListener('load', function () {
        setTimeout(function () {
          document.querySelectorAll('[data-animate]:not(.in-view)').forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight + 200) { el.classList.add('in-view'); }
          });
        }, 1200);
      });
    } else {
      animated.forEach(function (el) { el.classList.add('in-view'); });
    }

    /* ---------- 5. Animated stat counters ---------- */
    var counters = document.querySelectorAll('[data-count]');
    var animateCounter = function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1600;
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        // easeOutQuad
        var eased = 1 - (1 - progress) * (1 - progress);
        var value = Math.floor(eased * target);
        el.textContent = value.toLocaleString('en-US') + suffix;
        if (progress < 1) { requestAnimationFrame(step); }
        else { el.textContent = target.toLocaleString('en-US') + suffix; }
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window && counters.length) {
      var counterObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { counterObserver.observe(c); });
    } else {
      counters.forEach(function (c) {
        c.textContent = (parseInt(c.getAttribute('data-target'), 10) || 0).toLocaleString('en-US') + (c.getAttribute('data-suffix') || '');
      });
    }

    /* ---------- 6. Back-to-top ---------- */
    var backToTop = document.getElementById('backToTop');
    if (backToTop) {
      var toggleBackToTop = function () {
        if (window.scrollY > 500) { backToTop.classList.add('show'); }
        else { backToTop.classList.remove('show'); }
      };
      window.addEventListener('scroll', toggleBackToTop, { passive: true });
      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      toggleBackToTop();
    }

    /* ---------- 7. Treatment plan form ---------- */
    /* NOTE: This is client-side validation + a demo success message only.
       Connect the form to your CRM/ERP or an email endpoint to capture live leads.
       Example: replace the demo block with a fetch() POST to your backend. */
    /* Handles both the hero banner form (#heroLeadForm) and the full
       report-submission form (#treatmentPlanForm). */
    ['heroLeadForm', 'treatmentPlanForm'].forEach(function (formId) {
      var form = document.getElementById(formId);
      if (!form) { return; }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        form.classList.add('was-validated');

        // Basic required-field check
        var valid = form.checkValidity();
        if (!valid) {
          var firstInvalid = form.querySelector(':invalid');
          if (firstInvalid) { firstInvalid.focus(); }
          return;
        }

        // --- DEMO SUBMIT ---
        // Replace this block with a real submission, e.g.:
        // var data = new FormData(form);
        // fetch('/api/lead', { method: 'POST', body: data })...
        var successMsg = form.querySelector('.form-success');
        if (successMsg) {
          successMsg.classList.remove('d-none');
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        form.reset();
        form.classList.remove('was-validated');
      });
    });

    /* ---------- 8. Hospital slider (single row, scroll-snap, autoplay) ---------- */
    document.querySelectorAll('.hospital-slider').forEach(function (slider) {
      var track = slider.querySelector('.slider-track');
      var prev = slider.querySelector('.slider-prev');
      var next = slider.querySelector('.slider-next');
      var dotsWrap = slider.querySelector('.slider-dots');
      var items = Array.prototype.slice.call(track.querySelectorAll('.slider-item'));
      if (!track || !items.length) { return; }

      var stepWidth = function () {
        var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
        return items[0].getBoundingClientRect().width + gap;
      };
      var maxScroll = function () { return track.scrollWidth - track.clientWidth; };
      var pageCount = function () { return Math.max(1, Math.ceil(maxScroll() / stepWidth()) + 1); };

      // Dots
      var buildDots = function () {
        if (!dotsWrap) { return; }
        dotsWrap.innerHTML = '';
        var n = pageCount();
        for (var i = 0; i < n; i++) { dotsWrap.appendChild(document.createElement('span')); }
      };
      var updateUI = function () {
        var idx = Math.round(track.scrollLeft / stepWidth());
        if (dotsWrap) {
          Array.prototype.forEach.call(dotsWrap.children, function (d, i) { d.classList.toggle('active', i === idx); });
        }
        if (prev) { prev.disabled = track.scrollLeft <= 2; }
        if (next) { next.disabled = track.scrollLeft >= maxScroll() - 2; }
      };

      var go = function (dir) {
        var target = track.scrollLeft + dir * stepWidth();
        if (dir > 0 && track.scrollLeft >= maxScroll() - 2) { target = 0; }          // loop to start
        if (dir < 0 && track.scrollLeft <= 2) { target = maxScroll(); }             // loop to end
        track.scrollTo({ left: target, behavior: 'smooth' });
      };
      if (prev) { prev.addEventListener('click', function () { go(-1); restart(); }); }
      if (next) { next.addEventListener('click', function () { go(1); restart(); }); }
      track.addEventListener('scroll', updateUI, { passive: true });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { go(1); restart(); }
        if (e.key === 'ArrowLeft') { go(-1); restart(); }
      });

      // Autoplay (pauses on hover/focus/touch; respects reduced motion)
      var interval = parseInt(slider.getAttribute('data-autoplay'), 10) || 0;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var timer = null;
      var start = function () { if (interval && !reduce && !timer) { timer = setInterval(function () { go(1); }, interval); } };
      var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
      var restart = function () { stop(); start(); };
      ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { slider.addEventListener(ev, stop, { passive: true }); });
      ['mouseleave', 'focusout', 'touchend'].forEach(function (ev) { slider.addEventListener(ev, start, { passive: true }); });

      window.addEventListener('resize', function () { buildDots(); updateUI(); });
      buildDots(); updateUI(); start();
    });

    /* ---------- 9. Footer year ---------- */
    var yearEl = document.getElementById('year');
    if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

    /* ---------- 10. "Speak to a Patient Coordinator" modal ----------
       Opened ONLY by the secondary CTA buttons (data-bs-toggle="modal").
       No auto-open: the oncology landing-page strategy explicitly excludes
       pop-ups, exit-intent modals and countdown timers. */
    var leadModalEl = document.getElementById('leadModal');
    if (leadModalEl && window.bootstrap) {
      // Coordinator call-back form submit (demo)
      var popForm = document.getElementById('popupLeadForm');
      if (popForm) {
        popForm.addEventListener('submit', function (e) {
          e.preventDefault();
          popForm.classList.add('was-validated');
          if (!popForm.checkValidity()) {
            var inv = popForm.querySelector(':invalid'); if (inv) inv.focus();
            return;
          }
          // --- Connect this to your CRM/ERP lead endpoint for live leads ---
          var ok = document.getElementById('popupSuccess');
          if (ok) ok.classList.remove('d-none');
          popForm.reset();
          popForm.classList.remove('was-validated');
        });
      }
    }

    /* ---------- 11. Video testimonial modal ---------- */
    var videoModalEl = document.getElementById('videoModal');
    var videoFrame = document.getElementById('videoFrame');
    if (videoModalEl && videoFrame) {
      document.querySelectorAll('.video-play[data-video-url]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var url = btn.getAttribute('data-video-url');
          if (url) { videoFrame.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1'; }
        });
      });
      // Stop playback when the modal closes
      videoModalEl.addEventListener('hidden.bs.modal', function () { videoFrame.src = ''; });
    }

  });
})();

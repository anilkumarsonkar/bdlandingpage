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
    var form = document.getElementById('treatmentPlanForm');
    if (form) {
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
        var successMsg = document.getElementById('formSuccess');
        if (successMsg) {
          successMsg.classList.remove('d-none');
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        form.reset();
        form.classList.remove('was-validated');
        // Optionally reset the pre-filled country field
        var country = document.getElementById('country');
        if (country) country.value = 'Bangladesh';
      });
    }

    /* ---------- 9. Footer year ---------- */
    var yearEl = document.getElementById('year');
    if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

    /* ---------- 10. Banner popup lead modal (auto-open once per session) ---------- */
    var leadModalEl = document.getElementById('leadModal');
    if (leadModalEl && window.bootstrap) {
      var leadModal = new bootstrap.Modal(leadModalEl);
      var shown = false;
      try { shown = sessionStorage.getItem('gcLeadShown') === '1'; } catch (e) {}
      if (!shown) {
        setTimeout(function () {
          leadModal.show();
          try { sessionStorage.setItem('gcLeadShown', '1'); } catch (e) {}
        }, 4000); // appears 4s after load, like a typical landing-page popup
      }

      // Popup form submit (demo)
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

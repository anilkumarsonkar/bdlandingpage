/* ============================================================
   GLOBALCARE HEALTH — BANGLADESH LANDING PAGE (3 specialty variants)
   script.js  |  Vanilla JS (no framework)
   ------------------------------------------------------------
   1. Specialty variant (oncology | bmt | cardiac): labels, meta, form defaults, WhatsApp text
   2. Sticky header shadow · scroll spy · mobile menu auto-close
   3. Scroll-reveal animations
   4. Back-to-top
   5. Two-step case form: validation, thank-you screen, tracking event (no medical data)
   6. Sliders (hospitals / stories) — only visible items count
   7. Video story modal (Facebook SDK player, unmuted; iframe fallback)
   8. Bengali / English toggle (Google Translate, bn + en only)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Specialty variant ---------- */
  var SPECIALTY = document.documentElement.getAttribute('data-specialty') || 'oncology';
  var VARIANTS = {
    oncology: {
      cta: 'Get My Case Reviewed',
      ctaShort: 'Get My Case Reviewed',
      formTitle: 'Get Your Cancer Case Reviewed',
      formSub: 'Share a few details and our patient coordination team will contact you on WhatsApp within 24 hours.',
      title: 'Cancer Treatment in India for Bangladesh Patients | GlobalCare',
      description: 'Explore cancer treatment options in India for patients from Bangladesh. Get specialist and hospital coordination, indicative costs, Bengali support, visa and travel guidance.',
      wa: "Hello GlobalCare Health, I'm contacting you from Bangladesh about cancer treatment in India for [myself / a family member]. I'd like to share the medical reports and understand the next steps."
    },
    bmt: {
      cta: 'Get My Case Reviewed',
      ctaShort: 'Get My Case Reviewed',
      formTitle: 'Share Your BMT Reports',
      title: 'Bone Marrow Transplant in India for Bangladesh Patients | GlobalCare Health',
      description: 'Bone marrow transplant (BMT) and blood cancer treatment in India for patients from Bangladesh. Share your reports for a haematology/BMT team review, an indicative BMT cost in India and next steps — before you travel.',
      wa: "Hello GlobalCare Health, I'm contacting you from Bangladesh about a bone marrow transplant / blood disorder treatment in India for [myself / a family member]. I'd like to share the reports and understand the next steps."
    },
    cardiac: {
      cta: 'Get My Case Reviewed',
      ctaShort: 'Get My Case Reviewed',
      formTitle: 'Share Your Cardiac Reports',
      title: 'Heart Surgery in India for Bangladesh Patients | GlobalCare Health',
      description: 'Heart surgery in India for patients from Bangladesh — bypass (CABG), valve replacement and complex cardiac procedures. Share your angiogram and echo for a cardiac surgeon review, an indicative cost and next steps — before you travel.',
      wa: "Hello GlobalCare Health, I'm contacting you from Bangladesh about heart surgery in India for [myself / a family member]. I'd like to share the cardiac reports (angiogram / echo) and understand the next steps."
    }
  };
  var V = VARIANTS[SPECIALTY] || VARIANTS.oncology;
  var WA_NUMBER = '919211312666';

  document.addEventListener('DOMContentLoaded', function () {

    // SEO: remove the other variants' content blocks from the DOM (CSS already hides them),
    // so headings and copy contain only this variant's text. Form fields are kept so the
    // specialty selector inside the form can still switch.
    (function pruneVariants() {
      var keep = { oncology: ['v-oncology'], bmt: ['v-bmt', 'v-not-oncology'], cardiac: ['v-cardiac', 'v-not-oncology'] }[SPECIALTY] || ['v-oncology'];
      document.querySelectorAll('.v-oncology, .v-bmt, .v-cardiac, .v-not-oncology').forEach(function (el) {
        if (el.closest('#caseForm')) { return; }
        var active = keep.some(function (c) { return el.classList.contains(c); });
        if (!active && el.parentNode) { el.parentNode.removeChild(el); }
      });
      document.querySelectorAll('.hospital-card').forEach(function (card) {
        if (!card.classList.contains('h-' + SPECIALTY) && card.parentNode) { card.parentNode.removeChild(card); }
      });
    })();

    // Labels, titles, meta
    document.querySelectorAll('.js-cta-label').forEach(function (el) {
      var icon = el.querySelector('i');
      el.textContent = '';
      if (icon) { el.appendChild(icon); el.appendChild(document.createTextNode(V.cta)); }
      else { el.textContent = V.cta; }
    });
    if (V.ctaShort) { document.querySelectorAll('.js-cta-short').forEach(function (el) { el.textContent = V.ctaShort; }); }
    document.querySelectorAll('.js-form-title').forEach(function (el) { el.textContent = V.formTitle; });
    if (V.formSub) { document.querySelectorAll('.js-form-sub').forEach(function (el) { el.textContent = V.formSub; }); }
    document.title = V.title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) { metaDesc.setAttribute('content', V.description); }
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) { ogTitle.setAttribute('content', V.title); }

    // WhatsApp links: pre-filled message per specialty (secondary channel)
    var waHref = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(V.wa);
    document.querySelectorAll('.js-wa').forEach(function (a) {
      a.setAttribute('href', waHref);
      a.addEventListener('click', function () { track('whatsapp_click'); });
    });

    // Form defaults for the variant
    var specialtySelect = document.getElementById('specialty');
    var specialtyHidden = document.getElementById('specialtyVariant');
    if (specialtyHidden) { specialtyHidden.value = SPECIALTY; }
    if (specialtySelect) { specialtySelect.value = SPECIALTY; }

    // Only the active specialty's diagnosis <select> is enabled (hidden ones must not block validation)
    var applyDiagnosisField = function (sp) {
      ['oncology', 'bmt', 'cardiac'].forEach(function (k) {
        document.querySelectorAll('#caseForm .v-' + k).forEach(function (wrap) {
          var active = (k === sp);
          wrap.style.display = active ? '' : 'none';
          wrap.querySelectorAll('select, input').forEach(function (f) { f.disabled = !active; });
        });
      });
    };
    applyDiagnosisField(SPECIALTY);
    if (specialtySelect) {
      specialtySelect.addEventListener('change', function () { applyDiagnosisField(specialtySelect.value); });
    }

    /* ---------- 2. Header: shadow, scroll spy, mobile menu ---------- */
    var header = document.getElementById('siteHeader');
    var onScrollHeader = function () { if (header) { header.classList.toggle('scrolled', window.scrollY > 10); } };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();

    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.navbar-nav .nav-link'));
    var sections = navLinks.map(function (l) { var h = l.getAttribute('href'); return h && h.charAt(0) === '#' ? document.querySelector(h) : null; }).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = '#' + entry.target.id;
            navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === id); });
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { spy.observe(s); });
    }
    var navCollapse = document.getElementById('mainNav');
    if (navCollapse) {
      navCollapse.querySelectorAll('a.nav-link, .header-cta a').forEach(function (link) {
        link.addEventListener('click', function () {
          if (navCollapse.classList.contains('show') && window.bootstrap) {
            (bootstrap.Collapse.getInstance(navCollapse) || new bootstrap.Collapse(navCollapse, { toggle: false })).hide();
          }
        });
      });
    }

    /* ---------- 3. Scroll-reveal ---------- */
    var animated = document.querySelectorAll('[data-animate]');
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = parseInt(entry.target.getAttribute('data-animate-delay') || 0, 10);
            setTimeout(function () { entry.target.classList.add('in-view'); }, delay);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      animated.forEach(function (el) { revealObserver.observe(el); });
      window.addEventListener('load', function () {
        setTimeout(function () {
          document.querySelectorAll('[data-animate]:not(.in-view)').forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight + 200) { el.classList.add('in-view'); }
          });
        }, 1200);
      });
    } else {
      animated.forEach(function (el) { el.classList.add('in-view'); });
    }

    /* ---------- 4. Back-to-top ---------- */
    var backToTop = document.getElementById('backToTop');
    if (backToTop) {
      var toggleBackToTop = function () { backToTop.classList.toggle('show', window.scrollY > 500); };
      window.addEventListener('scroll', toggleBackToTop, { passive: true });
      backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      toggleBackToTop();
    }

    /* ---------- 5. Two-step case form ---------- */
    /* Tracking: ONLY generic event names are sent. Never send diagnosis, specialty,
       procedure, patient name or any medical information to Google Ads / Analytics. */
    function track(eventName) {
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: eventName });
        if (typeof window.gtag === 'function') { window.gtag('event', eventName); }
      } catch (e) {}
    }

    var form = document.getElementById('caseForm');
    if (form) {
      var step1 = form.querySelector('.form-step[data-step="1"]');
      var step2 = form.querySelector('.form-step[data-step="2"]');
      var badge = document.getElementById('formStepBadge');
      var nextBtn = document.getElementById('formNext');
      var backBtn = document.getElementById('formBack');
      var thanks = document.getElementById('formThanks');

      var validateStep = function (step) {
        var ok = true;
        step.querySelectorAll('input, select, textarea').forEach(function (f) {
          if (f.disabled) { return; }
          var valid = f.checkValidity();
          f.classList.toggle('is-invalid', !valid);
          if (!valid && ok) { ok = false; f.focus(); }
        });
        return ok;
      };
      var showStep = function (n) {
        step1.hidden = (n !== 1);
        step2.hidden = (n !== 2);
        if (badge) { badge.textContent = 'Step ' + n + ' of 2'; }
        var card = document.getElementById('share-reports');
        if (card && n === 2) { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      };
      // Clear the invalid state as the visitor fixes a field
      form.addEventListener('input', function (e) { if (e.target.classList) { e.target.classList.remove('is-invalid'); } });
      form.addEventListener('change', function (e) { if (e.target.classList) { e.target.classList.remove('is-invalid'); } });

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          if (!validateStep(step1)) { return; }
          track('case_form_step1_completed');
          showStep(2);
        });
      }
      if (backBtn) { backBtn.addEventListener('click', function () { showStep(1); }); }

      /* submitLead: POST the case (incl. reports[] files) to lead.php, which emails
         the lead to GlobalCare (enquiry@globalcarehealth.com) and keeps a backup copy. */
      var LEAD_ENDPOINT = form.getAttribute('data-endpoint') || 'lead.php';
      var submitLead = function (formEl) {
        var fd = new FormData(formEl);
        return fetch(LEAD_ENDPOINT, { method: 'POST', body: fd, credentials: 'same-origin' })
          .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }).then(function (j) { return { status: r.status, body: j }; }); })
          .then(function (res) {
            if (!res.body || res.body.ok !== true) {
              var err = new Error((res.body && res.body.error) || 'Submission failed');
              throw err;
            }
            return res.body;
          });
      };

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateStep(step2)) { return; }
        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; }
        submitLead(form).then(function () {
          track('case_form_submitted');
          var name = (document.getElementById('patientName') || {}).value || '';
          var files = document.getElementById('reports');
          var nameEl = document.getElementById('thanksName');
          if (nameEl && name.trim()) { nameEl.textContent = name.trim().split(' ')[0]; }
          var noReports = document.getElementById('thanksNoReports');
          if (noReports) { noReports.hidden = !!(files && files.files && files.files.length); }
          form.hidden = true;
          if (badge) { badge.textContent = 'Received'; }
          if (thanks) { thanks.hidden = false; }
          var card = document.getElementById('share-reports');
          if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }).catch(function (err) {
          if (submitBtn) { submitBtn.disabled = false; }
          alert((err && err.message ? err.message + ' ' : '') + 'Please try again or message us on WhatsApp.');
        });
      });
    }

    /* ---------- 6. Sliders (only visible items count) ---------- */
    document.querySelectorAll('.hospital-slider').forEach(function (slider) {
      var track_ = slider.querySelector('.slider-track');
      var prev = slider.querySelector('.slider-prev');
      var next = slider.querySelector('.slider-next');
      var dotsWrap = slider.querySelector('.slider-dots');
      if (!track_) { return; }
      var visibleItems = function () {
        return Array.prototype.filter.call(track_.querySelectorAll('.slider-item'), function (i) { return i.offsetWidth > 0; });
      };
      var stepWidth = function () {
        var items = visibleItems();
        if (!items.length) { return 1; }
        var gap = parseFloat(getComputedStyle(track_).columnGap || getComputedStyle(track_).gap) || 0;
        return items[0].getBoundingClientRect().width + gap;
      };
      var maxScroll = function () { return track_.scrollWidth - track_.clientWidth; };
      var pageCount = function () { return Math.max(1, Math.ceil(maxScroll() / stepWidth()) + 1); };
      var buildDots = function () {
        if (!dotsWrap) { return; }
        dotsWrap.innerHTML = '';
        var n = maxScroll() > 2 ? pageCount() : 0;
        for (var i = 0; i < n; i++) { dotsWrap.appendChild(document.createElement('span')); }
      };
      var updateUI = function () {
        var idx = Math.round(track_.scrollLeft / stepWidth());
        if (dotsWrap) { Array.prototype.forEach.call(dotsWrap.children, function (d, i) { d.classList.toggle('active', i === idx); }); }
        var noScroll = maxScroll() <= 2;
        if (prev) { prev.disabled = track_.scrollLeft <= 2; prev.hidden = noScroll; }
        if (next) { next.disabled = track_.scrollLeft >= maxScroll() - 2; next.hidden = noScroll; }
      };
      // Move to the next / previous item edge (works for equal and variable-width items)
      var go = function (dir) {
        var items = visibleItems();
        var cur = track_.scrollLeft;
        var base = items.length ? items[0].offsetLeft : 0;
        var target = null;
        if (dir > 0) {
          if (cur >= maxScroll() - 2) { target = 0; }
          else { for (var i = 0; i < items.length; i++) { var l = items[i].offsetLeft - base; if (l > cur + 2) { target = l; break; } } }
          if (target === null) { target = maxScroll(); }
        } else {
          if (cur <= 2) { target = maxScroll(); }
          else { for (var j = items.length - 1; j >= 0; j--) { var l2 = items[j].offsetLeft - base; if (l2 < cur - 2) { target = l2; break; } } }
          if (target === null) { target = 0; }
        }
        track_.scrollTo({ left: Math.min(target, maxScroll()), behavior: 'smooth' });
      };
      var interval = parseInt(slider.getAttribute('data-autoplay'), 10) || 0;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var timer = null;
      var start = function () { if (interval && !reduce && !timer && maxScroll() > 2) { timer = setInterval(function () { go(1); }, interval); } };
      var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
      var restart = function () { stop(); start(); };
      if (prev) { prev.addEventListener('click', function () { go(-1); restart(); }); }
      if (next) { next.addEventListener('click', function () { go(1); restart(); }); }
      track_.addEventListener('scroll', updateUI, { passive: true });
      track_.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { go(1); restart(); }
        if (e.key === 'ArrowLeft') { go(-1); restart(); }
      });
      ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { slider.addEventListener(ev, stop, { passive: true }); });
      ['mouseleave', 'focusout', 'touchend'].forEach(function (ev) { slider.addEventListener(ev, start, { passive: true }); });
      window.addEventListener('resize', function () { buildDots(); updateUI(); });
      buildDots(); updateUI(); start();
    });

    /* ---------- 7. Video story modal (Facebook player, unmuted) ----------
       Facebook's embedded player always starts MUTED when it autoplays. We render the
       video through the Facebook JS SDK and call unmute()+play() once the player is ready
       (the play-button click is a user gesture, so sound is allowed). If the SDK is
       blocked we fall back to the plain iframe embed. */
    var videoModalEl = document.getElementById('videoModal');
    var videoHolder = document.getElementById('videoHolder');
    if (videoModalEl && videoHolder) {
      var fbSdkPromise = null;
      var currentPlayer = null;
      var loadFbSdk = function () {
        if (fbSdkPromise) { return fbSdkPromise; }
        fbSdkPromise = new Promise(function (resolve) {
          if (window.FB) { resolve(window.FB); return; }
          var done = false;
          window.fbAsyncInit = function () {
            if (done) { return; }
            done = true;
            try { window.FB.init({ xfbml: false, version: 'v19.0' }); } catch (e) {}
            window.FB.Event.subscribe('xfbml.ready', function (msg) {
              if (msg && msg.type === 'video' && msg.instance) {
                currentPlayer = msg.instance;
                try { currentPlayer.unmute(); currentPlayer.play(); } catch (e) {}
              }
            });
            resolve(window.FB);
          };
          var s = document.createElement('script');
          s.src = 'https://connect.facebook.net/en_US/sdk.js';
          s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
          s.onerror = function () { if (!done) { done = true; resolve(null); } };
          document.head.appendChild(s);
          setTimeout(function () { if (!done) { done = true; resolve(null); } }, 6000);
        });
        return fbSdkPromise;
      };
      var renderFallbackIframe = function (url) {
        if (!url) { return; }
        var f = document.createElement('iframe');
        f.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'autoplay=true';
        f.setAttribute('scrolling', 'no'); f.setAttribute('frameborder', '0'); f.setAttribute('allowfullscreen', '');
        f.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture');
        f.title = 'Patient video story';
        videoHolder.innerHTML = '';
        videoHolder.appendChild(f);
      };
      document.querySelectorAll('.video-play[data-video-url], .video-play[data-fb-href]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var pluginUrl = btn.getAttribute('data-video-url');
          var fbHref = btn.getAttribute('data-fb-href');
          var ratio = btn.getAttribute('data-video-ratio') || '16x9';
          videoModalEl.classList.toggle('video-modal--portrait', ratio === '9x16');
          videoModalEl.classList.toggle('video-modal--landscape', ratio !== '9x16');
          currentPlayer = null;
          videoHolder.innerHTML = '';
          if (!fbHref) { renderFallbackIframe(pluginUrl); return; }
          var el = document.createElement('div');
          el.className = 'fb-video';
          el.setAttribute('data-href', fbHref);
          el.setAttribute('data-autoplay', 'true');
          el.setAttribute('data-allowfullscreen', 'true');
          el.setAttribute('data-show-text', 'false');
          videoHolder.appendChild(el);
          loadFbSdk().then(function (FB) {
            if (!FB) { renderFallbackIframe(pluginUrl); return; }
            try { FB.XFBML.parse(videoHolder); } catch (e) { renderFallbackIframe(pluginUrl); }
          });
        });
      });
      videoModalEl.addEventListener('hidden.bs.modal', function () {
        try { if (currentPlayer) { currentPlayer.pause(); } } catch (e) {}
        currentPlayer = null;
        videoHolder.innerHTML = '';
      });
    }

    /* ---------- 8. Bengali / English toggle (Google Translate; bn + en only) ---------- */
    var langToggle = document.getElementById('langToggle');
    if (langToggle) {
      var setActive = function (lang) {
        langToggle.querySelectorAll('.lang-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-lang') === lang); });
      };
      var readCookieLang = function () {
        var m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/(\w+)/);
        return m ? m[1] : 'en';
      };
      var setCookieLang = function (lang) {
        var val = lang === 'en' ? '' : '/en/' + lang;
        var host = location.hostname;
        var exp = lang === 'en' ? 'Thu, 01 Jan 1970 00:00:00 GMT' : '';
        document.cookie = 'googtrans=' + val + ';path=/' + (exp ? ';expires=' + exp : '');
        if (host && host.indexOf('.') > -1) { document.cookie = 'googtrans=' + val + ';path=/;domain=' + host + (exp ? ';expires=' + exp : ''); }
      };
      var gtLoaded = false;
      var loadGoogleTranslate = function () {
        if (gtLoaded) { return; }
        gtLoaded = true;
        window.googleTranslateElementInit = function () {
          try {
            new window.google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'bn,en', autoDisplay: false }, 'google_translate_element');
          } catch (e) {}
        };
        var s = document.createElement('script');
        s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        s.async = true;
        document.head.appendChild(s);
      };
      langToggle.querySelectorAll('.lang-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var lang = btn.getAttribute('data-lang');
          setCookieLang(lang);
          setActive(lang);
          // Google Translate reads the cookie on load; reload applies the language site-wide
          location.reload();
        });
      });
      var current = readCookieLang();
      setActive(current);
      if (current !== 'en') { loadGoogleTranslate(); }
    }

    /* ---------- Footer year ---------- */
    var yearEl = document.getElementById('year');
    if (yearEl) { yearEl.textContent = new Date().getFullYear(); }
  });
})();

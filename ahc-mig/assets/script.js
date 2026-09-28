/* ==========================================================================
   ALLAHABAD HIGH COURT — MIG LEGAL AID SOCIETY
   Shared interactivity — include on every page.

   Each feature below is wrapped in its own try/catch and run independently,
   so a failure in one (e.g. localStorage blocked, speechSynthesis missing)
   can never stop the others from initializing.
   ========================================================================== */
(function () {
  "use strict";

  var safeStorage = {
    get: function (key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set: function (key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } }
  };

  function run(name, fn) {
    try { fn(); } catch (e) { console.error("[MIG site] '" + name + "' failed to initialize:", e); }
  }

  /* ---------- mobile nav toggle ---------- */
  run("mobile nav toggle", function () {
    var navToggle = document.querySelector(".nav__toggle");
    var nav = document.querySelector(".nav");
    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  });

  /* ---------- "Empanelled Lawyers" dropdown — click-driven at every screen size ---------- */
  run("dropdown menu", function () {
    document.querySelectorAll(".nav__item--has-children > .nav__link").forEach(function (link) {
      var parentItem = link.closest(".nav__item--has-children");
      link.addEventListener("click", function (e) {
        // this label is a dropdown trigger only — it never navigates itself
        e.preventDefault();
        e.stopPropagation();
        var willOpen = !parentItem.classList.contains("is-expanded");
        document.querySelectorAll(".nav__item--has-children.is-expanded").forEach(function (item) {
          if (item !== parentItem) item.classList.remove("is-expanded");
        });
        parentItem.classList.toggle("is-expanded", willOpen);
        link.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });
    });

    document.addEventListener("click", function (e) {
      document.querySelectorAll(".nav__item--has-children.is-expanded").forEach(function (item) {
        if (!item.contains(e.target)) {
          item.classList.remove("is-expanded");
          var trigger = item.querySelector(".nav__link");
          if (trigger) trigger.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".nav__item--has-children.is-expanded").forEach(function (item) {
          item.classList.remove("is-expanded");
        });
      }
    });
  });

  /* ---------- site banner: photo carousel (every page) ---------- */
  run("banner carousel", function () {
    var bannerSlides = document.querySelectorAll(".banner__slide");
    var bannerDots = document.querySelectorAll(".banner__dot");
    if (bannerSlides.length > 1) {
      var bannerCurrent = 0;
      var goToBannerSlide = function (index) {
        bannerSlides[bannerCurrent].classList.remove("is-active");
        if (bannerDots[bannerCurrent]) bannerDots[bannerCurrent].classList.remove("is-active");
        bannerCurrent = index % bannerSlides.length;
        bannerSlides[bannerCurrent].classList.add("is-active");
        if (bannerDots[bannerCurrent]) bannerDots[bannerCurrent].classList.add("is-active");
      };
      var bannerTimer = setInterval(function () { goToBannerSlide(bannerCurrent + 1); }, 6000);
      bannerDots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          clearInterval(bannerTimer);
          goToBannerSlide(i);
          bannerTimer = setInterval(function () { goToBannerSlide(bannerCurrent + 1); }, 6000);
        });
      });
    }
  });

  /* ---------- accessibility toolbar: font zoom ---------- */
  run("font zoom", function () {
    var FONT_STEP_KEY = "mig-a11y-font-step";
    var fontStep = parseInt(safeStorage.get(FONT_STEP_KEY), 10) || 0;
    var MIN_STEP = -2, MAX_STEP = 4, STEP_PERCENT = 8; // each step = ±8% root font-size

    var applyFontStep = function () {
      fontStep = Math.max(MIN_STEP, Math.min(MAX_STEP, fontStep));
      document.documentElement.style.fontSize = (100 + fontStep * STEP_PERCENT) + "%";
      safeStorage.set(FONT_STEP_KEY, fontStep);
    };
    applyFontStep();

    document.querySelectorAll(".a11y-btn[data-font-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-font-step");
        if (action === "reset") { fontStep = 0; }
        else { fontStep += parseInt(action, 10); }
        applyFontStep();
      });
    });
  });

  /* ---------- accessibility toolbar: contrast (dark) mode ---------- */
  run("contrast mode", function () {
    var THEME_KEY = "mig-a11y-theme";
    var contrastBtn = document.querySelector(".a11y-btn[data-contrast-toggle]");
    var applyTheme = function (isDark) {
      document.body.classList.toggle("theme-dark", isDark);
      if (contrastBtn) {
        contrastBtn.classList.toggle("is-on", isDark);
        contrastBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
      }
    };
    applyTheme(safeStorage.get(THEME_KEY) === "on");
    if (contrastBtn) {
      contrastBtn.addEventListener("click", function () {
        var nowDark = !document.body.classList.contains("theme-dark");
        applyTheme(nowDark);
        safeStorage.set(THEME_KEY, nowDark ? "on" : "off");
      });
    }
  });

  /* ---------- accessibility toolbar: read aloud ---------- */
  run("read aloud", function () {
    var speakBtn = document.querySelector(".a11y-btn[data-speak-toggle]");
    if (!speakBtn) return;
    if (!("speechSynthesis" in window)) {
      speakBtn.disabled = true;
      speakBtn.title = "इस ब्राउज़र में उपलब्ध नहीं / Not supported in this browser";
      return;
    }
    speakBtn.addEventListener("click", function () {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speakBtn.classList.remove("is-on");
        speakBtn.setAttribute("aria-pressed", "false");
        return;
      }
      var main = document.getElementById("main");
      if (!main) return;
      var text = main.innerText || main.textContent || "";
      if (!text.trim()) return;
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = document.documentElement.lang === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.95;
      utterance.onend = function () {
        speakBtn.classList.remove("is-on");
        speakBtn.setAttribute("aria-pressed", "false");
      };
      utterance.onerror = utterance.onend;
      speakBtn.classList.add("is-on");
      speakBtn.setAttribute("aria-pressed", "true");
      window.speechSynthesis.speak(utterance);
    });
  });

  /* ---------- empanelled lawyers: civil / criminal tabs (legacy, harmless if absent) ---------- */
  run("roster tabs", function () {
    var tabs = document.querySelectorAll(".roster__tab");
    var panels = document.querySelectorAll(".roster__panel");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
        panels.forEach(function (p) { p.classList.remove("is-active"); });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        var target = document.getElementById(tab.getAttribute("aria-controls"));
        if (target) target.classList.add("is-active");
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  run("FAQ accordion", function () {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var q = item.querySelector(".faq-q");
      var a = item.querySelector(".faq-a");
      if (!q || !a) return;
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
        document.querySelectorAll(".faq-item.is-open").forEach(function (other) {
          if (other !== item) {
            other.classList.remove("is-open");
            other.querySelector(".faq-a").style.maxHeight = null;
            other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          }
        });
        if (isOpen) {
          item.classList.remove("is-open");
          a.style.maxHeight = null;
          q.setAttribute("aria-expanded", "false");
        } else {
          item.classList.add("is-open");
          a.style.maxHeight = a.scrollHeight + "px";
          q.setAttribute("aria-expanded", "true");
        }
      });
    });
  });

  /* ---------- back to top ---------- */
  run("back to top", function () {
    var backToTop = document.querySelector(".back-to-top");
    if (backToTop) {
      window.addEventListener("scroll", function () {
        backToTop.classList.toggle("is-visible", window.scrollY > 500);
      });
      backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  });
})();
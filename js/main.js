// js/main.js

/* =========================================================
   MAIN.JS — SCROLL REVEALS & GLOBAL INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll(".reveal");

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 100;

    reveals.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;

      if (elementTop < windowHeight - revealPoint) {
        el.classList.add("show");
      }
    });
  };

  // Reveal hero immediately
  revealOnScroll();

  // Reveal on scroll
  window.addEventListener("scroll", revealOnScroll);
});

/* =========================================================
   MOBILE NAV TOGGLE
   ========================================================= */

const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const mobileApplyBtn = document.getElementById("mobileApplyBtn");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
  mobileMenu.classList.toggle("open");
  menuToggle.classList.toggle("active");

  document.body.style.overflow =
    mobileMenu.classList.contains("open") ? "hidden" : "";
});
}

// Close menu when clicking a link
mobileMenu.querySelectorAll("a, button").forEach(el => {
  el.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuToggle.classList.remove("active");
    document.body.style.overflow = "";
  });
});

/* =========================================================
   FAQ ACCORDION LOGIC
   ========================================================= */

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
  const question = item.querySelector("h4");

  question.addEventListener("click", () => {
    // Close others
    faqItems.forEach(i => {
      if (i !== item) i.classList.remove("active");
    });

    // Toggle current
    item.classList.toggle("active");
  });
});

/* =========================================================
   PRIZE COUNT + TEXT SCRAMBLE
   ========================================================= */

const prizesSection = document.querySelector("#prizes");
let prizesAnimated = false;

const scrambleText = (el, finalText, duration = 1000) => {
  const chars = "!<>-_\\/[]{}—=+*^?#________";
  let frame = 0;
  const totalFrames = Math.floor(duration / 15);

  const scramble = () => {
    frame++;
    const progress = frame / totalFrames;

    let output = finalText
      .split("")
      .map((char, i) => {
        if (i < progress * finalText.length) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");

    el.textContent = output;

    if (frame < totalFrames) {
      requestAnimationFrame(scramble);
    } else {
      el.textContent = finalText;
    }
  };

  scramble();
};

const animatePrizes = () => {
  if (prizesAnimated) return;
  prizesAnimated = true;

  // 🔢 Number counters
  document.querySelectorAll("[data-count]").forEach(counter => {
    const target = +counter.dataset.count;
    const prefix = counter.dataset.prefix || "";
    const suffix = counter.dataset.suffix || "";

    let start = 0;
    const duration = 2800;
    const startTime = performance.now();

    const update = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * target);

      counter.textContent =
        prefix + start.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent =
          prefix + target.toLocaleString() + suffix;
      }
    };

    requestAnimationFrame(update);
  });

  // 🔤 Text scramble
  document.querySelectorAll("#prizes p[data-text]").forEach(p => {
    scrambleText(p, p.dataset.text);
  });
};

const observer = new IntersectionObserver(
  entries => {
    if (entries[0].isIntersecting) {
      animatePrizes();
      observer.disconnect();
    }
  },
  { threshold: 0.4 }
);

if (prizesSection) observer.observe(prizesSection);




document.addEventListener("DOMContentLoaded", () => {
  const backToTop = document.getElementById("backToTop");

  if (!backToTop) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 600) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});


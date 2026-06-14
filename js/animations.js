// js/animations.js
const aboutBg = document.querySelector(".about-bg");

if (aboutBg) {
  window.addEventListener("scroll", () => {
    const offset = window.scrollY * 0.05;
    aboutBg.style.transform = `translateY(${offset}px)`;
  });
}



// Rotate MrBeast ring (attached)
const beastRing = document.querySelector(".beast-ring");

if (beastRing) {
  window.addEventListener("scroll", () => {
    beastRing.style.transform = `rotate(${window.scrollY * 0.25}deg)`;
  });
}

// Crew scroll reveal
const crew = document.querySelectorAll(".crew-member");

const crewObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.3 }
);

crew.forEach((m) => crewObserver.observe(m));


// Fade + rise on scroll
const ultimate = document.querySelector(".ultimate-content");

window.addEventListener("scroll", () => {
  const rect = ultimate.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  if (rect.top < windowHeight) {
    ultimate.style.transform = "translateY(0)";
    ultimate.style.opacity = "1";
  }
});

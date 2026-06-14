//js/apply.js

/* =========================================================
   APPLY.JS — MODAL CONTROL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const applyBtns = [
    document.getElementById("applyBtn"),
    document.getElementById("navApplyBtn"),
    document.getElementById("finalApplyBtn"),
    document.getElementById("mobileApplyBtn"),
    document.getElementById("ultimateApplyBtn")
  ];

  const modal = document.getElementById("applyModal");
  const closeBtn = document.getElementById("closeModal");

  // ---------- OPEN MODAL ----------
  applyBtns.forEach(btn => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden"; // lock background scroll
    });
  });

  // ---------- CLOSE MODAL ----------
  const closeModal = () => {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  };

  closeBtn.addEventListener("click", closeModal);

  // Click outside modal-content closes modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
});

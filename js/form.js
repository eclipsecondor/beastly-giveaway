//js/form.js

import { supabase } from './supabaseClient.js'
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("applyForm");
  const steps = form.querySelectorAll(".form-step");
  const nextBtn = form.querySelector(".next-step");

  let currentStep = 0;

  const validateCurrentStep = () => {
    const inputs = steps[currentStep].querySelectorAll("input, select");
    for (let input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return false;
      }
    }
    return true;
  };

  const goToStep = (index) => {
    const current = steps[currentStep];
    const next = steps[index];

    current.classList.add("exit-left");

    setTimeout(() => {
      current.classList.remove("active", "exit-left");
      next.classList.add("active");
      currentStep = index;
    }, 300);
  };

  nextBtn.addEventListener("click", () => {
    if (!validateCurrentStep()) return;
    goToStep(1);
  });

  form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateCurrentStep()) return;

  const formData = new FormData(form);

  const data = {
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    age: parseInt(formData.get("age")),
    country: formData.get("country"),
    gender: formData.get("gender"),
  };

  const { error } = await supabase
    .from("users")
    .insert([data]);

  if (error) {
  console.error(error);

  if (error.message.includes("duplicate key")) {
    alert("You have already applied with this email.");
  } else {
    alert("Something went wrong. Try again.");
  }

  return;
}

  // SUCCESS UI
  form.innerHTML = `
    <div style="text-align:center;padding:3rem">
      <h2>Application Submitted 🎉</h2>
      <p>Thank you for applying.<br>Await approval via email.</p>
    </div>
  `;
});
});


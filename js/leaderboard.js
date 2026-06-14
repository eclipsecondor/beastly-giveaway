// js/leaderboard.js

import { supabase } from "./supabaseClient.js";

// =========================
// ELEMENTS
// =========================

const leaderboardList =
  document.getElementById("leaderboardList");

const totalParticipants =
  document.getElementById("totalParticipants");

const totalVotes =
  document.getElementById("totalVotes");

const searchInput =
  document.getElementById("leaderboardSearch");

const filterButtons =
  document.querySelectorAll(".filter-btn");

// SPOTLIGHT
const spotlightName =
  document.getElementById("spotlightName");

const spotlightRank =
  document.getElementById("spotlightRank");

const spotlightVotes =
  document.getElementById("spotlightVotes");

const spotlightPercent =
  document.getElementById("spotlightPercent");

const spotlightProgress =
  document.getElementById("spotlightProgress");

const spotlightProfile =
  document.getElementById("spotlightProfile");

// =========================
// STATE
// =========================

let leaderboardData = [];

let filteredData = [];

let currentFilter = "All";

// =========================
// LOAD LEADERBOARD
// =========================

async function loadLeaderboard() {

const { data, error } = await supabase
  .from("users")
  .select(`
    id,
    full_name,
    votes_count
  `)
  .eq("status", "active")
  .order("votes_count", {
    ascending: false
  });

  if (error) {
    console.error(error);
    return;
  }

  leaderboardData = data || [];

  if (!leaderboardData.length) {

    leaderboardList.innerHTML = `
      <div class="empty-state">
        No active participants found.
      </div>
    `;

    return;
  }

  filteredData = leaderboardData;

  updateGlobalStats();

  renderLeaderboard(filteredData);

  // auto select first user
  if (filteredData.length > 0) {
    selectParticipant(filteredData[0], 0);
  }

}

// =========================
// GLOBAL STATS
// =========================

function updateGlobalStats() {

  totalParticipants.textContent =
    leaderboardData.length;

  const votes = leaderboardData.reduce(
    (sum, user) =>
      sum + (user.votes_count || 0),
    0
  );

  totalVotes.textContent =
    votes.toLocaleString();

}

// =========================
// RENDER LIST
// =========================

function renderLeaderboard(users) {

  leaderboardList.innerHTML = "";

  users.forEach((user, index) => {

    const row =
      document.createElement("div");

    row.className =
      "leaderboard-row";

    row.innerHTML = `
      <div class="lb-left">

        <span class="lb-rank">
          #${index + 1}
        </span>

        <span class="lb-name">
          ${user.full_name || "Participant"}
        </span>

      </div>

      <div class="lb-right">

        <span class="lb-votes">
          ${user.votes_count || 0} pts
        </span>

      </div>
    `;

    // CLICK
    row.addEventListener("click", () => {

      // remove active
      document
        .querySelectorAll(".leaderboard-row")
        .forEach(el =>
          el.classList.remove("active")
        );

      row.classList.add("active");

      selectParticipant(user, index);

    });

    leaderboardList.appendChild(row);

  });

}

// =========================
// SPOTLIGHT
// =========================

function selectParticipant(user, rankIndex) {

  // SAVE CURRENT USER
  selectedParticipantId = user.id;

  spotlightName.textContent =
    user.full_name || "Participant";

  spotlightRank.textContent =
    `Rank #${rankIndex + 1}`;

  spotlightVotes.textContent =
    user.votes_count || 0;

  // progress %
  const highestVotes =
    leaderboardData[0]?.votes_count || 1;

  const percent =
    Math.min(
      (
        (user.votes_count || 0)
        / highestVotes
      ) * 100,
      100
    );

  spotlightPercent.textContent =
    `${Math.round(percent)}%`;

  spotlightProgress.style.width =
    `${percent}%`;

  // PROFILE BUTTON
  spotlightProfile.onclick = () => {

    window.location.href =
      `profile.html?id=${user.id}`;

  };

}

// =========================
// SEARCH
// =========================

searchInput.addEventListener(
  "input",
  () => {

    const value =
      searchInput.value.toLowerCase();

    filteredData =
      leaderboardData.filter(user =>
        (user.full_name || "")
          .toLowerCase()
          .includes(value)
      );

    applyCurrentFilter();

  }
);

// =========================
// FILTERS
// =========================

filterButtons.forEach(btn => {

  btn.addEventListener("click", () => {

    filterButtons.forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    currentFilter =
      btn.textContent.trim();

    applyCurrentFilter();

  });

});

// =========================
// APPLY FILTER
// =========================

function applyCurrentFilter() {

  let data = [...filteredData];

  if (currentFilter === "Top 10") {
    data = data.slice(0, 10);
  }

  if (currentFilter === "Top 50") {
    data = data.slice(0, 50);
  }

  renderLeaderboard(data);

}

// =========================
// INIT
// =========================

loadLeaderboard();

// =========================
// SUPPORT MODAL ELEMENTS
// =========================

const voteModal =
  document.getElementById("voteModal");

const closeVoteModal =
  document.getElementById("closeVoteModal");

const supportBtn =
  document.getElementById("spotlightSupport");

const voteForm =
  document.getElementById("voteForm");

const voteStatus =
  document.getElementById("voteStatus");

const voteSubmitBtn =
  document.getElementById("voteSubmitBtn");

// FILES
const proofFile =
  document.getElementById("voteProofFile");

const cameraFile =
  document.getElementById("voteCameraFile");

const votePreview =
  document.getElementById("votePreview");

// =========================
// CURRENT SELECTED USER
// =========================

let selectedParticipantId = null;

// =========================
// OPEN MODAL
// =========================

supportBtn.addEventListener(
  "click",
  () => {

    if (!selectedParticipantId) return;

    voteModal.classList.remove("hidden");

    document.body.style.overflow = "hidden";

  }
);

// =========================
// CLOSE MODAL
// =========================

closeVoteModal.addEventListener(
  "click",
  () => {

    voteModal.classList.add("hidden");

    document.body.style.overflow = "auto";

  }
);

// CLOSE OUTSIDE
voteModal.addEventListener(
  "click",
  (e) => {

    if (e.target === voteModal) {

      voteModal.classList.add("hidden");

      document.body.style.overflow =
        "auto";

    }

  }
);

// =========================
// FILE PREVIEW
// =========================

function showFile(file) {

  if (!file) return;

  votePreview.textContent =
    `Selected: ${file.name}`;

}

proofFile.addEventListener(
  "change",
  () => {

    showFile(proofFile.files[0]);

  }
);

cameraFile.addEventListener(
  "change",
  () => {

    showFile(cameraFile.files[0]);

  }
);

// =========================
// SUBMIT VOTE
// =========================

voteForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    voteStatus.textContent = "";

    voteSubmitBtn.disabled = true;

    voteSubmitBtn.textContent =
      "Submitting...";

    const formData =
      new FormData(voteForm);

    // =========================
    // FILE UPLOAD
    // =========================

    const selectedFile =
      proofFile.files[0]
      || cameraFile.files[0];

    let uploadedUrl = null;

    if (selectedFile) {

      const fileName =
        `${Date.now()}-${selectedFile.name}`;

      const { error: uploadError } =
        await supabase.storage
          .from("proofs")
          .upload(fileName, selectedFile);

      if (uploadError) {

        console.error(uploadError);

        voteStatus.textContent =
          "Image upload failed.";

        voteSubmitBtn.disabled =
          false;

        voteSubmitBtn.textContent =
          "Submit Vote";

        return;

      }

      const { data: publicData } =
        supabase.storage
          .from("proofs")
          .getPublicUrl(fileName);

      uploadedUrl =
        publicData.publicUrl;

    }

    // =========================
    // SEND TO SERVER
    // =========================

    try {

      const res = await fetch(
        "/submit-vote",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            userId:
              selectedParticipantId,

            reason:
              formData.get("reason"),

            referral_code:
              formData.get(
                "referral_code"
              ),

            amount:
              parseInt(
                formData.get("amount")
              ) || 25,

            proof_file_url:
              uploadedUrl

          })

        }
      );

      const result =
        await res.json();

      // =========================
      // FAILED
      // =========================

      if (!result.success) {

        voteStatus.textContent =
          result.message;

        voteSubmitBtn.disabled =
          false;

        voteSubmitBtn.textContent =
          "Submit Vote";

        return;

      }

      // =========================
      // SUCCESS
      // =========================

      voteForm.innerHTML = `
        <div class="success-box">

          <h2>
            Vote Submitted ✔
          </h2>

          <p>
            Your support is under review.
          </p>

        </div>
      `;

    }

    catch (err) {

      console.error(err);

      voteStatus.textContent =
        "Network error. Try again.";

      voteSubmitBtn.disabled =
        false;

      voteSubmitBtn.textContent =
        "Submit Vote";

    }

  }
);
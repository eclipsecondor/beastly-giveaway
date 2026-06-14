// js/profile.js

import { supabase } from "./supabaseClient.js";

// GET USER ID FROM URL
const params = new URLSearchParams(window.location.search);

const profileId = params.get("id");

if (!profileId) {
  window.location.href = "index.html";
}

// LOAD PROFILE
async function loadProfile() {

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error || !user) {
    console.error(error);

    document.body.innerHTML = `
      <div style="
        color:white;
        padding:40px;
        font-family:sans-serif;
      ">
        Participant not found.
      </div>
    `;

    return;
  }

  if (user.status !== "active") {

  document.body.innerHTML = `
    <div style="
      color:white;
      padding:40px;
      font-family:sans-serif;
      text-align:center;
    ">
      <h2>Participant Unavailable</h2>

      <p>
        This participant is not currently active.
      </p>
    </div>
  `;

  return;
}

  console.log("PROFILE USER:", user);

  // LOAD LEADERBOARD RANKS
const { data: leaderboard } = await supabase
  .from("users")
  .select("id, full_name, votes_count")
  .eq("status", "active")
  .order("votes_count", { ascending: false });

// FIND RANK
const rank =
  leaderboard.findIndex(u => u.id === user.id) + 1;

// DISPLAY RANK
document.getElementById("profileRank").textContent =
  `Rank #${rank}`;

// BADGE
const badge = document.getElementById("profileBadge");

if (rank === 1) {

  badge.textContent = "👑 #1 PARTICIPANT";

  badge.classList.add("gold-badge");

}
else if (rank <= 10) {

  badge.textContent = "🔥 TOP 10";

  badge.classList.add("top10-badge");

}
else if (rank <= 50) {

  badge.textContent = "⭐ TOP 50";

  badge.classList.add("top50-badge");

}
else {

  badge.textContent = "🎯 PARTICIPANT";

}


// LOAD USER VOTES
const { data: votes } = await supabase
  .from("votes")
  .select("*")
  .eq("user_id", user.id);

// FILTERS
const approvedVotes =
  votes.filter(v => v.status === "approved");

const pendingVotes =
  votes.filter(v => v.status === "pending");

// TOTAL APPROVED POINTS
const totalVotes =
  approvedVotes.reduce((sum, v) => {
    return sum + (v.amount || 0);
  }, 0);

// SUPPORTERS COUNT
const supporters =
  approvedVotes.length;

// APPROVAL RATE
const approvalRate =
  votes.length
    ? Math.round(
        (approvedVotes.length / votes.length) * 100
      )
    : 0;

// DISPLAY
document.getElementById("statVotes").textContent =
  totalVotes;

document.getElementById("statPending").textContent =
  pendingVotes.length;

document.getElementById("statSupporters").textContent =
  supporters;

document.getElementById("statRate").textContent =
  `${approvalRate}%`;

  // NAME
  document.getElementById("profileName").textContent =
    user.full_name;

  // POINTS
  document.getElementById("profileVotes").textContent =
    user.votes_count || 0;

    // GET TARGET USERS
const top1User = leaderboard[0];
const top10User = leaderboard[9];
const top50User = leaderboard[49];

// CURRENT USER POINTS
const currentVotes = user.votes_count || 0;

// TARGET POINTS
const top1Votes = top1User?.votes_count || 1;
const top10Votes = top10User?.votes_count || 1;
const top50Votes = top50User?.votes_count || 1;

// PERCENTAGES
const top50Percent = Math.min(
  100,
  Math.round((currentVotes / top50Votes) * 100)
);

const top10Percent = Math.min(
  100,
  Math.round((currentVotes / top10Votes) * 100)
);

const top1Percent = Math.min(
  100,
  Math.round((currentVotes / top1Votes) * 100)
);

// UPDATE UI
document.getElementById("top50Bar").style.width =
  `${top50Percent}%`;

document.getElementById("top10Bar").style.width =
  `${top10Percent}%`;

document.getElementById("top1Bar").style.width =
  `${top1Percent}%`;

document.getElementById("top50Text").textContent =
  `${top50Percent}%`;

document.getElementById("top10Text").textContent =
  `${top10Percent}%`;

document.getElementById("top1Text").textContent =
  `${top1Percent}%`;

  // LOAD RECENT ACTIVITY
const { data: recentVotes } = await supabase
  .from("votes")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(10);

const feed = document.getElementById("activityFeed");

feed.innerHTML = "";

// EMPTY STATE
if (!recentVotes || recentVotes.length === 0) {

  feed.innerHTML = `
    <div class="activity-item">
      <div class="activity-title">
        No public activity yet
      </div>
    </div>
  `;

}
else {

  recentVotes.forEach(vote => {

    let statusText = "";
    let pointsText = "";

    // STATUS
    if (vote.status === "approved") {

      statusText =
        "Support vote approved";

      pointsText =
        `+${vote.amount || 0} points`;

    }
    else if (vote.status === "pending") {

      statusText =
        "Support vote pending review";

      pointsText =
        `${vote.amount || 0} pending points`;

    }
    else {

      statusText =
        "Vote submission rejected";

      pointsText =
        `${vote.amount || 0} rejected points`;
    }

    const item = document.createElement("div");

    item.className = "activity-item";

    item.innerHTML = `
      <div class="activity-title">
        ${statusText}
      </div>

      <div class="activity-meta">
        ${new Date(vote.created_at).toLocaleString()}
      </div>

      <div class="activity-points">
        ${pointsText}
      </div>
    `;

    feed.appendChild(item);

  });

}

const preview = document.getElementById(
  "leaderboardPreview"
);

preview.innerHTML = "";

// FIND CURRENT USER POSITION
const currentIndex =
  leaderboard.findIndex(u => u.id === user.id);

// GET USERS AROUND CURRENT USER
const start = Math.max(0, currentIndex - 2);

const end = Math.min(
  leaderboard.length,
  currentIndex + 3
);

const nearbyUsers =
  leaderboard.slice(start, end);

// RENDER
nearbyUsers.forEach((item, i) => {

  const actualRank = start + i + 1;

  const row = document.createElement("a");

row.href =
  `profile.html?id=${item.id}`;

  row.className = "preview-row";

  // highlight current profile
  if (item.id === user.id) {
    row.classList.add("me");
  }

  row.innerHTML = `
    <div class="preview-left">

      <span class="preview-rank">
        #${actualRank}
      </span>

      <span class="preview-name">
        ${item.full_name || "Participant"}
      </span>

    </div>

    <div class="preview-right">

      <span class="preview-points">
        ${item.votes_count || 0} pts
      </span>

    </div>
  `;

  preview.appendChild(row);

});

}

loadProfile();

// MODAL
const voteModal =
  document.getElementById("voteModal");

// BUTTONS
const supportBtn =
  document.getElementById("supportBtn");

const navSupportBtn =
  document.getElementById("navSupportBtn");

const footerSupportBtn =
  document.getElementById("footerSupportBtn");

const closeVoteModal =
  document.getElementById("closeVoteModal");

// OPEN MODAL
function openVoteModal() {
  voteModal.classList.remove("hidden");

  document.body.style.overflow = "hidden";
}

// CLOSE MODAL
function closeModal() {
  voteModal.classList.add("hidden");

  document.body.style.overflow = "auto";
}

// EVENTS
supportBtn?.addEventListener(
  "click",
  openVoteModal
);

navSupportBtn?.addEventListener(
  "click",
  openVoteModal
);

footerSupportBtn?.addEventListener(
  "click",
  openVoteModal
);

closeVoteModal?.addEventListener(
  "click",
  closeModal
);

// CLICK OUTSIDE
voteModal?.addEventListener(
  "click",
  (e) => {

    if (e.target === voteModal) {
      closeModal();
    }

  }
);

// SHARE ELEMENTS
const shareLink =
  document.getElementById("shareLink");

const copyShareBtn =
  document.getElementById("copyShareBtn");

const nativeShareBtn =
  document.getElementById("nativeShareBtn");

const shareBtn =
  document.getElementById("shareBtn");

// CURRENT PROFILE URL
const currentProfileUrl =
  window.location.href;

// SHOW URL IN INPUT
shareLink.value = currentProfileUrl;

// COPY LINK
copyShareBtn?.addEventListener(
  "click",
  async () => {

    try {

      await navigator.clipboard.writeText(
        currentProfileUrl
      );

      copyShareBtn.textContent =
        "Copied ✔";

      setTimeout(() => {

        copyShareBtn.textContent =
          "Copy";

      }, 2000);

    }
    catch (err) {

      console.error(err);

    }

  }
);

// NATIVE SHARE
async function nativeShare() {

  try {

    await navigator.share({
      title: "Support this participant",
      text: "Check out this participant profile",
      url: currentProfileUrl
    });

  }
  catch (err) {

    console.error(err);

  }

}

// BUTTONS
nativeShareBtn?.addEventListener(
  "click",
  nativeShare
);

shareBtn?.addEventListener(
  "click",
  nativeShare
);

const userId =
  params.get("id");

  // FORM
const voteForm =
  document.getElementById("voteForm");

const voteStatus =
  document.getElementById("voteStatus");

const submitBtn =
  document.getElementById("voteSubmitBtn");

// FILES
const proofFile =
  document.getElementById("voteProofFile");

const cameraFile =
  document.getElementById("voteCameraFile");

const preview =
  document.getElementById("votePreview");

  // FILE PREVIEW
function showFile(file) {

  if (!file) return;

  preview.textContent =
    `Selected: ${file.name}`;
}

proofFile?.addEventListener(
  "change",
  () => {

    showFile(
      proofFile.files[0]
    );

  }
);

cameraFile?.addEventListener(
  "change",
  () => {

    showFile(
      cameraFile.files[0]
    );

  }
);

voteForm?.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    voteStatus.textContent = "";

    submitBtn.disabled = true;

    submitBtn.textContent =
      "Submitting...";

    const formData =
      new FormData(voteForm);

    // FILE
    const selectedFile =
      proofFile.files[0]
      || cameraFile.files[0];

    let uploadedUrl = null;

    // ========================
    // UPLOAD FILE
    // ========================

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

        submitBtn.disabled = false;

        submitBtn.textContent =
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

    // ========================
    // SEND TO BACKEND
    // ========================

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

            userId: userId,

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

      // FAILED
      if (!result.success) {

        voteStatus.textContent =
          result.message;

        submitBtn.disabled = false;

        submitBtn.textContent =
          "Submit Vote";

        return;
      }

      // SUCCESS
      voteForm.innerHTML = `
  <div class="success-box">

    <h2>
      Vote Submitted ✔
    </h2>

    <p>
      Your support for this participant
      is now under review.
    </p>

  </div>
`;

// CLOSE AFTER 3s
setTimeout(() => {

  closeModal();

}, 5000);

    }
    catch (err) {

      console.error(err);

      voteStatus.textContent =
        "Network error. Try again.";

      submitBtn.disabled = false;

      submitBtn.textContent =
        "Submit Vote";
    }

  }
);

const notificationBtn =
document.getElementById(
"notificationBtn"
);

const notificationDropdown =
document.getElementById(
"notificationDropdown"
);

notificationBtn
.addEventListener(
"click",
()=>{

notificationDropdown
.classList.toggle(
"hidden"
);

}
);

document.addEventListener(
"click",
(e)=>{

if(
!e.target.closest(
".notification-wrapper"
)
){

notificationDropdown
.classList.add(
"hidden"
);

}

});



const notificationList =
document.getElementById(
"notificationList"
);

const notificationCount =
document.getElementById(
"notificationCount"
);

let currentUserId = userId;

loadNotifications();

subscribeNotifications();


// ======================
// LOAD NOTIFICATIONS
// ======================

async function loadNotifications(){

const {

data,
error

}=await supabase

.from(
"notifications"
)

.select("*")

.eq(
"user_id",
currentUserId
)

.order(
"created_at",
{
ascending:false
}
);

if(error){

console.error(error);

return;

}


// ======================
// SUMMARY UI ONLY
// ======================

const unreadCount =
data.filter(
n => !n.is_read
).length;


// badge count
notificationCount.textContent =
unreadCount;


// hide if zero
notificationCount.style.display =
unreadCount > 0
? "flex"
: "none";


// clear old content
notificationList.innerHTML = "";


// no notifications
if(!data.length){

notificationList.innerHTML = `

<div class="notification-empty">

No notifications yet

</div>

`;

return;

}


// summary card
notificationList.innerHTML = `

<div class="notification-summary">

<h4>
🔔 Notifications
</h4>

<p>

You have

<strong>
${unreadCount}
</strong>

unread notification${
unreadCount === 1 ? "" : "s"
}.

</p>

<button
id="openDashboardNotifications"
class="open-dashboard-btn"
>

Open Dashboard

</button>

</div>

`;


// button action
document
.getElementById(
"openDashboardNotifications"
)

.addEventListener(
"click",
()=>{

window.location.href =
`dashboard.html?userId=${userId}`;

}
);


}



// ======================
// REALTIME
// ======================

function subscribeNotifications(){

supabase

.channel(
"user_notifications"
)

.on(

"postgres_changes",

{

event:"INSERT",

schema:"public",

table:
"notifications",

filter:
`user_id=eq.${currentUserId}`

},

(payload)=>{

loadNotifications();

}

)

.subscribe();

}
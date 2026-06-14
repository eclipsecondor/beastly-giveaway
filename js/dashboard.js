import { supabase } from "./supabaseClient.js";

let userId = localStorage.getItem(
  "dashboard_user_id"
);

let currentUserId = null;


const dashboardGate =
document.getElementById(
  "dashboardGate"
);

const dashboardAccessForm =
document.getElementById(
  "dashboardAccessForm"
);

const dashboardEmail =
document.getElementById(
  "dashboardEmail"
);

const dashboardGateStatus =
document.getElementById(
  "dashboardGateStatus"
);


// ======================
// CHECK ACCESS
// ======================

async function checkDashboardAccess(){

// already saved

if(userId){

dashboardGate.style.display = "none";

loadUser();

return;

}

// show gate

dashboardGate
.classList.remove(
  "hidden"
);

}


// ======================
// LOGIN FORM
// ======================

dashboardAccessForm
.addEventListener(
"submit",

async (e) => {

e.preventDefault();

const dashboardSubmitBtn =
dashboardAccessForm.querySelector(
"button"
);

// loading state

dashboardSubmitBtn.disabled = true;

dashboardSubmitBtn.textContent =
"Please wait...";

dashboardGateStatus.textContent =
"Checking...";

try{

const email =
dashboardEmail.value
.trim()
.toLowerCase();


// find user

const {

data,
error

} = await supabase

.from("users")

.select("*")

.eq("email", email)

.single();


// not found

if(error || !data){

dashboardGateStatus.textContent =
"No participant found with this email.";

dashboardSubmitBtn.disabled = false;

dashboardSubmitBtn.textContent =
"Continue";

return;

}


// ======================
// APPLICATION STATUS
// ======================

if(data.status === "pending"){

dashboardGateStatus.innerHTML = `
Your application is still under review.

<br><br>

Please wait while our team reviews your submission.

<br><br>

You cannot access the participant dashboard until your application has been approved.
`;

dashboardSubmitBtn.disabled = false;

dashboardSubmitBtn.textContent =
"Continue";

return;

}


if(data.status === "rejected"){

dashboardGateStatus.innerHTML = `
Your application was not approved.

<br><br>

If you believe your submission was misunderstood or reviewed incorrectly,
please contact support through live chat.

<br><br>

Our team can review your case again if necessary.
`;

dashboardSubmitBtn.disabled = false;

dashboardSubmitBtn.textContent =
"Continue";

return;

}

if(data.status === "active"){

localStorage.setItem(
"dashboard_user_id",
data.id
);

userId = data.id;

dashboardGateStatus.textContent =
"Success ✔";

dashboardSubmitBtn.textContent =
"Opening...";

dashboardGate.style.display =
"none";

await loadUser();

return;

}

if(data.status !== "approved"){

dashboardGateStatus.textContent =
"Unable to verify account status.";

dashboardSubmitBtn.disabled = false;

dashboardSubmitBtn.textContent =
"Continue";

return;

}

// ======================
// CHECK ACTIVATION
// ======================

const {
  data: activation
} = await supabase
  .from("activations")
  .select("*")
  .eq("user_id", data.id)
  .order("created_at", {
    ascending: false
  })
  .limit(1)
  .maybeSingle();

  if(!activation){

dashboardGateStatus.innerHTML = `
Your application has been approved.

<br><br>

The final activation step has not been completed yet.

<br><br>

Activate your account here:

<br>

<a href="/pages/activate.html?userId=${data.id}"
target="_blank">

Open Activation Page

</a>

<br><br>

Participant ID:
${data.id}
`;

dashboardSubmitBtn.disabled = false;

dashboardSubmitBtn.textContent =
"Continue";

return;

}

if(
activation.status ===
"pending"
){

const submittedDate =
new Date(
activation.created_at
).toLocaleString();

dashboardGateStatus.innerHTML = `
Your activation is currently under review.

<br><br>

Submitted:
${submittedDate}

<br><br>

If this process is taking unusually long,
please contact support through live chat.
`;

dashboardSubmitBtn.disabled = false;

dashboardSubmitBtn.textContent =
"Continue";

return;

}


if(
activation.status ===
"rejected"
){

const rejectedDate =
new Date(
activation.created_at
).toLocaleDateString();

dashboardGateStatus.innerHTML = `
Your activation was not approved.

<br><br>

Decision Date:
${rejectedDate}

<br><br>

If you believe your application was
misunderstood or reviewed incorrectly,
please contact support through live chat.
`;

dashboardSubmitBtn.disabled = false;

dashboardSubmitBtn.textContent =
"Continue";

return;

}

if(
activation.status !==
"approved"
){
return;
}


// save user

localStorage.setItem(
"dashboard_user_id",
data.id
);

userId = data.id;


// success UI

dashboardGateStatus.textContent =
"Success ✔";

dashboardSubmitBtn.textContent =
"Opening...";


// hide gate

dashboardGate.style.display = "none";

// load dashboard

await loadUser();

}
catch(err){

console.error(err);

dashboardGateStatus.textContent =
"Something went wrong.";

dashboardSubmitBtn.disabled = false;

dashboardSubmitBtn.textContent =
"Continue";

}

});

async function loadUser() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  // NAV + HERO
  document.getElementById("navName").textContent = data.full_name;
  document.getElementById("navStatus").textContent = data.status;
  document.getElementById("heroName").textContent = data.full_name;
  document.getElementById("voteCount").textContent = data.votes_count || 0;

  // STATS CARDS
  document.getElementById("cardVotes").textContent = data.votes_count || 0;
  document.getElementById("cardStatus").textContent = data.status;

  // 🔥 NOW PASS DATA CORRECTLY
  calculateRanking(data);



  loadLeaderboard(data.id);

  console.log("USER STATUS:", data.status);


  // =========================
// SHARE PROFILE
// =========================

const dashboardShareLink =
  document.getElementById(
    "dashboardShareLink"
  );

const copyDashboardShareBtn =
  document.getElementById(
    "copyDashboardShareBtn"
  );

const nativeDashboardShareBtn =
  document.getElementById(
    "nativeDashboardShareBtn"
  );

const openPublicProfileBtn =
  document.getElementById(
    "openPublicProfileBtn"
  );

// PROFILE URL
const profileUrl =
  `${window.location.origin}/pages/profile.html?id=${data.id}`;

// INPUT
dashboardShareLink.value =
  profileUrl;

// COPY
copyDashboardShareBtn
  .addEventListener(
    "click",
    async () => {

      await navigator.clipboard
        .writeText(profileUrl);

      copyDashboardShareBtn.textContent =
        "Copied ✔";

      setTimeout(() => {

        copyDashboardShareBtn.textContent =
          "Copy";

      }, 2000);

    }
  );

// NATIVE SHARE
nativeDashboardShareBtn
  .addEventListener(
    "click",
    async () => {

      try {

        await navigator.share({

          title:
            `${data.full_name}'s Profile`,

          text:
            "Support my campaign.",

          url: profileUrl

        });

      }

      catch (err) {

        console.log(err);

      }

    }
  );

// OPEN PUBLIC PROFILE
openPublicProfileBtn
  .addEventListener(
    "click",
    () => {

      window.open(
        profileUrl,
        "_blank"
      );

    }
  );



  loadVoteHistory();
  loadVoteAnalytics();
  // ======================
// INIT NOTIFICATIONS
// ======================

currentUserId = userId;

loadNotifications();

subscribeNotifications();
}

checkDashboardAccess();


async function calculateRanking(currentUser) {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, votes_count")
    .eq("status", "active")
    .order("votes_count", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const index = data.findIndex(u => u.id === currentUser.id);
  const rank = index + 1;

  // 🧠 ABOVE & BELOW USERS
  const above = data[index - 1] || null;
  const below = data[index + 1] || null;

  // 🎯 UPDATE RANK
  document.getElementById("rank").textContent = `#${rank}`;
  document.getElementById("cardRank").textContent = `#${rank}`;

  // 📊 PROGRESS
  const topVotes = data[0]?.votes_count || 1;
  const userVotes = currentUser.votes_count || 0;

  const percent = Math.min((userVotes / topVotes) * 100, 100);

  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressText").textContent =
    `${Math.floor(percent)}% to top position`;

  // 🧮 NEED TO NEXT
  let need = 0;

  if (above) {
    need = (above.votes_count || 0) - userVotes;
  }

  document.getElementById("needNext").textContent =
    need > 0 ? `+${need}` : "Top 🎉";

  // 🔥 COMPETITION UI

  // ABOVE USER
  if (above) {
    document.querySelector("#aboveUser .comp-name").textContent =
      above.full_name;

    document.querySelector("#aboveUser .comp-points").textContent =
      `${above.votes_count || 0} pts`;

    document.querySelector("#aboveUser .comp-diff").textContent =
      `+${need} to beat`;
  } else {
    document.querySelector("#aboveUser .comp-name").textContent =
      "You're #1 🎉";

    document.querySelector("#aboveUser .comp-points").textContent =
      "Top position";

    document.querySelector("#aboveUser .comp-diff").textContent =
      "No one ahead";
  }

  // BELOW USER
  if (below) {
    const lead = userVotes - (below.votes_count || 0);

    document.querySelector("#belowUser .comp-name").textContent =
      below.full_name;

    document.querySelector("#belowUser .comp-points").textContent =
      `${below.votes_count || 0} pts`;

    document.querySelector("#belowUser .comp-diff").textContent =
      `${lead} ahead`;
  } else {
    document.querySelector("#belowUser .comp-name").textContent =
      "Last position";

    document.querySelector("#belowUser .comp-points").textContent =
      "--";

    document.querySelector("#belowUser .comp-diff").textContent =
      "No one below";
  }

  // total users
const totalUsers = data.length;

// people behind
const behind = totalUsers - (index + 1);

// targets
const top1Votes = data[0]?.votes_count || 0;
const top10Votes = data[9]?.votes_count || 0;
const top50Votes = data[49]?.votes_count || 0;

const currentVotes = currentUser.votes_count || 0;

// calculations
const toTop1 = Math.max(top1Votes - currentVotes, 0);
const toTop10 = Math.max(top10Votes - currentVotes, 0);
const toTop50 = Math.max(top50Votes - currentVotes, 0);

// update UI
document.getElementById("behindCount").textContent = behind;
document.getElementById("toTop1").textContent = toTop1 === 0 ? "🔥 Leader" : `+${toTop1}`;
document.getElementById("toTop10").textContent = toTop10 === 0 ? "Inside 🎉" : `+${toTop10}`;
document.getElementById("toTop50").textContent = toTop50 === 0 ? "Qualified ✅" : `+${toTop50}`;

updateNotice(currentUser, rank, need);
}

async function loadLeaderboard(currentUserId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, votes_count")
    .eq("status", "active")
    .order("votes_count", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("leaderboardList");
  container.innerHTML = "";

  data.forEach((user, index) => {
    let rankClass = "";

if (index === 0) {
  rankClass = "rank-1";
} else if (index < 10) {
  rankClass = "rank-top10";
} else if (index < 50) {
  rankClass = "rank-top50";
}
    const row = document.createElement("a");

row.href = `profile.html?id=${user.id}`;

row.className = `leaderboard-row ${rankClass}`;

    // highlight current user
    if (user.id === currentUserId) {
      row.classList.add("me");
    }

    row.innerHTML = `
      <div class="lb-left">
        <span class="lb-rank">#${index + 1}</span>
        <span class="lb-name">${user.full_name}</span>
      </div>

      <div class="lb-right">
        <span class="lb-votes">${user.votes_count || 0}</span>
        <span class="lb-vote">
  Profile
</span>
      </div>
    `;

    container.appendChild(row);
  });
}

async function loadVoteHistory() {

  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("voteHistoryList");

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = `
      <div class="history-empty">
        No votes yet
      </div>
    `;
    return;
  }

  data.forEach(vote => {

    const div = document.createElement("div");
    div.className = "vote-item";

    div.innerHTML = `
      <div class="vote-left">

        <span class="vote-amount">
          +${vote.amount} Points
        </span>

        <span class="vote-date">
          ${new Date(vote.created_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </span>

      </div>

      <div class="vote-status ${vote.status}">
        ${vote.status.toUpperCase()}
      </div>
    `;

    container.appendChild(div);

  });
}

function updateNotice(user, rank, need) {
  const banner = document.getElementById("noticeBanner");
  const text = document.getElementById("noticeText");

  banner.className = "notice"; // reset

  // 🧠 STATUS BASED
  if (user.status === "activation_pending") {
    banner.classList.add("warning");
    text.textContent =
      "Your activation is under review. You’ll be ranked once approved.";
  }

  else if (user.status === "approved" || user.status === "active") {
    banner.classList.add("success");

    if (rank === 1) {
      text.textContent =
        "You are currently #1 🎉 Maintain your position to win the grand prize.";
    }

    else if (rank <= 10) {
      text.textContent =
        `🔥 You're in Top 10! Only +${need} points to climb higher.`;
    }

    else if (rank <= 50) {
      text.textContent =
        `You're in Top 50. Push harder — only +${need} points to move up.`;
    }

    else {
      text.textContent =
        `You're ranked #${rank}. Gain +${need} points to move up.`;
    }
  }

  else if (user.status === "rejected") {
    banner.classList.add("danger");
    text.textContent =
      "Your activation was rejected. Please resubmit with valid proof.";
  }

  else {
    banner.classList.add("info");
    text.textContent = "Welcome. Start earning points to climb the leaderboard.";
  }

  banner.classList.remove("hidden");
}

const voteBtn = document.getElementById("voteBtn");
const voteModal = document.getElementById("voteModal");
const closeVoteModal = document.getElementById("closeVoteModal");

// OPEN MODAL
voteBtn.addEventListener("click", () => {
  voteModal.classList.remove("hidden");
});

// CLOSE MODAL
closeVoteModal.addEventListener("click", () => {
  voteModal.classList.add("hidden");
});

// CLOSE WHEN CLICKING OUTSIDE
voteModal.addEventListener("click", (e) => {
  if (e.target === voteModal) {
    voteModal.classList.add("hidden");
  }
});

const voteProofFile = document.getElementById("voteProofFile");
const voteCameraFile = document.getElementById("voteCameraFile");
const votePreview = document.getElementById("votePreview");

function showVoteFile(file) {
  if (!file) return;

  votePreview.textContent = `Selected: ${file.name}`;
}

// upload button
voteProofFile.addEventListener("change", () => {
  showVoteFile(voteProofFile.files[0]);
});

// camera button
voteCameraFile.addEventListener("change", () => {
  showVoteFile(voteCameraFile.files[0]);
});


const voteForm = document.getElementById("voteForm");
const voteStatus = document.getElementById("voteStatus");
const submitBtn = document.getElementById("voteSubmitBtn");

const proofFile = document.getElementById("voteProofFile");
const cameraFile = document.getElementById("voteCameraFile");
const preview = document.getElementById("votePreview");

// userId (target you're voting for)
let targetUserId = null;

// 👉 call this when opening modal
window.openVoteModal = (userId) => {
  targetUserId = userId;
  document.getElementById("voteModal").classList.remove("hidden");
};

// preview
function showFile(file) {
  if (!file) return;
  preview.textContent = `Selected: ${file.name}`;
}

proofFile.addEventListener("change", () => {
  showFile(proofFile.files[0]);
});

cameraFile.addEventListener("change", () => {
  showFile(cameraFile.files[0]);
});

voteForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  voteStatus.textContent = "";

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {

    const formData = new FormData(voteForm);

    // =========================
    // 📸 FILE UPLOAD
    // =========================

    const selectedFile =
      proofFile.files[0] ||
      cameraFile.files[0];

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

    // =========================
    // 📡 SEND REQUEST
    // =========================

    console.log("SENDING VOTE...");

    const res = await fetch(
      "/submit-vote",
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          userId: currentUserId,

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

    console.log("RESPONSE:", res);

    const result =
      await res.json();

    console.log("RESULT:", result);

    // =========================
    // ❌ FAILED
    // =========================

    if (!result.success) {

      voteStatus.textContent =
        result.message ||
        "Submission failed.";

      submitBtn.disabled = false;

      submitBtn.textContent =
        "Submit Vote";

      return;

    }

// =========================
// ✅ SUCCESS
// =========================

voteStatus.innerHTML = `

  <div class="vote-success-box">

    <h3>
      Vote Submitted ✔
    </h3>

    <p>
      Your vote is under review.
    </p>

  </div>

`;

voteForm.reset();

preview.textContent =
  "No file selected";

submitBtn.disabled = false;

submitBtn.textContent =
  "Submit Vote";

// reload history
loadVoteHistory();

loadVoteAnalytics();

// auto close
setTimeout(() => {

  voteModal.classList.add(
    "hidden"
  );

}, 10000);

  }

  catch (err) {

    console.error(
      "VOTE ERROR:",
      err
    );

    voteStatus.textContent =
      "Server/network error.";

    submitBtn.disabled = false;

    submitBtn.textContent =
      "Submit Vote";

  }

});


async function loadVoteAnalytics() {

  const { data, error } = await supabase
    .from("votes")
    .select("amount, status")
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    return;
  }

  let approved = 0;
  let pending = 0;
  let rejected = 0;

  data.forEach(vote => {

    const amount = Number(vote.amount) || 0;

    if (vote.status === "approved") {
      approved += amount;
    }

    else if (vote.status === "pending") {
      pending += amount;
    }

    else if (vote.status === "rejected") {
      rejected += amount;
    }

  });

  document.getElementById("approvedPoints").textContent = approved;

  document.getElementById("pendingPoints").textContent = pending;

  document.getElementById("rejectedPoints").textContent = rejected;

  document.getElementById("totalVotesCount").textContent = data.length;
}

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


// unread count

const unreadCount=

data.filter(
n=>!n.is_read
).length;

notificationCount
.textContent=
unreadCount;


// hide badge if 0

notificationCount.style.display=

unreadCount>0
? "flex"
: "none";


// clear old items

notificationList.innerHTML="";


// empty

if(!data.length){

notificationList.innerHTML=`

<div
class="notification-empty">

No notifications

</div>

`;

return;

}


// render

data.forEach(
notification=>{

const div=
document.createElement(
"div"
);

div.className=
"notification-item";

if(
!notification.is_read
){

div.style.border=
"1px solid #ff2f5d";

}

div.innerHTML=`

<h5>

${notification.title}

</h5>

<p>

${notification.message}

</p>

<small>

${new Date(
notification.created_at
).toLocaleString()}

</small>

`;


// click → mark read

div.onclick=
()=>markAsRead(
notification.id
);

notificationList
.appendChild(
div
);

});

console.log(data);
console.log("notification system loaded");
console.log("CURRENT USER:", currentUserId);
console.log("NOTIFICATIONS:", data);
console.log("URL USER ID:", userId);
}


// ======================
// MARK AS READ
// ======================

async function markAsRead(
id
){

await supabase

.from(
"notifications"
)

.update({

is_read:true

})

.eq(
"id",
id
);

loadNotifications();

}


// ======================
// REALTIME
// ======================
let notificationChannel = null;

function subscribeNotifications(){

// remove old channel

if(notificationChannel){

supabase.removeChannel(
notificationChannel
);

}

// create new one

notificationChannel = supabase

.channel(
"user_notifications"
)

.on(

"postgres_changes",

{

event:"INSERT",

schema:"public",

table:"notifications",

filter:`user_id=eq.${currentUserId}`

},

(payload)=>{

console.log(
"NEW NOTIFICATION:",
payload
);

loadNotifications();

}

)

.subscribe();

}

const logoutBtn =
document.getElementById(
"logoutBtn"
);

logoutBtn
.addEventListener(
"click",
()=>{

localStorage.removeItem(
"dashboard_user_id"
);

location.reload();

});
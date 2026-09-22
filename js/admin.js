//js/admin.js
import { supabase } from "./supabaseClient.js";

const isLoggedIn =
localStorage.getItem(
  "adminLoggedIn"
);

if (!isLoggedIn) {

  window.location.href =
    "admin-login";

}

const adminLogoutBtn =
document.getElementById(
  "adminLogoutBtn"
);

adminLogoutBtn?.addEventListener(
  "click",
  () => {

    localStorage.removeItem(
      "adminLoggedIn"
    );

    window.location.href =
      "admin-login";

  }
);


let currentTab = "pending";
let voteFilter = "pending";

const container = document.getElementById("usersContainer");

async function loadUsers() {
  const { data, error } = await supabase
  .from("users")
  .select("*")
  .eq("status", currentTab);

  if (error) {
    console.error(error);
    return;
  }

  console.log("USERS:", data);

  container.innerHTML = "";

  data.forEach(user => {
    const div = document.createElement("div");
    div.className = "user-card";

    div.innerHTML = `
  <div class="user-header">
    <h3>${user.full_name}</h3>
    <span class="status ${user.status}">${user.status}</span>
  </div>

  <div class="user-info">
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Age:</strong> ${user.age}</p>
    <p><strong>Country:</strong> ${user.country}</p>
    <p><strong>Gender:</strong> ${user.gender}</p>
  </div>

  <div class="actions">
    <button class="btn approve" data-id="${user.id}">Approve</button>
    <button class="btn reject" data-id="${user.id}">Reject</button>
  </div>
`;

    container.appendChild(div);
  });
}

loadUsers();

async function loadAllUsers() {

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    container.innerHTML = `
      <p>${error.message}</p>
    `;

    return;
  }

  container.innerHTML = "";

  for (const user of data) {

    // GET USER VOTES
    const { data: votes } = await supabase
      .from("votes")
      .select("amount,status")
      .eq("user_id", user.id);

    // COUNTS
    const approvedVotes =
      votes
        ?.filter(v => v.status === "approved")
        .reduce((sum, v) =>
          sum + (v.amount || 0), 0)
      || 0;

    const pendingVotes =
      votes
        ?.filter(v => v.status === "pending")
        .reduce((sum, v) =>
          sum + (v.amount || 0), 0)
      || 0;

    const rejectedVotes =
      votes
        ?.filter(v => v.status === "rejected")
        .reduce((sum, v) =>
          sum + (v.amount || 0), 0)
      || 0;

    // CARD
    const div =
      document.createElement("div");

    div.className = "user-card";

    div.innerHTML = `

      <div class="user-header">

        <h3>
          ${user.full_name || "Participant"}
        </h3>

        <span class="status ${user.status}">
          ${user.status}
        </span>

      </div>

      <div class="user-info">

        <p>
          <strong>User ID:</strong>
          ${user.id}
        </p>

        <p>
          <strong>Email:</strong>
          ${user.email || "-"}
        </p>

        <p>
          <strong>Age:</strong>
          ${user.age || "-"}
        </p>

        <p>
          <strong>Country:</strong>
          ${user.country || "-"}
        </p>

        <p>
          <strong>Gender:</strong>
          ${user.gender || "-"}
        </p>

        <p>
          <strong>Approved Points:</strong>
          ${approvedVotes}
        </p>

        <p>
          <strong>Pending Points:</strong>
          ${pendingVotes}
        </p>

        <p>
          <strong>Rejected Points:</strong>
          ${rejectedVotes}
        </p>

        <p>
          <strong>Total Stored Points:</strong>
          ${user.votes_count || 0}
        </p>

        <p>
          <strong>Joined:</strong>
          ${new Date(
            user.created_at
          ).toLocaleString()}
        </p>

      </div>

      <div class="actions">

        <button
          class="btn open-profile"
          data-id="${user.id}"
        >
          Open Profile
        </button>

        <button
          class="btn notify-global-user"
          data-id="${user.id}"
        >
          🔔 Notify
        </button>

      </div>

    `;

    container.appendChild(div);

  }

}

const tabs = document.querySelectorAll(".tab");

const voteSubTabs = document.getElementById("voteSubTabs");

tabs.forEach(tab => {

  tab.addEventListener("click", () => {

    tabs.forEach(t =>
      t.classList.remove("active")
    );

    tab.classList.add("active");

    currentTab =
      tab.dataset.tab;
      
      // HIDE MODALS WHEN SWITCHING TABS

    notificationModal?.classList.add(
      "hidden"
    );

    emailModal?.classList.add(
      "hidden"
    );

    voteSubTabs.classList.add(
      "hidden"
    );

    container.innerHTML = "";

    // =========================
    // VOTES
    // =========================

    if (currentTab === "votes") {

      voteSubTabs.classList.remove(
        "hidden"
      );

      loadVotes();

      return;

    }

    // =========================
    // ACTIVATIONS
    // =========================

    if (
      currentTab === "activations"
    ) {

      loadActivations();

      return;

    }

    // =========================
    // ALL USERS
    // =========================

    if (
      currentTab === "all-users"
    ) {

      loadAllUsers();

      return;

    }

    // =========================
    // NOTIFICATIONS
    // =========================

    if (
      currentTab === "notifications"
    ) {

      notificationModal
        .classList.remove(
          "hidden"
        );

      return;

    }

    // =========================
// EMAILS
// =========================

if (
  currentTab === "emails"
) {

  emailModal
    .classList.remove(
      "hidden"
    );

  return;

}

// =========================
// 💼 EMPLOYMENT
// =========================

if (
  currentTab === "employment"
) {

  loadEmploymentApplications();

  return;

}

    // =========================
    // PENDING / APPROVED /
    // REJECTED USERS
    // =========================

    loadUsers();

  });

});

async function loadActivations() {
  const { data, error } = await supabase
    .from("activations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
  container.innerHTML = `<p>${error.message}</p>`;
  console.error(error);
  return;
}

  container.innerHTML = "";

  for (const item of data) {
    // fetch linked user manually
    const { data: user } = await supabase
      .from("users")
      .select("full_name,email")
      .eq("id", item.user_id)
      .single();

    const div = document.createElement("div");
    div.className = "user-card";

    div.innerHTML = `
      <div class="user-header">
        <h3>${user?.full_name || "Unknown User"}</h3>
        <span class="status ${item.status}">${item.status}</span>
      </div>

      <div class="user-info">
        <p><strong>Email:</strong> ${user?.email || "-"}</p>
        <p><strong>Points:</strong> ${item.amount_points}</p>
        <p><strong>Referral:</strong> ${item.referral_code || "None"}</p>
        <p><strong>Reason:</strong> ${item.reason}</p>
      </div>

      ${
        item.proof_file_url
          ? `<img src="${item.proof_file_url}" class="proof-img" style="width:160px;border-radius:8px;margin-top:12px;">`
          : ""
      }

      <div class="actions">
        <button class="btn approve-activation"
  data-id="${item.id}"
  data-user="${item.user_id}"
  ${item.status !== "pending" ? "disabled" : ""}>
  Approve
</button>

        <button class="btn reject-activation"
  data-id="${item.id}"
  ${item.status !== "pending" ? "disabled" : ""}>
  Reject
</button>

        <button class="btn notify-user"
          data-id="${item.id}"
          data-user="${item.user_id}">
          🔔 Notify
        </button>
      </div>
    `;

    container.appendChild(div);
  }
}

async function updateUserStatus(userId, newStatus) {
  const { data, error } = await supabase
    .from("users")
    .update({ status: newStatus })
    .eq("id", userId)
    .select()
    .single(); // 👈 IMPORTANT (returns updated user)

  if (error) {
    console.error(error);
    alert("Failed to update user.");
    return;
  }

  // 🚀 SEND EMAIL ONLY IF APPROVED
  if (
  newStatus === "approved" ||
  newStatus === "rejected"
) {
    try {
await fetch(
  "/send-application-status-email",
  {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json"
    },
    body: JSON.stringify({
      email: data.email,
      userId: data.id,
      name: data.full_name,
      status: newStatus
    })
  }
);
    } catch (err) {
      console.error("Email failed:", err);
    }
  }

  loadUsers();
}

async function approveActivation(activationId, userId) {
  // get activation row first
  const { data: activation, error: fetchError } = await supabase
    .from("activations")
    .select("*")
    .eq("id", activationId)
    .single();

  if (fetchError) {
    console.error(fetchError);
    alert("Failed to fetch activation.");
    return;
  }

  // mark activation approved
  await supabase
    .from("activations")
    .update({ status: "approved" })
    .eq("id", activationId);

  // update user → active + add points
  await supabase
    .from("users")
    .update({
      status: "active",
      votes_count: activation.amount_points
    })
    .eq("id", userId);

  alert("Participant activated successfully.");

  loadActivations();
}

async function rejectActivation(activationId) {
  // get activation row first
  const { data: activation, error: fetchError } = await supabase
    .from("activations")
    .select("*")
    .eq("id", activationId)
    .single();

  if (fetchError) {
    console.error(fetchError);
    alert("Failed to fetch activation.");
    return;
  }

  // reject activation
  await supabase
    .from("activations")
    .update({ status: "rejected" })
    .eq("id", activationId);

  // move user back to approved stage
  await supabase
    .from("users")
    .update({ status: "approved" })
    .eq("id", activation.user_id);

  alert("Activation rejected.");

  loadActivations();
}

async function notifyActivationUser(activationId) {
  // get activation
  const { data: activation, error: actError } = await supabase
    .from("activations")
    .select("*")
    .eq("id", activationId)
    .single();

  if (actError) {
    console.error(actError);
    alert("Failed to load activation.");
    return;
  }

  // get user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", activation.user_id)
    .single();

  if (userError) {
    console.error(userError);
    alert("Failed to load user.");
    return;
  }

  try {
    await fetch("/send-activation-status-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: user.email,
        name: user.full_name,
        userId: user.id,
        status: activation.status
      })
    });

    alert("Notification sent.");
  } catch (err) {
    console.error(err);
    alert("Email failed.");
  }
}

document.addEventListener("click", async (e) => {

  // =========================
  // 🔥 SUB TAB FILTER
  // =========================
  if (e.target.classList.contains("sub-tab")) {
    document.querySelectorAll(".sub-tab")
      .forEach(btn => btn.classList.remove("active"));

    e.target.classList.add("active");

    voteFilter = e.target.dataset.filter;
    loadVotes();
    return;
  }

  // =========================
  // 👤 USER ACTIONS
  // =========================
  if (e.target.classList.contains("approve")) {
    const userId = e.target.dataset.id;
    const userName = e.target.closest(".user-card").querySelector("h3").textContent;

    if (!confirm(`Approve ${userName}?`)) return;

    await updateUserStatus(userId, "approved");
    return;
  }

  if (e.target.classList.contains("reject")) {
    const userId = e.target.dataset.id;
    const userName = e.target.closest(".user-card").querySelector("h3").textContent;

    if (!confirm(`Reject ${userName}?`)) return;

    await updateUserStatus(userId, "rejected");
    return;
  }

  // =========================
  // ⚡ ACTIVATIONS
  // =========================
  if (e.target.classList.contains("approve-activation")) {
    const activationId = e.target.dataset.id;
    const linkedUserId = e.target.dataset.user;

    if (!confirm("Approve activation?")) return;

    await approveActivation(activationId, linkedUserId);
    return;
  }

  if (e.target.classList.contains("reject-activation")) {
    const activationId = e.target.dataset.id;

    if (!confirm("Reject activation?")) return;

    await rejectActivation(activationId);
    return;
  }

  if (e.target.classList.contains("notify-user")) {
    const activationId = e.target.dataset.id;

    if (!confirm("Send notification?")) return;

    await notifyActivationUser(activationId);
    return;
  }

   // =========================
  // 👤 OPEN PROFILE
  // =========================

  if (
    e.target.classList.contains(
      "open-profile"
    )
  ) {

    const userId =
      e.target.dataset.id;

    window.open(
      `/profile?id=${userId}`,
      "_blank"
    );

    return;

  }

  // =========================
  // 🗳️ VOTES (🔥 NOW WORKS)
  // =========================
  if (e.target.classList.contains("approve-vote")) {
    const voteId = e.target.dataset.id;
    const userId = e.target.dataset.user;
    const amount = e.target.dataset.amount;

    if (!confirm("Approve this vote?")) return;

    await approveVote(voteId, userId, amount);
    return;
  }

  if (e.target.classList.contains("reject-vote")) {
    const voteId = e.target.dataset.id;
    const userId = e.target.dataset.user;
    const amount = e.target.dataset.amount;
    const createdAt = e.target.dataset.created;

    if (!confirm("Reject this vote?")) return;

    await rejectVote(voteId, userId, amount, createdAt);
    return;
  }

  // =========================
// 💼 EMPLOYMENT
// =========================

const employmentViewButton =
  e.target.closest(".view-employment");

if (employmentViewButton) {
  e.preventDefault();
  e.stopPropagation();

  const applicationId =
    employmentViewButton.dataset.id;

  if (!applicationId) {
    console.error("Missing employment application ID.");
    return;
  }

  await viewEmploymentApplication(applicationId);

  return;
}


const employmentDocumentButton =
  e.target.closest(
    ".view-employment-document"
  );

if (employmentDocumentButton) {
  e.preventDefault();
  e.stopPropagation();

  const applicationId =
    employmentDocumentButton.dataset.id;

  const documentType =
    employmentDocumentButton.dataset.type;

  if (
    !applicationId ||
    !documentType
  ) {
    console.error(
      "Missing employment document information."
    );
    return;
  }

  await viewEmploymentDocument(
    applicationId,
    documentType
  );

  return;
}


const employmentActionButton =
  e.target.closest("[data-employment-action]");

if (employmentActionButton) {
  e.preventDefault();
  e.stopPropagation();

  const applicationId =
    employmentActionButton.dataset.id;

  const action =
    employmentActionButton.dataset.employmentAction;

  if (!applicationId || !action) {
    console.error(
      "Missing employment action information."
    );
    return;
  }

  await updateEmploymentApplicationStatus(
    applicationId,
    action
  );

  return;
}

  // REMOVE USER

if(
e.target.classList.contains(
"remove-user"
)
){

const id=
e.target.dataset.id;

selectedUsers=
selectedUsers.filter(
u=>u.id!==id
);

renderSelectedUsers();

return;

}

// REMOVE EMAIL USER

if(
e.target.classList.contains(
"remove-email-user"
)
){

const id =
e.target.dataset.id;

selectedEmailUsers =
selectedEmailUsers.filter(
u=>u.id!==id
);

renderEmailSelectedUsers();

return;

}

});

async function loadVotes() {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("status", voteFilter) // 🔥 REQUIRED
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = `<p>${error.message}</p>`;
    return;
  }
  

  container.innerHTML = "";

  if (!data.length) {
  container.innerHTML = `
    <div class="empty-state">
      <p>No ${voteFilter} votes found.</p>
    </div>
  `;
  return;
}

  for (const vote of data) {
    // get participant (who is receiving vote)
    const { data: user } = await supabase
      .from("users")
      .select("full_name,email")
      .eq("id", vote.user_id)
      .single();

    const div = document.createElement("div");
    div.className = "user-card";

    div.innerHTML = `
      <div class="user-header">
        <h3>${user?.full_name || "Unknown"}</h3>
        <span class="status ${vote.status}">${vote.status}</span>
      </div>

      <div class="user-info">
        <p><strong>Vote ID:</strong> ${vote.id}</p>
        <p><strong>Email:</strong> ${user?.email || "-"}</p>
        <p><strong>Points:</strong> ${vote.amount}</p>
        <p><strong>Referral:</strong> ${vote.referral_code || "None"}</p>
        <p><strong>Reason:</strong> ${vote.reason || "-"}</p>
        <p class="vote-date">
  ${new Date(vote.created_at).toLocaleString("en-US", {
  dateStyle: "medium",
  timeStyle: "short"
})}
</p>
      </div>

      ${
        vote.proof_file_url
          ? `<img src="${vote.proof_file_url}" class="proof-img" style="width:160px;border-radius:8px;margin-top:12px;">`
          : ""
      }

      

      <div class="actions">
        <button class="btn approve-vote"
          data-id="${vote.id}"
          data-user="${vote.user_id}"
          data-amount="${vote.amount}"
          ${vote.status !== "pending" ? "disabled" : ""}>
          Approve
        </button>

<button class="btn reject-vote"
  data-id="${vote.id}"
  data-user="${vote.user_id}"
  data-amount="${vote.amount}"
  data-created="${vote.created_at}"
  ${vote.status !== "pending" ? "disabled" : ""}>
  Reject
</button>
      </div>
    `;

    container.appendChild(div);
  }
}

async function approveVote(voteId, userId, amount) {
  // 1️⃣ mark vote approved
  const { error: voteError } = await supabase
    .from("votes")
    .update({ status: "approved" })
    .eq("id", voteId);

  if (voteError) {
    console.error(voteError);
    alert("Failed to approve vote");
    return;
  }

  // 2️⃣ increment user votes_count
  const { data: user } = await supabase
    .from("users")
    .select("votes_count,email,full_name")
    .eq("id", userId)
    .single();

  const newTotal = (user.votes_count || 0) + Number(amount);

  await supabase
    .from("users")
    .update({ votes_count: newTotal })
    .eq("id", userId);

  // 3️⃣ send email
  try {
    await fetch("/send-vote-status-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: user.email,
        name: user.full_name,
        amount,
        status: "approved"
      })
    });
  } catch (err) {
    console.error("Email failed:", err);
  }

  alert("Vote approved & points added");

  loadVotes();
}

async function rejectVote(voteId, userId , amount, createdAt) {
  const { data: user } = await supabase
    .from("users")
    .select("email,full_name")
    .eq("id", userId)
    .single();

  await supabase
    .from("votes")
    .update({ status: "rejected" })
    .eq("id", voteId);

  // send email
  try {
    const response =
  await fetch("/send-vote-status-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: user.email,
      name: user.full_name,
      amount,
      createdAt,
      status: "rejected"
    })
  });

console.log(await response.json());

  } catch (err) {
    console.error(err);
  }

  alert("Vote rejected");

  loadVotes();
}

// =========================
// 🔔 NOTIFICATION MODAL
// =========================

const notificationModal =
  document.getElementById(
    "notificationModal"
  );

const notificationForm =
  document.getElementById(
    "notificationForm"
  );

const notificationTarget =
  document.getElementById(
    "notificationTarget"
  );

const singleUserBox =
  document.getElementById(
    "singleUserBox"
  );

const userSearch =
document.getElementById(
"userSearch"
);

const userDropdown =
document.getElementById(
"userDropdown"
);

const selectedUsersContainer =
document.getElementById(
"selectedUsers"
);

let allUsers=[];

let selectedUsers=[];

const notificationTitle =
  document.getElementById(
    "notificationTitle"
  );

const notificationMessage =
  document.getElementById(
    "notificationMessage"
  );

const notificationStatus =
  document.getElementById(
    "notificationStatus"
  );

const closeNotificationModal =
  document.getElementById(
    "closeNotificationModal"
  );


  // =========================
// LOAD USERS
// =========================

async function loadNotificationUsers(){

const {data,error}=await supabase
.from("users")
.select(`
id,
full_name,
email
`)
.order(
"full_name",
{ascending:true}
);

if(error){

console.error(error);

return;

}

allUsers=data||[];

}

loadNotificationUsers();


// =========================
// SEARCH
// =========================

userSearch.addEventListener(
"input",
()=>{

const value=
userSearch.value
.toLowerCase();

if(!value){

userDropdown.innerHTML="";
return;

}

const filtered=
allUsers.filter(
user=>

(user.full_name||"")
.toLowerCase()
.includes(value)

);

renderDropdown(filtered);

}
);


// =========================
// RENDER DROPDOWN
// =========================

function renderDropdown(users){

userDropdown.innerHTML="";

users.forEach(user=>{

const exists=
selectedUsers.find(
u=>u.id===user.id
);

if(exists) return;

const div=
document.createElement(
"div"
);

div.className=
"dropdown-user";

div.innerHTML=`

<strong>
${user.full_name}
</strong>

<br>

<small>
${user.email}
</small>

`;

div.onclick=()=>{

addUser(user);

};

userDropdown.appendChild(
div
);

});

}


// =========================
// ADD USER
// =========================

function addUser(user){

if(
selectedUsers.length>=5
){

alert(
"Maximum 5 users"
);

return;

}

selectedUsers.push(user);

renderSelectedUsers();

userSearch.value="";

userDropdown.innerHTML="";

}


// =========================
// SHOW TAGS
// =========================

function renderSelectedUsers(){

selectedUsersContainer.innerHTML="";

selectedUsers.forEach(
user=>{

const div=
document.createElement(
"div"
);

div.className=
"selected-user";

div.innerHTML=`

${user.full_name}

<span
class="remove-user"
data-id="${user.id}"
>

×

</span>

`;

selectedUsersContainer
.appendChild(div);

});

}

  // =========================
// TARGET SWITCH
// =========================

notificationTarget
  .addEventListener(
    "change",
    () => {

      if (
        notificationTarget.value
        === "single"
      ) {

        singleUserBox
          .classList.remove(
            "hidden"
          );

      }

      else {

        singleUserBox
          .classList.add(
            "hidden"
          );

      }

    }
  );

  // =========================
// CLOSE MODAL
// =========================

closeNotificationModal
  .addEventListener(
    "click",
    () => {

      notificationModal
        .classList.add("hidden");

    }
  );

  // =========================
// SEND NOTIFICATION
// =========================

notificationForm
  .addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      notificationStatus.textContent =
        "Sending...";

      const target =
        notificationTarget.value;

      const title =
        notificationTitle.value;

      const message =
        notificationMessage.value;

      // =========================
      // SEND TO ALL USERS
      // =========================

      if (target === "all") {

        // GET USERS
        const { data: users, error }
          = await supabase
            .from("users")
            .select("id");

        if (error) {

          console.error(error);

          notificationStatus.textContent =
            "Failed to load users.";

          return;
        }

        // BUILD INSERT ARRAY
        const rows =
          users.map(user => ({
            user_id: user.id,
            title,
            message,
            type: "admin"
          }));

        // INSERT
        const { error: insertError }
          = await supabase
            .from("notifications")
            .insert(rows);

        if (insertError) {

          console.error(insertError);

          notificationStatus.textContent =
            "Failed to send.";

          return;
        }

      }

      // =========================
      // SEND TO SINGLE USER
      // =========================

      else {

        const rows=
selectedUsers.map(
user=>({

user_id:user.id,

title,

message,

type:"admin"

})
);

const {error}=
await supabase
.from("notifications")
.insert(rows);

        if (error) {

          console.error(error);

          notificationStatus.textContent =
            "Failed to send.";

          return;
        }

      }


      

      // SUCCESS
      notificationStatus.textContent =
        "Notification sent ✔";

      notificationForm.reset();

      singleUserBox.classList.add(
        "hidden"
      );

    }
  );

  // =========================
// EMAIL MODAL
// =========================

const emailModal =
document.getElementById(
"emailModal"
);

const emailForm =
document.getElementById(
"emailForm"
);

const emailTarget =
document.getElementById(
"emailTarget"
);

const emailUserBox =
document.getElementById(
"emailUserBox"
);

const manualEmailBox =
document.getElementById(
"manualEmailBox"
);

const manualEmailInput =
document.getElementById(
"manualEmailInput"
);

const emailUserSearch =
document.getElementById(
"emailUserSearch"
);

const emailUserDropdown =
document.getElementById(
"emailUserDropdown"
);

const emailSelectedUsers =
document.getElementById(
"emailSelectedUsers"
);

const emailSubject =
document.getElementById(
"emailSubject"
);

const emailMessage =
document.getElementById(
"emailMessage"
);

const emailStatus =
document.getElementById(
"emailStatus"
);

const closeEmailModal =
document.getElementById(
"closeEmailModal"
);

const emailHasButton =
document.getElementById(
"emailHasButton"
);

const emailButtonBox =
document.getElementById(
"emailButtonBox"
);

const emailButtonText =
document.getElementById(
"emailButtonText"
);

const emailButtonUrl =
document.getElementById(
"emailButtonUrl"
);

let selectedEmailUsers = [];

// =========================
// TARGET SWITCH
// =========================

emailTarget
.addEventListener(
"change",
()=>{

emailUserBox
.classList.add(
"hidden"
);

manualEmailBox
.classList.add(
"hidden"
);

if(
emailTarget.value
==="selected"
){

emailUserBox
.classList.remove(
"hidden"
);

}

if(
emailTarget.value
==="manual"
){

manualEmailBox
.classList.remove(
"hidden"
);

}

}
);

// =========================
// BUTTON TOGGLE
// =========================

emailHasButton
.addEventListener(
"change",
()=>{

if(
emailHasButton.value
==="yes"
){

emailButtonBox
.classList.remove(
"hidden"
);

}

else{

emailButtonBox
.classList.add(
"hidden"
);

}

}
);

closeEmailModal
.addEventListener(
"click",
()=>{

emailModal
.classList.add(
"hidden"
);

}
);

// =========================
// EMAIL SEARCH
// =========================

emailUserSearch
.addEventListener(
"input",
()=>{

const value =
emailUserSearch.value
.toLowerCase();

if(!value){

emailUserDropdown.innerHTML="";
return;

}

const filtered =
allUsers.filter(
user=>

(user.full_name||"")
.toLowerCase()
.includes(value)

);

renderEmailDropdown(filtered);

}
);

function renderEmailDropdown(users){

emailUserDropdown.innerHTML="";

users.forEach(user=>{

const exists =
selectedEmailUsers.find(
u=>u.id===user.id
);

if(exists) return;

const div =
document.createElement("div");

div.className =
"dropdown-user";

div.innerHTML = `

<strong>
${user.full_name}
</strong>

<br>

<small>
${user.email}
</small>

`;

div.onclick = ()=>{

selectedEmailUsers.push(user);

renderEmailSelectedUsers();

emailUserSearch.value="";

emailUserDropdown.innerHTML="";

};

emailUserDropdown
.appendChild(div);

});

}

function renderEmailSelectedUsers(){

emailSelectedUsers.innerHTML="";

selectedEmailUsers.forEach(user=>{

const div =
document.createElement("div");

div.className =
"selected-user";

div.innerHTML = `

${user.full_name}

<span
class="remove-email-user"
data-id="${user.id}"
>

×

</span>

`;

emailSelectedUsers
.appendChild(div);

});

}

// =========================
// SEND EMAIL
// =========================

emailForm
.addEventListener(
"submit",
async(e)=>{

e.preventDefault();

emailStatus.textContent =
"Sending...";

const target =
emailTarget.value;

let emails = [];

// ALL USERS
if(target==="all"){

const {data} =
await supabase
.from("users")
.select("email");

emails =
data.map(
u=>u.email
);

}

// SELECTED USERS
else if(
target==="selected"
){

emails =
selectedEmailUsers.map(
u=>u.email
);

}

// MANUAL EMAIL
else{

emails = [
manualEmailInput.value
];

}

try{

const res =
await fetch(
"/send-custom-email",
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

emails,

subject:
emailSubject.value,

message:
emailMessage.value,

buttonText:
emailButtonText.value,

buttonUrl:
emailButtonUrl.value,

hasButton:
emailHasButton.value
==="yes"

})

}
);

const result =
await res.json();

if(!result.success){

emailStatus.textContent =
result.message ||
"Failed.";

return;

}

emailStatus.textContent =
"Emails sent ✔";

emailForm.reset();

selectedEmailUsers=[];

renderEmailSelectedUsers();

emailUserBox
.classList.add(
"hidden"
);

manualEmailBox
.classList.add(
"hidden"
);

emailButtonBox
.classList.add(
"hidden"
);

}
catch(err){

console.error(err);

emailStatus.textContent =
"Server error.";

}

}
);

// ==========================================
// 💼 EMPLOYMENT APPLICATIONS
// ==========================================

let employmentApplications = [];
let employmentSearchTerm = "";
let employmentStatusFilter = "all";

// ==========================================
// LOAD EMPLOYMENT APPLICATIONS
// ==========================================

async function loadEmploymentApplications() {
  const container =
    document.getElementById("usersContainer");

  if (!container) {
    console.error(
      "usersContainer not found."
    );
    return;
  }

  container.innerHTML = `
    <div class="employment-admin">

      <div class="employment-header">

        <div>
          <h2>Employment Applications</h2>
          <p>
            Manage applications for the
            Disbursement Officer position.
          </p>
        </div>

        <button
          type="button"
          class="employment-refresh-btn"
          id="employmentRefreshBtn"
        >
          ↻ Refresh
        </button>

      </div>

      <div class="employment-stats">

        <div class="employment-stat-card">
          <span class="employment-stat-label">
            Total
          </span>
          <strong id="employmentTotal">
            0
          </strong>
        </div>

        <div class="employment-stat-card pending">
          <span class="employment-stat-label">
            Pending
          </span>
          <strong id="employmentPending">
            0
          </strong>
        </div>

        <div class="employment-stat-card approved">
          <span class="employment-stat-label">
            Approved
          </span>
          <strong id="employmentApproved">
            0
          </strong>
        </div>

        <div class="employment-stat-card rejected">
          <span class="employment-stat-label">
            Rejected
          </span>
          <strong id="employmentRejected">
            0
          </strong>
        </div>

      </div>

      <div class="employment-toolbar">

        <div class="employment-search-wrapper">

          <span class="employment-search-icon">
            🔎
          </span>

          <input
            type="text"
            id="employmentSearch"
            class="employment-search"
            placeholder="Search by name, email or phone..."
            autocomplete="off"
          />

        </div>

        <div class="employment-filters">

          <button
            type="button"
            class="employment-filter active"
            data-employment-filter="all"
          >
            All
          </button>

          <button
            type="button"
            class="employment-filter"
            data-employment-filter="pending"
          >
            Pending
          </button>

          <button
            type="button"
            class="employment-filter"
            data-employment-filter="approved"
          >
            Approved
          </button>

          <button
            type="button"
            class="employment-filter"
            data-employment-filter="rejected"
          >
            Rejected
          </button>

        </div>

      </div>

      <div
        id="employmentApplicationsList"
        class="employment-applications-grid"
      >
        <div class="employment-loading">
          Loading applications...
        </div>
      </div>

    </div>
  `;

  employmentSearchTerm = "";
  employmentStatusFilter = "all";

  setupEmploymentControls();

  await fetchEmploymentApplications();
}


// ==========================================
// FETCH APPLICATIONS
// ==========================================

async function fetchEmploymentApplications() {
  const list =
    document.getElementById(
      "employmentApplicationsList"
    );

  if (!list) return;

  list.innerHTML = `
    <div class="employment-loading">
      Loading applications...
    </div>
  `;

  try {
    const response = await fetch(
      "/admin/employment-applications"
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        "Unable to load employment applications."
      );
    }

    employmentApplications =
      Array.isArray(result.applications)
        ? result.applications
        : [];

    updateEmploymentStats();

    renderEmploymentApplications();

  } catch (error) {
    console.error(
      "Employment applications error:",
      error
    );

    list.innerHTML = `
      <div class="employment-empty error">
        <div class="employment-empty-icon">
          ⚠️
        </div>

        <h3>
          Unable to load applications
        </h3>

        <p>
          ${
            escapeEmploymentHtml(
              error.message
            )
          }
        </p>

        <button
          type="button"
          class="employment-retry-btn"
          id="employmentRetryBtn"
        >
          Try Again
        </button>
      </div>
    `;

    const retryButton =
      document.getElementById(
        "employmentRetryBtn"
      );

    if (retryButton) {
      retryButton.addEventListener(
        "click",
        fetchEmploymentApplications
      );
    }
  }
}


// ==========================================
// SETUP SEARCH + FILTERS
// ==========================================

function setupEmploymentControls() {

  const searchInput =
    document.getElementById(
      "employmentSearch"
    );

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      () => {

        employmentSearchTerm =
          searchInput.value
            .trim()
            .toLowerCase();

        renderEmploymentApplications();
      }
    );
  }


  const filterButtons =
    document.querySelectorAll(
      ".employment-filter"
    );

  filterButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          employmentStatusFilter =
            button.dataset
              .employmentFilter || "all";

          filterButtons.forEach(
            (item) => {
              item.classList.remove(
                "active"
              );
            }
          );

          button.classList.add(
            "active"
          );

          renderEmploymentApplications();
        }
      );
    }
  );


  const refreshButton =
    document.getElementById(
      "employmentRefreshBtn"
    );

  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      async () => {

        refreshButton.disabled = true;

        refreshButton.textContent =
          "↻ Refreshing...";

        await fetchEmploymentApplications();

        refreshButton.disabled = false;

        refreshButton.textContent =
          "↻ Refresh";
      }
    );
  }
}


// ==========================================
// UPDATE STATS
// ==========================================

function updateEmploymentStats() {

  const total =
    employmentApplications.length;

  const pending =
    employmentApplications.filter(
      (application) =>
        String(application.status)
          .toLowerCase() === "pending"
    ).length;

  const approved =
    employmentApplications.filter(
      (application) =>
        String(application.status)
          .toLowerCase() === "approved"
    ).length;

  const rejected =
    employmentApplications.filter(
      (application) =>
        String(application.status)
          .toLowerCase() === "rejected"
    ).length;


  const totalElement =
    document.getElementById(
      "employmentTotal"
    );

  const pendingElement =
    document.getElementById(
      "employmentPending"
    );

  const approvedElement =
    document.getElementById(
      "employmentApproved"
    );

  const rejectedElement =
    document.getElementById(
      "employmentRejected"
    );


  if (totalElement) {
    totalElement.textContent = total;
  }

  if (pendingElement) {
    pendingElement.textContent = pending;
  }

  if (approvedElement) {
    approvedElement.textContent = approved;
  }

  if (rejectedElement) {
    rejectedElement.textContent = rejected;
  }
}


// ==========================================
// FILTER + RENDER APPLICATIONS
// ==========================================

function renderEmploymentApplications() {

  const list =
    document.getElementById(
      "employmentApplicationsList"
    );

  if (!list) return;


  let filtered =
    [...employmentApplications];


  // Status filter
  if (
    employmentStatusFilter !== "all"
  ) {

    filtered =
      filtered.filter(
        (application) =>
          String(application.status)
            .toLowerCase() ===
          employmentStatusFilter
      );
  }


  // Search
  if (employmentSearchTerm) {

    filtered =
      filtered.filter(
        (application) => {

          const searchableText = [
            application.full_name,
            application.email,
            application.phone,
            application.location,
            application.id
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            employmentSearchTerm
          );
        }
      );
  }


  if (filtered.length === 0) {

    list.innerHTML = `
      <div class="employment-empty">

        <div class="employment-empty-icon">
          📋
        </div>

        <h3>
          No applications found
        </h3>

        <p>
          ${
            employmentSearchTerm
              ? "Try a different search."
              : "There are no applications in this category."
          }
        </p>

      </div>
    `;

    return;
  }


  list.innerHTML =
    filtered
      .map(
        (application) =>
          createEmploymentCard(
            application
          )
      )
      .join("");
}


// ==========================================
// CREATE APPLICATION CARD
// ==========================================

function createEmploymentCard(
  application
) {

  const status =
    String(
      application.status || "pending"
    ).toLowerCase();


  const createdAt =
    application.created_at
      ? formatEmploymentDate(
          application.created_at
        )
      : "Unknown";


  const documents = [];

  if (application.id_card_url) {
    documents.push("ID Card");
  }

  if (application.cv_url) {
    documents.push("CV");
  }


  const documentText =
    documents.length > 0
      ? documents.join(" + ")
      : "No documents";


  return `
    <article
      class="employment-card"
      data-employment-id="${
        escapeEmploymentAttribute(
          application.id
        )
      }"
    >

      <div class="employment-card-top">

        <div class="employment-avatar">
          ${
            getEmploymentInitials(
              application.full_name
            )
          }
        </div>

        <span
          class="
            employment-status
            ${status}
          "
        >
          ${
            capitalizeEmploymentStatus(
              status
            )
          }
        </span>

      </div>


      <div class="employment-card-body">

        <h3 class="employment-name">
          ${
            escapeEmploymentHtml(
              application.full_name ||
              "Unnamed Applicant"
            )
          }
        </h3>

        <p class="employment-role">
          Disbursement Officer
        </p>


        <div class="employment-contact">

          <div>
            <span>✉</span>
            ${
              escapeEmploymentHtml(
                application.email ||
                "No email"
              )
            }
          </div>

          <div>
            <span>☎</span>
            ${
              escapeEmploymentHtml(
                application.phone ||
                "No phone"
              )
            }
          </div>

        </div>


        <div class="employment-card-meta">

          <span>
            📅 ${createdAt}
          </span>

          <span>
            📄 ${documentText}
          </span>

        </div>

      </div>


      <div class="employment-card-footer">

        <button
          type="button"
          class="view-employment"
          data-id="${
            escapeEmploymentAttribute(
              application.id
            )
          }"
        >
          👁 View Application
        </button>

      </div>

    </article>
  `;
}


// ==========================================
// VIEW ONE APPLICATION
// ==========================================

async function viewEmploymentApplication(
  applicationId
) {

  console.log(
    "Opening employment application:",
    applicationId
  );


  if (!applicationId) {
    console.error(
      "No employment application ID."
    );
    return;
  }


  // Remove ANY existing modal first
  const existingModal =
    document.getElementById(
      "employmentDetailModal"
    );

  if (existingModal) {
    existingModal.remove();
  }


  // Find the application already loaded
  let application =
    employmentApplications.find(
      (item) =>
        String(item.id) ===
        String(applicationId)
    );


  // If it wasn't found, fetch fresh data
  if (!application) {

    try {

      const response = await fetch(
        "/admin/employment-applications"
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Unable to load application."
        );
      }

      application =
        (result.applications || []).find(
          (item) =>
            String(item.id) ===
            String(applicationId)
        );

    } catch (error) {

      console.error(
        "Unable to open application:",
        error
      );

      alert(
        error.message ||
        "Unable to open application."
      );

      return;
    }
  }


  if (!application) {

    alert(
      "Employment application not found."
    );

    return;
  }


  createEmploymentDetailModal(
    application
  );
}


// ==========================================
// CREATE DETAIL MODAL
// ==========================================

function createEmploymentDetailModal(
  application
) {

  const status =
    String(
      application.status || "pending"
    ).toLowerCase();


  const modal =
    document.createElement("div");

  modal.id =
    "employmentDetailModal";

  modal.className =
    "employment-modal-overlay";


  modal.innerHTML = `
    <div
      class="employment-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employmentModalTitle"
    >

      <div class="employment-modal-header">

        <div>

          <span class="employment-modal-eyebrow">
            EMPLOYMENT APPLICATION
          </span>

          <h2 id="employmentModalTitle">
            ${
              escapeEmploymentHtml(
                application.full_name ||
                "Applicant"
              )
            }
          </h2>

          <p>
            Disbursement Officer
          </p>

        </div>

        <button
          type="button"
          class="employment-modal-close"
          id="employmentModalClose"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <div class="employment-modal-content">


        <!-- PERSONAL INFORMATION -->

        <section class="employment-detail-section">

          <div class="employment-section-title">
            <span>👤</span>
            <h3>Personal Information</h3>
          </div>


          <div class="employment-detail-grid">

            ${employmentDetailItem(
              "Full Name",
              application.full_name
            )}

            ${employmentDetailItem(
              "Email",
              application.email
            )}

            ${employmentDetailItem(
              "Phone",
              application.phone
            )}

            ${employmentDetailItem(
              "Location",
              application.location
            )}

            ${employmentDetailItem(
              "Date of Birth",
              application.date_of_birth
            )}

          </div>

        </section>


        <!-- IDENTIFICATION -->

        <section class="employment-detail-section">

          <div class="employment-section-title">
            <span>🪪</span>
            <h3>Identification</h3>
          </div>


          <div class="employment-detail-grid">

            ${employmentDetailItem(
              "ID Type",
              application.id_type
            )}

            ${employmentDetailItem(
              "ID Number",
              application.id_number
            )}

          </div>

        </section>


        <!-- EMPLOYMENT -->

        <section class="employment-detail-section">

          <div class="employment-section-title">
            <span>💼</span>
            <h3>Employment Information</h3>
          </div>


          <div class="employment-long-field">

            <label>
              Employment History
            </label>

            <div>
              ${
                formatEmploymentText(
                  application.employment_history
                )
              }
            </div>

          </div>


          <div class="employment-long-field">

            <label>
              Experience
            </label>

            <div>
              ${
                formatEmploymentText(
                  application.experience
                )
              }
            </div>

          </div>


          <div class="employment-long-field">

            <label>
              Motivation
            </label>

            <div>
              ${
                formatEmploymentText(
                  application.motivation
                )
              }
            </div>

          </div>


          <div class="employment-long-field">

            <label>
              Availability
            </label>

            <div>
              ${
                formatEmploymentText(
                  application.availability
                )
              }
            </div>

          </div>


          <div class="employment-long-field">

            <label>
              Additional Information
            </label>

            <div>
              ${
                formatEmploymentText(
                  application.additional_information
                )
              }
            </div>

          </div>

        </section>


        <!-- DOCUMENTS -->

        <section class="employment-detail-section">

          <div class="employment-section-title">
            <span>📄</span>
            <h3>Documents</h3>
          </div>


          <div class="employment-documents">

            <div class="employment-document">

              <div class="employment-document-icon">
                🪪
              </div>

              <div class="employment-document-info">

                <strong>
                  ID Card
                </strong>

                <span>
                  ${
                    application.id_card_url
                      ? "Uploaded"
                      : "Not provided"
                  }
                </span>

              </div>

              ${
                application.id_card_url
                  ? `
                    <button
  type="button"
  class="employment-document-btn view-employment-document"
  data-id="${escapeEmploymentAttribute(application.id)}"
  data-type="id-card"
>
  👁 View
</button>
                  `
                  : ""
              }

            </div>


            <div class="employment-document">

              <div class="employment-document-icon">
                📑
              </div>

              <div class="employment-document-info">

                <strong>
                  CV / Resume
                </strong>

                <span>
                  ${
                    application.cv_url
                      ? "Uploaded"
                      : "Not provided"
                  }
                </span>

              </div>

              ${
                application.cv_url
                  ? `
                    <button
  type="button"
  class="employment-document-btn view-employment-document"
  data-id="${escapeEmploymentAttribute(application.id)}"
  data-type="cv"
>
  👁 View
</button>
                  `
                  : ""
              }

            </div>

          </div>

        </section>


        <!-- STATUS -->

        <section class="employment-detail-section">

          <div class="employment-section-title">
            <span>📌</span>
            <h3>Application Status</h3>
          </div>


          <div class="employment-current-status">

            <span
              class="
                employment-status
                ${status}
              "
            >
              ${
                capitalizeEmploymentStatus(
                  status
                )
              }
            </span>

          </div>

        </section>


      </div>


      <div class="employment-modal-footer">

        <button
          type="button"
          class="employment-close-btn"
          id="employmentFooterClose"
        >
          Close
        </button>


        ${
          status === "pending"
            ? `
              <div class="employment-decision-buttons">

                <button
                  type="button"
                  class="employment-reject-btn"
                  data-employment-action="reject"
                  data-id="${
                    escapeEmploymentAttribute(
                      application.id
                    )
                  }"
                >
                  ✕ Reject
                </button>

                <button
                  type="button"
                  class="employment-approve-btn"
                  data-employment-action="approve"
                  data-id="${
                    escapeEmploymentAttribute(
                      application.id
                    )
                  }"
                >
                  ✓ Approve
                </button>

              </div>
            `
            : ""
        }

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );




  // Close using X
  const closeButton =
    modal.querySelector(
      "#employmentModalClose"
    );

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeEmploymentModal
    );
  }


  // Close using footer button
  const footerClose =
    modal.querySelector(
      "#employmentFooterClose"
    );

  if (footerClose) {

    footerClose.addEventListener(
      "click",
      closeEmploymentModal
    );
  }


  // Close by clicking dark background
  modal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === modal
      ) {
        closeEmploymentModal();
      }
    }
  );


  // Escape key
  document.addEventListener(
    "keydown",
    employmentEscapeHandler
  );
}


// ==========================================
// CLOSE MODAL
// ==========================================

function closeEmploymentModal() {

  const modal =
    document.getElementById(
      "employmentDetailModal"
    );

  if (modal) {
    modal.remove();
  }

  document.removeEventListener(
    "keydown",
    employmentEscapeHandler
  );
}


function employmentEscapeHandler(
  event
) {

  if (event.key === "Escape") {
    closeEmploymentModal();
  }
}


// ==========================================
// DETAIL ITEM
// ==========================================

function employmentDetailItem(
  label,
  value
) {

  return `
    <div class="employment-detail-item">

      <span>
        ${escapeEmploymentHtml(label)}
      </span>

      <strong>
        ${
          value
            ? escapeEmploymentHtml(
                value
              )
            : "Not provided"
        }
      </strong>

    </div>
  `;
}


// ==========================================
// FORMAT TEXT
// ==========================================

function formatEmploymentText(
  value
) {

  if (!value) {
    return `
      <span class="employment-not-provided">
        Not provided
      </span>
    `;
  }


  return escapeEmploymentHtml(
    value
  ).replace(
    /\n/g,
    "<br>"
  );
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatEmploymentDate(
  value
) {

  if (!value) {
    return "Unknown";
  }


  try {

    return new Date(
      value
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

  } catch {
    return value;
  }
}


// ==========================================
// INITIALS
// ==========================================

function getEmploymentInitials(
  name
) {

  if (!name) {
    return "?";
  }


  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }


  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}


// ==========================================
// STATUS TEXT
// ==========================================

function capitalizeEmploymentStatus(
  status
) {

  if (!status) {
    return "Pending";
  }


  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}



// ==========================================
// HTML ESCAPING
// ==========================================

function escapeEmploymentHtml(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeEmploymentAttribute(
  value
) {
  return escapeEmploymentHtml(
    value
  );
}

async function updateEmploymentApplicationStatus(
  applicationId,
  action
) {
  const newStatus =
    action === "approve"
      ? "approved"
      : action === "reject"
        ? "rejected"
        : null;

  if (!newStatus) {
    console.error(
      "Invalid employment action:",
      action
    );
    return;
  }

  const actionText =
    newStatus === "approved"
      ? "approve"
      : "reject";

  const confirmed = confirm(
    `Are you sure you want to ${actionText} this employment application?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `/admin/employment-applications/${encodeURIComponent(
        applicationId
      )}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: newStatus
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to update application status."
      );
    }

    closeEmploymentModal();

    alert(
      newStatus === "approved"
        ? "Application approved successfully."
        : "Application rejected successfully."
    );

    await fetchEmploymentApplications();

  } catch (error) {
    console.error(
      "Employment status update error:",
      error
    );

    alert(
      error.message ||
        "Something went wrong while updating the application."
    );
  }
}

// ==========================================
// 💼 VIEW EMPLOYMENT DOCUMENT
// ==========================================

async function viewEmploymentDocument(
  applicationId,
  documentType
) {
  try {
    const response = await fetch(
      `/admin/employment-applications/${encodeURIComponent(
        applicationId
      )}/document/${encodeURIComponent(
        documentType
      )}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to open document."
      );
    }

    if (!result.url) {
      throw new Error(
        "Document URL was not returned."
      );
    }

    window.open(
      result.url,
      "_blank",
      "noopener,noreferrer"
    );

  } catch (error) {
    console.error(
      "Employment document error:",
      error
    );

    alert(
      error.message ||
        "Unable to open document."
    );
  }
}
// js/activation.js
import { supabase } from './supabaseClient.js'

const form = document.getElementById("activationForm")
const statusMessage = document.getElementById("statusMessage")

const activationGate =
document.getElementById(
  "activationGate"
);

const activationPage =
document.getElementById(
  "activationPage"
);




// Get userId from URL
const params = new URLSearchParams(window.location.search)
const userId = params.get("userId")
if(!userId){

  showActivationLookupForm();

}


let currentUser = null;

async function loadUser() {

  if (!userId) return;

  const { data, error } =
    await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

  if (error) {

    console.error(error);

    return;

  }

  currentUser = data;

  document.getElementById(
    "heroName"
  ).textContent =
    `Congratulations ${data.full_name}`;

}

loadUser();

async function runActivationGate(){

  if(!userId) return;

  const {
    data:user
  } = await supabase
    .from("users")
    .select("*")
    .eq(
      "id",
      userId
    )
    .single();

  if(!user) return;

  // BLOCK PENDING USERS

  if(
    user.status ===
    "pending"
  ){

    showPendingApplicationGate(
      user
    );

    return;

  }

  // BLOCK REJECTED USERS

  if(
    user.status ===
    "rejected"
  ){

    showRejectedApplicationGate(
      user
    );

    return;

  }

  // CHECK ACTIVATION

  await checkActivationStatus(
    user
  );

}

runActivationGate();

function showGate(html){

  activationGate.innerHTML =
    html;

  activationGate.classList.remove(
    "hidden"
  );

  activationPage.classList.add(
    "hidden"
  );

}


function showActivationLookupForm(){

  showGate(`

    <div class="lookup-card">

      <div class="lookup-badge">
        BEASTLY GIVEAWAY
      </div>

      <h1 class="lookup-title">
        Check Your Status
      </h1>

      <p class="lookup-text">

        Already applied?

        <br><br>

        Enter the email address used
        during your application and
        we'll instantly locate your
        campaign status.

      </p>

      <form
        id="activationLookupForm"
        class="lookup-form"
      >

        <input
          type="email"
          id="lookupEmail"
          placeholder="Enter your email address"
          required
        >

        <button
          type="submit"
          class="gate-btn"
        >
          Check Status
        </button>

      </form>

      <div
        id="lookupMessage"
        class="lookup-message"
      ></div>

    </div>

  `);

  document
    .getElementById(
      "activationLookupForm"
    )
    .addEventListener(
      "submit",
      async (e)=>{

        e.preventDefault();

        const emailInput =
          document.getElementById(
            "lookupEmail"
          );

        const message =
          document.getElementById(
            "lookupMessage"
          );

        const email =
          emailInput.value
            .trim()
            .toLowerCase();

        if(
          !email.includes("@")
        ){
          message.textContent =
            "Enter a valid email address.";
          return;
        }

        const submitBtn =
  e.target.querySelector(
    "button"
  );

submitBtn.disabled = true;

submitBtn.textContent =
  "Searching...";

        message.innerHTML = `

  <div class="lookup-spinner"></div>

  Searching application...

`;

        await checkEmailStatus(
          email
        );

      }
    );

}


function showPendingApplicationGate(
  user
){

  showGate(`

    <div class="gate-card">

      <div class="gate-icon">
  ⏳
</div>

<h1>
  Application Under Review
</h1>

      <p>

        Hello
        <strong>
          ${user.full_name}
        </strong>,

        <br><br>

        We found your application.

        Your application is currently
        being reviewed by our team.

        No activation is required yet.

        Please wait until your
        application has been approved.

      </p>

      <div class="gate-status pending">

        PENDING REVIEW

      </div>

    </div>

  `);

}

function showRejectedApplicationGate(
  user
){

  showGate(`

    <div class="gate-card">

    <div class="gate-icon">
  ❌
</div>

      <h1>
        Application Not Approved
      </h1>

      <p>

        Hello
        <strong>
          ${user.full_name}
        </strong>,

        <br><br>

        We found your application.

        Unfortunately your application
        was not approved.

        At this time you are not
        eligible to continue to the
        activation stage.

        If you believe this was a
        misunderstanding, contact our
        support team through the live
        chat in the lower-right corner
        of this page.

      </p>

      <div class="gate-status rejected">

        APPLICATION REJECTED

      </div>

    </div>

  `);

}

async function checkEmailStatus(
  email
){

  const {
    data:user,
    error
  } = await supabase
    .from("users")
    .select("*")
    .eq(
      "email",
      email
    )
    .single();

  // NO USER FOUND

  if(
    error ||
    !user
  ){

    showGate(`

      <div class="gate-card">

        <h1>
          No Application Found
        </h1>

        <p>

          We could not find any
          application associated with

          <strong>
            ${email}
          </strong>

          <br><br>

          If this email is correct,
          then you have not yet
          applied for this campaign.

        </p>

        <a
          href="/"
          class="gate-btn"
        >
          Apply For Campaign
        </a>

      </div>

    `);

    return;

  }

  // APPLICATION PENDING

  if(
    user.status ===
    "pending"
  ){

    showPendingApplicationGate(
      user
    );

    return;

  }

  // APPLICATION REJECTED

  if(
    user.status ===
    "rejected"
  ){

    showRejectedApplicationGate(
      user
    );

    return;

  }

  // APPLICATION APPROVED

  if(
  user.status === "approved" ||
  user.status === "active"
){

  await checkActivationStatus(
    user,
    true
);

  return;

}
}

async function checkActivationStatus(
  user,
  isLookup = false
){

  const {
    data:activation
  } = await supabase
    .from("activations")
    .select("*")
    .eq(
      "user_id",
      user.id
    )
    .single();

  // NO ACTIVATION YET

  if(!activation){

  if(!isLookup){

    activationGate.classList.add(
      "hidden"
    );

    activationPage.classList.remove(
      "hidden"
    );

    return;

  }

  showGate(`

      <div class="gate-card">

      <div class="gate-icon">
  🚀
</div>

        <h1>
          Activation Required
        </h1>

        <p>

          Hello
          <strong>
            ${user.full_name}
          </strong>,

          <br><br>

          Congratulations.

          Your application has
          already been approved.

          However, we could not find
          any activation submission
          associated with your account.

          To secure your position,
          complete your activation
          before it gets late.

        </p>

        <div class="gate-status info">
  ACTIVATION REQUIRED
</div><br>

        <a
          href="activate.html?userId=${user.id}"
          class="gate-btn"
        >
          Complete Activation
        </a>

      </div>

    `);

  return;
}

  // =======================
// ACTIVATION PENDING
// =======================

if(
  activation.status ===
  "pending"
){

  showGate(`

    <div class="gate-card">

    <div class="gate-icon">
  🔍
</div>

      <h1>
        Activation Under Review
      </h1>

      <p>

        Hey
        <strong>
          ${user.full_name}
        </strong>,

        <br><br>

        Your activation of

        <strong>
          ${activation.amount_points}
          Points
        </strong>

        was submitted on

        <strong>
          ${new Date(
            activation.created_at
          ).toLocaleDateString()}
        </strong>.

        <br><br>

        Your activation is
        currently being reviewed
        by our activation team.

        You are not yet active
        in this campaign.

        <br><br>

        Activation reviews usually
        take between 24 and 48 hours.

        <br><br>

        If you believe your request
        has taken unusually long,
        contact our support team
        through the live chat
        in the lower-right corner
        of this page.

      </p>

      <div class="gate-status pending">

        ACTIVATION PENDING

      </div>

    </div>

  `);

  return;

}

// =======================
// ACTIVATION APPROVED
// =======================

if(
  activation.status ===
  "approved"
){

  showGate(`

    <div class="gate-card success">

    <div class="gate-icon">
  🏆
</div>


      <h1>
        🎉 Congratulations
        ${user.full_name}
      </h1>

      <p>

        Your

        <strong>
          ${activation.amount_points}
          Point Activation
        </strong>

        has been approved.

        <br><br>

        You successfully completed
        the activation process and
        have earned your place
        in the Beastly Giveaway.

        <br><br>

        Out of thousands of
        participants, you are now
        among the selected members
        actively participating in
        this campaign.

        <br><br>

        Continue building support,
        collecting votes and
        climbing the leaderboard.

      </p>

      <div class="gate-status approved">

        ACTIVATION APPROVED

      </div>

      <div class="gate-links">

        <a
          href="/pages/dashboard.html?id=${user.id}"
        >
          Dashboard
        </a>

        <a
          href="/pages/profile.html?id=${user.id}"
        >
          Profile
        </a>

        <a
          href="/pages/leaderboard.html"
        >
          Leaderboard
        </a>

      </div>

    </div>

  `);

  return;

}

// =======================
// ACTIVATION REJECTED
// =======================

if(
  activation.status ===
  "rejected"
){

  showGate(`

    <div class="gate-card">

    <div class="gate-icon">
  ⚠️
</div>

      <h1>
        Activation Rejected
      </h1>

      <p>

        Hey
        <strong>
          ${user.full_name}
        </strong>,

        <br><br>

        Your

        <strong>
          ${activation.amount_points}
          Point Activation
        </strong>

        was reviewed and
        unfortunately could not
        be approved.

        <br><br>

        This can happen when
        submitted information,
        uploaded proof,
        activation details or
        verification requirements
        do not fully meet the
        campaign guidelines.

        <br><br>

        Don't panic.

        If you believe there was
        a misunderstanding,
        contact our team through
        the live chat in the
        lower-right corner of
        your screen and we will
        gladly review your case.

      </p>

      <div class="gate-status rejected">

        ACTIVATION REJECTED

      </div>

    </div>

  `);

  return;

}

}


const proofFile = document.getElementById("proofFile");
const cameraFile = document.getElementById("cameraFile");
const preview = document.getElementById("filePreview");

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("submitBtn");
  statusMessage.textContent = "";

  btn.disabled = true;
  btn.textContent = "Submitting...";

  const formData = new FormData(form);

  // get selected file (upload or camera)
const selectedFile =
  proofFile.files[0] || cameraFile.files[0];

let uploadedUrl = null;

// if file exists, upload it
if (selectedFile) {
  const fileName = `${Date.now()}-${selectedFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("proofs")
    .upload(fileName, selectedFile);

  if (uploadError) {
    console.error(uploadError);
    statusMessage.textContent = "Image upload failed.";
    btn.disabled = false;
    btn.textContent = "Submit Activation";
    return;
  }

  // get public url
  const { data: publicData } = supabase.storage
    .from("proofs")
    .getPublicUrl(fileName);

  uploadedUrl = publicData.publicUrl;
}

  const data = {
  user_id: userId,
  reason: formData.get("reason"),
  agreed_to_rules: true,
  referral_code: formData.get("referral_code"),
  amount_points: parseInt(formData.get("amount")) || 25,
  proof_file_url: uploadedUrl
};

  // 👉 DIRECT INSERT (NO PRE-CHECK)
  const { error } = await supabase
    .from("activations")
    .insert([data]);

  // 🚨 HANDLE ERRORS PROPERLY
  if (error) {
    console.error(error);

    // 👇 THIS IS THE KEY FIX
    if (error.code === "23505") {
      form.innerHTML = `
        <div class="success-box">
          <h2>Already Submitted ✔</h2>
          <p>Your activation is under review.</p>
        </div>
      `;
      return;
    }

    statusMessage.textContent = "Something went wrong. Try again.";

    btn.disabled = false;
    btn.textContent = "Submit Activation";
    return;
  }

  // update user status
  await supabase
    .from("users")
    .eq("id", userId);

  form.innerHTML = `
    <div class="success-box">
      <h2>Activation Submitted ✔</h2>
      <p>Your submission is under review.</p>
    </div>
  `;
});


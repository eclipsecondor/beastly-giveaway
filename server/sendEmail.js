//Server/sendEmail.js
import dotenv from "dotenv";

dotenv.config({
  path: "../.env"
});

console.log(
  "TEST ENV:",
  process.env.SUPABASE_URL
);

import express from "express";
import cors from "cors";
import { Resend } from "resend";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { supabaseAdmin } from "./supabaseAdmin.js";



const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
  CHANGE THIS TO YOUR REAL DOMAIN
*/
const SITE_URL =
  process.env.SITE_URL ||
  "https://beastlygiveaway.site";


app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


/*
  SERVE ENTIRE FRONTEND
*/

app.use(
  express.static(
    path.join(__dirname, "..")
  )
);

/*
  DEFAULT HOME PAGE
*/

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "..",
      "index.html"
    )
  );

});


// ===============================
// CLEAN URL ROUTES (NO .HTML)
// ===============================

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "profile.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "dashboard.html"));
});

app.get("/activate", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "activate.html"));
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "leaderboard.html"));
});

app.get("/employment", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "employment.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "admin.html"));
});

app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "admin-login.html"));
});

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/send-activation-email", async (req, res) => {
  const { email, userId, name } = req.body;

  const activationLink = `${SITE_URL}/activate?userId=${userId}`;

  try {
    await resend.emails.send({
      from: "Beastly Giveaway <noreply@beastlygiveaway.site>",
      to: email,
      subject: "Complete Your Beastly Giveaway Activation",
      html: `
  <div style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    
    <div style="max-width:600px;margin:0 auto;background:#111;border-radius:10px;overflow:hidden;">
      
      <!-- HEADER BAR -->
      <div style="background:#00ffcc;color:#000;padding:12px;font-weight:bold;letter-spacing:1px;text-align:center;">
        BEASTLY GIVEAWAY
      </div>

      <div style="padding:40px 25px;text-align:center;">

        <h2 style="font-size:24px;margin-bottom:10px;">
          You're Almost In 🎉
        </h2>

        <p style="opacity:0.7;margin-bottom:25px;">
          Official Participant Notification
        </p>

        <!-- HIGHLIGHT BOX -->
        <div style="
          background:rgba(0,255,204,0.08);
          border:1px solid rgba(0,255,204,0.25);
          padding:20px;
          border-radius:8px;
          margin-bottom:30px;
        ">
          <p style="margin:0;font-size:15px;">
            Hi <strong>${name}</strong>, your application has been
            <strong>approved</strong>.
            <br/><br/>
            Complete your final activation step to secure your spot among participants.
          </p>
        </div>

        <!-- CTA BUTTON -->
        <a href="${activationLink}" 
           style="
             display:inline-block;
             padding:14px 32px;
             background:#00ffcc;
             color:#000;
             text-decoration:none;
             font-weight:bold;
             border-radius:6px;
             font-size:14px;
             letter-spacing:1px;
             margin-bottom:30px;
           ">
           COMPLETE ACTIVATION
        </a>

        <p style="font-size:12px;opacity:0.5;">
          This link is unique to you. Do not share it.
        </p>

      </div>

      <!-- FOOTER -->
      <div style="padding:20px;text-align:center;font-size:11px;opacity:0.4;">
        © 2026 Beastly Giveaway. All rights reserved.
      </div>

    </div>
  </div>
`
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email failed" });
  }
});


app.post("/send-activation-status-email", async (req, res) => {
  const { email, name, userId, status } = req.body;

  const dashboardLink =
    `${SITE_URL}/dashboard?userId=${userId}`;

  let subject = "";
  let html = "";

  // APPROVED
  if (status === "approved") {
    subject = "Your Beastly Dashboard Is Ready";

    html = `
      <div style="background:#0b0b0b;padding:40px;font-family:Arial;color:white;">
        <div style="max-width:600px;margin:auto;background:#111;border-radius:10px;padding:30px;text-align:center;">
          <h2 style="color:#00ffcc;">Approved ✔</h2>
          <p>Hello ${name}, your activation has been approved.</p>

          <a href="${dashboardLink}"
             style="display:inline-block;margin-top:20px;padding:14px 26px;background:#00ffcc;color:#000;text-decoration:none;font-weight:bold;border-radius:6px;">
             OPEN DASHBOARD
          </a>
        </div>
      </div>
    `;
  }

  // REJECTED
  else if (status === "rejected") {
    subject = "Activation Update";

    html = `
      <div style="background:#0b0b0b;padding:40px;font-family:Arial;color:white;">
        <div style="max-width:600px;margin:auto;background:#111;border-radius:10px;padding:30px;text-align:center;">
          <h2 style="color:#ff4d4d;">Not Approved</h2>
          <p>Hello ${name}, your recent activation was not approved.</p>
          <p>Please improve your submission and try again.</p>
        </div>
      </div>
    `;
  }

  // PENDING
  else {
    subject = "Activation Under Review";

    html = `
      <div style="background:#0b0b0b;padding:40px;font-family:Arial;color:white;">
        <div style="max-width:600px;margin:auto;background:#111;border-radius:10px;padding:30px;text-align:center;">
          <h2 style="color:#00ffcc;">Still Under Review</h2>
          <p>Hello ${name}, your activation is still under review.</p>
          <p>Please be patient while judges review submissions.</p>
        </div>
      </div>
    `;
  }

  try {
    await resend.emails.send({
      from: "Beastly Giveaway <noreply@beastlygiveaway.site>",
      to: email,
      subject,
      html
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email failed" });
  }
});

app.post("/submit-vote", async (req, res) => {

  const {
    userId,
    reason,
    referral_code,
    amount,
    proof_file_url
  } = req.body;

  try {

    // ================================
    // 🔍 CHECK REFERRAL CODE
    // ================================

    if (referral_code) {

      // ================================
      // 1️⃣ CHECK ACTIVATIONS
      // ================================

      const { data: activation } =
        await supabaseAdmin
          .from("activations")
          .select("*")
          .eq(
            "referral_code",
            referral_code
          )
          .maybeSingle();

      if (activation) {

        const { data: owner } =
          await supabaseAdmin
            .from("users")
            .select("full_name")
            .eq(
              "id",
              activation.user_id
            )
            .single();

        let message = "";

        // ⛔ pending
        if (
          activation.status ===
          "pending"
        ) {

          message =
            `This referral code is currently being used for activation (pending) by ${owner?.full_name}.`;

          await supabaseAdmin
            .from("retries")
            .insert([
              {
                referral_code,
                message
              }
            ]);

          return res.json({
            success: false,
            message
          });

        }

        // ⛔ approved
        if (
          activation.status ===
          "approved"
        ) {

          message =
            `This referral code was used to activate ${owner?.full_name}.`;

          await supabaseAdmin
            .from("retries")
            .insert([
              {
                referral_code,
                message
              }
            ]);

          return res.json({
            success: false,
            message
          });

        }

        // ================================
        // ⚠️ REJECTED ACTIVATION
        // ================================

        if (
          activation.status ===
          "rejected"
        ) {

          const rejectedDate =
            new Date(
              activation.created_at
            );

          const now =
            new Date();

          const diffDays =
            (now - rejectedDate) /
            (
              1000 *
              60 *
              60 *
              24
            );

          // ⛔ less than 5 days
          if (diffDays < 5) {

            const retryDate =
              new Date(
                rejectedDate
              );

            retryDate.setDate(
              retryDate.getDate() + 5
            );

            const message =
              `This referral code was rejected on ${rejectedDate.toLocaleDateString()}. You must wait 5 days before retrying. Retry available on ${retryDate.toLocaleDateString()} or contact support through email/live chat.`;

            await supabaseAdmin
              .from("retries")
              .insert([
                {
                  referral_code,
                  message
                }
              ]);

            return res.json({
              success: false,
              message
            });

          }

        }

      }

      // ================================
      // 2️⃣ CHECK VOTES
      // ================================

      const { data: vote } =
        await supabaseAdmin
          .from("votes")
          .select("*")
          .eq(
            "referral_code",
            referral_code
          )
          .maybeSingle();

      if (vote) {

        const { data: owner } =
          await supabaseAdmin
            .from("users")
            .select("full_name")
            .eq(
              "id",
              vote.user_id
            )
            .single();

        let message = "";

        // ================================
        // ⛔ PENDING
        // ================================

        if (
          vote.status ===
          "pending"
        ) {

          message =
            `This referral code has already been used for a vote (pending) for ${owner?.full_name}.`;

          await supabaseAdmin
            .from("retries")
            .insert([
              {
                referral_code,
                message
              }
            ]);

          return res.json({
            success: false,
            message
          });

        }

        // ================================
        // ⛔ APPROVED
        // ================================

        if (
          vote.status ===
          "approved"
        ) {

          message =
            `This referral code has already been counted as a vote for ${owner?.full_name}.`;

          await supabaseAdmin
            .from("retries")
            .insert([
              {
                referral_code,
                message
              }
            ]);

          return res.json({
            success: false,
            message
          });

        }

        // ================================
        // ⚠️ REJECTED VOTE
        // ================================

        if (
          vote.status ===
          "rejected"
        ) {

          const rejectedDate =
            new Date(
              vote.created_at
            );

          const now =
            new Date();

          const diffDays =
            (now - rejectedDate) /
            (
              1000 *
              60 *
              60 *
              24
            );

          // ⛔ less than 5 days
          if (diffDays < 5) {

            const retryDate =
              new Date(
                rejectedDate
              );

            retryDate.setDate(
              retryDate.getDate() + 5
            );

            message =
              `This referral code was rejected on ${rejectedDate.toLocaleDateString()}. You must wait 5 days before retrying. Retry available on ${retryDate.toLocaleDateString()} or contact support through email/live chat.`;

            await supabaseAdmin
              .from("retries")
              .insert([
                {
                  referral_code,
                  message
                }
              ]);

            return res.json({
              success: false,
              message
            });

          }

        }

      }

    }

    // ================================
    // ✅ INSERT VOTE
    // ================================

    const { error } =
      await supabaseAdmin
        .from("votes")
        .insert([
          {
            user_id: userId,
            reason,
            referral_code,
            amount,
            proof_file_url,
            status: "pending"
          }
        ]);

    if (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

    return res.json({

      success: true,

      message:
        "Vote submitted successfully and is under review."

    });

  }

  catch (err) {

    console.error(err);

    return res.status(500).json({

      success: false,

      message:
        "Server error"

    });

  }

});

app.post("/approve-vote", async (req, res) => {
  const { voteId } = req.body;

  try {
    // 1️⃣ Get vote details
    const { data: vote, error: voteError } = await supabaseAdmin
      .from("votes")
      .select("*")
      .eq("id", voteId)
      .single();

    if (voteError || !vote) throw voteError;

    // 2️⃣ Prevent double approval
    if (vote.status === "approved") {
      return res.json({
        success: false,
        message: "Vote already approved"
      });
    }

    // 3️⃣ Update vote status
    const { error: updateError } = await supabaseAdmin
      .from("votes")
      .update({ status: "approved" })
      .eq("id", voteId);

    if (updateError) throw updateError;

    // 4️⃣ Add points to user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("votes_count")
      .eq("id", vote.user_id)
      .single();

    if (userError) throw userError;

    const newVotes =
      (user.votes_count || 0) + (vote.amount || 0);

    const { error: incrementError } = await supabaseAdmin
      .from("users")
      .update({ votes_count: newVotes })
      .eq("id", vote.user_id);

    if (incrementError) throw incrementError;

    return res.json({
      success: true,
      message: "Vote approved and points added"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.post("/send-vote-status-email", async (req, res) => {
  const { email, name, amount, status, createdAt } = req.body;

  const voteDate = createdAt
  ? new Date(createdAt)
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
  : "an earlier date";

  let message = "";

  if (status === "approved") {

  message = `
  <div style="
    background:#f4f7fb;
    padding:40px 20px;
    font-family:Arial,sans-serif;
  ">

    <div style="
      max-width:600px;
      margin:auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 5px 20px rgba(0,0,0,.08);
    ">

      <div style="
        background:#00d084;
        padding:25px;
        text-align:center;
      ">
        <h1 style="
          margin:0;
          color:white;
          font-size:28px;
        ">
          Beastly Giveaway
        </h1>
      </div>

      <div style="padding:40px;">

        <h2 style="
          color:#00d084;
          margin-top:0;
        ">
          Vote Approved 🎉
        </h2>

        <p>
          Hi <strong>${name}</strong>,
        </p>

        <p>
          Great news! A vote submitted on your behalf has been approved.
        </p>

        <div style="
          background:#f8fffb;
          border:2px solid #00d084;
          border-radius:12px;
          padding:20px;
          margin:25px 0;
          text-align:center;
        ">

          <p style="
            margin:0;
            color:#666;
          ">
            Points Added
          </p>

          <h1 style="
            margin:10px 0 0;
            color:#00d084;
          ">
            +${amount}
          </h1>

        </div>

        <p>
          Keep sharing your referral code and growing your support.
        </p>

        <div style="text-align:center;margin-top:30px;">

          <a
            href="${SITE_URL}/dashboard"
            style="
              background:#00d084;
              color:white;
              text-decoration:none;
              padding:14px 28px;
              border-radius:10px;
              display:inline-block;
              font-weight:bold;
            "
          >
            View Dashboard
          </a>

        </div>

      </div>

      <div style="
        background:#f5f5f5;
        padding:20px;
        text-align:center;
        font-size:12px;
        color:#777;
      ">
        © 2026 Beastly Giveaway
      </div>

    </div>

  </div>
  `;

} else {

  message = `
  <div style="
    background:#f4f7fb;
    padding:40px 20px;
    font-family:Arial,sans-serif;
  ">

    <div style="
      max-width:600px;
      margin:auto;
      background:#ffffff;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 5px 20px rgba(0,0,0,.08);
    ">

      <div style="
        background:#ff4d4f;
        padding:25px;
        text-align:center;
      ">
        <h1 style="
          margin:0;
          color:white;
          font-size:28px;
        ">
          Beastly Giveaway
        </h1>
      </div>

      <div style="padding:40px;">

        <h2 style="
          color:#ff4d4f;
          margin-top:0;
        ">
          Vote Rejected
        </h2>

        <p>
          Hi <strong>${name}</strong>,
        </p>

        <p>
          Unfortunately, your <strong>${amount}</strong> points vote submitted on <strong>${voteDate}</strong> has been rejected. due to certain discrepancies in the submission. Please contact support through the live chat for further clarification or to resolve any issues.
        </p>

        <div style="
          background:#fff7f7;
          border:2px solid #ff4d4f;
          border-radius:12px;
          padding:20px;
          margin:25px 0;
        ">

          Please ensure future vote submissions
          follow all campaign guidelines and
          include valid information.

        </div>

        <p>
          You can continue receiving support and
          submitting valid votes.
        </p>

      </div>

      <div style="
        background:#f5f5f5;
        padding:20px;
        text-align:center;
        font-size:12px;
        color:#777;
      ">
        © 2026 Beastly Giveaway
      </div>

    </div>

  </div>
  `;

}

  try {
    await resend.emails.send({
      from: "Beastly Giveaway <noreply@beastlygiveaway.site>",
      to: email,
      subject: "Vote Update",
      html: message
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email failed" });
  }
});

app.post("/send-custom-email", async (req, res) => {

  const {
    emails,
    subject,
    message,
    buttonText,
    buttonUrl
  } = req.body;

  try {

for (const email of emails) {

  await resend.emails.send({

    from:
      "Beastly Giveaway <noreply@beastlygiveaway.site>",

    to: email,

    subject,

    html: buildEmailTemplate({

      title: subject,

      message,

      buttonText,

      buttonUrl

    })

  });

}

    return res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Email failed"
    });

  }

});


function buildEmailTemplate({
  title,
  message,
  buttonText,
  buttonUrl
}) {

  return `

  <div style="
    margin:0;
    padding:40px 20px;
    background:#0b0b0b;
    font-family:Arial,Helvetica,sans-serif;
    color:#ffffff;
  ">

    <div style="
      max-width:650px;
      margin:auto;
      background:#111111;
      border-radius:18px;
      overflow:hidden;
      border:1px solid rgba(255,255,255,.08);
    ">

      <!-- HEADER -->
      <div style="
        background:#00ffcc;
        color:#000;
        padding:18px;
        text-align:center;
        font-weight:bold;
        font-size:18px;
        letter-spacing:1px;
      ">
        BEASTLY GIVEAWAY
      </div>

      <!-- BODY -->
      <div style="
        padding:40px 30px;
      ">

        <h2 style="
          margin-top:0;
          font-size:28px;
          color:#ffffff;
          margin-bottom:20px;
        ">
          ${title}
        </h2>

        <div style="
          color:#bbbbbb;
          line-height:1.8;
          font-size:15px;
          white-space:pre-line;
        ">
          ${message}
        </div>

        ${
          buttonUrl
            ? `
          <div style="
            margin-top:35px;
            text-align:center;
          ">

            <a
              href="${buttonUrl}"
              style="
                display:inline-block;
                padding:14px 28px;
                background:#00ffcc;
                color:#000000;
                text-decoration:none;
                border-radius:10px;
                font-weight:bold;
                font-size:14px;
              "
            >
              ${buttonText || "OPEN"}
            </a>

          </div>
          `
            : ""
        }

      </div>

      <!-- FOOTER -->
      <div style="
        padding:20px;
        text-align:center;
        font-size:12px;
        color:#666666;
        border-top:1px solid rgba(255,255,255,.06);
      ">
        © 2026 Beastly Giveaway — All rights reserved.
      </div>

    </div>

  </div>

  `;
}

app.post("/send-application-status-email", async (req, res) => {

  const {
    email,
    userId,
    name,
    status
  } = req.body;

  const activationLink =
    `${SITE_URL}/activate?userId=${userId}`;

  let subject = "";
  let html = "";

  if (status === "approved") {

    subject =
      "Complete Your Beastly Giveaway Activation";

    html = `
    <div style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
      
      <div style="max-width:600px;margin:0 auto;background:#111;border-radius:10px;overflow:hidden;">
        
        <div style="background:#00ffcc;color:#000;padding:12px;font-weight:bold;letter-spacing:1px;text-align:center;">
          BEASTLY GIVEAWAY
        </div>

        <div style="padding:40px 25px;text-align:center;">

          <h2 style="font-size:24px;margin-bottom:10px;">
            You're Almost In 🎉
          </h2>

          <p style="opacity:0.7;margin-bottom:25px;">
            Official Participant Notification
          </p>

          <div style="
            background:rgba(0,255,204,0.08);
            border:1px solid rgba(0,255,204,0.25);
            padding:20px;
            border-radius:8px;
            margin-bottom:30px;
          ">
            <p style="margin:0;font-size:15px;">
              Hi <strong>${name}</strong>, your application has been
              <strong>approved</strong>.
              <br/><br/>
              Complete your final activation step to secure your spot among participants.
            </p>
          </div>

          <a href="${activationLink}"
             style="
               display:inline-block;
               padding:14px 32px;
               background:#00ffcc;
               color:#000;
               text-decoration:none;
               font-weight:bold;
               border-radius:6px;
               font-size:14px;
               letter-spacing:1px;
               margin-bottom:30px;
             ">
             COMPLETE ACTIVATION
          </a>

          <p style="font-size:12px;opacity:0.5;">
            This link is unique to you. Do not share it.
          </p>

        </div>

        <div style="padding:20px;text-align:center;font-size:11px;opacity:0.4;">
          © 2026 Beastly Giveaway. All rights reserved.
        </div>

      </div>
    </div>
    `;
  }

  else {

    subject =
      "Application Status Update";

    html = `
    <div style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
      
      <div style="max-width:600px;margin:0 auto;background:#111;border-radius:10px;overflow:hidden;">
        
        <div style="background:#ff4d4f;color:#fff;padding:12px;font-weight:bold;letter-spacing:1px;text-align:center;">
          BEASTLY GIVEAWAY
        </div>

        <div style="padding:40px 25px;text-align:center;">

          <h2 style="font-size:24px;margin-bottom:10px;color:#ff4d4f;">
            Application Not Approved
          </h2>

          <p style="opacity:0.7;margin-bottom:25px;">
            Participant Application Review
          </p>

          <div style="
            background:rgba(255,77,79,0.08);
            border:1px solid rgba(255,77,79,0.25);
            padding:20px;
            border-radius:8px;
            margin-bottom:30px;
          ">
            <p style="margin:0;font-size:15px;">
              Hi <strong>${name}</strong>,
              <br/><br/>
              After review, your application was not approved at this time.
            </p>
          </div>

          <p style="
            color:#bbbbbb;
            line-height:1.8;
          ">
            This may happen if submitted information could not be verified
            or did not meet current participation requirements.
          </p>

          <p style="
            color:#bbbbbb;
            line-height:1.8;
            margin-top:20px;
          ">
            If you believe this decision was made in error,
            please contact support through the website live chat.
          </p>

        </div>

        <div style="padding:20px;text-align:center;font-size:11px;opacity:0.4;">
          © 2026 Beastly Giveaway. All rights reserved.
        </div>

      </div>
    </div>
    `;
  }

  try {

    await resend.emails.send({

      from:
        "Beastly Giveaway <noreply@beastlygiveaway.site>",

      to: email,

      subject,

      html

    });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Email failed"
    });

  }

});

import bcrypt from "bcryptjs";

app.post("/admin-login", async (req, res) => {

  const { password } = req.body;

  try {

    const { data, error } =
      await supabaseAdmin
        .from("settings")
        .select("value")
        .eq("key", "admin_password")
        .single();

    if (error || !data) {

      return res.json({
        success: false,
        message: "Password not configured"
      });

    }

    const isValid =
      await bcrypt.compare(
        password,
        data.value
      );

    if (!isValid) {

      return res.json({
        success: false,
        message: "Incorrect password"
      });

    }

    return res.json({
      success: true
    });

  }

  catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

app.post(
  "/submit-employment-application",
  upload.fields([
    { name: "id_card", maxCount: 1 },
    { name: "cv", maxCount: 1 }
  ]),
  async (req, res) => {

    try {

      const {
        full_name,
        email,
        phone,
        location,
        date_of_birth,
        id_type,
        id_number,
        employment_history,
        experience,
        motivation,
        availability,
        additional_information
      } = req.body;

      const idCard =
        req.files?.id_card?.[0];

      const cv =
        req.files?.cv?.[0];


      // -------------------------
      // BASIC VALIDATION
      // -------------------------

      if (
        !full_name ||
        !email ||
        !phone
      ) {
        return res.status(400).json({
          error:
            "Please complete all required fields."
        });
      }

      // -------------------------
// CHECK FOR EXISTING APPLICATION
// -------------------------

const normalizedEmail =
  email.trim().toLowerCase();

const {
  data: existingApplication,
  error: existingApplicationError
} = await supabaseAdmin
  .from("employment_applications")
  .select("id")
  .eq("email", normalizedEmail)
  .maybeSingle();

if (existingApplicationError) {

  console.error(
    "Employment duplicate check error:",
    existingApplicationError
  );

  return res.status(500).json({
    error:
      "We were unable to verify your application. Please try again."
  });

}

if (existingApplication) {

  return res.status(409).json({
    code: "APPLICATION_ALREADY_EXISTS",
    error:
      "You have already submitted an employment application using this email address. Your application has already been received. You will receive an email when there is an update regarding your application. Please also check your spam or junk folder."
  });

}


      // -------------------------
      // FILE VALIDATION
      // -------------------------

      const allowedIdTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
      ];

      const allowedCvTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];


      // Validate ID only if uploaded
      if (idCard) {

        if (!allowedIdTypes.includes(idCard.mimetype)) {

          return res.status(400).json({
            error:
              "ID card must be PDF, JPG or PNG."
          });

        }

      }


      // Validate CV only if uploaded
      if (cv) {

        if (!allowedCvTypes.includes(cv.mimetype)) {

          return res.status(400).json({
            error:
              "CV must be PDF, DOC or DOCX."
          });

        }

      }


      // -------------------------
      // CREATE APPLICATION
      // -------------------------

      const { data: application, error: insertError } =
        await supabaseAdmin
          .from("employment_applications")
          .insert({

            full_name:
              full_name.trim(),

            email:
              normalizedEmail,

            phone:
              phone.trim(),

            location:
              location?.trim() || null,

            date_of_birth:
              date_of_birth || null,

            id_type:
              id_type?.trim() || null,

            id_number:
              id_number?.trim() || null,

            id_card_url:
              null,

            cv_url:
              null,

            employment_history:
              employment_history?.trim() || null,

            experience:
              experience?.trim() || null,

            motivation:
              motivation?.trim() || null,

            availability:
              availability || null,

            additional_information:
              additional_information?.trim() || null,

            status:
              "pending"

          })
          .select()
          .single();


      if (insertError) {

        console.error(
          "Employment database error:",
          insertError
        );

        return res.status(500).json({
          error:
            "Unable to save your application."
        });

      }


      const applicationId =
        application.id;


      // -------------------------
      // SAFE FILE NAME
      // -------------------------

      const safeName =
        full_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");


      let idCardPath = null;
      let cvPath = null;


      // -------------------------
      // UPLOAD ID CARD IF PROVIDED
      // -------------------------

      if (idCard) {

        const idExtension =
          idCard.originalname
            .split(".")
            .pop()
            .toLowerCase();

        idCardPath =
          `${applicationId}/id-card/${safeName}-id.${idExtension}`;


        const {
          error: idUploadError
        } = await supabaseAdmin
          .storage
          .from("employment-documents")
          .upload(
            idCardPath,
            idCard.buffer,
            {
              contentType:
                idCard.mimetype,

              upsert:
                false
            }
          );


        if (idUploadError) {

          console.error(
            "ID upload error:",
            idUploadError
          );


          await supabaseAdmin
            .from("employment_applications")
            .delete()
            .eq("id", applicationId);


          return res.status(500).json({
            error:
              "Unable to upload identification document."
          });

        }

      }


      // -------------------------
      // UPLOAD CV IF PROVIDED
      // -------------------------

      if (cv) {

        const cvExtension =
          cv.originalname
            .split(".")
            .pop()
            .toLowerCase();

        cvPath =
          `${applicationId}/cv/${safeName}-cv.${cvExtension}`;


        const {
          error: cvUploadError
        } = await supabaseAdmin
          .storage
          .from("employment-documents")
          .upload(
            cvPath,
            cv.buffer,
            {
              contentType:
                cv.mimetype,

              upsert:
                false
            }
          );


        if (cvUploadError) {

          console.error(
            "CV upload error:",
            cvUploadError
          );


          // Remove ID card if it was
          // already uploaded
          if (idCardPath) {

            await supabaseAdmin
              .storage
              .from("employment-documents")
              .remove([
                idCardPath
              ]);

          }


          await supabaseAdmin
            .from("employment_applications")
            .delete()
            .eq("id", applicationId);


          return res.status(500).json({
            error:
              "Unable to upload CV."
          });

        }

      }


      // -------------------------
      // SAVE DOCUMENT PATHS
      // -------------------------

      const {
        error: updateError
      } = await supabaseAdmin
        .from("employment_applications")
        .update({

          id_card_url:
            idCardPath,

          cv_url:
            cvPath,

          updated_at:
            new Date().toISOString()

        })
        .eq("id", applicationId);


      if (updateError) {

        console.error(
          "Employment update error:",
          updateError
        );


        // Clean up uploaded files
        const filesToRemove = [];

        if (idCardPath) {
          filesToRemove.push(idCardPath);
        }

        if (cvPath) {
          filesToRemove.push(cvPath);
        }

        if (filesToRemove.length > 0) {

          await supabaseAdmin
            .storage
            .from("employment-documents")
            .remove(filesToRemove);

        }


        await supabaseAdmin
          .from("employment_applications")
          .delete()
          .eq("id", applicationId);


        return res.status(500).json({
          error:
            "Application could not be completed."
        });

      }


      // -------------------------
      // SUCCESS
      // -------------------------

      // SEND EMAILS
try {

  // EMAIL TO APPLICANT
  await resend.emails.send({
    from: "Beastly Giveaway <noreply@beastlygiveaway.site>",
    to: email.trim().toLowerCase(),
    subject: "Application Received - Disbursement Officer",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #1f2937;
    }

    .wrapper {
      width: 100%;
      padding: 40px 15px;
      box-sizing: border-box;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 18px rgba(0,0,0,0.06);
    }

    .header {
      background: #111827;
      padding: 28px 30px;
      text-align: center;
    }

    .logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      color: #9ca3af;
      font-size: 13px;
      margin-top: 6px;
    }

    .content {
      padding: 38px 35px;
    }

    .badge {
      display: inline-block;
      background: #fff7ed;
      color: #c2410c;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 12px;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    h1 {
      margin: 0 0 15px;
      font-size: 26px;
      color: #111827;
    }

    p {
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 16px;
      color: #4b5563;
    }

    .application-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 18px 20px;
      margin: 25px 0;
    }

    .application-box .label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
    }

    .application-box .value {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
    }

    .status {
      color: #b45309;
    }

    .next-step {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 16px 18px;
      border-radius: 6px;
      margin: 25px 0;
    }

    .next-step strong {
      color: #166534;
    }

    .footer {
      background: #f9fafb;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }

    .footer p {
      font-size: 12px;
      color: #9ca3af;
      margin: 5px 0;
    }

    @media (max-width: 480px) {
      .content {
        padding: 30px 22px;
      }

      h1 {
        font-size: 23px;
      }
    }
  </style>
</head>

<body>

  <div class="wrapper">

    <div class="container">

      <div class="header">
        <div class="logo">
          Beastly Giveaway
        </div>

        <div class="header-subtitle">
          Employment Application
        </div>
      </div>


      <div class="content">

        <div class="badge">
          APPLICATION RECEIVED
        </div>

        <h1>
          Thank you, ${full_name.trim()}!
        </h1>

        <p>
          We have successfully received your application
          for the <strong>Disbursement Officer</strong> position.
        </p>

        <p>
          Your application has been submitted successfully
          and is now awaiting review by our team.
        </p>


        <div class="application-box">

          <div class="label">
            POSITION
          </div>

          <div class="value">
            Disbursement Officer
          </div>

          <br>

          <div class="label">
            APPLICATION ID
          </div>

          <div class="value">
            ${applicationId}
          </div>

          <br>

          <div class="label">
            CURRENT STATUS
          </div>

          <div class="value status">
            Pending Review
          </div>

        </div>


        <div class="next-step">

          <strong>What's next?</strong>

          <p style="margin: 8px 0 0;">
            Our team will review your application.
            Your next step will be communicated to you
            by email.
          </p>

        </div>


        <p>
          Please keep an eye on your inbox for future
          updates regarding your application.
        </p>

        <p>
          Thank you for your interest in joining
          <strong>Beastly Giveaway</strong>.
        </p>

      </div>


      <div class="footer">

        <p>
          © ${new Date().getFullYear()} Beastly Giveaway
        </p>

        <p>
          This is an automated email. Please do not reply
          to this message.
        </p>

      </div>

    </div>

  </div>

</body>
</html>
`
  });


  // EMAIL TO ADMIN
  if (process.env.ADMIN_EMAIL) {

    await resend.emails.send({
      from: "Beastly Giveaway <noreply@beastlygiveaway.site>",
      to: process.env.ADMIN_EMAIL,
      subject: "New Employment Application - Disbursement Officer",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #1f2937;
    }

    .wrapper {
      width: 100%;
      padding: 40px 15px;
      box-sizing: border-box;
    }

    .container {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 18px rgba(0,0,0,0.06);
    }

    .header {
      background: #111827;
      padding: 28px 30px;
    }

    .logo {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
    }

    .header-subtitle {
      color: #9ca3af;
      font-size: 13px;
      margin-top: 6px;
    }

    .content {
      padding: 35px;
    }

    .alert {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 15px 18px;
      border-radius: 6px;
      margin-bottom: 25px;
    }

    .alert strong {
      color: #1d4ed8;
    }

    h1 {
      margin: 0 0 15px;
      font-size: 25px;
      color: #111827;
    }

    p {
      font-size: 14px;
      line-height: 1.7;
      color: #4b5563;
    }

    .details {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 25px;
    }

    .row {
      padding: 15px 18px;
      border-bottom: 1px solid #e5e7eb;
    }

    .row:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .5px;
      color: #6b7280;
      margin-bottom: 5px;
    }

    .value {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      word-break: break-word;
    }

    .pending {
      color: #b45309;
    }

    .footer {
      background: #f9fafb;
      padding: 22px 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }

    .footer p {
      font-size: 12px;
      color: #9ca3af;
      margin: 5px 0;
    }

    @media (max-width: 480px) {
      .content {
        padding: 25px 20px;
      }
    }
  </style>
</head>

<body>

  <div class="wrapper">

    <div class="container">

      <div class="header">

        <div class="logo">
          Beastly Giveaway
        </div>

        <div class="header-subtitle">
          Admin Employment Notification
        </div>

      </div>


      <div class="content">

        <div class="alert">

          <strong>
            New employment application received
          </strong>

        </div>


        <h1>
          Disbursement Officer Application
        </h1>

        <p>
          A new applicant has submitted an employment
          application and it is ready for review.
        </p>


        <div class="details">

          <div class="row">

            <div class="label">
              Applicant
            </div>

            <div class="value">
              ${full_name.trim()}
            </div>

          </div>


          <div class="row">

            <div class="label">
              Email
            </div>

            <div class="value">
              ${email.trim().toLowerCase()}
            </div>

          </div>


          <div class="row">

            <div class="label">
              Phone
            </div>

            <div class="value">
              ${phone.trim()}
            </div>

          </div>


          <div class="row">

            <div class="label">
              Location
            </div>

            <div class="value">
              ${location?.trim() || "Not provided"}
            </div>

          </div>


          <div class="row">

            <div class="label">
              Application ID
            </div>

            <div class="value">
              ${applicationId}
            </div>

          </div>


          <div class="row">

            <div class="label">
              Status
            </div>

            <div class="value pending">
              Pending Review
            </div>

          </div>

        </div>


        <p style="margin-top:25px;">
          Log in to the admin dashboard to review the
          applicant's information and documents.
        </p>

      </div>


      <div class="footer">

        <p>
          © ${new Date().getFullYear()} Beastly Giveaway
        </p>

        <p>
          Automated employment notification
        </p>

      </div>

    </div>

  </div>

</body>
</html>
`
    });

  }

} catch (emailError) {

  // Do not fail the application if email delivery has an issue
  console.error(
    "Employment email error:",
    emailError
  );

}


// SUCCESS
return res.status(201).json({
  success: true,

  message:
    "Employment application submitted successfully.",

  applicationId
});


    } catch (error) {

      console.error(
        "Employment application server error:",
        error
      );

      return res.status(500).json({

        error:
          "Something went wrong while submitting your application."

      });

    }

  }
);

// ==========================================
// EMPLOYMENT APPLICATIONS - ADMIN
// ==========================================

app.get("/admin/employment-applications", async (req, res) => {

  try {

    const { data, error } = await supabaseAdmin
      .from("employment_applications")
      .select(`
        id,
        full_name,
        email,
        phone,
        location,
        date_of_birth,
        id_type,
        id_number,
        id_card_url,
        cv_url,
        employment_history,
        experience,
        motivation,
        availability,
        additional_information,
        status,
        created_at,
        updated_at
      `)
      .order("created_at", {
        ascending: false
      });

    if (error) {

      console.error(
        "Employment applications fetch error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to load employment applications."
      });

    }

    return res.json({
      success: true,
      applications: data || []
    });

  } catch (error) {

    console.error(
      "Employment admin endpoint error:",
      error
    );

    return res.status(500).json({
      error:
        "Something went wrong while loading applications."
    });

  }

});


// ==========================================
// 💼 EMPLOYMENT - APPROVE / REJECT
// ==========================================

app.post(
  "/admin/employment-applications/:id/status",
  async (req, res) => {

    const applicationId =
      req.params.id;

    const {
      status
    } = req.body;


    // Only these two actions are allowed
    if (
      status !== "approved" &&
      status !== "rejected"
    ) {

      return res.status(400).json({
        success: false,
        error:
          "Invalid employment application status."
      });

    }


    try {

      // ==========================================
      // 1. GET APPLICATION
      // ==========================================

      const {
        data: application,
        error: fetchError
      } = await supabaseAdmin
        .from("employment_applications")
        .select(`
          id,
          full_name,
          email,
          status
        `)
        .eq("id", applicationId)
        .single();


      if (fetchError) {

        console.error(
          "Employment application fetch error:",
          fetchError
        );

        return res.status(404).json({
          success: false,
          error:
            "Employment application not found."
        });

      }


      // ==========================================
      // 2. DON'T PROCESS SAME STATUS AGAIN
      // ==========================================

      if (
        String(application.status)
          .toLowerCase() === status
      ) {

        return res.json({
          success: true,
          message:
            `Application is already ${status}.`,
          status
        });

      }


      // ==========================================
      // 3. UPDATE DATABASE
      // ==========================================

      const {
        error: updateError
      } = await supabaseAdmin
        .from("employment_applications")
        .update({
          status,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", applicationId);


      if (updateError) {

        console.error(
          "Employment status update error:",
          updateError
        );

        return res.status(500).json({
          success: false,
          error:
            "Unable to update application status."
        });

      }


      // ==========================================
      // 4. SEND EMAIL
      // ==========================================

      try {

        const applicantName =
          application.full_name ||
          "Applicant";

        const applicantEmail =
          application.email;


        let subject = "";

        let html = "";


        // ==========================================
        // APPROVED EMAIL
        // ==========================================

        if (status === "approved") {

          subject =
            "Your Beastly Giveaway Employment Application Has Been Approved";


          html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      padding:40px 15px;
    "
  >

    <div
      style="
        max-width:620px;
        margin:auto;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 5px 20px rgba(0,0,0,.08);
      "
    >

      <!-- HEADER -->

      <div
        style="
          background:#111827;
          padding:28px 30px;
          text-align:center;
        "
      >

        <div
          style="
            color:#ffffff;
            font-size:24px;
            font-weight:800;
          "
        >
          Beastly Giveaway
        </div>

        <div
          style="
            color:#9ca3af;
            font-size:13px;
            margin-top:6px;
          "
        >
          Employment Department
        </div>

      </div>


      <!-- CONTENT -->

      <div
        style="
          padding:35px;
        "
      >

        <div
          style="
            background:#ecfdf3;
            border:1px solid #abefc6;
            color:#027a48;
            padding:15px 18px;
            border-radius:10px;
            font-weight:700;
            margin-bottom:25px;
          "
        >
          Application Approved ✓
        </div>


        <h1
          style="
            margin:0 0 15px;
            color:#111827;
            font-size:25px;
          "
        >
          Congratulations, ${applicantName}
        </h1>


        <p
          style="
            color:#4b5563;
            font-size:15px;
            line-height:1.7;
          "
        >
          We are pleased to let you know that your
          application for the
          <strong>Disbursement Officer</strong>
          position has been approved.
        </p>


        <div
          style="
            margin:25px 0;
            padding:20px;
            background:#f9fafb;
            border-radius:10px;
            border:1px solid #e5e7eb;
          "
        >

          <div
            style="
              font-size:11px;
              color:#667085;
              text-transform:uppercase;
              margin-bottom:6px;
            "
          >
            Position
          </div>

          <div
            style="
              font-size:16px;
              font-weight:700;
              color:#111827;
            "
          >
            Disbursement Officer
          </div>

        </div>


        <p
          style="
            color:#4b5563;
            font-size:15px;
            line-height:1.7;
          "
        >
          Our team will contact you with the next steps
          and any additional information required.
        </p>


        <p
          style="
            color:#4b5563;
            font-size:15px;
            line-height:1.7;
          "
        >
          Please keep an eye on your email for further
          instructions.
        </p>

      </div>


      <!-- FOOTER -->

      <div
        style="
          background:#f9fafb;
          padding:20px;
          text-align:center;
          border-top:1px solid #e5e7eb;
        "
      >

        <p
          style="
            margin:4px 0;
            color:#9ca3af;
            font-size:12px;
          "
        >
          © ${new Date().getFullYear()}
          Beastly Giveaway
        </p>

        <p
          style="
            margin:4px 0;
            color:#9ca3af;
            font-size:12px;
          "
        >
          Automated employment notification
        </p>

      </div>

    </div>

  </div>

</body>
</html>
          `;

        }


        // ==========================================
        // REJECTED EMAIL
        // ==========================================

        else {

          subject =
            "Update Regarding Your Beastly Giveaway Employment Application";


          html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      padding:40px 15px;
    "
  >

    <div
      style="
        max-width:620px;
        margin:auto;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 5px 20px rgba(0,0,0,.08);
      "
    >

      <!-- HEADER -->

      <div
        style="
          background:#111827;
          padding:28px 30px;
          text-align:center;
        "
      >

        <div
          style="
            color:#ffffff;
            font-size:24px;
            font-weight:800;
          "
        >
          Beastly Giveaway
        </div>

        <div
          style="
            color:#9ca3af;
            font-size:13px;
            margin-top:6px;
          "
        >
          Employment Department
        </div>

      </div>


      <!-- CONTENT -->

      <div
        style="
          padding:35px;
        "
      >

        <div
          style="
            background:#fef3f2;
            border:1px solid #fecdca;
            color:#b42318;
            padding:15px 18px;
            border-radius:10px;
            font-weight:700;
            margin-bottom:25px;
          "
        >
          Application Update
        </div>


        <h1
          style="
            margin:0 0 15px;
            color:#111827;
            font-size:25px;
          "
        >
          Hello, ${applicantName}
        </h1>


        <p
          style="
            color:#4b5563;
            font-size:15px;
            line-height:1.7;
          "
        >
          Thank you for your interest in the
          <strong>Disbursement Officer</strong>
          position at Beastly Giveaway.
        </p>


        <p
          style="
            color:#4b5563;
            font-size:15px;
            line-height:1.7;
          "
        >
          After reviewing your application, we are unable
          to move forward with your application at this time.
        </p>


        <div
          style="
            margin:25px 0;
            padding:20px;
            background:#f9fafb;
            border-radius:10px;
            border:1px solid #e5e7eb;
          "
        >

          <p
            style="
              margin:0;
              color:#667085;
              font-size:13px;
              line-height:1.6;
            "
          >
            We appreciate the time and effort you put into
            your application and encourage you to watch for
            future opportunities.
          </p>

        </div>


        <p
          style="
            color:#4b5563;
            font-size:15px;
            line-height:1.7;
          "
        >
          Thank you for your interest in Beastly Giveaway.
        </p>

      </div>


      <!-- FOOTER -->

      <div
        style="
          background:#f9fafb;
          padding:20px;
          text-align:center;
          border-top:1px solid #e5e7eb;
        "
      >

        <p
          style="
            margin:4px 0;
            color:#9ca3af;
            font-size:12px;
          "
        >
          © ${new Date().getFullYear()}
          Beastly Giveaway
        </p>

        <p
          style="
            margin:4px 0;
            color:#9ca3af;
            font-size:12px;
          "
        >
          Automated employment notification
        </p>

      </div>

    </div>

  </div>

</body>
</html>
          `;

        }


        // Send email

        await resend.emails.send({
          from:
            "Beastly Giveaway <noreply@beastlygiveaway.site>",

          to:
            applicantEmail,

          subject,

          html
        });

      } catch (emailError) {

        console.error(
          "Employment status email failed:",
          emailError
        );

        // Important:
        // The status was already updated.
        // We do NOT roll it back just because
        // email delivery failed.
      }


      // ==========================================
      // SUCCESS
      // ==========================================

      return res.json({
        success: true,
        message:
          `Application ${status} successfully.`,
        status
      });

    } catch (error) {

      console.error(
        "Employment status endpoint error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Something went wrong while updating the application."
      });

    }

  }
);


// ==========================================
// 💼 EMPLOYMENT - VIEW PRIVATE DOCUMENT
// ==========================================

app.get(
  "/admin/employment-applications/:id/document/:type",
  async (req, res) => {

    const {
      id,
      type
    } = req.params;


    if (
      type !== "id-card" &&
      type !== "cv"
    ) {

      return res.status(400).json({
        success: false,
        error:
          "Invalid document type."
      });

    }


    try {

      // ==========================================
      // GET APPLICATION
      // ==========================================

      const {
        data: application,
        error
      } = await supabaseAdmin
        .from("employment_applications")
        .select(
          "id,id_card_url,cv_url"
        )
        .eq("id", id)
        .single();


      if (error || !application) {

        return res.status(404).json({
          success: false,
          error:
            "Employment application not found."
        });

      }


      const filePath =
        type === "id-card"
          ? application.id_card_url
          : application.cv_url;


      if (!filePath) {

        return res.status(404).json({
          success: false,
          error:
            "This document was not provided."
        });

      }


      // ==========================================
      // CREATE TEMPORARY SIGNED URL
      // ==========================================

      const {
        data: signedUrlData,
        error: signedUrlError
      } =
        await supabaseAdmin
          .storage
          .from("employment-documents")
          .createSignedUrl(
            filePath,
            300
          );


      if (signedUrlError) {

        console.error(
          "Signed URL error:",
          signedUrlError
        );

        return res.status(500).json({
          success: false,
          error:
            "Unable to create document link."
        });

      }


      return res.json({
        success: true,
        url: signedUrlData.signedUrl
      });

    } catch (error) {

      console.error(
        "Employment document endpoint error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to open document."
      });

    }

  }
);

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
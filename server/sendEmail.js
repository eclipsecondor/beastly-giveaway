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

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/send-activation-email", async (req, res) => {
  const { email, userId, name } = req.body;

  const activationLink = `${SITE_URL}/pages/activate.html?userId=${userId}`;

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
    `${SITE_URL}/pages/dashboard.html?userId=${userId}`;

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
            href="${SITE_URL}/pages/dashboard.html"
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
    `${SITE_URL}/pages/activate.html?userId=${userId}`;

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

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
// ── EmailJS Implementation ──────────────────────────────────────────────────
// Uses EmailJS REST API to send emails instead of SMTP

const sendEmailJS = async (templateParams) => {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY,
    template_params: templateParams,
  };

  try {
    const axios = require('axios');
    const res = await axios.post("https://api.emailjs.com/api/v1.0/email/send", payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("[EmailJS Success]:", res.data);
  } catch (err) {
    console.error("[EmailJS Exception]:", err.response?.data || err.message);
    throw new Error(`EmailJS failed: ${err.response?.data || err.message}`);
  }
};

// ── Shared HTML wrapper ───────────────────────────────────────────────────────
const htmlWrapper = (content) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
        .card { max-width: 560px; margin: 32px auto; background: #fff;
                border-radius: 12px; overflow: hidden;
                box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed);
                  padding: 28px 32px; color: #fff; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
        .header p  { margin: 4px 0 0; opacity: 0.85; font-size: 13px; }
        .body   { padding: 28px 32px; color: #374151; line-height: 1.6; }
        .table  { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .table td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px; }
        .table td:first-child { background: #f9fafb; font-weight: 600; width: 40%; }
        .badge-green { display:inline-block; background:#d1fae5; color:#065f46;
                       padding:4px 12px; border-radius:99px; font-weight:700; }
        .badge-red   { display:inline-block; background:#fee2e2; color:#991b1b;
                       padding:4px 12px; border-radius:99px; font-weight:700; }
        .footer { background:#f9fafb; padding:16px 32px; text-align:center;
                  font-size:12px; color:#9ca3af; border-top:1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🎯 SkillSphere</h1>
          <p>Talent Utilization &amp; Mobility Portal</p>
        </div>
        <div class="body">${content}</div>
        <div class="footer">© ${new Date().getFullYear()} SkillSphere · This is an automated message.</div>
      </div>
    </body>
  </html>
`;

// ── sendAssessmentEmail ───────────────────────────────────────────────────────
exports.sendAssessmentEmail = async (to, name, role, date, time) => {
  const content = `
    <h2>Hi ${name}! 👋</h2>
    <p>Great news — you've been selected for a technical assessment. Here are your details:</p>
    <table class="table">
      <tr><td>📋 Role</td><td><strong>${role}</strong></td></tr>
      <tr><td>📅 Date</td><td><strong>${date}</strong></td></tr>
      <tr><td>⏰ Time</td><td><strong>${time}</strong></td></tr>
      <tr><td>⏱️ Duration</td><td>30 minutes</td></tr>
      <tr><td>📝 Format</td><td>30 multiple-choice questions</td></tr>
    </table>
    <p>Log in to <strong>SkillSphere</strong> before your assessment time and navigate to 
       <em>My Assessments</em>. The <strong>Start</strong> button will be enabled at the 
       scheduled time.</p>
  `;

  await sendEmailJS({
    to_email: to,
    email: to,
    user_email: to,
    to: to,
    to_name: name,
    role: role,
    date: date,
    time: time,
    subject: `📋 Assessment Scheduled: ${role}`,
    message: htmlWrapper(content),
    html_message: htmlWrapper(content),
  });
};

// ── sendResultEmail ───────────────────────────────────────────────────────────
exports.sendResultEmail = async (to, name, role, action, feedback) => {
  const accepted = action === "accepted";
  const content = `
    <h2>Hi ${name}!</h2>
    <p>Your assessment result for <strong>${role}</strong> is ready:</p>
    <p>
      <span class="${accepted ? "badge-green" : "badge-red"}">
        ${accepted ? "✅ ACCEPTED — Congratulations!" : "❌ Not Selected This Time"}
      </span>
    </p>
    ${
      accepted
        ? `<p>You've successfully cleared the assessment for <strong>${role}</strong>. 
           Our HR team will reach out to you shortly with next steps. 🎉</p>`
        : `<p>Unfortunately you didn't meet the cutoff for <strong>${role}</strong> 
           this time. Don't be discouraged — keep building your skills!</p>`
    }
    ${
      feedback
        ? `<div style="background:#f9fafb;border-left:4px solid #4f46e5;
                       padding:12px 16px;margin:16px 0;border-radius:4px;">
             <strong>HR Feedback:</strong><br/>${feedback}
           </div>`
        : ""
    }
  `;

  await sendEmailJS({
    to_email: to,
    email: to,
    user_email: to,
    to: to,
    to_name: name,
    role: role,
    action: action,
    feedback: feedback || "",
    subject: `${accepted ? "✅" : "❌"} Assessment Result: ${role}`,
    message: htmlWrapper(content),
    html_message: htmlWrapper(content),
  });
};

// ── sendOtpEmail ──────────────────────────────────────────────────────────────
exports.sendOtpEmail = async (to, name, otp) => {
  const content = `
    <h2>Hi ${name}! 🔐</h2>
    <p>Use the code below to verify your SkillSphere account:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;
                   color:#4f46e5;background:#eef2ff;padding:12px 24px;
                   border-radius:8px;">${otp}</span>
    </div>
    <p style="color:#6b7280;font-size:13px;">
      This code expires in <strong>10 minutes</strong>. 
      If you didn't request this, please ignore this email.
    </p>
  `;

  await sendEmailJS({
    to_email: to,
    email: to,
    user_email: to,
    to: to,
    to_name: name,
    otp: otp,
    subject: `🔐 Your SkillSphere Verification Code: ${otp}`,
    message: htmlWrapper(content),
    html_message: htmlWrapper(content),
  });
};

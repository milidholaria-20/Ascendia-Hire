const nodemailer = require("nodemailer");

// One reusable transporter — nodemailer keeps a small connection pool internally
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify credentials once at startup so a bad app-password fails loudly,
// not silently on the first job post.
transporter.verify((err) => {
    if (err) {
        console.error("⚠️  Email transporter failed to verify:", err.message);
        console.error("   Job-match emails will not be sent until EMAIL_USER / EMAIL_PASS are fixed in .env");
    } else {
        console.log("✅  Email transporter ready");
    }
});

/**
 * Sends a "new job matches your skills" email to one student.
 * Fire-and-forget by design — callers should NOT await this in the
 * request/response cycle, so a slow email server never delays the API response.
 */
async function sendJobMatchEmail({ to, studentName, jobTitle, company, matchedSkills }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return; // not configured — skip silently

    const skillList = matchedSkills.length
        ? matchedSkills.join(", ")
        : "your profile";

    const mailOptions = {
        from: `"Ascendia Hire" <${process.env.EMAIL_USER}>`,
        to,
        subject: `New job match: ${jobTitle} at ${company}`,
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
                <h2 style="color:#0f172a;margin-bottom:4px">Hi ${studentName || "there"} 👋</h2>
                <p style="color:#475569;font-size:14px;line-height:1.6">
                    A new job matching your skills was just posted on <strong>Ascendia Hire</strong>.
                </p>
                <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0">
                    <p style="margin:0;font-weight:700;color:#0f172a">${jobTitle}</p>
                    <p style="margin:4px 0 0;color:#64748b;font-size:13px">${company}</p>
                    <p style="margin:10px 0 0;color:#334155;font-size:13px">Matched skills: ${skillList}</p>
                </div>
                <p style="color:#94a3b8;font-size:12px">
                    You're receiving this because your profile skills overlap with this job's requirements.
                    Log in to Ascendia Hire to view full details and apply.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧  Job-match email sent to ${to}`);
    } catch (err) {
        console.error(`⚠️  Failed to send job-match email to ${to}:`, err.message);
    }
}

module.exports = { sendJobMatchEmail };

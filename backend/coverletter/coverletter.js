const express = require("express");
const Groq    = require("groq-sdk");
const Profile = require("../models/Profile");
const Job     = require("../models/Job");

const router = express.Router();

let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
    console.warn("⚠️  GROQ_API_KEY not set — cover letter generation will be disabled until it's added to .env");
}

// ================= GENERATE COVER LETTER =================
router.post("/generate", async (req, res) => {
    const { email, jobId } = req.body;

    if (!groq) {
        return res.status(503).json({ message: "Cover letter generation is not configured. Add GROQ_API_KEY to backend/.env and restart the server." });
    }
    if (!email || !jobId) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        const profile = await Profile.findOne({ email: email.toLowerCase() });
        if (!profile) return res.json({ message: "Profile not found" });

        const job = await Job.findById(jobId);
        if (!job) return res.json({ message: "Job not found" });

        const normalize = s => s.trim().toLowerCase();
        const userSkillsNorm = (profile.skills || []).map(normalize);
        const matchedSkills = (job.requiredSkills || []).filter(s => userSkillsNorm.includes(normalize(s)));

        // Build a compact, factual prompt — the model should only use what's
        // actually true about this student, not invent experience they don't have.
        const prompt = `Write a concise, professional cover letter (250-350 words) for a student applying to a job. Use only the facts given below — do not invent skills, projects, or experience not listed.

STUDENT
Name: ${profile.name || "the applicant"}
Program: ${profile.program || "N/A"}
Bio: ${profile.bio || "N/A"}
Skills: ${(profile.skills || []).join(", ") || "N/A"}

JOB
Title: ${job.title}
Company: ${job.company}
Required skills: ${(job.requiredSkills || []).join(", ") || "N/A"}
Skills the student already has that match: ${matchedSkills.join(", ") || "none explicitly listed"}

Write in first person as the student. Keep it genuine and specific — mention the matched skills naturally, don't just list them. Do not use placeholder brackets like [Company Name] since all details are already provided above. End with a professional sign-off using the student's name.`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 700,
            messages: [{ role: "user", content: prompt }]
        });

        const letterText = completion.choices[0]?.message?.content || "";

        res.json({ message: "ok", letter: letterText });
    } catch (err) {
        console.error("Cover letter generation error:", err);
        res.status(500).json({ message: "Could not generate cover letter. Check your GROQ_API_KEY." });
    }
});

module.exports = router;

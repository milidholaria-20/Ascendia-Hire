const express = require("express");
const Job     = require("../models/Job");
const Profile = require("../models/Profile");

const router = express.Router();

// Helper — converts a Mongo document into the same JSON shape the frontend already expects
function toJobDTO(job) {
    return {
        id: job._id.toString(),
        title: job.title,
        company: job.company,
        postedBy: job.postedBy,
        applicantsCount: job.applicants?.length || 0,
        requiredSkills: job.requiredSkills || []
    };
}

// ================= POST JOB =================
router.post("/post", async (req, res) => {
    const { title, company, email, skills } = req.body;

    if (!title || !company || !email) {
        return res.json({ message: "Missing fields" });
    }

    try {
        const job = new Job({
            title, company,
            postedBy: email.toLowerCase(),
            requiredSkills: skills || [],
            applicants: []
        });
        await job.save();
        res.json({ message: "Job posted successfully" });
    } catch (err) {
        console.error("Post job error:", err);
        res.status(500).json({ message: "Error posting job" });
    }
});

// ================= GET ALL JOBS =================
router.get("/all", async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json(jobs.map(toJobDTO));
    } catch (err) {
        res.status(500).json({ message: "Error reading jobs" });
    }
});

// ================= APPLY JOB =================
router.post("/apply", async (req, res) => {
    const { jobId, email } = req.body;

    try {
        const job = await Job.findById(jobId);
        if (!job) return res.json({ message: "Job not found" });
        if (job.postedBy === email.toLowerCase()) {
            return res.json({ message: "Cannot apply to your own job" });
        }
        if (job.applicants.includes(email.toLowerCase())) {
            return res.json({ message: "Already applied" });
        }

        job.applicants.push(email.toLowerCase());
        await job.save();
        res.json({ message: "Applied successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error applying to job" });
    }
});

// ================= VIEW APPLICANTS =================
router.get("/applicants/:jobId/:email", async (req, res) => {
    const { jobId, email } = req.params;

    try {
        const job = await Job.findById(jobId);
        if (!job) return res.json({ message: "Job not found" });
        if (job.postedBy !== email.toLowerCase()) {
            return res.json({ message: "Access denied" });
        }
        res.json(job.applicants || []);
    } catch (err) {
        res.status(500).json({ message: "Error reading applicants" });
    }
});

// ================= DELETE JOB =================
router.delete("/delete/:jobId/:email", async (req, res) => {
    const { jobId, email } = req.params;

    try {
        const job = await Job.findById(jobId);
        if (!job) return res.json({ message: "Job not found" });
        if (job.postedBy !== email.toLowerCase()) {
            return res.json({ message: "Access denied" });
        }
        await Job.deleteOne({ _id: jobId });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting job" });
    }
});

// ================= SEARCH JOB =================
router.get("/search/:keyword", async (req, res) => {
    const keyword = req.params.keyword;

    try {
        // $regex with "i" = case-insensitive partial match, like SQL's LIKE '%keyword%'
        const jobs = await Job.find({ title: { $regex: keyword, $options: "i" } });
        res.json(jobs.map(j => ({
            id: j._id.toString(), title: j.title, company: j.company, postedBy: j.postedBy
        })));
    } catch (err) {
        res.status(500).json({ message: "Error searching jobs" });
    }
});

// ================= MY JOBS =================
router.get("/my-jobs/:email", async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.params.email.toLowerCase() }).sort({ createdAt: -1 });
        res.json(jobs.map(toJobDTO));
    } catch (err) {
        res.status(500).json({ message: "Error reading jobs" });
    }
});

// ================= SKILL GAP =================
router.get("/skill-gap/:email/:jobId", async (req, res) => {
    const { email, jobId } = req.params;

    try {
        const profile = await Profile.findOne({ email: email.toLowerCase() });
        if (!profile) return res.json({ message: "Profile not found" });

        const job = await Job.findById(jobId);
        if (!job) return res.json({ message: "Job not found" });

        const userSkills = profile.skills || [];
        const required    = job.requiredSkills || [];

        const normalize = s => s.trim().toLowerCase();
        const userSkillsNorm = userSkills.map(normalize);
        const missing = required.filter(skill => !userSkillsNorm.includes(normalize(skill)));

        res.json({ userSkills, required, missing });
    } catch (err) {
        res.status(500).json({ message: "Error computing skill gap" });
    }
});

// ================= MY APPLICATIONS =================
router.get("/my-applications/:email", async (req, res) => {
    try {
        const jobs = await Job.find({ applicants: req.params.email.toLowerCase() });
        res.json(jobs.map(toJobDTO));
    } catch (err) {
        res.status(500).json({ message: "Error reading applications" });
    }
});

module.exports = router;

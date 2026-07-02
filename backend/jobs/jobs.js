const express = require("express");
const Job     = require("../models/Job");
const Profile = require("../models/Profile");
const User    = require("../models/User");
const { sendJobMatchEmail } = require("../mailer");

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

// Finds every student whose profile skills overlap (case-insensitively) with
// the job's required skills, and emails each one. Runs AFTER the response is
// already sent — never delays "Job posted successfully".
async function notifyMatchingStudents(job) {
    if (!job.requiredSkills?.length) return;

    try {
        const normalize = s => s.trim().toLowerCase();
        const requiredNorm = job.requiredSkills.map(normalize);

        // $elemMatch + $in with a case-insensitive regex per skill would need
        // an aggregation; for a college-project-scale dataset, fetching all
        // student profiles and filtering in JS is simpler and fast enough.
        const studentUsers  = await User.find({ role: "student" }, "email name");
        const emailToName   = new Map(studentUsers.map(u => [u.email, u.name]));

        const profiles = await Profile.find({ email: { $in: [...emailToName.keys()] } });

        for (const profile of profiles) {
            const userSkillsNorm = (profile.skills || []).map(normalize);
            const matched = job.requiredSkills.filter(s => userSkillsNorm.includes(normalize(s)));
            if (matched.length === 0) continue; // no overlap — skip

            // Fire-and-forget: intentionally not awaited in the caller
            sendJobMatchEmail({
                to: profile.email,
                studentName: emailToName.get(profile.email) || "",
                jobTitle: job.title,
                company: job.company,
                matchedSkills: matched
            });
        }
    } catch (err) {
        console.error("notifyMatchingStudents error:", err.message);
    }
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

        // Runs after the response above — student never waits on email sending
        notifyMatchingStudents(job);
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
    const studentEmail = email.toLowerCase();

    try {
        const job = await Job.findById(jobId);
        if (!job) return res.json({ message: "Job not found" });
        if (job.postedBy === studentEmail) {
            return res.json({ message: "Cannot apply to your own job" });
        }
        if (job.applicants.some(a => a.email === studentEmail)) {
            return res.json({ message: "Already applied" });
        }

        job.applicants.push({ email: studentEmail, status: "Applied", appliedAt: new Date() });
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
        // Each applicant now carries { email, status, appliedAt } — sub-documents
        // serialize to plain objects automatically via res.json()
        res.json(job.applicants || []);
    } catch (err) {
        res.status(500).json({ message: "Error reading applicants" });
    }
});

// ================= UPDATE APPLICANT STATUS =================
const VALID_STATUSES = ["Applied", "Reviewed", "Shortlisted", "Rejected", "Offered"];

router.post("/applicants/status", async (req, res) => {
    const { jobId, recruiterEmail, studentEmail, status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const job = await Job.findById(jobId);
        if (!job) return res.json({ message: "Job not found" });
        if (job.postedBy !== recruiterEmail.toLowerCase()) {
            return res.status(403).json({ message: "Access denied" });
        }

        const applicant = job.applicants.find(a => a.email === studentEmail.toLowerCase());
        if (!applicant) return res.json({ message: "Applicant not found" });

        applicant.status = status;
        await job.save();
        res.json({ message: "Status updated", status });
    } catch (err) {
        console.error("Update status error:", err);
        res.status(500).json({ message: "Error updating status" });
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
    const studentEmail = req.params.email.toLowerCase();

    try {
        // Dot-notation query — applicants is now an array of {email, status, appliedAt}
        // sub-documents, so we match on the nested "email" field specifically.
        const jobs = await Job.find({ "applicants.email": studentEmail }).sort({ createdAt: -1 });

        const result = jobs.map(job => {
            const myApplication = job.applicants.find(a => a.email === studentEmail);
            return {
                ...toJobDTO(job),
                myStatus: myApplication?.status || "Applied"
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Error reading applications" });
    }
});

module.exports = router;

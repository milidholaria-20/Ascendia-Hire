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
        requiredSkills: job.requiredSkills || [],
        location: job.location || "Remote",
        jobType: job.jobType || "Full-time"
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
    const { title, company, email, skills, location, jobType } = req.body;

    if (!title || !company || !email) {
        return res.json({ message: "Missing fields" });
    }

    try {
        const job = new Job({
            title, company,
            postedBy: email.toLowerCase(),
            requiredSkills: skills || [],
            applicants: [],
            location: location || "Remote",
            jobType: jobType || "Full-time"
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

        const normalize = s => s.trim().toLowerCase();
        const applicantsWithMatch = await Promise.all(job.applicants.map(async (a) => {
            let matchScore = null;
            if (job.requiredSkills.length) {
                const profile = await Profile.findOne({ email: a.email });
                if (profile) {
                    const userNorm = (profile.skills || []).map(normalize);
                    const matched  = job.requiredSkills.filter(s => userNorm.includes(normalize(s)));
                    matchScore = Math.round((matched.length / job.requiredSkills.length) * 100);
                }
            }
            return { email: a.email, status: a.status, appliedAt: a.appliedAt, matchScore };
        }));

        res.json(applicantsWithMatch);
    } catch (err) {
        res.status(500).json({ message: "Error reading applicants" });
    }
});

// ================= UPDATE APPLICANT STATUS =================
const VALID_STATUSES = ["Applied", "Reviewed", "Shortlisted", "Rejected", "Offered"];
const Conversation = require("../models/Conversation");

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

        // Unlock direct messaging once the student is shortlisted or offered.
        // Runs after the response — never delays the status-update itself.
        if (status === "Shortlisted" || status === "Offered") {
            Conversation.findOneAndUpdate(
                { student: studentEmail.toLowerCase(), recruiter: recruiterEmail.toLowerCase(), jobId },
                { $setOnInsert: {
                    student: studentEmail.toLowerCase(),
                    recruiter: recruiterEmail.toLowerCase(),
                    jobId, jobTitle: job.title, company: job.company, messages: []
                }},
                { upsert: true }
            ).catch(err => console.error("Auto-create conversation error:", err.message));
        }
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

        // Fire-and-forget analytics counter — a student checking their gap is a
        // real interest signal. $inc is atomic, so concurrent checks never race.
        Job.updateOne({ _id: jobId }, { $inc: { skillGapChecks: 1 } }).catch(() => {});
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

// ================= RECRUITER ANALYTICS =================
router.get("/analytics/:recruiterEmail", async (req, res) => {
    const recruiterEmail = req.params.recruiterEmail.toLowerCase();

    try {
        const jobs = await Job.find({ postedBy: recruiterEmail }).sort({ createdAt: -1 });

        const statusBreakdown = { Applied: 0, Reviewed: 0, Shortlisted: 0, Rejected: 0, Offered: 0 };
        const perJob = [];
        let totalApplicants = 0, totalGapChecks = 0;
        let allMatchScores = []; // flattened across every job, for the overall average

        const normalize = s => s.trim().toLowerCase();

        for (const job of jobs) {
            totalApplicants += job.applicants.length;
            totalGapChecks  += job.skillGapChecks || 0;

            let jobMatchScores = [];

            for (const applicant of job.applicants) {
                statusBreakdown[applicant.status] = (statusBreakdown[applicant.status] || 0) + 1;

                if (job.requiredSkills.length) {
                    const profile = await Profile.findOne({ email: applicant.email });
                    if (profile) {
                        const userNorm = (profile.skills || []).map(normalize);
                        const matched  = job.requiredSkills.filter(s => userNorm.includes(normalize(s)));
                        const pct = Math.round((matched.length / job.requiredSkills.length) * 100);
                        jobMatchScores.push(pct);
                        allMatchScores.push(pct);
                    }
                }
            }

            perJob.push({
                jobId: job._id.toString(),
                title: job.title,
                company: job.company,
                applicantsCount: job.applicants.length,
                skillGapChecks: job.skillGapChecks || 0,
                avgMatchScore: jobMatchScores.length
                    ? Math.round(jobMatchScores.reduce((a, b) => a + b, 0) / jobMatchScores.length)
                    : null,
                conversionRate: job.skillGapChecks
                    ? Math.round((job.applicants.length / job.skillGapChecks) * 100)
                    : null
            });
        }

        const overallAvgMatch = allMatchScores.length
            ? Math.round(allMatchScores.reduce((a, b) => a + b, 0) / allMatchScores.length)
            : null;

        res.json({
            totalJobs: jobs.length,
            totalApplicants,
            totalGapChecks,
            overallAvgMatch,
            statusBreakdown,
            perJob
        });
    } catch (err) {
        console.error("Analytics error:", err);
        res.status(500).json({ message: "Error computing analytics" });
    }
});

module.exports = router;

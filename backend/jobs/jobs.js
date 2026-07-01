const express = require("express");
const fs = require("fs");
const xml2js = require("xml2js");
const path = require("path");

const router = express.Router();

const jobsFile = path.join(__dirname, "../database/jobs.xml");

const builder = new xml2js.Builder();


// ================= READ =================
function readJobs(callback) {
    fs.readFile(jobsFile, "utf8", (err, data) => {
        if (err) return callback(err);

        // If file empty
        if (!data || !data.trim()) {
            return callback(null, {
                jobs: { jobList: [{ job: [] }] }
            });
        }

        const parser = new xml2js.Parser({ explicitArray: true });

        parser.parseString(data, (err, result) => {
            // If XML broken, recover instead of crash
            if (err || !result) {
                return callback(null, {
                    jobs: { jobList: [{ job: [] }] }
                });
            }

            if (!result.jobs) result.jobs = {};
            if (!result.jobs.jobList) result.jobs.jobList = [{}];
            if (!result.jobs.jobList[0]) result.jobs.jobList[0] = {};
            if (!result.jobs.jobList[0].job)
                result.jobs.jobList[0].job = [];

            callback(null, result);
        });
    });
}


// ================= WRITE =================
function writeJobs(data, callback) {
    const xml = builder.buildObject(data);
    fs.writeFile(jobsFile, xml, callback);
}


// ================= POST JOB =================
router.post("/post", (req, res) => {

    const { title, company, email, skills } = req.body; // 🔥 FIXED

    if (!title || !company || !email) {
        return res.json({ message: "Missing fields" });
    }

    readJobs((err, data) => {

        if (err) return res.status(500).send("Read error");

        const jobs = data.jobs.jobList[0].job;

        const newJob = {
            id: [Date.now().toString()],
            title: [title],
            company: [company],
            postedBy: [email],

            // 🔥 NEW (structured skills)
            requiredSkills: [{
                skill: skills || []
            }],

            applicants: [{ applicant: [] }]
        };

        jobs.push(newJob);

        writeJobs(data, () => {
            res.json({ message: "Job posted successfully" });
        });

    });

});


// ================= GET ALL JOBS =================
router.get("/all", (req, res) => {

    readJobs((err, data) => {

        if (err) return res.status(500).send("Read error");

        const jobs = data.jobs.jobList[0].job;

        const response = jobs.map(j => ({
            id: j.id[0],
            title: j.title[0],
            company: j.company[0],
            postedBy: j.postedBy[0],
            applicantsCount: j.applicants?.[0]?.applicant?.length || 0,
            requiredSkills: j.requiredSkills?.[0]?.skill || []
        }));

        res.json(response);

    });

});


// ================= APPLY JOB =================
router.post("/apply", (req, res) => {
  const { jobId, email } = req.body;
  readJobs((err, data) => {
    if (err) return res.status(500).json({ message: "Read error" });
    const jobs = data.jobs.jobList[0].job;
    const job = jobs.find(j => j.id[0] === jobId);
    if (!job) return res.json({ message: "Job not found" });
    if (job.postedBy[0] === email) return res.json({ message: "Cannot apply to your own job" });

    // normalize applicants structure for <applicants/> and old XML
    if (!Array.isArray(job.applicants) || typeof job.applicants[0] !== 'object') {
      job.applicants = [{ applicant: [] }];
    }
    if (!Array.isArray(job.applicants[0].applicant)) {
      job.applicants[0].applicant = [];
    }

    const applicants = job.applicants[0].applicant.map(String);
    if (applicants.includes(email)) return res.json({ message: "Already applied" });

    job.applicants[0].applicant.push(email);
    writeJobs(data, () => res.json({ message: "Applied successfully" }));
  });
});

// ================= VIEW APPLICANTS =================
router.get("/applicants/:jobId/:email", (req, res) => {

    const { jobId, email } = req.params;

    readJobs((err, data) => {

        const jobs = data.jobs.jobList[0].job;

        const job = jobs.find(j => j.id[0] === jobId);

        if (!job) return res.json({ message: "Job not found" });

        if (job.postedBy[0] !== email) {
            return res.json({ message: "Access denied" });
        }

        const applicants = job.applicants?.[0]?.applicant || [];

        res.json(applicants);

    });

});


// ================= DELETE JOB =================
router.delete("/delete/:jobId/:email", (req, res) => {

    const { jobId, email } = req.params;

    readJobs((err, data) => {

        let jobs = data.jobs.jobList[0].job;

        const index = jobs.findIndex(j => j.id[0] === jobId);

        if (index === -1) return res.json({ message: "Job not found" });

        const job = jobs[index];

        if (job.postedBy[0] !== email) {
            return res.json({ message: "Access denied" });
        }

        jobs.splice(index, 1);

        writeJobs(data, () => {
            res.json({ message: "Deleted successfully" });
        });

    });

});


// ================= SEARCH JOB =================
router.get("/search/:keyword", (req, res) => {

    const keyword = req.params.keyword.toLowerCase();

    readJobs((err, data) => {

        const jobs = data.jobs.jobList[0].job;

        const result = jobs
            .filter(j =>
                j.title[0].toLowerCase().includes(keyword)
            )
            .map(j => ({
                id: j.id[0],
                title: j.title[0],
                company: j.company[0],
                postedBy: j.postedBy[0]
            }));

        res.json(result);

    });

});


// ================= MY JOBS =================
router.get("/my-jobs/:email", (req, res) => {

    const email = req.params.email;

    readJobs((err, data) => {

        const jobs = data.jobs.jobList[0].job;

        const result = jobs.filter(j => j.postedBy[0] === email);

        res.json(result);

    });

});


// ================= SKILL GAP =================
router.get("/skill-gap/:email/:jobId", (req, res) => {

    const { email, jobId } = req.params;

    const profileFile = path.join(__dirname, "../database/profiles.xml");

    fs.readFile(profileFile, "utf8", (err, pdata) => {

        if (err) return res.json({ message: "Profile read error" });

        xml2js.parseString(pdata, (err, presult) => {

            const profiles = presult.profiles.profile;
            const profile = profiles.find(p => p.email[0] === email);

            if (!profile) {
                return res.json({ message: "Profile not found" });
            }

            const userSkills = profile.skills?.[0]?.skill || [];

            readJobs((err, jdata) => {

                const job = jdata.jobs.jobList[0].job.find(
                    j => j.id[0] === jobId
                );

                if (!job) {
                    return res.json({ message: "Job not found" });
                }

                const required =
                    job.requiredSkills?.[0]?.skill || [];

                const normalize = s => s.trim().toLowerCase();
                const userSkillsNorm = userSkills.map(normalize);
                const missing = required.filter(
                    skill => !userSkillsNorm.includes(normalize(skill))
                );

                res.json({
                    userSkills,
                    required,
                    missing
                });

            });

        });

    });

});

// ================= MY APPLICATIONS =================
router.get("/my-applications/:email", (req, res) => {
    const email = req.params.email;

    readJobs((err, data) => {
        if (err) return res.status(500).json({ message: "Read error" });

        const jobs = data.jobs.jobList[0].job || [];

        const appliedJobs = jobs
            .filter(job => {
                const applicants = job.applicants?.[0]?.applicant || [];
                return applicants.includes(email);
            })
            .map(job => ({
                id: job.id?.[0] || "",
                title: job.title?.[0] || "",
                company: job.company?.[0] || "",
                postedBy: job.postedBy?.[0] || "",
                requiredSkills: job.requiredSkills?.[0]?.skill || []
            }));

        res.json(appliedJobs);
    });
});


module.exports = router;
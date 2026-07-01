const express = require("express");
const Startup = require("../models/Startup");
const Profile = require("../models/Profile");

const router = express.Router();

// ================= POST STARTUP =================
router.post("/post", async (req, res) => {
    const { title, description, email, skills } = req.body;

    try {
        const startup = new Startup({
            title,
            description: description || "",
            creator: email.toLowerCase(),
            requiredSkills: skills || [],
            team: [email.toLowerCase()]
        });
        await startup.save();
        res.json({ message: "Startup posted successfully" });
    } catch (err) {
        console.error("Post startup error:", err);
        res.status(500).json({ message: "Error posting startup" });
    }
});

// ================= GET ALL =================
router.get("/all", async (req, res) => {
    try {
        const startups = await Startup.find().sort({ createdAt: -1 });
        res.json(startups.map(toStartupDTO));
    } catch (err) {
        res.status(500).json({ message: "Database read error" });
    }
});

// ================= JOIN STARTUP =================
router.post("/join", async (req, res) => {
    const { startupId, email } = req.body;

    try {
        const startup = await Startup.findById(startupId);
        if (!startup) return res.json({ message: "Startup not found" });

        if (startup.team.includes(email.toLowerCase())) {
            return res.json({ message: "Already a member" });
        }

        startup.team.push(email.toLowerCase());
        await startup.save();
        res.json({ message: "Joined startup successfully" });
    } catch (err) {
        res.status(500).json({ message: "Database write error" });
    }
});

// ================= LEAVE STARTUP =================
router.post("/leave", async (req, res) => {
    const { startupId, email } = req.body;

    try {
        const startup = await Startup.findById(startupId);
        if (!startup) return res.status(404).json({ message: "Startup not found" });

        if (startup.creator === email.toLowerCase()) {
            return res.status(400).json({ message: "Owner cannot leave the startup. Delete it instead." });
        }
        if (!startup.team.includes(email.toLowerCase())) {
            return res.status(400).json({ message: "You are not a member of this startup" });
        }

        startup.team = startup.team.filter(m => m !== email.toLowerCase());
        await startup.save();
        res.json({ message: "Left startup successfully" });
    } catch (err) {
        res.status(500).json({ message: "Database write error" });
    }
});

// ================= TEAM MEMBERS =================
router.get("/team/:id", async (req, res) => {
    try {
        const startup = await Startup.findById(req.params.id);
        if (!startup) return res.json({ message: "Startup not found" });
        res.json({ startupId: req.params.id, members: startup.team || [] });
    } catch (err) {
        res.status(500).json({ message: "Database read error" });
    }
});

// ================= DELETE STARTUP =================
router.delete("/delete/:id", async (req, res) => {
    const email = req.query.email;

    try {
        const startup = await Startup.findById(req.params.id);
        if (!startup) return res.json({ message: "Startup not found" });
        if (!email) return res.status(400).json({ message: "Owner email is required" });
        if (startup.creator !== email.toLowerCase()) {
            return res.status(403).json({ message: "Only the owner can delete this startup" });
        }

        await Startup.deleteOne({ _id: req.params.id });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Database write error" });
    }
});

// ================= SKILL GAP =================
router.get("/skill-gap/:email/:startupId", async (req, res) => {
    const { email, startupId } = req.params;

    try {
        const profile = await Profile.findOne({ email: email.toLowerCase() });
        if (!profile) return res.json({ message: "Profile not found" });

        const startup = await Startup.findById(startupId);
        if (!startup) return res.json({ message: "Startup not found" });

        const userSkills = profile.skills || [];
        const required    = startup.requiredSkills || [];

        const normalize = s => s.trim().toLowerCase();
        const userSkillsNorm = userSkills.map(normalize);
        const missing = required.filter(skill => !userSkillsNorm.includes(normalize(skill)));

        res.json({ userSkills, required, missing });
    } catch (err) {
        res.status(500).json({ message: "Error computing skill gap" });
    }
});

// ================= GET ONE STARTUP =================
router.get("/:id", async (req, res) => {
    try {
        const startup = await Startup.findById(req.params.id);
        if (!startup) return res.status(404).json({ message: "Startup not found" });
        res.json(toStartupDTO(startup));
    } catch (err) {
        res.status(500).json({ message: "Database read error" });
    }
});

// ================= POST MESSAGE (fallback REST route — Socket.IO is primary) =================
router.post("/:id/message", async (req, res) => {
    const { email, text } = req.body;
    if (!email || !text) return res.json({ message: "Missing fields" });

    try {
        const startup = await Startup.findById(req.params.id);
        if (!startup) return res.status(404).json({ message: "Startup not found" });
        if (!startup.team.includes(email.toLowerCase())) {
            return res.status(403).json({ message: "Only startup members can send messages" });
        }

        startup.messages.push({ author: email.toLowerCase(), text, ts: Date.now() });
        await startup.save();
        res.json({ message: "Message posted" });
    } catch (err) {
        res.status(500).json({ message: "Database write error" });
    }
});

// Helper — matches the nested-array shape dashboard.js already expects
// (it was written against xml2js's explicitArray output, e.g. s.title[0],
// s.team[0].member, s.messages[0].message). Keeping this shape means
// dashboard.js needs ZERO changes for the startup module.
function toStartupDTO(s) {
    return {
        id:             [s._id.toString()],
        title:          [s.title],
        description:    [s.description || ""],
        creator:        [s.creator],
        requiredSkills: [{ skill: s.requiredSkills || [] }],
        team:           [{ member: s.team || [] }],
        messages:       [{ message: (s.messages || []).map(m => ({ author: [m.author], text: [m.text], ts: [String(m.ts)] })) }]
    };
}

module.exports = router;

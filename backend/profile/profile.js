const User    = require("../models/User");
const Profile = require("../models/Profile");
const Job     = require("../models/Job");
const Startup = require("../models/Startup");

// Helper — matches the nested-array shape dashboard.js already expects
// (written against xml2js's explicitArray output, e.g. data.name?.[0],
// data.skills?.[0]?.skill). Keeping this shape means dashboard.js needs
// ZERO changes for the profile module.
function toProfileDTO(p) {
    return {
        name:           [p.name || ""],
        email:          [p.email],
        program:        [p.program || ""],
        joinYear:       [p.joinYear || ""],
        bio:            [p.bio || ""],
        phone:          [p.phone || ""],
        github:         [p.github || ""],
        linkedin:       [p.linkedin || ""],
        portfolio:      [p.portfolio || ""],
        resume:         [p.resume || ""],
        profilePicture: [p.profilePicture || "default.png"],
        skills:         [{ skill: p.skills || [] }]
    };
}

// ── CREATE PROFILE ────────────────────────────────────────────────────────────
exports.createProfile = async (req, res) => {
    const { name, email, program, joinYear, bio, phone, github, linkedin, portfolio, resume, profilePicture } = req.body;

    if (!name || !email || !program || !joinYear) {
        return res.json({ message: "Missing required fields" });
    }

    try {
        const existing = await Profile.findOne({ email: email.toLowerCase() });
        if (existing) return res.json({ message: "Profile already exists" });

        const profile = new Profile({
            name, email: email.toLowerCase(), program, joinYear,
            bio: bio || "", phone: phone || "", github: github || "",
            linkedin: linkedin || "", portfolio: portfolio || "",
            resume: resume || "", profilePicture: profilePicture || "default.png",
            skills: []
        });

        await profile.save();
        res.json({ message: "Profile created successfully" });
    } catch (err) {
        console.error("Create profile error:", err);
        res.status(500).json({ message: "Error saving profile" });
    }
};

// ── GET PROFILE ───────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ email: req.params.email.toLowerCase() });
        if (!profile) return res.json({ message: "Profile not found" });
        res.json(toProfileDTO(profile));
    } catch (err) {
        res.status(500).json({ message: "Error reading profile" });
    }
};

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    const { bio, phone, github, linkedin, portfolio, resume, profilePicture } = req.body;

    try {
        const profile = await Profile.findOne({ email: req.params.email.toLowerCase() });
        if (!profile) return res.json({ message: "Profile not found" });

        if (bio            !== undefined) profile.bio            = bio;
        if (phone          !== undefined) profile.phone          = phone;
        if (github         !== undefined) profile.github         = github;
        if (linkedin       !== undefined) profile.linkedin       = linkedin;
        if (portfolio      !== undefined) profile.portfolio      = portfolio;
        if (resume         !== undefined) profile.resume         = resume;
        if (profilePicture !== undefined) profile.profilePicture = profilePicture;

        await profile.save();
        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error updating profile" });
    }
};

// ── ADD SKILL ─────────────────────────────────────────────────────────────────
exports.addSkill = async (req, res) => {
    const { email, skill } = req.body;
    if (!email || !skill) return res.json({ message: "Email and skill required" });

    try {
        const profile = await Profile.findOne({ email: email.toLowerCase() });
        if (!profile) return res.json({ message: "Profile not found" });

        const normalize = s => s.trim().toLowerCase();
        const alreadyHasSkill = profile.skills.some(s => normalize(s) === normalize(skill));
        if (alreadyHasSkill) return res.json({ message: "Skill already exists" });

        profile.skills.push(skill);
        await profile.save();
        res.json({ message: "Skill added successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error adding skill" });
    }
};

// ── DELETE SKILL ──────────────────────────────────────────────────────────────
exports.deleteSkill = async (req, res) => {
    const { email, skill } = req.body;

    try {
        const profile = await Profile.findOne({ email: email.toLowerCase() });
        if (!profile) return res.json({ message: "Profile not found" });

        profile.skills = profile.skills.filter(s => s !== skill);
        await profile.save();
        res.json({ message: "Skill removed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error removing skill" });
    }
};

// ── DELETE PROFILE ────────────────────────────────────────────────────────────
exports.deleteProfile = async (req, res) => {
    try {
        await Profile.deleteOne({ email: req.params.email.toLowerCase() });
        res.json({ message: "Profile deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting profile" });
    }
};

// ── DELETE FULL ACCOUNT (user + profile + cleanup startups/jobs) ─────────────
exports.deleteAccount = async (req, res) => {
    const email = req.params.email.toLowerCase();

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Remove the user + their profile
        await User.deleteOne({ email });
        await Profile.deleteOne({ email });

        // Remove startups they created; pull them out of any team/messages they're in
        await Startup.deleteMany({ creator: email });
        await Startup.updateMany(
            {},
            { $pull: { team: email, messages: { author: email } } }
        );

        // Remove jobs they posted; pull them out of any applicants list
        await Job.deleteMany({ postedBy: email });
        await Job.updateMany({}, { $pull: { applicants: email } });

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error("Delete account error:", err);
        res.status(500).json({ message: "Error deleting account" });
    }
};

// ── GET ALL PROFILES (students only) ──────────────────────────────────────────
exports.getAllProfiles = async (req, res) => {
    try {
        const studentUsers   = await User.find({ role: "student" }, "email");
        const studentEmails  = studentUsers.map(u => u.email);
        const students       = await Profile.find({ email: { $in: studentEmails } });
        res.json(students.map(toProfileDTO));
    } catch (err) {
        res.status(500).json({ message: "Error reading profiles" });
    }
};

// ── SEARCH BY SKILL ───────────────────────────────────────────────────────────
exports.searchBySkill = async (req, res) => {
    const skill = req.params.skill.trim();

    try {
        // Case-insensitive regex match against any element of the skills array
        const profiles = await Profile.find({
            skills: { $elemMatch: { $regex: `^${skill}$`, $options: "i" } }
        });
        res.json(profiles.map(toProfileDTO));
    } catch (err) {
        res.status(500).json({ message: "Error searching profiles" });
    }
};

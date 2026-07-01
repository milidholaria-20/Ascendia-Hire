// migrate.js — ONE-TIME script to copy your existing XML data into MongoDB.
// Run this once, after setting up .env, with: node migrate.js
// Safe to re-run — it skips records that already exist in MongoDB.

require("dotenv").config();
const fs      = require("fs");
const path    = require("path");
const xml2js  = require("xml2js");
const bcrypt  = require("bcryptjs");
const mongoose = require("mongoose");

const User    = require("./models/User");
const Profile = require("./models/Profile");
const Job     = require("./models/Job");
const Startup = require("./models/Startup");

const DB_DIR = path.join(__dirname, "database");

function readXml(filename) {
    return new Promise((resolve) => {
        const filePath = path.join(DB_DIR, filename);
        if (!fs.existsSync(filePath)) return resolve(null);

        fs.readFile(filePath, "utf8", (err, data) => {
            if (err || !data?.trim()) return resolve(null);
            const parser = new xml2js.Parser({ explicitArray: true });
            parser.parseString(data, (err, result) => {
                if (err) return resolve(null);
                resolve(result);
            });
        });
    });
}

async function migrateUsers() {
    const result = await readXml("users.xml");
    const users = result?.users?.user || [];
    let migrated = 0, skipped = 0;

    for (const u of users) {
        const email = u.email?.[0]?.toLowerCase();
        if (!email) continue;

        const exists = await User.findOne({ email });
        if (exists) { skipped++; continue; }

        // Existing XML passwords are plain text — hash them now so login.js
        // (which uses bcrypt.compare) keeps working after migration.
        const plainPassword = u.password?.[0] || "changeme123";
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        await User.create({
            name:           u.name?.[0] || "",
            email,
            password:       hashedPassword,
            role:           u.role?.[0] || "student",
            program:        u.program?.[0] || "",
            joinYear:       u.joinYear?.[0] || "",
            graduationYear: u.graduationYear?.[0] || "",
            company:        u.company?.[0] || ""
        });
        migrated++;
    }
    console.log(`Users:     ${migrated} migrated, ${skipped} skipped (already existed)`);
}

async function migrateProfiles() {
    const result = await readXml("profiles.xml");
    const profiles = result?.profiles?.profile || [];
    let migrated = 0, skipped = 0;

    for (const p of profiles) {
        const email = p.email?.[0]?.toLowerCase();
        if (!email) continue;

        const exists = await Profile.findOne({ email });
        if (exists) { skipped++; continue; }

        await Profile.create({
            email,
            name:           p.name?.[0] || "",
            program:        p.program?.[0] || "",
            joinYear:       p.joinYear?.[0] || "",
            bio:            p.bio?.[0] || "",
            phone:          p.phone?.[0] || "",
            github:         p.github?.[0] || "",
            linkedin:       p.linkedin?.[0] || "",
            portfolio:      p.portfolio?.[0] || "",
            resume:         p.resume?.[0] || "",
            profilePicture: p.profilePicture?.[0] || "default.png",
            skills:         p.skills?.[0]?.skill || []
        });
        migrated++;
    }
    console.log(`Profiles:  ${migrated} migrated, ${skipped} skipped (already existed)`);
}

async function migrateJobs() {
    const result = await readXml("jobs.xml");
    const jobs = result?.jobs?.jobList?.[0]?.job || [];
    let migrated = 0;

    for (const j of jobs) {
        await Job.create({
            title:          j.title?.[0] || "",
            company:        j.company?.[0] || "",
            postedBy:       (j.postedBy?.[0] || "").toLowerCase(),
            requiredSkills: j.requiredSkills?.[0]?.skill || [],
            applicants:     (j.applicants?.[0]?.applicant || []).map(a => a.toLowerCase())
        });
        migrated++;
    }
    console.log(`Jobs:      ${migrated} migrated`);
}

async function migrateStartups() {
    const result = await readXml("startups.xml");
    const startups = result?.startups?.startup || [];
    let migrated = 0;

    for (const s of startups) {
        const messages = (s.messages?.[0]?.message || []).map(m => ({
            author: (m.author?.[0] || "").toLowerCase(),
            text:   m.text?.[0] || "",
            ts:     Number(m.ts?.[0]) || Date.now()
        }));

        await Startup.create({
            title:          s.title?.[0] || "",
            description:    s.description?.[0] || "",
            creator:        (s.creator?.[0] || "").toLowerCase(),
            requiredSkills: s.requiredSkills?.[0]?.skill || [],
            team:           (s.team?.[0]?.member || []).map(m => m.toLowerCase()),
            messages
        });
        migrated++;
    }
    console.log(`Startups:  ${migrated} migrated`);
}

async function run() {
    if (!process.env.MONGO_URI) {
        console.error("❌  MONGO_URI not set. Create backend/.env first — see .env.example");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB\n");

    await migrateUsers();
    await migrateProfiles();
    await migrateJobs();
    await migrateStartups();

    console.log("\n✅  Migration complete.");
    console.log("⚠️  Note: any XML users had their plain-text password hashed.");
    console.log("   If you don't remember an old password, just sign up a fresh test account instead.");

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});

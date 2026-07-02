// fix-applicants.js — ONE-TIME script to upgrade old applicant data.
// Before this update, job.applicants was an array of plain email strings.
// Now it's an array of { email, status, appliedAt } objects.
// Run this once: node fix-applicants.js
// Safe to re-run — already-upgraded jobs are skipped automatically.

require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
    if (!process.env.MONGO_URI) {
        console.error("❌  MONGO_URI not set in .env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB\n");

    // Talk to the raw collection here (bypassing the Mongoose schema/model),
    // since the Job model would immediately try to cast old string entries
    // against the NEW sub-document schema and throw.
    const jobsCollection = mongoose.connection.collection("jobs");
    const jobs = await jobsCollection.find({}).toArray();

    let fixed = 0, skipped = 0;

    for (const job of jobs) {
        const applicants = job.applicants || [];
        const needsFix = applicants.some(a => typeof a === "string");
        if (!needsFix) { skipped++; continue; }

        const upgraded = applicants.map(a =>
            typeof a === "string"
                ? { email: a.toLowerCase(), status: "Applied", appliedAt: job.createdAt || new Date() }
                : a
        );

        await jobsCollection.updateOne({ _id: job._id }, { $set: { applicants: upgraded } });
        fixed++;
    }

    console.log(`Jobs fixed:   ${fixed}`);
    console.log(`Jobs skipped (already upgraded or empty): ${skipped}`);
    console.log("\n✅  Done.");

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("Fix script failed:", err);
    process.exit(1);
});

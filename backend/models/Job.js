const mongoose = require("mongoose");

// Embedded sub-document — one application, with its own status
const applicantSchema = new mongoose.Schema({
    email:     { type: String, required: true, lowercase: true, trim: true },
    status:    { type: String, enum: ["Applied", "Reviewed", "Shortlisted", "Rejected", "Offered"], default: "Applied" },
    appliedAt: { type: Date, default: Date.now }
}, { _id: false });

const jobSchema = new mongoose.Schema({
    title:          { type: String, required: true },
    company:        { type: String, required: true },
    postedBy:       { type: String, required: true, lowercase: true, trim: true }, // recruiter email
    requiredSkills: { type: [String], default: [] },
    applicants:     { type: [applicantSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);

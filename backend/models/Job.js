const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    title:          { type: String, required: true },
    company:        { type: String, required: true },
    postedBy:       { type: String, required: true, lowercase: true, trim: true }, // recruiter email
    requiredSkills: { type: [String], default: [] },
    applicants:     { type: [String], default: [] } // student emails
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);

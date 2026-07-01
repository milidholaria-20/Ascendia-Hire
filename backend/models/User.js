const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ["student", "recruiter"], required: true },

    // student-only fields
    program:        { type: String, default: "" },
    joinYear:       { type: String, default: "" },
    graduationYear: { type: String, default: "" },

    // recruiter-only field
    company: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

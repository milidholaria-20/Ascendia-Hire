const mongoose = require("mongoose");

// One entry per skill, tracking which emails have endorsed it
const endorsementSchema = new mongoose.Schema({
    skill:     { type: String, required: true },
    endorsers: { type: [String], default: [] }
}, { _id: false });

const profileSchema = new mongoose.Schema({
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:      { type: String, default: "" },
    program:   { type: String, default: "" },
    joinYear:  { type: String, default: "" },

    bio:            { type: String, default: "" },
    phone:          { type: String, default: "" },
    github:         { type: String, default: "" },
    linkedin:       { type: String, default: "" },
    portfolio:      { type: String, default: "" },
    resume:         { type: String, default: "" },
    profilePicture: { type: String, default: "default.png" },

    skills:       { type: [String], default: [] },
    endorsements: { type: [endorsementSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);

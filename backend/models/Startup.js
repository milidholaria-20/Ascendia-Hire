const mongoose = require("mongoose");

// Embedded sub-document — one chat message
const messageSchema = new mongoose.Schema({
    author: { type: String, required: true },
    text:   { type: String, required: true },
    ts:     { type: Number, required: true }
}, { _id: false });

const startupSchema = new mongoose.Schema({
    title:          { type: String, required: true },
    description:    { type: String, default: "" },
    creator:        { type: String, required: true, lowercase: true, trim: true },
    requiredSkills: { type: [String], default: [] },
    team:           { type: [String], default: [] },   // member emails
    messages:       { type: [messageSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Startup", startupSchema);

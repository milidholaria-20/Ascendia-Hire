const mongoose = require("mongoose");

// Same embedding pattern as Startup.messages — always read together, so no
// separate "Messages" collection needed.
const messageSchema = new mongoose.Schema({
    author: { type: String, required: true },
    text:   { type: String, required: true },
    ts:     { type: Number, required: true }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
    student:   { type: String, required: true, lowercase: true, trim: true },
    recruiter: { type: String, required: true, lowercase: true, trim: true },
    jobId:     { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    jobTitle:  { type: String, default: "" }, // denormalized for quick display without a lookup
    company:   { type: String, default: "" },
    messages:  { type: [messageSchema], default: [] }
}, { timestamps: true });

// One conversation per (student, recruiter, job) triple — prevents duplicates
// if a recruiter re-shortlists the same student for the same job twice.
conversationSchema.index({ student: 1, recruiter: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);

const express      = require("express");
const Conversation = require("../models/Conversation");

const router = express.Router();

// Helper — matches the flat shape dashboard.js will read directly (this is a
// brand-new module, so we don't need to match any legacy XML shape here).
function toConversationDTO(c, myEmail) {
    const isRecruiter = c.recruiter === myEmail;
    const lastMsg = c.messages.length ? c.messages[c.messages.length - 1] : null;
    return {
        id:          c._id.toString(),
        otherParty:  isRecruiter ? c.student : c.recruiter,
        jobId:       c.jobId.toString(),
        jobTitle:    c.jobTitle,
        company:     c.company,
        lastMessage: lastMsg ? lastMsg.text : "",
        lastTs:      lastMsg ? lastMsg.ts : c.createdAt.getTime(),
        messageCount: c.messages.length
    };
}

// ================= GET/CREATE A CONVERSATION (idempotent) =================
// Called automatically when a recruiter shortlists a student (see jobs.js),
// and safe to call again — the unique index means a duplicate call just
// returns the existing conversation instead of erroring.
router.post("/start", async (req, res) => {
    const { studentEmail, recruiterEmail, jobId, jobTitle, company } = req.body;
    if (!studentEmail || !recruiterEmail || !jobId) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        let convo = await Conversation.findOne({
            student: studentEmail.toLowerCase(),
            recruiter: recruiterEmail.toLowerCase(),
            jobId
        });

        if (!convo) {
            convo = await Conversation.create({
                student: studentEmail.toLowerCase(),
                recruiter: recruiterEmail.toLowerCase(),
                jobId, jobTitle: jobTitle || "", company: company || "",
                messages: []
            });
        }

        res.json({ message: "ok", conversationId: convo._id.toString() });
    } catch (err) {
        // Duplicate-key race (two simultaneous calls) — just fetch and return the existing one
        if (err.code === 11000) {
            const existing = await Conversation.findOne({
                student: studentEmail.toLowerCase(), recruiter: recruiterEmail.toLowerCase(), jobId
            });
            return res.json({ message: "ok", conversationId: existing._id.toString() });
        }
        console.error("Start conversation error:", err);
        res.status(500).json({ message: "Error starting conversation" });
    }
});

// ================= LIST MY CONVERSATIONS =================
router.get("/conversations/:email", async (req, res) => {
    const myEmail = req.params.email.toLowerCase();

    try {
        const conversations = await Conversation.find({
            $or: [{ student: myEmail }, { recruiter: myEmail }]
        }).sort({ updatedAt: -1 });

        res.json(conversations.map(c => toConversationDTO(c, myEmail)));
    } catch (err) {
        res.status(500).json({ message: "Error loading conversations" });
    }
});

// ================= GET ONE CONVERSATION (with full message history) =================
router.get("/:id/:email", async (req, res) => {
    const myEmail = req.params.email.toLowerCase();

    try {
        const convo = await Conversation.findById(req.params.id);
        if (!convo) return res.status(404).json({ message: "Conversation not found" });
        if (convo.student !== myEmail && convo.recruiter !== myEmail) {
            return res.status(403).json({ message: "Access denied" });
        }

        const isRecruiter = convo.recruiter === myEmail;
        res.json({
            id: convo._id.toString(),
            otherParty: isRecruiter ? convo.student : convo.recruiter,
            jobTitle: convo.jobTitle,
            company: convo.company,
            messages: convo.messages.map(m => ({ author: m.author, text: m.text, ts: m.ts }))
        });
    } catch (err) {
        res.status(500).json({ message: "Error loading conversation" });
    }
});

module.exports = router;

console.log("Starting Ascendia Hire server...");

require("dotenv").config();

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const path       = require("path");

const connectDB    = require("./db");
const Startup      = require("./models/Startup");
const Conversation = require("./models/Conversation");

const signupController = require("./auth/signup");
const loginController  = require("./auth/login");
const profile          = require("./profile/profile");
const startupRoutes    = require("./startup/startup");
const jobsRoutes       = require("./jobs/jobs");
const messagesRoutes   = require("./messages/messages");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve uploaded resumes (PDFs) so students/recruiters can open them via a link
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// AUTH
app.post("/signup", signupController.signup);
app.post("/login",  loginController.login);

// PROFILE
app.post("/profile/create",          profile.createProfile);
app.get("/profile/:email",           profile.getProfile);
app.put("/profile/update/:email",    profile.updateProfile);
app.post("/profile/add-skill",       profile.addSkill);
app.post("/profile/delete-skill",    profile.deleteSkill);
app.post("/profile/upload-resume",   profile.uploadMiddleware, profile.uploadResume);
app.get("/profiles",                 profile.getAllProfiles);
app.get("/profile/search/:skill",    profile.searchBySkill);
app.delete("/profile/:email",        profile.deleteProfile);
app.delete("/account/:email",        profile.deleteAccount);

// STARTUP & JOBS
app.use("/startup", startupRoutes);
app.use("/jobs",    jobsRoutes);
app.use("/messages", messagesRoutes);

// SPA fallback
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ── Socket.IO — Real-time startup chat (now backed by MongoDB) ───────────────
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Client joins a startup chat room
    socket.on("joinRoom", ({ startupId }) => {
        [...socket.rooms].forEach(r => { if (r !== socket.id) socket.leave(r); });
        socket.join("startup:" + startupId);
        console.log(`Socket ${socket.id} → startup:${startupId}`);
    });

    // Client sends a message
    socket.on("sendMessage", async ({ startupId, email, text }) => {
        if (!startupId || !email || !text?.trim()) return;

        try {
            const startup = await Startup.findById(startupId);
            if (!startup) return;
            if (!startup.team.includes(email.toLowerCase())) return; // only members can chat

            const ts = Date.now();
            startup.messages.push({ author: email.toLowerCase(), text: text.trim(), ts });
            await startup.save();

            // Broadcast to everyone in this startup room (including sender)
            io.to("startup:" + startupId).emit("newMessage", {
                author: email.toLowerCase(),
                text:   text.trim(),
                ts
            });
        } catch (err) {
            console.error("sendMessage error:", err.message);
        }
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });

    // ── Direct messaging (recruiter ↔ student, after shortlisting) ───────────
    socket.on("joinConversation", ({ conversationId }) => {
        [...socket.rooms].forEach(r => { if (r !== socket.id) socket.leave(r); });
        socket.join("conversation:" + conversationId);
        console.log(`Socket ${socket.id} → conversation:${conversationId}`);
    });

    socket.on("sendDirectMessage", async ({ conversationId, email, text }) => {
        if (!conversationId || !email || !text?.trim()) return;

        try {
            const convo = await Conversation.findById(conversationId);
            if (!convo) return;

            const senderEmail = email.toLowerCase();
            if (convo.student !== senderEmail && convo.recruiter !== senderEmail) return; // not a participant

            const ts = Date.now();
            convo.messages.push({ author: senderEmail, text: text.trim(), ts });
            await convo.save();

            io.to("conversation:" + conversationId).emit("newDirectMessage", {
                author: senderEmail,
                text: text.trim(),
                ts
            });
        } catch (err) {
            console.error("sendDirectMessage error:", err.message);
        }
    });
});

// ── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
    server.listen(3000, () => {
        console.log("✅  Ascendia Hire → http://localhost:3000");
    });
});

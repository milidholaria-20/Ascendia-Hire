const bcrypt = require("bcryptjs");
const User   = require("../models/User");

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ message: "Email and password required" });

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.json({ message: "User not found" });

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) return res.json({ message: "Wrong password" });

        // Block students who have graduated
        const gradYear = parseInt(user.graduationYear);
        if (user.role === "student" && gradYear && gradYear < new Date().getFullYear()) {
            return res.json({ message: "Access expired — you have graduated." });
        }

        res.json({
            message:        "Login successful",
            email:          user.email,
            name:           user.name || "",
            role:           user.role || "student",
            program:        user.program || "",
            joinYear:       user.joinYear || "",
            graduationYear: user.graduationYear || "",
            company:        user.company || ""
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
};

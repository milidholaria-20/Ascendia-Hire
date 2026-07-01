const bcrypt = require("bcryptjs");
const User   = require("../models/User");

exports.signup = async (req, res) => {
    const { name, program, joinYear, email, password, company } = req.body;

    let role = req.body.role;
    if (!role || !["student", "recruiter"].includes(role)) {
        role = email?.endsWith("@nitk.edu.in") ? "student" : "recruiter";
    }

    if (!name || !email || !password) {
        return res.json({ message: "Name, email, and password are required" });
    }
    if (role === "student" && !email.endsWith("@nitk.edu.in")) {
        return res.json({ message: "Students must sign up with a valid NITK email (@nitk.edu.in)" });
    }
    if (role === "student" && (!program || !joinYear)) {
        return res.json({ message: "Program and join year are required for students" });
    }

    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.json({ message: "User already exists" });
        }

        const graduationYear = role === "student"
            ? (program === "BTech" ? parseInt(joinYear) + 4 : parseInt(joinYear) + 2)
            : null;

        // Hash the password before storing — never save plain text passwords
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            program:        role === "student" ? program : "",
            joinYear:       role === "student" ? joinYear : "",
            graduationYear: role === "student" ? String(graduationYear) : "",
            company:        role === "recruiter" ? (company || "") : ""
        });

        await newUser.save();
        res.json({ message: "Signup successful" });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Server error during signup" });
    }
};

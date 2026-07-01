const fs      = require("fs");
const path    = require("path");
const xml2js  = require("xml2js");

const xmlFilePath = path.join(__dirname, "../database/users.xml");

exports.login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ message: "Email and password required" });

    fs.readFile(xmlFilePath, "utf8", (err, data) => {
        if (err) return res.json({ message: "Database error" });

        xml2js.parseString(data, (err, result) => {
            if (err) return res.json({ message: "Parse error" });

            const users = result.users?.user || [];
            const user  = users.find(u => u.email[0] === email);

            if (!user)                        return res.json({ message: "User not found" });
            if (user.password[0] !== password) return res.json({ message: "Wrong password" });

            // Block students who have graduated
            const gradYear = parseInt(user.graduationYear?.[0]);
            if (user.role?.[0] === "student" && gradYear && gradYear < new Date().getFullYear()) {
                return res.json({ message: "Access expired — you have graduated." });
            }

            res.json({
                message:        "Login successful",
                email:          user.email[0],
                name:           user.name?.[0] || "",
                role:           user.role?.[0] || "student",
                program:        user.program?.[0]        || "",
                joinYear:       user.joinYear?.[0]       || "",
                graduationYear: user.graduationYear?.[0] || "",
                company:        user.company?.[0]        || ""
            });
        });
    });
};

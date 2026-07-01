const fs      = require("fs");
const path    = require("path");
const xml2js  = require("xml2js");

const xmlFilePath = path.join(__dirname, "../database/users.xml");

exports.signup = (req, res) => {
    const { name, program, joinYear, email, password, company } = req.body;

    // role is sent explicitly from the frontend; fallback to email-domain detection
    let role = req.body.role;
    if (!role || !["student", "recruiter"].includes(role)) {
        role = email.endsWith("@nitk.edu.in") ? "student" : "recruiter";
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

    const graduationYear = role === "student"
        ? (program === "BTech" ? parseInt(joinYear) + 4 : parseInt(joinYear) + 2)
        : null;

    fs.readFile(xmlFilePath, "utf8", (err, data) => {
        if (err) return res.json({ message: "Database error" });

        xml2js.parseString(data, (err, result) => {
            if (err) return res.json({ message: "Parse error" });

            if (!result.users)      result.users      = {};
            if (!result.users.user) result.users.user = [];

            const users = result.users.user;
            if (users.find(u => u.email[0] === email)) {
                return res.json({ message: "User already exists" });
            }

            const newUser = {
                name:     [name],
                email:    [email],
                password: [password],
                role:     [role]
            };

            if (role === "student") {
                newUser.program        = [program];
                newUser.joinYear       = [joinYear];
                newUser.graduationYear = [String(graduationYear)];
            }
            if (role === "recruiter" && company) {
                newUser.company = [company];
            }

            users.push(newUser);

            const builder = new xml2js.Builder();
            const xml     = builder.buildObject(result);

            fs.writeFile(xmlFilePath, xml, () => {
                res.json({ message: "Signup successful" });
            });
        });
    });
};

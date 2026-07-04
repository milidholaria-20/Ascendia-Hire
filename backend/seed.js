// seed.js — RESETS your database and loads a large, realistic demo dataset.
// ⚠️  DESTRUCTIVE: this deletes ALL existing Users, Profiles, Jobs, Startups,
//     and Conversations before inserting the new data. Do not run this on
//     real production data — it's meant for demo/viva preparation only.
// Run: node seed.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const User         = require("./models/User");
const Profile      = require("./models/Profile");
const Job          = require("./models/Job");
const Startup      = require("./models/Startup");
const Conversation = require("./models/Conversation");

const DEMO_PASSWORD = "Demo@123"; // same password for every seeded account, for easy demo login

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENTS
// ═══════════════════════════════════════════════════════════════════════════════
const students = [
    { name: "Ananya Rao",     email: "ananya.rao@nitk.edu.in",     program: "BTech", joinYear: "2022",
      bio: "Full-stack developer who loves building things end-to-end. Currently exploring distributed systems.",
      github: "https://github.com/ananyarao", linkedin: "https://linkedin.com/in/ananyarao",
      skills: ["React", "Node.js", "MongoDB", "TypeScript", "Docker"] },

    { name: "Rohan Mehta",    email: "rohan.mehta@nitk.edu.in",    program: "BTech", joinYear: "2021",
      bio: "ML enthusiast, competitive programmer, and occasional open-source contributor.",
      github: "https://github.com/rohanmehta", linkedin: "https://linkedin.com/in/rohanmehta",
      skills: ["Python", "Machine Learning", "TensorFlow", "Pandas", "DSA"] },

    { name: "Priya Nair",     email: "priya.nair@nitk.edu.in",     program: "MTech", joinYear: "2023",
      bio: "Backend-focused engineer interested in system design and cloud infrastructure.",
      github: "https://github.com/priyanair", linkedin: "https://linkedin.com/in/priyanair",
      skills: ["Java", "Spring Boot", "AWS", "Docker", "System Design"] },

    { name: "Karthik Iyer",   email: "karthik.iyer@nitk.edu.in",   program: "BTech", joinYear: "2022",
      bio: "Frontend developer with a love for clean UI and accessible design.",
      github: "https://github.com/karthikiyer", linkedin: "https://linkedin.com/in/karthikiyer",
      skills: ["React", "CSS", "Figma", "JavaScript", "Tailwind CSS"] },

    { name: "Sneha Patil",    email: "sneha.patil@nitk.edu.in",    program: "BTech", joinYear: "2023",
      bio: "Data enthusiast, currently learning data engineering and analytics.",
      github: "https://github.com/snehapatil", linkedin: "https://linkedin.com/in/snehapatil",
      skills: ["Python", "SQL", "Power BI", "Excel", "Data Analysis"] },

    { name: "Arjun Desai",    email: "arjun.desai@nitk.edu.in",    program: "BTech", joinYear: "2020",
      bio: "Final-year student building a startup on the side. Interested in product and growth.",
      github: "https://github.com/arjundesai", linkedin: "https://linkedin.com/in/arjundesai",
      skills: ["React Native", "Node.js", "Firebase", "Product Management"] },

    { name: "Divya Menon",    email: "divya.menon@nitk.edu.in",    program: "BTech", joinYear: "2021",
      bio: "DevOps-curious backend engineer. Enjoys automating things that shouldn't be done manually.",
      github: "https://github.com/divyamenon", linkedin: "https://linkedin.com/in/divyamenon",
      skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Python"] },

    { name: "Aditya Kapoor",  email: "aditya.kapoor@nitk.edu.in",  program: "MTech", joinYear: "2024",
      bio: "Deep learning researcher, working on computer vision applications for agriculture.",
      github: "https://github.com/adityakapoor", linkedin: "https://linkedin.com/in/adityakapoor",
      skills: ["Python", "PyTorch", "Computer Vision", "Deep Learning", "NumPy"] },

    { name: "Ishita Verma",   email: "ishita.verma@nitk.edu.in",   program: "BTech", joinYear: "2022",
      bio: "Mobile app developer, shipped two apps on the Play Store as side projects.",
      github: "https://github.com/ishitaverma", linkedin: "https://linkedin.com/in/ishitaverma",
      skills: ["Flutter", "Firebase", "Dart", "REST API", "UI/UX Design"] },

    { name: "Varun Reddy",    email: "varun.reddy@nitk.edu.in",    program: "BTech", joinYear: "2023",
      bio: "Security-focused developer, participates in CTFs and bug bounty programs.",
      github: "https://github.com/varunreddy", linkedin: "https://linkedin.com/in/varunreddy",
      skills: ["Cybersecurity", "Python", "Linux", "Penetration Testing", "Bash"] },

    { name: "Meera Shah",     email: "meera.shah@nitk.edu.in",     program: "BTech", joinYear: "2021",
      bio: "Product-minded engineer who enjoys the intersection of design and development.",
      github: "https://github.com/meerashah", linkedin: "https://linkedin.com/in/meerashah",
      skills: ["React", "Figma", "JavaScript", "Product Management", "UI/UX Design"] },

    { name: "Nikhil Joshi",   email: "nikhil.joshi@nitk.edu.in",   program: "BTech", joinYear: "2020",
      bio: "Competitive programmer turned backend engineer. Enjoys optimizing things that are already fast.",
      github: "https://github.com/nikhiljoshi", linkedin: "https://linkedin.com/in/nikhiljoshi",
      skills: ["C++", "DSA", "Algorithms", "System Design", "Redis"] }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RECRUITERS
// ═══════════════════════════════════════════════════════════════════════════════
const recruiters = [
    { name: "Neha Kulkarni",   email: "neha.kulkarni@technova.com",   company: "TechNova Solutions" },
    { name: "Vikram Singh",    email: "vikram.singh@cloudsprint.io",  company: "CloudSprint" },
    { name: "Meera Krishnan",  email: "meera.krishnan@datawise.ai",   company: "DataWise AI" },
    { name: "Rahul Bansal",    email: "rahul.bansal@finedge.com",     company: "FinEdge Technologies" },
    { name: "Ayesha Khan",     email: "ayesha.khan@healthsync.io",    company: "HealthSync" },
    { name: "Suresh Pillai",   email: "suresh.pillai@gamecraft.studio", company: "GameCraft Studio" }
];

// ═══════════════════════════════════════════════════════════════════════════════
// JOBS
// ═══════════════════════════════════════════════════════════════════════════════
const jobs = [
    { title: "Frontend Developer Intern",      company: "TechNova Solutions",   postedBy: "neha.kulkarni@technova.com",
      requiredSkills: ["React", "JavaScript", "CSS", "Tailwind CSS"], location: "Bangalore", jobType: "Internship" },

    { title: "Full Stack Developer",           company: "TechNova Solutions",   postedBy: "neha.kulkarni@technova.com",
      requiredSkills: ["React", "Node.js", "MongoDB", "TypeScript"], location: "Bangalore", jobType: "Full-time" },

    { title: "UI/UX Designer",                 company: "TechNova Solutions",   postedBy: "neha.kulkarni@technova.com",
      requiredSkills: ["Figma", "UI/UX Design", "CSS"], location: "Bangalore", jobType: "Part-time" },

    { title: "Backend Engineer",                company: "CloudSprint",          postedBy: "vikram.singh@cloudsprint.io",
      requiredSkills: ["Node.js", "MongoDB", "Docker", "AWS"], location: "Remote", jobType: "Full-time" },

    { title: "Cloud Infrastructure Engineer",   company: "CloudSprint",          postedBy: "vikram.singh@cloudsprint.io",
      requiredSkills: ["AWS", "Docker", "Kubernetes", "CI/CD"], location: "Remote", jobType: "Full-time" },

    { title: "DevOps Intern",                   company: "CloudSprint",          postedBy: "vikram.singh@cloudsprint.io",
      requiredSkills: ["Docker", "CI/CD", "Linux", "Bash"], location: "Remote", jobType: "Internship" },

    { title: "Machine Learning Intern",         company: "DataWise AI",          postedBy: "meera.krishnan@datawise.ai",
      requiredSkills: ["Python", "Machine Learning", "TensorFlow", "Pandas"], location: "Hyderabad", jobType: "Internship" },

    { title: "Data Analyst Intern",             company: "DataWise AI",          postedBy: "meera.krishnan@datawise.ai",
      requiredSkills: ["SQL", "Power BI", "Data Analysis", "Excel"], location: "Hyderabad", jobType: "Part-time" },

    { title: "Computer Vision Engineer",        company: "DataWise AI",          postedBy: "meera.krishnan@datawise.ai",
      requiredSkills: ["Python", "PyTorch", "Computer Vision", "Deep Learning"], location: "Hyderabad", jobType: "Full-time" },

    { title: "Backend Developer (Java)",        company: "FinEdge Technologies", postedBy: "rahul.bansal@finedge.com",
      requiredSkills: ["Java", "Spring Boot", "System Design", "AWS"], location: "Mumbai", jobType: "Full-time" },

    { title: "Security Engineer Intern",        company: "FinEdge Technologies", postedBy: "rahul.bansal@finedge.com",
      requiredSkills: ["Cybersecurity", "Python", "Linux", "Penetration Testing"], location: "Mumbai", jobType: "Internship" },

    { title: "Mobile App Developer",            company: "HealthSync",           postedBy: "ayesha.khan@healthsync.io",
      requiredSkills: ["Flutter", "Firebase", "Dart", "REST API"], location: "Pune", jobType: "Full-time" },

    { title: "Product Management Intern",       company: "HealthSync",           postedBy: "ayesha.khan@healthsync.io",
      requiredSkills: ["Product Management", "UI/UX Design"], location: "Pune", jobType: "Internship" },

    { title: "Game Backend Developer",          company: "GameCraft Studio",      postedBy: "suresh.pillai@gamecraft.studio",
      requiredSkills: ["C++", "System Design", "DSA", "Redis"], location: "Chennai", jobType: "Full-time" },

    { title: "Competitive Programming Intern",  company: "GameCraft Studio",      postedBy: "suresh.pillai@gamecraft.studio",
      requiredSkills: ["DSA", "Algorithms", "C++"], location: "Chennai", jobType: "Internship" }
];

// ═══════════════════════════════════════════════════════════════════════════════
// STARTUPS
// ═══════════════════════════════════════════════════════════════════════════════
const startups = [
    { title: "CampusEats", description: "A food-ordering app built for NITK hostel students — order from mess and nearby vendors in one place.",
      creator: "ananya.rao@nitk.edu.in", requiredSkills: ["React Native", "Node.js", "Firebase"],
      team: ["ananya.rao@nitk.edu.in", "karthik.iyer@nitk.edu.in"],
      messages: [
        { author: "ananya.rao@nitk.edu.in", text: "Hey team, I've set up the basic React Native scaffold. Let's sync on the ordering flow this week." },
        { author: "karthik.iyer@nitk.edu.in", text: "Sounds good! I'll start on the UI mockups in Figma and share by tomorrow." }
      ] },

    { title: "StudyBuddy", description: "Peer-to-peer study group matching platform based on courses and free time slots.",
      creator: "sneha.patil@nitk.edu.in", requiredSkills: ["Python", "SQL", "Data Analysis"],
      team: ["sneha.patil@nitk.edu.in", "meera.shah@nitk.edu.in"],
      messages: [
        { author: "sneha.patil@nitk.edu.in", text: "I've drafted the matching algorithm based on shared course + free slots overlap." },
        { author: "meera.shah@nitk.edu.in", text: "Nice, I'll work on the onboarding flow so it doesn't feel like filling a form." }
      ] },

    { title: "GreenCommute", description: "Carpooling app for students commuting between NITK campus and Mangalore city.",
      creator: "arjun.desai@nitk.edu.in", requiredSkills: ["React Native", "Firebase", "Product Management"],
      team: ["arjun.desai@nitk.edu.in", "rohan.mehta@nitk.edu.in"],
      messages: [
        { author: "arjun.desai@nitk.edu.in", text: "I think we should launch a beta with just the CS department first before going campus-wide." },
        { author: "rohan.mehta@nitk.edu.in", text: "Agreed — smaller feedback loop will help us fix routing bugs faster." }
      ] },

    { title: "SecureCampus", description: "A campus safety app with SOS alerts and real-time location sharing with trusted contacts.",
      creator: "varun.reddy@nitk.edu.in", requiredSkills: ["Flutter", "Cybersecurity", "Firebase"],
      team: ["varun.reddy@nitk.edu.in", "ishita.verma@nitk.edu.in"],
      messages: [
        { author: "varun.reddy@nitk.edu.in", text: "Encryption for location data is in place. Let's discuss the SOS trigger UX next." }
      ] },

    { title: "CodeArena", description: "A competitive programming practice platform with peer-created problem sets and live contests.",
      creator: "nikhil.joshi@nitk.edu.in", requiredSkills: ["DSA", "System Design", "Redis"],
      team: ["nikhil.joshi@nitk.edu.in", "priya.nair@nitk.edu.in"],
      messages: [
        { author: "nikhil.joshi@nitk.edu.in", text: "Judge queue is working with Redis now — submissions process in under 2 seconds." },
        { author: "priya.nair@nitk.edu.in", text: "Great, I'll start on the contest leaderboard service." }
      ] },

    { title: "AgriVision", description: "Computer vision tool for detecting crop diseases early from phone camera photos, aimed at small farmers nearby.",
      creator: "aditya.kapoor@nitk.edu.in", requiredSkills: ["Computer Vision", "PyTorch", "Deep Learning"],
      team: ["aditya.kapoor@nitk.edu.in"],
      messages: [] }
];

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATIONS — deliberately varied statuses across jobs, for good Analytics data
// ═══════════════════════════════════════════════════════════════════════════════
const applications = [
    { jobTitle: "Frontend Developer Intern",     student: "karthik.iyer@nitk.edu.in", status: "Shortlisted" },
    { jobTitle: "Frontend Developer Intern",     student: "meera.shah@nitk.edu.in",   status: "Applied" },
    { jobTitle: "Full Stack Developer",          student: "ananya.rao@nitk.edu.in",   status: "Offered" },
    { jobTitle: "Full Stack Developer",          student: "karthik.iyer@nitk.edu.in", status: "Reviewed" },
    { jobTitle: "UI/UX Designer",                student: "meera.shah@nitk.edu.in",   status: "Shortlisted" },
    { jobTitle: "Backend Engineer",               student: "priya.nair@nitk.edu.in",   status: "Applied" },
    { jobTitle: "Backend Engineer",               student: "nikhil.joshi@nitk.edu.in", status: "Reviewed" },
    { jobTitle: "Cloud Infrastructure Engineer", student: "divya.menon@nitk.edu.in",  status: "Offered" },
    { jobTitle: "DevOps Intern",                  student: "divya.menon@nitk.edu.in",  status: "Shortlisted" },
    { jobTitle: "Machine Learning Intern",         student: "rohan.mehta@nitk.edu.in",  status: "Reviewed" },
    { jobTitle: "Machine Learning Intern",         student: "aditya.kapoor@nitk.edu.in",status: "Shortlisted" },
    { jobTitle: "Data Analyst Intern",             student: "sneha.patil@nitk.edu.in",  status: "Applied" },
    { jobTitle: "Computer Vision Engineer",        student: "aditya.kapoor@nitk.edu.in",status: "Offered" },
    { jobTitle: "Backend Developer (Java)",        student: "priya.nair@nitk.edu.in",   status: "Rejected" },
    { jobTitle: "Backend Developer (Java)",        student: "nikhil.joshi@nitk.edu.in", status: "Applied" },
    { jobTitle: "Security Engineer Intern",        student: "varun.reddy@nitk.edu.in",  status: "Shortlisted" },
    { jobTitle: "Mobile App Developer",            student: "ishita.verma@nitk.edu.in", status: "Offered" },
    { jobTitle: "Product Management Intern",       student: "arjun.desai@nitk.edu.in",  status: "Applied" },
    { jobTitle: "Product Management Intern",       student: "meera.shah@nitk.edu.in",   status: "Rejected" },
    { jobTitle: "Game Backend Developer",          student: "nikhil.joshi@nitk.edu.in", status: "Shortlisted" },
    { jobTitle: "Competitive Programming Intern",  student: "nikhil.joshi@nitk.edu.in", status: "Applied" },
    { jobTitle: "Competitive Programming Intern",  student: "rohan.mehta@nitk.edu.in",  status: "Rejected" }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ENDORSEMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const endorsements = [
    { target: "ananya.rao@nitk.edu.in",   skill: "React",   endorsers: ["karthik.iyer@nitk.edu.in", "rohan.mehta@nitk.edu.in", "meera.shah@nitk.edu.in"] },
    { target: "ananya.rao@nitk.edu.in",   skill: "Node.js", endorsers: ["priya.nair@nitk.edu.in", "divya.menon@nitk.edu.in"] },
    { target: "karthik.iyer@nitk.edu.in", skill: "CSS",     endorsers: ["ananya.rao@nitk.edu.in", "sneha.patil@nitk.edu.in", "meera.shah@nitk.edu.in"] },
    { target: "rohan.mehta@nitk.edu.in",  skill: "Python",  endorsers: ["sneha.patil@nitk.edu.in", "aditya.kapoor@nitk.edu.in"] },
    { target: "priya.nair@nitk.edu.in",   skill: "AWS",     endorsers: ["arjun.desai@nitk.edu.in", "divya.menon@nitk.edu.in"] },
    { target: "divya.menon@nitk.edu.in",  skill: "Docker",  endorsers: ["priya.nair@nitk.edu.in", "nikhil.joshi@nitk.edu.in"] },
    { target: "aditya.kapoor@nitk.edu.in",skill: "PyTorch", endorsers: ["rohan.mehta@nitk.edu.in"] },
    { target: "ishita.verma@nitk.edu.in", skill: "Flutter", endorsers: ["varun.reddy@nitk.edu.in"] },
    { target: "varun.reddy@nitk.edu.in",  skill: "Cybersecurity", endorsers: ["ishita.verma@nitk.edu.in", "nikhil.joshi@nitk.edu.in"] },
    { target: "meera.shah@nitk.edu.in",   skill: "Figma",   endorsers: ["karthik.iyer@nitk.edu.in", "ananya.rao@nitk.edu.in"] },
    { target: "nikhil.joshi@nitk.edu.in", skill: "DSA",     endorsers: ["rohan.mehta@nitk.edu.in", "varun.reddy@nitk.edu.in", "priya.nair@nitk.edu.in"] }
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════
async function wipeDatabase() {
    const results = await Promise.all([
        User.deleteMany({}),
        Profile.deleteMany({}),
        Job.deleteMany({}),
        Startup.deleteMany({}),
        Conversation.deleteMany({})
    ]);
    console.log("🗑️  Cleared existing data:");
    console.log(`   Users: ${results[0].deletedCount}, Profiles: ${results[1].deletedCount}, Jobs: ${results[2].deletedCount}, Startups: ${results[3].deletedCount}, Conversations: ${results[4].deletedCount}\n`);
}

async function seedUsersAndProfiles() {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    for (const s of students) {
        const graduationYear = s.program === "BTech" ? parseInt(s.joinYear) + 4 : parseInt(s.joinYear) + 2;
        await User.create({
            name: s.name, email: s.email, password: hashedPassword, role: "student",
            program: s.program, joinYear: s.joinYear, graduationYear: String(graduationYear)
        });
        await Profile.create({
            email: s.email, name: s.name, program: s.program, joinYear: s.joinYear,
            bio: s.bio, github: s.github, linkedin: s.linkedin, skills: s.skills, endorsements: []
        });
    }

    for (const r of recruiters) {
        await User.create({ name: r.name, email: r.email, password: hashedPassword, role: "recruiter", company: r.company });
    }

    console.log(`Users:    ${students.length + recruiters.length} created`);
    console.log(`Profiles: ${students.length} created`);
}

async function seedJobs() {
    for (const j of jobs) {
        await Job.create({ ...j, applicants: [], skillGapChecks: 0 });
    }
    console.log(`Jobs:     ${jobs.length} created`);
}

async function seedApplications() {
    let count = 0;
    for (const a of applications) {
        const job = await Job.findOne({ title: a.jobTitle });
        if (!job) continue;
        job.applicants.push({ email: a.student, status: a.status, appliedAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000) });
        job.skillGapChecks += Math.floor(Math.random() * 4) + 1; // a few gap-checks per application, for the analytics conversion rate
        await job.save();
        count++;
    }
    console.log(`Applications: ${count} created`);
}

async function seedStartups() {
    for (const s of startups) {
        const messages = s.messages.map(m => ({ author: m.author, text: m.text, ts: Date.now() - Math.floor(Math.random() * 5) * 86400000 }));
        await Startup.create({ ...s, messages });
    }
    console.log(`Startups: ${startups.length} created`);
}

async function seedEndorsements() {
    let count = 0;
    for (const e of endorsements) {
        const profile = await Profile.findOne({ email: e.target });
        if (!profile) continue;

        let entry = profile.endorsements.find(x => x.skill === e.skill);
        if (!entry) {
            entry = { skill: e.skill, endorsers: [] };
            profile.endorsements.push(entry);
        }
        for (const endorser of e.endorsers) {
            if (!entry.endorsers.includes(endorser)) entry.endorsers.push(endorser);
        }
        profile.markModified("endorsements");
        await profile.save();
        count++;
    }
    console.log(`Endorsement entries: ${count} updated`);
}

async function run() {
    if (!process.env.MONGO_URI) {
        console.error("❌  MONGO_URI not set in .env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB\n");

    await wipeDatabase();
    await seedUsersAndProfiles();
    await seedJobs();
    await seedApplications();
    await seedStartups();
    await seedEndorsements();

    console.log("\n✅  Reset + seeding complete!");
    console.log(`\nDemo login password for every seeded account: ${DEMO_PASSWORD}`);
    console.log(`\nStudents (${students.length}): ` + students.map(s => s.email).join(", "));
    console.log(`\nRecruiters (${recruiters.length}): ` + recruiters.map(r => r.email).join(", "));

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});

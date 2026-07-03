// Same list used by the frontend autocomplete (dashboard.js MASTER_SKILLS).
// Kept as a separate backend copy since the frontend and backend don't share
// a module system — if you add a skill to one, add it to the other too.
const MASTER_SKILLS = [
    "React","React Native","Angular","Vue.js","Next.js","Svelte","HTML","CSS","Tailwind CSS",
    "Bootstrap","JavaScript","TypeScript","jQuery","Redux","Node.js","Express.js","Django",
    "Flask","FastAPI","Spring Boot","Ruby on Rails","PHP","Laravel","ASP.NET",".NET Core",
    "Python","Java","C","C++","C#","Go","Rust","Kotlin","Swift","Scala","R","MATLAB",
    "MySQL","PostgreSQL","MongoDB","SQLite","Redis","Firebase","Supabase","GraphQL","REST API",
    "Docker","Kubernetes","AWS","Azure","Google Cloud Platform","CI/CD","Jenkins","Git","GitHub",
    "Linux","Bash","Nginx","Terraform","Ansible","Machine Learning","Deep Learning",
    "Natural Language Processing","Computer Vision","TensorFlow","PyTorch","Scikit-learn",
    "Pandas","NumPy","Data Analysis","Data Visualization","Power BI","Tableau","Excel",
    "Android Development","iOS Development","Flutter","Socket.IO","WebSockets",
    "Microservices","System Design","OOP","DSA","Algorithms","Operating Systems",
    "Computer Networks","DBMS","Blockchain","Solidity","Web3","Cybersecurity","Penetration Testing",
    "UI/UX Design","Figma","Adobe XD","Photoshop","Product Management","Agile","Scrum",
    "Unit Testing","Jest","Cypress","Selenium","Postman","Webpack","Vite",
    "Three.js","D3.js","Chart.js","Prisma","Sequelize","Mongoose","Apache Kafka","RabbitMQ",
    "Elasticsearch","Data Structures","Cloud Computing","Serverless"
];

/**
 * Scans raw resume text for any skill in MASTER_SKILLS.
 * Case-insensitive, whole-word-ish match (avoids "R" matching inside "Format").
 */
function extractSkillsFromText(text) {
    const lowerText = text.toLowerCase();
    return MASTER_SKILLS.filter(skill => {
        const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
        return pattern.test(lowerText);
    });
}

module.exports = { MASTER_SKILLS, extractSkillsFromText };

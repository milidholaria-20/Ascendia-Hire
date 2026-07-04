// ── Mobile sidebar ──────────────────────────────────────────────────────────────
function openSidebar()  {
    document.getElementById("appSidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("open");
}
function closeSidebar() {
    document.getElementById("appSidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("open");
}

// ── Session ──────────────────────────────────────────────────────────────────────
const API      = "http://localhost:3000";
const email    = localStorage.getItem("userEmail");
const role     = localStorage.getItem("userRole")     || "student";
const userName = localStorage.getItem("userName")     || "";
const company  = localStorage.getItem("userCompany")  || "";

if (!email) { window.location.href = "index.html"; }

// ── Sidebar setup ────────────────────────────────────────────────────────────────
const initials = (userName || email || "?")[0].toUpperCase();
document.getElementById("sidebarAvatar").textContent  = initials;
document.getElementById("sidebarName").textContent    = userName || email.split("@")[0];
document.getElementById("sidebarEmail").textContent   = email;

const roleBadgeColor = { student: "background:rgba(59,130,246,0.15);color:#7CA8FF", recruiter: "background:rgba(56,189,248,0.16);color:#7DD3FC" };
const roleLabel      = { student: "🎓 Student", recruiter: "🏢 Recruiter" };
const roleEl = document.getElementById("sidebarRole");
roleEl.textContent = roleLabel[role] || role;
roleEl.setAttribute("style", roleBadgeColor[role] || "");

document.getElementById("headerBadge").textContent = role === "recruiter"
    ? (company || "Recruiter")
    : (localStorage.getItem("userProgram") || "Student");
document.getElementById("headerBadge").className = `tag`;
document.getElementById("headerBadge").style.cssText = role === "recruiter"
    ? "background:rgba(56,189,248,0.14);color:#7DD3FC"
    : "background:rgba(59,130,246,0.14);color:#7CA8FF";

const studentNav = `
    <button class="nav-btn" id="nav-home"    onclick="goNav('home')">   <i class="fas fa-chart-pie"></i>Dashboard</button>
    <p class="nav-section-label">Startup Hub</p>
    <button class="nav-btn" id="nav-pitch"   onclick="goNav('pitch')">  <i class="fas fa-lightbulb"></i>Pitch My Idea</button>
    <button class="nav-btn" id="nav-explore" onclick="goNav('explore')"><i class="fas fa-search"></i>Explore Startups</button>
    <p class="nav-section-label">Opportunities</p>
    <button class="nav-btn" id="nav-jobs"    onclick="goNav('jobs')">   <i class="fas fa-briefcase"></i>Job Portal</button>
    <button class="nav-btn" id="nav-myapps"  onclick="goNav('myapps')"> <i class="fas fa-paper-plane"></i>My Applications</button>
    <button class="nav-btn" id="nav-messages" onclick="goNav('messages')"><i class="fas fa-comment-dots"></i>Messages</button>
    <p class="nav-section-label">Network</p>
    <button class="nav-btn" id="nav-profiles" onclick="goNav('profiles')"><i class="fas fa-users"></i>Browse Peers</button>
    <p class="nav-section-label">Account</p>
    <button class="nav-btn" id="nav-profile" onclick="goNav('profile')"><i class="fas fa-user"></i>My Profile</button>`;

const recruiterNav = `
    <button class="nav-btn" id="nav-home"     onclick="goNav('home')">    <i class="fas fa-chart-pie"></i>Dashboard</button>
    <p class="nav-section-label">Jobs</p>
    <button class="nav-btn" id="nav-postjob"  onclick="goNav('postjob')"> <i class="fas fa-plus-circle"></i>Post a Job</button>
    <button class="nav-btn" id="nav-myjobs"   onclick="goNav('myjobs')">  <i class="fas fa-briefcase"></i>My Posted Jobs</button>
    <button class="nav-btn" id="nav-jobs"     onclick="goNav('jobs')">    <i class="fas fa-list"></i>All Jobs</button>
    <button class="nav-btn" id="nav-analytics" onclick="goNav('analytics')"><i class="fas fa-chart-line"></i>Analytics</button>
    <button class="nav-btn" id="nav-messages" onclick="goNav('messages')"><i class="fas fa-comment-dots"></i>Messages</button>
    <p class="nav-section-label">Talent</p>
    <button class="nav-btn" id="nav-explore"  onclick="goNav('explore')"> <i class="fas fa-search"></i>Browse Startups</button>
    <button class="nav-btn" id="nav-profiles" onclick="goNav('profiles')"><i class="fas fa-users"></i>Student Profiles</button>
    <p class="nav-section-label">Account</p>
    <button class="nav-btn" id="nav-profile"  onclick="goNav('profile')"> <i class="fas fa-user"></i>My Profile</button>`;

document.getElementById("sidebarNav").innerHTML = role === "recruiter" ? recruiterNav : studentNav;

// ── Toast ────────────────────────────────────────────────────────────────────────
function toast(msg, isError = false) {
    const t = document.getElementById("toast");
    t.innerHTML = `<i class="fas ${isError ? 'fa-circle-xmark' : 'fa-circle-check'}"></i> ${msg}`;
    t.style.background = isError ? "#F87171" : "#E7ECF5";
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 3200);
}

// ── Logout ───────────────────────────────────────────────────────────────────────
function logout() { localStorage.clear(); window.location.href = "index.html"; }

// ── Navigation ───────────────────────────────────────────────────────────────────
const pageTitles = {
    home: "Dashboard", pitch: "Pitch My Idea", explore: "Explore Ecosystem",
    jobs: "Job Portal", myapps: "My Applications", profile: "My Profile",
    postjob: "Post a Job", myjobs: "My Posted Jobs", profiles: "Student Profiles",
    messages: "Messages", "conversation-detail": "Messages", analytics: "Analytics"
};

function goNav(mod) {
    closeSidebar();
    loadModule(mod);
}

function loadModule(mod) {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    const activeNavId = mod === "conversation-detail" ? "messages" : mod;
    const btn = document.getElementById(`nav-${activeNavId}`);
    if (btn) btn.classList.add("active");
    document.getElementById("pageTitle").textContent = pageTitles[mod] || "";
    const view = document.getElementById("mainView");
    // Remember the current page so a browser refresh reopens it instead of
    // always jumping back to the Dashboard.
    if (mod !== "startup-detail" && mod !== "conversation-detail") {
        localStorage.setItem("lastModule", mod);
    }
    // cleanup socket rooms when leaving detail views
    if (_currentStartupId && mod !== "startup-detail") {
        _currentStartupId = null;
    }
    if (_currentConversationId && mod !== "conversation-detail") {
        _currentConversationId = null;
    }
    ({
        home:     () => renderHome(view),
        pitch:    () => renderPitch(view),
        explore:  () => renderExplore(view),
        jobs:     () => renderJobs(view),
        myapps:   () => renderMyApplications(view),
        profile:  () => renderProfile(view),
        postjob:  () => renderPostJob(view),
        myjobs:   () => renderMyJobs(view),
        profiles: () => renderStudentProfiles(view),
        messages: () => renderMessages(view),
        analytics: () => renderAnalytics(view),
    }[mod] || (() => { view.innerHTML = `<p style="color:#8892A8;text-align:center;margin-top:4rem">Coming soon…</p>`; }))();
}

// ── Socket.IO setup ──────────────────────────────────────────────────────────────
const socket = io();

socket.on("newMessage", ({ author, text, ts }) => {
    const msgList = document.getElementById("msgList");
    if (!msgList) return;
    const isSelf = author === email;
    const time   = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const bubble = document.createElement("div");
    bubble.className = `msg-bubble ${isSelf ? "self" : "other"}`;
    bubble.innerHTML = `
        <div class="msg-avatar ${isSelf ? "self" : ""}">${(author[0] || "?").toUpperCase()}</div>
        <div class="msg-body ${isSelf ? "self" : ""}">
            <div class="msg-meta ${isSelf ? "self" : ""}">
                <span>${isSelf ? "You" : author.split("@")[0]}</span>
                <span>${time}</span>
            </div>
            <div class="msg-bubble-text ${isSelf ? "self" : ""}">${escHtml(text)}</div>
        </div>`;
    msgList.appendChild(bubble);
    msgList.scrollTop = msgList.scrollHeight;
});

// Direct (recruiter <-> student) messages — reuses the same .msg-bubble CSS
// classes as startup chat, just targets #dmList instead of #msgList
socket.on("newDirectMessage", ({ author, text, ts }) => {
    const msgList = document.getElementById("dmList");
    if (!msgList) return;
    const isSelf = author === email;
    const time   = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const bubble = document.createElement("div");
    bubble.className = `msg-bubble ${isSelf ? "self" : "other"}`;
    bubble.innerHTML = `
        <div class="msg-avatar ${isSelf ? "self" : ""}">${(author[0] || "?").toUpperCase()}</div>
        <div class="msg-body ${isSelf ? "self" : ""}">
            <div class="msg-meta ${isSelf ? "self" : ""}">
                <span>${isSelf ? "You" : author.split("@")[0]}</span>
                <span>${time}</span>
            </div>
            <div class="msg-bubble-text ${isSelf ? "self" : ""}">${escHtml(text)}</div>
        </div>`;
    msgList.appendChild(bubble);
    msgList.scrollTop = msgList.scrollHeight;
});

function escHtml(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════════════════════
function renderHome(view) {
    const displayName = userName || email.split("@")[0];
    const gradYear    = parseInt(localStorage.getItem("graduationYear") || "0");
    const program     = localStorage.getItem("userProgram") || "";
    const yearsLeft   = gradYear ? Math.max(0, gradYear - new Date().getFullYear()) : "—";
    const isRec       = role === "recruiter";

    view.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- Hero banner -->
        <div style="background:linear-gradient(135deg,${isRec?"#1E3A5F,#0F1F35":"#38BDF8,#7DD3FC"});border-radius:20px;padding:2rem;color:white;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4)">
            <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:rgba(255,255,255,0.05);border-radius:50%"></div>
            <div style="position:absolute;bottom:-60px;right:80px;width:120px;height:120px;background:rgba(255,255,255,0.04);border-radius:50%"></div>
            <div style="position:relative">
                <p style="font-size:0.75rem;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.35rem">${isRec?"Recruiter Dashboard":"Student Dashboard"}</p>
                <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.25rem">Hey, ${displayName}! 👋</h2>
                <p style="color:rgba(255,255,255,0.65);font-size:0.88rem;margin-bottom:1.25rem">
                    ${isRec ? `${company ? company+" · " : ""}Post jobs and discover top student talent.` : `${program} · ${yearsLeft} year${yearsLeft!==1?"s":""} until graduation`}
                </p>
                <div style="display:flex;gap:0.65rem;flex-wrap:wrap">
                    ${isRec
                        ? `<button onclick="loadModule('postjob')" style="background:white;color:#38BDF8;border:none;padding:0.55rem 1.1rem;border-radius:10px;font-weight:700;font-size:0.82rem;cursor:pointer;font-family:Inter,sans-serif">Post a Job</button>
                           <button onclick="loadModule('profiles')" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.2);padding:0.55rem 1.1rem;border-radius:10px;font-weight:700;font-size:0.82rem;cursor:pointer;font-family:Inter,sans-serif">Browse Students</button>`
                        : `<button onclick="loadModule('jobs')" style="background:white;color:#38BDF8;border:none;padding:0.55rem 1.1rem;border-radius:10px;font-weight:700;font-size:0.82rem;cursor:pointer;font-family:Inter,sans-serif">Browse Jobs</button>
                           <button onclick="loadModule('pitch')" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.2);padding:0.55rem 1.1rem;border-radius:10px;font-weight:700;font-size:0.82rem;cursor:pointer;font-family:Inter,sans-serif">Pitch an Idea</button>`}
                </div>
            </div>
        </div>

        <!-- 2-col grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
            <div class="card">
                <p class="section-title"><i class="fas fa-bolt" style="color:#f59e0b;margin-right:6px"></i>Quick Actions</p>
                <div style="display:flex;flex-direction:column;gap:0.5rem">
                    ${isRec ? `
                    <button onclick="loadModule('postjob')"  class="quick-action-btn"><i class="fas fa-plus-circle" style="color:#7DD3FC"></i> Post a New Job</button>
                    <button onclick="loadModule('myjobs')"   class="quick-action-btn"><i class="fas fa-briefcase"   style="color:#7DD3FC"></i> View My Posted Jobs</button>
                    <button onclick="loadModule('profiles')" class="quick-action-btn"><i class="fas fa-users"       style="color:#34d399"></i> Browse Student Profiles</button>
                    <button onclick="loadModule('explore')"  class="quick-action-btn"><i class="fas fa-search"      style="color:#f59e0b"></i> Explore Startups</button>
                    ` : `
                    <button onclick="loadModule('profile')"  class="quick-action-btn"><i class="fas fa-user-edit"   style="color:#7DD3FC"></i> Update Profile & Skills</button>
                    <button onclick="loadModule('jobs')"     class="quick-action-btn"><i class="fas fa-briefcase"   style="color:#3B82F6"></i> Browse All Jobs</button>
                    <button onclick="loadModule('myapps')"   class="quick-action-btn"><i class="fas fa-paper-plane" style="color:#34d399"></i> My Applications</button>
                    <button onclick="loadModule('pitch')"    class="quick-action-btn"><i class="fas fa-lightbulb"   style="color:#f59e0b"></i> Pitch a Startup Idea</button>
                    `}
                </div>
            </div>
            <div class="card">
                <p class="section-title"><i class="fas fa-briefcase" style="color:#7DD3FC;margin-right:6px"></i>Latest Jobs</p>
                <div id="homeJobsList"><p style="color:#8892A8;font-size:0.83rem">Loading…</p></div>
            </div>
        </div>
    </div>

    <style>
    .quick-action-btn {
        width:100%;display:flex;align-items:center;gap:0.65rem;padding:0.65rem 0.85rem;
        background:#1B2436;border:1.5px solid #232C42;border-radius:12px;cursor:pointer;
        font-size:0.82rem;font-weight:600;color:#C7D0E0;font-family:Inter,sans-serif;
        transition:all 0.15s;text-align:left;
    }
    .quick-action-btn:hover { background:rgba(59,130,246,0.14);border-color:rgba(56,189,248,0.35);color:#7CA8FF; }
    @media(max-width:600px){
        .quick-action-btn { padding:0.55rem 0.7rem; }
        div[style*="grid-template-columns:1fr 1fr"] { grid-template-columns:1fr!important; }
    }
    </style>`;

    fetch(`${API}/jobs/all`).then(r=>r.json()).then(jobs=>{
        const el = document.getElementById("homeJobsList");
        if (!jobs.length) { el.innerHTML=`<p style="color:#8892A8;font-size:0.83rem">No jobs yet.</p>`; return; }
        el.innerHTML = jobs.slice(0,4).map(j=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid #1B2436">
                <div>
                    <p style="font-weight:700;font-size:0.83rem;color:#E7ECF5">${j.title}</p>
                    <p style="font-size:0.72rem;color:#8892A8">${j.company}</p>
                </div>
                <button class="btn-sm-outline" onclick="loadModule('jobs')">View</button>
            </div>`).join("");
    }).catch(()=>{ const el=document.getElementById("homeJobsList"); if(el) el.innerHTML=`<p style="color:#ef4444;font-size:0.83rem">Could not load.</p>`; });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
function renderProfile(view) {
    view.innerHTML = `
    <div style="max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:1.1rem">
        <div class="card" id="profileCard"><p style="color:#8892A8;font-size:0.85rem">Loading…</p></div>
        ${role==="student"?`
        <div class="card">
            <p class="section-title"><i class="fas fa-tools" style="color:#7DD3FC;margin-right:6px"></i>Skills</p>
            <div id="skillsList" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem"></div>
            <div style="display:flex;gap:0.65rem">
                <input class="input-field" id="skillInput" placeholder="Add a skill (e.g. React)" style="max-width:260px" onkeydown="if(event.key==='Enter')addSkill()">
                <button class="btn btn-indigo" onclick="addSkill()"><i class="fas fa-plus"></i> Add</button>
            </div>
        </div>`:""}
        ${role==="student"?`
        <div class="card">
            <p class="section-title"><i class="fas fa-file-arrow-up" style="color:#7DD3FC;margin-right:6px"></i>Resume</p>
            <div id="resumeStatus" style="margin-bottom:0.85rem"></div>
            <div style="display:flex;gap:0.65rem;align-items:center;flex-wrap:wrap">
                <input type="file" id="resumeFile" accept="application/pdf" class="input-field" style="max-width:280px;padding:0.5rem 0.7rem">
                <button class="btn btn-indigo" onclick="uploadResume()" id="resumeUploadBtn"><i class="fas fa-upload"></i> Upload & Parse</button>
            </div>
            <p style="font-size:0.72rem;color:#7C879C;margin-top:0.6rem"><i class="fas fa-circle-info" style="margin-right:4px"></i>PDF only. We scan the text for known skills and suggest ones to add to your profile.</p>
            <div id="resumeSuggestions" style="margin-top:0.85rem"></div>
        </div>`:""}
        <div class="card">
            <p class="section-title"><i class="fas fa-edit" style="color:#7DD3FC;margin-right:6px"></i>Update Details</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1rem">
                <input class="input-field" id="profileBio"       placeholder="Bio / About">
                <input class="input-field" id="profilePhone"     placeholder="Phone">
                <input class="input-field" id="profileGithub"    placeholder="GitHub URL">
                <input class="input-field" id="profileLinkedin"  placeholder="LinkedIn URL">
                <input class="input-field" id="profilePortfolio" placeholder="Portfolio / Website URL">
            </div>
            <button class="btn btn-indigo" onclick="updateProfile()"><i class="fas fa-save"></i> Save Changes</button>
        </div>
        <div class="card" style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.08)">
            <p class="section-title"><i class="fas fa-triangle-exclamation" style="color:#F87171;margin-right:6px"></i>Danger Zone</p>
            <p style="font-size:0.82rem;color:#7C879C;line-height:1.6;margin-bottom:1rem">
                Delete just your profile to hide it from others, or delete your whole account to remove your platform access and related visible records.
            </p>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
                <button onclick="deleteMyProfile()" style="background:rgba(239,68,68,0.12);color:#F87171;border:1.5px solid rgba(239,68,68,0.35);padding:0.58rem 1.1rem;border-radius:9px;font-weight:700;font-size:0.8rem;cursor:pointer;font-family:Inter,sans-serif;display:inline-flex;align-items:center;gap:0.35rem"><i class="fas fa-user-slash"></i> Delete Profile</button>
                <button class="btn btn-red" onclick="deleteMyAccount()"><i class="fas fa-trash"></i> Delete Account</button>
            </div>
        </div>
    </div>`;
    if (role === "student") {
        const skillInputEl = document.getElementById("skillInput");
        if (skillInputEl) attachSingleSkillAutocomplete(skillInputEl);
    }
    loadProfileData();
}

async function loadProfileData() {
    try {
        const data = await (await fetch(`${API}/profile/${email}`)).json();
        const card = document.getElementById("profileCard");
        if (!card) return;
        if (data.message === "Profile not found") {
            card.innerHTML = `<p style="color:#7C879C;font-size:0.85rem;margin-bottom:1rem">No profile found. Create one to enable skill gap analysis.</p>
                <button class="btn btn-indigo" onclick="createProfile()"><i class="fas fa-plus"></i> Create Profile</button>`;
            return;
        }
        const skills = data.skills?.[0]?.skill || [];
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:1rem">
                <div style="width:52px;height:52px;background:linear-gradient(135deg,#38BDF8,#7DD3FC);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900;color:#041016;flex-shrink:0">
                    ${(data.name?.[0]||email)[0].toUpperCase()}
                </div>
                <div>
                    <p style="font-weight:800;font-size:1.05rem;color:#E7ECF5">${data.name?.[0]||"—"}</p>
                    <p style="font-size:0.78rem;color:#8892A8">${data.email?.[0]||email}</p>
                    <p style="font-size:0.75rem;color:#7C879C">${role==="student"?(data.program?.[0]||"")+" "+(data.joinYear?.[0]?`· Joined ${data.joinYear[0]}`:""):(data.company?.[0]||company||"Recruiter")}</p>
                </div>
            </div>
            ${data.bio?.[0]?`<p style="color:#A8B3C7;font-size:0.85rem;margin-top:1rem;line-height:1.65">${data.bio[0]}</p>`:""}
            <div style="display:flex;gap:0.65rem;margin-top:0.85rem;flex-wrap:wrap">
                ${data.github?.[0]   ?`<a href="${data.github[0]}"   target="_blank" style="font-size:0.75rem;color:#38BDF8;text-decoration:none;display:flex;align-items:center;gap:4px"><i class="fab fa-github"></i>GitHub</a>`:""}
                ${data.linkedin?.[0] ?`<a href="${data.linkedin[0]}" target="_blank" style="font-size:0.75rem;color:#38BDF8;text-decoration:none;display:flex;align-items:center;gap:4px"><i class="fab fa-linkedin"></i>LinkedIn</a>`:""}
                ${data.portfolio?.[0]?`<a href="${data.portfolio[0]}" target="_blank" style="font-size:0.75rem;color:#38BDF8;text-decoration:none;display:flex;align-items:center;gap:4px"><i class="fas fa-globe"></i>Portfolio</a>`:""}
            </div>`;
        ["Bio","Phone","Github","Linkedin","Portfolio"].forEach(f=>{
            const el=document.getElementById(`profile${f}`);
            if(el&&data[f.toLowerCase()]?.[0]) el.value=data[f.toLowerCase()][0];
        });
        const sl = document.getElementById("skillsList");
        if(sl) {
            const endorsements = data.endorsements || [];
            sl.innerHTML = skills.length
                ? skills.map(s=>{
                    const entry = endorsements.find(e=>e.skill===s);
                    const count = entry?.endorsers?.length || 0;
                    return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(59,130,246,0.14);color:#7CA8FF;padding:0.25rem 0.7rem;border-radius:9999px;font-size:0.75rem;font-weight:700">
                    ${s}${count?`<span style="background:rgba(56,189,248,0.2);color:#7DD3FC;padding:0.05rem 0.4rem;border-radius:9999px;font-size:0.65rem" title="${count} endorsement${count!==1?"s":""}"><i class="fas fa-star" style="font-size:8px;margin-right:2px"></i>${count}</span>`:""}<button onclick="deleteSkill('${s}')" style="background:none;border:none;cursor:pointer;color:#7DD3FC;font-size:14px;line-height:1;padding:0;margin-left:2px" title="Remove">×</button></span>`;
                }).join("")
                : `<p style="color:#8892A8;font-size:0.83rem">No skills added yet.</p>`;
        }
        const resumeStatusEl = document.getElementById("resumeStatus");
        if (resumeStatusEl) {
            const resumeUrl = data.resume?.[0];
            resumeStatusEl.innerHTML = resumeUrl
                ? `<a href="${API}${resumeUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;color:#34D399;text-decoration:none"><i class="fas fa-file-pdf"></i> Current resume on file — click to view</a>`
                : `<p style="font-size:0.8rem;color:#8892A8">No resume uploaded yet.</p>`;
        }
    } catch {
        const card=document.getElementById("profileCard");
        if(card) card.innerHTML=`<p style="color:#ef4444;font-size:0.85rem">Could not load profile — is the server running?</p>`;
    }
}

async function createProfile() {
    const payload = { name: userName||email.split("@")[0], email };
    if(role==="student") { payload.program=localStorage.getItem("userProgram")||"BTech"; payload.joinYear=localStorage.getItem("userJoinYear")||new Date().getFullYear(); }
    else { payload.company=localStorage.getItem("userCompany")||"Recruiter"; payload.role="Recruiter"; }
    const data = await (await fetch(`${API}/profile/create`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})).json();
    toast(data.message);
    loadProfileData();
}

async function addSkill() {
    const skill = document.getElementById("skillInput").value.trim();
    if(!skill) return;
    const data = await (await fetch(`${API}/profile/add-skill`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,skill})})).json();
    toast(data.message, data.message!=="Skill added successfully");
    document.getElementById("skillInput").value="";
    _myProfileSkills = null; // invalidate cache so job match % recalculates next time
    loadProfileData();
}

async function deleteSkill(skill) {
    const data = await (await fetch(`${API}/profile/delete-skill`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,skill})})).json();
    toast(data.message);
    _myProfileSkills = null; // invalidate cache so job match % recalculates next time
    loadProfileData();
}

async function toggleEndorse(targetEmail, skill, btnEl) {
    btnEl.disabled = true;
    try {
        const data = await (await fetch(`${API}/profile/endorse`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({endorserEmail:email,targetEmail,skill})})).json();
        if (data.message !== "ok") { toast(data.message || "Could not endorse", true); btnEl.disabled = false; return; }

        const iEndorsed = data.endorsed;
        const count = data.count;
        btnEl.style.background = iEndorsed ? "rgba(56,189,248,0.18)" : "rgba(59,130,246,0.14)";
        btnEl.style.color      = iEndorsed ? "#7DD3FC" : "#7CA8FF";
        btnEl.style.borderColor = iEndorsed ? "rgba(56,189,248,0.4)" : "transparent";
        btnEl.innerHTML = `<i class="fas ${iEndorsed?"fa-check-circle":"fa-plus-circle"}" style="font-size:9px"></i>${skill}${count?` · ${count}`:""}`;
        toast(iEndorsed ? `Endorsed "${skill}"` : `Removed endorsement`);
    } catch {
        toast("Could not update endorsement", true);
    }
    btnEl.disabled = false;
}

async function uploadResume() {
    const fileInput = document.getElementById("resumeFile");
    const file = fileInput.files[0];
    if (!file) { toast("Choose a PDF file first", true); return; }
    if (file.type !== "application/pdf") { toast("Only PDF files are supported", true); return; }

    const btn = document.getElementById("resumeUploadBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Parsing…';

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("email", email);

    try {
        const data = await (await fetch(`${API}/profile/upload-resume`, { method: "POST", body: formData })).json();
        if (data.message !== "Resume uploaded and parsed") {
            toast(data.message || "Upload failed", true);
        } else {
            toast("Resume uploaded! Found " + data.suggestedSkills.length + " skill(s).");
            renderResumeSuggestions(data.suggestedSkills || []);
            loadProfileData();
        }
    } catch {
        toast("Could not upload resume", true);
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> Upload & Parse';
}

function renderResumeSuggestions(suggested) {
    const box = document.getElementById("resumeSuggestions");
    if (!box) return;
    const currentSkills = (_myProfileSkills || []).map(s => s.toLowerCase());
    const newOnes = suggested.filter(s => !currentSkills.includes(s.toLowerCase()));

    if (!newOnes.length) {
        box.innerHTML = suggested.length
            ? `<p style="font-size:0.78rem;color:#8892A8">All detected skills are already on your profile.</p>`
            : "";
        return;
    }

    box.innerHTML = `
        <p style="font-size:0.72rem;font-weight:700;color:#7DD3FC;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">Found in your resume — click to add</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem">
            ${newOnes.map(s => `<button onclick="quickAddSkill('${s.replace(/'/g,"\\'")}', this)" style="display:inline-flex;align-items:center;gap:5px;background:rgba(56,189,248,0.12);border:1px dashed rgba(56,189,248,0.4);color:#7DD3FC;padding:0.25rem 0.7rem;border-radius:9999px;font-size:0.75rem;font-weight:700;cursor:pointer"><i class="fas fa-plus" style="font-size:10px"></i>${s}</button>`).join("")}
        </div>`;
}

async function quickAddSkill(skill, btnEl) {
    btnEl.disabled = true;
    const data = await (await fetch(`${API}/profile/add-skill`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,skill})})).json();
    if (data.message === "Skill added successfully") {
        toast(`Added "${skill}"`);
        _myProfileSkills = null;
        btnEl.remove();
        loadProfileData();
    } else {
        toast(data.message, true);
        btnEl.disabled = false;
    }
}

async function updateProfile() {
    const body = { bio:document.getElementById("profileBio").value, phone:document.getElementById("profilePhone").value, github:document.getElementById("profileGithub").value, linkedin:document.getElementById("profileLinkedin").value, portfolio:document.getElementById("profilePortfolio").value };
    const data = await (await fetch(`${API}/profile/update/${email}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})).json();
    toast(data.message);
    loadProfileData();
}

async function deleteMyProfile() {
    if(!confirm("Delete your profile? Other users will no longer see it.")) return;
    const data = await (await fetch(`${API}/profile/${email}`,{method:"DELETE"})).json();
    const ok = data.message==="Profile deleted successfully";
    toast(data.message, !ok);
    if(ok) loadProfileData();
}

async function deleteMyAccount() {
    if(!confirm("Delete your account permanently? This will remove your access and related visible data.")) return;
    const data = await (await fetch(`${API}/account/${email}`,{method:"DELETE"})).json();
    const ok = data.message==="Account deleted successfully";
    toast(data.message, !ok);
    if(ok) {
        localStorage.clear();
        window.location.href = "index.html";
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PITCH
// ═══════════════════════════════════════════════════════════════════════════════
function renderPitch(view) {
    if(role==="recruiter"){view.innerHTML=`<p style="color:#8892A8;text-align:center;margin-top:4rem">This section is for students.</p>`;return;}
    view.innerHTML=`
    <div style="max-width:600px;margin:0 auto">
        <div class="card">
            <p class="section-title"><i class="fas fa-lightbulb" style="color:#f59e0b;margin-right:6px"></i>Submit Your Pitch</p>
            <div style="display:flex;flex-direction:column;gap:0.85rem">
                <input class="input-field" id="pitchTitle" placeholder="Startup Name *" required>
                <textarea class="input-field" id="pitchDesc" placeholder="Describe the problem you solve…" rows="3" style="resize:none"></textarea>
                <input class="input-field" id="pitchSkills" placeholder="Required Skills (comma-separated, e.g. React, Node)">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
                    <select class="input-field" id="pitchIndustry">
                        <option>Fintech</option><option>EdTech</option><option>SaaS</option><option>HealthTech</option><option>E-Commerce</option><option>Other</option>
                    </select>
                    <select class="input-field" id="pitchStage">
                        <option>Idea Stage</option><option>Prototype / MVP</option><option>Early Traction</option>
                    </select>
                </div>
                <button class="btn btn-indigo" style="padding:0.75rem;justify-content:center;font-size:0.9rem" onclick="submitPitch()">
                    <i class="fas fa-paper-plane"></i> Launch Pitch
                </button>
            </div>
        </div>
    </div>`;
    const pitchSkillsEl = document.getElementById("pitchSkills");
    if (pitchSkillsEl) attachMultiSkillAutocomplete(pitchSkillsEl);
}

async function submitPitch() {
    const title  = document.getElementById("pitchTitle").value.trim();
    const skills = document.getElementById("pitchSkills").value.split(",").map(s=>s.trim()).filter(Boolean);
    if(!title){toast("Startup name is required",true);return;}
    const data = await (await fetch(`${API}/startup/post`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,description:document.getElementById("pitchDesc").value.trim(),email,skills})})).json();
    toast(data.message);
    if(data.message==="Startup posted successfully") loadModule("explore");
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLORE STARTUPS
// ═══════════════════════════════════════════════════════════════════════════════
function renderExplore(view) {
    view.innerHTML=`
    <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
            <p class="section-title" style="margin:0">All Startups</p>
            ${role==="student"?`<button class="btn btn-indigo" onclick="loadModule('pitch')"><i class="fas fa-plus"></i> Pitch Yours</button>`:""}
        </div>
        <div id="startupGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem">
            <p style="color:#8892A8;text-align:center;margin-top:3rem;grid-column:1/-1">Loading startups…</p>
        </div>
    </div>`;
    loadStartups();
}

async function loadStartups() {
    try {
        const data = await (await fetch(`${API}/startup/all`)).json();
        const grid = document.getElementById("startupGrid");
        if(!data.length){grid.innerHTML=`<p style="color:#8892A8;text-align:center;margin-top:3rem;grid-column:1/-1">No startups yet.</p>`;return;}
        const grads = [["#38BDF8","#0EA5E9"],["#FBBF24","#D97706"],["#3B82F6","#7CA8FF"],["#0EA5C4","#0B4A56"],["#7C3AED","#5B21B6"]];
        grid.innerHTML = data.map((s,i)=>{
            const id=s.id?.[0]||"", title=s.title?.[0]||"Untitled", desc=s.description?.[0]||"";
            const creator=s.creator?.[0]||"", skills=s.requiredSkills?.[0]?.skill||[], members=s.team?.[0]?.member?.length||1;
            const isOwn=creator===email, isMember=(s.team?.[0]?.member||[]).includes(email);
            const [c1,c2]=grads[i%grads.length];
            return `
            <div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
                <div style="height:80px;background:linear-gradient(135deg,${c1},${c2});padding:1rem;display:flex;align-items:flex-end">
                    <span style="background:rgba(255,255,255,0.2);color:white;padding:0.18rem 0.6rem;border-radius:9999px;font-size:0.65rem;font-weight:700;backdrop-filter:blur(6px)">${skills[0]||"Startup"}</span>
                </div>
                <div style="padding:1.1rem;flex:1;display:flex;flex-direction:column">
                    <h4 style="font-weight:800;font-size:0.92rem;margin-bottom:0.25rem;color:#E7ECF5">${title}</h4>
                    <p style="font-size:0.75rem;color:#8892A8;margin-bottom:0.75rem;flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${desc||"No description."}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.75rem">
                        ${skills.slice(0,3).map(sk=>`<span class="tag" style="background:rgba(59,130,246,0.14);color:#7CA8FF">${sk}</span>`).join("")}
                        ${skills.length>3?`<span class="tag" style="background:#1B2436;color:#7C879C">+${skills.length-3}</span>`:""}
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #1B2436;padding-top:0.75rem">
                        <span style="font-size:0.72rem;color:#8892A8"><i class="fas fa-users" style="margin-right:4px"></i>${members} member${members!==1?"s":""}</span>
                        <div style="display:flex;gap:0.4rem;align-items:center">
                            <button class="btn-sm-outline" onclick="viewStartup('${id}')"><i class="fas fa-eye"></i> View</button>
                            ${role==="student"?`<button class="btn-sm-outline" onclick="checkStartupGap('${id}','${title}')">Skill Gap</button>`:""}
                            ${isOwn
                                ? `<button class="btn btn-red" style="padding:0.35rem 0.75rem;font-size:0.73rem" onclick="deleteStartup('${id}')"><i class="fas fa-trash"></i> Delete</button>`
                                : role==="student" && isMember
                                    ? `<button class="btn-sm-outline" style="border-color:rgba(239,68,68,0.3);color:#F87171" onclick="leaveStartup('${id}')"><i class="fas fa-right-from-bracket"></i> Leave</button>`
                                    : role==="student"
                                        ? `<button class="btn btn-slate" style="padding:0.35rem 0.75rem;font-size:0.73rem" onclick="joinStartup('${id}')">Join</button>`
                                        : ""
                            }
                        </div>
                    </div>
                </div>
            </div>`;
        }).join("");
    } catch {
        const grid=document.getElementById("startupGrid");
        if(grid) grid.innerHTML=`<p style="color:#ef4444;text-align:center;margin-top:3rem;grid-column:1/-1">Could not load startups.</p>`;
    }
}

async function joinStartup(id) {
    const data = await (await fetch(`${API}/startup/join`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({startupId:id,email})})).json();
    toast(data.message);
    if(data.message==="Joined startup successfully"||data.message==="Already a member") viewStartup(id);
    else loadStartups();
}

async function leaveStartup(id) {
    if(!confirm("Leave this startup? You will lose access to its team chat.")) return;
    const data = await (await fetch(`${API}/startup/leave`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ startupId:id, email })
    })).json();
    const ok = data.message==="Left startup successfully";
    toast(data.message, !ok);
    if(ok) {
        _currentStartupId = null;
        loadModule("explore");
    }
}

async function deleteStartup(id) {
    if(!confirm("Delete this startup? This action cannot be undone.")) return;
    const data = await (await fetch(`${API}/startup/delete/${id}?email=${encodeURIComponent(email)}`,{
        method:"DELETE"
    })).json();
    const ok = data.message==="Deleted successfully";
    toast(data.message, !ok);
    if(ok) {
        _currentStartupId = null;
        loadModule("explore");
    }
}

async function checkStartupGap(id, title) {
    const data = await (await fetch(`${API}/startup/skill-gap/${email}/${id}`)).json();
    if(data.message){toast(data.message,true);return;}
    showGapModal(title,data.required,data.missing,data.userSkills);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STARTUP DETAIL + REAL-TIME CHAT
// ═══════════════════════════════════════════════════════════════════════════════
let _currentStartupId = null;

async function viewStartup(id) {
    const view = document.getElementById("mainView");
    view.innerHTML = `<p style="color:#8892A8;text-align:center;margin-top:4rem">Loading…</p>`;
    let s;
    try {
        s = await (await fetch(`${API}/startup/${id}`)).json();
    } catch {
        view.innerHTML = `<p style="color:#ef4444;text-align:center;margin-top:4rem">Could not load startup.</p>`;
        return;
    }
    if(s.message){toast(s.message,true);loadModule("explore");return;}
    _currentStartupId = id;
    socket.emit("joinRoom", { startupId: id });
    renderStartupDetail(s);
}

function renderStartupDetail(s) {
    const view     = document.getElementById("mainView");
    const members  = s.team?.[0]?.member || [];
    const skills   = s.requiredSkills?.[0]?.skill || [];
    const msgs     = s.messages?.[0]?.message || [];
    const title    = s.title?.[0] || "Untitled";
    const desc     = s.description?.[0] || "";
    const creator  = s.creator?.[0] || "";
    const isOwn    = creator === email;
    const isMember = members.includes(email);
    const id       = s.id?.[0] || "";
    const canChat  = isMember;

    view.innerHTML = `
    <div style="max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:1rem">

        <button class="btn-sm-outline" onclick="loadModule('explore')"><i class="fas fa-arrow-left"></i> Back to Explore</button>

        <div class="card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:0.85rem">
                <div>
                    <h2 style="font-weight:800;font-size:1.2rem;color:#E7ECF5;letter-spacing:-0.02em">${title}</h2>
                    <p style="font-size:0.75rem;color:#8892A8;margin-top:2px">by ${creator}</p>
                </div>
                <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;justify-content:flex-end">
                    ${isOwn
                        ? `<span class="tag" style="background:rgba(59,130,246,0.14);color:#7CA8FF;flex-shrink:0">Your startup</span>
                           <button class="btn btn-red" style="flex-shrink:0;padding:0.4rem 0.9rem;font-size:0.78rem" onclick="deleteStartup('${id}')"><i class="fas fa-trash"></i> Delete</button>`
                        : role==="student" && !isMember
                            ? `<button class="btn btn-slate" style="flex-shrink:0;padding:0.4rem 0.9rem;font-size:0.78rem" onclick="joinStartup('${id}')">Join</button>`
                            : isMember
                                ? `<span class="tag" style="background:rgba(16,185,129,0.14);color:#34D399;flex-shrink:0">Member</span>
                                   <button class="btn-sm-outline" style="border-color:rgba(239,68,68,0.3);color:#F87171" onclick="leaveStartup('${id}')"><i class="fas fa-right-from-bracket"></i> Leave</button>`
                                : ""
                    }
                </div>
            </div>
            ${desc?`<p style="font-size:0.85rem;color:#A8B3C7;margin-bottom:1rem;line-height:1.65">${desc}</p>`:""}
            ${skills.length?`
            <div style="margin-bottom:1rem">
                <p style="font-size:0.65rem;font-weight:700;color:#8892A8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.5rem">Required Skills</p>
                <div style="display:flex;flex-wrap:wrap;gap:0.35rem">
                    ${skills.map(sk=>`<span class="tag" style="background:rgba(59,130,246,0.14);color:#7CA8FF">${sk}</span>`).join("")}
                </div>
            </div>`:""}
            <div>
                <p style="font-size:0.65rem;font-weight:700;color:#8892A8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.5rem">Team (${members.length})</p>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
                    ${members.map(m=>`
                    <div style="display:flex;align-items:center;gap:0.5rem;background:#1B2436;border:1px solid #232C42;border-radius:10px;padding:0.4rem 0.75rem">
                        <div style="width:26px;height:26px;border-radius:7px;background:rgba(59,130,246,0.14);color:#7CA8FF;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.7rem">${(m[0]||"?").toUpperCase()}</div>
                        <span style="font-size:0.75rem;color:#A8B3C7">${m}</span>
                        ${m===creator?`<span style="font-size:0.62rem;color:#7DD3FC;font-weight:700">founder</span>`:""}
                    </div>`).join("")}
                </div>
            </div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;gap:0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
                <p style="font-size:0.65rem;font-weight:700;color:#8892A8;text-transform:uppercase;letter-spacing:0.07em;display:flex;align-items:center;gap:6px">
                    <i class="fas fa-comments"></i> Live Chat
                    <span class="live-dot"></span>
                </p>
                <span style="font-size:0.68rem;color:#8892A8;font-family:JetBrains Mono,monospace">real-time</span>
            </div>

            ${canChat ? "" : `<div style="margin-bottom:1rem;background:rgba(56,189,248,0.14);border:1px solid rgba(245,158,11,0.3);color:#7DD3FC;padding:0.75rem 0.9rem;border-radius:12px;font-size:0.78rem">Join this startup to participate in the team chat.</div>`}

            <div id="msgList" style="min-height:180px;max-height:340px;overflow-y:auto;margin-bottom:1rem;padding-right:4px">
                ${msgs.length ? msgs.map(m=>{
                    const author=m.author?.[0]||"", text=m.text?.[0]||"", ts=m.ts?.[0]?new Date(Number(m.ts[0])).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
                    const isSelf=author===email;
                    return `<div class="msg-bubble ${isSelf?"self":""}">
                        <div class="msg-avatar ${isSelf?"self":""}">${(author[0]||"?").toUpperCase()}</div>
                        <div class="msg-body ${isSelf?"self":""}">
                            <div class="msg-meta ${isSelf?"self":""}">
                                <span>${isSelf?"You":author.split("@")[0]}</span>
                                <span>${ts}</span>
                            </div>
                            <div class="msg-bubble-text ${isSelf?"self":""}">${escHtml(text)}</div>
                        </div>
                    </div>`;
                }).join("") : `<p style="color:#8892A8;font-size:0.83rem;text-align:center;padding:2.5rem 0">No messages yet. Be the first! 👋</p>`}
            </div>

            <div style="display:flex;gap:0.65rem">
                <input id="msgInput" class="input-field" style="flex:1" placeholder="${canChat ? "Write a message..." : "Join the startup to chat"}" ${canChat ? "" : "disabled"}
                    onkeydown="if(event.key==='Enter')sendMsg('${id}')">
                <button class="btn btn-indigo" style="padding:0.6rem 1rem" onclick="sendMsg('${id}')" ${canChat ? "" : "disabled"}>
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>`;

    const ml = document.getElementById("msgList");
    if(ml) ml.scrollTop = ml.scrollHeight;
}

function sendMsg(id) {
    const input = document.getElementById("msgInput");
    const text  = input.value.trim();
    if(!text) return;
    input.value = "";
    socket.emit("sendMessage", { startupId: id, email, text });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGES (recruiter <-> student, after shortlisting)
// ═══════════════════════════════════════════════════════════════════════════════
let _currentConversationId = null;

function renderMessages(view) {
    view.innerHTML = `
    <div>
        <p class="section-title">Messages</p>
        <div id="conversationsList"><p style="color:#8892A8;font-size:0.83rem;text-align:center;margin-top:2rem">Loading…</p></div>
    </div>`;
    loadConversations();
}

async function loadConversations() {
    try {
        const conversations = await (await fetch(`${API}/messages/conversations/${email}`)).json();
        const el = document.getElementById("conversationsList");
        if (!el) return;
        if (!conversations.length) {
            el.innerHTML = `<div class="card" style="text-align:center;padding:3rem 1rem">
                <i class="fas fa-comment-dots" style="font-size:2.5rem;color:#232C42;margin-bottom:1rem;display:block"></i>
                <p style="font-weight:700;color:#A8B3C7">No conversations yet.</p>
                <p style="color:#8892A8;font-size:0.83rem;margin-top:0.5rem">${role==="student"
                    ? "Once a recruiter shortlists you for a job, you can message them here."
                    : "Shortlist a student applicant to start a conversation with them."}</p>
            </div>`;
            return;
        }
        el.innerHTML = `<div style="display:flex;flex-direction:column;gap:0.6rem">` + conversations.map(c => `
            <div class="card" style="cursor:pointer;display:flex;align-items:center;gap:0.85rem" onclick="viewConversation('${c.id}')">
                <div style="width:42px;height:42px;border-radius:12px;background:rgba(56,189,248,0.14);color:#38BDF8;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1rem;flex-shrink:0">${c.otherParty[0].toUpperCase()}</div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
                        <p style="font-weight:700;color:#E7ECF5;font-size:0.87rem">${c.otherParty}</p>
                        <span class="tag" style="background:#1B2436;color:#A8B3C7">${c.jobTitle}${c.company?" · "+c.company:""}</span>
                    </div>
                    <p style="font-size:0.78rem;color:#8892A8;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.lastMessage ? escHtml(c.lastMessage) : "No messages yet — say hi!"}</p>
                </div>
                <i class="fas fa-chevron-right" style="color:#465067;font-size:0.8rem"></i>
            </div>`).join("") + `</div>`;
    } catch {
        const el = document.getElementById("conversationsList");
        if (el) el.innerHTML = `<p style="color:#ef4444;font-size:0.83rem">Could not load conversations.</p>`;
    }
}

async function viewConversation(id) {
    const view = document.getElementById("mainView");
    view.innerHTML = `<p style="color:#8892A8;text-align:center;margin-top:4rem">Loading…</p>`;
    let convo;
    try {
        convo = await (await fetch(`${API}/messages/${id}/${email}`)).json();
    } catch {
        view.innerHTML = `<p style="color:#ef4444;text-align:center;margin-top:4rem">Could not load conversation.</p>`;
        return;
    }
    if (convo.message) { toast(convo.message, true); loadModule("messages"); return; }

    _currentConversationId = id;
    document.getElementById("pageTitle").textContent = "Messages";
    socket.emit("joinConversation", { conversationId: id });

    view.innerHTML = `
    <div style="max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:1rem">
        <button class="btn-sm-outline" style="width:fit-content" onclick="loadModule('messages')"><i class="fas fa-arrow-left"></i> Back to Messages</button>

        <div class="card" style="display:flex;flex-direction:column;gap:0">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;border-bottom:1px solid #232C42;padding-bottom:1rem">
                <div style="width:40px;height:40px;border-radius:11px;background:rgba(56,189,248,0.14);color:#38BDF8;display:flex;align-items:center;justify-content:center;font-weight:800">${convo.otherParty[0].toUpperCase()}</div>
                <div>
                    <p style="font-weight:800;color:#E7ECF5;font-size:0.9rem">${convo.otherParty}</p>
                    <p style="font-size:0.72rem;color:#8892A8">${convo.jobTitle}${convo.company?" · "+convo.company:""} <span class="live-dot" style="margin-left:6px"></span></p>
                </div>
            </div>

            <div id="dmList" style="min-height:220px;max-height:400px;overflow-y:auto;margin-bottom:1rem;padding-right:4px">
                ${convo.messages.length ? convo.messages.map(m => {
                    const isSelf = m.author === email;
                    const time = new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return `<div class="msg-bubble ${isSelf?"self":""}">
                        <div class="msg-avatar ${isSelf?"self":""}">${(m.author[0]||"?").toUpperCase()}</div>
                        <div class="msg-body ${isSelf?"self":""}">
                            <div class="msg-meta ${isSelf?"self":""}"><span>${isSelf?"You":m.author.split("@")[0]}</span><span>${time}</span></div>
                            <div class="msg-bubble-text ${isSelf?"self":""}">${escHtml(m.text)}</div>
                        </div>
                    </div>`;
                }).join("") : `<p style="color:#8892A8;font-size:0.83rem;text-align:center;padding:2.5rem 0">No messages yet. Say hi! 👋</p>`}
            </div>

            <div style="display:flex;gap:0.65rem">
                <input id="dmInput" class="input-field" style="flex:1" placeholder="Write a message…" onkeydown="if(event.key==='Enter')sendDirectMsg('${id}')">
                <button class="btn btn-indigo" style="padding:0.6rem 1rem" onclick="sendDirectMsg('${id}')"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>`;

    const dl = document.getElementById("dmList");
    if (dl) dl.scrollTop = dl.scrollHeight;
}

function sendDirectMsg(id) {
    const input = document.getElementById("dmInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    socket.emit("sendDirectMessage", { conversationId: id, email, text });
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOB PORTAL
// ═══════════════════════════════════════════════════════════════════════════════
function renderJobs(view) {
    view.innerHTML=`
    <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.75rem">
            <p class="section-title" style="margin:0">All Jobs</p>
            ${role==="recruiter"?`<button class="btn btn-indigo" onclick="loadModule('postjob')"><i class="fas fa-plus"></i> Post Job</button>`:""}
        </div>
        <div class="card" style="margin-bottom:1rem;padding:0.85rem 1rem">
            <div style="display:flex;gap:0.6rem;flex-wrap:wrap;align-items:center">
                <input class="input-field" id="jobSearch" placeholder="Search title or company…" style="max-width:200px;flex:1;min-width:150px" oninput="applyJobFilters()">
                ${role==="student"?`
                <select class="input-field" id="jobMatchFilter" style="max-width:150px" onchange="applyJobFilters()">
                    <option value="0">Any match %</option>
                    <option value="70">70%+ match</option>
                    <option value="40">40%+ match</option>
                </select>`:""}
                <select class="input-field" id="jobTypeFilter" style="max-width:150px" onchange="applyJobFilters()">
                    <option value="">Any job type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                </select>
                <input class="input-field" id="jobLocationFilter" placeholder="Location…" style="max-width:150px" oninput="applyJobFilters()">
                <button class="btn-sm-outline" onclick="clearJobFilters()"><i class="fas fa-xmark"></i> Clear</button>
            </div>
        </div>
        <div id="jobsList"><p style="color:#8892A8;font-size:0.83rem;text-align:center;margin-top:2rem">Loading…</p></div>
    </div>`;
    loadJobs();
}

let _allJobs=[];
let _myProfileSkills=null; // cached so we don't refetch on every render

async function ensureMyProfileSkills() {
    if (role !== "student") return [];
    if (_myProfileSkills !== null) return _myProfileSkills;
    try {
        const data = await (await fetch(`${API}/profile/${email}`)).json();
        _myProfileSkills = data.skills?.[0]?.skill || [];
    } catch { _myProfileSkills = []; }
    return _myProfileSkills;
}

function computeMatchPercent(requiredSkills, userSkills) {
    if (!requiredSkills || !requiredSkills.length) return null; // no skills listed -> no badge
    const normalize = s => s.trim().toLowerCase();
    const userNorm = (userSkills || []).map(normalize);
    const matched = requiredSkills.filter(s => userNorm.includes(normalize(s)));
    return Math.round((matched.length / requiredSkills.length) * 100);
}

function matchBadgeStyle(pct) {
    if (pct >= 70) return "background:rgba(16,185,129,0.16);color:#34D399";
    if (pct >= 40) return "background:rgba(245,158,11,0.16);color:#FBBF24";
    return "background:rgba(239,68,68,0.16);color:#F87171";
}

async function loadJobs() {
    try {
        _allJobs = await (await fetch(`${API}/jobs/all`)).json();
        await ensureMyProfileSkills();
        renderJobsList(_allJobs);
    } catch { const el=document.getElementById("jobsList"); if(el) el.innerHTML=`<p style="color:#ef4444;font-size:0.83rem">Could not load jobs.</p>`; }
}

function applyJobFilters() {
    const q          = (document.getElementById("jobSearch")?.value || "").toLowerCase();
    const minMatch    = parseInt(document.getElementById("jobMatchFilter")?.value || "0");
    const jobType     = document.getElementById("jobTypeFilter")?.value || "";
    const locationQ   = (document.getElementById("jobLocationFilter")?.value || "").toLowerCase();

    const filtered = _allJobs.filter(j => {
        if (q && !j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q)) return false;
        if (jobType && j.jobType !== jobType) return false;
        if (locationQ && !(j.location || "").toLowerCase().includes(locationQ)) return false;
        if (role === "student" && minMatch > 0) {
            const pct = computeMatchPercent(j.requiredSkills, _myProfileSkills);
            if (pct === null || pct < minMatch) return false;
        }
        return true;
    });
    renderJobsList(filtered);
}

function clearJobFilters() {
    const s = document.getElementById("jobSearch"); if (s) s.value = "";
    const m = document.getElementById("jobMatchFilter"); if (m) m.value = "0";
    const t = document.getElementById("jobTypeFilter"); if (t) t.value = "";
    const l = document.getElementById("jobLocationFilter"); if (l) l.value = "";
    renderJobsList(_allJobs);
}

function renderJobsList(jobs) {
    const el=document.getElementById("jobsList");
    if(!jobs.length){el.innerHTML=`<p style="color:#8892A8;font-size:0.83rem;text-align:center;margin-top:2rem">No jobs match your filters.</p>`;return;}
    el.innerHTML=`<div style="display:flex;flex-direction:column;gap:0.75rem">`+jobs.map(j=>{
        const skills=j.requiredSkills||[], isOwn=j.postedBy===email;
        const matchPct = role==="student" ? computeMatchPercent(skills, _myProfileSkills) : null;
        return `<div class="card" style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
                <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:4px">
                    <p style="font-weight:800;color:#E7ECF5;font-size:0.9rem">${j.title}</p>
                    <span class="tag" style="background:#1B2436;color:#A8B3C7">${j.company}</span>
                    <span class="tag" style="background:rgba(251,191,36,0.14);color:#FBBF24"><i class="fas fa-location-dot" style="margin-right:3px"></i>${j.location||"Remote"}</span>
                    <span class="tag" style="background:rgba(124,168,255,0.14);color:#7CA8FF">${j.jobType||"Full-time"}</span>
                    ${j.applicantsCount?`<span class="tag" style="background:rgba(16,185,129,0.14);color:#34D399">${j.applicantsCount} applicant${j.applicantsCount!==1?"s":""}</span>`:""}
                    ${matchPct!==null?`<span class="tag" style="${matchBadgeStyle(matchPct)}"><i class="fas fa-bullseye" style="margin-right:3px"></i>${matchPct}% match</span>`:""}
                </div>
                <p style="font-size:0.72rem;color:#8892A8;margin-bottom:0.5rem">Posted by: ${j.postedBy}</p>
                <div style="display:flex;flex-wrap:wrap;gap:0.3rem">
                    ${skills.map(s=>`<span class="tag" style="background:rgba(59,130,246,0.14);color:#7CA8FF">${s}</span>`).join("")}
                </div>
            </div>
            <div style="display:flex;gap:0.4rem;flex-shrink:0;flex-wrap:wrap;align-items:center">
                ${role==="student"?`<button class="btn-sm-outline" onclick="checkJobGap('${j.id}','${j.title}')"><i class="fas fa-chart-bar"></i> Skill Gap</button>`:""}
                ${role==="student"&&!isOwn?`<button class="btn-sm-outline" onclick="generateCoverLetter('${j.id}','${j.title.replace(/'/g,"\\'")}',this)"><i class="fas fa-feather-pointed"></i> Cover Letter</button>`:""}
                ${role==="student"&&!isOwn?`<button class="btn btn-indigo" style="padding:0.38rem 0.85rem;font-size:0.75rem" onclick="applyJob('${j.id}')"><i class="fas fa-paper-plane"></i> Apply</button>`:""}
                ${isOwn?`<button class="btn-sm-outline" onclick="viewApplicants('${j.id}','${j.title}')"><i class="fas fa-users"></i> Applicants</button>
                   <button class="btn btn-red" style="padding:0.38rem 0.75rem;font-size:0.75rem" onclick="deleteJob('${j.id}')"><i class="fas fa-trash"></i></button>`:""}
            </div>
        </div>`;
    }).join("")+`</div>`;
}

async function applyJob(id) {
    try {
        const data = await (await fetch(`${API}/jobs/apply`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jobId:id,email})})).json();
        toast(data.message);
        if(data.message==="Applied successfully"){
            const applied=JSON.parse(localStorage.getItem("appliedJobs")||"[]");
            if(!applied.includes(id)){applied.push(id);localStorage.setItem("appliedJobs",JSON.stringify(applied));}
        }
        loadJobs();
    } catch { toast("Could not apply",true); }
}

async function deleteJob(id) {
    if(!confirm("Delete this job?")) return;
    const data = await (await fetch(`${API}/jobs/delete/${id}/${email}`,{method:"DELETE"})).json();
    toast(data.message); loadJobs();
}

async function checkJobGap(id, title) {
    const data = await (await fetch(`${API}/jobs/skill-gap/${email}/${id}`)).json();
    if(data.message){toast(data.message,true);return;}
    showGapModal(title,data.required,data.missing,data.userSkills);
}

async function generateCoverLetter(jobId, jobTitle, btnEl) {
    const originalHTML = btnEl.innerHTML;
    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Writing…';

    try {
        const data = await (await fetch(`${API}/cover-letter/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,jobId})})).json();
        if (data.message !== "ok") {
            toast(data.message || "Could not generate cover letter", true);
        } else {
            showCoverLetterModal(jobTitle, data.letter);
        }
    } catch {
        toast("Could not reach the server", true);
    }

    btnEl.disabled = false;
    btnEl.innerHTML = originalHTML;
}

function showCoverLetterModal(jobTitle, letterText) {
    const modal = document.createElement("div");
    modal.id = "coverLetterModal";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem";
    modal.innerHTML = `
    <div style="background:#131A2A;border:1px solid #232C42;border-radius:20px;padding:1.75rem;max-width:560px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.5);max-height:85vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h3 style="font-size:1rem;font-weight:800;color:#E7ECF5"><i class="fas fa-feather-pointed" style="color:#38BDF8;margin-right:8px"></i>Cover Letter — ${jobTitle}</h3>
            <button onclick="document.getElementById('coverLetterModal').remove()" style="color:#8892A8;font-size:1.3rem;background:none;border:none;cursor:pointer;line-height:1">×</button>
        </div>
        <textarea id="coverLetterText" style="width:100%;min-height:320px;background:#1B2436;border:1px solid #232C42;border-radius:12px;padding:1rem;color:#E7ECF5;font-size:0.85rem;line-height:1.65;font-family:Inter,sans-serif;resize:vertical">${letterText}</textarea>
        <p style="font-size:0.7rem;color:#8892A8;margin-top:0.5rem"><i class="fas fa-circle-info" style="margin-right:4px"></i>AI-generated from your profile — review and edit before sending.</p>
        <div style="display:flex;gap:0.6rem;margin-top:1rem">
            <button class="btn btn-indigo" style="flex:1;justify-content:center" onclick="copyCoverLetter()"><i class="fas fa-copy"></i> Copy to Clipboard</button>
            <button onclick="document.getElementById('coverLetterModal').remove()" style="background:#1B2436;border:1px solid #232C42;color:#E7ECF5;padding:0.6rem 1.2rem;border-radius:10px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif">Close</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
}

function copyCoverLetter() {
    const textarea = document.getElementById("coverLetterText");
    textarea.select();
    navigator.clipboard.writeText(textarea.value)
        .then(() => toast("Copied to clipboard!"))
        .catch(() => toast("Could not copy — select and copy manually", true));
}

async function viewApplicants(jobId, jobTitle) {
    const data = await (await fetch(`${API}/jobs/applicants/${jobId}/${email}`)).json();
    if(data.message){toast(data.message,true);return;}
    _currentApplicants = data; // cache full list so the filter dropdown doesn't re-fetch
    showApplicantsModal(jobId,jobTitle,data);
}

let _currentApplicants = [];

const STATUS_STYLES = {
    Applied:     "background:rgba(59,130,246,0.16);color:#7CA8FF",
    Reviewed:    "background:rgba(245,158,11,0.16);color:#FBBF24",
    Shortlisted: "background:rgba(56,189,248,0.16);color:#7DD3FC",
    Offered:     "background:rgba(16,185,129,0.16);color:#34D399",
    Rejected:    "background:rgba(239,68,68,0.16);color:#F87171"
};
const STATUS_OPTIONS = ["Applied","Reviewed","Shortlisted","Rejected","Offered"];

function showApplicantsModal(jobId, title, applicants) {
    const modal=document.createElement("div");
    modal.id="applicantsModal";
    modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem";
    modal.innerHTML=`
    <div style="background:#131A2A;border:1px solid #232C42;border-radius:20px;padding:1.75rem;max-width:480px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.5);max-height:80vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h3 style="font-size:1rem;font-weight:800;color:#E7ECF5"><i class="fas fa-users" style="color:#38BDF8;margin-right:8px"></i>Applicants: ${title}</h3>
            <button onclick="document.getElementById('applicantsModal').remove()" style="color:#8892A8;font-size:1.3rem;background:none;border:none;cursor:pointer;line-height:1">×</button>
        </div>
        ${_currentApplicants.some(a=>a.matchScore!==null&&a.matchScore!==undefined)?`
        <select class="input-field" style="margin-bottom:1rem;font-size:0.78rem" onchange="filterApplicantsByMatch('${jobId}','${title.replace(/'/g,"\\'")}',this.value)">
            <option value="0">Show all applicants</option>
            <option value="70">70%+ match only</option>
            <option value="40">40%+ match only</option>
        </select>`:""}
        <div id="applicantsListInner">
        ${!applicants.length?`<p style="color:#8892A8;text-align:center;padding:2rem 0">No applicants match this filter.</p>`
            :applicants.map(a=>{
                const st = a.status || "Applied";
                const mp = a.matchScore;
                return `
            <div style="display:flex;align-items:center;gap:0.7rem;padding:0.75rem;border-radius:12px;background:#1B2436;border:1px solid #232C42;margin-bottom:0.5rem;flex-wrap:wrap">
                <div style="width:38px;height:38px;border-radius:11px;background:rgba(56,189,248,0.14);color:#38BDF8;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;flex-shrink:0">${a.email[0].toUpperCase()}</div>
                <div style="flex:1;min-width:120px">
                    <p style="font-weight:700;color:#E7ECF5;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.email}</p>
                    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:2px">
                        <span class="tag" style="${STATUS_STYLES[st]}">${st}</span>
                        ${mp!==null&&mp!==undefined?`<span class="tag" style="${matchBadgeStyle(mp)}"><i class="fas fa-bullseye" style="margin-right:2px"></i>${mp}%</span>`:""}
                    </div>
                </div>
                <select class="input-field" style="width:auto;padding:0.4rem 0.6rem;font-size:0.75rem" onchange="updateApplicantStatus('${jobId}','${a.email}',this.value,'${title.replace(/'/g,"\\'")}')">
                    ${STATUS_OPTIONS.map(opt=>`<option value="${opt}" ${opt===st?"selected":""}>${opt}</option>`).join("")}
                </select>
                <a href="mailto:${a.email}" style="padding:0.35rem 0.6rem;border-radius:8px;font-size:0.72rem;font-weight:700;background:linear-gradient(135deg,#38BDF8,#7DD3FC);color:#041016;text-decoration:none;white-space:nowrap"><i class="fas fa-envelope"></i></a>
            </div>`;}).join("")}
        </div>
        <p style="color:#8892A8;font-size:0.72rem;text-align:center;margin-top:0.75rem">${applicants.length} of ${_currentApplicants.length} applicant${_currentApplicants.length!==1?"s":""} shown</p>
        <button onclick="document.getElementById('applicantsModal').remove()" style="width:100%;margin-top:1rem;background:#1B2436;border:1px solid #232C42;color:#E7ECF5;padding:0.7rem;border-radius:12px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif">Close</button>
    </div>`;
    document.body.appendChild(modal);
}

function filterApplicantsByMatch(jobId, title, minMatch) {
    const min = parseInt(minMatch);
    const filtered = min > 0
        ? _currentApplicants.filter(a => a.matchScore !== null && a.matchScore !== undefined && a.matchScore >= min)
        : _currentApplicants;
    document.getElementById("applicantsModal")?.remove();
    showApplicantsModal(jobId, title, filtered);
}

async function updateApplicantStatus(jobId, studentEmail, newStatus, jobTitle) {
    try {
        const data = await (await fetch(`${API}/jobs/applicants/status`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jobId,recruiterEmail:email,studentEmail,status:newStatus})})).json();
        if(data.message==="Status updated"){
            toast(`${studentEmail.split("@")[0]} → ${newStatus}`);
            // refresh the modal in place so the badge updates immediately
            const refreshed = await (await fetch(`${API}/jobs/applicants/${jobId}/${email}`)).json();
            _currentApplicants = refreshed; // keep cache in sync so the match-filter dropdown stays accurate
            document.getElementById("applicantsModal")?.remove();
            showApplicantsModal(jobId, jobTitle, refreshed);
        } else {
            toast(data.message||"Could not update status", true);
        }
    } catch { toast("Could not update status", true); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST JOB
// ═══════════════════════════════════════════════════════════════════════════════
function renderPostJob(view) {
    view.innerHTML=`
    <div style="max-width:580px;margin:0 auto">
        <div class="card">
            <p class="section-title"><i class="fas fa-plus-circle" style="color:#7DD3FC;margin-right:6px"></i>Post a New Job</p>
            <div style="display:flex;flex-direction:column;gap:0.85rem">
                <input class="input-field" id="jobTitle" placeholder="Job Title *" required>
                <input class="input-field" id="jobCompany" placeholder="Company Name *" value="${company}" required>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
                    <input class="input-field" id="jobLocation" placeholder="Location (e.g. Bangalore, Remote)">
                    <select class="input-field" id="jobType">
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                    </select>
                </div>
                <input class="input-field" id="jobSkills" placeholder="Required Skills (comma-separated, e.g. React, Node, Python)">
                <p style="font-size:0.75rem;color:#8892A8;font-style:italic"><i class="fas fa-info-circle" style="margin-right:4px"></i>Students can check their skill gap against this listing.</p>
                <button class="btn btn-indigo" style="padding:0.75rem;justify-content:center;font-size:0.88rem" onclick="postJob()">
                    <i class="fas fa-paper-plane"></i> Post Job
                </button>
            </div>
        </div>
    </div>`;
    const jobSkillsEl = document.getElementById("jobSkills");
    if (jobSkillsEl) attachMultiSkillAutocomplete(jobSkillsEl);
}

async function postJob() {
    const title=document.getElementById("jobTitle").value.trim(), comp=document.getElementById("jobCompany").value.trim();
    const location=document.getElementById("jobLocation").value.trim() || "Remote";
    const jobType=document.getElementById("jobType").value;
    const skills=document.getElementById("jobSkills").value.split(",").map(s=>s.trim()).filter(Boolean);
    if(!title||!comp){toast("Title and company are required",true);return;}
    const data=await (await fetch(`${API}/jobs/post`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,company:comp,email,skills,location,jobType})})).json();
    toast(data.message);
    if(data.message==="Job posted successfully") loadModule("myjobs");
}

// ═══════════════════════════════════════════════════════════════════════════════
// MY POSTED JOBS
// ═══════════════════════════════════════════════════════════════════════════════
function renderMyJobs(view) {
    view.innerHTML=`
    <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.1rem">
            <p class="section-title" style="margin:0">My Posted Jobs</p>
            <button class="btn btn-indigo" onclick="loadModule('postjob')"><i class="fas fa-plus"></i> Post New</button>
        </div>
        <div id="myJobsList"><p style="color:#8892A8;font-size:0.83rem;text-align:center;margin-top:2rem">Loading…</p></div>
    </div>`;
    fetch(`${API}/jobs/my-jobs/${email}`).then(r=>r.json()).then(jobs=>{
        const el=document.getElementById("myJobsList");
        if(!el) return;
        if(!jobs.length){el.innerHTML=`<p style="color:#8892A8;font-size:0.83rem;text-align:center;margin-top:2rem">You haven't posted any jobs yet.</p>`;return;}
        el.innerHTML=`<div style="display:flex;flex-direction:column;gap:0.75rem">`+jobs.map(j=>{
            const id=j.id||"", title=j.title||"", comp=j.company||"";
            const skills=j.requiredSkills||[], appCount=j.applicantsCount||0;
            return `<div class="card" style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
                <div style="flex:1;min-width:180px">
                    <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:4px">
                        <p style="font-weight:800;color:#E7ECF5;font-size:0.9rem">${title}</p>
                        <span class="tag" style="background:#1B2436;color:#A8B3C7">${comp}</span>
                        <span class="tag" style="${appCount>0?"background:rgba(16,185,129,0.14);color:#34D399":"background:#1B2436;color:#8892A8"}">${appCount} applicant${appCount!==1?"s":""}</span>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.5rem">
                        ${skills.map(s=>`<span class="tag" style="background:rgba(59,130,246,0.14);color:#7CA8FF">${s}</span>`).join("")}
                    </div>
                </div>
                <div style="display:flex;gap:0.4rem;flex-shrink:0">
                    <button class="btn-sm-outline" onclick="viewApplicants('${id}','${title}')"><i class="fas fa-users"></i> Applicants</button>
                    <button class="btn btn-red" style="padding:0.38rem 0.75rem;font-size:0.75rem" onclick="deleteMyJob('${id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }).join("")+`</div>`;
    }).catch(()=>{const el=document.getElementById("myJobsList");if(el)el.innerHTML=`<p style="color:#ef4444;font-size:0.83rem">Could not load.</p>`;});
}

async function deleteMyJob(id) {
    if(!confirm("Delete this job?")) return;
    const data=await (await fetch(`${API}/jobs/delete/${id}/${email}`,{method:"DELETE"})).json();
    toast(data.message);
    renderMyJobs(document.getElementById("mainView"));
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECRUITER ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
let _statusChartInstance = null;
let _perJobChartInstance = null;

function renderAnalytics(view) {
    if (role !== "recruiter") { view.innerHTML = `<p style="color:#8892A8;text-align:center;margin-top:4rem">This section is for recruiters.</p>`; return; }
    view.innerHTML = `<p style="color:#8892A8;text-align:center;margin-top:4rem">Loading analytics…</p>`;
    loadAnalytics();
}

async function loadAnalytics() {
    const view = document.getElementById("mainView");
    let data;
    try {
        data = await (await fetch(`${API}/jobs/analytics/${email}`)).json();
    } catch {
        view.innerHTML = `<p style="color:#ef4444;text-align:center;margin-top:4rem">Could not load analytics.</p>`;
        return;
    }

    if (!data.totalJobs) {
        view.innerHTML = `<div class="card" style="text-align:center;padding:3rem 1rem">
            <i class="fas fa-chart-line" style="font-size:2.5rem;color:#232C42;margin-bottom:1rem;display:block"></i>
            <p style="font-weight:700;color:#A8B3C7">No data yet.</p>
            <p style="color:#8892A8;font-size:0.83rem;margin-top:0.5rem">Post a job to start collecting analytics.</p>
        </div>`;
        return;
    }

    view.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- Overview cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">
            <div class="card" style="text-align:center">
                <p style="font-size:1.6rem;font-weight:800;color:#38BDF8">${data.totalJobs}</p>
                <p style="font-size:0.72rem;color:#8892A8;margin-top:2px">Jobs Posted</p>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:1.6rem;font-weight:800;color:#34D399">${data.totalApplicants}</p>
                <p style="font-size:0.72rem;color:#8892A8;margin-top:2px">Total Applicants</p>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:1.6rem;font-weight:800;color:#7CA8FF">${data.totalGapChecks}</p>
                <p style="font-size:0.72rem;color:#8892A8;margin-top:2px">Skill Gap Checks</p>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:1.6rem;font-weight:800;color:#FBBF24">${data.overallAvgMatch!==null?data.overallAvgMatch+"%":"—"}</p>
                <p style="font-size:0.72rem;color:#8892A8;margin-top:2px">Avg Applicant Match</p>
            </div>
        </div>

        <!-- Charts -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
            <div class="card">
                <p class="section-title">Applicant Status Breakdown</p>
                <div style="max-width:260px;margin:0 auto"><canvas id="statusChart"></canvas></div>
            </div>
            <div class="card">
                <p class="section-title">Applicants per Job</p>
                <canvas id="perJobChart" height="180"></canvas>
            </div>
        </div>

        <!-- Per-job table -->
        <div class="card">
            <p class="section-title">Job Performance</p>
            <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
                <thead>
                    <tr style="border-bottom:1px solid #232C42;text-align:left">
                        <th style="padding:0.5rem;color:#8892A8;font-weight:600">Job</th>
                        <th style="padding:0.5rem;color:#8892A8;font-weight:600">Applicants</th>
                        <th style="padding:0.5rem;color:#8892A8;font-weight:600">Gap Checks</th>
                        <th style="padding:0.5rem;color:#8892A8;font-weight:600">Avg Match</th>
                        <th style="padding:0.5rem;color:#8892A8;font-weight:600">Conversion</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.perJob.map(j => `
                    <tr style="border-bottom:1px solid #1B2436">
                        <td style="padding:0.6rem 0.5rem;color:#E7ECF5;font-weight:600">${j.title}<br><span style="color:#8892A8;font-weight:400;font-size:0.72rem">${j.company}</span></td>
                        <td style="padding:0.6rem 0.5rem;color:#A8B3C7">${j.applicantsCount}</td>
                        <td style="padding:0.6rem 0.5rem;color:#A8B3C7">${j.skillGapChecks}</td>
                        <td style="padding:0.6rem 0.5rem;color:#A8B3C7">${j.avgMatchScore!==null?j.avgMatchScore+"%":"—"}</td>
                        <td style="padding:0.6rem 0.5rem;color:#A8B3C7">${j.conversionRate!==null?j.conversionRate+"%":"—"}</td>
                    </tr>`).join("")}
                </tbody>
            </table>
            </div>
        </div>
    </div>`;

    renderAnalyticsCharts(data);
}

function renderAnalyticsCharts(data) {
    // Destroy previous chart instances before redrawing — Chart.js throws if
    // you create a new chart on a canvas that already has one attached.
    if (_statusChartInstance) { _statusChartInstance.destroy(); _statusChartInstance = null; }
    if (_perJobChartInstance) { _perJobChartInstance.destroy(); _perJobChartInstance = null; }

    const statusCtx = document.getElementById("statusChart");
    if (statusCtx) {
        const labels = Object.keys(data.statusBreakdown).filter(k => data.statusBreakdown[k] > 0);
        const values = labels.map(k => data.statusBreakdown[k]);
        const colorMap = { Applied:"#3B82F6", Reviewed:"#F59E0B", Shortlisted:"#38BDF8", Offered:"#10B981", Rejected:"#EF4444" };

        _statusChartInstance = new Chart(statusCtx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{ data: values, backgroundColor: labels.map(l => colorMap[l]), borderColor: "#131A2A", borderWidth: 2 }]
            },
            options: {
                plugins: { legend: { position: "bottom", labels: { color: "#A8B3C7", font: { size: 11 }, padding: 12 } } }
            }
        });
    }

    const perJobCtx = document.getElementById("perJobChart");
    if (perJobCtx) {
        _perJobChartInstance = new Chart(perJobCtx, {
            type: "bar",
            data: {
                labels: data.perJob.map(j => j.title.length > 14 ? j.title.slice(0, 14) + "…" : j.title),
                datasets: [{ label: "Applicants", data: data.perJob.map(j => j.applicantsCount), backgroundColor: "#38BDF8", borderRadius: 6 }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: "#8892A8", font: { size: 10 } }, grid: { color: "#1B2436" } },
                    y: { ticks: { color: "#8892A8", stepSize: 1 }, grid: { color: "#1B2436" }, beginAtZero: true }
                }
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MY APPLICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function renderMyApplications(view) {
    view.innerHTML=`
    <div>
        <p class="section-title">My Applications</p>
        <div id="myAppsList"><p style="color:#8892A8;font-size:0.83rem;text-align:center;margin-top:2rem">Loading…</p></div>
    </div>`;
    fetch(`${API}/jobs/my-applications/${email}`).then(r=>r.json()).then(appliedJobs=>{
        const el=document.getElementById("myAppsList");
        if(!el) return;
        if(!appliedJobs.length){
            el.innerHTML=`<div class="card" style="text-align:center;padding:3rem 1rem">
                <i class="fas fa-paper-plane" style="font-size:2.5rem;color:#232C42;margin-bottom:1rem;display:block"></i>
                <p style="font-weight:700;color:#A8B3C7">No applications yet.</p>
                <p style="color:#8892A8;font-size:0.83rem;margin:0.5rem 0 1.25rem">Browse jobs and hit Apply to get started.</p>
                <button class="btn btn-indigo" onclick="loadModule('jobs')">Browse Jobs</button>
            </div>`;
            return;
        }
        el.innerHTML=`<div style="display:flex;flex-direction:column;gap:0.75rem">`+appliedJobs.map(j=>{
            const st = j.myStatus || "Applied";
            const statusIcon = { Applied:"fa-check", Reviewed:"fa-eye", Shortlisted:"fa-star", Offered:"fa-trophy", Rejected:"fa-xmark" }[st] || "fa-check";
            return `
            <div class="card" style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
                <div style="flex:1;min-width:180px">
                    <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:4px">
                        <p style="font-weight:800;color:#E7ECF5;font-size:0.9rem">${j.title}</p>
                        <span class="tag" style="background:#1B2436;color:#A8B3C7">${j.company}</span>
                        <span class="tag" style="${STATUS_STYLES[st]}"><i class="fas ${statusIcon}" style="margin-right:3px"></i>${st}</span>
                    </div>
                    <p style="font-size:0.72rem;color:#8892A8;margin-bottom:0.5rem">Posted by: ${j.postedBy}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:0.3rem">
                        ${(j.requiredSkills||[]).map(s=>`<span class="tag" style="background:rgba(59,130,246,0.14);color:#7CA8FF">${s}</span>`).join("")}
                    </div>
                </div>
                <div style="display:flex;gap:0.4rem;flex-shrink:0;flex-wrap:wrap">
                    <button class="btn-sm-outline" onclick="checkJobGap('${j.id}','${j.title}')"><i class="fas fa-chart-bar"></i> Skill Gap</button>
                    <button class="btn-sm-outline" onclick="generateCoverLetter('${j.id}','${j.title.replace(/'/g,"\\'")}',this)"><i class="fas fa-feather-pointed"></i> Cover Letter</button>
                    <a href="mailto:${j.postedBy}" class="btn btn-slate" style="padding:0.38rem 0.85rem;font-size:0.75rem;text-decoration:none;display:inline-flex;align-items:center;gap:4px"><i class="fas fa-envelope"></i>Contact</a>
                </div>
            </div>`;
        }).join("")+`</div>`;
    }).catch(()=>{const el=document.getElementById("myAppsList");if(el)el.innerHTML=`<p style="color:#ef4444;font-size:0.83rem">Could not load.</p>`;});
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT PROFILES (recruiter)
// ═══════════════════════════════════════════════════════════════════════════════
function renderStudentProfiles(view) {
    view.innerHTML=`
    <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.1rem;flex-wrap:wrap;gap:0.75rem">
            <p class="section-title" style="margin:0">Student Profiles</p>
            <input class="input-field" id="profileSearch" placeholder="Search by skill or name…" style="max-width:220px" oninput="searchProfiles(this.value)">
        </div>
        <div id="profilesGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem">
            <p style="color:#8892A8;text-align:center;margin-top:3rem;grid-column:1/-1">Loading profiles…</p>
        </div>
    </div>`;
    loadAllProfiles();
}

let _allProfiles=[];
async function loadAllProfiles() {
    try { _allProfiles=await (await fetch(`${API}/profiles`)).json(); renderProfilesGrid(_allProfiles); }
    catch { const g=document.getElementById("profilesGrid"); if(g) g.innerHTML=`<p style="color:#ef4444;text-align:center;margin-top:3rem;grid-column:1/-1">Could not load.</p>`; }
}
function searchProfiles(q) {
    if(!q){renderProfilesGrid(_allProfiles);return;}
    renderProfilesGrid(_allProfiles.filter(p=>{
        const skills=p.skills?.[0]?.skill||[];
        return skills.some(s=>s.toLowerCase().includes(q.toLowerCase()))||(p.name?.[0]||"").toLowerCase().includes(q.toLowerCase());
    }));
}
function renderProfilesGrid(profiles) {
    const grid=document.getElementById("profilesGrid");
    if(!profiles.length){grid.innerHTML=`<p style="color:#8892A8;text-align:center;margin-top:3rem;grid-column:1/-1">No profiles found.</p>`;return;}
    grid.innerHTML=profiles.map(p=>{
        const skills=p.skills?.[0]?.skill||[], name=p.name?.[0]||"Unknown", pEmail=p.email?.[0]||"", prog=p.program?.[0]||"";
        const endorsements = p.endorsements || [];
        const isOwnCard = pEmail === email;
        const canEndorse = role === "student" && !isOwnCard;

        const skillChip = (s) => {
            const entry = endorsements.find(e => e.skill === s);
            const count = entry?.endorsers?.length || 0;
            const iEndorsed = entry?.endorsers?.includes(email) || false;
            if (!canEndorse) {
                return `<span class="tag" style="background:rgba(59,130,246,0.14);color:#7CA8FF">${s}${count?` · ${count}`:""}</span>`;
            }
            return `<button onclick="toggleEndorse('${pEmail}','${s.replace(/'/g,"\\'")}',this)"
                style="display:inline-flex;align-items:center;gap:4px;background:${iEndorsed?"rgba(56,189,248,0.18)":"rgba(59,130,246,0.14)"};color:${iEndorsed?"#7DD3FC":"#7CA8FF"};border:1px solid ${iEndorsed?"rgba(56,189,248,0.4)":"transparent"};padding:0.18rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:700;font-family:'JetBrains Mono',monospace;cursor:pointer">
                <i class="fas ${iEndorsed?"fa-check-circle":"fa-plus-circle"}" style="font-size:9px"></i>${s}${count?` · ${count}`:""}
            </button>`;
        };

        return `<div class="card">
            <div style="display:flex;align-items:center;gap:0.85rem;margin-bottom:0.85rem">
                <div style="width:44px;height:44px;background:linear-gradient(135deg,rgba(59,130,246,0.14),rgba(59,130,246,0.14));color:#7CA8FF;border-radius:13px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;flex-shrink:0">${name[0].toUpperCase()}</div>
                <div style="min-width:0">
                    <p style="font-weight:800;color:#E7ECF5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}${isOwnCard?` <span style="color:#8892A8;font-weight:500;font-size:0.72rem">(you)</span>`:""}</p>
                    <p style="font-size:0.72rem;color:#8892A8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pEmail}</p>
                    ${prog?`<p style="font-size:0.72rem;color:#7C879C">${prog}</p>`:""}
                </div>
            </div>
            ${p.bio?.[0]?`<p style="font-size:0.77rem;color:#A8B3C7;margin-bottom:0.75rem;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${p.bio[0]}</p>`:""}
            <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.85rem">
                ${skills.map(skillChip).join("")}
                ${!skills.length?`<span style="font-size:0.75rem;color:#8892A8">No skills listed</span>`:""}
            </div>
            <div style="display:flex;gap:0.4rem;border-top:1px solid #1B2436;padding-top:0.75rem;flex-wrap:wrap">
                ${p.github?.[0]?`<a href="${p.github[0]}" target="_blank" class="btn-sm-outline"><i class="fab fa-github"></i> GitHub</a>`:""}
                ${p.linkedin?.[0]?`<a href="${p.linkedin[0]}" target="_blank" class="btn-sm-outline"><i class="fab fa-linkedin"></i> LinkedIn</a>`:""}
                <a href="mailto:${pEmail}" style="padding:0.38rem 0.8rem;border-radius:8px;font-size:0.72rem;font-weight:700;background:linear-gradient(135deg,#38BDF8,#7DD3FC);color:#041016;text-decoration:none;display:inline-flex;align-items:center;gap:4px;margin-left:auto"><i class="fas fa-envelope"></i> Contact</a>
            </div>
        </div>`;
    }).join("");
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL GAP MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function showGapModal(title, required, missing, userSkills) {
    const have  = (required||[]).filter(s=>!(missing||[]).includes(s));
    const pct   = required?.length ? Math.round((have.length/required.length)*100) : 100;
    const color = pct>=70?"#10b981":pct>=40?"#f59e0b":"#ef4444";
    const bg    = pct>=70?"rgba(16,185,129,0.14)":pct>=40?"rgba(245,158,11,0.14)":"rgba(239,68,68,0.12)";

    const modal=document.createElement("div");
    modal.id="gapModal";
    modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem";
    modal.innerHTML=`
    <div style="background:#131A2A;border:1px solid #232C42;border-radius:22px;padding:2rem;max-width:440px;width:100%;box-shadow:0 30px 70px rgba(0,0,0,0.5)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
            <h3 style="font-size:1rem;font-weight:800;color:#E7ECF5;letter-spacing:-0.02em">Skill Gap: ${title}</h3>
            <button onclick="document.getElementById('gapModal').remove()" style="color:#8892A8;font-size:1.3rem;background:none;border:none;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="text-align:center;margin-bottom:1.5rem">
            <div style="width:88px;height:88px;border-radius:50%;border:6px solid ${color};background:${bg};display:inline-flex;align-items:center;justify-content:center;flex-direction:column">
                <span style="font-size:1.4rem;font-weight:900;color:${color};line-height:1">${pct}%</span>
                <span style="font-size:0.6rem;color:${color};font-weight:600;letter-spacing:0.05em">MATCH</span>
            </div>
        </div>
        ${(missing||[]).length?`
        <div style="margin-bottom:1rem">
            <p style="font-size:0.65rem;font-weight:700;color:#F87171;text-transform:uppercase;letter-spacing:.07em;margin-bottom:0.5rem">Missing (${missing.length}) — click to learn</p>
            <div style="display:flex;flex-direction:column;gap:0.4rem">
                ${missing.map(s=>{
                    const res = getSkillResource(s);
                    return `<a href="${res.url}" target="_blank" style="display:flex;align-items:center;justify-content:space-between;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);padding:0.45rem 0.7rem;border-radius:10px;text-decoration:none">
                        <span style="color:#F87171;font-size:0.78rem;font-weight:700">${s}</span>
                        <span style="color:#F87171;font-size:0.68rem;font-weight:600;opacity:0.85;display:flex;align-items:center;gap:4px"><i class="fas fa-graduation-cap"></i>${res.label}</span>
                    </a>`;
                }).join("")}
            </div>
        </div>`:""}
        ${have.length?`
        <div style="margin-bottom:0.5rem">
            <p style="font-size:0.65rem;font-weight:700;color:#34D399;text-transform:uppercase;letter-spacing:.07em;margin-bottom:0.5rem">You Have (${have.length})</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.35rem">
                ${have.map(s=>`<span style="background:rgba(16,185,129,0.14);color:#34D399;padding:0.2rem 0.65rem;border-radius:9999px;font-size:0.75rem;font-weight:700">${s}</span>`).join("")}
            </div>
        </div>`:""}
        ${!required?.length?`<p style="color:#8892A8;text-align:center;font-size:0.85rem">No specific skills listed.</p>`:""}
        <button onclick="document.getElementById('gapModal').remove()" style="width:100%;margin-top:1.5rem;background:linear-gradient(135deg,#38BDF8,#7DD3FC);color:#041016;padding:0.75rem;border-radius:12px;font-weight:700;border:none;cursor:pointer;font-family:Inter,sans-serif;font-size:0.88rem">
            Close
        </button>
    </div>`;
    document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL AUTOCOMPLETE
// ═══════════════════════════════════════════════════════════════════════════════
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
    "Android Development","iOS Development","Flutter","Socket.IO","WebSockets","GraphQL",
    "Microservices","System Design","OOP","DSA","Algorithms","Operating Systems",
    "Computer Networks","DBMS","Blockchain","Solidity","Web3","Cybersecurity","Penetration Testing",
    "UI/UX Design","Figma","Adobe XD","Photoshop","Product Management","Agile","Scrum",
    "Unit Testing","Jest","Cypress","Selenium","Postman","GraphQL","Webpack","Vite",
    "Three.js","D3.js","Chart.js","Prisma","Sequelize","Mongoose","Apache Kafka","RabbitMQ",
    "Elasticsearch","Machine Learning Ops","Data Structures","Cloud Computing","Serverless"
];

// ── Learning resource suggestions ──────────────────────────────────────────────
// Curated, well-known free resources for the most common skills. Anything not
// listed here falls back to a generated YouTube search link — so every skill
// always has a "Learn" link, never a dead end.
const SKILL_RESOURCES = {
    "react":                { label: "React Docs",        url: "https://react.dev/learn" },
    "react native":         { label: "React Native Docs", url: "https://reactnative.dev/docs/getting-started" },
    "angular":              { label: "Angular Docs",       url: "https://angular.dev/tutorials" },
    "vue.js":                { label: "Vue.js Guide",       url: "https://vuejs.org/guide/introduction.html" },
    "next.js":               { label: "Next.js Learn",      url: "https://nextjs.org/learn" },
    "svelte":               { label: "Svelte Tutorial",    url: "https://svelte.dev/tutorial" },
    "html":                 { label: "MDN HTML Guide",     url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
    "css":                  { label: "MDN CSS Guide",      url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
    "tailwind css":         { label: "Tailwind Docs",      url: "https://tailwindcss.com/docs" },
    "bootstrap":            { label: "Bootstrap Docs",     url: "https://getbootstrap.com/docs" },
    "javascript":           { label: "freeCodeCamp JS",    url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/" },
    "typescript":           { label: "TypeScript Handbook",url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
    "jquery":               { label: "jQuery Learning",    url: "https://learn.jquery.com/" },
    "redux":                { label: "Redux Essentials",   url: "https://redux.js.org/tutorials/essentials/part-1-overview-concepts" },
    "node.js":               { label: "Node.js Docs",       url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs" },
    "express.js":            { label: "Express Guide",      url: "https://expressjs.com/en/starter/installing.html" },
    "django":               { label: "Django Tutorial",    url: "https://docs.djangoproject.com/en/stable/intro/tutorial01/" },
    "flask":                { label: "Flask Quickstart",   url: "https://flask.palletsprojects.com/en/latest/quickstart/" },
    "fastapi":              { label: "FastAPI Tutorial",   url: "https://fastapi.tiangolo.com/tutorial/" },
    "spring boot":          { label: "Spring Boot Guides", url: "https://spring.io/guides" },
    "php":                  { label: "PHP Manual",         url: "https://www.php.net/manual/en/getting-started.php" },
    "laravel":              { label: "Laravel Docs",       url: "https://laravel.com/docs" },
    "python":               { label: "Python Official Tutorial", url: "https://docs.python.org/3/tutorial/" },
    "java":                 { label: "Oracle Java Tutorials", url: "https://docs.oracle.com/javase/tutorial/" },
    "c":                    { label: "Learn-C.org",        url: "https://www.learn-c.org/" },
    "c++":                  { label: "LearnCpp.com",       url: "https://www.learncpp.com/" },
    "c#":                   { label: "Microsoft C# Docs",  url: "https://learn.microsoft.com/en-us/dotnet/csharp/" },
    "go":                   { label: "Tour of Go",         url: "https://go.dev/tour/welcome/1" },
    "rust":                 { label: "The Rust Book",      url: "https://doc.rust-lang.org/book/" },
    "kotlin":               { label: "Kotlin Docs",        url: "https://kotlinlang.org/docs/getting-started.html" },
    "swift":                { label: "Swift.org Guide",    url: "https://www.swift.org/getting-started/" },
    "mysql":                { label: "MySQL Tutorial",     url: "https://dev.mysql.com/doc/mysql-tutorial-excerpt/en/" },
    "postgresql":           { label: "PostgreSQL Tutorial",url: "https://www.postgresqltutorial.com/" },
    "mongodb":              { label: "MongoDB University", url: "https://learn.mongodb.com/" },
    "redis":                { label: "Redis Docs",         url: "https://redis.io/docs/latest/develop/" },
    "firebase":             { label: "Firebase Docs",      url: "https://firebase.google.com/docs" },
    "graphql":              { label: "GraphQL Docs",       url: "https://graphql.org/learn/" },
    "rest api":             { label: "REST API Tutorial",  url: "https://restfulapi.net/" },
    "docker":               { label: "Docker Get Started", url: "https://docs.docker.com/get-started/" },
    "kubernetes":           { label: "Kubernetes Basics",  url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/" },
    "aws":                  { label: "AWS Free Training",  url: "https://aws.amazon.com/training/digital/" },
    "azure":                { label: "Microsoft Learn Azure", url: "https://learn.microsoft.com/en-us/training/azure/" },
    "google cloud platform":{ label: "Google Cloud Skills Boost", url: "https://www.cloudskillsboost.google/" },
    "git":                  { label: "Git Handbook",       url: "https://guides.github.com/introduction/git-handbook/" },
    "github":               { label: "GitHub Docs",        url: "https://docs.github.com/en/get-started" },
    "linux":                { label: "Linux Journey",      url: "https://linuxjourney.com/" },
    "machine learning":     { label: "Google ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course" },
    "deep learning":        { label: "DeepLearning.AI",    url: "https://www.deeplearning.ai/" },
    "tensorflow":           { label: "TensorFlow Tutorials", url: "https://www.tensorflow.org/tutorials" },
    "pytorch":              { label: "PyTorch Tutorials",  url: "https://pytorch.org/tutorials/" },
    "pandas":               { label: "Pandas Docs",        url: "https://pandas.pydata.org/docs/getting_started/index.html" },
    "numpy":                { label: "NumPy Quickstart",   url: "https://numpy.org/doc/stable/user/quickstart.html" },
    "power bi":              { label: "Power BI Guided Learning", url: "https://learn.microsoft.com/en-us/power-bi/guided-learning/" },
    "tableau":              { label: "Tableau Training",   url: "https://www.tableau.com/learn/training" },
    "excel":                { label: "Excel Basics (Microsoft)", url: "https://support.microsoft.com/en-us/excel" },
    "flutter":              { label: "Flutter Docs",       url: "https://docs.flutter.dev/" },
    "socket.io":             { label: "Socket.IO Docs",     url: "https://socket.io/docs/v4/" },
    "system design":        { label: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
    "dsa":                  { label: "DSA Roadmap",        url: "https://roadmap.sh/datastructures-and-algorithms" },
    "algorithms":           { label: "Algorithms (roadmap.sh)", url: "https://roadmap.sh/datastructures-and-algorithms" },
    "operating systems":    { label: "OS Concepts (OSTEP)",url: "https://pages.cs.wisc.edu/~remzi/OSTEP/" },
    "computer networks":    { label: "Computer Networks (NPTEL)", url: "https://nptel.ac.in/courses/106105183" },
    "dbms":                 { label: "DBMS (GeeksforGeeks)",url: "https://www.geeksforgeeks.org/dbms/" },
    "blockchain":           { label: "Blockchain Basics",  url: "https://ethereum.org/en/developers/docs/" },
    "cybersecurity":        { label: "Cybersecurity Roadmap", url: "https://roadmap.sh/cyber-security" },
    "ui/ux design":         { label: "UX Design Basics (Google)", url: "https://www.coursera.org/professional-certificates/google-ux-design" },
    "figma":                { label: "Figma Learn",        url: "https://help.figma.com/hc/en-us/categories/360002042754-Getting-started" },
    "agile":                { label: "Agile Guide",        url: "https://www.atlassian.com/agile" },
    "scrum":                { label: "Scrum Guide",        url: "https://scrumguides.org/" },
    "jest":                 { label: "Jest Docs",          url: "https://jestjs.io/docs/getting-started" },
    "cypress":              { label: "Cypress Docs",       url: "https://docs.cypress.io/guides/overview/why-cypress" },
    "selenium":             { label: "Selenium Docs",      url: "https://www.selenium.dev/documentation/" },
    "postman":              { label: "Postman Learning Center", url: "https://learning.postman.com/" },
    "webpack":              { label: "Webpack Concepts",   url: "https://webpack.js.org/concepts/" },
    "vite":                 { label: "Vite Guide",         url: "https://vite.dev/guide/" },
    "three.js":              { label: "Three.js Manual",    url: "https://threejs.org/manual/" },
    "d3.js":                 { label: "D3.js Learn",        url: "https://d3js.org/getting-started" },
    "chart.js":              { label: "Chart.js Docs",      url: "https://www.chartjs.org/docs/latest/" },
    "prisma":               { label: "Prisma Docs",        url: "https://www.prisma.io/docs/getting-started" },
    "mongoose":              { label: "Mongoose Docs",      url: "https://mongoosejs.com/docs/guide.html" },
    "data structures":      { label: "Data Structures (roadmap.sh)", url: "https://roadmap.sh/datastructures-and-algorithms" },
    "cloud computing":      { label: "Cloud Computing Basics", url: "https://cloud.google.com/learn/what-is-cloud-computing" }
};

function getSkillResource(skill) {
    const key = skill.trim().toLowerCase();
    if (SKILL_RESOURCES[key]) return SKILL_RESOURCES[key];
    // Fallback — every skill gets a link, even ones outside the curated list
    return { label: "Search tutorials", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " tutorial")}` };
}

function getSkillMatches(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts = MASTER_SKILLS.filter(s => s.toLowerCase().startsWith(q));
    const contains = MASTER_SKILLS.filter(s => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q));
    return [...starts, ...contains].slice(0, 6);
}

function buildSuggestionBox(inputEl) {
    let box = document.getElementById(inputEl.id + "_suggest");
    if (box) return box;
    box = document.createElement("div");
    box.id = inputEl.id + "_suggest";
    box.style.cssText = "position:absolute;z-index:200;background:#131A2A;border:1px solid #232C42;border-radius:10px;margin-top:4px;box-shadow:0 12px 30px rgba(0,0,0,0.4);max-height:220px;overflow-y:auto;display:none;";
    document.body.appendChild(box);
    return box;
}

function positionSuggestionBox(inputEl, box) {
    const rect = inputEl.getBoundingClientRect();
    box.style.left  = (rect.left + window.scrollX) + "px";
    box.style.top   = (rect.bottom + window.scrollY + 4) + "px";
    box.style.width = rect.width + "px";
}

function renderSuggestions(box, matches, onPick) {
    if (!matches.length) { box.style.display = "none"; return; }
    box.innerHTML = matches.map(s => `
        <div class="skill-suggest-item" style="padding:0.55rem 0.85rem;font-size:0.82rem;color:#E7ECF5;cursor:pointer;border-bottom:1px solid #1B2436" onmouseover="this.style.background='rgba(56,189,248,0.1)'" onmouseout="this.style.background='transparent'">${s}</div>
    `).join("");
    [...box.children].forEach((el, i) => {
        el.onmousedown = (e) => { e.preventDefault(); onPick(matches[i]); box.style.display = "none"; };
    });
    box.style.display = "block";
}

// Single-value autocomplete (Profile "Add a skill" box)
function attachSingleSkillAutocomplete(inputEl) {
    const box = buildSuggestionBox(inputEl);
    inputEl.addEventListener("input", () => {
        const matches = getSkillMatches(inputEl.value);
        positionSuggestionBox(inputEl, box);
        renderSuggestions(box, matches, (picked) => { inputEl.value = picked; inputEl.focus(); });
    });
    inputEl.addEventListener("blur", () => setTimeout(() => box.style.display = "none", 150));
}

// Comma-aware autocomplete (Post Job / Pitch Startup "Required Skills" fields)
function attachMultiSkillAutocomplete(inputEl) {
    const box = buildSuggestionBox(inputEl);
    inputEl.addEventListener("input", () => {
        const parts = inputEl.value.split(",");
        const currentSegment = parts[parts.length - 1];
        const matches = getSkillMatches(currentSegment);
        positionSuggestionBox(inputEl, box);
        renderSuggestions(box, matches, (picked) => {
            parts[parts.length - 1] = " " + picked;
            inputEl.value = parts.map((p, i) => i === 0 ? p.trim() : p).join(",").replace(/^,\s*/, "").trim();
            // rebuild cleanly: join non-empty trimmed parts with ", " then a trailing ", " to continue typing
            const cleanParts = inputEl.value.split(",").map(p => p.trim()).filter(Boolean);
            inputEl.value = cleanParts.join(", ") + ", ";
            inputEl.focus();
        });
    });
    inputEl.addEventListener("blur", () => setTimeout(() => box.style.display = "none", 150));
}

// ── Boot ─────────────────────────────────────────────────────────────────────────
// Reopen whatever page the user was last on instead of always jumping to the
// Dashboard on refresh — but only if that page still makes sense for their
// current role (e.g. a recruiter's "analytics" shouldn't restore for a student).
const studentModules   = ["home","pitch","explore","jobs","myapps","profile","messages","profiles"];
const recruiterModules = ["home","postjob","myjobs","jobs","analytics","messages","explore","profiles"];
const allowedModules   = role === "recruiter" ? recruiterModules : studentModules;
const savedModule      = localStorage.getItem("lastModule");
loadModule(allowedModules.includes(savedModule) ? savedModule : "home");

const api = "/api";
const authTokenKey = "skillhubAdminToken";
let students = [];
let catalog = [];
let editId = null;
let courseEditId = null;
let adminToken = sessionStorage.getItem(authTokenKey) || "";

const $ = (id) => document.getElementById(id);

async function request(url, options = {}) {
    const headers = { "Content-Type": "application/json", ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}) };
    const response = await fetch(`${api}${url}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 401) {
            adminToken = "";
            sessionStorage.removeItem(authTokenKey);
            renderAuthUI();
        }
        throw new Error(body.message || "Something went wrong. Please try again.");
    }
    return response.status === 204 ? null : response.json();
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `alert alert-${type} shadow`;
    toast.textContent = message;
    $("toastContainer").appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function isAuthenticated() {
    return Boolean(adminToken);
}

function openAuthModal() {
    $("authMessage").textContent = "";
    $("authModal").classList.add("is-open");
    $("authModal").setAttribute("aria-hidden", "false");
    setTimeout(() => $("adminUsername").focus(), 0);
}

function closeAuthModal() {
    $("authModal").classList.remove("is-open");
    $("authModal").setAttribute("aria-hidden", "true");
}

function ensureAuth() {
    if (isAuthenticated()) return true;
    showToast("Please sign in as an administrator first.", "warning");
    openAuthModal();
    return false;
}

function renderAuthUI() {
    $("authButton").textContent = isAuthenticated() ? "Sign Out" : "Admin Sign In";
    $("courseManager").hidden = !isAuthenticated();
    renderCatalog();
    renderStudents();
}

async function submitAuth(event) {
    event.preventDefault();
    const username = $("adminUsername").value.trim();
    const password = $("adminPassword").value;
    try {
        const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
        adminToken = data.token;
        sessionStorage.setItem(authTokenKey, adminToken);
        $("authForm").reset();
        closeAuthModal();
        renderAuthUI();
        showToast("Administrator access enabled.", "success");
    } catch (error) { $("authMessage").textContent = error.message; }
}

async function toggleAuthentication() {
    if (!isAuthenticated()) return openAuthModal();
    try { await request("/auth/logout", { method: "POST" }); } catch { /* Local token should still be cleared. */ }
    adminToken = "";
    sessionStorage.removeItem(authTokenKey);
    renderAuthUI();
    showToast("Signed out.", "info");
}

function renderCatalog() {
    const grid = $("courseCatalog");
    grid.innerHTML = "";
    catalog.forEach((course) => {
        const col = document.createElement("div");
        col.className = "col-md-4";
        col.innerHTML = `<div class="card h-100"><div class="card-body"><h4 class="card-title"></h4><p class="card-text"></p><button type="button" class="btn ${course.badge}">Learn More</button><div class="course-card-actions ${isAuthenticated() ? "" : "d-none"}"><button type="button" class="btn btn-sm btn-outline-primary">Edit</button><button type="button" class="btn btn-sm btn-outline-danger">Delete</button></div></div></div>`;
        col.querySelector(".card-title").textContent = course.name;
        col.querySelector(".card-text").textContent = course.desc;
        col.querySelector("button").addEventListener("click", () => showCourseDetails(course));
        col.querySelectorAll(".course-card-actions button")[0].addEventListener("click", () => editCourse(course.id));
        col.querySelectorAll(".course-card-actions button")[1].addEventListener("click", () => deleteCourse(course.id));
        grid.appendChild(col);
    });
    const select = $("course");
    const selected = select.value;
    select.innerHTML = '<option value="">Select Course</option>';
    catalog.forEach((course) => select.add(new Option(course.name, course.name)));
    select.value = selected;
    $("count").textContent = catalog.length;
}

function renderStudents() {
    const search = $("searchBox").value.trim().toLowerCase();
    const filtered = students.filter((student) => student.name.toLowerCase().includes(search));
    const tbody = $("studentsTableBody");
    tbody.innerHTML = "";
    filtered.forEach((student) => {
        const row = document.createElement("tr");
        [student.name, student.email, student.age, student.course].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });
        const actions = document.createElement("td");
        if (isAuthenticated()) {
            actions.innerHTML = '<button class="btn btn-sm btn-outline-primary me-2">Edit</button><button class="btn btn-sm btn-outline-danger">Delete</button>';
            actions.children[0].onclick = () => editStudent(student.id);
            actions.children[1].onclick = () => deleteStudent(student.id);
        } else {
            actions.textContent = "Admin access required";
        }
        row.appendChild(actions);
        tbody.appendChild(row);
    });
}

function renderDashboard() {
    const current = students.at(-1);
    $("studentNameDisplay").textContent = current ? current.name : "Guest";
    $("studentEmailDisplay").textContent = current ? current.email : "Register below to see your dashboard";
    $("enrolledCourses").textContent = current ? students.filter((student) => student.email === current.email).length : 0;
    $("totalStudents").textContent = new Set(students.map((student) => student.email)).size;
}

function resetForm() {
    editId = null;
    $("registrationForm").reset();
    $("submit").textContent = "Register";
    $("cancelEdit").classList.add("d-none");
}

function editStudent(id) {
    const student = students.find((item) => item.id === id);
    if (!student) return;
    editId = id;
    ["name", "email", "age", "course"].forEach((field) => $(field).value = student[field]);
    $("submit").textContent = "Update";
    $("cancelEdit").classList.remove("d-none");
    $("register").scrollIntoView({ behavior: "smooth" });
}

async function deleteStudent(id) {
    if (!ensureAuth()) return;
    if (!confirm("Delete this student registration?")) return;
    try {
        await request(`/students/${id}`, { method: "DELETE" });
        students = students.filter((student) => student.id !== id);
        renderStudents(); renderDashboard();
        if (editId === id) resetForm();
        showToast("Student deleted.", "success");
    } catch (error) { showToast(error.message, "danger"); }
}

async function validateForm() {
    const student = Object.fromEntries(["name", "email", "age", "course"].map((field) => [field, $(field).value.trim()]));
    if (!student.name || !/^\S+@\S+\.\S+$/.test(student.email) || Number(student.age) < 18 || !student.course) {
        showToast("Enter a name, valid email, age 18 or older, and course.", "danger");
        return;
    }
    if (!ensureAuth()) return;
    try {
        const saved = await request(editId ? `/students/${editId}` : "/students", { method: editId ? "PUT" : "POST", body: JSON.stringify(student) });
        students = editId ? students.map((item) => item.id === saved.id ? saved : item) : [...students, saved];
        renderStudents(); renderDashboard(); resetForm();
        showToast(editId ? "Student updated." : "Registration saved.", "success");
    } catch (error) { showToast(error.message, "danger"); }
}

function resetCourseForm() {
    courseEditId = null;
    $("courseForm").reset();
    $("courseFormTitle").textContent = "Create a new course";
    $("saveCourse").textContent = "Add Course";
    $("cancelCourseEdit").classList.add("d-none");
}

function editCourse(id) {
    if (!ensureAuth()) return;
    const course = catalog.find((item) => item.id === id);
    if (!course) return;
    courseEditId = id;
    $("courseName").value = course.name;
    $("courseDescription").value = course.desc;
    $("courseFormTitle").textContent = "Edit course";
    $("saveCourse").textContent = "Save Changes";
    $("cancelCourseEdit").classList.remove("d-none");
    $("courseManager").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function saveCourse(event) {
    event.preventDefault();
    if (!ensureAuth()) return;
    const course = { name: $("courseName").value.trim(), desc: $("courseDescription").value.trim() };
    if (!course.name || !course.desc) {
        showToast("Enter both a course name and description.", "danger");
        return;
    }
    try {
        const saved = await request(courseEditId ? `/courses/${courseEditId}` : "/courses", {
            method: courseEditId ? "PUT" : "POST",
            body: JSON.stringify(course)
        });
        catalog = courseEditId ? catalog.map((item) => item.id === saved.id ? saved : item) : [...catalog, saved];
        renderCatalog();
        $("dashboardHint").textContent = `${saved.name} ${courseEditId ? "updated" : "added"}.`;
        showToast(`Course ${courseEditId ? "updated" : "added"}.`, "success");
        resetCourseForm();
    } catch (error) { showToast(error.message, "danger"); }
}

async function deleteCourse(id) {
    if (!ensureAuth()) return;
    const course = catalog.find((item) => item.id === id);
    if (!course || !confirm(`Delete ${course.name}?`)) return;
    try {
        await request(`/courses/${id}`, { method: "DELETE" });
        catalog = catalog.filter((item) => item.id !== id);
        renderCatalog();
        if (courseEditId === id) resetCourseForm();
        $("dashboardHint").textContent = `${course.name} removed from the catalog.`;
        showToast("Course deleted.", "success");
    } catch (error) { showToast(error.message, "danger"); }
}

function openCourseManager() {
    if (!ensureAuth()) return;
    resetCourseForm();
    $("courseManager").scrollIntoView({ behavior: "smooth", block: "center" });
}

function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    $("theme").textContent = isDark ? "Toggle Light Mode" : "Toggle Dark Mode";
    $("themebtn").textContent = isDark ? "Light Mode" : "Dark Mode";
}

function showCourseDetails(course) {
    $("courseModalTitle").textContent = course.name;
    $("courseModalDescription").textContent = course.desc;
    $("enrollCourseNow").onclick = () => enrollInCourse(course.name);
    $("courseDetailsModal").classList.add("is-open");
    $("courseDetailsModal").setAttribute("aria-hidden", "false");
}

function closeCourseDetails() {
    $("courseDetailsModal").classList.remove("is-open");
    $("courseDetailsModal").setAttribute("aria-hidden", "true");
}

function enrollInCourse(courseName) {
    closeCourseDetails();
    $("course").value = courseName;
    $("register").scrollIntoView({ behavior: "smooth" });
    showToast(`${courseName} selected. Complete the form to enroll.`, "info");
}

async function initialise() {
    $("date").textContent = new Date().toDateString();
    try {
        [students, catalog] = await Promise.all([request("/students"), request("/courses")]);
        renderAuthUI(); renderDashboard();
    } catch (error) {
        showToast("Could not connect to SkillHub. Start the backend and open http://localhost:3000.", "danger");
    }
}

$("getstarted").onclick = () => $("register").scrollIntoView({ behavior: "smooth" });
$("learnmore").onclick = () => $("courses").scrollIntoView({ behavior: "smooth" });
$("addCourse").onclick = openCourseManager;
$("courseForm").onsubmit = saveCourse;
$("cancelCourseEdit").onclick = resetCourseForm;
document.querySelectorAll("[data-close-course-modal]").forEach((element) => element.onclick = closeCourseDetails);
document.querySelectorAll("[data-close-auth-modal]").forEach((element) => element.onclick = closeAuthModal);
$("authForm").onsubmit = submitAuth;
$("authButton").onclick = toggleAuthentication;
$("searchBox").oninput = renderStudents;
function toggleTheme() {
    const next = !document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", next);
    applyTheme(next);
}
$("theme").onclick = toggleTheme;
$("themebtn").onclick = toggleTheme;
applyTheme(localStorage.getItem("darkMode") === "true");
initialise();

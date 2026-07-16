const api = "/api";
let students = [];
let catalog = [];
let editId = null;

const $ = (id) => document.getElementById(id);

async function request(url, options = {}) {
    const response = await fetch(`${api}${url}`, {
        headers: { "Content-Type": "application/json" },
        ...options
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
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

function renderCatalog() {
    const grid = $("courseCatalog");
    grid.innerHTML = "";
    catalog.forEach((course) => {
        const col = document.createElement("div");
        col.className = "col-md-4";
        col.innerHTML = `<div class="card h-100"><div class="card-body"><h4 class="card-title"></h4><p class="card-text"></p><button type="button" class="btn ${course.badge}">Learn More</button></div></div>`;
        col.querySelector(".card-title").textContent = course.name;
        col.querySelector(".card-text").textContent = course.desc;
        col.querySelector("button").addEventListener("click", () => learnMoreAboutCourse(course.name));
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
        actions.innerHTML = '<button class="btn btn-sm btn-outline-primary me-2">Edit</button><button class="btn btn-sm btn-outline-danger">Delete</button>';
        actions.children[0].onclick = () => editStudent(student.id);
        actions.children[1].onclick = () => deleteStudent(student.id);
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
    try {
        const saved = await request(editId ? `/students/${editId}` : "/students", { method: editId ? "PUT" : "POST", body: JSON.stringify(student) });
        students = editId ? students.map((item) => item.id === saved.id ? saved : item) : [...students, saved];
        renderStudents(); renderDashboard(); resetForm();
        showToast(editId ? "Student updated." : "Registration saved.", "success");
    } catch (error) { showToast(error.message, "danger"); }
}

async function addCourse() {
    const name = prompt("New course name:");
    if (!name?.trim()) return;
    try {
        catalog.push(await request("/courses", { method: "POST", body: JSON.stringify({ name }) }));
        renderCatalog();
        $("dashboardHint").textContent = `${name.trim()} added to the catalog.`;
    } catch (error) { showToast(error.message, "danger"); }
}

function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    $("theme").textContent = isDark ? "Toggle Light Mode" : "Toggle Dark Mode";
    $("themebtn").textContent = isDark ? "Light Mode" : "Dark Mode";
}

function learnMoreAboutCourse(courseName) {
    $("course").value = courseName;
    $("register").scrollIntoView({ behavior: "smooth" });
    showToast(`${courseName} selected. Complete the form to register.`, "info");
}

async function initialise() {
    $("date").textContent = new Date().toDateString();
    try {
        [students, catalog] = await Promise.all([request("/students"), request("/courses")]);
        renderCatalog(); renderStudents(); renderDashboard();
    } catch (error) {
        showToast("Could not connect to SkillHub. Start the backend and open http://localhost:3000.", "danger");
    }
}

$("getstarted").onclick = () => $("register").scrollIntoView({ behavior: "smooth" });
$("learnmore").onclick = () => $("courses").scrollIntoView({ behavior: "smooth" });
$("addCourse").onclick = addCourse;
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

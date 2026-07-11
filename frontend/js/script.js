let btn = document.getElementById("getstarted");
btn.addEventListener("click", function () { alert("You are now redirected to the login page"); });

let themeBtn = document.getElementById("themeBtn");
themeBtn.addEventListener("click", function () {
    document.body.style.background = "linear-gradient(to right, #458c9c, #211e1e88)";
});

document.getElementById("date").innerHTML = new Date().toDateString();

let students = JSON.parse(localStorage.getItem("students")) || [];
let editIndex = null;

const DEFAULT_COURSES = [
    { name: "HTML & CSS", desc: "Build beautiful, responsive web pages.", badge: "btn-success" },
    { name: "JavaScript", desc: "Add interactivity and logic to your applications.", badge: "btn-warning" },
    { name: "Node JS", desc: "Build scalable, high-performance backend systems.", badge: "btn-danger" },
    { name: "Mongo DB", desc: "Master modern database management.", badge: "btn-success" },
    { name: "Bootstrap", desc: "Create sleek, mobile-first designs with ease.", badge: "btn-warning" },
    { name: "React JS", desc: "Develop dynamic, component-based user interfaces.", badge: "btn-danger" }
];
const BADGE_CYCLE = ["btn-success", "btn-warning", "btn-danger"];

let catalog = JSON.parse(localStorage.getItem("catalog")) || DEFAULT_COURSES;

function saveCatalog() {
    localStorage.setItem("catalog", JSON.stringify(catalog));
}

function renderCatalog() {
    const grid = document.getElementById("courseCatalog");
    grid.innerHTML = "";
    catalog.forEach(function (courseItem) {
        const col = document.createElement("div");
        col.className = "col-md-4";
        col.innerHTML =
            '<div class="card h-100"><div class="card-body">' +
            '<h4 class="card-title"></h4>' +
            '<p class="card-text"></p>' +
            '<a class="btn ' + courseItem.badge + '">Learn More</a>' +
            '</div></div>';
        col.querySelector(".card-title").textContent = courseItem.name;
        col.querySelector(".card-text").textContent = courseItem.desc;
        grid.appendChild(col);
    });
    const select = document.getElementById("course");
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select Course</option>';
    catalog.forEach(function (courseItem) {
        const option = document.createElement("option");
        option.value = courseItem.name;
        option.textContent = courseItem.name;
        select.appendChild(option);
    });
    if (catalog.some(function (c) { return c.name === currentValue; })) {
        select.value = currentValue;
    }

    document.getElementById("count").textContent = catalog.length;
}

document.getElementById("addCourse").addEventListener("click", function () {
    const name = prompt("New course name:");
    if (!name || !name.trim()) {
        return;
    }
    const trimmed = name.trim();
    if (catalog.some(function (c) { return c.name.toLowerCase() === trimmed.toLowerCase(); })) {
        alert(trimmed + " is already in the catalog.");
        return;
    }
    catalog.push({
        name: trimmed,
        desc: "Newly added course.",
        badge: BADGE_CYCLE[catalog.length % BADGE_CYCLE.length]
    });
    saveCatalog();
    renderCatalog();
    document.getElementById("dashboardHint").textContent = trimmed + " added to the catalog.";
});
function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    document.getElementById("theme").textContent = isDark ? "Toggle Light Mode" : "Toggle Dark Mode";
}
let isDarkMode = localStorage.getItem("darkMode") === "true";
applyTheme(isDarkMode);
document.getElementById("theme").addEventListener("click", function () {
    isDarkMode = !isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyTheme(isDarkMode);
    showToast(isDarkMode ? "Dark mode enabled" : "Light mode enabled", "info");
});
function renderDashboard() {
    const nameEl = document.getElementById("studentNameDisplay");
    const emailEl = document.getElementById("studentEmailDisplay");
    const enrolledEl = document.getElementById("enrolledCourses");
    const totalEl = document.getElementById("totalStudents");

    if (students.length === 0) {
        nameEl.textContent = "Guest";
        emailEl.textContent = "Register below to see your dashboard";
        enrolledEl.textContent = "0";
        totalEl.textContent = "0";
        return;
    }

    const current = students[students.length - 1];
    nameEl.textContent = current.name;
    emailEl.textContent = current.email;

    const enrolledForCurrent = students.filter(function (s) { return s.email === current.email; }).length;
    enrolledEl.textContent = enrolledForCurrent;

    const distinctEmails = new Set(students.map(function (s) { return s.email; }));
    totalEl.textContent = distinctEmails.size;
}

function validateForm() {
    const name = document.getElementById("name").value.trim();
    const age = document.getElementById("age").value;
    const email = document.getElementById("email").value.trim();
    const course = document.getElementById("course").value;

    if (name === "") {
        showToast("Name is required", "danger");
        return;
    }
    if (age === "" || Number(age) < 18) {
        showToast("You must be 18 or older", "danger");
        return;
    }
    if (email === "" || !email.includes("@")) {
        showToast("Valid Email is Required!", "danger");
        return;
    }
    if (course === "") {
        showToast("Select a course.", "danger");
        return;
    }

    if (editIndex === null) {
        registerStudent(name, age, email, course);
        showToast("Form submitted successfully!", "success");
    } else {
        updateStudent(editIndex, name, age, email, course);
        showToast("Student updated successfully!","success");
    }

    resetForm();
}

function registerStudent(name, age, email, course) {
    const student = { name, age, email, course };
    students.push(student);
    saveStudents();
    renderStudents();
    renderDashboard();
}

function updateStudent(index, name, age, email, course) {
    students[index] = { name, age, email, course };
    saveStudents();
    renderStudents();
    renderDashboard();
}

function deleteStudent(index) {
    students.splice(index, 1);
    saveStudents();
    renderStudents();
    renderDashboard();
    if (editIndex === index) {
        resetForm();
    }
}

function saveStudents() {
    localStorage.setItem("students", JSON.stringify(students));
}
function editStudent(index) {
    editIndex = index;
    document.getElementById("name").value = students[index].name;
    document.getElementById("age").value = students[index].age;
    document.getElementById("email").value = students[index].email;
    document.getElementById("course").value = students[index].course;

    document.getElementById("submit").textContent = "Update";
    document.getElementById("cancelEdit").classList.remove("d-none");
}

function cancelEditStudent() {
    resetForm();
}

function resetForm() {
    editIndex = null;
    document.getElementById("registrationForm").reset();
    document.getElementById("submit").textContent = "Register";
    document.getElementById("cancelEdit").classList.add("d-none");
}

function renderStudents() {
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = "";

    students.forEach(function (student, index) {
        const row = document.createElement("tr");
        row.innerHTML =
            "<td></td><td></td><td></td><td></td><td></td>";

        row.children[0].textContent = student.name;
        row.children[1].textContent = student.email;
        row.children[2].textContent = student.age;
        row.children[3].textContent = student.course;

        const actionsCell = row.children[4];

        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-sm btn-outline-primary me-2";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", function () { editStudent(index); });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-outline-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", function () { deleteStudent(index); });

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        tbody.appendChild(row);
    });
}
function searchstudents() {
    document.getElementById("searchBox").addEventListener("input", function () {
        let keyword = this.value.toLowerCase();
        let filtered = students.filter(function (s) {
            return
            s.name.toLowerCase().includes(keyword);
        });
        displayStudents(filtered);
    });
}


searchstudents();
renderCatalog();
renderStudents();
renderDashboard();
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "..", "frontend");
const studentsFile = path.join(__dirname, "students.json");
const coursesFile = path.join(__dirname, "courses.json");
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "skillhub-admin";
const sessions = new Map();

const defaultCourses = [
  { name: "HTML & CSS", desc: "Build beautiful, responsive web pages.", badge: "btn-success" },
  { name: "JavaScript", desc: "Add interactivity and logic to your applications.", badge: "btn-warning" },
  { name: "Node JS", desc: "Build scalable, high-performance backend systems.", badge: "btn-danger" },
  { name: "Mongo DB", desc: "Master modern database management.", badge: "btn-success" },
  { name: "Bootstrap", desc: "Create sleek, mobile-first designs with ease.", badge: "btn-warning" },
  { name: "React JS", desc: "Develop dynamic, component-based user interfaces.", badge: "btn-danger" }
];

function readJson(file, fallback) {
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let students = readJson(studentsFile, []).map((student) => ({
  id: student.id || crypto.randomUUID(),
  name: student.name || "",
  email: student.email || "",
  age: student.age || "",
  course: student.course || ""
}));
let courses = readJson(coursesFile, defaultCourses).map((course, index) => ({
  id: course.id || crypto.randomUUID(),
  name: course.name || `Course ${index + 1}`,
  desc: course.desc || "Course description coming soon.",
  badge: course.badge || ["btn-success", "btn-warning", "btn-danger"][index % 3]
}));
writeJson(studentsFile, students);
writeJson(coursesFile, courses);

function validStudent({ name, email, age, course }) {
  return typeof name === "string" && name.trim() &&
    typeof email === "string" && /^\S+@\S+\.\S+$/.test(email) &&
    Number.isInteger(Number(age)) && Number(age) >= 18 &&
    typeof course === "string" && course.trim();
}

function validCourse({ name, desc }) {
  return typeof name === "string" && name.trim() && typeof desc === "string" && desc.trim();
}

const app = express();
app.use(express.json());
app.use(express.static(frontendPath));

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !sessions.has(token)) return res.status(401).json({ message: "Sign in is required for this action." });
  next();
}

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (username !== adminUsername || password !== adminPassword) return res.status(401).json({ message: "Incorrect username or password." });
  const token = crypto.randomUUID();
  sessions.set(token, { username, createdAt: Date.now() });
  res.json({ token, username });
});
app.post("/api/auth/logout", requireAuth, (req, res) => {
  sessions.delete(req.headers.authorization.replace("Bearer ", ""));
  res.status(204).end();
});
app.get("/api/auth/status", requireAuth, (_req, res) => res.json({ authenticated: true }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/students", (_req, res) => res.json(students));
app.post("/api/students", requireAuth, (req, res) => {
  if (!validStudent(req.body)) return res.status(400).json({ message: "Provide a name, valid email, age 18+, and course." });
  const student = { id: crypto.randomUUID(), ...req.body, name: req.body.name.trim(), email: req.body.email.trim(), course: req.body.course.trim(), age: Number(req.body.age) };
  students.push(student);
  writeJson(studentsFile, students);
  res.status(201).json(student);
});
app.put("/api/students/:id", requireAuth, (req, res) => {
  if (!validStudent(req.body)) return res.status(400).json({ message: "Provide a name, valid email, age 18+, and course." });
  const index = students.findIndex((student) => student.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Student not found." });
  students[index] = { id: students[index].id, ...req.body, name: req.body.name.trim(), email: req.body.email.trim(), course: req.body.course.trim(), age: Number(req.body.age) };
  writeJson(studentsFile, students);
  res.json(students[index]);
});
app.delete("/api/students/:id", requireAuth, (req, res) => {
  const updated = students.filter((student) => student.id !== req.params.id);
  if (updated.length === students.length) return res.status(404).json({ message: "Student not found." });
  students = updated;
  writeJson(studentsFile, students);
  res.status(204).end();
});

app.get("/api/courses", (_req, res) => res.json(courses));
app.post("/api/courses", requireAuth, (req, res) => {
  const { name, desc } = req.body;
  if (!validCourse({ name, desc })) return res.status(400).json({ message: "Course name and description are required." });
  if (courses.some((course) => course.name.toLowerCase() === name.trim().toLowerCase())) return res.status(409).json({ message: "That course already exists." });
  const course = { id: crypto.randomUUID(), name: name.trim(), desc: desc.trim(), badge: ["btn-success", "btn-warning", "btn-danger"][courses.length % 3] };
  courses.push(course);
  writeJson(coursesFile, courses);
  res.status(201).json(course);
});
app.put("/api/courses/:id", requireAuth, (req, res) => {
  const { name, desc } = req.body;
  if (!validCourse({ name, desc })) return res.status(400).json({ message: "Course name and description are required." });
  const index = courses.findIndex((course) => course.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Course not found." });
  if (courses.some((course) => course.id !== req.params.id && course.name.toLowerCase() === name.trim().toLowerCase())) return res.status(409).json({ message: "That course already exists." });
  const oldName = courses[index].name;
  courses[index] = { ...courses[index], name: name.trim(), desc: desc.trim() };
  students = students.map((student) => student.course === oldName ? { ...student, course: courses[index].name } : student);
  writeJson(coursesFile, courses);
  writeJson(studentsFile, students);
  res.json(courses[index]);
});
app.delete("/api/courses/:id", requireAuth, (req, res) => {
  const course = courses.find((item) => item.id === req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });
  if (students.some((student) => student.course === course.name)) return res.status(409).json({ message: "This course has enrolled students and cannot be deleted." });
  courses = courses.filter((item) => item.id !== req.params.id);
  writeJson(coursesFile, courses);
  res.status(204).end();
});

app.get("*splat", (_req, res) => res.sendFile(path.join(frontendPath, "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`SkillHub is running at http://localhost:${port}`));

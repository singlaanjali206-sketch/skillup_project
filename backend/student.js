import fs from "fs";

let students = [];
if (fs.existsSync("students.json")) {
  const data = fs.readFileSync("students.json", "utf-8");
  if (data.trim().length > 0) {
    students = JSON.parse(data);
  }
}

function addStudent(name, course) {
  students.push({ name, course });
  console.log("Student Added");
  return students;
}

function viewStudents() {
  console.table(students);
}

fs.writeFileSync("students.json", JSON.stringify(students, null, 2));

console.log("Students saved successfully!");
viewStudents();

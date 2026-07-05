let btn = document.getElementById("getstarted");
btn.addEventListener("click", function () { alert("You are now redirected to the login page"); });

let theme = document.getElementById("themeBtn");
theme.addEventListener("click", function () {
    document.body.style.background = "linear-gradient(to right, #458c9c, #211e1e88)";
});

let studentName = "Anjali Singla";
document.getElementById("name").innerHTML = studentName;

document.getElementById("date")
    .innerHTML = new Date().toDateString();
let courses = 6;
document.getElementById("addCourse")
    .addEventListener("click", function () {
        courses++;
        document.getElementById("courses").innerHTML = courses;
    });
document.getElementById("theme")
    .addEventListener("click", function () {
        document.body.style.background = "white";
    });


function validateForm() {
    let name = document.getElementById("name").value;
    let age = document.getElementById("age").value;
    if (name === "") {
        alert("Name is required");
        return; 
    }
    if (age < 18) {
        alert("You must be 18 or older");
        return;
    }
    alert("Registration successful, " + name);
}


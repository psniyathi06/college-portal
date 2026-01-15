// Common teacher info setup
const userData = JSON.parse(localStorage.getItem("userData"));
if (!userData || !userData.teacher) {
  alert("Login first!");
  window.location.href = "index.html";
}

const teacher = userData.teacher;


document.getElementById("teacherName").innerText = "Teacher: " + teacher.name;

// logout
function logout() {
  localStorage.removeItem("userData");
  localStorage.removeItem("selectedSection");
  window.location.href = "index.html";
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
}

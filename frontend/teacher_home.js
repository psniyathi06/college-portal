const API = "http://localhost:5000";

// Get logged-in teacher from localStorage
const userData = JSON.parse(localStorage.getItem("userData"));
if (!userData || !userData.teacher) {
  alert("Please login as teacher first!");
  window.location.href = "index.html";
}

const teacher = userData.teacher;

// Mapping Configuration
// Mapping Configuration
const TEACHER_CONFIG = {
  "Physics Teacher": ["A", "B"],
  "Math Teacher": ["A", "B"],
  "English Teacher": ["A", "B"],
  "Chemistry Teacher": ["A", "B"]
};

// Show teacher name
document.getElementById("teacherName").innerText = `Teacher: ${teacher.name}`;

// Logout
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("userData");
  localStorage.removeItem("selectedSection");
  window.location.href = "index.html";
};

// 🔥 Instead of using teacher.sections blindly,
// we derive sections from the teacher's students or config
async function initSections() {
  const wrapper = document.getElementById("sectionWrapper");
  wrapper.innerHTML = "<p>Loading your sections...</p>";

  try {
    let sections = [];

    // Check if we have a hardcoded config for this teacher
    if (TEACHER_CONFIG[teacher.name]) {
      sections = TEACHER_CONFIG[teacher.name];
    } else {
      // Fallback to fetching derived sections from students
      const res = await fetch(`${API}/teacher/students?teacherId=${teacher._id}`);
      const data = await res.json();
      const students = data.students || [];

      const sectionSet = new Set(students.map((s) => s.section));
      sections = Array.from(sectionSet).sort();
    }

    // If no sections found
    if (!sections.length) {
      wrapper.innerHTML = "<p>No sections found for you.</p>";
      return;
    }

    let html = "";
    sections.forEach((sec) => {
      html += `
        <div class="card card-interactive section-card" data-section="${sec}">
            <div class="card-body">
                <h3>Section ${sec}</h3>
                <p>Manage attendance and marks for Section ${sec}</p>
            </div>
            <div class="card-footer">
                <span class="btn btn-sm btn-tertiary">Select &rarr;</span>
            </div>
        </div>
      `;
    });

    wrapper.innerHTML = html;

    document.querySelectorAll(".section-card").forEach((card) => {
      card.addEventListener("click", () => {
        // Remove active class from all
        document.querySelectorAll(".section-card").forEach(c => c.classList.remove("active-card"));
        // Add to clicked
        card.classList.add("active-card");

        const sec = card.getAttribute("data-section");
        localStorage.setItem("selectedSection", sec);
        document.getElementById("selectedSectionLabel").innerText =
          "Selected Section: " + sec;

        // Show actions with animation
        const actions = document.getElementById("actions");
        actions.style.display = "block";
        actions.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // If already selected earlier, show it
    const existing = localStorage.getItem("selectedSection");
    if (existing && sections.includes(existing)) {
      document.getElementById("selectedSectionLabel").innerText =
        "Selected Section: " + existing;
      document.getElementById("actions").style.display = "block";
    }
  } catch (err) {
    console.error("Error loading sections:", err);
    wrapper.innerHTML = "<p>Failed to load sections from server.</p>";
  }
}

initSections();

// Navigation buttons
document.getElementById("goAttendance").onclick = () => {
  if (!localStorage.getItem("selectedSection")) {
    alert("Please select a section first");
    return;
  }
  window.location.href = "attendance_page.html";
};

document.getElementById("goMarks").onclick = () => {
  if (!localStorage.getItem("selectedSection")) {
    alert("Please select a section first");
    return;
  }
  window.location.href = "marks_page.html";
};

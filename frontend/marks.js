const API = "http://localhost:5000";

// ---------- AUTH CHECK ----------
const userData = JSON.parse(localStorage.getItem("userData"));
if (!userData || !userData.teacher) {
  alert("Please login as teacher first!");
  window.location.href = "index.html";
}

const teacher = userData.teacher;
const selectedSection = localStorage.getItem("selectedSection");

if (!selectedSection) {
  alert("Please select a section on the Teacher Home page first.");
  window.location.href = "teacher_home.html";
}

`Teacher: ${teacher.name} (Section ${selectedSection})`;

// Mapping Configuration for Subjects
const TEACHER_SUBJECTS = {
  "Physics Teacher": "Physics",
  "Math Teacher": "Maths",
  "English Teacher": "English",
  "Chemistry Teacher": "Chemistry"
};

// Auto-select subject if applicable
const subjectSelect = document.getElementById("globalSubject");
if (TEACHER_SUBJECTS[teacher.name]) {
  const subject = TEACHER_SUBJECTS[teacher.name];
  // Check if option exists, if not create it (though it should exist)
  if (!Array.from(subjectSelect.options).some(opt => opt.value === subject)) {
    const opt = document.createElement("option");
    opt.value = subject;
    opt.text = subject;
    subjectSelect.add(opt);
  }

  subjectSelect.value = subject;
  subjectSelect.disabled = true;

  // Add a visual indicator or label
  const label = document.querySelector("label[for='globalSubject']");
  if (label) label.innerHTML += " (Locked for your subject)";
}


// ---------- LOGIC ----------

document.getElementById("loadStudentsBtn").addEventListener("click", loadStudents);

async function loadStudents() {
  const examType = document.getElementById("globalExamType").value;
  const subject = document.getElementById("globalSubject").value;
  const list = document.getElementById("studentsList");

  if (!examType || !subject) {
    alert("Please select both Exam Type and Subject.");
    return;
  }

  list.innerHTML = "<p>Loading students...</p>";

  try {
    // 1. Fetch Students
    const res = await fetch(
      `${API}/teacher/students?teacherId=${teacher._id}&section=${selectedSection}`
    );
    const data = await res.json();
    let students = data.students || [];

    // 2. Filter for Semester Eligibility if needed
    if (examType === "SEMESTER" || examType === "FINAL") {
      list.innerHTML = "<p>Checking eligibility (Mid Avg >= 14)... This might take a moment.</p>";
      students = await filterEligibleStudents(students, subject);
    }

    renderStudents(students, examType, subject);

  } catch (err) {
    console.error("Error loading students:", err);
    list.innerHTML = "<p class='text-error'>Failed to load students.</p>";
  }
}

async function filterEligibleStudents(students, subject) {
  const eligibleStudents = [];

  // Parallel fetch for speed
  const checks = students.map(async (stu) => {
    try {
      const res = await fetch(`${API}/marks/${stu.rollNo}`);
      const data = await res.json();
      const marks = data.marks || [];

      // Find Mid 1 and Mid 2 for this subject
      const mid1 = marks.find(m => (m.examType === "MID-1" || m.examType === "MID 1") && m.subject === subject);
      const mid2 = marks.find(m => (m.examType === "MID-2" || m.examType === "MID 2") && m.subject === subject);

      const m1Score = mid1 ? parseFloat(mid1.marks) : 0;
      const m2Score = mid2 ? parseFloat(mid2.marks) : 0;

      const avg = (m1Score + m2Score) / 2;

      if (avg >= 14) {
        return stu;
      }
    } catch (e) {
      console.error(`Error checking eligibility for ${stu.rollNo}`, e);
    }
    return null; // Not eligible or error
  });

  const results = await Promise.all(checks);
  return results.filter(s => s !== null);
}


document.getElementById("saveAllBtn").addEventListener("click", saveAllMarks);

// Global list to track rendered students for saving
let currentStudentList = [];

function renderStudents(students, examType, subject) {
  const list = document.getElementById("studentsList");
  currentStudentList = students; // Store for Save All

  if (students.length === 0) {
    list.innerHTML = `<p>No students found ${examType === "SEMESTER" ? "eligible for Semester exam (Avg < 14)" : "in this section"}.</p>`;
    return;
  }

  list.innerHTML = "";

  students.forEach((stu) => {
    // Create a unique ID for the inputs
    const safeRoll = stu.rollNo.replace(/\s+/g, '_');

    list.innerHTML += `
        <div class="student-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div>
            <strong>${stu.name}</strong>
            <div style="font-size: 0.85em; color: gray;">${stu.rollNo}</div>
          </div>
          
          <div class="controls" style="display: flex; gap: 10px; align-items: center;">
            <input type="number" id="marks-${safeRoll}" placeholder="Marks" min="0" max="100" style="width: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
          </div>
        </div>
      `;
  });
}

// ---------- SAVE ALL MARKS ----------
async function saveAllMarks() {
  const examType = document.getElementById("globalExamType").value;
  const subject = document.getElementById("globalSubject").value;
  const date = document.getElementById("globalDate").value;

  if (!examType || !subject || !date) {
    alert("Please select Exam Type, Subject, AND Date before saving.");
    return;
  }

  // Determine Max Marks
  let maxMarks = 100;
  if (examType.includes("MID")) maxMarks = 40;
  else if (examType.includes("UNIT")) maxMarks = 10;
  else if (examType === "SEMESTER" || examType === "FINAL") maxMarks = 60;

  const validEntries = [];

  // Validation Loop
  for (const stu of currentStudentList) {
    const safeRoll = stu.rollNo.replace(/\s+/g, '_');
    const input = document.getElementById(`marks-${safeRoll}`);
    const marksStr = input.value;

    if (marksStr.trim() !== "") {
      const marks = Number(marksStr);
      if (marks < 0 || marks > maxMarks) {
        alert(`Error for ${stu.name}: Marks cannot be greater than ${maxMarks} for ${examType}!`);
        input.focus();
        return; // Stop saving
      }
      validEntries.push({ rollNo: stu.rollNo, marks });
    }
  }

  if (validEntries.length === 0) {
    alert("No marks entered to save.");
    return;
  }

  // Bulk Save (Parallel Requests)
  try {
    const promises = validEntries.map(entry =>
      fetch(`${API}/marks/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo: entry.rollNo,
          examType,
          subject,
          marks: entry.marks,
          date
        })
      })
    );

    await Promise.all(promises);
    alert("All marks saved successfully!");

  } catch (err) {
    console.error("Save error:", err);
    alert("Error saving marks (network issue).");
  }
}

// ---------- LOGOUT ----------
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("userData");
  localStorage.removeItem("selectedSection");
  window.location.href = "index.html";
});

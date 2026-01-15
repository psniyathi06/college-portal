const API = "http://localhost:5000";

// ---------- HELPER: TODAY IN yyyy-mm-dd ----------
function getToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

document.getElementById("teacherName").innerText =
  `Teacher: ${teacher.name} (Section ${selectedSection})`;

// ---------- GLOBAL DATE (top calendar) ----------
const globalDateInput = document.getElementById("attendanceDate");
const todayStr = getToday();
if (globalDateInput) {
  globalDateInput.value = todayStr;
}

// when global date changes, update all per-student dates
if (globalDateInput) {
  globalDateInput.addEventListener("change", () => {
    const newDate = globalDateInput.value;
    document
      .querySelectorAll(".attendance-date")
      .forEach((input) => (input.value = newDate));
  });
}

// ---------- LOAD STUDENTS OF THAT SECTION ----------
async function loadStudentsForAttendance() {
  try {
    const res = await fetch(
      `${API}/teacher/students?teacherId=${teacher._id}&section=${selectedSection}`
    );
    const data = await res.json();

    const list = document.getElementById("studentsList");
    list.innerHTML = "";

    (data.students || []).forEach((stu) => {
      list.innerHTML += `
        <div class="student-card">
          <div class="student-header">
            <input 
              type="checkbox" 
              class="student-select" 
              data-rollno="${stu.rollNo}"
            />
            <span>
              <strong>${stu.name}</strong> (${stu.rollNo}) - Section ${stu.section}
            </span>
          </div>
          <div class="controls">
            <input 
              type="date" 
              id="adate-${stu.rollNo}" 
              class="attendance-date"
              value="${todayStr}"
            />
            <select id="status-${stu.rollNo}">
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
            <button onclick="saveAttendance('${stu.rollNo}')">Save</button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading students for attendance:", err);
    alert("Failed to load students");
  }
}

// ---------- SAVE ATTENDANCE FOR ONE STUDENT ----------
async function saveAttendance(rollNo, skipCheck = false) {
  const date = document.getElementById(`adate-${rollNo}`).value;
  const status = document.getElementById(`status-${rollNo}`).value;
  const period = document.getElementById("attendancePeriod").value;

  if (!date || !period) {
    alert("Please select both Date and Period");
    return;
  }

  // Conflict Check (unless skipped)
  if (!skipCheck) {
    try {
      const checkRes = await fetch(`${API}/attendance/check-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNos: [rollNo], date, period }),
      });
      const checkData = await checkRes.json();

      if (checkData.exists) {
        const confirmOverwrite = confirm(
          `Attendance for ${rollNo} in Period ${period} already exists. Overwrite?`
        );
        if (!confirmOverwrite) return;
      }
    } catch (err) {
      console.error("Conflict check error:", err);
    }
  }

  // Infer Subject from Teacher Name (e.g., "Physics Teacher" -> "Physics")
  // Fallback to "General" if not found
  const subject = teacher.name.split(" ")[0] || "General";

  try {
    const res = await fetch(`${API}/attendance/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollNo,
        date,
        status,
        period,
        subject
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Attendance update error:", data);
      alert("Failed to save attendance: " + (data.message || "Server error"));
      return;
    }

    console.log("Saved attendance:", data);
  } catch (err) {
    console.error("Attendance update error:", err);
    alert("Failed to save attendance (network error)");
  }
}

// ---------- BULK HELPERS ----------
function getSelectedRollNos() {
  const checkboxes = document.querySelectorAll(".student-select");
  const selected = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) {
      selected.push(cb.getAttribute("data-rollno"));
    }
  });
  return selected;
}

// Mark selected students' status (Present / Absent) in UI
function setStatusForSelected(status) {
  const selected = getSelectedRollNos();
  selected.forEach((rollNo) => {
    const sel = document.getElementById(`status-${rollNo}`);
    if (sel) sel.value = status;
  });
}

// Save attendance for all selected students (using their current status + date)
async function saveSelectedAttendance() {
  const selected = getSelectedRollNos();

  if (selected.length === 0) {
    alert("No students selected");
    return;
  }

  // ensure they all have a date
  const period = document.getElementById("attendancePeriod").value;
  if (!period) {
    alert("Please select a Period first.");
    return;
  }

  for (const rollNo of selected) {
    const dateInput = document.getElementById(`adate-${rollNo}`);
    if (!dateInput || !dateInput.value) {
      alert(`Please select date for roll no ${rollNo}`);
      return;
    }
  }

  // Bulk Conflict Check
  try {
    const period = document.getElementById("attendancePeriod").value; // Re-get just in case
    // (Note: date is per-student but we usually use global date. For bulk check, we assume same date or check all?)
    // The previous logic verified all students have dates.
    // Let's assume most use the top global date, but let's grab the first one's date or just pass one date if they are all same.
    // To be safe, let's just check against the first valid date found, or the global date.
    // The backend `check-bulk` takes ONE date.
    // The UI implies a "Select Date" at the top which updates all.
    const commonDate = document.getElementById("attendanceDate").value;

    const checkRes = await fetch(`${API}/attendance/check-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollNos: selected,
        date: commonDate,
        period
      })
    });
    const checkData = await checkRes.json();

    if (checkData.exists) {
      const confirmOverwrite = confirm(
        `Attendance already exists for ${checkData.existingRollNos.length} student(s) in Period ${period}. Overwrite all?`
      );
      if (!confirmOverwrite) return;
    }
  } catch (err) {
    console.error("Bulk check error:", err);
  }

  try {
    for (const rollNo of selected) {
      await saveAttendance(rollNo, true); // skipCheck = true
    }
    alert("Attendance saved for selected students");
  } catch (err) {
    console.error("Bulk attendance error:", err);
    alert("Error while saving some attendances");
  }
}

// ---------- SELECT ALL HANDLER ----------
const selectAllCheckbox = document.getElementById("selectAllStudents");
if (selectAllCheckbox) {
  selectAllCheckbox.addEventListener("change", () => {
    const checked = selectAllCheckbox.checked;
    document
      .querySelectorAll(".student-select")
      .forEach((cb) => (cb.checked = checked));
  });
}

// ---------- TOP BUTTON HANDLERS ----------
const markPresentBtn = document.getElementById("markPresentBtn");
if (markPresentBtn) {
  markPresentBtn.addEventListener("click", () => {
    setStatusForSelected("Present");
  });
}

const markAbsentBtn = document.getElementById("markAbsentBtn");
if (markAbsentBtn) {
  markAbsentBtn.addEventListener("click", () => {
    setStatusForSelected("Absent");
  });
}

const saveSelectedBtn = document.getElementById("saveSelectedBtn");
if (saveSelectedBtn) {
  saveSelectedBtn.addEventListener("click", () => {
    saveSelectedAttendance();
  });
}

// ---------- LOGOUT ----------
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("userData");
  localStorage.removeItem("selectedSection");
  window.location.href = "index.html";
});

// ---------- INITIAL LOAD ----------
loadStudentsForAttendance();

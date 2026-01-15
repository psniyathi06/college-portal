const parentData = JSON.parse(localStorage.getItem("parentData"));
if (!parentData) {
  window.location.href = "index.html";
}

// ------------ LOGOUT ----------------
function logout() {
  localStorage.removeItem("parentData");
  window.location.href = "index.html";
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

const API = "http://localhost:5000";

async function loadAnalytics() {
  try {
    // ===== Attendance =====
    const attRes = await fetch(`${API}/attendance/${parentData.rollNo}`);
    if (!attRes.ok) throw new Error(`Failed to load attendance: ${attRes.status}`);

    const attData = await attRes.json();
    const attendanceLabels = (attData.attendance || []).map((a) =>
      new Date(a.date).toLocaleDateString()
    );
    const attendanceValues = (attData.attendance || []).map((a) =>
      a.status === "Present" ? 1 : 0
    );

    if (attendanceLabels.length === 0) {
      document.getElementById("attendanceChart").parentElement.innerHTML =
        `<p style="text-align: center; padding: 20px; color: #999;">No attendance data available</p>`;
    } else {
      new Chart(document.getElementById("attendanceChart"), {
        type: "line",
        data: {
          labels: attendanceLabels,
          datasets: [
            {
              label: "Attendance (1 = Present, 0 = Absent)",
              data: attendanceValues,
              borderWidth: 2,
              borderColor: "#2563eb",
              tension: 0.4,
            },
          ],
        },
      });
    }

    // ===== Marks =====
    const marksRes = await fetch(`${API}/marks/${parentData.rollNo}`);
    if (!marksRes.ok) throw new Error(`Failed to load marks: ${marksRes.status}`);

    const marksData = await marksRes.json();
    const allMarks = marksData.marks || [];

    console.log("DEBUG: All Marks Fetched:", allMarks);

    // Reusable chart renderer
    const render = (typeRegex, label, canvasId, containerId, color, max) => {
      const data = allMarks.filter(
        (m) => m.examType && typeRegex.test(m.examType)
      );

      console.log(`DEBUG: Data for ${label}:`, data);

      const container = document.getElementById(containerId);

      if (!data.length) {
        if (container)
          container.innerHTML = `<p style="text-align: center; padding: 20px; color: #999;">No ${label} data available</p>`;
        return;
      }

      if (container) container.classList.remove("hidden");

      new Chart(document.getElementById(canvasId), {
        type: "bar",
        data: {
          labels: data.map((m) => m.subject),
          datasets: [
            {
              label: `${label} Marks`,
              data: data.map((m) => m.marks),
              backgroundColor: color,
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: { beginAtZero: true, max },
          },
          responsive: true,
        },
      });
    };

    // Render all charts
    render(/MID.*1/i, "MID-1", "mid1Chart", "mid1Container", "#10b981", 40);
    render(/MID.*2/i, "MID-2", "mid2Chart", "mid2Container", "#f59e0b", 40);
    render(/UNIT.*1/i, "Unit-1", "unit1Chart", "unit1Container", "#6366f1", 10);
    render(/UNIT.*2/i, "Unit-2", "unit2Chart", "unit2Container", "#8b5cf6", 10);
    render(/FINAL|SEMESTER/i, "Semester", "finalChart", "finalContainer", "#ec4899", 60);

  } catch (err) {
    console.error("Error loading analytics:", err);
    alert("Failed to load analytics. Please try again.");
  }
}

loadAnalytics();

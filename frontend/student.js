// Get student info from login page redirect
const data = JSON.parse(localStorage.getItem("userData"));
const student = data ? data.student : null;

if (!student) {
    alert("No student data found! Login again.");
    window.location.href = "index.html";
}

// Display student info
document.getElementById("studentName").innerText = "Name: " + student.name;
document.getElementById("studentRoll").innerText = "Roll No: " + student.rollNo;


// =================== LOAD ATTENDANCE ===================
// =================== LOAD ATTENDANCE ===================
async function loadAttendance() {
    try {
        const res = await fetch(`http://localhost:5000/attendance/${student.rollNo}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const records = data.attendance || [];

        // 1. Overall Stats
        if (records.length === 0) {
            document.getElementById("attendancePercentage").innerText = "N/A";
            document.getElementById("attendanceDetails").innerText = "No records";
            document.getElementById("subjectAttendanceGrid").innerHTML = "<p>No data</p>";
            return;
        }

        const totalClasses = records.length;
        const presentClasses = records.filter(a => a.status === 'Present').length;
        const overallPercent = ((presentClasses / totalClasses) * 100).toFixed(1);

        const percEl = document.getElementById("attendancePercentage");
        percEl.innerText = `${overallPercent}%`;
        document.getElementById("attendanceDetails").innerText = `${presentClasses} / ${totalClasses} Days`;

        // Color coding
        if (overallPercent < 75) percEl.style.color = "var(--color-error)";
        else percEl.style.color = "var(--color-success)";

        // 2. Subject-wise Stats
        const subjects = {};
        records.forEach(r => {
            const sub = r.subject || "Unknown";
            if (!subjects[sub]) subjects[sub] = { total: 0, present: 0 };
            subjects[sub].total++;
            if (r.status === "Present") subjects[sub].present++;
        });

        const grid = document.getElementById("subjectAttendanceGrid");
        grid.innerHTML = "";

        for (const [sub, stats] of Object.entries(subjects)) {
            const subPerc = ((stats.present / stats.total) * 100).toFixed(0);
            const colorClass = subPerc < 75 ? "text-error" : "text-success"; // You might need CSS for this or inline style
            const colorStyle = subPerc < 75 ? "var(--color-error)" : "var(--color-success)";

            grid.innerHTML += `
                <div class="card" style="padding: 15px; text-align: center; border: 1px solid var(--color-border-normal);">
                    <h4 style="margin-bottom: 5px; font-size: 0.9rem;">${sub}</h4>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${colorStyle}">${subPerc}%</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-tertiary);">${stats.present}/${stats.total}</div>
                </div>
            `;
        }

    } catch (err) {
        console.error("Error loading attendance:", err);
        document.getElementById("attendancePercentage").innerText = "Error";
    }
}
loadAttendance();


// =================== LOAD MARKS ===================
async function loadMarks() {
    try {
        const res = await fetch(`http://localhost:5000/marks/${student.rollNo}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const container = document.getElementById("marksContainer");
        const marks = data.marks || [];

        if (marks.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No marks records available</p>';
            return;
        }

        container.innerHTML = ""; // Clear loader

        // Group by Exam Type
        const groupedMarks = {};
        marks.forEach(m => {
            const type = m.examType || "Other";
            if (!groupedMarks[type]) groupedMarks[type] = [];
            groupedMarks[type].push(m);
        });

        // Generate Tables for each type
        for (const [type, records] of Object.entries(groupedMarks)) {
            // Create Section Header
            let displayType = type.toUpperCase();
            if (displayType === "FINAL") displayType = "SEMESTER";

            const header = document.createElement("h4");
            header.style.marginTop = "20px";
            header.style.marginBottom = "10px";
            header.style.color = "var(--color-primary)";
            header.style.borderBottom = "2px solid var(--color-border-normal)";
            header.style.paddingBottom = "5px";
            header.innerText = displayType;
            container.appendChild(header);

            // Create Table
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.marginBottom = "20px";
            table.innerHTML = `
                <thead>
                    <tr>
                        <th style="text-align: left;">Subject</th>
                        <th style="text-align: left;">Marks</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector("tbody");
            records.forEach(m => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${m.subject}</td>
                    <td><strong>${m.marks}</strong></td>
                `;
                tbody.appendChild(tr);
            });

            container.appendChild(table);
        }

    } catch (err) {
        console.error("Error loading marks:", err);
        document.getElementById("marksContainer").innerHTML = '<p class="text-error">Failed to load marks</p>';
    }
}
loadMarks();


// =================== LOAD RISK FROM REDIS ===================
async function loadRisk() {
    try {
        const res = await fetch(`http://localhost:5000/auth/parent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rollNo: student.rollNo,
                password: "kmit123"
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const attBox = document.getElementById("attendanceRisk");
        const marksBox = document.getElementById("marksRisk");

        if (!data.alerts) {
            attBox.innerText = "⚠ Unable to load status";
            marksBox.innerText = "⚠ Unable to load status";
            return;
        }

        if (data.alerts.attendance) {
            attBox.className = "badge badge-error";
            attBox.innerText = "⚠ At Risk";
        } else {
            attBox.className = "badge badge-success";
            attBox.innerText = "✔ Safe";
        }

        // Marks
        if (data.alerts.marks) {
            marksBox.className = "badge badge-error";
            marksBox.innerText = "⚠ At Risk";
        } else {
            marksBox.className = "badge badge-success";
            marksBox.innerText = "✔ Safe";
        }
    } catch (err) {
        console.error("Error loading risk status:", err);
        document.getElementById("attendanceRisk").innerText = "⚠ Error";
        document.getElementById("marksRisk").innerText = "⚠ Error";
    }
}
loadRisk();

// =================== LOGOUT ===================
function logout() {
    localStorage.removeItem("userData");
    window.location.href = "index.html";
}

const logoutBtn = document.querySelector(".logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

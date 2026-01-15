const parentData = JSON.parse(localStorage.getItem("parentData"));

async function loadAlerts() {
    try {
        if (!parentData) {
            window.location.href = "index.html";
            return;
        }

        // 1. Attendance Logic
        const attRes = await fetch(`http://localhost:5000/attendance/${parentData.rollNo}`);
        const attData = await attRes.json();
        const totalClasses = attData.attendance ? attData.attendance.length : 0;
        const presentClasses = attData.attendance ? attData.attendance.filter(a => a.status === "Present").length : 0;
        const attPercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 100;
        const isAttRisk = attPercentage < 75;

        document.getElementById("attAlert").innerHTML =
            isAttRisk ?
                '<span class="badge badge-error">⚠ Attendance at Risk (< 75%)</span>' :
                '<span class="badge badge-success">✔ Attendance Safe</span>';


        // 2. Marks Logic (Detailed Alerts)
        const marksRes = await fetch(`http://localhost:5000/marks/${parentData.rollNo}`);
        const marksData = await marksRes.json();
        const marks = marksData.marks || [];

        let riskList = [];

        // 3. New Logic: Mid Average < 14 check
        const subjectMarks = {};
        for (const m of marks) {
            if (!m.subject) continue;
            if (!subjectMarks[m.subject]) subjectMarks[m.subject] = { mid1: 0, mid2: 0, hasMid1: false, hasMid2: false };

            const et = m.examType.toUpperCase();
            if (et === "MID-1") {
                subjectMarks[m.subject].mid1 = parseFloat(m.marks);
                subjectMarks[m.subject].hasMid1 = true;
            }
            if (et === "MID-2") {
                subjectMarks[m.subject].mid2 = parseFloat(m.marks);
                subjectMarks[m.subject].hasMid2 = true;
            }
        }

        // Check averages
        for (const [subj, data] of Object.entries(subjectMarks)) {
            if (data.hasMid1 && data.hasMid2) {
                const avg = (data.mid1 + data.mid2) / 2;
                if (avg < 14) {
                    riskList.push(`Low Mid Average in <b>${subj}</b> (${avg}/40)`);
                }
            }
        }

        // Specific Exam Checks
        for (const m of marks) {
            const et = m.examType.toUpperCase();
            const score = parseFloat(m.marks);
            const subject = m.subject || "Unknown";

            // 1. Mid Exams (< 14/40)
            if ((et === "MID-1" || et === "MID-2") && score < 14) {
                riskList.push(`Low marks in <b>${subject}</b> in <b>${m.examType}</b> (${score}/40)`);
            }
            // 2. Unit Tests (< 4/10)
            if ((et === "UNIT-1" || et === "UNIT-2") && score < 4) {
                riskList.push(`Low marks in <b>${subject}</b> in <b>${m.examType}</b> (${score}/10)`);
            }
            // 3. Semester (< 24/60)
            if ((et === "FINAL" || et === "SEMESTER") && score < 24) {
                riskList.push(`Low marks in <b>${subject}</b> in <b>Semester</b> (${score}/60)`);
            }
        }

        if (riskList.length > 0) {
            const riskHtml = riskList.map(msg => `<div style="margin-top:4px;">• ${msg}</div>`).join("");
            document.getElementById("marksAlert").innerHTML =
                `<div class="badge badge-error" style="display:block; text-align:left; line-height:1.4;">
                    <strong>⚠ Marks at Risk:</strong>
                    ${riskHtml}
                 </div>`;
        } else {
            document.getElementById("marksAlert").innerHTML =
                '<span class="badge badge-success">✔ Marks Safe</span>';
        }

    } catch (err) {
        console.error("Error loading alerts:", err);
        document.getElementById("attAlert").innerText = "⚠ Error loading alerts";
        document.getElementById("marksAlert").innerText = "⚠ Error loading alerts";
    }
}

loadAlerts();

// ------------ LOGOUT ----------------
function logout() {
    localStorage.removeItem("parentData");
    window.location.href = "index.html";
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

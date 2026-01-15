// ------------ LOAD PARENT DATA -------------
const parentData = JSON.parse(localStorage.getItem("parentData"));
if (!parentData) window.location.href = "index.html";

document.getElementById("parentName").innerText = "Parent Dashboard";

// ------------ LOAD STUDENT PROFILE -------------
async function loadHome() {
    try {
        // fetch student from backend
        const studentRes = await fetch(`http://localhost:5000/auth/parent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parentData)
        });

        if (!studentRes.ok) throw new Error(`HTTP ${studentRes.status}`);

        const result = await studentRes.json();

        if (!result.student) {
            alert("Invalid login session!");
            logout();
            return;
        }

        const student = result.student;

        // show details
        document.getElementById("studentName").innerText = "Name: " + student.name;
        document.getElementById("studentRoll").innerText = "Roll: " + student.rollNo;


        // ---------------- ALERT POPUP (Frontend Calculation) ----------------
        // Fetch marks to calculate risks live, bypassing backend worker delays
        let riskList = [];
        try {
            const marksRes = await fetch(`http://localhost:5000/marks/${student.rollNo}`);
            const marksData = await marksRes.json();
            const marks = marksData.marks || [];

            // 1. Check Mid Averages
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

            for (const [subj, data] of Object.entries(subjectMarks)) {
                if (data.hasMid1 && data.hasMid2) {
                    const avg = (data.mid1 + data.mid2) / 2;
                    if (avg < 14) {
                        riskList.push(`Low Mid Average risk in ${subj} (${avg}/40)`);
                    }
                }
            }

            // 2. Specific Exam Checks
            for (const m of marks) {
                const et = m.examType.toUpperCase();
                const score = parseFloat(m.marks);
                const subject = m.subject || "Unknown";

                if ((et === "MID-1" || et === "MID-2") && score < 14) {
                    riskList.push(`Low marks risk in ${subject} (${m.examType})`);
                }
                if ((et === "UNIT-1" || et === "UNIT-2") && score < 4) {
                    riskList.push(`Low marks risk in ${subject} (${m.examType})`);
                }
                if ((et === "FINAL" || et === "SEMESTER") && score < 24) {
                    riskList.push(`Low marks risk in ${subject} (Semester)`);
                }
            }
        } catch (markErr) {
            console.error("Error fetching marks for alerts:", markErr);
        }

        const hasAttRisk = result.alerts && result.alerts.attendance;
        const hasMarksRisk = riskList.length > 0;

        if (hasAttRisk || hasMarksRisk) {
            let alertMsg = "⚠ Your child is at risk:\n";
            if (hasAttRisk) alertMsg += "- Low Attendance\n";

            if (hasMarksRisk) {
                riskList.forEach(msg => {
                    alertMsg += `- ${msg}\n`;
                });
            }

            // Small delay to ensure UI renders first
            setTimeout(() => alert(alertMsg), 100);
        }
    } catch (err) {
        console.error("Error loading home:", err);
        alert("Failed to load student data. Please try again.");
    }
}
loadHome();


// ---------------- LOGOUT ----------------
function logout() {
    localStorage.removeItem("parentData");
    window.location.href = "index.html";
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

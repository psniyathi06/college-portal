
const roleSelect = document.getElementById("role");
const msg = document.getElementById("msg");

// Toggle fields based on role
// Toggle fields based on role - REMOVED (Single login form)
// roleSelect.addEventListener("change", () => { ... });

// LOGIN LOGIC
document.getElementById("loginBtn").addEventListener("click", async () => {
    msg.style.color = "black";
    msg.innerText = "Checking...";

    let url = "";
    let body = {};

    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    // SELECT URL + BODY BASED ON ROLE
    if (roleSelect.value === "student") {
        url = "http://localhost:5000/auth/student";
        body = {
            rollNo: usernameInput,
            password: passwordInput
        };
    }

    else if (roleSelect.value === "parent") {
        url = "http://localhost:5000/auth/parent";
        body = {
            rollNo: usernameInput,
            password: passwordInput
        };
    }

    else if (roleSelect.value === "teacher") {
        url = "http://localhost:5000/auth/teacher";
        body = {
            name: usernameInput,
            password: passwordInput
        };
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        // Safety: make sure message exists and is a string
        if (data.message && data.message.includes("successful")) {
            msg.style.color = "green";
            msg.innerText = "Login successful! Redirecting...";

            if (roleSelect.value === "student") {
                // store student cleanly if you want later
                localStorage.setItem("userData", JSON.stringify({
                    student: data.student
                }));
                window.location.href = "student.html";
            }

            else if (roleSelect.value === "parent") {
                // we only really need rollNo for parent
                localStorage.setItem("parentData", JSON.stringify({
                    rollNo: body.rollNo,
                    password: body.password
                }));
                window.location.href = "parent_home.html";
            }

            else if (roleSelect.value === "teacher") {
                // 🔥 IMPORTANT: store full teacher object in a predictable way
                localStorage.setItem("userData", JSON.stringify({
                    teacher: data.teacher
                }));
                // 🔥 IMPORTANT: go to teacher_home.html (section selector)
                window.location.href = "teacher_home.html";
            }

            return;
        }

        // ----------------- FAILED LOGIN -----------------
        msg.style.color = "red";
        msg.innerText = data.message || "Invalid credentials!";
    } catch (err) {
        console.error("Login error:", err);
        msg.style.color = "red";
        msg.innerText = "Server error!";
    }
});

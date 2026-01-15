console.log("AUTH ROUTES LOADED!!!");
const express = require("express");
const Student = require("../models/student");
const Teacher = require("../models/teacher");
const Parent = require("../models/parent");
const redisClient = require("../utils/redis").client;

const router = express.Router();

/* ============================
      STUDENT LOGIN
   POST /auth/student
=============================== */
router.post("/student", async (req, res) => {
  try {
    const { rollNo, password } = req.body;

    if (!rollNo || !password) {
      return res.status(400).json({ message: "rollNo and password required" });
    }

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Plain text password check; all passwords = "kmit123"
    if (student.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Student login successful", student });
  } catch (err) {
    console.error("Student auth error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ============================
      TEACHER LOGIN
   POST /auth/teacher
=============================== */
router.post("/teacher", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "name and password required" });
    }

    const teacher = await Teacher.findOne({
      $or: [{ name: name }, { email: name }]
    });
    if (!teacher) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (teacher.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Teacher login successful", teacher });
  } catch (err) {
    console.error("Teacher auth error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ============================
       PARENT LOGIN + ALERTS
   POST /auth/parent
=============================== */
router.post("/parent", async (req, res) => {
  try {
    const { rollNo, password } = req.body;

    if (!rollNo || !password) {
      return res.status(400).json({ message: "rollNo (student roll number) and password required" });
    }

    // 1. Find the Parent by studentRollNo
    // The frontend sends "rollNo" from the input field
    const parent = await Parent.findOne({ studentRollNo: rollNo });
    if (!parent) {
      return res.status(400).json({ message: "Invalid credentials (parent not found)" });
    }

    // 2. Check password
    if (parent.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Find the associated Student
    const student = await Student.findOne({ rollNo });
    if (!student) {
      // Should not happen if data is consistent, but handle it
      return res.status(404).json({ message: "Linked student not found" });
    }

    // 4. Fetch Risk Data (Redis) - optional
    let attendanceAlert = false;
    let marksRisks = [];

    try {
      // Key matches set_risk_data.js: `risk:${rollNo}`
      const riskData = await redisClient.get(`risk:${rollNo}`);
      if (riskData) {
        const risk = JSON.parse(riskData);
        attendanceAlert = !!risk.attendance_risk;
        marksRisks = risk.marks_risks || []; // Now expects a list strings
      }
    } catch (redisErr) {
      console.error("Redis fetch error (ignoring):", redisErr);
      // Don't fail the login if redis fails
    }

    res.json({
      message: "Parent login successful",
      student,
      alerts: {
        attendance: attendanceAlert,
        marksRisks: marksRisks, // Send the list
      },
    });
  } catch (err) {
    console.error("Parent auth error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ============================
      REGISTER TEACHER
   POST /auth/register
=============================== */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email, password are required" });
    }

    const teacherExists = await Teacher.findOne({
      $or: [{ email }, { name }],
    });

    if (teacherExists) {
      return res.status(400).json({ message: "Teacher already exists" });
    }

    const newTeacher = new Teacher({
      name,
      email,
      password, // plain "kmit123" if you want
      role: "mentor",
      sections: [],
    });

    await newTeacher.save();

    res.json({
      message: "Teacher registered successfully",
      teacher: newTeacher,
    });
  } catch (err) {
    console.error("Teacher register error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================
       TEST ROUTE
=============================== */
router.get("/ping", (req, res) => {
  res.send("AUTH WORKING");
});

module.exports = router;

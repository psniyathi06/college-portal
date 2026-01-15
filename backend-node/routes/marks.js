const express = require("express");
const Marks = require("../models/marks");
const Attendance = require("../models/attendance");
const { sendToQueue } = require("../utils/rabbitmq");

const router = express.Router();

// HELPER → calculate attendance %
async function calculateAttendancePercent(rollNo) {
  const total = await Attendance.countDocuments({ rollNo });
  const presentDays = await Attendance.countDocuments({
    rollNo,
    status: "Present",
  });

  if (total === 0) return 0;

  return Math.round((presentDays / total) * 100);
}

// HELPER → calculate average marks
async function calculateAvgMarks(rollNo) {
  const records = await Marks.find({ rollNo });
  if (records.length === 0) return 0;

  const sum = records.reduce((a, b) => a + b.marks, 0);
  return Math.round(sum / records.length);
}

// TEACHER UPDATES MARKS
router.post("/update", async (req, res) => {
  try {
    const { rollNo, subject, examType, marks, maxMarks, date } = req.body;

    if (!rollNo || !subject || !examType || marks == null) {
      return res.status(400).json({
        message: "rollNo, subject, examType, marks are required",
      });
    }

    // Upsert: update if exists, otherwise create
    const record = await Marks.findOneAndUpdate(
      { rollNo, subject, examType },
      {
        rollNo,
        subject,
        examType,
        marks,
        maxMarks: maxMarks ?? (examType === "FINAL" ? 100 : 30),
        date: date ? new Date(date) : Date.now(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    const attendancePercent = await calculateAttendancePercent(rollNo);
    const allMarks = await Marks.find({ rollNo }); // Fetch all marks for risk analysis

    sendToQueue(
      JSON.stringify({
        type: "marks_update",
        rollNo,
        attendance: attendancePercent,
        marks: allMarks, // Send full list
      })
    );

    res.json({
      message: "Marks updated successfully (ML triggered)",
      record,
      attendancePercent,
      avgMarks,
    });
  } catch (err) {
    console.error("Marks update error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET MARKS OF A STUDENT
router.get("/:rollNo", async (req, res) => {
  try {
    const { rollNo } = req.params;

    const records = await Marks.find({ rollNo }).sort({ date: 1 });

    res.json({
      marks: records,
    });
  } catch (err) {
    console.error("Get marks error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

const express = require("express");
const Attendance = require("../models/attendance");
const Marks = require("../models/marks");
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

// HELPER → get latest average marks
async function getLatestMarks(rollNo) {
  const records = await Marks.find({ rollNo });

  if (records.length === 0) return 0;

  const sum = records.reduce((a, b) => a + b.marks, 0);
  return Math.round(sum / records.length);
}
// CHECK BULK ATTENDANCE (to warn before overwrite)
router.post("/check-bulk", async (req, res) => {
  try {
    const { rollNos, date, period } = req.body;

    if (!rollNos || !Array.isArray(rollNos) || !date || !period) {
      return res.status(400).json({ message: "rollNos (array), date, and period required" });
    }

    // Find all attendance records for these students on this date & period
    const existing = await Attendance.find({
      rollNo: { $in: rollNos },
      date,
      period
    });

    const existingRollNos = existing.map(r => r.rollNo);

    res.json({
      exists: existingRollNos.length > 0,
      existingRollNos
    });
  } catch (err) {
    console.error("Check bulk error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// TEACHER UPDATES ATTENDANCE
router.post("/update", async (req, res) => {
  try {
    const { rollNo, date, status, period, subject } = req.body; // Added subject

    if (!rollNo || !date || !status || !period || !subject) {
      return res.status(400).json({ message: "rollNo, date, status, period, and subject are required" });
    }

    // Use findOneAndUpdate with upsert: true
    const record = await Attendance.findOneAndUpdate(
      { rollNo, date, period },
      { status, subject }, // Update subject too
      { new: true, upsert: true }
    );

    const attendancePercent = await calculateAttendancePercent(rollNo);
    const avgMarks = await getLatestMarks(rollNo);

    sendToQueue(
      JSON.stringify({
        type: "attendance_update",
        rollNo,
        attendance: attendancePercent,
        marks: avgMarks,
      })
    );

    res.json({
      message: "Attendance updated successfully",
      attendancePercent,
      avgMarks,
    });
  } catch (err) {
    console.error("Attendance update error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET ATTENDANCE BY ROLL NO
router.get("/:rollNo", async (req, res) => {
  try {
    const { rollNo } = req.params;

    const records = await Attendance.find({ rollNo }).sort({ date: 1, period: 1 });

    res.json({
      attendance: records,
    });
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

const express = require("express");
const Student = require("../models/student");

const router = express.Router();

// GET /teacher/students?teacherId=xxxx[&section=A]
// GET /teacher/students?teacherId=xxxx[&section=A]
router.get("/students", async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const section = req.query.section; // optional

    if (!teacherId) {
      return res.status(400).json({ error: "teacherId required" });
    }

    let filter = {};

    // If section is provided, we fetch ALL students in that section
    // (This allows Subject Teachers to see students even if they aren't the Class Teacher)
    if (section) {
      filter.section = section;
    } else {
      // If no section provided, default to showing "My Class" (Class Teacher logic)
      filter.classTeacher = teacherId;
    }

    const students = await Student.find(filter).select("rollNo name section");

    res.json({ students });
  } catch (err) {
    console.error("Get teacher students error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

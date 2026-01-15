const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    rollNo: { type: String, required: true }, // e.g., "101"
    date: { type: String, required: true },   // e.g., "2025-11-21"
    status: { type: String, enum: ["Present", "Absent"], required: true },
    period: { type: String, required: true }, // e.g., "1", "2", "3", "4"
    subject: { type: String, required: true }, // e.g., "Physics"
  },
  { timestamps: true }
);

// Unique attendance per student, per day, per PERIOD
AttendanceSchema.index({ rollNo: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);

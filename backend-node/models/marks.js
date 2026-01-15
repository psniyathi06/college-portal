/*const mongoose = require("mongoose");

const MarksSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  subject: { type: String, required: true },
  marks: { type: Number, required: true },
  date: { type: String, required: true }   // e.g., "2025-11-21"
});

module.exports = mongoose.model("Marks", MarksSchema);
*/

const mongoose = require("mongoose");

const MarksSchema = new mongoose.Schema(
  {
    rollNo: { type: String, required: true },          // "101"
    subject: { type: String, required: true },         // "Physics"

    examType: {
      type: String,
      required: true,
      enum: ["MID-1", "MID-2", "UNIT-1", "UNIT-2", "FINAL"],
    },

    marks: { type: Number, required: true },
    maxMarks: { type: Number, default: 30 },

    academicYear: { type: String, default: "2025-26" },
    semester: { type: Number, default: 3 },

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// unique: one record per (student, subject, examType)
MarksSchema.index({ rollNo: 1, subject: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model("Marks", MarksSchema);

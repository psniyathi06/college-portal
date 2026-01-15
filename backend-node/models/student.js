/*const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },

  // New field — link student to teacher
  classTeacher: { type: String, required: true }, // teacher email

  // Parent linking
  parentRollNo: { type: String, required: true },
});

module.exports = mongoose.model("Student", StudentSchema);
*/

const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    rollNo: { type: String, required: true, unique: true }, // "101"
    name: { type: String, required: true },

    password: { type: String, required: true }, // "kmit123"

    section: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D"],
    },

    branch: { type: String, default: "CSE" },
    semester: { type: Number, default: 3 },

    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    parentRollNo: { type: String }, // same as rollNo, e.g., "101"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);

/*const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model("Teacher", TeacherSchema);
*/

const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },                 // "Teacher A"
    email: { type: String, required: true, unique: true },  // "teacherA@example.com"
    password: { type: String, required: true },             // "kmit123"

    role: {
      type: String,
      enum: ["mentor", "admin"],
      default: "mentor",
    },

    sections: [
      {
        type: String,
        enum: ["A", "B", "C", "D"],
        required: true,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);

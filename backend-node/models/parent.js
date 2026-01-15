/*const mongoose = require("mongoose");

const ParentSchema = new mongoose.Schema({
  studentRollNo: { type: String, required: true }, // child’s roll number
  password: { type: String, required: true }
});

module.exports = mongoose.model("Parent", ParentSchema);
*/

const mongoose = require("mongoose");

const ParentSchema = new mongoose.Schema(
  {
    studentRollNo: { type: String, required: true }, // "101"
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },      // "kmit123"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Parent", ParentSchema);


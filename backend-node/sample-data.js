// Run using: node sample-data.js

const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/student");
const Teacher = require("./models/teacher");
const Parent = require("./models/parent");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/college_portal";

async function insertData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Parent.deleteMany({});
    console.log("🧹 Old data cleared.");

    const password = "kmit123"; // plain password everywhere

    // 1) TEACHERS
    const teachers = await Teacher.insertMany([
      {
        name: "Teacher A",
        email: "teacherA@example.com",
        password,
        role: "mentor",
        sections: ["A", "B"],
      },
      {
        name: "Teacher B",
        email: "teacherB@example.com",
        password,
        role: "mentor",
        sections: ["C", "D"],
      },
    ]);
    console.log("✅ Teachers inserted.");

    const teacherA = teachers[0];
    const teacherB = teachers[1];

    // 2) STUDENTS (40) rollNo 101–140
    // -------------------------
// 2) STUDENTS (20 → Sections A & B)
// -------------------------
const students = [];

// Only ONE teacher (Teacher A) teaches A & B
const teacher = teachers[0];

for (let i = 1; i <= 20; i++) {
  const roll = (100 + i).toString(); // "101".."120"
  const section = i <= 10 ? "A" : "B";

  students.push({
    rollNo: roll,
    name: `Student ${i}`,
    password,
    section,
    branch: "CSE",
    semester: 3,
    classTeacher: teacherA._id,
    parentRollNo: roll,
  });
}

await Student.insertMany(students);
console.log("✅ 20 Students inserted into A & B.");


    // 3) PARENTS (40)
    const parents = [];

    for (let i = 1; i <= 40; i++) {
      const roll = (100 + i).toString();
      parents.push({
        studentRollNo: roll,
        name: `Parent of Student ${i}`,
        email: `parent${i}@example.com`,
        password, // "kmit123"
      });
    }

    await Parent.insertMany(parents);
    console.log("✅ 40 Parents inserted.");

    console.log("\n🔥 SAMPLE DATA INSERTED SUCCESSFULLY 🔥");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

insertData();

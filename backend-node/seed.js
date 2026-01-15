// seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Student = require("./models/student");
const Teacher = require("./models/teacher");
const Parent = require("./models/parent");
const Marks = require("./models/marks");
const Attendance = require("./models/attendance");

const MONGODB_URI = "mongodb://127.0.0.1:27017/college_portal"; // change if needed

async function connectDB() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected to MongoDB");
}

async function seed() {
  try {
    await connectDB();

    console.log("🧹 Clearing old data...");
    await Promise.all([
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Parent.deleteMany({}),
      Marks.deleteMany({}),
      Teacher.deleteMany({}),
      Parent.deleteMany({}),
      Marks.deleteMany({}),
      // Drop Attendance collection to remove old indexes (like unique-per-day) that might block multiple periods
      mongoose.connection.collection("attendances").drop().catch(err => console.log("Attendance collection did not exist, skipping drop")),
    ]);

    // 2️⃣ Create teachers
    const passwordHash = await bcrypt.hash("password123", 10);

    // Subject Teachers (Requested by User)
    const physicsTeacher = await Teacher.create({
      name: "Physics Teacher",
      email: "physics@college.com",
      password: "physics.kmit",
      sections: [], // handled by frontend mapping
    });

    const mathTeacher = await Teacher.create({
      name: "Math Teacher",
      email: "math@college.com",
      password: "math.kmit",
      sections: [],
    });

    const englishTeacher = await Teacher.create({
      name: "English Teacher",
      email: "english@college.com",
      password: "english.kmit",
      sections: [],
    });

    const chemistryTeacher = await Teacher.create({
      name: "Chemistry Teacher",
      email: "chemistry@college.com",
      password: "chemistry.kmit",
      sections: [],
    });

    console.log("✅ Teachers created: Physics, Math, English, Chemistry");

    // 2️⃣ Create 40 students in 4 sections
    const sections = ["A", "B", "C", "D"];
    const studentsToInsert = [];
    const parentsToInsert = [];

    for (let i = 1; i <= 40; i++) {
      const rollNo = String(100 + i); // 101..140

      const secIndex = Math.floor((i - 1) / 10); // 0..3
      const section = sections[secIndex];

      // Assign Class Teacher roughly by section logic
      let teacherId = physicsTeacher._id;
      if (section === "B") teacherId = mathTeacher._id;
      if (section === "A") teacherId = englishTeacher._id;

      // For now, let's just default all to PhysicsTeacher to be safe.
      teacherId = physicsTeacher._id;

      studentsToInsert.push({
        rollNo,
        name: `Student ${i}`,
        section,
        branch: "CSE",
        semester: 3,
        classTeacherId: teacherId,
        password: "kmit123", // Password required by schema
      });

      parentsToInsert.push({
        studentRollNo: rollNo,
        name: `Parent of Student ${i}`,
        email: `parent${i}@example.com`,
        password: "kmit123", // Matches user requirement & simple auth logic
      });
    }

    const students = await Student.insertMany(studentsToInsert);
    const parents = await Parent.insertMany(parentsToInsert);

    console.log(`✅ Inserted ${students.length} students`);
    console.log(`✅ Inserted ${parents.length} parents`);

    // 3️⃣ Insert marks for each student
    // const examTypes = ["MID-1", "MID-2", "UNIT-1", "UNIT-2", "FINAL"];
    // const subjects = ["Physics", "Maths", "Chemistry"];

    // const marksDocs = [];

    // for (const student of students) {
    //   for (const subject of subjects) {
    //     for (const examType of examTypes) {
    //       // Just random-ish marks for demo
    //       const randomMarks =
    //         examType === "FINAL"
    //           ? 50 + Math.floor(Math.random() * 51) // 50-100
    //           : 10 + Math.floor(Math.random() * 21); // 10-30

    //       const maxMarks = examType === "FINAL" ? 100 : 30;

    //       marksDocs.push({
    //         rollNo: student.rollNo,
    //         subject,
    //         examType,
    //         marks: randomMarks,
    //         maxMarks,
    //         academicYear: "2025-26",
    //         semester: 3,
    //       });
    //     }
    //   }
    // }

    // await Marks.insertMany(marksDocs);
    // console.log(`✅ Inserted ${marksDocs.length} marks records`);
    console.log(`✅ Skipped marks insertion (Requested by user)`);

    // 4️⃣ Insert Dummy Attendance (with Subjects)
    // const attendanceDocs = [];
    // const dates = ["2025-12-01", "2025-12-02", "2025-12-03", "2025-12-04", "2025-12-05"];

    // // Map period to subject for seeding
    // const periodMap = {
    //   "1": "Physics",
    //   "2": "Maths",
    //   "3": "Chemistry"
    // };

    // for (const student of students) {
    //   for (const date of dates) {
    //     for (const [period, subject] of Object.entries(periodMap)) {
    //       attendanceDocs.push({
    //         rollNo: student.rollNo,
    //         date,
    //         period,
    //         subject, // NEW FIELD
    //         status: Math.random() > 0.1 ? "Present" : "Absent" // 90% attendance
    //       });
    //     }
    //   }
    // }

    // // We already dropped the collection above, so it's safe to insert
    // const Attendance = require("./models/attendance");
    // await Attendance.insertMany(attendanceDocs);
    // console.log(`✅ Inserted ${attendanceDocs.length} attendance records with subjects`);
    console.log(`✅ Skipped attendance insertion (Requested by user)`);


    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error while seeding:", err);
    process.exit(1);
  }
}

seed();

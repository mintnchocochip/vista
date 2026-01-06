import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Models
import Faculty from "../../models/facultySchema.js";
import Student from "../../models/studentSchema.js";
import Project from "../../models/projectSchema.js";
import ProjectCoordinator from "../../models/projectCoordinatorSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const loadData = async (filename) => {
  const filePath = path.join(__dirname, "data", filename);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
};

const seedFaculty = async () => {
  console.log("Seeding Faculty...");
  const facultyList = await loadData("faculty.json");

  for (const f of facultyList) {
    // Hash password if not already encrypted (assuming simple check or just always hash plain text from json)
    // To allow rerunning, we might need to check if password changed, but for dummy data, let's just hash.
    const hashedPassword = await bcrypt.hash(f.password, 10);

    const facultyData = { ...f, password: hashedPassword };
    delete facultyData.isProjectCoordinator; // Handled separately

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { emailId: f.emailId },
      { $set: facultyData },
      { new: true, upsert: true }
    );
    console.log(`Upserted Faculty: ${updatedFaculty.emailId}`);

    if (f.isProjectCoordinator) {
      await ProjectCoordinator.findOneAndUpdate(
        { faculty: updatedFaculty._id },
        {
          $set: {
            faculty: updatedFaculty._id,
            school: f.school,
            department: f.department,
            academicYear: "2025-2026", // Default or from JSON if added
            isPrimary: true, // Defaulting to true for dummy data
            isActive: true,
          },
        },
        { upsert: true }
      );
      console.log(
        `Upserted Project Coordinator for: ${updatedFaculty.emailId}`
      );
    }
  }
};

const seedStudents = async () => {
  console.log("Seeding Students...");
  const studentList = await loadData("students.json");

  for (const s of studentList) {
    const updatedStudent = await Student.findOneAndUpdate(
      { regNo: s.regNo },
      { $set: s },
      { new: true, upsert: true }
    );
    console.log(`Upserted Student: ${updatedStudent.regNo}`);
  }
};

const seedProjects = async () => {
  console.log("Seeding Projects...");
  const projectList = await loadData("projects.json");

  for (const p of projectList) {
    // Resolve guide
    const guide = await Faculty.findOne({ emailId: p.guideEmail });
    if (!guide) {
      console.warn(`Guide not found for project ${p.name}: ${p.guideEmail}`);
      continue;
    }

    // Resolve students
    const studentIds = [];
    for (const regNo of p.studentRegNos) {
      const student = await Student.findOne({ regNo });
      if (student) {
        studentIds.push(student._id);
      } else {
        console.warn(`Student not found for project ${p.name}: ${regNo}`);
      }
    }

    const projectData = {
      ...p,
      guideFaculty: guide._id,
      students: studentIds,
    };
    delete projectData.guideEmail;
    delete projectData.studentRegNos;

    await Project.findOneAndUpdate(
      { name: p.name },
      { $set: projectData },
      { upsert: true }
    );
    console.log(`Upserted Project: ${p.name}`);
  }
};

const seed = async () => {
  await connectDB();
  try {
    await seedFaculty();
    await seedStudents();
    await seedProjects();
    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();

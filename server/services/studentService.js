import Student from "../models/studentSchema.js";
import { logger } from "../utils/logger.js";

export class StudentService {
  /**
   * Get students with filters
   */
  static async getStudentList(filters = {}) {
    const query = { isActive: true };

    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;
    if (filters.regNo) query.regNo = { $regex: filters.regNo, $options: "i" };

    return await Student.find(query)
      .populate("guideMarks")
      .populate("panelMarks")
      .lean();
  }

  /**
   * Upload students (bulk)
   */
  static async uploadStudents(
    studentList,
    academicYear,
    school,
    department,
    uploadedBy = null,
  ) {
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
      details: [],
    };

    for (let i = 0; i < studentList.length; i++) {
      const studentData = studentList[i];

      try {
        // Validate required fields
        if (!studentData.regNo || !studentData.name || !studentData.emailId) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error: "Missing required fields: regNo, name, or emailId",
          });
          continue;
        }

        // Check if student exists
        const existing = await Student.findOne({
          regNo: studentData.regNo,
          academicYear,
        });

        if (existing) {
          // Update existing
          existing.name = studentData.name;
          existing.emailId = studentData.emailId;
          existing.PAT = studentData.PAT || false;
          await existing.save();
          results.updated++;
        } else {
          // Create new
          const newStudent = new Student({
            regNo: studentData.regNo,
            name: studentData.name,
            emailId: studentData.emailId,
            PAT: studentData.PAT || false,
            school,
            department,
            academicYear,
            isActive: true,
            approvals: new Map(),
          });
          await newStudent.save();
          results.created++;
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    if (uploadedBy) {
      logger.info("students_uploaded", {
        academicYear,
        school,
        department,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
        uploadedBy,
      });
    }

    return results;
  }
}

import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import { logger } from "../utils/logger.js";

export class ProjectService {
  /**
   * Get projects with filters
   */
  static async getProjectList(filters = {}) {
    const query = {};

    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;
    if (filters.status) query.status = filters.status;
    if (filters.guideFaculty) query.guideFaculty = filters.guideFaculty;
    if (filters.panel) query.panel = filters.panel;

    return await Project.find(query)
      .populate("students", "regNo name emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate("panel", "panelName members venue")
      .lean();
  }

  /**
   * Get guide projects
   */
  static async getGuideProjects(filters = {}) {
    const query = {};
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;

    const projects = await Project.find(query)
      .populate("students", "regNo name")
      .populate("guideFaculty", "name employeeId emailId school department")
      .lean();

    // Group by guide
    const grouped = {};
    projects.forEach((project) => {
      const guideId = project.guideFaculty._id.toString();
      if (!grouped[guideId]) {
        grouped[guideId] = {
          faculty: project.guideFaculty,
          guidedProjects: [],
        };
      }
      grouped[guideId].guidedProjects.push(project);
    });

    return Object.values(grouped);
  }

  /**
   * Get panel projects
   */
  static async getPanelProjects(filters = {}) {
    const query = {};
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;

    const projects = await Project.find(query)
      .populate("students", "regNo name emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate("panel")
      .populate("panel.members.faculty", "name employeeId emailId")
      .lean();

    // Group by panel
    const grouped = {};
    projects.forEach((project) => {
      if (!project.panel) return;

      const panelId = project.panel._id.toString();
      if (!grouped[panelId]) {
        grouped[panelId] = {
          panelId: project.panel._id,
          members: project.panel.members,
          venue: project.panel.venue,
          school: project.panel.school,
          department: project.panel.department,
          projects: [],
        };
      }
      grouped[panelId].projects.push(project);
    });

    return Object.values(grouped);
  }
}

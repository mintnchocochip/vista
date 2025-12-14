import Panel from "../models/panelSchema.js";
import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import departmentConfig from "../models/departmentConfigSchema.js";
import { logger } from "../utils/logger.js";

export class PanelService {
  /**
   * Validate panel members
   */
  static async validatePanelMembers(
    memberEmployeeIds,
    academicYear,
    school,
    department,
  ) {
    // Check for duplicates
    if (new Set(memberEmployeeIds).size !== memberEmployeeIds.length) {
      throw new Error("Duplicate faculty members in panel.");
    }

    // Fetch faculties
    const faculties = await Faculty.find({
      employeeId: { $in: memberEmployeeIds },
    });

    if (faculties.length !== memberEmployeeIds.length) {
      const foundIds = faculties.map((f) => f.employeeId);
      const missing = memberEmployeeIds.filter((id) => !foundIds.includes(id));
      throw new Error(`Faculty not found: ${missing.join(", ")}`);
    }

    // Validate panel size
    const config = await departmentConfig.findOne({
      academicYear,
      school,
      department,
    });
    if (config) {
      if (
        faculties.length < config.minPanelSize ||
        faculties.length > config.maxPanelSize
      ) {
        throw new Error(
          `Panel size must be between ${config.minPanelSize} and ${config.maxPanelSize}.`,
        );
      }
    }

    return faculties;
  }

  /**
   * Create panel
   */
  static async createPanel(data, createdBy = null) {
    const {
      memberEmployeeIds,
      academicYear,
      school,
      department,
      venue,
      specializations = [],
    } = data;

    // Validate members
    const faculties = await this.validatePanelMembers(
      memberEmployeeIds,
      academicYear,
      school,
      department,
    );

    // Build panel members array
    const members = faculties.map((faculty, index) => ({
      faculty: faculty._id,
      role: index === 0 ? "chair" : "member",
    }));

    // Get config for maxProjects
    const config = await departmentConfig.findOne({
      academicYear,
      school,
      department,
    });

    const panel = new Panel({
      panelName: `Panel-${Date.now()}`,
      members,
      venue: venue || "",
      academicYear,
      school,
      department,
      specializations,
      maxProjects: config?.maxPanelSize * 2 || 10,
      assignedProjectsCount: 0,
      isActive: true,
    });

    await panel.save();

    if (createdBy) {
      logger.info("panel_created", {
        panelId: panel._id,
        memberCount: members.length,
        academicYear,
        school,
        department,
        createdBy,
      });
    }

    return panel;
  }

  /**
   * Get panels with filters
   */
  static async getPanelList(filters = {}) {
    const query = { isActive: true };

    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;
    if (filters.specialization) {
      query.specializations = { $in: [filters.specialization] };
    }

    return await Panel.find(query)
      .populate("members.faculty", "name employeeId emailId specialization")
      .lean();
  }

  /**
   * Assign panel to project
   */
  static async assignPanelToProject(panelId, projectId, assignedBy = null) {
    const [panel, project] = await Promise.all([
      Panel.findById(panelId),
      Project.findById(projectId),
    ]);

    if (!panel) throw new Error("Panel not found.");
    if (!project) throw new Error("Project not found.");

    // Check capacity
    if (panel.assignedProjectsCount >= panel.maxProjects) {
      throw new Error("Panel has reached maximum capacity.");
    }

    // Assign panel
    project.panel = panelId;
    panel.assignedProjectsCount += 1;

    await Promise.all([project.save(), panel.save()]);

    if (assignedBy) {
      logger.info("panel_assigned_to_project", {
        panelId,
        projectId,
        assignedBy,
      });
    }

    return { panel, project };
  }

  /**
   * Update panel members
   */
  static async updatePanelMembers(
    panelId,
    memberEmployeeIds,
    updatedBy = null,
  ) {
    const panel = await Panel.findById(panelId);
    if (!panel) throw new Error("Panel not found.");

    const faculties = await this.validatePanelMembers(
      memberEmployeeIds,
      panel.academicYear,
      panel.school,
      panel.department,
    );

    panel.members = faculties.map((faculty, index) => ({
      faculty: faculty._id,
      role: index === 0 ? "chair" : "member",
      addedAt: new Date(),
    }));

    await panel.save();

    if (updatedBy) {
      logger.info("panel_members_updated", {
        panelId,
        newMemberCount: panel.members.length,
        updatedBy,
      });
    }

    return panel;
  }

  /**
   * Auto-create panels based on available faculty
   */
  static async autoCreatePanels(
    departments,
    school,
    academicYear,
    panelSize = 3,
    createdBy = null,
  ) {
    const results = {
      created: 0,
      errors: 0,
      details: [],
    };

    for (const department of departments) {
      try {
        // Get available faculty for this department
        const faculties = await Faculty.find({
          school: { $in: [school] },
          department: { $in: [department] },
          role: "faculty",
          specialization: { $exists: true, $ne: [] },
        }).lean();

        if (faculties.length < panelSize) {
          results.errors++;
          results.details.push({
            department,
            error: `Not enough faculty. Need ${panelSize}, found ${faculties.length}`,
          });
          continue;
        }

        // Group faculty by specialization
        const bySpecialization = {};
        faculties.forEach((f) => {
          f.specialization.forEach((spec) => {
            if (!bySpecialization[spec]) bySpecialization[spec] = [];
            bySpecialization[spec].push(f);
          });
        });

        // Create panels for each specialization
        for (const [specialization, specFaculty] of Object.entries(
          bySpecialization,
        )) {
          const panelCount = Math.floor(specFaculty.length / panelSize);

          for (let i = 0; i < panelCount; i++) {
            const panelMembers = specFaculty.slice(
              i * panelSize,
              (i + 1) * panelSize,
            );

            const panel = await this.createPanel(
              {
                memberEmployeeIds: panelMembers.map((f) => f.employeeId),
                academicYear,
                school,
                department,
                specializations: [specialization],
                venue: "",
              },
              createdBy,
            );

            results.created++;
          }
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          department,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Auto-assign panels to projects based on specialization
   */
  static async autoAssignPanelsToProjects(
    academicYear,
    school,
    department,
    assignedBy = null,
  ) {
    const projects = await Project.find({
      academicYear,
      school,
      department,
      panel: null,
      status: "active",
    });

    const results = {
      assigned: 0,
      errors: 0,
      details: [],
    };

    for (const project of projects) {
      try {
        // Find suitable panel
        const panel = await Panel.findOne({
          academicYear,
          school,
          department,
          specializations: { $in: [project.specialization] },
          isActive: true,
          $expr: { $lt: ["$assignedProjectsCount", "$maxProjects"] },
        }).sort({ assignedProjectsCount: 1 });

        if (!panel) {
          results.errors++;
          results.details.push({
            projectId: project._id,
            error: "No available panel found",
          });
          continue;
        }

        await this.assignPanelToProject(panel._id, project._id, assignedBy);
        results.assigned++;
      } catch (error) {
        results.errors++;
        results.details.push({
          projectId: project._id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Delete panel
   */
  static async deletePanel(panelId, deletedBy = null) {
    // Check if panel has assigned projects
    const projectCount = await Project.countDocuments({ panel: panelId });

    if (projectCount > 0) {
      throw new Error(
        `Cannot delete panel with ${projectCount} assigned projects.`,
      );
    }

    const panel = await Panel.findByIdAndDelete(panelId);

    if (!panel) {
      throw new Error("Panel not found.");
    }

    if (deletedBy) {
      logger.info("panel_deleted", {
        panelId,
        deletedBy,
      });
    }

    return panel;
  }
}

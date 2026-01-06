import BroadcastMessage from "../models/broadcastMessageSchema.js";
import { logger } from "../utils/logger.js";

export class BroadcastService {
  /**
   * Create broadcast message
   */
  static async createBroadcast(data, createdBy) {
    const {
      title,
      message,
      targetSchools = [],
      targetDepartments = [],
      targetAcademicYears = [],
      expiresAt,
      action = "notice",
      priority = "medium",
    } = data;

    if (!message || !expiresAt) {
      throw new Error("Message and expiration date are required.");
    }

    if (!["notice", "block"].includes(action)) {
      throw new Error("Action must be 'notice' or 'block'.");
    }

    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      throw new Error("Priority must be 'low', 'medium', 'high', or 'urgent'.");
    }

    const broadcast = new BroadcastMessage({
      title: title || "",
      message,
      targetSchools,
      targetDepartments,
      targetAcademicYears,
      createdBy: createdBy._id,
      createdByEmployeeId: createdBy.employeeId,
      createdByName: createdBy.name,
      expiresAt: new Date(expiresAt),
      isActive: true,
      action,
      priority,
    });

    await broadcast.save();

    logger.info("broadcast_created", {
      broadcastId: broadcast._id,
      action,
      priority,
      targetSchools: targetSchools.length,
      targetDepartments: targetDepartments.length,
      createdBy: createdBy._id,
    });

    return broadcast;
  }

  /**
   * Get broadcasts with filters
   */
  static async getBroadcasts(filters = {}) {
    const { isActive, action, school, department, academicYear } = filters;

    const query = {};

    if (isActive !== undefined) query.isActive = isActive;
    if (action) query.action = action;

    // Auto-deactivate expired broadcasts
    await BroadcastMessage.updateMany(
      { isActive: true, expiresAt: { $lte: new Date() } },
      { $set: { isActive: false } },
    );

    let broadcasts = await BroadcastMessage.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Filter by audience if specified
    if (school || department || academicYear) {
      broadcasts = broadcasts.filter((b) => {
        const matchSchool =
          !school ||
          b.targetSchools.length === 0 ||
          b.targetSchools.includes(school);
        const matchDept =
          !department ||
          b.targetDepartments.length === 0 ||
          b.targetDepartments.includes(department);
        const matchYear =
          !academicYear ||
          b.targetAcademicYears.length === 0 ||
          b.targetAcademicYears.includes(academicYear);
        return matchSchool && matchDept && matchYear;
      });
    }

    return broadcasts;
  }

  /**
   * Update broadcast
   */
  static async updateBroadcast(id, updates, updatedBy) {
    const broadcast = await BroadcastMessage.findById(id);

    if (!broadcast) {
      throw new Error("Broadcast not found.");
    }

    // Update allowed fields
    if (updates.title !== undefined) broadcast.title = updates.title;
    if (updates.message !== undefined) broadcast.message = updates.message;
    if (updates.targetSchools !== undefined)
      broadcast.targetSchools = updates.targetSchools;
    if (updates.targetDepartments !== undefined)
      broadcast.targetDepartments = updates.targetDepartments;
    if (updates.targetAcademicYears !== undefined)
      broadcast.targetAcademicYears = updates.targetAcademicYears;
    if (updates.expiresAt !== undefined)
      broadcast.expiresAt = new Date(updates.expiresAt);
    if (updates.isActive !== undefined) broadcast.isActive = updates.isActive;
    if (updates.action !== undefined) broadcast.action = updates.action;
    if (updates.priority !== undefined) broadcast.priority = updates.priority;

    await broadcast.save();

    logger.info("broadcast_updated", {
      broadcastId: id,
      updatedBy,
    });

    return broadcast;
  }

  /**
   * Delete broadcast
   */
  static async deleteBroadcast(id, deletedBy) {
    const broadcast = await BroadcastMessage.findByIdAndDelete(id);

    if (!broadcast) {
      throw new Error("Broadcast not found.");
    }

    logger.info("broadcast_deleted", {
      broadcastId: id,
      deletedBy,
    });

    return broadcast;
  }
}

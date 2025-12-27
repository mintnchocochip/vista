// src/services/modificationApi.js
import api from './api';

/**
 * Get all faculty for a given academic context
 */
export const getFacultyList = async (school, department, academicYear) => {
  const response = await api.get('/admin/faculty', {
    params: { school, department, academicYear }
  });
  return response.data;
};

/**
 * Get projects where faculty is guide
 */
export const getGuideProjects = async (academicYear, school, department, guideFacultyEmpId) => {
  const response = await api.get('/admin/projects', {
    params: { academicYear, school, department, guideFaculty: guideFacultyEmpId }
  });
  return response.data;
};

/**
 * Get projects where faculty is panel member
 */
export const getPanelProjects = async (facultyId) => {
  const response = await api.get('/admin/projects/panels', {
    params: { facultyId }
  });
  return response.data;
};

/**
 * Get all panels for academic context
 */
export const getPanels = async (academicYear, school, department) => {
  const response = await api.get('/admin/panels', {
    params: { academicYear, school, department }
  });
  return response.data;
};

/**
 * Reassign guide for a project
 * Uses project-coordinator endpoint for reassignment
 */
export const reassignGuide = async (projectId, newGuideFacultyEmpId) => {
  const response = await api.put(`/project-coordinator/projects/${projectId}/reassign-guide`, {
    newGuideFacultyEmpId: String(newGuideFacultyEmpId)
  });
  return response.data;
};

/**
 * Reassign panel for a project
 * Uses panel assignment endpoint
 */
export const reassignPanel = async (projectId, panelId) => {
  const response = await api.post('/admin/panels/assign', {
    projectId: String(projectId),
    panelId: String(panelId)
  });
  return response.data;
};

/**
 * Create temporary single-faculty panel and assign to project
 */
export const assignFacultyAsPanel = async (projectId, facultyId, academicYear, school, department) => {
  // First create a temporary panel with single faculty
  const panelResponse = await api.post('/admin/panels', {
    memberEmployeeIds: [String(facultyId)],
    academicYear: String(academicYear),
    school: String(school),
    department: String(department),
    type: 'temporary'
  });

  const newPanel = panelResponse.data.data;

  // Then assign this panel to the project
  const assignResponse = await api.post('/admin/panels/assign', {
    projectId: String(projectId),
    panelId: String(newPanel._id)
  });

  return assignResponse.data;
};

/**
 * Batch reassign guide for multiple projects
 */
export const batchReassignGuide = async (projectIds, newGuideFacultyEmpId) => {
  const promises = projectIds.map(projectId => 
    reassignGuide(projectId, newGuideFacultyEmpId)
  );
  return await Promise.allSettled(promises);
};

/**
 * Batch reassign panel for multiple projects
 */
export const batchReassignPanel = async (projectIds, panelId) => {
  const promises = projectIds.map(projectId => 
    reassignPanel(projectId, panelId)
  );
  return await Promise.allSettled(promises);
};

/**
 * Batch assign faculty as panel for multiple projects
 */
export const batchAssignFacultyAsPanel = async (projectIds, facultyId, academicYear, school, department) => {
  const promises = projectIds.map(projectId => 
    assignFacultyAsPanel(projectId, facultyId, academicYear, school, department)
  );
  return await Promise.allSettled(promises);
};

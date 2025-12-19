// src/features/admin/components/project-management/ProjectUploadTab.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Button from '../../../../shared/components/Button';
import Card from '../../../../shared/components/Card';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import ProjectBulkUploadModal from './ProjectBulkUploadModal';
import * as adminApi from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const ProjectUploadTab = () => {
  const [filters, setFilters] = useState(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    guideFacultyEmpId: '',
    teamMembers: '',
    type: '',
    specialization: ''
  });
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
  }, []);

  const handleBulkUpload = useCallback(async (projectList) => {
    try {
      await adminApi.bulkUploadProjects(projectList);
      showToast(`Successfully uploaded ${projectList.length} projects`, 'success');
      return { success: true };
    } catch (error) {
      console.error('Error bulk uploading projects:', error);
      throw error;
    }
  }, [showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitSingleProject = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.guideFacultyEmpId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setIsAddingProject(true);
      
      // Parse team members (comma-separated registration numbers)
      const teamMembersArray = formData.teamMembers
        .split(',')
        .map(member => member.trim())
        .filter(member => member.length > 0);

      const projectData = {
        name: formData.name,
        guideFacultyEmpId: formData.guideFacultyEmpId,
        teamMembers: teamMembersArray,
        type: formData.type || 'Research',
        specialization: formData.specialization || '',
        schoolId: filters.school,
        programId: filters.programme,
        yearId: filters.year,
        semesterId: filters.semester,
        schoolName: filters.schoolName,
        programmeName: filters.programmeName,
        yearName: filters.yearName,
        semesterName: filters.semesterName
      };

      await adminApi.createProject(projectData);
      showToast('Project added successfully', 'success');
      
      // Reset form
      setFormData({
        name: '',
        guideFacultyEmpId: '',
        teamMembers: '',
        type: '',
        specialization: ''
      });
    } catch (error) {
      console.error('Error adding project:', error);
      showToast(error.response?.data?.message || 'Failed to add project', 'error');
    } finally {
      setIsAddingProject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Upload Options - only show when filters are complete */}
      {filters && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <Button size="sm" onClick={() => setIsBulkUploadOpen(true)}>
              <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
              Bulk Upload
            </Button>
            <span className="text-xs text-gray-500 self-center">
              {filters.schoolName} → {filters.programmeName} → {filters.yearName} → {filters.semesterName}
            </span>
          </div>

          {/* Single Project Form */}
          <Card>
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Add Single Project</h3>

              <form onSubmit={handleSubmitSingleProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Project Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., AI-Based Traffic Management System"
                    required
                  />
                  
                  <Input
                    label="Guide Faculty Employee ID"
                    name="guideFacultyEmpId"
                    value={formData.guideFacultyEmpId}
                    onChange={handleInputChange}
                    placeholder="e.g., FAC001"
                    required
                  />
                  
                  <Input
                    label="Team Members (Reg Numbers)"
                    name="teamMembers"
                    value={formData.teamMembers}
                    onChange={handleInputChange}
                    placeholder="e.g., 21BCI0001, 21BCI0002, 21BCI0003"
                  />
                  
                  <Input
                    label="Project Type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="e.g., Research, Development, Innovation"
                  />

                  <Input
                    label="Specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Machine Learning, IoT, Blockchain"
                  />
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <p><strong>Note:</strong> Separate multiple team member registration numbers with commas.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setFormData({
                      name: '',
                      guideFacultyEmpId: '',
                      teamMembers: '',
                      type: '',
                      specialization: ''
                    })}
                  >
                    Clear Form
                  </Button>
                  <Button type="submit" disabled={isAddingProject}>
                    {isAddingProject ? 'Adding...' : 'Add Project'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          {/* Bulk Upload Modal */}
          <ProjectBulkUploadModal
            isOpen={isBulkUploadOpen}
            onClose={() => setIsBulkUploadOpen(false)}
            onUpload={handleBulkUpload}
            filters={filters}
          />
        </>
      )}
    </div>
  );
};

export default ProjectUploadTab;

// src/features/admin/components/project-management/ProjectViewTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import EmptyState from '../../../../shared/components/EmptyState';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import ProjectDetailsModal from './ProjectDetailsModal';
import { MOCK_PROJECTS } from '../../utils/mockProjectData';
import { UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import * as adminApi from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const ProjectViewTab = () => {
  const [filters, setFilters] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setProjects([]);
  }, []);

  // Fetch projects when filters change
  useEffect(() => {
    const fetchProjects = async () => {
      if (!filters) {
        setProjects([]);
        return;
      }

      try {
        setLoading(true);
        const params = {
          school: filters.school,
          department: filters.programme,
          academicYear: filters.year,
          semester: filters.semester
        };
        
        const data = await adminApi.getAllProjects(params);
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        showToast('Failed to load projects, using demo data', 'warning');
        // Fallback to mock data
        const filtered = MOCK_PROJECTS.filter(
          project =>
            project.schoolId === filters.school &&
            project.programId === filters.programme &&
            project.yearId === filters.year &&
            project.semesterId === filters.semester
        );
        setProjects(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [filters, showToast]);

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Project Content - only show when filters are complete */}
      {filters && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects found"
              description="No projects match your current academic context. Upload projects or adjust filters."
              icon={AcademicCapIcon}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => {
                  const teamSize = project.teamMembers?.length || 0;
                  const hasGuide = project.guideName && project.guideName !== 'Not Assigned';

                  return (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-500"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                            {project.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {project.type || 'Project'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <UserGroupIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {teamSize} {teamSize === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        {hasGuide && (
                          <div className="flex items-center gap-2 text-sm">
                            <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 truncate">
                              {project.guideName}
                            </span>
                          </div>
                        )}

                        {project.specialization && (
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {project.specialization}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {selectedProject && (
                <ProjectDetailsModal
                  isOpen={!!selectedProject}
                  onClose={() => setSelectedProject(null)}
                  project={selectedProject}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectViewTab;

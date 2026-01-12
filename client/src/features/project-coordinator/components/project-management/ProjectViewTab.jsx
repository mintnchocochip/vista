// src/features/project-coordinator/components/project-management/ProjectViewTab.jsx
import React, { useState } from "react";
import Card from "../../../../shared/components/Card";
import Badge from "../../../../shared/components/Badge";
import EmptyState from "../../../../shared/components/EmptyState";
import ProjectDetailsModal from "./ProjectDetailsModal";
import {
  AcademicCapIcon,
  UserGroupIcon,
  UsersIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { formatPanelName } from "../../utils/panelUtils";

const ProjectViewTab = ({ projects = [], isPrimary = false }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    const matchName = (project.name || project.title || "").toLowerCase().includes(query);
    const matchGuide = (project.guide?.name || "").toLowerCase().includes(query);
    const matchPanel = (project.panel?.name || "").toLowerCase().includes(query);
    const matchMembers = (project.teamMembers || []).some(m =>
      (m.name || "").toLowerCase().includes(query) ||
      (m.rollNumber || "").toLowerCase().includes(query)
    );

    return matchName || matchGuide || matchPanel || matchMembers;
  });

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects found"
        description="No projects match your current academic context. Upload projects or adjust filters."
        icon={AcademicCapIcon}
      />
    );
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by project name, student, guide, or panel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No projects match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const teamSize = project.teamMembers?.length || 0;
            const guideName = project.guide?.name || "Not Assigned";
            const panelName = project.panel ? formatPanelName(project.panel) : null;
            const reviewPanelsCount = project.reviewPanels?.length || 0;

            return (
              <Card
                key={project._id || project.id}
                className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-500"
                onClick={() => setSelectedProject(project)}
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {project.name || project.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {project.type || "Capstone Project"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <UserGroupIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {teamSize} {teamSize === 1 ? "member" : "members"}
                    </span>
                  </div>

                  {guideName !== "Not Assigned" && (
                    <div className="flex items-center gap-2 text-sm">
                      <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 truncate">
                        {guideName}
                      </span>
                    </div>
                  )}

                  {panelName && (
                    <div className="flex items-center gap-2 text-sm">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 truncate">
                        {panelName}
                      </span>
                    </div>
                  )}

                  {reviewPanelsCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        +{reviewPanelsCount} Review Panel{reviewPanelsCount > 1 ? 's' : ''}
                      </Badge>
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
      )}

      {selectedProject && (
        <ProjectDetailsModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      )}
    </>
  );
};

export default ProjectViewTab;

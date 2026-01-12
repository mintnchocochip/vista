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
} from "@heroicons/react/24/outline";
import { formatPanelName } from "../../utils/panelUtils";

const ProjectViewTab = ({ projects = [], isPrimary = false }) => {
  const [selectedProject, setSelectedProject] = useState(null);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
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

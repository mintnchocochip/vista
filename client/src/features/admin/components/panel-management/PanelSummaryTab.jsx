// src/features/admin/components/panel-management/PanelSummaryTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import EmptyState from '../../../../shared/components/EmptyState';
import { useToast } from '../../../../shared/hooks/useToast';
import { calculatePanelStats } from '../../utils/panelUtils';

const PanelSummaryTab = () => {
  const [filters, setFilters] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (filters) {
      fetchPanels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPanels = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Use mock data directly
      setPanels(generateMockPanels());
      showToast('Statistics loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching panels:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
  }, []);

  // Generate mock panels
  function generateMockPanels() {
    const facultyNames = [
      ['Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Amit Patel'],
      ['Dr. Sneha Reddy', 'Dr. Vikram Singh', 'Dr. Anita Desai'],
      ['Dr. Suresh Iyer', 'Dr. Kavita Nair', 'Dr. Ramesh Gupta'],
      ['Dr. Meera Joshi', 'Dr. Arun Verma', 'Dr. Deepa Shah'],
      ['Dr. Kiran Rao', 'Dr. Sanjay Mehta', 'Dr. Pooja Kapoor']
    ];
    
    return Array.from({ length: 5 }, (_, i) => ({
      id: `panel-${i + 1}`,
      panelNumber: i + 1,
      markingStatus: ['full', 'partial', 'none'][i % 3],
      faculty: facultyNames[i].map((name, j) => ({
        employeeId: `EMP00${i * 3 + j + 1}`,
        name: name,
        email: `${name.toLowerCase().replace(/\s+/g, '.').replace('dr.', '')}@vit.ac.in`,
        department: 'CSE'
      })),
      teams: Array.from({ length: 4 }, (_, j) => ({
        id: `team-${i}-${j}`,
        projectTitle: `Project ${i * 4 + j + 1}`,
        markingStatus: ['full', 'partial', 'none'][j % 3],
        students: Array.from({ length: 3 }, (_, k) => ({
          regNo: `21BCE${1000 + i * 12 + j * 3 + k}`,
          name: `Student ${i * 12 + j * 3 + k + 1}`,
          email: `student${i * 12 + j * 3 + k + 1}@vitstudent.ac.in`
        }))
      }))
    }));
  }

  const stats = calculatePanelStats(panels);

  return (
    <div className="space-y-6">
      {/* Academic Context Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Statistics Section */}
      {filters && (
        <>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : panels.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No data available"
              description="No panels have been created for this academic context yet"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">Total Panels</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalPanels}
                  </p>
                </div>
              </Card>
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">Total Faculty</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalFaculty}
                  </p>
                </div>
              </Card>
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalProjects}
                  </p>
                </div>
              </Card>
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">Avg Projects/Panel</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.avgProjectsPerPanel}
                  </p>
                </div>
              </Card>
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">Avg Faculty/Panel</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.avgFacultyPerPanel}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PanelSummaryTab;

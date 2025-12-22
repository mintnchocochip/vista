// src/features/admin/components/faculty-management/FacultyViewTab.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Input from '../../../../shared/components/Input';
import FacultyList from './FacultyList';
import FacultyModal from './FacultyModal';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import { useToast } from '../../../../shared/hooks/useToast';
import { INITIAL_FACULTY } from './facultyData';

const FacultyViewTab = () => {
  const [filters, setFilters] = useState(null);
  const [allFaculty, setAllFaculty] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setAllFaculty([]);
    setSearchQuery('');
  }, []);

  // Fetch faculty when filters change
  useEffect(() => {
    if (filters) {
      fetchFaculty();
    }
  }, [filters]);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter the mock data based on applied filters
      const filteredData = INITIAL_FACULTY.filter(member => {
        if (member.schoolId !== parseInt(filters.school)) return false;
        if (member.programId !== parseInt(filters.programme)) return false;
        if (member.yearId !== parseInt(filters.year)) return false;
        if (member.semesterId !== parseInt(filters.semester)) return false;
        return true;
      });

      setAllFaculty(filteredData);
      setSearchQuery('');
    } catch (error) {
      showToast('Error fetching faculty data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter faculty based on search query
  const filteredFaculty = useMemo(() => {
    if (!searchQuery.trim()) return allFaculty;

    const query = searchQuery.toLowerCase();
    return allFaculty.filter(member => {
      if (member.name.toLowerCase().includes(query)) return true;
      if (member.id.toLowerCase().includes(query)) return true;
      if (member.email.toLowerCase().includes(query)) return true;
      
      if (member.projects && member.projects.length > 0) {
        return member.projects.some(project => 
          project.title.toLowerCase().includes(query) ||
          project.studentName.toLowerCase().includes(query) ||
          project.studentRegNo.toLowerCase().includes(query)
        );
      }
      
      return false;
    });
  }, [allFaculty, searchQuery]);

  const handleEditFaculty = async (facultyData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedFaculty = allFaculty.map(member => 
        member.id === selectedFaculty.id 
          ? { ...member, ...facultyData }
          : member
      );
      
      setAllFaculty(updatedFaculty);
      showToast('Faculty member updated successfully', 'success');
      setIsModalOpen(false);
      setSelectedFaculty(null);
    } catch (error) {
      showToast('Error updating faculty member', 'error');
    }
  };

  const handleDeleteFaculty = async (member) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${member.name}? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const updatedFaculty = allFaculty.filter(f => f.id !== member.id);
        setAllFaculty(updatedFaculty);
        
        showToast('Faculty member deleted successfully', 'success');
      } catch (error) {
        showToast('Error deleting faculty member', 'error');
      }
    }
  };

  const openEditModal = (member) => {
    setSelectedFaculty(member);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Faculty Content - only show when filters are complete */}
      {filters && (
        <>
          {/* Search Bar */}
          {allFaculty.length > 0 && !loading && (
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, employee ID, or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Showing {filteredFaculty.length} of {allFaculty.length} faculty members
              </p>
            </div>
          )}

          {/* Faculty List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <FacultyList 
              faculty={filteredFaculty}
              onEdit={openEditModal}
              onDelete={handleDeleteFaculty}
            />
          )}

          {/* Edit Modal */}
          <FacultyModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedFaculty(null);
            }}
            onSave={handleEditFaculty}
            initialData={selectedFaculty}
          />
        </>
      )}
    </div>
  );
};

export default FacultyViewTab;

// src/features/admin/components/faculty-management/FacultyUploadTab.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Button from '../../../../shared/components/Button';
import Card from '../../../../shared/components/Card';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import FacultyBulkUploadModal from './FacultyBulkUploadModal';
import FacultyModal from './FacultyModal';
import * as adminApi from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const FacultyUploadTab = () => {
  const [filters, setFilters] = useState(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
  }, []);

  const handleBulkUpload = useCallback(async (facultyList) => {
    try {
      await adminApi.bulkUploadFaculty(facultyList);
      showToast('Faculty members uploaded successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error uploading faculty:', error);
      throw error;
    }
  }, [showToast]);

  const handleAddFaculty = async (facultyData) => {
    try {
      const newFaculty = {
        ...facultyData,
        schoolId: filters.school,
        programId: filters.programme,
        yearId: filters.year,
        semesterId: filters.semester,
        schoolName: filters.schoolName,
        programmeName: filters.programmeName,
        yearName: filters.yearName,
        semesterName: filters.semesterName
      };

      await adminApi.createFaculty(newFaculty);
      showToast('Faculty member added successfully', 'success');
      setIsSingleAddOpen(false);
    } catch (error) {
      console.error('Error adding faculty:', error);
      showToast(error.response?.data?.message || 'Failed to add faculty', 'error');
      throw error;
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
            <Button size="sm" variant="success" onClick={() => setIsSingleAddOpen(true)}>
              <UserPlusIcon className="w-4 h-4 mr-1" />
              Add Faculty
            </Button>
            <span className="text-xs text-gray-500 self-center">
              {filters.schoolName} → {filters.programmeName} → {filters.yearName} → {filters.semesterName}
            </span>
          </div>

          {/* Bulk Upload Modal */}
          <FacultyBulkUploadModal
            isOpen={isBulkUploadOpen}
            onClose={() => setIsBulkUploadOpen(false)}
            onUpload={handleBulkUpload}
            filters={filters}
          />

          {/* Single Add Modal */}
          <FacultyModal
            isOpen={isSingleAddOpen}
            onClose={() => setIsSingleAddOpen(false)}
            onSave={handleAddFaculty}
            initialData={null}
          />
        </>
      )}
    </div>
  );
};

export default FacultyUploadTab;

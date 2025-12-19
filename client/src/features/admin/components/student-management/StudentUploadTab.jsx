// src/features/admin/components/student-management/StudentUploadTab.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from './AcademicFilterSelector';
import Button from '../../../../shared/components/Button';
import Card from '../../../../shared/components/Card';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import StudentBulkUploadModal from './StudentBulkUploadModal';
import * as adminApi from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const StudentUploadTab = () => {
  const [filters, setFilters] = useState(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [formData, setFormData] = useState({
    regNo: '',
    name: '',
    emailId: '',
    phoneNumber: '',
    PAT: false
  });
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
  }, []);

  const handleBulkUpload = useCallback(async (students) => {
    try {
      await adminApi.bulkUploadStudents(students, filters.school, filters.programme);
      showToast('Students uploaded successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Error uploading students:', error);
      throw error;
    }
  }, [filters, showToast]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitSingleStudent = async (e) => {
    e.preventDefault();
    
    if (!formData.regNo || !formData.name || !formData.emailId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setIsAddingStudent(true);
      const studentData = {
        ...formData,
        schoolId: filters.school,
        programmeId: filters.programme,
        yearId: filters.year,
        semesterId: filters.semester,
        schoolName: filters.schoolName,
        programmeName: filters.programmeName,
        yearName: filters.yearName,
        semesterName: filters.semesterName
      };

      await adminApi.createStudent(studentData);
      showToast('Student added successfully', 'success');
      
      // Reset form
      setFormData({
        regNo: '',
        name: '',
        emailId: '',
        phoneNumber: '',
        PAT: false
      });
    } catch (error) {
      console.error('Error adding student:', error);
      showToast(error.response?.data?.message || 'Failed to add student', 'error');
    } finally {
      setIsAddingStudent(false);
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

          {/* Single Student Form */}
          <Card>
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Add Single Student</h3>

              <form onSubmit={handleSubmitSingleStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Registration Number"
                    name="regNo"
                    value={formData.regNo}
                    onChange={handleInputChange}
                    placeholder="e.g., 21BCI0001"
                    required
                  />
                  
                  <Input
                    label="Student Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    required
                  />
                  
                  <Input
                    label="Email ID"
                    name="emailId"
                    type="email"
                    value={formData.emailId}
                    onChange={handleInputChange}
                    placeholder="e.g., student@vit.ac.in"
                    required
                  />
                  
                  <Input
                    label="Phone Number"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 9876543210"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="PAT"
                    name="PAT"
                    checked={formData.PAT}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="PAT" className="ml-2 text-sm text-gray-700">
                    PAT Student (Project Assistance Team)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setFormData({
                      regNo: '',
                      name: '',
                      emailId: '',
                      phoneNumber: '',
                      PAT: false
                    })}
                  >
                    Clear Form
                  </Button>
                  <Button type="submit" disabled={isAddingStudent}>
                    {isAddingStudent ? 'Adding...' : 'Add Student'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          {/* Bulk Upload Modal */}
          <StudentBulkUploadModal
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

export default StudentUploadTab;

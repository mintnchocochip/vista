// src/features/admin/components/student-management/StudentViewTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AcademicFilterSelector from './AcademicFilterSelector';
import StudentList from './StudentList';
import StudentDetailsModal from './StudentDetailsModal';
import { useToast } from '../../../../shared/hooks/useToast';
import api from '../../../../services/api';
import { generateDummyStudents } from '../../../../shared/utils/dummyStudentData';

const StudentViewTab = () => {
  const [filters, setFilters] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setStudents([]);
  }, []);

  // Fetch students when filters change
  useEffect(() => {
    if (filters) {
      // fetchStudents(); // Uncomment for real API
      // Use dummy data for now
      setLoading(true);
      setTimeout(() => {
        setStudents(generateDummyStudents(filters));
        setLoading(false);
      }, 500);
    }
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/students', {
        params: {
          schoolId: filters.school,
          programmeId: filters.programme,
          yearId: filters.year,
          semesterId: filters.semester
        }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (student) => {
    // Use dummy data - find student from the list
    const fullStudent = students.find(s => s.id === student.id);
    setSelectedStudent(fullStudent || student);
    setIsModalOpen(true);
  };

  const handleNavigateToStudent = (student) => {
    handleViewDetails(student);
  };

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Student List - only show when filters are complete */}
      {filters && (
        <>
          <StudentList 
            students={students} 
            loading={loading}
            onViewDetails={handleViewDetails}
          />

          <StudentDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            student={selectedStudent}
            onNavigateToStudent={handleNavigateToStudent}
          />
        </>
      )}
    </div>
  );
};

export default StudentViewTab;

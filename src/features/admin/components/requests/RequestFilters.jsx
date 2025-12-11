// src/features/admin/components/requests/RequestFilters.jsx
import React from 'react';
import Card from '../../../../shared/components/Card';
import Select from '../../../../shared/components/Select';

const RequestFilters = ({ filters, onFilterChange, onReset }) => {
  const schoolOptions = [
    { value: '', label: 'All Schools' },
    { value: 'School of Engineering', label: 'School of Engineering' },
    { value: 'School of Business', label: 'School of Business' },
    { value: 'School of Arts & Sciences', label: 'School of Arts & Sciences' },
    { value: 'School of Law', label: 'School of Law' }
  ];

  const programOptions = [
    { value: '', label: 'All Programs' },
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'MBA', label: 'MBA' },
    { value: 'BBA', label: 'BBA' }
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'guide', label: 'Guide Requests' },
    { value: 'panel', label: 'Panel Requests' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Reset All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School
            </label>
            <Select
              value={filters.school}
              onChange={(e) => onFilterChange('school', e.target.value)}
              options={schoolOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program
            </label>
            <Select
              value={filters.program}
              onChange={(e) => onFilterChange('program', e.target.value)}
              options={programOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              options={categoryOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              options={statusOptions}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RequestFilters;

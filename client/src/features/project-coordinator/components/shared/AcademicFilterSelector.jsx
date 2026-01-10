// src/features/project-coordinator/components/shared/AcademicFilterSelector.jsx
import React, { useState, useEffect } from "react";
import Select from "../../../../shared/components/Select";
import Card from "../../../../shared/components/Card";
import { AcademicCapIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { fetchAcademicYears } from "../../services/coordinatorApi";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { useCoordinatorContext } from "../../context/CoordinatorContext";

const AcademicFilterSelector = ({ onFilterComplete, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [academicYearSemesterOptions, setAcademicYearSemesterOptions] =
    useState([]);

  const { academicContext, updateAcademicContext } = useCoordinatorContext();

  const { user } = useAuth();

  // Fetch combined academic year and semester options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        const response = await fetchAcademicYears();

        if (response.success && Array.isArray(response.data)) {
          const options = [];

          // Sort years in descending order (newest first)
          const sortedYears = [...response.data].sort().reverse();

          sortedYears.forEach((year) => {
            // Check if year string already contains semester info
            const upperYear = year.toUpperCase();
            const hasSemester =
              upperYear.includes("FALL") || upperYear.includes("WINTER");

            if (hasSemester) {
              // Backend provided specific semester, use as is
              // Format: "YYYY-YY SEMESTER"
              // We need to split this for metadata if possible
              const parts = year.split(" ");
              const yearPart = parts[0];
              // If format is like "2024-25 FALL", yearPart is "2024-25"
              const semesterPart = upperYear.includes("FALL")
                ? "Fall"
                : "Winter";

              options.push({
                value: year,
                label: year,
                originalYear: yearPart,
                semester: semesterPart,
              });
            } else {
              // Backend provided just year (e.g. "2024-25"), generate both semesters
              const shortYear =
                year.length === 7
                  ? `${year.substring(2, 4)}-${year.substring(5, 7)}`
                  : year;

              options.push({
                value: `${shortYear}-fall`,
                label: `${shortYear} Fall`,
                originalYear: year,
                semester: "Fall",
              });
              options.push({
                value: `${shortYear}-winter`,
                label: `${shortYear} Winter`,
                originalYear: year,
                semester: "Winter",
              });
            }
          });

          setAcademicYearSemesterOptions(options);

          // Auto-select first option (newest) if not already selected in context
          if (options.length > 0 && !academicContext.academicYearSemester) {
            updateAcademicContext({ academicYearSemester: options[0].value });
          }
        }
      } catch (error) {
        console.error("Failed to load academic years", error);
        // Fallback or empty options
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Notify parent when filter is selected
  useEffect(() => {
    if (academicContext.academicYearSemester) {
      const selectedOption = academicYearSemesterOptions.find(
        (opt) => opt.value === academicContext.academicYearSemester
      );

      if (selectedOption) {
        onFilterComplete({
          year: selectedOption.originalYear, // Use the full year from backend
          semester: selectedOption.semester,
          academicYearSemester: academicContext.academicYearSemester,
          // Removed school/programme from here to prevent loops when user object updates.
          // Parent component should use its own user context for those values.
        });
      }
    }
  }, [
    academicContext.academicYearSemester,
    academicYearSemesterOptions,
    onFilterComplete,
  ]);

  const handleChange = (value) => {
    updateAcademicContext({ academicYearSemester: value });
  };

  const allSelected = !!academicContext.academicYearSemester;

  return (
    <Card className={`sticky top-4 z-30 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <AcademicCapIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">
            Select Academic Context
          </h2>
          <div className="flex-1 mx-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${allSelected ? 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {allSelected ? "1" : "0"}/1
          </span>
        </div>

        {allSelected && (
          <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-lg border border-green-300">
            <CheckCircleIcon className="w-4 h-4 text-green-700" />
            <span className="text-xs font-semibold text-green-700">
              Complete
            </span>
          </div>
        )}
      </div>

      {/* Display coordinator's fixed school and programme in grid layout matching admin */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            School
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium cursor-not-allowed">
            {user?.school || "Loading..."}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Program
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium cursor-not-allowed">
            {user?.department || "Loading..."}
          </div>
        </div>
        {/* Academic Year & Semester Selection */}
        <Select
          label="Academic Year"
          value={academicContext.academicYearSemester}
          onChange={handleChange}
          options={academicYearSemesterOptions}
          placeholder={
            loading ? "Loading years..." : "Select Academic Year & Semester"
          }
          disabled={loading}
        />
      </div>
    </Card>
  );
};

export default AcademicFilterSelector;

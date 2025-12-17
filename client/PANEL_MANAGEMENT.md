# Panel Management System

## Overview

The Panel Management system provides a comprehensive solution for managing evaluation panels in the academic context. It consists of three main pages:

1. **Panel Management Landing** - Central hub for accessing panel features
2. **Panel Creation** - Upload faculty data to create new panels
3. **Panel View** - View and manage existing panels

## Features

### Panel Creation (`/admin/panels/create`)

**Purpose:** Upload faculty data and create evaluation panels for specific academic contexts.

**Key Features:**
- Academic context selection (School, Programme, Year, Semester)
- Excel template download for faculty data
- File validation and parsing
- Faculty data upload with progress tracking
- Uploaded faculty list management

**Excel Template Format:**
```
| Employee ID | Name          | Email                  | Department |
|-------------|---------------|------------------------|------------|
| EMP001      | Dr. John Doe  | john.doe@vit.ac.in     | CSE        |
| EMP002      | Dr. Jane Smith| jane.smith@vit.ac.in   | IT         |
```

**File Requirements:**
- Format: Excel (.xlsx or .xls)
- Maximum size: 5MB
- Required columns: Employee ID, Name, Email, Department

**User Flow:**
1. Select academic context (School → Programme → Year → Semester)
2. Download faculty template Excel file
3. Fill in faculty details
4. Upload completed file
5. Review uploaded faculty list
6. Remove any incorrect entries

### Panel View (`/admin/panels/view`)

**Purpose:** View, search, and manage existing evaluation panels.

**Key Features:**
- Academic context selection
- Real-time panel statistics dashboard
- Search functionality (panels, faculty, projects)
- Filtering by marking status (All, Fully Marked, Partially Marked, Not Marked)
- Expandable panel details showing:
  - Faculty members assigned to panel
  - Projects assigned to panel
  - Student information
  - Marking status for each project

**Statistics Displayed:**
- Total Panels
- Total Faculty
- Total Projects
- Average Projects per Panel
- Average Faculty per Panel

**Marking Status Colors:**
- 🟢 **Full** (Green): All projects fully marked
- 🟡 **Partial** (Yellow): Some projects marked
- ⚫ **None** (Gray): No projects marked

## File Structure

```
client/src/features/admin/
├── pages/
│   ├── PanelManagementLanding.jsx  # Landing page with navigation
│   ├── PanelCreation.jsx           # Faculty upload and panel creation
│   └── PanelView.jsx                # Panel viewing and management
├── utils/
│   └── panelUtils.js                # Utility functions for panels
└── components/
    └── shared/
        └── AdminTabs.jsx            # Updated with panel submenu support
```

## Utility Functions (`panelUtils.js`)

### Excel Functions
- `downloadFacultyTemplate()` - Generate and download Excel template
- `validateFacultyFile(file)` - Validate uploaded Excel file
- `parseFacultyExcel(file)` - Parse Excel file into faculty data

### Panel Functions
- `calculatePanelStats(panels)` - Calculate statistics from panel data
- `formatPanelName(panel)` - Format panel display name
- `getMarkingStatusColor(status)` - Get CSS classes for status badge
- `getMarkingStatusLabel(status)` - Get human-readable status label

## API Endpoints

### Faculty Upload
```javascript
POST /api/admin/panels/upload-faculty
Body: {
  school: String,
  programme: String,
  year: String,
  semester: String,
  faculty: Array<{
    employeeId: String,
    name: String,
    email: String,
    department: String
  }>
}
```

### Fetch Panels
```javascript
GET /api/admin/panels
Params: {
  school: String,
  programme: String,
  year: String,
  semester: String
}
```

## UI Consistency

The Panel Management pages follow the same design patterns as other admin pages:

### Common Elements
- Navbar with user profile
- AdminTabs for navigation
- AcademicFilterSelector for context selection
- Consistent color scheme (Blue primary, no purple)
- Card-based layouts
- Responsive design (mobile-first)

### Color Palette
- **Primary Blue:** `bg-blue-600`, `text-blue-600`
- **Secondary Gray:** `bg-gray-50`, `text-gray-600`
- **Success Green:** `bg-green-100`, `text-green-800`
- **Warning Yellow:** `bg-yellow-100`, `text-yellow-800`
- **Error Red:** `bg-red-100`, `text-red-800`

### Typography
- **Page Title:** `text-2xl font-bold text-gray-900`
- **Section Title:** `text-lg font-medium text-gray-900`
- **Body Text:** `text-sm text-gray-600`
- **Labels:** `text-sm font-medium text-gray-700`

## Mock Data

For development purposes, both pages include mock data generators:

**PanelView** includes `generateMockPanels()` that creates:
- 5 sample panels
- 3 faculty members per panel
- 4 projects per panel
- 3 students per project
- Varying marking statuses

## Dependencies

### New Dependencies
- `xlsx` - Excel file parsing and generation

### Existing Dependencies
- `@heroicons/react` - Icon library
- `react-router-dom` - Navigation
- `axios` - HTTP client
- React component library (Button, Card, Badge, etc.)

## Routes

```javascript
/admin/panels              → PanelManagementLanding
/admin/panels/create       → PanelCreation
/admin/panels/view         → PanelView
```

All routes are protected and require `admin` or `coordinator` role.

## Navigation Flow

```
AdminTabs (Panel Management)
    ↓
PanelManagementLanding
    ├── Panel Creation → PanelCreation
    └── Panel View → PanelView
```

Each sub-page has a "Back to Panel Management" button to return to the landing page.

## Error Handling

### Panel Creation
- File validation errors (type, size)
- Excel parsing errors (missing columns, invalid data)
- Upload errors (network, server errors)
- All errors shown via toast notifications

### Panel View
- API fetch errors (fallback to mock data in development)
- Empty states with helpful messages
- Loading states with spinners

## Future Enhancements

1. **Panel Creation Automation**
   - Auto-assign faculty to panels based on availability
   - Balance projects across panels
   - Conflict detection for faculty schedules

2. **Advanced Filtering**
   - Filter by department
   - Filter by specific review types
   - Date range filters

3. **Bulk Operations**
   - Bulk panel deletion
   - Bulk faculty reassignment
   - Export panels to Excel

4. **Real-time Updates**
   - Live marking status updates
   - Notifications for panel changes
   - Collaborative panel management

5. **Analytics Dashboard**
   - Panel performance metrics
   - Faculty workload distribution
   - Marking progress tracking

## Testing Checklist

- [ ] Download faculty template
- [ ] Upload valid Excel file
- [ ] Upload invalid file (wrong format, missing columns)
- [ ] View uploaded faculty list
- [ ] Remove faculty from list
- [ ] Navigate between pages
- [ ] Search panels by name, faculty, project
- [ ] Filter by marking status
- [ ] Expand/collapse panel details
- [ ] View faculty and project information
- [ ] Responsive design on mobile/tablet
- [ ] Error handling for API failures
- [ ] Loading states display correctly

# CPMS Implementation - Quick Reference Guide

## 🎯 What Was Changed

### Frontend Components (8 Updates)
| Component | Type | Changes |
|-----------|------|---------|
| AcademicFilterSelector | Updated | Combined Year/Semester → Single dropdown |
| FacultyCreation | Updated | Added phone, specialization; dual upload modes |
| ProjectCreation | Updated | Removed description/guide; integrated TeamMembersSelector |
| TeamMembersSelector | NEW | Smart student selection (create/existing) |
| PanelCreation | Updated | Simplified 3-mode interface (manual/auto/upload) |
| PanelAssignment | NEW | Panel assignment with auto/manual strategies |
| RequestManagement | Updated | Removed filters; added access request feature |
| CoordinatorTabs | Updated | Added deadline-based feature locking |

### Database Schemas (3 Updates)
| Schema | Changes |
|--------|---------|
| Faculty | phoneNumber required, department optional |
| Panel | Added facultyEmployeeIds, panelType, semester |
| AccessRequest | NEW - Track deadline unlock requests |

### Utility Functions (2 Updates)
| Utility | Changes |
|---------|---------|
| panelUtils | Added panel template, validation, parsing |
| projectUtils | Removed description/guide from template |

---

## 🏗️ File Structure

```
client/src/features/project-coordinator/
├── pages/
│   ├── PanelAssignment.jsx (NEW)
│   └── RequestManagement.jsx (UPDATED)
├── components/
│   ├── shared/
│   │   ├── AcademicFilterSelector.jsx (UPDATED)
│   │   └── CoordinatorTabs.jsx (UPDATED)
│   ├── faculty-management/
│   │   └── FacultyCreation.jsx (UPDATED)
│   ├── project-management/
│   │   ├── ProjectCreation.jsx (UPDATED)
│   │   └── TeamMembersSelector.jsx (NEW)
│   └── panel-management/
│       └── PanelCreation.jsx (UPDATED)
└── utils/
    ├── projectUtils.js (UPDATED)
    ├── panelUtils.js (UPDATED)
    └── studentUtils.js (unchanged)

server/models/
├── facultySchema.js (UPDATED)
├── panelSchema.js (UPDATED)
└── accessRequestSchema.js (NEW)
```

---

## 🔄 Key Data Flow Changes

### Academic Filters
```javascript
// From AcademicFilterSelector.jsx
academicYearSemester: "24-25-Fall" // displayed as "24-25 Fall"
```

### Faculty Data
```javascript
// Form input includes:
{
  employeeId: "EMP001",
  name: "Dr. John",
  emailId: "john@vit.ac.in",
  phoneNumber: "9876543210", // REQUIRED
  specialization: "AI/ML", // OPTIONAL
  department: "CSE" // OPTIONAL
}
```

### Team Members
```javascript
// Array structure (not comma-separated string)
[
  {id: "1", name: "Student A", registrationNumber: "21BCE1001", source: "new"},
  {id: "2", name: "Student B", registrationNumber: "21BCE1002", source: "existing"}
]
```

### Panel Faculty
```javascript
// Direct employee ID reference
facultyEmployeeIds: ["EMP001", "EMP002", "EMP003"]
```

### Access Request
```javascript
{
  featureName: "faculty_management",
  reason: "Need urgent access",
  priority: "high",
  requiredDeadline: "2024-02-20T18:00:00Z",
  status: "pending" // pending | approved | rejected
}
```

---

## 📝 Common Code Patterns

### Form State Management
```javascript
const [form, setForm] = useState({
  field1: '',
  field2: '',
  field3: ''
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setForm(prev => ({ ...prev, [name]: value }));
};
```

### File Upload Handling
```javascript
const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  const validation = validateFile(file);
  if (!validation.isValid) {
    setError(validation.errors.join(', '));
    return;
  }
  setSelectedFile(file);
};

const handleUpload = async () => {
  const data = await parseFile(selectedFile);
  // Use data...
};
```

### Array List Management
```javascript
// Add item
setList(prev => [...prev, newItem]);

// Remove item
setList(prev => prev.filter(item => item.id !== itemId));

// Update item
setList(prev => prev.map(item =>
  item.id === itemId ? {...item, ...updates} : item
));
```

### Callback Pattern
```javascript
// Child component
const handleChange = (data) => {
  onChangeCallback(data);
};

// Parent component
const handleChildChange = (data) => {
  setParentState(data);
};

// Usage
<ChildComponent onChange={handleChildChange} />
```

---

## 🎯 Important Notes

### AcademicFilterSelector
- Returns combined string: "24-25-Fall"
- Parent must parse if needed: `value.split('-')`
- Available at all coordinator pages

### Phone Number
- Required field for all faculty
- Validation: 10 digits (Indian format)
- No special characters or spaces

### Department Field
- Made optional (faculty can be cross-department)
- Still fetched from AcademicFilterSelector context
- Can be overridden in form

### Team Size Constraints
- Comes from department config
- TeamMembersSelector enforces automatically
- Returns error if exceeded

### Panel Faculty IDs
- Must exist in database
- Validate before creating panels
- Can be looked up via validateFacultyIds endpoint

### Deadline Checking
- Runs on component mount
- Re-checks every 60 seconds
- Compares against department config deadlines
- Features locked if deadline passed

### Access Requests
- Submit reason, priority, required deadline
- Admin approves/rejects
- Can view history with status
- Redirect from locked features to request page

---

## ⚠️ Breaking Changes

### For existing code using old components:

**AcademicFilterSelector**
```javascript
// OLD: Two separate filters
year: filters.year
semester: filters.semester

// NEW: Single combined value
academicYear: filters.year
semester: filters.semester
// Parse from academicYearSemester if available
```

**FacultyCreation**
```javascript
// OLD: Only upload mode
// NEW: Upload + Manual modes
// Check activeMode to determine which mode
```

**ProjectCreation**
```javascript
// OLD: projectDescription, guideName in form
// NEW: Only projectTitle, guideEmployeeID, teamMembers
// Remove any form fields that reference removed columns
```

**PanelCreation**
```javascript
// OLD: panelCount, membersPerPanel fields
// NEW: facultyEmployeeIds array
// Update any code expecting panel count distribution
```

---

## 🚀 Development Tips

### Testing Faculty Phone
- Valid: "9876543210" (10 digits)
- Invalid: "987-654-3210" (with dashes)
- Invalid: "987 654 3210" (with spaces)

### Testing Panel Faculty IDs
- Must be valid employee IDs from faculty database
- Check faculty schema for existing IDs
- Use validation endpoint before creating panels

### Testing Deadline Locking
- Set past date in department config
- Component checks on mount + every 60 seconds
- Manually refresh to see changes immediately
- Check browser console for error logs

### Testing Excel Upload
- File size max: 5MB
- Columns must match template exactly
- No blank rows in middle of data
- File type: .xlsx or .xls

### Testing Access Requests
- Fill all required fields (feature, reason, deadline)
- Priority affects urgency indication
- Status updates when admin approves/rejects
- Can track request in history tab

---

## 🔧 Troubleshooting

| Issue | Check |
|-------|-------|
| Phone validation fails | Ensure 10 digits, no special chars |
| Faculty not found in panel | Verify employee ID exists in database |
| Team size exceeds limit | Check department config team size |
| Excel won't parse | Verify column headers match template |
| Deadline not locking feature | Check department config has deadline |
| Access request not submitting | Verify all required fields are filled |
| Toast notifications not showing | Check useToast hook import |
| Component won't render | Check all required props passed |

---

## 📚 Key Files to Review

### For Frontend Development
1. **AcademicFilterSelector.jsx** - Filter pattern reference
2. **TeamMembersSelector.jsx** - Modal/mode pattern reference
3. **PanelCreation.jsx** - Multi-mode component pattern
4. **panelUtils.js** - Excel handling pattern

### For Backend Development
1. **BACKEND_IMPLEMENTATION_CHECKLIST.md** - Detailed backend spec
2. **accessRequestSchema.js** - Request tracking schema
3. **facultySchema.js** - Updated field requirements
4. **panelSchema.js** - New field specifications

### For Integration Testing
1. **COMPLETE_IMPLEMENTATION_REPORT.md** - Testing checklist
2. **IMPLEMENTATION_STATUS.md** - Component changes summary

---

## 📞 Quick Links

- **Component Props:** Check JSDoc comments in each file
- **Validation Rules:** See validation.js middleware
- **Error Handling:** Check useToast hook documentation
- **API Endpoints:** See BACKEND_IMPLEMENTATION_CHECKLIST.md
- **Database Schemas:** Check server/models/ directory

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All components render without errors
- [ ] Form validation works correctly
- [ ] File upload accepts only valid files
- [ ] Toast notifications display properly
- [ ] Navigation between pages works
- [ ] Deadline checking is accurate
- [ ] Access request workflow completes
- [ ] No console errors or warnings
- [ ] Performance is acceptable
- [ ] Mobile responsiveness works

---

**Version:** 1.0  
**Last Updated:** Current Session  
**Maintained By:** Project Team  

For detailed information, refer to:
- IMPLEMENTATION_STATUS.md
- BACKEND_IMPLEMENTATION_CHECKLIST.md
- COMPLETE_IMPLEMENTATION_REPORT.md

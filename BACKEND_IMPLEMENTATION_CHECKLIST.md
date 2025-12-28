# CPMS Backend Implementation Checklist

## Routes That Need Creation/Updates

### 1. Access Request Routes
**File:** `server/routes/accessRequestRoutes.js` (NEW)

```javascript
// POST /api/access-requests
// Create new access request
// Body: {featureName, reason, priority, requiredDeadline}
// Returns: Created access request with ID

// GET /api/access-requests
// List all requests for current coordinator
// Query params: ?status=pending|approved|rejected
// Returns: Array of access requests

// GET /api/access-requests/:id
// Get specific request details
// Returns: Full request object

// PATCH /api/access-requests/:id/approve
// Admin endpoint to approve request
// Body: {approvalReason, grantStartTime, grantEndTime}
// Returns: Updated request with approval details

// PATCH /api/access-requests/:id/reject
// Admin endpoint to reject request
// Body: {rejectionReason}
// Returns: Updated request with rejection

// DELETE /api/access-requests/:id
// Delete/withdraw request (coordinator only)
// Returns: Success message
```

### 2. Panel Routes Updates
**File:** `server/routes/projectCoordinatorRoutes.js` (UPDATE panels section)

```javascript
// POST /api/coordinator/panels/validate-faculty
// Validate faculty employee IDs exist
// Body: {facultyEmployeeIds: [array], department, school}
// Returns: {valid: boolean, invalidIds: [array]}

// POST /api/coordinator/panels
// Create panels (updated to support new schema)
// Body supports:
// - Manual: {panelName, facultyEmployeeIds}
// - Auto: {totalPanels, specializations, panelType}
// - Upload: File upload with Excel data
// Returns: Created panels array

// GET /api/coordinator/panels
// Get coordinator's panels
// Returns: Array of panels with facultyEmployeeIds
```

### 3. Faculty Routes Updates
**File:** `server/routes/projectCoordinatorRoutes.js` (UPDATE faculty section)

```javascript
// POST /api/coordinator/faculty
// Create faculty (updated schema with required phone)
// Body: {employeeId, name, emailId, phoneNumber, department?, specialization, school}
// Validation: phone required, department optional

// PATCH /api/coordinator/faculty/:id
// Update faculty with new fields
// Body: {phoneNumber, department?, specialization}
// Returns: Updated faculty

// POST /api/coordinator/faculty/validate
// Validate faculty data before bulk create
// Body: {faculty: [array of faculty objects]}
// Returns: {valid: boolean, errors: [array]}
```

### 4. Project Routes Updates
**File:** `server/routes/projectCoordinatorRoutes.js` (UPDATE projects section)

```javascript
// POST /api/coordinator/projects
// Create project (without description and guideName)
// Body: {projectTitle, guideEmployeeID, teamMembers: [array]}
// teamMembers: [{registrationNumber, name?}]
// Returns: Created project

// POST /api/coordinator/projects/validate
// Validate project data
// Body: {projectTitle, guideEmployeeID, teamMembers}
// Returns: {valid: boolean, errors: [array]}
```

### 5. Department Config Routes
**File:** `server/routes/projectCoordinatorRoutes.js` or new route

```javascript
// GET /api/department-config/deadlines
// Get deadline status for current department
// Returns: {
//   facultyDeadline: date,
//   projectDeadline: date,
//   studentDeadline: date,
//   panelDeadline: date,
//   lockedFeatures: [array of locked feature names]
// }

// GET /api/department-config/team-size
// Get max team size for department
// Returns: {maxTeamSize: number}
```

## Controllers That Need Updates

### 1. New Controller: AccessRequestController
**File:** `server/controllers/accessRequestController.js` (NEW)

```javascript
// createAccessRequest(req, res)
// - Validate input
// - Check if request already pending
// - Create AccessRequest document
// - Send notification to admin

// getAccessRequests(req, res)
// - Get requests for current coordinator
// - Filter by status if provided
// - Return with pagination

// getAccessRequestById(req, res)
// - Get single request details
// - Check authorization

// approveAccessRequest(req, res)
// - Admin only
// - Validate approval data
// - Set grant period
// - Update status to approved
// - Notify coordinator

// rejectAccessRequest(req, res)
// - Admin only
// - Add rejection reason
// - Update status to rejected
// - Notify coordinator

// withdrawAccessRequest(req, res)
// - Coordinator only
// - Can only withdraw pending requests
// - Update status to withdrawn
```

### 2. Update: projectCoordinatorController.js

#### For Faculty Management
```javascript
// createFaculty(req, res)
// CHANGES:
// - Make phoneNumber required validation
// - Make department optional
// - Support specialization field
// - Validate phone number format

// bulkCreateFaculty(req, res)
// CHANGES:
// - Parse Excel with new columns (phoneNumber, specialization)
// - Validate required phone field
// - Handle optional department
```

#### For Project Management
```javascript
// createProject(req, res)
// CHANGES:
// - Remove projectDescription from required validation
// - Remove guideName from required validation
// - Support teamMembers as array of objects
// - Validate array structure

// bulkCreateProjects(req, res)
// CHANGES:
// - Parse Excel without description/guideName columns
// - Handle new template format
// - Validate team member format
```

#### For Panel Management
```javascript
// createPanel(req, res)
// CHANGES:
// - Support facultyEmployeeIds array input
// - Validate faculty IDs exist in database
// - Support new panelType field
// - Support specializations array
// - Make panelName optional

// bulkCreatePanels(req, res)
// CHANGES:
// - Parse Excel with new panel template
// - Validate faculty employee IDs
// - Handle flexible faculty column count

// validateFacultyIds(req, res) - NEW
// - Check if faculty employee IDs exist
// - Return validation result
// - Prevent creating panels with non-existent faculty

// assignPanelsManually(req, res) - NEW
// - Assign specific projects to panels
// - Update panel with project assignments

// assignPanelsAuto(req, res) - NEW
// - Auto-assign using selected strategy
// - Implement distribution algorithms
```

### 3. Update: Existing Models

#### Faculty Model
```javascript
// Add validation for phoneNumber
facultySchema.pre('save', function(next) {
  // Validate phone number format (10 digits for India)
  if (this.phoneNumber && !/^\d{10}$/.test(this.phoneNumber)) {
    next(new Error('Invalid phone number format'));
  }
  next();
});
```

#### Panel Model
```javascript
// Add method to validate faculty IDs exist
panelSchema.methods.validateFacultyIds = async function() {
  const Faculty = mongoose.model('Faculty');
  const faculties = await Faculty.find({
    employeeId: {$in: this.facultyEmployeeIds}
  });
  return faculties.length === this.facultyEmployeeIds.length;
};

// Add indexes for new queries
panelSchema.index({facultyEmployeeIds: 1});
panelSchema.index({panelType: 1});
```

## Middleware Updates

### 1. Deadline Check Middleware
**File:** `server/middlewares/deadlineCheck.js` (NEW)

```javascript
// Middleware to check if feature is locked by deadline
// Usage: router.get('/path', deadlineCheck('feature_name'), handler)

// Checks department config deadlines
// Returns 403 Forbidden if deadline passed
// Include deadline info in response for client redirect
```

### 2. Validation Middleware Updates
**File:** `server/middlewares/validation.js` (UPDATE)

```javascript
// Add validations for:
// - phoneNumber: Required, 10 digits
// - specialization: Optional, string
// - facultyEmployeeIds: Array of strings
// - panelType: Enum check
// - accessRequest fields: Feature name, reason, priority, deadline
```

## Service Layer Updates

### 1. New Service: accessRequestService.js
**File:** `server/services/accessRequestService.js` (NEW)

```javascript
// createRequest(coordinatorId, featureName, reason, priority, deadline)
// getCoordinatorRequests(coordinatorId, filters)
// approveRequest(requestId, approvalReason, grantPeriod)
// rejectRequest(requestId, rejectionReason)
// checkFeatureLock(coordinatorId, featureName)
// sendNotifications(requestId, action)
```

### 2. Update: facultyService.js
```javascript
// validatePhoneNumber(phone) - NEW
// validateSpecialization(spec) - NEW
// createFacultyWithValidation(data)
// bulkCreateWithPhoneSpecialization(facultyArray)
```

### 3. Update: panelService.js
```javascript
// validateFacultyEmployeeIds(ids, department, school) - NEW
// createPanelWithFacultyIds(panelData) - NEW
// autoAssignPanels(strategy, options) - NEW
// getAssignmentStrategy(name)
```

## Database Index Creation

```javascript
// AccessRequest indexes (in migration)
db.accessrequests.createIndex({requestedBy: 1, status: 1});
db.accessrequests.createIndex({school: 1, status: 1});
db.accessrequests.createIndex({featureName: 1, status: 1});
db.accessrequests.createIndex({priority: 1, status: 1});
db.accessrequests.createIndex({submittedAt: -1});

// Panel indexes (in migration)
db.panels.createIndex({facultyEmployeeIds: 1});
db.panels.createIndex({panelType: 1});
```

## Sample Request/Response Examples

### Create Access Request
```bash
POST /api/access-requests
Content-Type: application/json

{
  "featureName": "faculty_management",
  "reason": "Need to add missing faculty member urgently",
  "priority": "high",
  "requiredDeadline": "2024-02-20T18:00:00Z"
}

Response 201:
{
  "_id": "507f1f77bcf86cd799439011",
  "featureName": "faculty_management",
  "reason": "Need to add missing faculty member urgently",
  "priority": "high",
  "requiredDeadline": "2024-02-20T18:00:00Z",
  "status": "pending",
  "submittedAt": "2024-02-18T10:30:00Z",
  "requestedBy": "507f1f77bcf86cd799439012",
  "school": "Engineering",
  "department": "CSE"
}
```

### Get Department Deadlines
```bash
GET /api/department-config/deadlines

Response 200:
{
  "facultyDeadline": "2024-02-15T23:59:59Z",
  "projectDeadline": "2024-02-20T23:59:59Z",
  "studentDeadline": "2024-02-10T23:59:59Z",
  "panelDeadline": "2024-02-25T23:59:59Z",
  "lockedFeatures": ["faculty_management", "student_management"]
}
```

### Create Panel with Faculty IDs
```bash
POST /api/coordinator/panels
Content-Type: application/json

{
  "panelName": "Panel A",
  "facultyEmployeeIds": ["EMP001", "EMP002", "EMP003"],
  "specializations": ["AI/ML", "Web Dev"],
  "panelType": "regular",
  "school": "Engineering",
  "department": "CSE",
  "academicYear": "2024-25",
  "semester": "Fall"
}

Response 201:
{
  "_id": "507f1f77bcf86cd799439013",
  "panelName": "Panel A",
  "facultyEmployeeIds": ["EMP001", "EMP002", "EMP003"],
  "specializations": ["AI/ML", "Web Dev"],
  "panelType": "regular",
  "school": "Engineering",
  "department": "CSE",
  "academicYear": "2024-25",
  "semester": "Fall",
  "createdAt": "2024-02-18T10:30:00Z"
}
```

## Implementation Priority

1. **High Priority:**
   - AccessRequestController and routes
   - Faculty phoneNumber validation
   - Panel facultyEmployeeIds support
   - Department deadline endpoints

2. **Medium Priority:**
   - Panel auto-assignment strategies
   - Request notification system
   - Deadline check middleware
   - Panel validation service

3. **Low Priority:**
   - Analytics for access requests
   - Audit logging for approvals
   - Email notifications for status changes

## Error Handling

All endpoints should return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden (deadline passed)
- 404: Not Found
- 500: Server Error

Always include error messages in response:
```json
{
  "success": false,
  "message": "Specific error message",
  "errors": ["field1: error message"]
}
```

---

**Note:** This checklist is based on frontend implementation completed. Backend should follow these specifications for seamless integration.


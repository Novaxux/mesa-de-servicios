# Frontend Reports - CSV Export Functionality

## Overview

This document describes the CSV export functionality added to the mobile frontend for the reports module, implementing role-based access control.

## Implementation Summary

### Modified Screens

#### 1. ReportsScreen.js (Admin Dashboard)

**Location:** `mobile/screens/Admin/ReportsScreen.js`

**Export Buttons Added:**

- **Tickets CSV** - Available to all users with report permissions
- **SLA CSV** - Available to all users with report permissions
- **Technicians CSV** - Available to Admin only (role-based)
- **Incidents CSV** - Available to Admin only (role-based)
- **Feedback CSV** - Available to Admin only (role-based)

**Features:**

- Role-based button visibility using `isAdmin` check
- Opens system browser for CSV download
- Includes authentication token in URL
- Default date range: Last 30 days
- Success/error alerts for user feedback

#### 2. TechnicianReportsScreen.js

**Location:** `mobile/screens/Admin/TechnicianReportsScreen.js`

**Export Button:**

- **Technicians CSV** - Exports technician performance data

#### 3. IncidentReportsScreen.js

**Location:** `mobile/screens/Admin/IncidentReportsScreen.js`

**Export Button:**

- **Incidents CSV** - Exports recurring incident analysis

#### 4. FeedbackReportsScreen.js

**Location:** `mobile/screens/Admin/FeedbackReportsScreen.js`

**Export Button:**

- **Feedback CSV** - Exports user feedback ratings and comments

## Technical Implementation

### Imports Added

```javascript
import { Linking } from "react-native";
import { getAuthToken } from "../../services/api";
```

### Export Handler Pattern

```javascript
const handleExportCSV = async (exportType) => {
  try {
    const token = getAuthToken();
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const dateTo = new Date().toISOString().split("T")[0];

    let url;
    switch (exportType) {
      case "tickets":
        url = await reportService.exportTicketsCSV(dateFrom, dateTo);
        break;
      // ... other cases
    }

    const urlWithAuth = `${url}&token=${token}`;

    const supported = await Linking.canOpenURL(urlWithAuth);
    if (supported) {
      await Linking.openURL(urlWithAuth);
      window.alert("Descargando reporte...");
    } else {
      window.alert("No se puede abrir el enlace de descarga");
    }
  } catch (error) {
    console.error("Error exporting CSV:", error);
    window.alert("Error al exportar el reporte");
  }
};
```

### UI Components

```javascript
// Role-based button visibility
{
  isAdmin && (
    <TouchableOpacity
      style={styles.exportButton}
      onPress={() => handleExportCSV("technicians")}
    >
      <Text style={styles.exportButtonText}>📥 Exportar Técnicos CSV</Text>
    </TouchableOpacity>
  );
}

// Always visible button
<TouchableOpacity
  style={styles.exportButton}
  onPress={() => handleExportCSV("tickets")}
>
  <Text style={styles.exportButtonText}>📥 Exportar Tickets CSV</Text>
</TouchableOpacity>;
```

### Styles

```javascript
exportButton: {
  backgroundColor: "#fff",
  padding: 12,
  borderRadius: 8,
  marginTop: 15,
  alignItems: "center",
},
exportButtonText: {
  color: "#2196F3",
  fontSize: 14,
  fontWeight: "600",
},
```

## Role-Based Access Control

### Admin Users

Admin users can export all 5 report types:

- ✅ Tickets CSV
- ✅ SLA CSV
- ✅ Technicians CSV
- ✅ Incidents CSV
- ✅ Feedback CSV

### Technician Users

Technician users can only export:

- ✅ Tickets CSV
- ✅ SLA CSV

### Implementation

```javascript
const { isAdmin } = usePermissions();

// Conditional rendering
{
  isAdmin && <TouchableOpacity>...</TouchableOpacity>;
}
```

## Date Range Handling

### Default Range

All exports default to the last 30 days:

```javascript
const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];
const dateTo = new Date().toISOString().split("T")[0];
```

### Future Enhancement

Date picker component could be added to allow custom date ranges:

```javascript
// Potential implementation
<DateRangePicker
  onSelect={(from, to) => {
    setDateFrom(from);
    setDateTo(to);
  }}
/>
```

## Authentication Flow

### Token Handling

1. **Extract Token:** `getAuthToken()` retrieves stored JWT token
2. **Append to URL:** Token added as query parameter for file download
3. **Backend Validation:** Middleware accepts token from query params
4. **Security:** Token should be time-limited (implement in future)

### URL Structure

```
https://api.example.com/reports/export/tickets/csv?date_from=2024-01-01&date_to=2024-01-31&token=eyJhbGc...
```

## Browser Interaction

### Linking API

React Native's `Linking` module opens URLs in the system browser:

```javascript
const supported = await Linking.canOpenURL(url);
if (supported) {
  await Linking.openURL(url);
}
```

### Why Browser?

- Mobile apps can't directly download files
- System browser handles file downloads natively
- Browser presents native "Save" dialog
- Works across iOS, Android, and web platforms

## User Experience

### Success Flow

1. User taps "📥 Exportar a CSV" button
2. Alert: "Descargando reporte de [tipo]..."
3. Browser opens with download
4. File saved to device/downloads folder

### Error Handling

- Invalid token: Backend returns 401
- Network error: Alert shows "Error al exportar el reporte"
- URL not supported: Alert shows "No se puede abrir el enlace de descarga"

## Testing Checklist

### Functional Testing

- [ ] Admin can see all 5 export buttons on ReportsScreen
- [ ] Technician only sees Tickets and SLA export buttons
- [ ] Each export button opens browser with CSV download
- [ ] Token included in URL and validated by backend
- [ ] CSV file downloads successfully
- [ ] CSV format is correct (RFC 4180 compliant)
- [ ] Date range applied correctly (last 30 days)

### Role Testing

- [ ] Test with admin user account
- [ ] Test with technician user account
- [ ] Test with regular user account (no access)
- [ ] Verify unauthorized users get 403 error

### Error Testing

- [ ] Test with expired token
- [ ] Test with invalid token
- [ ] Test with network disconnected
- [ ] Test with backend server down

## Files Modified

### Mobile Frontend

1. `mobile/screens/Admin/ReportsScreen.js`

   - Added 5 export buttons with role filtering
   - Added handleExportCSV() function
   - Added dateFrom/dateTo state
   - Added exportButton styles

2. `mobile/screens/Admin/TechnicianReportsScreen.js`

   - Added Technicians CSV export button
   - Added handleExportCSV() function
   - Added exportButton styles

3. `mobile/screens/Admin/IncidentReportsScreen.js`

   - Added Incidents CSV export button
   - Added handleExportCSV() function
   - Added exportButton styles

4. `mobile/screens/Admin/FeedbackReportsScreen.js`
   - Added Feedback CSV export button
   - Added handleExportCSV() function
   - Added exportButton styles

### Already Modified (Previous Work)

- `mobile/services/api.js` - Export URL generators
- `controllers/reportController.js` - CSV generation endpoints
- `middleware/auth.js` - Query token support
- `routes/reports.js` - Export routes

## Integration Points

### API Service

```javascript
// mobile/services/api.js
export const reportService = {
  exportTicketsCSV: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    return `${API_BASE_URL}/reports/export/tickets/csv?${params.toString()}`;
  },
  // ... other export methods
};
```

### Backend Endpoints

```javascript
// routes/reports.js
router.get(
  "/export/tickets/csv",
  authenticate,
  reportController.exportTicketsCSV
);
router.get("/export/sla/csv", authenticate, reportController.exportSLACSV);
router.get(
  "/export/technicians/csv",
  authenticate,
  authorize(["admin"]),
  reportController.exportTechniciansCSV
);
router.get(
  "/export/incidents/csv",
  authenticate,
  authorize(["admin"]),
  reportController.exportIncidentsCSV
);
router.get(
  "/export/feedback/csv",
  authenticate,
  authorize(["admin"]),
  reportController.exportFeedbackCSV
);
```

## Security Considerations

### Current Implementation

- ✅ JWT authentication required
- ✅ Role-based authorization
- ✅ Token in query params for downloads
- ⚠️ Token visible in browser URL (temporary exposure)

### Recommendations

1. **Token Expiration:** Implement short-lived tokens for exports
2. **One-Time URLs:** Generate single-use download URLs
3. **Rate Limiting:** Prevent abuse of export endpoints
4. **Audit Logging:** Track who exports what data
5. **Data Filtering:** Ensure users only export their permitted data

## Future Enhancements

### Planned Features

- [ ] Date range picker for custom periods
- [ ] Export progress indicator
- [ ] Local cache of downloaded reports
- [ ] Share functionality (email, messaging)
- [ ] Multiple format support (Excel, PDF)
- [ ] Scheduled reports (automated exports)
- [ ] Export history/log

### UI Improvements

- [ ] Loading spinner during export
- [ ] Success confirmation with file size
- [ ] Recent exports list
- [ ] Export presets (last week, last month, etc.)

## Support and Troubleshooting

### Common Issues

**Issue:** CSV download doesn't start
**Solution:** Check token validity, verify backend is running

**Issue:** 403 Forbidden error
**Solution:** Verify user has correct role/permissions

**Issue:** CSV file is empty
**Solution:** Check date range has data, verify query parameters

**Issue:** Browser doesn't open
**Solution:** Verify Linking permissions on mobile app

### Debug Mode

Enable debug logging:

```javascript
console.log("Export URL:", urlWithAuth);
console.log("Token:", token.substring(0, 20) + "...");
console.log("Date Range:", dateFrom, "to", dateTo);
```

## Conclusion

The CSV export functionality is now fully integrated into the mobile frontend with proper role-based access control. Admin users have full access to all exports, while technicians have limited access to only ticket and SLA reports. The implementation uses native browser downloads for cross-platform compatibility and includes proper authentication and error handling.

For API documentation and backend details, see [REPORTES_README.md](REPORTES_README.md).

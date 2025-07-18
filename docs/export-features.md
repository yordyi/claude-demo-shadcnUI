# Export Features Documentation

## Overview

The project management system provides comprehensive export functionality for tasks, projects, analytics, and team data. Users can export data in multiple formats including CSV, Excel, PDF, and JSON.

## Export Formats

### CSV (Comma-Separated Values)
- **Best for**: Simple data analysis, importing to other tools
- **Features**: 
  - Lightweight and universally compatible
  - Can be opened in Excel, Google Sheets, or any text editor
  - Supports custom field selection
  - Handles nested data with dot notation

### Excel (XLSX)
- **Best for**: Complex reports, multiple datasets
- **Features**:
  - Multiple sheets in a single file
  - Formatted headers and styling
  - Summary statistics sheets
  - Charts and pivot table ready data

### PDF (Portable Document Format)
- **Best for**: Reports, presentations, printing
- **Features**:
  - Professional formatting
  - Page headers and footers
  - Charts and visualizations
  - Table of contents for large reports

### JSON (JavaScript Object Notation)
- **Best for**: Data backup, API integration, developers
- **Features**:
  - Complete data structure preservation
  - Includes relationships and metadata
  - Machine-readable format
  - Supports data import/restore

## Components

### 1. TaskExportButton
Quick export button for task lists with dropdown menu.

```tsx
import { TaskExportButton } from '@/components/export'

<TaskExportButton 
  tasks={tasks} 
  variant="outline"
  size="default"
/>
```

**Features**:
- Quick export in any format
- Advanced export dialog
- Respects current filters
- Batch task export

### 2. ProjectReportExport
Generate comprehensive project reports.

```tsx
import { ProjectReportExport } from '@/components/export'

<ProjectReportExport 
  project={project} 
  tasks={projectTasks}
/>
```

**Features**:
- Multi-page PDF reports
- Excel workbooks with multiple sheets
- Include/exclude sections
- Project timeline visualization

### 3. AnalyticsExport
Export analytics data and visualizations.

```tsx
import { AnalyticsExport } from '@/components/export'

<AnalyticsExport 
  data={{
    charts: chartData,
    metrics: metricsData,
    rawData: rawData
  }}
  projectName="My Project"
/>
```

**Features**:
- Export charts as images (PDF)
- Raw data in tabular format
- Combined reports
- Chart selection

### 4. ExportDialog
Advanced export dialog with full customization.

```tsx
import { ExportDialog } from '@/components/export'

<ExportDialog
  open={open}
  onOpenChange={setOpen}
  dataType="tasks"
  onExport={handleExport}
  availableFields={fields}
  totalCount={100}
/>
```

**Features**:
- Format selection
- Field selection
- Date range filtering
- Template support
- Preview option

### 5. BatchExportDialog
Export multiple projects at once.

```tsx
import { BatchExportDialog } from '@/components/export'

<BatchExportDialog
  open={open}
  onOpenChange={setOpen}
  projects={projects}
  onExport={fetchDetailedProjects}
/>
```

**Features**:
- Multi-project selection
- Combined or separate exports
- Content type selection
- Progress tracking

### 6. ExportHistory
Track and manage export history.

```tsx
import { ExportHistory } from '@/components/export'

<ExportHistory />
```

**Features**:
- View past exports
- Re-download files
- Delete old exports
- Filter by date/type

## Utility Functions

### CSV Export
```typescript
import { exportToCSV, exportTasksToCSV } from '@/lib/export'

// Generic CSV export
exportToCSV(data, {
  filename: 'export.csv',
  fields: ['name', 'email', 'role'],
  dateFormat: 'yyyy-MM-dd'
})

// Task-specific export
exportTasksToCSV(tasks, {
  filename: 'tasks.csv'
})
```

### Excel Export
```typescript
import { exportToExcel, exportTasksToExcel } from '@/lib/export'

// Single sheet export
exportToExcel(data, {
  filename: 'export.xlsx',
  sheetName: 'Data',
  headers: { name: 'Full Name', email: 'Email Address' }
})

// Multi-sheet task export
exportTasksToExcel({
  tasks: taskData,
  summary: summaryStats,
  byStatus: statusBreakdown,
  byPriority: priorityBreakdown
})
```

### PDF Export
```typescript
import { exportToPDF, exportProjectReportToPDF } from '@/lib/export'

// Table PDF export
exportToPDF(data, columns, {
  filename: 'report.pdf',
  title: 'Monthly Report',
  orientation: 'landscape'
})

// Project report PDF
exportProjectReportToPDF(project, tasks, {
  title: 'Project Status Report'
})
```

### JSON Export
```typescript
import { exportToJSON, exportBackupJSON } from '@/lib/export'

// Simple JSON export
exportToJSON(data, {
  filename: 'data.json',
  pretty: true,
  includeMetadata: true
})

// Backup export
exportBackupJSON({
  projects: projectData,
  tasks: taskData,
  users: userData
})
```

## Export Templates

Pre-defined export templates for common use cases:

```typescript
import { EXPORT_TEMPLATES } from '@/lib/export'

// Available templates:
// - TASK_LIST: Basic task information
// - PROJECT_SUMMARY: Project overview with stats
// - SPRINT_REPORT: Sprint-specific task data
// - TEAM_PRODUCTIVITY: Team member metrics
```

## Best Practices

1. **Performance**
   - For large datasets (>1000 records), use pagination
   - Consider server-side export for very large files
   - Use progress indicators for long operations

2. **Security**
   - Respect user permissions in exports
   - Sanitize sensitive data (passwords, tokens)
   - Add watermarks to PDF exports if needed

3. **User Experience**
   - Provide export preview when possible
   - Save export preferences
   - Allow custom filename input
   - Show estimated file size

4. **Data Integrity**
   - Include export metadata (date, user, version)
   - Validate data before export
   - Handle special characters properly
   - Preserve data types in JSON exports

## Email Export Integration

For email exports, prepare data in API-ready format:

```typescript
import { exportForAPI } from '@/lib/export'

exportForAPI(data, '/api/email/export', {
  filename: 'email-ready.json'
})
```

This creates a JSON file with:
- API endpoint configuration
- Request headers
- Formatted request body

## Examples

### Export Current View
```typescript
// Export exactly what user sees
const visibleTasks = filterTasks(allTasks, currentFilters)
exportTasksToCSV(visibleTasks)
```

### Scheduled Export
```typescript
// Weekly report generation
const weeklyReport = async () => {
  const tasks = await fetchTasksForWeek()
  exportTasksToExcel({
    tasks,
    summary: calculateWeeklySummary(tasks)
  })
}
```

### Custom Field Export
```typescript
// Export with specific fields only
exportToCSV(users, {
  fields: ['name', 'email', 'department', 'lastLogin'],
  filename: 'active-users.csv'
})
```

## Troubleshooting

### Common Issues

1. **Large File Exports**
   - Solution: Use streaming exports or server-side generation
   - Consider breaking into multiple smaller exports

2. **Special Characters**
   - Solution: UTF-8 encoding is used by default
   - For Excel, use proper cell formatting

3. **Date Formatting**
   - Solution: Specify dateFormat in export options
   - Use ISO format for consistency

4. **Memory Issues**
   - Solution: Limit export size
   - Use pagination for large datasets

## Future Enhancements

- Scheduled exports
- Export templates marketplace
- Cloud storage integration
- Real-time collaborative exports
- Export automation API
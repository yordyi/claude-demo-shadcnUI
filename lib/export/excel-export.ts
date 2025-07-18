import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

export interface ExcelExportOptions {
  filename?: string
  sheetName?: string
  dateFormat?: string
  headers?: Record<string, string> // Custom header names
  columnWidths?: number[] // Column widths
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExcelExportOptions = {}
) {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.xlsx`,
    sheetName = 'Sheet1',
    dateFormat = 'yyyy-MM-dd HH:mm:ss',
    headers = {},
    columnWidths = []
  } = options

  // Transform data
  const transformedData = data.map(item => {
    const transformed: Record<string, any> = {}

    Object.entries(item).forEach(([key, value]) => {
      const headerName = headers[key] || key

      if (value instanceof Date) {
        transformed[headerName] = format(value, dateFormat)
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        if (value.name) {
          transformed[headerName] = value.name
        } else {
          transformed[headerName] = JSON.stringify(value)
        }
      } else {
        transformed[headerName] = value
      }
    })

    return transformed
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(transformedData)

  // Apply column widths if provided
  if (columnWidths.length > 0) {
    ws['!cols'] = columnWidths.map(width => ({ width }))
  }

  // Apply styles to header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!ws[address]) continue
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "CCCCCC" } },
      alignment: { horizontal: "center" }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, filename)
}

// Task export with multiple sheets
export function exportTasksToExcel(data: {
  tasks: any[]
  summary?: any
  byStatus?: any[]
  byPriority?: any[]
}, options?: ExcelExportOptions) {
  const wb = XLSX.utils.book_new()
  const filename = options?.filename || `tasks-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`

  // Tasks sheet
  if (data.tasks && data.tasks.length > 0) {
    const tasksWs = XLSX.utils.json_to_sheet(
      data.tasks.map(task => ({
        'Task ID': task.id,
        'Title': task.title,
        'Status': task.status,
        'Priority': task.priority,
        'Assignee': task.assignee?.name || 'Unassigned',
        'Project': task.project?.name || '',
        'Due Date': task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        'Created': format(new Date(task.createdAt), 'yyyy-MM-dd'),
        'Description': task.description || ''
      }))
    )

    // Set column widths
    tasksWs['!cols'] = [
      { width: 15 }, // Task ID
      { width: 40 }, // Title
      { width: 15 }, // Status
      { width: 15 }, // Priority
      { width: 20 }, // Assignee
      { width: 25 }, // Project
      { width: 15 }, // Due Date
      { width: 15 }, // Created
      { width: 50 }  // Description
    ]

    XLSX.utils.book_append_sheet(wb, tasksWs, 'Tasks')
  }

  // Summary sheet
  if (data.summary) {
    const summaryData = [
      ['Task Summary Report'],
      ['Generated on:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      [],
      ['Total Tasks:', data.summary.total || 0],
      ['Completed:', data.summary.completed || 0],
      ['In Progress:', data.summary.inProgress || 0],
      ['To Do:', data.summary.todo || 0],
      [],
      ['High Priority:', data.summary.highPriority || 0],
      ['Medium Priority:', data.summary.mediumPriority || 0],
      ['Low Priority:', data.summary.lowPriority || 0]
    ]

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
  }

  // By Status sheet
  if (data.byStatus && data.byStatus.length > 0) {
    const statusWs = XLSX.utils.json_to_sheet(data.byStatus)
    XLSX.utils.book_append_sheet(wb, statusWs, 'By Status')
  }

  // By Priority sheet
  if (data.byPriority && data.byPriority.length > 0) {
    const priorityWs = XLSX.utils.json_to_sheet(data.byPriority)
    XLSX.utils.book_append_sheet(wb, priorityWs, 'By Priority')
  }

  // Generate Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, filename)
}

// Project export with team and task breakdown
export function exportProjectsToExcel(projects: any[], options?: ExcelExportOptions) {
  const headers = {
    name: 'Project Name',
    key: 'Project Key',
    status: 'Status',
    'owner.name': 'Owner',
    startDate: 'Start Date',
    endDate: 'End Date',
    '_count.tasks': 'Total Tasks',
    '_count.members': 'Team Size',
    createdAt: 'Created Date'
  }

  const transformedProjects = projects.map(project => ({
    'Project Name': project.name,
    'Project Key': project.key,
    'Status': project.status,
    'Owner': project.owner?.name || '',
    'Start Date': project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
    'End Date': project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
    'Total Tasks': project._count?.tasks || 0,
    'Team Size': project._count?.members || 0,
    'Created Date': format(new Date(project.createdAt), 'yyyy-MM-dd')
  }))

  exportToExcel(transformedProjects, {
    filename: `projects-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Projects',
    columnWidths: [30, 15, 15, 20, 15, 15, 15, 15, 15],
    ...options
  })
}
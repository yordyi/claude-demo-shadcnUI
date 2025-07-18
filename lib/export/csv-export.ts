import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

export interface ExportOptions {
  filename?: string
  fields?: string[]
  dateFormat?: string
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
) {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`,
    fields,
    dateFormat = 'yyyy-MM-dd HH:mm:ss'
  } = options

  // Transform data to handle nested objects and dates
  const transformedData = data.map(item => {
    const transformed: Record<string, any> = {}

    // If fields are specified, only include those
    const keys = fields || Object.keys(item)

    keys.forEach(key => {
      const value = getNestedValue(item, key)
      
      if (value instanceof Date) {
        transformed[key] = format(value, dateFormat)
      } else if (typeof value === 'object' && value !== null) {
        transformed[key] = JSON.stringify(value)
      } else {
        transformed[key] = value
      }
    })

    return transformed
  })

  // Generate CSV
  const csv = Papa.unparse(transformedData, {
    header: true,
    skipEmptyLines: true
  })

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

// Helper function to get nested values using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

// Task-specific export
export function exportTasksToCSV(tasks: any[], options?: ExportOptions) {
  const defaultFields = [
    'title',
    'status',
    'priority',
    'assignee.name',
    'project.name',
    'dueDate',
    'createdAt',
    'description'
  ]

  return exportToCSV(tasks, {
    filename: `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    fields: defaultFields,
    ...options
  })
}

// Project-specific export
export function exportProjectsToCSV(projects: any[], options?: ExportOptions) {
  const defaultFields = [
    'name',
    'key',
    'status',
    'owner.name',
    'startDate',
    'endDate',
    '_count.tasks',
    '_count.members',
    'createdAt'
  ]

  return exportToCSV(projects, {
    filename: `projects-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    fields: defaultFields,
    ...options
  })
}

// Team member export
export function exportTeamMembersToCSV(members: any[], options?: ExportOptions) {
  const defaultFields = [
    'user.name',
    'user.email',
    'role',
    'joinedAt',
    'permissions'
  ]

  return exportToCSV(members, {
    filename: `team-members-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    fields: defaultFields,
    ...options
  })
}
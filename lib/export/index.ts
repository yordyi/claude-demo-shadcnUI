// Export all utilities
export * from './csv-export'
export * from './excel-export'
export * from './pdf-export'
export * from './json-export'

// Common export types
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json'

export interface ExportConfig {
  format: ExportFormat
  filename?: string
  dateRange?: {
    start: Date
    end: Date
  }
  fields?: string[]
  includeRelations?: boolean
}

// Export templates
export const EXPORT_TEMPLATES = {
  TASK_LIST: {
    name: 'Task List',
    description: 'Export all tasks with basic information',
    fields: ['title', 'status', 'priority', 'assignee.name', 'project.name', 'dueDate']
  },
  PROJECT_SUMMARY: {
    name: 'Project Summary',
    description: 'Export project overview with statistics',
    fields: ['name', 'key', 'status', 'owner.name', '_count.tasks', '_count.members']
  },
  SPRINT_REPORT: {
    name: 'Sprint Report',
    description: 'Export sprint tasks and progress',
    fields: ['sprint.name', 'title', 'status', 'assignee.name', 'storyPoints', 'completedAt']
  },
  TEAM_PRODUCTIVITY: {
    name: 'Team Productivity',
    description: 'Export team member productivity metrics',
    fields: ['user.name', 'tasksCompleted', 'tasksInProgress', 'averageCompletionTime']
  }
}
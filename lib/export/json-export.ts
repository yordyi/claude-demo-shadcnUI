import { saveAs } from 'file-saver'
import { format } from 'date-fns'

export interface JSONExportOptions {
  filename?: string
  pretty?: boolean
  includeMetadata?: boolean
}

export function exportToJSON<T>(
  data: T,
  options: JSONExportOptions = {}
) {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`,
    pretty = true,
    includeMetadata = true
  } = options

  let exportData: any = data

  // Add metadata if requested
  if (includeMetadata) {
    exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        totalRecords: Array.isArray(data) ? data.length : 1,
        type: Array.isArray(data) ? 'array' : typeof data
      },
      data
    }
  }

  // Convert to JSON string
  const jsonString = pretty 
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData)

  // Create and download file
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
  saveAs(blob, filename)
}

// Backup export - includes all related data
export function exportBackupJSON(data: {
  projects?: any[]
  tasks?: any[]
  users?: any[]
  settings?: any
}, options?: JSONExportOptions) {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    data: {
      projects: data.projects || [],
      tasks: data.tasks || [],
      users: data.users?.map(user => {
        // Remove sensitive data
        const { password, ...safeUser } = user
        return safeUser
      }) || [],
      settings: data.settings || {}
    },
    counts: {
      projects: data.projects?.length || 0,
      tasks: data.tasks?.length || 0,
      users: data.users?.length || 0
    }
  }

  exportToJSON(backup, {
    filename: `backup-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`,
    pretty: true,
    includeMetadata: false, // Already included in backup structure
    ...options
  })
}

// Export for API integration
export function exportForAPI<T>(
  data: T,
  endpoint: string,
  options?: JSONExportOptions
) {
  const apiExport = {
    endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Export-Date': new Date().toISOString()
    },
    body: data
  }

  exportToJSON(apiExport, {
    filename: `api-export-${endpoint.replace(/\//g, '-')}-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`,
    pretty: true,
    includeMetadata: false,
    ...options
  })
}

// Task-specific JSON export with relationships
export function exportTasksJSON(tasks: any[], options?: JSONExportOptions) {
  const enrichedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee ? {
      id: task.assignee.id,
      name: task.assignee.name,
      email: task.assignee.email
    } : null,
    project: task.project ? {
      id: task.project.id,
      name: task.project.name,
      key: task.project.key
    } : null,
    labels: task.labels?.map((tl: any) => ({
      id: tl.label.id,
      name: tl.label.name,
      color: tl.label.color
    })) || [],
    dates: {
      created: task.createdAt,
      updated: task.updatedAt,
      due: task.dueDate,
      completed: task.completedAt
    },
    metrics: {
      subtasks: task._count?.subtasks || 0,
      comments: task._count?.comments || 0,
      attachments: task._count?.attachments || 0
    }
  }))

  exportToJSON(enrichedTasks, {
    filename: `tasks-export-${format(new Date(), 'yyyy-MM-dd')}.json`,
    ...options
  })
}

// Project export with full details
export function exportProjectJSON(project: any, options?: JSONExportOptions) {
  const projectExport = {
    project: {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      status: project.status,
      visibility: project.visibility,
      dates: {
        created: project.createdAt,
        updated: project.updatedAt,
        start: project.startDate,
        end: project.endDate
      },
      owner: project.owner ? {
        id: project.owner.id,
        name: project.owner.name,
        email: project.owner.email
      } : null
    },
    team: project.members?.map((member: any) => ({
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email
      },
      role: member.role,
      permissions: member.permissions,
      joinedAt: member.joinedAt
    })) || [],
    statistics: {
      totalTasks: project._count?.tasks || 0,
      totalMembers: project._count?.members || 0,
      totalSprints: project._count?.sprints || 0,
      totalLabels: project._count?.labels || 0
    }
  }

  exportToJSON(projectExport, {
    filename: `project-${project.key}-export-${format(new Date(), 'yyyy-MM-dd')}.json`,
    ...options
  })
}
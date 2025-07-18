import { TaskWithRelations } from '@/types/api/responses'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface TaskFilters {
  status: TaskStatus[]
  priority: TaskPriority[]
  assigneeIds: string[]
  labelIds: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
  search: string
}

export interface FilterPreset {
  id: string
  name: string
  icon?: string
  filters: Partial<TaskFilters>
}

export const defaultFilters: TaskFilters = {
  status: [],
  priority: [],
  assigneeIds: [],
  labelIds: [],
  dateRange: {},
  search: '',
}

export const filterPresets: FilterPreset[] = [
  {
    id: 'my-tasks',
    name: 'My Tasks',
    icon: 'User',
    filters: {
      // This will be dynamically set with current user ID
    },
  },
  {
    id: 'due-today',
    name: 'Due Today',
    icon: 'Calendar',
    filters: {
      dateRange: {
        from: new Date(new Date().setHours(0, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    icon: 'AlertCircle',
    filters: {
      priority: ['HIGH', 'URGENT'],
    },
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    icon: 'Clock',
    filters: {
      status: ['IN_PROGRESS', 'IN_REVIEW'],
    },
  },
]

export function filterTasks(
  tasks: TaskWithRelations[],
  filters: TaskFilters
): TaskWithRelations[] {
  return tasks.filter((task) => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status as TaskStatus)) {
      return false
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority as TaskPriority)) {
      return false
    }

    // Assignee filter
    if (filters.assigneeIds.length > 0 && (!task.assignee || !filters.assigneeIds.includes(task.assignee.id))) {
      return false
    }

    // Label filter
    if (filters.labelIds.length > 0) {
      const taskLabelIds = task.labels?.map((tl) => tl.label.id) || []
      if (!filters.labelIds.some((id) => taskLabelIds.includes(id))) {
        return false
      }
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const taskDate = task.dueDate ? new Date(task.dueDate) : null
      if (!taskDate) return false

      if (filters.dateRange.from && taskDate < filters.dateRange.from) {
        return false
      }
      if (filters.dateRange.to && taskDate > filters.dateRange.to) {
        return false
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesTitle = task.title.toLowerCase().includes(searchLower)
      const matchesDescription = task.description?.toLowerCase().includes(searchLower) || false
      const matchesId = task.id.toLowerCase().includes(searchLower)
      
      if (!matchesTitle && !matchesDescription && !matchesId) {
        return false
      }
    }

    return true
  })
}

export function getActiveFilterCount(filters: TaskFilters): number {
  let count = 0
  
  if (filters.status.length > 0) count++
  if (filters.priority.length > 0) count++
  if (filters.assigneeIds.length > 0) count++
  if (filters.labelIds.length > 0) count++
  if (filters.dateRange.from || filters.dateRange.to) count++
  if (filters.search) count++
  
  return count
}

// URL state management
export function filtersToURLParams(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams()
  
  if (filters.status.length > 0) {
    params.set('status', filters.status.join(','))
  }
  if (filters.priority.length > 0) {
    params.set('priority', filters.priority.join(','))
  }
  if (filters.assigneeIds.length > 0) {
    params.set('assignee', filters.assigneeIds.join(','))
  }
  if (filters.labelIds.length > 0) {
    params.set('labels', filters.labelIds.join(','))
  }
  if (filters.dateRange.from) {
    params.set('from', filters.dateRange.from.toISOString())
  }
  if (filters.dateRange.to) {
    params.set('to', filters.dateRange.to.toISOString())
  }
  if (filters.search) {
    params.set('q', filters.search)
  }
  
  return params
}

export function filtersFromURLParams(params: URLSearchParams): Partial<TaskFilters> {
  const filters: Partial<TaskFilters> = {}
  
  const status = params.get('status')
  if (status) {
    filters.status = status.split(',') as TaskStatus[]
  }
  
  const priority = params.get('priority')
  if (priority) {
    filters.priority = priority.split(',') as TaskPriority[]
  }
  
  const assignee = params.get('assignee')
  if (assignee) {
    filters.assigneeIds = assignee.split(',')
  }
  
  const labels = params.get('labels')
  if (labels) {
    filters.labelIds = labels.split(',')
  }
  
  const from = params.get('from')
  const to = params.get('to')
  if (from || to) {
    filters.dateRange = {}
    if (from) filters.dateRange.from = new Date(from)
    if (to) filters.dateRange.to = new Date(to)
  }
  
  const search = params.get('q')
  if (search) {
    filters.search = search
  }
  
  return filters
}
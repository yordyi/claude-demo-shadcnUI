# Task Filtering System

## Overview

The task filtering system provides a comprehensive way to filter and search tasks in the project management system. It includes real-time search, multi-criteria filtering, URL state persistence, and preset filters.

## Components

### 1. TaskSearch Component (`components/tasks/task-search.tsx`)

A search input with the following features:
- Real-time search as you type
- Search history stored in localStorage
- Search by task title, description, or ID
- Clear button for quick reset
- Keyboard shortcuts (Enter to search)

### 2. TaskFilters Component (`components/tasks/task-filters.tsx`)

Advanced filtering options:
- **Status Filter**: Todo, In Progress, In Review, Done
- **Priority Filter**: Low, Medium, High, Urgent
- **Assignee Filter**: Filter by assigned team members
- **Label Filter**: Multi-select labels
- **Date Range Filter**: Filter by due date range

### 3. FilterBar Component (`components/tasks/filter-bar.tsx`)

Combines search and filters with:
- Toggle button to show/hide filters
- Active filter count badge
- Quick filter presets dropdown
- Clear all filters button
- Active filters summary

### 4. Updated TaskBoard Component

The TaskBoard now supports:
- Filtered task display
- Real-time filter updates
- Filter result count
- Integration with FilterBar

## Filter Utilities (`lib/filters.ts`)

### Types

```typescript
interface TaskFilters {
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
```

### Functions

- `filterTasks()`: Filters tasks based on criteria
- `getActiveFilterCount()`: Returns number of active filters
- `filtersToURLParams()`: Converts filters to URL parameters
- `filtersFromURLParams()`: Parses filters from URL

## Quick Filter Presets

1. **My Tasks**: Shows tasks assigned to current user
2. **Due Today**: Tasks due within today
3. **High Priority**: High and Urgent priority tasks
4. **In Progress**: Tasks in progress or review

## URL State Management

All filters are automatically synced with URL parameters:
- `?status=TODO,IN_PROGRESS`
- `?priority=HIGH,URGENT`
- `?assignee=user-id-1,user-id-2`
- `?labels=label-id-1,label-id-2`
- `?from=2024-01-01&to=2024-12-31`
- `?q=search-term`

## Usage Example

```tsx
import { TaskBoard } from '@/components/tasks'

function ProjectPage() {
  const users = [...] // Fetch project users
  const labels = [...] // Fetch project labels
  const currentUserId = 'current-user-id'

  return (
    <TaskBoard
      projectId="project-id"
      users={users}
      labels={labels}
      currentUserId={currentUserId}
    />
  )
}
```

## Custom Hook

Use the `useTaskFilters` hook for custom implementations:

```tsx
import { useTaskFilters } from '@/hooks/use-task-filters'

function CustomTaskList() {
  const { filters, updateFilters, clearFilters } = useTaskFilters()
  
  // Use filters to fetch/filter tasks
  // Update filters as needed
}
```

## Performance Considerations

1. **Memoization**: Filtered tasks are memoized using `useMemo`
2. **URL Updates**: Uses `router.replace` to avoid history spam
3. **Debouncing**: Consider adding debounce to search input for API calls
4. **Batch Updates**: All filter changes update in a single render

## Mobile Responsiveness

- Filter bar collapses on mobile
- Touch-friendly filter buttons
- Responsive grid layout
- Optimized popover positioning

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Focus management in popovers
- Clear visual indicators for active filters

## Future Enhancements

1. Save custom filter presets
2. Export filtered results
3. Bulk operations on filtered tasks
4. Advanced search syntax
5. Filter by custom fields
6. Date range presets (This Week, This Month, etc.)
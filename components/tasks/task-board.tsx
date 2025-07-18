'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, MessageSquare, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilterBar } from './filter-bar'
import { defaultFilters, filterTasks, type TaskFilters } from '@/lib/filters'
import { TaskExportButton } from '@/components/export'
import type { TaskWithRelations, UserResponse as User } from '@/types/api/responses'

// Type definition for Label if @prisma/client is not available
interface Label {
  id: string
  name: string
  color: string
  projectId: string
  createdAt: Date
  updatedAt: Date
}

interface TaskBoardProps {
  projectId: string
  users?: User[]
  labels?: Label[]
  currentUserId?: string
}

const columns = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-yellow-500' },
  { id: 'DONE', title: 'Done', color: 'bg-green-500' },
]

export function TaskBoard({ projectId, users = [], labels = [], currentUserId }: TaskBoardProps) {
  const [tasks] = useState<TaskWithRelations[]>([])
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters)

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, filters)
  }, [tasks, filters])

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'LOW':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      default:
        return ''
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG':
        return '🐛'
      case 'FEATURE':
        return '✨'
      case 'EPIC':
        return '🎯'
      case 'STORY':
        return '📖'
      default:
        return '📋'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar with Export Button */}
      <div className="flex items-center justify-between gap-4">
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          users={users}
          labels={labels}
          currentUserId={currentUserId}
        />
        <TaskExportButton 
          tasks={filteredTasks} 
          variant="outline"
          size="default"
        />
      </div>

      {/* Filtered Results Summary */}
      {filters.search || Object.values(filters).some(v => 
        Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : false
      ) ? (
        <div className="text-sm text-muted-foreground">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      ) : null}

      {/* Task Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
        <div key={column.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', column.color)} />
              <h3 className="font-semibold">{column.title}</h3>
              <span className="text-sm text-muted-foreground">
                {getTasksByStatus(column.id).length}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {getTasksByStatus(column.id).map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {task.title}
                    </CardTitle>
                    <span className="text-lg">{getTypeIcon(task.type)}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getPriorityColor(task.priority))}
                    >
                      {task.priority}
                    </Badge>
                    {task.labels?.map((taskLabel) => (
                      <Badge
                        key={taskLabel.label.id}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${taskLabel.label.color}20`,
                          color: taskLabel.label.color,
                          borderColor: `${taskLabel.label.color}40`,
                        }}
                      >
                        {taskLabel.label.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {task._count?.comments > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{task._count.comments}</span>
                        </div>
                      )}
                      {task._count?.attachments > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          <span>{task._count.attachments}</span>
                        </div>
                      )}
                    </div>
                    {task.assignee && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar || ''} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.name?.[0] || task.assignee.username[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {getTasksByStatus(column.id).length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}
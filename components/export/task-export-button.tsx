'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExportDialog } from './export-dialog'
import { exportTasksToCSV, exportTasksToExcel, exportTasksToPDF, exportTasksJSON } from '@/lib/export'
import { useToast } from '@/hooks/use-toast'

interface TaskExportButtonProps {
  tasks: any[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function TaskExportButton({
  tasks,
  variant = 'outline',
  size = 'default',
  className
}: TaskExportButtonProps) {
  const [showExportDialog, setShowExportDialog] = useState(false)
  const { toast } = useToast()

  const handleQuickExport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    try {
      switch (format) {
        case 'csv':
          exportTasksToCSV(tasks)
          break
        case 'excel':
          // Prepare task data with summary
          const taskSummary = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'DONE').length,
            inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            todo: tasks.filter(t => t.status === 'TODO').length,
            highPriority: tasks.filter(t => t.priority === 'HIGH').length,
            mediumPriority: tasks.filter(t => t.priority === 'MEDIUM').length,
            lowPriority: tasks.filter(t => t.priority === 'LOW').length,
          }
          
          exportTasksToExcel({
            tasks,
            summary: taskSummary,
            byStatus: Object.entries(
              tasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([status, count]) => ({ status, count })),
            byPriority: Object.entries(
              tasks.reduce((acc, task) => {
                acc[task.priority] = (acc[task.priority] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([priority, count]) => ({ priority, count }))
          })
          break
        case 'pdf':
          exportTasksToPDF(tasks)
          break
        case 'json':
          exportTasksJSON(tasks)
          break
      }
      
      toast({
        title: 'Export successful',
        description: `Tasks exported to ${format.toUpperCase()} format`
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const handleExport = async (config: any) => {
    try {
      // Filter tasks based on date range if provided
      let filteredTasks = tasks
      if (config.dateRange?.start || config.dateRange?.end) {
        filteredTasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt)
          if (config.dateRange.start && taskDate < config.dateRange.start) return false
          if (config.dateRange.end && taskDate > config.dateRange.end) return false
          return true
        })
      }

      // Export based on format
      switch (config.format) {
        case 'csv':
          exportTasksToCSV(filteredTasks, {
            fields: config.fields
          })
          break
        case 'excel':
          const summary = {
            total: filteredTasks.length,
            completed: filteredTasks.filter(t => t.status === 'DONE').length,
            inProgress: filteredTasks.filter(t => t.status === 'IN_PROGRESS').length,
            todo: filteredTasks.filter(t => t.status === 'TODO').length,
            highPriority: filteredTasks.filter(t => t.priority === 'HIGH').length,
            mediumPriority: filteredTasks.filter(t => t.priority === 'MEDIUM').length,
            lowPriority: filteredTasks.filter(t => t.priority === 'LOW').length,
          }
          
          exportTasksToExcel({
            tasks: filteredTasks,
            summary
          })
          break
        case 'pdf':
          exportTasksToPDF(filteredTasks)
          break
        case 'json':
          exportTasksJSON(filteredTasks)
          break
      }
    } catch (error) {
      throw error
    }
  }

  const availableFields = [
    { key: 'title', label: 'Title', defaultSelected: true },
    { key: 'status', label: 'Status', defaultSelected: true },
    { key: 'priority', label: 'Priority', defaultSelected: true },
    { key: 'assignee.name', label: 'Assignee', defaultSelected: true },
    { key: 'project.name', label: 'Project', defaultSelected: true },
    { key: 'dueDate', label: 'Due Date', defaultSelected: true },
    { key: 'description', label: 'Description', defaultSelected: false },
    { key: 'createdAt', label: 'Created Date', defaultSelected: false },
    { key: 'updatedAt', label: 'Last Updated', defaultSelected: false },
    { key: 'completedAt', label: 'Completed Date', defaultSelected: false },
    { key: '_count.subtasks', label: 'Subtask Count', defaultSelected: false },
    { key: '_count.comments', label: 'Comment Count', defaultSelected: false },
  ]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Download className="h-4 w-4" />
            {size !== 'icon' && <span className="ml-2">Export</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('excel')}>
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('json')}>
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
            Advanced Export...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        dataType="tasks"
        onExport={handleExport}
        availableFields={availableFields}
        totalCount={tasks.length}
      />
    </>
  )
}
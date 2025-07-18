'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, CheckSquare, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { exportToExcel, exportToCSV, exportProjectsToExcel } from '@/lib/export'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface BatchExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: any[]
  onExport?: (selectedProjects: string[]) => Promise<any[]>
}

type ExportFormat = 'excel' | 'csv'
type ExportContent = 'overview' | 'detailed' | 'tasks' | 'team'

export function BatchExportDialog({
  open,
  onOpenChange,
  projects,
  onExport
}: BatchExportDialogProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [format, setFormat] = useState<ExportFormat>('excel')
  const [content, setContent] = useState<ExportContent[]>(['overview', 'tasks'])
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined
    end: Date | undefined
  }>({
    start: undefined,
    end: undefined
  })
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleSelectAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projects.map(p => p.id))
    }
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleContentToggle = (type: ExportContent) => {
    setContent(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleExport = async () => {
    if (selectedProjects.length === 0) {
      toast({
        title: 'No projects selected',
        description: 'Please select at least one project to export',
        variant: 'destructive'
      })
      return
    }

    setIsExporting(true)
    
    try {
      // Get detailed data for selected projects if onExport is provided
      let detailedProjects = projects.filter(p => selectedProjects.includes(p.id))
      
      if (onExport) {
        detailedProjects = await onExport(selectedProjects)
      }

      // Filter by date range if specified
      if (dateRange.start || dateRange.end) {
        detailedProjects = detailedProjects.filter(project => {
          const projectDate = new Date(project.createdAt)
          if (dateRange.start && projectDate < dateRange.start) return false
          if (dateRange.end && projectDate > dateRange.end) return false
          return true
        })
      }

      if (format === 'excel') {
        // Create comprehensive Excel workbook
        const wb = (window as any).XLSX.utils.book_new()

        // Overview sheet
        if (content.includes('overview')) {
          const overviewData = detailedProjects.map(project => ({
            'Project Name': project.name,
            'Key': project.key,
            'Status': project.status,
            'Owner': project.owner?.name || '',
            'Start Date': project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
            'End Date': project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
            'Total Tasks': project._count?.tasks || 0,
            'Team Size': project._count?.members || 0,
            'Created': format(new Date(project.createdAt), 'yyyy-MM-dd')
          }))

          const overviewSheet = (window as any).XLSX.utils.json_to_sheet(overviewData)
          (window as any).XLSX.utils.book_append_sheet(wb, overviewSheet, 'Projects Overview')
        }

        // Detailed sheets for each project
        if (content.includes('detailed')) {
          detailedProjects.forEach(project => {
            const detailData = [{
              'Field': 'Project Name',
              'Value': project.name
            }, {
              'Field': 'Project Key',
              'Value': project.key
            }, {
              'Field': 'Description',
              'Value': project.description || 'No description'
            }, {
              'Field': 'Status',
              'Value': project.status
            }, {
              'Field': 'Owner',
              'Value': project.owner?.name || ''
            }, {
              'Field': 'Start Date',
              'Value': project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : 'Not set'
            }, {
              'Field': 'End Date',
              'Value': project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : 'Not set'
            }, {
              'Field': 'Total Tasks',
              'Value': project._count?.tasks || 0
            }, {
              'Field': 'Team Members',
              'Value': project._count?.members || 0
            }]

            const detailSheet = (window as any).XLSX.utils.json_to_sheet(detailData)
            const sheetName = `${project.key} Details`.substring(0, 31) // Excel sheet name limit
            (window as any).XLSX.utils.book_append_sheet(wb, detailSheet, sheetName)
          })
        }

        // All tasks sheet
        if (content.includes('tasks')) {
          const allTasks: any[] = []
          detailedProjects.forEach(project => {
            if (project.tasks) {
              project.tasks.forEach((task: any) => {
                allTasks.push({
                  'Project': project.name,
                  'Task ID': task.id,
                  'Title': task.title,
                  'Status': task.status,
                  'Priority': task.priority,
                  'Assignee': task.assignee?.name || 'Unassigned',
                  'Due Date': task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
                  'Created': format(new Date(task.createdAt), 'yyyy-MM-dd')
                })
              })
            }
          })

          if (allTasks.length > 0) {
            const tasksSheet = (window as any).XLSX.utils.json_to_sheet(allTasks)
            (window as any).XLSX.utils.book_append_sheet(wb, tasksSheet, 'All Tasks')
          }
        }

        // Team members sheet
        if (content.includes('team')) {
          const allMembers: any[] = []
          detailedProjects.forEach(project => {
            if (project.members) {
              project.members.forEach((member: any) => {
                allMembers.push({
                  'Project': project.name,
                  'Name': member.user.name,
                  'Email': member.user.email,
                  'Role': member.role,
                  'Joined': format(new Date(member.joinedAt), 'yyyy-MM-dd')
                })
              })
            }
          })

          if (allMembers.length > 0) {
            const teamSheet = (window as any).XLSX.utils.json_to_sheet(allMembers)
            (window as any).XLSX.utils.book_append_sheet(wb, teamSheet, 'Team Members')
          }
        }

        // Export the workbook
        const wbout = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `projects-batch-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
        a.click()
        URL.revokeObjectURL(url)

      } else {
        // CSV export - only overview
        exportToCSV(detailedProjects.map(project => ({
          name: project.name,
          key: project.key,
          status: project.status,
          owner: project.owner?.name || '',
          startDate: project.startDate || '',
          endDate: project.endDate || '',
          tasks: project._count?.tasks || 0,
          members: project._count?.members || 0,
          created: project.createdAt
        })), {
          filename: `projects-batch-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
        })
      }

      toast({
        title: 'Export successful',
        description: `${selectedProjects.length} projects exported to ${format.toUpperCase()}`
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Batch Export Projects</DialogTitle>
          <DialogDescription>
            Export multiple projects at once with customizable options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Projects</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {selectedProjects.length === projects.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <ScrollArea className="h-48 rounded-md border p-3">
              <div className="space-y-2">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={project.id}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                    />
                    <Label
                      htmlFor={project.id}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-gray-500">
                          {project.key} • {project._count?.tasks || 0} tasks • {project._count?.members || 0} members
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="text-sm text-gray-600">
              {selectedProjects.length} of {projects.length} projects selected
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Excel Workbook</div>
                      <div className="text-xs text-gray-500">Multiple sheets with detailed data</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <div>
                      <div className="font-medium">CSV File</div>
                      <div className="text-xs text-gray-500">Simple overview data only</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Options (only for Excel) */}
          {format === 'excel' && (
            <div className="space-y-3">
              <Label>Include in Export</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overview"
                    checked={content.includes('overview')}
                    onCheckedChange={() => handleContentToggle('overview')}
                  />
                  <Label htmlFor="overview" className="text-sm font-normal cursor-pointer">
                    Projects Overview (summary sheet)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="detailed"
                    checked={content.includes('detailed')}
                    onCheckedChange={() => handleContentToggle('detailed')}
                  />
                  <Label htmlFor="detailed" className="text-sm font-normal cursor-pointer">
                    Detailed Project Sheets
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tasks"
                    checked={content.includes('tasks')}
                    onCheckedChange={() => handleContentToggle('tasks')}
                  />
                  <Label htmlFor="tasks" className="text-sm font-normal cursor-pointer">
                    All Tasks (combined sheet)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="team"
                    checked={content.includes('team')}
                    onCheckedChange={() => handleContentToggle('team')}
                  />
                  <Label htmlFor="team" className="text-sm font-normal cursor-pointer">
                    Team Members (combined sheet)
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Date Range (Optional)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateRange({ start: undefined, end: undefined })}
              >
                Clear
              </Button>
            </div>
            <div className="flex space-x-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.start ? format(dateRange.start, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !dateRange.end && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.end ? format(dateRange.end, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedProjects.length === 0 || (format === 'excel' && content.length === 0)}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Projects
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
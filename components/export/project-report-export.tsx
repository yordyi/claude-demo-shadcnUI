'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportProjectReportToPDF, exportProjectJSON, exportProjectsToExcel } from '@/lib/export'
import { useToast } from '@/hooks/use-toast'

interface ProjectReportExportProps {
  project: any
  tasks?: any[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

type ReportFormat = 'pdf' | 'excel' | 'json'

interface ReportOptions {
  includeTasks: boolean
  includeTeam: boolean
  includeTimeline: boolean
  includeStatistics: boolean
  includeActivity: boolean
}

export function ProjectReportExport({
  project,
  tasks = [],
  variant = 'outline',
  size = 'default'
}: ProjectReportExportProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [options, setOptions] = useState<ReportOptions>({
    includeTasks: true,
    includeTeam: true,
    includeTimeline: true,
    includeStatistics: true,
    includeActivity: false
  })
  const { toast } = useToast()

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      switch (format) {
        case 'pdf':
          // For PDF, we generate a comprehensive report
          exportProjectReportToPDF(project, tasks, {
            title: `${project.name} - Project Report`,
            subtitle: `Generated on ${new Date().toLocaleDateString()}`
          })
          break
          
        case 'excel':
          // For Excel, create multiple sheets with project data
          const excelData = {
            project: [project],
            tasks: options.includeTasks ? tasks : [],
            team: options.includeTeam ? project.members || [] : [],
            statistics: options.includeStatistics ? generateStatistics() : null
          }
          
          // Create workbook with multiple sheets
          const wb = (window as any).XLSX.utils.book_new()
          
          // Project overview sheet
          const projectSheet = (window as any).XLSX.utils.json_to_sheet([{
            'Project Name': project.name,
            'Project Key': project.key,
            'Status': project.status,
            'Owner': project.owner?.name || '',
            'Start Date': project.startDate || '',
            'End Date': project.endDate || '',
            'Description': project.description || ''
          }])
          (window as any).XLSX.utils.book_append_sheet(wb, projectSheet, 'Project Overview')
          
          // Tasks sheet
          if (options.includeTasks && tasks.length > 0) {
            const tasksSheet = (window as any).XLSX.utils.json_to_sheet(
              tasks.map(task => ({
                'Title': task.title,
                'Status': task.status,
                'Priority': task.priority,
                'Assignee': task.assignee?.name || 'Unassigned',
                'Due Date': task.dueDate || '',
                'Created': task.createdAt
              }))
            )
            (window as any).XLSX.utils.book_append_sheet(wb, tasksSheet, 'Tasks')
          }
          
          // Team sheet
          if (options.includeTeam && project.members?.length > 0) {
            const teamSheet = (window as any).XLSX.utils.json_to_sheet(
              project.members.map((member: any) => ({
                'Name': member.user.name,
                'Email': member.user.email,
                'Role': member.role,
                'Joined': member.joinedAt
              }))
            )
            (window as any).XLSX.utils.book_append_sheet(wb, teamSheet, 'Team')
          }
          
          // Statistics sheet
          if (options.includeStatistics) {
            const stats = generateStatistics()
            const statsSheet = (window as any).XLSX.utils.json_to_sheet([stats])
            (window as any).XLSX.utils.book_append_sheet(wb, statsSheet, 'Statistics')
          }
          
          // Export the workbook
          const wbout = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
          const blob = new Blob([wbout], { type: 'application/octet-stream' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${project.key}-report.xlsx`
          a.click()
          URL.revokeObjectURL(url)
          break
          
        case 'json':
          // For JSON, export complete project data
          const jsonData = {
            project: {
              ...project,
              tasks: options.includeTasks ? tasks : undefined,
              team: options.includeTeam ? project.members : undefined,
              statistics: options.includeStatistics ? generateStatistics() : undefined
            },
            metadata: {
              generatedAt: new Date().toISOString(),
              options
            }
          }
          exportProjectJSON(jsonData.project)
          break
      }
      
      toast({
        title: 'Report generated',
        description: `Project report has been exported as ${format.toUpperCase()}`
      })
      
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateStatistics = () => {
    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const completedTasks = tasks.filter(t => t.status === 'DONE')
    const averageCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          const created = new Date(task.createdAt).getTime()
          const completed = new Date(task.completedAt || task.updatedAt).getTime()
          return sum + (completed - created)
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0
    
    return {
      'Total Tasks': tasks.length,
      'Completed': tasksByStatus.DONE || 0,
      'In Progress': tasksByStatus.IN_PROGRESS || 0,
      'To Do': tasksByStatus.TODO || 0,
      'High Priority': tasksByPriority.HIGH || 0,
      'Medium Priority': tasksByPriority.MEDIUM || 0,
      'Low Priority': tasksByPriority.LOW || 0,
      'Team Size': project._count?.members || 0,
      'Average Completion Time (days)': averageCompletionTime.toFixed(1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Project Report</DialogTitle>
          <DialogDescription>
            Create a comprehensive report for {project.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Report Format</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as ReportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div>
                    <div className="font-medium">PDF Report</div>
                    <div className="text-xs text-gray-500">Formatted document for printing or sharing</div>
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div>
                    <div className="font-medium">Excel Workbook</div>
                    <div className="text-xs text-gray-500">Multiple sheets with detailed data</div>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div>
                    <div className="font-medium">JSON Export</div>
                    <div className="text-xs text-gray-500">Complete data for backup or integration</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Content Options */}
          <div className="space-y-2">
            <Label>Include in Report</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tasks"
                  checked={options.includeTasks}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeTasks: checked as boolean }))
                  }
                />
                <Label htmlFor="tasks" className="text-sm font-normal cursor-pointer">
                  Task List ({tasks.length} tasks)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team"
                  checked={options.includeTeam}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeTeam: checked as boolean }))
                  }
                />
                <Label htmlFor="team" className="text-sm font-normal cursor-pointer">
                  Team Members ({project._count?.members || 0} members)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timeline"
                  checked={options.includeTimeline}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeTimeline: checked as boolean }))
                  }
                />
                <Label htmlFor="timeline" className="text-sm font-normal cursor-pointer">
                  Project Timeline
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statistics"
                  checked={options.includeStatistics}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeStatistics: checked as boolean }))
                  }
                />
                <Label htmlFor="statistics" className="text-sm font-normal cursor-pointer">
                  Statistics & Metrics
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activity"
                  checked={options.includeActivity}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeActivity: checked as boolean }))
                  }
                />
                <Label htmlFor="activity" className="text-sm font-normal cursor-pointer">
                  Recent Activity
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
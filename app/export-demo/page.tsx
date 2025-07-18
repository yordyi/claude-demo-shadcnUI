'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  TaskExportButton, 
  ProjectReportExport, 
  AnalyticsExport,
  ExportHistory,
  ExportDialog
} from '@/components/export'
import { exportToCSV, exportToExcel, exportToPDF, exportToJSON } from '@/lib/export'
import { useToast } from '@/hooks/use-toast'

// Sample data for demo
const sampleTasks = [
  {
    id: '1',
    title: 'Implement user authentication',
    status: 'DONE',
    priority: 'HIGH',
    assignee: { id: '1', name: 'John Doe' },
    project: { id: '1', name: 'Web App', key: 'WEB' },
    dueDate: new Date('2024-03-20'),
    createdAt: new Date('2024-03-01'),
    description: 'Add JWT-based authentication system',
    _count: { subtasks: 3, comments: 5, attachments: 2 }
  },
  {
    id: '2',
    title: 'Design database schema',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: { id: '2', name: 'Jane Smith' },
    project: { id: '1', name: 'Web App', key: 'WEB' },
    dueDate: new Date('2024-03-25'),
    createdAt: new Date('2024-03-05'),
    description: 'Create normalized database structure',
    _count: { subtasks: 5, comments: 8, attachments: 3 }
  },
  {
    id: '3',
    title: 'Write API documentation',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: { id: '3', name: 'Bob Johnson' },
    project: { id: '1', name: 'Web App', key: 'WEB' },
    dueDate: new Date('2024-04-01'),
    createdAt: new Date('2024-03-10'),
    description: 'Document all REST API endpoints',
    _count: { subtasks: 0, comments: 2, attachments: 0 }
  }
]

const sampleProject = {
  id: '1',
  name: 'Web Application Development',
  key: 'WEB',
  description: 'A modern web application with React and Next.js',
  status: 'ACTIVE',
  owner: { id: '1', name: 'Project Manager' },
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-06-30'),
  createdAt: new Date('2024-01-01'),
  _count: { tasks: 25, members: 8, sprints: 4, labels: 12 },
  members: [
    { user: { id: '1', name: 'John Doe', email: 'john@example.com' }, role: 'DEVELOPER', joinedAt: new Date('2024-01-01') },
    { user: { id: '2', name: 'Jane Smith', email: 'jane@example.com' }, role: 'DESIGNER', joinedAt: new Date('2024-01-05') },
    { user: { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }, role: 'TESTER', joinedAt: new Date('2024-01-10') }
  ]
}

const sampleAnalyticsData = {
  charts: [
    {
      id: 'task-status-chart',
      title: 'Task Status Distribution',
      data: [
        { name: 'Todo', value: 45 },
        { name: 'In Progress', value: 30 },
        { name: 'Done', value: 25 }
      ]
    },
    {
      id: 'priority-chart',
      title: 'Task Priority Breakdown',
      data: [
        { name: 'High', value: 15 },
        { name: 'Medium', value: 55 },
        { name: 'Low', value: 30 }
      ]
    }
  ],
  metrics: {
    totalTasks: 100,
    completedTasks: 25,
    averageCompletionTime: 3.5,
    teamVelocity: 20
  },
  rawData: sampleTasks
}

export default function ExportDemoPage() {
  const [showBatchExport, setShowBatchExport] = useState(false)
  const { toast } = useToast()

  const handleBatchExport = async (config: any) => {
    try {
      // Simulate batch export
      toast({
        title: 'Batch export started',
        description: 'Exporting multiple datasets...'
      })
      
      // Export tasks
      if (config.fields.includes('tasks')) {
        exportTasksToCSV(sampleTasks)
      }
      
      // Export projects
      if (config.fields.includes('projects')) {
        exportToExcel([sampleProject], {
          filename: 'projects-batch-export.xlsx',
          sheetName: 'Projects'
        })
      }
      
      // Export analytics
      if (config.fields.includes('analytics')) {
        exportToJSON(sampleAnalyticsData, {
          filename: 'analytics-batch-export.json'
        })
      }
      
      toast({
        title: 'Batch export completed',
        description: 'All selected data has been exported successfully'
      })
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Export Functionality Demo</h1>
        <p className="text-gray-600 mt-2">
          Demonstrate various export features including CSV, Excel, PDF, and JSON formats
        </p>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Task Export</TabsTrigger>
          <TabsTrigger value="projects">Project Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Export</TabsTrigger>
          <TabsTrigger value="batch">Batch Export</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Export Options</CardTitle>
              <CardDescription>
                Export task data in various formats with quick export or advanced options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Quick Export</h3>
                  <p className="text-sm text-gray-600">
                    One-click export with default settings
                  </p>
                </div>
                <TaskExportButton tasks={sampleTasks} />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Sample Task Data</h3>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    {sampleTasks.length} tasks available for export
                  </p>
                  <ul className="mt-2 space-y-1">
                    {sampleTasks.map(task => (
                      <li key={task.id} className="text-sm">
                        • {task.title} ({task.status})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Report Generation</CardTitle>
              <CardDescription>
                Generate comprehensive project reports with customizable content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{sampleProject.name}</h3>
                  <p className="text-sm text-gray-600">
                    Key: {sampleProject.key} | Status: {sampleProject.status}
                  </p>
                </div>
                <ProjectReportExport 
                  project={sampleProject} 
                  tasks={sampleTasks}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{sampleProject._count.tasks}</div>
                    <p className="text-xs text-gray-600">Total Tasks</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{sampleProject._count.members}</div>
                    <p className="text-xs text-gray-600">Team Members</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Export</CardTitle>
              <CardDescription>
                Export charts, metrics, and raw analytics data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Available Analytics Data</h3>
                  <p className="text-sm text-gray-600">
                    {sampleAnalyticsData.charts.length} charts, {Object.keys(sampleAnalyticsData.metrics).length} metrics
                  </p>
                </div>
                <AnalyticsExport 
                  data={sampleAnalyticsData}
                  projectName={sampleProject.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                {sampleAnalyticsData.charts.map(chart => (
                  <Card key={chart.id}>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">{chart.title}</h4>
                      <div className="space-y-1">
                        {chart.data.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Export</CardTitle>
              <CardDescription>
                Export multiple datasets at once with custom configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Available for Batch Export</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Tasks ({sampleTasks.length} records)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Projects (1 project with details)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Analytics (charts and metrics)</span>
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={() => setShowBatchExport(true)}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Configure Batch Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ExportHistory />
        </TabsContent>
      </Tabs>

      {/* Batch Export Dialog */}
      <ExportDialog
        open={showBatchExport}
        onOpenChange={setShowBatchExport}
        dataType="projects"
        onExport={handleBatchExport}
        availableFields={[
          { key: 'tasks', label: 'All Tasks', defaultSelected: true },
          { key: 'projects', label: 'Project Details', defaultSelected: true },
          { key: 'analytics', label: 'Analytics Data', defaultSelected: false },
          { key: 'team', label: 'Team Members', defaultSelected: false }
        ]}
        totalCount={sampleTasks.length + 1 + sampleAnalyticsData.charts.length}
      />
    </div>
  )
}
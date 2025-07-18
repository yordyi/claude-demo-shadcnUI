'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TaskBoard } from '@/components/tasks/task-board'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { 
  Settings, 
  Users, 
  Calendar,
  BarChart3,
  MoreVertical,
  Star,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [activeTab, setActiveTab] = useState('board')

  // TODO: Fetch project data from API
  const project = {
    id: projectId,
    name: 'E-commerce Platform',
    key: 'ECP',
    description: 'Building a modern e-commerce platform with Next.js',
    status: 'ACTIVE',
    owner: {
      id: '1',
      name: 'John Doe',
      username: 'johndoe',
      avatar: null,
    },
    _count: {
      members: 8,
      tasks: 24,
    }
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline">{project.key}</Badge>
            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
              {project.status.toLowerCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
          <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={project.owner.avatar || ''} />
                <AvatarFallback className="text-xs">
                  {project.owner.name?.[0] || project.owner.username[0]}
                </AvatarFallback>
              </Avatar>
              <span>Owner: {project.owner.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project._count.members} members</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{project._count.tasks} tasks</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Star className="h-4 w-4" />
          </Button>
          <CreateTaskDialog projectId={projectId} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Project Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Archive Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <TaskBoard projectId={projectId} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Task list view coming soon...
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Timeline/Gantt chart view coming soon...
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Project analytics coming soon...
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Team members management coming soon...
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Project settings coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
import { format } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, CheckSquare, Calendar } from 'lucide-react'
import type { ProjectWithOwner } from '@/types/api/responses'

interface ProjectCardProps {
  project: ProjectWithOwner
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
      case 'ARCHIVED':
        return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20'
      default:
        return ''
    }
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <CardDescription className="mt-1">
                <Badge variant="outline" className="mr-2">
                  {project.key}
                </Badge>
                <Badge className={cn('border-0', getStatusColor(project.status))}>
                  {project.status.toLowerCase()}
                </Badge>
              </CardDescription>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={project.owner.avatar || ''} />
              <AvatarFallback>
                {project.owner.name?.[0] || project.owner.username[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent>
          {project.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project._count?.members || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              <span>{project._count?.tasks || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
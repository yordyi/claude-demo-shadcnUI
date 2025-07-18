import { User, Project, Task, ProjectMember, Sprint, Label, Comment, Attachment, Activity, Notification } from '@prisma/client'

// User types
export type UserResponse = Omit<User, 'password'>

export type AuthResponse = {
  user: UserResponse
  accessToken: string
  refreshToken: string
}

// Project types
export type ProjectWithOwner = Project & {
  owner: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
  _count?: {
    members: number
    tasks: number
  }
}

export type ProjectDetailed = ProjectWithOwner & {
  members: (ProjectMember & {
    user: Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'email'>
  })[]
  _count: {
    tasks: number
    sprints: number
    labels: number
  }
}

// Task types
export type TaskWithRelations = Task & {
  project?: Pick<Project, 'id' | 'name' | 'key'>
  assignee?: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
  creator?: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
  labels?: (TaskLabel & { label: Label })[]
  _count?: {
    subtasks: number
    comments: number
    attachments: number
  }
}

export type TaskDetailed = TaskWithRelations & {
  parent?: Pick<Task, 'id' | 'title'>
  subtasks: TaskWithRelations[]
  sprint?: Sprint
  comments: (Comment & {
    author: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
  })[]
  attachments: Attachment[]
  activities: (Activity & {
    user: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
  })[]
}

// Common response types
export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ErrorResponse = {
  error: string
  details?: any
}

export type SuccessResponse = {
  success: boolean
  message?: string
}

// Stats types
export type ProjectStats = {
  tasks: {
    total: number
    todo: number
    inProgress: number
    inReview: number
    done: number
    canceled: number
  }
  members: number
  activities: number
}

// Helper type for TaskLabel join table
type TaskLabel = {
  taskId: string
  labelId: string
  assignedAt: Date
}
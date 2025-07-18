import { z } from 'zod'

// User schemas
export const userSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
  key: z.string().min(2, 'Project key must be at least 2 characters').max(10, 'Project key is too long').regex(/^[A-Z]+$/, 'Project key must be uppercase letters only'),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'TEAM']).default('PRIVATE'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title is too long'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  type: z.enum(['TASK', 'BUG', 'FEATURE', 'EPIC', 'STORY']).default('TASK'),
  projectId: z.string().min(1, 'Project ID is required'),
  assigneeId: z.string().optional(),
  parentId: z.string().optional(),
  sprintId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  estimate: z.number().int().positive().optional(),
  labels: z.array(z.string()).optional(),
})

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true })

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment is too long'),
  taskId: z.string().min(1, 'Task ID is required'),
})

// Team/Member schemas
export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
})

// Sprint schemas
export const createSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required').max(100, 'Sprint name is too long'),
  goal: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

// Label schemas
export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50, 'Label name is too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  projectId: z.string().min(1, 'Project ID is required'),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Search/Filter schemas
export const taskFilterSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['TASK', 'BUG', 'FEATURE', 'EPIC', 'STORY']).optional(),
  assigneeId: z.string().optional(),
  creatorId: z.string().optional(),
  sprintId: z.string().optional(),
  search: z.string().optional(),
}).merge(paginationSchema)

export type UserSignup = z.infer<typeof userSignupSchema>
export type UserLogin = z.infer<typeof userLoginSchema>
export type CreateProject = z.infer<typeof createProjectSchema>
export type UpdateProject = z.infer<typeof updateProjectSchema>
export type CreateTask = z.infer<typeof createTaskSchema>
export type UpdateTask = z.infer<typeof updateTaskSchema>
export type CreateComment = z.infer<typeof createCommentSchema>
export type AddProjectMember = z.infer<typeof addProjectMemberSchema>
export type CreateSprint = z.infer<typeof createSprintSchema>
export type CreateLabel = z.infer<typeof createLabelSchema>
export type Pagination = z.infer<typeof paginationSchema>
export type TaskFilter = z.infer<typeof taskFilterSchema>
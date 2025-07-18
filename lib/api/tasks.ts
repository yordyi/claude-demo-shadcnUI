import { apiClient } from './client'
import type { TaskWithRelations, TaskDetailed, CreateTask, UpdateTask, PaginatedResponse } from '@/types/api/responses'

export const tasksApi = {
  list: async (params?: {
    projectId?: string
    status?: string
    priority?: string
    type?: string
    assigneeId?: string
    sprintId?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<TaskWithRelations>> => {
    const response = await apiClient.get('/tasks', { params })
    return response.data
  },

  create: async (data: CreateTask): Promise<TaskWithRelations> => {
    const response = await apiClient.post('/tasks', data)
    return response.data
  },

  getById: async (taskId: string): Promise<TaskDetailed> => {
    const response = await apiClient.get(`/tasks/${taskId}`)
    return response.data
  },

  update: async (taskId: string, data: UpdateTask): Promise<TaskWithRelations> => {
    const response = await apiClient.patch(`/tasks/${taskId}`, data)
    return response.data
  },

  delete: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`)
  },

  updateStatus: async (taskId: string, status: string): Promise<TaskWithRelations> => {
    const response = await apiClient.patch(`/tasks/${taskId}/status`, { status })
    return response.data
  },

  moveTask: async (taskId: string, position: number, status: string): Promise<void> => {
    await apiClient.patch(`/tasks/${taskId}/move`, { position, status })
  },

  addComment: async (taskId: string, content: string) => {
    const response = await apiClient.post(`/tasks/${taskId}/comments`, { content })
    return response.data
  },
}
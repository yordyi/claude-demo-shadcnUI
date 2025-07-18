import { apiClient } from './client'
import type { ProjectWithOwner, ProjectDetailed, CreateProject, UpdateProject, PaginatedResponse } from '@/types/api/responses'

export const projectsApi = {
  list: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<PaginatedResponse<ProjectWithOwner>> => {
    const response = await apiClient.get('/projects', { params })
    return response.data
  },

  create: async (data: CreateProject): Promise<ProjectWithOwner> => {
    const response = await apiClient.post('/projects', data)
    return response.data
  },

  getById: async (projectId: string): Promise<ProjectDetailed> => {
    const response = await apiClient.get(`/projects/${projectId}`)
    return response.data
  },

  update: async (projectId: string, data: UpdateProject): Promise<ProjectWithOwner> => {
    const response = await apiClient.patch(`/projects/${projectId}`, data)
    return response.data
  },

  delete: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}`)
  },

  getStats: async (projectId: string) => {
    const response = await apiClient.get(`/projects/${projectId}/stats`)
    return response.data
  },

  addMember: async (projectId: string, userId: string, role: string) => {
    const response = await apiClient.post(`/projects/${projectId}/members`, { userId, role })
    return response.data
  },
}
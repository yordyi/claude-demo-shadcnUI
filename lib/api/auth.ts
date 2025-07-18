import { apiClient } from './client'
import type { AuthResponse, UserSignup, UserLogin } from '@/types/api/responses'

export const authApi = {
  register: async (data: UserSignup): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  login: async (data: UserLogin): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  logout: async () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}
import api from './api'
import type { CompanyRole, CompanyUser } from '@/types/company'

interface UpdateRoleData {
  role: Exclude<CompanyRole, 'owner'>
}

export const CompanyUserApi = {
  /**
   * Получение списка пользователей компании текущего пользователя
   */
  getCompanyUsers: async () => {
    try {
      const response = await api.get('/chats/users')
      return response.data as CompanyUser[]
    } catch (error) {
      console.error('CompanyUserApi.getCompanyUsers error:', error)
      throw error
    }
  },

  /**
   * Выход из компании
   */
  leave: async (companyId: number) => {
    const response = await api.post(`/companies/${companyId}/leave`)
    return response.data
  },

  /**
   * Обновление роли пользователя
   */
  updateRole: async (companyId: number, userId: number, data: UpdateRoleData) => {
    const response = await api.patch(
      `/companies/${companyId}/users/${userId}/role`,
      data
    )
    return response.data
    },
    /**
   * Получение списка пользователей компании
   */
  getUsers: async (companyId: number) => {
    console.log('CompanyUserApi.getUsers called with companyId:', companyId)
    try {
      const response = await api.get(`/companies/${companyId}/users`)
      console.log('CompanyUserApi.getUsers response:', response.data)
      // Добавляем логирование конкретного поля created_at
      console.log('Sample user created_at:', response.data[0]?.created_at)
      return response.data as CompanyUser[]
    } catch (error) {
      console.error('CompanyUserApi.getUsers error:', error)
      throw error
    }
  }
}
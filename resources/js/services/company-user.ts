import api from './api'
import type { CompanyRole, CompanyUser } from '@/types/company'

interface UpdateRoleData {
  role: Exclude<CompanyRole, 'owner'>
}

export const CompanyUserApi = {
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
    const response = await api.get(`/companies/${companyId}/users`)
    return response.data as CompanyUser[]
  }
}
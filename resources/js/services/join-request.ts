import type { JoinRequest, CreateJoinRequestData, UpdateJoinRequestData, JoinRequestEvent } from '@/types/join-request'
import api from './api'

class JoinRequestService {
  /**
   * Получить список запросов для компании
   */
  async getCompanyRequests(companyId: number): Promise<JoinRequest[]> {
    const response = await api.get(`/companies/${companyId}/join-requests`)
    return response.data
  }

  /**
   * Создать запрос на вступление
   */
  async create(companyId: number, data: CreateJoinRequestData): Promise<JoinRequest> {
    const response = await api.post(`/companies/${companyId}/join-requests`, data)
    return response.data
  }

  /**
   * Обновить статус запроса
   */
  async updateStatus(
    companyId: number,
    requestId: number,
    data: UpdateJoinRequestData
  ): Promise<JoinRequest> {
    const response = await api.patch(
      `/companies/${companyId}/join-requests/${requestId}`,
      data
    )
    return response.data
  }

  /**
   * Подписаться на обновления запросов для компании
   */
  subscribeToCompanyRequests(
    companyId: number,
    callback: (event: JoinRequestEvent) => void
  ): void {
    window.Echo.private(`company.${companyId}`)
      .listen('.join-request.updated', callback)
  }

  /**
   * Подписаться на обновления своих запросов
   */
  subscribeToUserRequests(
    userId: number,
    callback: (event: JoinRequestEvent) => void
  ): void {
    window.Echo.private(`user.${userId}`)
      .listen('.join-request.updated', callback)
  }

  /**
   * Отписаться от обновлений запросов компании
   */
  unsubscribeFromCompanyRequests(companyId: number): void {
    window.Echo.private(`company.${companyId}`)
      .stopListening('.join-request.updated')
  }

  /**
   * Отписаться от обновлений своих запросов
   */
  unsubscribeFromUserRequests(userId: number): void {
    window.Echo.private(`user.${userId}`)
      .stopListening('.join-request.updated')
  }
}

export const joinRequestService = new JoinRequestService()
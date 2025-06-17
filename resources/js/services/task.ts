import api from "@/services/api"
import type { Task, TaskAssignment, TaskResponse } from "@/types/task"

interface SortParams {
  sort_by?: 'created_at' | 'due_date' | 'completed_at';
  sort_order?: 'asc' | 'desc';
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'revision' | 'overdue';

export interface DateRangeExport {
  start_date?: string;
  end_date?: string;
  status?: TaskStatus;
}

export const TaskApi = {
  /**
   * Получить список всех задач (для администраторов)
   */
  list: async (params?: SortParams) => {
    const { data } = await api.get("/tasks", { params })
    return data
  },

  /**
   * Получить список заданий пользователя
   */
  listUserTasks: async (params?: SortParams) => {
    const { data } = await api.get("/tasks/my", { params })
    return data
  },

  /**
   * Создать новую задачу
   */
  create: async (formData: FormData) => {
    const { data } = await api.post("/tasks", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return data
  },

  /**
   * Получить детали задачи
   */
  get: async (taskId: string) => {
    const { data } = await api.get(`/tasks/${taskId}`)
    return data
  },

  /**
   * Обновить статус задачи
   */
  updateStatus: async (taskId: string, status: string) => {
    const { data } = await api.patch(`/tasks/${taskId}/status`, { status })
    return data
  },

  /**
   * Отправить ответ на задачу
   */
  submitResponse: async (assignmentId: string, formData: FormData) => {
    const { data } = await api.post(`/tasks/assignments/${assignmentId}/response`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return data
  },

  /**
   * Проверить ответ на задачу
   */
  reviewResponse: async (responseId: string, { status, revision_comment }: { status: string; revision_comment?: string }) => {
    const { data } = await api.patch(`/tasks/responses/${responseId}/review`, {
      status,
      revision_comment,
    })
    return data
  },
  /**
   * Обновить существующий ответ на задачу
   */
  updateResponse: async (responseId: string, formData: FormData) => {
    const { data } = await api.post(`/tasks/responses/${responseId}/update`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return data
  },

  /**
   * Экспортировать задачи в Excel
   */
  exportToExcel: async (dateRange?: DateRangeExport) => {
    const response = await api.get("/tasks/export", {
      responseType: 'blob',
      params: dateRange
    })
    
    // Создаем ссылку для скачивания файла
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `tasks_report_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  /**
   * Экспортировать задачи в PDF
   */
  exportToPDF: async (dateRange?: DateRangeExport) => {
    const response = await api.get("/tasks/export-pdf", {
      responseType: 'blob',
      params: dateRange
    })
    
    // Создаем ссылку для скачивания файла
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `tasks_report_${new Date().toISOString().split('T')[0]}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

export default TaskApi
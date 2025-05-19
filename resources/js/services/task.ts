import api from "@/services/api"
import type { Task, TaskAssignment, TaskResponse } from "@/types/task"

export const TaskApi = {
  /**
   * Получить список задач
   */
  list: async () => {
    const { data } = await api.get("/tasks")
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
}

export default TaskApi
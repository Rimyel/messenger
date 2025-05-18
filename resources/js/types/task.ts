export type TaskStatus = "pending" | "in_progress" | "completed" | "revision" | "overdue"

export interface TaskFile {
  id: string
  name: string
  size: string
  type: string
  url: string
}

export interface TaskResponse {
  id: string
  userId: string
  userName: string
  text: string
  files: TaskFile[]
  submittedAt: string
  status: "submitted" | "revision" | "approved"
  revisionComment?: string
}

export interface TaskAssignment {
  userId: string
  userName: string
  userAvatar: string
  status: "not_started" | "in_progress" | "submitted" | "revision" | "completed"
  response?: TaskResponse
}

export interface Task {
  id: string
  title: string
  description: string
  files: TaskFile[]
  startDate: string
  dueDate: string
  status: TaskStatus
  createdBy: string
  createdAt: string
  assignments: TaskAssignment[]
}
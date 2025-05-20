export type TaskStatus = "pending" | "in_progress" | "completed" | "revision" | "overdue"
export type AssignmentStatus = "not_started" | "in_progress" | "submitted" | "revision" | "completed"
export type ResponseStatus = "submitted" | "revision" | "approved"

export interface TaskFile {
  id: string
  name: string
  size: string
  type: string
  url: string
}

export interface TaskResponse {
  id: string
  text: string
  files: TaskFile[]
  submittedAt: string
  status: ResponseStatus
  revisionComment?: string
}

export interface TaskAssignment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  status: AssignmentStatus
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

export interface UserTask extends Task {
  myAssignment: TaskAssignment
}
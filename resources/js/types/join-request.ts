import { User } from "./app"

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface JoinRequest {
  id: number
  user_id: number
  company_id: number
  status: JoinRequestStatus
  message: string | null
  rejection_reason: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
  user?: User
}

export interface CreateJoinRequestData {
  message?: string
}

export interface UpdateJoinRequestData {
  status: 'approved' | 'rejected'
  rejection_reason?: string
}

export type JoinRequestEvent = {
  id: number
  status: JoinRequestStatus
  rejection_reason: string | null
  company_id: number
  user_id: number
  updated_at: string
}
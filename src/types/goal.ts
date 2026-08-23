export type GoalPriority = 'low' | 'medium' | 'high'
export type GoalStatus = 'active' | 'completed' | 'paused'
export type GoalTrackStatus = 'Ahead' | 'On Track' | 'Behind' | 'Completed'

export interface Goal {
  id: string
  name: string
  description?: string
  targetAmount: number
  startDate: string
  targetDate: string
  priority: GoalPriority
  status: GoalStatus
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

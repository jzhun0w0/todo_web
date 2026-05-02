export interface Todo {
  id: number
  title: string
  description: string | null
  urgency: 'low' | 'medium' | 'high' | 'critical' | 'cuti'
  size: 'small' | 'medium' | 'large' | 'extra_large' | 'cuti'
  reward_points: number
  expected_time_minutes: number | null
  has_due_date: boolean
  due_date: string | null
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  started_at: string | null
  completed_at: string | null
  time_spent_seconds: number | null
}

export interface CreateTodoPayload {
  title: string
  description: string | null
  urgency: Todo['urgency']
  size: Todo['size']
  reward_points: number
  expected_time_minutes: number | null
  has_due_date: boolean
  due_date: string | null
}

export interface GlobalSettings {
  daily_goal_score: number
  reward_points: number
  cuti_points: number
  monthly_leaves_quota: number
  next_month_leaves_quota: number
  leaves_remaining: number
}

export interface RewardItem {
  id: number
  name: string
  cost_rp: number
  cost_cuti: number
  created_at: string
}

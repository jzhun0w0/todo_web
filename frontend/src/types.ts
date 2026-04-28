export interface Todo {
  id: number
  title: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  size: 'small' | 'medium' | 'large'
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
  urgency: Todo['urgency']
  size: Todo['size']
  has_due_date: boolean
  due_date: string | null
}

export type UserRole = 'teacher' | 'student'
export type Subject = 'Science' | 'Technology' | 'Engineering' | 'Math'
export type GradeBand = 'K-2' | '3-5' | '6-8' | '9-12'
export type AnswerType = 'multiple_choice' | 'short_answer'

export interface AnswerFeedback {
  kind: 'success' | 'error'
  message: string
}

export interface Profile {
  id: string
  role: UserRole
  display_name: string
}

export interface ClassRecord {
  id: string
  name: string
  join_code: string
  created_at: string
}

export interface Challenge {
  id: string
  class_id: string
  title: string
  prompt: string
  subject: Subject
  grade_band: GradeBand
  answer_type: AnswerType
  choices: string[] | null
  is_published: boolean
  created_at: string
}

export interface Submission {
  id: string
  challenge_id: string
  student_id: string
  answer: string
  is_correct: boolean | null
  submitted_at: string
}

export interface DashboardData {
  classId: string
  challenges: Challenge[]
  members: Profile[]
  submissions: Submission[]
}

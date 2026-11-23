export type UserRole = 'teacher' | 'student'
export type Subject = 'Science' | 'Technology' | 'Engineering' | 'Math'
export type GradeBand = 'K-2' | '3-5' | '6-8' | '9-12'
export type AnswerType = 'multiple_choice' | 'short_answer'

export interface AnswerFeedback {
  kind: 'success' | 'retry' | 'error'
  message: string
}

export interface Profile {
  id: string
  role: UserRole
  display_name: string
  avatar_path?: string | null
}

export interface ClassRecord {
  id: string
  name: string
  join_code: string
  created_at: string
  grade_band: ClassGradeBand | null
  message_type: ClassMessageType | null
  message_heading: string | null
  message_content: string | null
}

export type ClassGradeBand = 'K-5' | '6-8' | '9-12'

export type ClassMessageType =
  | 'Announcement'
  | 'Description'
  | 'Guidelines'

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
  program_day: number | null
  level: DailyLevel | null
  hint_level_1?: string | null
  hint_level_2?: string | null
  hint_level_3?: string | null
  created_at: string
}

export type DailyLevel = 'Easy' | 'Medium' | 'Hard'

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

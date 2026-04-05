export type QuestionType = 'single' | 'multiple' | 'ordering'

export type Option = {
  id: string
  text: string
}

export type QuizQuestion = {
  questionNumber: number
  type: QuestionType
  selectionCount?: number
  prompt: string
  options: Option[]
  correctAnswers: string[]
  explanation: string
  references?: string[]
}

export type QuizSet = {
  title: string
  description: string
  questions: QuizQuestion[]
}

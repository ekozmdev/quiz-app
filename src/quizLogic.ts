import type { QuestionType, QuizQuestion } from './types'

export type AnswerRecord = {
  selectedAnswers: string[]
  isCorrect: boolean
}

export function getQuestionTypeLabel(type: QuestionType) {
  switch (type) {
    case 'single':
      return '単一選択'
    case 'multiple':
      return '複数選択'
    case 'ordering':
      return '並べ替え'
  }
}

export function hasValidSelection(question: QuizQuestion, selectedAnswers: string[]) {
  if (question.type === 'single') return selectedAnswers.length === 1
  if (question.type === 'multiple') {
    return selectedAnswers.length === (question.selectionCount ?? question.correctAnswers.length)
  }
  return selectedAnswers.length === question.correctAnswers.length
}

export function areAnswersEqual(
  question: QuizQuestion,
  selectedAnswers: string[],
  correctAnswers: string[],
) {
  if (selectedAnswers.length !== correctAnswers.length) return false

  if (question.type === 'multiple') {
    const selectedSet = new Set(selectedAnswers)
    return correctAnswers.every((answer) => selectedSet.has(answer))
  }

  return selectedAnswers.every((answer, index) => answer === correctAnswers[index])
}

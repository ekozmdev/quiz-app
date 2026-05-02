import type { QuizSet } from '../types'

const quizModules = import.meta.glob('./*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export const quizSets: Array<QuizSet & { id: string }> = Object.entries(quizModules)
  .flatMap(([path, quizSet]) => {
    const fileName = path.split('/').pop()?.replace('.json', '') ?? path
    if (!isQuizSet(quizSet)) {
      console.error(`Invalid quiz JSON skipped: ${fileName}`)
      return []
    }

    return {
      id: fileName,
      ...quizSet,
    }
  })
  .sort((left, right) => left.id.localeCompare(right.id, 'en'))

function isQuizSet(value: unknown): value is QuizSet {
  if (!isRecord(value)) return false
  if (!isNonEmptyString(value.title) || !isNonEmptyString(value.description)) return false
  if (!Array.isArray(value.questions) || value.questions.length === 0) return false

  return value.questions.every(isQuizQuestion)
}

function isQuizQuestion(value: unknown): boolean {
  if (!isRecord(value)) return false
  const questionNumber = value.questionNumber
  const type = value.type
  const prompt = value.prompt
  const explanation = value.explanation
  const options = value.options
  const correctAnswers = value.correctAnswers
  const selectionCount = value.selectionCount

  if (typeof questionNumber !== 'number' || !Number.isInteger(questionNumber) || questionNumber < 1) {
    return false
  }
  if (type !== 'single' && type !== 'multiple' && type !== 'ordering') {
    return false
  }
  if (!isNonEmptyString(prompt) || !isNonEmptyString(explanation)) return false
  if (!Array.isArray(options) || options.length < 2) return false
  if (!options.every(isOption)) return false
  if (!Array.isArray(correctAnswers) || correctAnswers.length === 0) return false
  if (!correctAnswers.every(isNonEmptyString)) return false
  if (
    selectionCount !== undefined &&
    (typeof selectionCount !== 'number' ||
      !Number.isInteger(selectionCount) ||
      selectionCount < 1)
  ) {
    return false
  }

  return true
}

function isOption(value: unknown): boolean {
  return isRecord(value) && isNonEmptyString(value.id) && isNonEmptyString(value.text)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

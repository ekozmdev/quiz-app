import type { QuizSet } from '../types'

const quizModules = import.meta.glob('./*.json', {
  eager: true,
  import: 'default',
}) as Record<string, QuizSet>

export const quizSets: Array<QuizSet & { id: string }> = Object.entries(quizModules)
  .map(([path, quizSet]) => {
    const fileName = path.split('/').pop()?.replace('.json', '') ?? path

    return {
      id: fileName,
      ...quizSet,
    }
  })
  .sort((left, right) => left.id.localeCompare(right.id, 'en'))

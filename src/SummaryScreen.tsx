import { useState } from 'react'
import { MarkdownContent } from './MarkdownContent'
import type { QuizQuestion } from './types'
import type { AnswerRecord } from './quizLogic'

export function SummaryScreen({
  answersByQuestion,
  correctCount,
  sessionQuestions,
  onBackToLastQuestion,
  onResetSession,
}: {
  answersByQuestion: Record<number, AnswerRecord>
  correctCount: number
  sessionQuestions: QuizQuestion[]
  onBackToLastQuestion: () => void
  onResetSession: () => void
}) {
  const incorrectQuestions = sessionQuestions.filter((question) => {
    const answer = answersByQuestion[question.questionNumber]
    return answer && !answer.isCorrect
  })
  const percentage =
    sessionQuestions.length === 0 ? 0 : Math.round((correctCount / sessionQuestions.length) * 100)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function handleCopyIncorrectQuestions() {
    const text = formatIncorrectQuestionsForClipboard(incorrectQuestions, answersByQuestion)
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 1800)
    } catch {
      setCopyStatus('failed')
      window.setTimeout(() => setCopyStatus('idle'), 2400)
    }
  }

  return (
    <main className="app-shell">
      <section className="question-card">
        <div className="summary-header">
          <div className="summary-score">
            <span className="stat-label">正解率</span>
            <strong>{percentage}%</strong>
          </div>
          <div className="summary-grid">
            <SummaryStat label="問題数" value={sessionQuestions.length} />
            <SummaryStat label="正解" value={correctCount} />
            <SummaryStat label="不正解" value={sessionQuestions.length - correctCount} />
          </div>
        </div>

        <div className="actions">
          <button type="button" className="ghost-button" onClick={onBackToLastQuestion}>
            最後の問題に戻る
          </button>
          <button type="button" className="primary-button" onClick={onResetSession}>
            別セットを選ぶ
          </button>
        </div>

        <div className="summary-list">
          {incorrectQuestions.length === 0 ? (
            <div className="summary-item">
              <strong>全問正解です。</strong>
            </div>
          ) : (
            <>
              <div className="summary-list-header">
                <p className="summary-note">不正解だった問題</p>
                <button
                  type="button"
                  className="ghost-button copy-incorrect-button"
                  onClick={handleCopyIncorrectQuestions}
                >
                  {copyStatus === 'copied'
                    ? 'コピーしました'
                    : copyStatus === 'failed'
                      ? 'コピー失敗'
                      : 'まとめてコピー'}
                </button>
              </div>
              {incorrectQuestions.map((question) => {
                const selectedAnswers =
                  answersByQuestion[question.questionNumber]?.selectedAnswers ?? []
                return (
                  <div key={question.questionNumber} className="summary-item incorrect">
                    <p className="summary-question">
                      問{question.questionNumber}: {question.prompt}
                    </p>
                    <p className="summary-answer">
                      自分の回答:{' '}
                      <code>
                        {selectedAnswers.length === 0
                          ? '未回答'
                          : selectedAnswers
                              .map((id) => formatAnswerOption(question, id))
                              .join(' -> ')}
                      </code>
                    </p>
                    <p className="summary-answer">
                      正解:{' '}
                      <code>
                        {question.correctAnswers
                          .map((id) => formatAnswerOption(question, id))
                          .join(' -> ')}
                      </code>
                    </p>
                    <MarkdownContent markdown={question.explanation} />
                  </div>
                )
              })}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="status-item">
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatAnswerOption(question: QuizQuestion, answerId: string) {
  const option = question.options.find((candidate) => candidate.id === answerId)
  return option ? `${answerId}. ${option.text}` : answerId
}

function formatIncorrectQuestionsForClipboard(
  incorrectQuestions: QuizQuestion[],
  answersByQuestion: Record<number, AnswerRecord>,
) {
  return incorrectQuestions
    .map((question) => {
      const selectedAnswers = answersByQuestion[question.questionNumber]?.selectedAnswers ?? []
      const selectedText =
        selectedAnswers.length === 0
          ? '未回答'
          : selectedAnswers.map((id) => formatAnswerOption(question, id)).join(' -> ')
      const correctText = question.correctAnswers
        .map((id) => formatAnswerOption(question, id))
        .join(' -> ')
      return [
        `問${question.questionNumber}: ${question.prompt}`,
        `自分の回答: ${selectedText}`,
        `正解: ${correctText}`,
        `解説: ${question.explanation.trim()}`,
      ].join('\n')
    })
    .join('\n\n')
}

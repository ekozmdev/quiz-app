import { useState } from 'react'
import './App.css'
import { MarkdownContent } from './MarkdownContent'
import { quizSets } from './data'
import type { Option, QuizQuestion, QuizSet } from './types'
import {
  areAnswersEqual,
  type AnswerRecord,
  getQuestionTypeLabel,
  hasValidSelection,
} from './quizLogic'

type QuizSetWithId = QuizSet & { id: string }

function App() {
  const initialSetId = quizSets[0]?.id ?? ''
  const [setId, setSetId] = useState(initialSetId)
  const [hasStarted, setHasStarted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([])
  const [draftSelectionsByQuestion, setDraftSelectionsByQuestion] = useState<
    Record<number, string[]>
  >({})
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<number, AnswerRecord>>({})

  const activeSet = quizSets.find((quizSet) => quizSet.id === setId) ?? quizSets[0]
  const activeQuestion = sessionQuestions[questionIndex]
  const answeredCount = Object.keys(answersByQuestion).length
  const correctCount = Object.values(answersByQuestion).filter((answer) => answer.isCorrect).length
  const progress = sessionQuestions.length === 0 ? 0 : (answeredCount / sessionQuestions.length) * 100
  const selectedAnswers = activeQuestion
    ? draftSelectionsByQuestion[activeQuestion.questionNumber] ??
      answersByQuestion[activeQuestion.questionNumber]?.selectedAnswers ??
      []
    : []
  const submitted = activeQuestion ? Boolean(answersByQuestion[activeQuestion.questionNumber]) : false

  function resetSession() {
    setHasStarted(false)
    setShowSummary(false)
    setQuestionIndex(0)
    setSessionQuestions([])
    setDraftSelectionsByQuestion({})
    setAnswersByQuestion({})
  }

  function handleSetChange(nextSetId: string) {
    setSetId(nextSetId)
    resetSession()
  }

  function handleStart() {
    if (!activeSet) return

    setSessionQuestions(activeSet.questions)
    setQuestionIndex(0)
    setDraftSelectionsByQuestion({})
    setAnswersByQuestion({})
    setShowSummary(false)
    setHasStarted(true)
  }

  function handleSingleSelect(optionId: string) {
    if (!activeQuestion || submitted) return

    setDraftSelectionsByQuestion((current) => ({
      ...current,
      [activeQuestion.questionNumber]: [optionId],
    }))
  }

  function handleMultipleToggle(optionId: string) {
    if (!activeQuestion || submitted) return

    setDraftSelectionsByQuestion((current) => {
      const currentSelection = getCurrentSelection(activeQuestion, current, answersByQuestion)

      if (currentSelection.includes(optionId)) {
        return {
          ...current,
          [activeQuestion.questionNumber]: currentSelection.filter((value) => value !== optionId),
        }
      }

      const limit = activeQuestion.selectionCount ?? activeQuestion.correctAnswers.length
      if (currentSelection.length >= limit) return current

      return {
        ...current,
        [activeQuestion.questionNumber]: [...currentSelection, optionId],
      }
    })
  }

  function handleOrderingPick(optionId: string) {
    if (!activeQuestion || submitted) return

    setDraftSelectionsByQuestion((current) => {
      const currentSelection = getCurrentSelection(activeQuestion, current, answersByQuestion)

      if (currentSelection.includes(optionId)) {
        return {
          ...current,
          [activeQuestion.questionNumber]: currentSelection.filter((value) => value !== optionId),
        }
      }

      return {
        ...current,
        [activeQuestion.questionNumber]: [...currentSelection, optionId],
      }
    })
  }

  function handleSubmit() {
    if (!activeQuestion || !hasValidSelection(activeQuestion, selectedAnswers)) return

    setAnswersByQuestion((current) => ({
      ...current,
      [activeQuestion.questionNumber]: {
        selectedAnswers,
        isCorrect: areAnswersEqual(activeQuestion, selectedAnswers, activeQuestion.correctAnswers),
      },
    }))
  }

  function handleNext() {
    if (questionIndex >= sessionQuestions.length - 1) {
      setShowSummary(true)
      return
    }

    setQuestionIndex((current) => current + 1)
  }

  function handlePrev() {
    if (questionIndex === 0) return
    setQuestionIndex((current) => current - 1)
  }

  function handleResetAnswer() {
    if (!activeQuestion) return

    setDraftSelectionsByQuestion((current) => removeQuestionEntry(current, activeQuestion))
    setAnswersByQuestion((current) => removeQuestionEntry(current, activeQuestion))
  }

  if (!activeSet) {
    return <EmptyState message="問題セットが見つかりません。" />
  }

  if (!hasStarted) {
    return (
      <SetupScreen
        activeSet={activeSet}
        quizSets={quizSets}
        setId={setId}
        onSetChange={handleSetChange}
        onStart={handleStart}
      />
    )
  }

  if (showSummary) {
    return (
      <SummaryScreen
        answersByQuestion={answersByQuestion}
        correctCount={correctCount}
        sessionQuestions={sessionQuestions}
        onBackToLastQuestion={() => setShowSummary(false)}
        onResetSession={resetSession}
      />
    )
  }

  if (!activeQuestion) {
    return <EmptyState message="問題を読み込めませんでした。" />
  }

  const currentAnswer = answersByQuestion[activeQuestion.questionNumber]
  const isCorrect = currentAnswer
    ? currentAnswer.isCorrect
    : areAnswersEqual(activeQuestion, selectedAnswers, activeQuestion.correctAnswers)

  return (
    <QuestionScreen
      activeQuestion={activeQuestion}
      activeSet={activeSet}
      answeredCount={answeredCount}
      canSubmit={hasValidSelection(activeQuestion, selectedAnswers)}
      isCorrect={isCorrect}
      isLastQuestion={questionIndex === sessionQuestions.length - 1}
      progress={progress}
      questionIndex={questionIndex}
      selectedAnswers={selectedAnswers}
      sessionQuestions={sessionQuestions}
      submitted={submitted}
      onMultipleToggle={handleMultipleToggle}
      onNext={handleNext}
      onOrderingPick={handleOrderingPick}
      onPrev={handlePrev}
      onResetAnswer={handleResetAnswer}
      onSingleSelect={handleSingleSelect}
      onSubmit={handleSubmit}
    />
  )
}

function SetupScreen({
  activeSet,
  quizSets,
  setId,
  onSetChange,
  onStart,
}: {
  activeSet: QuizSetWithId
  quizSets: QuizSetWithId[]
  setId: string
  onSetChange: (setId: string) => void
  onStart: () => void
}) {
  return (
    <main className="app-shell">
      <section className="toolbar setup-toolbar">
        <div className="heading-block">
          <h1>{activeSet.title}</h1>
          <p>{activeSet.description}</p>
        </div>

        <label className="select-wrap">
          <span className="stat-label">問題セット</span>
          <select value={setId} onChange={(event) => onSetChange(event.target.value)}>
            {quizSets.map((quizSet) => (
              <option key={quizSet.id} value={quizSet.id}>
                {quizSet.title}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="primary-button start-button" onClick={onStart}>
          開始
        </button>
      </section>
    </main>
  )
}

function SummaryScreen({
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
              <p className="summary-note">不正解だった問題</p>
              {incorrectQuestions.map((question) => (
                <div key={question.questionNumber} className="summary-item incorrect">
                  <p className="summary-question">
                    問{question.questionNumber}: {question.prompt}
                  </p>
                  <p className="summary-answer">
                    正解: <code>{question.correctAnswers.join(' -> ')}</code>
                  </p>
                  <MarkdownContent markdown={question.explanation} />
                </div>
              ))}
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

function QuestionScreen({
  activeQuestion,
  activeSet,
  answeredCount,
  canSubmit,
  isCorrect,
  isLastQuestion,
  progress,
  questionIndex,
  selectedAnswers,
  sessionQuestions,
  submitted,
  onMultipleToggle,
  onNext,
  onOrderingPick,
  onPrev,
  onResetAnswer,
  onSingleSelect,
  onSubmit,
}: {
  activeQuestion: QuizQuestion
  activeSet: QuizSetWithId
  answeredCount: number
  canSubmit: boolean
  isCorrect: boolean
  isLastQuestion: boolean
  progress: number
  questionIndex: number
  selectedAnswers: string[]
  sessionQuestions: QuizQuestion[]
  submitted: boolean
  onMultipleToggle: (optionId: string) => void
  onNext: () => void
  onOrderingPick: (optionId: string) => void
  onPrev: () => void
  onResetAnswer: () => void
  onSingleSelect: (optionId: string) => void
  onSubmit: () => void
}) {
  return (
    <main className="app-shell">
      <section className="question-card">
        <QuestionStatus
          answeredCount={answeredCount}
          progress={progress}
          questionCount={sessionQuestions.length}
          title={activeSet.title}
        />

        <QuestionMeta question={activeQuestion} />

        <h2>{activeQuestion.prompt}</h2>

        <OptionsList
          question={activeQuestion}
          selectedAnswers={selectedAnswers}
          submitted={submitted}
          onMultipleToggle={onMultipleToggle}
          onOrderingPick={onOrderingPick}
          onSingleSelect={onSingleSelect}
        />

        {activeQuestion.type === 'ordering' ? (
          <OrderingPanel selectedAnswers={selectedAnswers} onResetAnswer={onResetAnswer} />
        ) : null}

        <QuestionActions
          canSubmit={canSubmit}
          isFirstQuestion={questionIndex === 0}
          isLastQuestion={isLastQuestion}
          submitted={submitted}
          onNext={onNext}
          onPrev={onPrev}
          onResetAnswer={onResetAnswer}
          onSubmit={onSubmit}
        />

        {submitted ? <ResultCard isCorrect={isCorrect} question={activeQuestion} /> : null}
      </section>
    </main>
  )
}

function QuestionStatus({
  answeredCount,
  progress,
  questionCount,
  title,
}: {
  answeredCount: number
  progress: number
  questionCount: number
  title: string
}) {
  return (
    <section className="status-panel">
      <div className="status-row">
        <div className="status-set">
          <span className="stat-label">セット</span>
          <strong>{title}</strong>
        </div>
        <div className="status-progress">
          <span className="stat-label">進捗</span>
          <strong>
            {answeredCount} / {questionCount}
          </strong>
        </div>
      </div>

      <div className="progress-track" aria-hidden="true">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </section>
  )
}

function QuestionMeta({ question }: { question: QuizQuestion }) {
  return (
    <div className="question-meta">
      <span className="number-chip">問{question.questionNumber}</span>
      <span className="rule-chip">{getQuestionTypeLabel(question.type)}</span>
      {question.selectionCount ? <span className="rule-chip">{question.selectionCount}つ選択</span> : null}
    </div>
  )
}

function OptionsList({
  question,
  selectedAnswers,
  submitted,
  onMultipleToggle,
  onOrderingPick,
  onSingleSelect,
}: {
  question: QuizQuestion
  selectedAnswers: string[]
  submitted: boolean
  onMultipleToggle: (optionId: string) => void
  onOrderingPick: (optionId: string) => void
  onSingleSelect: (optionId: string) => void
}) {
  return (
    <div className="options">
      {question.options.map((option) =>
        question.type === 'ordering' ? (
          <OrderingOption
            key={option.id}
            option={option}
            order={selectedAnswers.indexOf(option.id)}
            onPick={onOrderingPick}
          />
        ) : (
          <ChoiceOption
            key={option.id}
            option={option}
            question={question}
            selectedAnswers={selectedAnswers}
            submitted={submitted}
            onMultipleToggle={onMultipleToggle}
            onSingleSelect={onSingleSelect}
          />
        ),
      )}
    </div>
  )
}

function OrderingOption({
  option,
  order,
  onPick,
}: {
  option: Option
  order: number
  onPick: (optionId: string) => void
}) {
  return (
    <button
      type="button"
      className={order >= 0 ? 'option-card ordering selected' : 'option-card ordering'}
      onClick={() => onPick(option.id)}
    >
      <span className="option-main">
        <span className="option-id">{option.id}</span>
        <span className="option-text">{option.text}</span>
      </span>
      <span className="order-badge">{order >= 0 ? order + 1 : '+'}</span>
    </button>
  )
}

function ChoiceOption({
  option,
  question,
  selectedAnswers,
  submitted,
  onSingleSelect,
  onMultipleToggle,
}: {
  option: Option
  question: QuizQuestion
  selectedAnswers: string[]
  submitted: boolean
  onSingleSelect: (optionId: string) => void
  onMultipleToggle: (optionId: string) => void
}) {
  const selected = selectedAnswers.includes(option.id)
  const correct = question.correctAnswers.includes(option.id)
  const classNames = ['option-card']

  if (selected) classNames.push('selected')
  if (submitted && correct) classNames.push('correct')
  if (submitted && selected && !correct) classNames.push('incorrect')

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      onClick={() =>
        question.type === 'multiple' ? onMultipleToggle(option.id) : onSingleSelect(option.id)
      }
    >
      <span className="option-main">
        <span className="option-id">{option.id}</span>
        <span className="option-text">{option.text}</span>
      </span>
      <span className="control-badge" aria-hidden="true">
        {question.type === 'multiple' ? (selected ? '■' : '□') : selected ? '◉' : '○'}
      </span>
    </button>
  )
}

function OrderingPanel({
  selectedAnswers,
  onResetAnswer,
}: {
  selectedAnswers: string[]
  onResetAnswer: () => void
}) {
  return (
    <div className="ordering-panel">
      <div>
        <p className="panel-label">現在の回答順</p>
        <div className="sequence-list">
          {selectedAnswers.length === 0 ? (
            <span className="sequence-placeholder">まだ選択していません</span>
          ) : (
            selectedAnswers.map((answer) => <span key={answer}>{answer}</span>)
          )}
        </div>
      </div>
      <button type="button" className="subtle-button" onClick={onResetAnswer}>
        並びをリセット
      </button>
    </div>
  )
}

function QuestionActions({
  canSubmit,
  isFirstQuestion,
  isLastQuestion,
  submitted,
  onNext,
  onPrev,
  onResetAnswer,
  onSubmit,
}: {
  canSubmit: boolean
  isFirstQuestion: boolean
  isLastQuestion: boolean
  submitted: boolean
  onNext: () => void
  onPrev: () => void
  onResetAnswer: () => void
  onSubmit: () => void
}) {
  return (
    <div className="actions question-actions">
      <button type="button" className="nav-button" onClick={onPrev} disabled={isFirstQuestion}>
        前の問題
      </button>
      <button type="button" className="ghost-button" onClick={onResetAnswer}>
        回答をやり直す
      </button>
      {!submitted ? (
        <button type="button" className="primary-button" onClick={onSubmit} disabled={!canSubmit}>
          正解を確認
        </button>
      ) : (
        <button type="button" className="primary-button" onClick={onNext}>
          {isLastQuestion ? '結果を見る' : '次の問題'}
        </button>
      )}
    </div>
  )
}

function ResultCard({ isCorrect, question }: { isCorrect: boolean; question: QuizQuestion }) {
  return (
    <section className={isCorrect ? 'result-card correct' : 'result-card incorrect'}>
      <p className="result-label">{isCorrect ? '正解' : '不正解'}</p>
      <p className="result-answer">
        正解: <code>{question.correctAnswers.join(' -> ')}</code>
      </p>
      <MarkdownContent className="result-explanation" markdown={question.explanation} />
    </section>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <main className="app-shell">
      <section className="empty-card">
        <p>{message}</p>
      </section>
    </main>
  )
}

function getCurrentSelection(
  question: QuizQuestion,
  draftSelectionsByQuestion: Record<number, string[]>,
  answersByQuestion: Record<number, AnswerRecord>,
) {
  return (
    draftSelectionsByQuestion[question.questionNumber] ??
    answersByQuestion[question.questionNumber]?.selectedAnswers ??
    []
  )
}

function removeQuestionEntry<T>(records: Record<number, T>, question: QuizQuestion) {
  const next = { ...records }
  delete next[question.questionNumber]
  return next
}

export default App

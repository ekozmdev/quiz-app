import { type ReactNode, useState } from 'react'
import './App.css'
import { quizSets } from './data'
import type { Option, QuizQuestion } from './types'

type AnswerRecord = {
  selectedAnswers: string[]
  isCorrect: boolean
}

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
    if (submitted) return

    if (!activeQuestion) return

    setDraftSelectionsByQuestion((current) => ({
      ...current,
      [activeQuestion.questionNumber]: [optionId],
    }))
  }

  function handleMultipleToggle(optionId: string) {
    if (!activeQuestion || submitted) return

    setDraftSelectionsByQuestion((current) => {
      const currentSelection =
        current[activeQuestion.questionNumber] ??
        answersByQuestion[activeQuestion.questionNumber]?.selectedAnswers ??
        []

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
    if (submitted) return

    if (!activeQuestion) return

    setDraftSelectionsByQuestion((current) => {
      const currentSelection =
        current[activeQuestion.questionNumber] ??
        answersByQuestion[activeQuestion.questionNumber]?.selectedAnswers ??
        []

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

    const isCorrect = areAnswersEqual(activeQuestion, selectedAnswers, activeQuestion.correctAnswers)

    setAnswersByQuestion((current) => ({
      ...current,
      [activeQuestion.questionNumber]: {
        selectedAnswers,
        isCorrect,
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

    setDraftSelectionsByQuestion((current) => {
      const next = { ...current }
      delete next[activeQuestion.questionNumber]
      return next
    })
    setAnswersByQuestion((current) => {
      const next = { ...current }
      delete next[activeQuestion.questionNumber]
      return next
    })
  }

  if (!activeSet) {
    return (
      <main className="app-shell">
        <section className="empty-card">
          <p>問題セットが見つかりません。</p>
        </section>
      </main>
    )
  }

  if (!hasStarted) {
    return (
      <main className="app-shell">
        <section className="toolbar setup-toolbar">
          <div className="heading-block">
            <p className="eyebrow">Quiz Practice</p>
            <h1>{activeSet.title}</h1>
            <p>{activeSet.description}</p>
          </div>

          <label className="select-wrap">
            <span className="stat-label">問題セット</span>
            <select value={setId} onChange={(event) => handleSetChange(event.target.value)}>
              {quizSets.map((quizSet) => (
                <option key={quizSet.id} value={quizSet.id}>
                  {quizSet.title}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="primary-button start-button" onClick={handleStart}>
            開始
          </button>
        </section>
      </main>
    )
  }

  if (!activeQuestion && !showSummary) {
    return (
      <main className="app-shell">
        <section className="empty-card">
          <p>問題を読み込めませんでした。</p>
        </section>
      </main>
    )
  }

  if (showSummary) {
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
              <span className="stat-label">正答率</span>
              <strong>{percentage}%</strong>
            </div>
            <div className="summary-grid">
              <div className="status-item">
                <span className="stat-label">正解</span>
                <strong>{correctCount}</strong>
              </div>
              <div className="status-item">
                <span className="stat-label">不正解</span>
                <strong>{sessionQuestions.length - correctCount}</strong>
              </div>
              <div className="status-item">
                <span className="stat-label">問題数</span>
                <strong>{sessionQuestions.length}</strong>
              </div>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="ghost-button" onClick={() => setShowSummary(false)}>
              最後の問題に戻る
            </button>
            <button type="button" className="primary-button" onClick={resetSession}>
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
                  <div key={question.questionNumber} className="summary-item">
                    <p className="summary-question">
                      問{question.questionNumber}: {question.prompt}
                    </p>
                    <p className="summary-answer">
                      正解: <code>{question.correctAnswers.join(' -> ')}</code>
                    </p>
                    <div className="markdown-content">{renderMarkdown(question.explanation)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      </main>
    )
  }

  const currentAnswer = answersByQuestion[activeQuestion.questionNumber]
  const isCorrect = currentAnswer
    ? currentAnswer.isCorrect
    : areAnswersEqual(activeQuestion, selectedAnswers, activeQuestion.correctAnswers)
  const canSubmit = hasValidSelection(activeQuestion, selectedAnswers)
  const isLastQuestion = questionIndex === sessionQuestions.length - 1

  return (
    <main className="app-shell">
      <section className="question-card">
        <section className="status-panel">
          <div className="status-row">
            <div className="status-item">
              <span className="stat-label">セット</span>
              <strong>{activeSet.title}</strong>
            </div>
            <div className="status-item">
              <span className="stat-label">進捗</span>
              <strong>
                {answeredCount} / {sessionQuestions.length}
              </strong>
            </div>
            <div className="status-item">
              <span className="stat-label">形式</span>
              <strong>{labelForType(activeQuestion.type)}</strong>
            </div>
          </div>

          <div className="progress-track" aria-hidden="true">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <div className="question-meta">
          <span className="number-chip">問{activeQuestion.questionNumber}</span>
          {activeQuestion.selectionCount ? (
            <span className="rule-chip">{activeQuestion.selectionCount}つ選択</span>
          ) : null}
        </div>

        <h2>{activeQuestion.prompt}</h2>

        <div className="options">
          {activeQuestion.type === 'ordering'
            ? activeQuestion.options.map((option) => {
                const order = selectedAnswers.indexOf(option.id)

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={order >= 0 ? 'option-card ordering selected' : 'option-card ordering'}
                    onClick={() => handleOrderingPick(option.id)}
                  >
                    <span className="option-main">
                      <span className="option-id">{option.id}</span>
                      <span className="option-text">{option.text}</span>
                    </span>
                    <span className="order-badge">{order >= 0 ? order + 1 : '+'}</span>
                  </button>
                )
              })
            : activeQuestion.options.map((option) =>
                renderChoiceOption({
                  option,
                  question: activeQuestion,
                  selectedAnswers,
                  submitted,
                  onSingleSelect: handleSingleSelect,
                  onMultipleToggle: handleMultipleToggle,
                }),
              )}
        </div>

        {activeQuestion.type === 'ordering' ? (
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
            <button type="button" className="subtle-button" onClick={handleResetAnswer}>
              並びをリセット
            </button>
          </div>
        ) : null}

        <div className="actions">
          <button type="button" className="nav-button" onClick={handlePrev} disabled={questionIndex === 0}>
            前の問題
          </button>
          <button type="button" className="ghost-button" onClick={handleResetAnswer}>
            回答をやり直す
          </button>
          {!submitted ? (
            <button type="button" className="primary-button" onClick={handleSubmit} disabled={!canSubmit}>
              正解を確認
            </button>
          ) : (
            <button type="button" className="primary-button" onClick={handleNext}>
              {isLastQuestion ? '結果を見る' : '次の問題'}
            </button>
          )}
        </div>

        {submitted ? (
          <section className={isCorrect ? 'result-card correct' : 'result-card incorrect'}>
            <p className="result-label">{isCorrect ? '正解' : '不正解'}</p>
            <p className="result-answer">
              正解: <code>{activeQuestion.correctAnswers.join(' -> ')}</code>
            </p>
            <div className="markdown-content result-explanation">
              {renderMarkdown(activeQuestion.explanation)}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function renderChoiceOption({
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

  const controlType = question.type === 'multiple' ? 'checkbox' : 'radio'

  return (
    <button
      key={option.id}
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
        {controlType === 'checkbox' ? (selected ? '■' : '□') : selected ? '◉' : '○'}
      </span>
    </button>
  )
}

function hasValidSelection(question: QuizQuestion, selectedAnswers: string[]) {
  if (question.type === 'single') return selectedAnswers.length === 1
  if (question.type === 'multiple') {
    return selectedAnswers.length === (question.selectionCount ?? question.correctAnswers.length)
  }
  return selectedAnswers.length === question.correctAnswers.length
}

function areAnswersEqual(
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

function labelForType(type: QuizQuestion['type']) {
  switch (type) {
    case 'single':
      return '単一選択'
    case 'multiple':
      return '複数選択'
    case 'ordering':
      return '並べ替え'
  }
}

function renderMarkdown(markdown: string): ReactNode {
  const normalized = markdown.replace(/\r\n/g, '\n').trim()
  if (normalized === '') return null

  const blocks = normalized.split(/\n{2,}/)

  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n')
    const headingMatch = block.match(/^(#{1,3})\s+(.+)$/)
    const isUnorderedList = lines.every((line) => /^[-*]\s+/.test(line))
    const isOrderedList = lines.every((line) => /^\d+\.\s+/.test(line))

    if (headingMatch) {
      const HeadingTag = headingMatch[1].length === 1 ? 'h3' : headingMatch[1].length === 2 ? 'h4' : 'h5'
      return <HeadingTag key={blockIndex}>{renderInlineMarkdown(headingMatch[2])}</HeadingTag>
    }

    if (isUnorderedList) {
      return (
        <ul key={blockIndex}>
          {lines.map((line, lineIndex) => (
            <li key={`${blockIndex}-${lineIndex}`}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>
          ))}
        </ul>
      )
    }

    if (isOrderedList) {
      return (
        <ol key={blockIndex}>
          {lines.map((line, lineIndex) => (
            <li key={`${blockIndex}-${lineIndex}`}>
              {renderInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}
            </li>
          ))}
        </ol>
      )
    }

    return (
      <p key={blockIndex}>
        {lines.flatMap((line, lineIndex) =>
          lineIndex === 0
            ? renderInlineMarkdown(line)
            : [<br key={`${blockIndex}-${lineIndex}-br`} />, ...renderInlineMarkdown(line)],
        )}
      </p>
    )
  })
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('[')) {
      const parsed = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (parsed) {
        const href = parsed[2]
        nodes.push(
          <a key={`${match.index}-link`} href={href} target="_blank" rel="noreferrer">
            {parsed[1]}
          </a>,
        )
      } else {
        nodes.push(token)
      }
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>)
    } else {
      nodes.push(token)
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export default App

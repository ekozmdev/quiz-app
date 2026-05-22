import { MarkdownContent } from './MarkdownContent'
import type { Option, QuizQuestion, QuizSetWithId } from './types'
import { getQuestionTypeLabel } from './quizLogic'

export function QuestionScreen({
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
        クリア
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

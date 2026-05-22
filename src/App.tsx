import { useState } from 'react'
import './App.css'
import { quizSets } from './data'
import type { QuizQuestion } from './types'
import { areAnswersEqual, type AnswerRecord, hasValidSelection } from './quizLogic'
import { EmptyState } from './EmptyState'
import { SetupScreen } from './SetupScreen'
import { SummaryScreen } from './SummaryScreen'
import { QuestionScreen } from './QuestionScreen'

function App() {
  const initialSetId = quizSets[0]?.id ?? ''
  const [setId, setSetId] = useState(initialSetId)
  const [shuffle, setShuffle] = useState(false)
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

    const questions = shuffle ? shuffleArray(activeSet.questions) : activeSet.questions
    setSessionQuestions(questions)
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
        shuffle={shuffle}
        onSetChange={handleSetChange}
        onShuffleChange={setShuffle}
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

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
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

#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import process from 'node:process'

async function main() {
  const args = process.argv.slice(2)
  const readFromStdin = args.includes('--stdin') || args.length === 0
  const filePath = readFromStdin ? null : args[0]

  if (!readFromStdin && !filePath) {
    fail('Usage: validate-quiz-json.mjs <file.json> or --stdin')
  }

  const raw = readFromStdin ? await readStdin() : await readFile(filePath, 'utf8')

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    fail(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }

  const errors = validateQuizSet(parsed)

  if (errors.length > 0) {
    process.stderr.write('Quiz JSON validation failed.\n')
    for (const error of errors) {
      process.stderr.write(`- ${error}\n`)
    }
    process.exit(1)
  }

  const questionCount = parsed.questions.length
  process.stdout.write(`Quiz JSON is valid. ${questionCount} question(s) checked.\n`)
}

function validateQuizSet(value) {
  const errors = []

  if (!isRecord(value)) {
    return ['Root must be a JSON object.']
  }

  assertNonEmptyString(errors, value.title, 'title')
  assertNonEmptyString(errors, value.description, 'description')

  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    errors.push('questions must be a non-empty array.')
    return errors
  }

  const questionNumbers = new Set()

  value.questions.forEach((question, index) => {
    const path = `questions[${index}]`

    if (!isRecord(question)) {
      errors.push(`${path} must be an object.`)
      return
    }

    if (!Number.isInteger(question.questionNumber) || question.questionNumber < 1) {
      errors.push(`${path}.questionNumber must be a positive integer.`)
    } else if (questionNumbers.has(question.questionNumber)) {
      errors.push(`${path}.questionNumber must be unique.`)
    } else {
      questionNumbers.add(question.questionNumber)
    }

    if (!isQuestionType(question.type)) {
      errors.push(`${path}.type must be "single", "multiple", or "ordering".`)
    }

    assertNonEmptyString(errors, question.prompt, `${path}.prompt`)
    assertNonEmptyString(errors, question.explanation, `${path}.explanation`)

    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`${path}.options must be an array with at least 2 items.`)
    }

    const optionIds = new Set()
    if (Array.isArray(question.options)) {
      question.options.forEach((option, optionIndex) => {
        const optionPath = `${path}.options[${optionIndex}]`

        if (!isRecord(option)) {
          errors.push(`${optionPath} must be an object.`)
          return
        }

        assertNonEmptyString(errors, option.id, `${optionPath}.id`)
        assertNonEmptyString(errors, option.text, `${optionPath}.text`)

        if (typeof option.id === 'string') {
          if (optionIds.has(option.id)) {
            errors.push(`${optionPath}.id must be unique within the question.`)
          } else {
            optionIds.add(option.id)
          }
        }
      })
    }

    if (!Array.isArray(question.correctAnswers) || question.correctAnswers.length === 0) {
      errors.push(`${path}.correctAnswers must be a non-empty array.`)
    } else {
      const correctAnswerIds = new Set()

      question.correctAnswers.forEach((answerId, answerIndex) => {
        const answerPath = `${path}.correctAnswers[${answerIndex}]`

        if (typeof answerId !== 'string' || answerId.trim() === '') {
          errors.push(`${answerPath} must be a non-empty string.`)
          return
        }

        if (correctAnswerIds.has(answerId)) {
          errors.push(`${answerPath} must not duplicate another correct answer.`)
        } else {
          correctAnswerIds.add(answerId)
        }

        if (optionIds.size > 0 && !optionIds.has(answerId)) {
          errors.push(`${answerPath} must reference an existing options[].id.`)
        }
      })
    }

    if (question.references !== undefined && !Array.isArray(question.references)) {
      errors.push(`${path}.references must be an array when present.`)
    }

    validateTypeSpecificRules(errors, question, path)
  })

  return errors
}

function validateTypeSpecificRules(errors, question, path) {
  if (!isQuestionType(question.type) || !Array.isArray(question.correctAnswers)) {
    return
  }

  if (question.selectionCount !== undefined) {
    if (!Number.isInteger(question.selectionCount) || question.selectionCount < 1) {
      errors.push(`${path}.selectionCount must be a positive integer when present.`)
    }
  }

  if (question.type === 'single') {
    if (question.correctAnswers.length !== 1) {
      errors.push(`${path}.correctAnswers must contain exactly 1 item for single questions.`)
    }

    if (question.selectionCount !== undefined && question.selectionCount !== 1) {
      errors.push(`${path}.selectionCount must be 1 for single questions.`)
    }

    return
  }

  if (question.type === 'multiple') {
    if (
      question.selectionCount !== undefined &&
      question.selectionCount !== question.correctAnswers.length
    ) {
      errors.push(
        `${path}.selectionCount must equal correctAnswers.length for multiple questions.`,
      )
    }

    return
  }

  if (!Array.isArray(question.options)) {
    return
  }

  if (question.correctAnswers.length !== question.options.length) {
    errors.push(`${path}.correctAnswers must include every option id for ordering questions.`)
  }

  if (question.selectionCount !== undefined && question.selectionCount !== question.options.length) {
    errors.push(`${path}.selectionCount must equal options.length for ordering questions.`)
  }
}

function assertNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string.`)
  }
}

function isQuestionType(value) {
  return value === 'single' || value === 'multiple' || value === 'ordering'
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readStdin() {
  let data = ''

  for await (const chunk of process.stdin) {
    data += chunk
  }

  if (data.trim() === '') {
    fail('No input received from stdin.')
  }

  return data
}

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

await main()

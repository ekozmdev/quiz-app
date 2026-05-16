import type { ReactNode } from 'react'

type MarkdownContentProps = {
  className?: string
  markdown: string
}

export function MarkdownContent({ className, markdown }: MarkdownContentProps) {
  const classNames = className ? `markdown-content ${className}` : 'markdown-content'

  return <div className={classNames}>{renderMarkdown(markdown)}</div>
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
      const HeadingTag =
        headingMatch[1].length === 1 ? 'h3' : headingMatch[1].length === 2 ? 'h4' : 'h5'
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
        nodes.push(
          <a key={`${match.index}-link`} href={parsed[2]} target="_blank" rel="noreferrer">
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

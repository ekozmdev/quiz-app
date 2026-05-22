import type { QuizSetWithId } from './types'

export function SetupScreen({
  activeSet,
  quizSets,
  setId,
  shuffle,
  onSetChange,
  onShuffleChange,
  onStart,
}: {
  activeSet: QuizSetWithId
  quizSets: QuizSetWithId[]
  setId: string
  shuffle: boolean
  onSetChange: (setId: string) => void
  onShuffleChange: (shuffle: boolean) => void
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

        <label className="checkbox-wrap">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(event) => onShuffleChange(event.target.checked)}
          />
          <span>出題順をシャッフル</span>
        </label>

        <button type="button" className="primary-button start-button" onClick={onStart}>
          開始
        </button>
      </section>
    </main>
  )
}

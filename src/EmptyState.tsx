export function EmptyState({ message }: { message: string }) {
  return (
    <main className="app-shell">
      <section className="empty-card">
        <p>{message}</p>
      </section>
    </main>
  )
}

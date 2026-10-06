// Layout A, "Workstation": library sidebar | header, notation view, editor panel | settings sidebar.
// The columns are empty shells for now; later tickets fill them.

const settingGroups = ['Groove', 'Sticking', 'Exercise', 'Editor', 'Volume']

export function App() {
  return (
    <div className="workstation">
      <aside className="library" aria-label="Exercise library">
        <h3>Exercises</h3>
      </aside>

      <main className="main">
        <header className="header">
          <h1 className="app-name">Syncopate!</h1>
        </header>
        <section className="notation-view" aria-label="Notation view" />
        <section className="editor-panel" aria-label="Grid editor" />
      </main>

      <aside className="settings" aria-label="Settings">
        {settingGroups.map((group) => (
          <section key={group} className="group">
            <h3>{group}</h3>
          </section>
        ))}
      </aside>
    </div>
  )
}

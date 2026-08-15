const prayers = [
  ['Fajr', '—'],
  ['Dhuhr', '—'],
  ['Asr', '—'],
  ['Maghrib', '—'],
  ['Isha', '—'],
] as const;

export function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">SalahOS</p>
        <h1>Prayer times, locally calculated.</h1>
        <p className="hero-copy">
          Privacy-first prayer times for mobile, Raspberry Pi, TV, and kiosk displays.
        </p>
      </header>

      <section className="status-card" aria-labelledby="today-heading">
        <div>
          <p className="label">Current location</p>
          <p className="value">Not configured</p>
        </div>
        <div>
          <p className="label">Calculation source</p>
          <p className="value">Not configured</p>
        </div>
      </section>

      <section className="prayer-panel" aria-labelledby="today-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Today</p>
            <h2 id="today-heading">Daily prayers</h2>
          </div>
          <p className="next-prayer">Configure a location to begin</p>
        </div>

        <div className="prayer-grid">
          {prayers.map(([name, time]) => (
            <article className="prayer-card" key={name}>
              <span>{name}</span>
              <strong>{time}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function Header() {
  return (
    <header className="app-header" id="app-header">
      <div className="logo">
        <div className="logo-icon" aria-hidden="true">🌍</div>
        <div>
          <h1>World Explorer</h1>
        </div>
      </div>
      <span className="header-subtitle">Click a country to explore</span>
    </header>
  );
}

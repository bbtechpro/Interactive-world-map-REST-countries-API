const REGION_STYLES = {
  Africa: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" },
  Americas: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
  Asia: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
  Europe: { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1", border: "rgba(99, 102, 241, 0.3)" },
  Oceania: { bg: "rgba(6, 182, 212, 0.12)", color: "#06b6d4", border: "rgba(6, 182, 212, 0.3)" },
  Polar: { bg: "rgba(167, 139, 250, 0.12)", color: "#a78bfa", border: "rgba(167, 139, 250, 0.3)" },
};

const DEFAULT_STYLE = { bg: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.3)" };

export default function CountryCard({ country, onClose, allCountries, onSelectCountry }) {
  if (!country) return null;

  const regionStyle = REGION_STYLES[country.region] || DEFAULT_STYLE;

  const languages = country.languages
    ? country.languages.map((l) => l.name).join(", ")
    : "N/A";

  const currencies = country.currencies
    ? country.currencies.map((c) => `${c.name} (${c.symbol || c.code})`).join(", ")
    : "N/A";

  const capital = Array.isArray(country.capital)
    ? country.capital.join(", ")
    : country.capital || "N/A";

  function handleBorderClick(borderCode) {
    const found = allCountries.find((c) => c.alpha3Code === borderCode);
    if (found) onSelectCountry(found);
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`card-overlay${country ? " visible" : ""}`}
        onClick={onClose}
        id="card-overlay"
      />

      {/* Panel */}
      <aside
        className={`country-panel${country ? " open" : ""}`}
        id="country-panel"
        role="complementary"
        aria-label={`Details for ${country.name}`}
      >
        {/* Close button */}
        <button className="panel-close" onClick={onClose} aria-label="Close" id="panel-close">
          ✕
        </button>

        {/* Flag hero */}
        <div className="panel-flag-section">
          <div
            className="panel-flag-bg"
            style={{
              backgroundImage: `url(${country.flags?.png || country.flag})`,
            }}
          />
          <img
            className="panel-flag-img"
            src={country.flags?.png || country.flag}
            alt={`Flag of ${country.name}`}
          />
        </div>

        {/* Content */}
        <div className="panel-content">
          <h2 className="panel-country-name">{country.name}</h2>
          {country.nativeName && country.nativeName !== country.name && (
            <p className="panel-native-name">{country.nativeName}</p>
          )}

          {/* Region badge */}
          <div className="region-badge-wrapper">
            <span
              className="region-badge"
              style={{
                background: regionStyle.bg,
                color: regionStyle.color,
                border: `1px solid ${regionStyle.border}`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: regionStyle.color,
                  display: "inline-block",
                }}
              />
              {country.region}{country.subregion ? ` · ${country.subregion}` : ""}
            </span>
          </div>

          {/* Info grid */}
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Population</div>
              <div className="info-value">
                {country.population?.toLocaleString() ?? "N/A"}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Capital</div>
              <div className="info-value">{capital}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Area</div>
              <div className="info-value">
                {country.area ? `${country.area.toLocaleString()} km²` : "N/A"}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Top Level Domain</div>
              <div className="info-value small">
                {country.topLevelDomain?.join(", ") || "N/A"}
              </div>
            </div>
            <div className="info-item full-width">
              <div className="info-label">Languages</div>
              <div className="info-value small">{languages}</div>
            </div>
            <div className="info-item full-width">
              <div className="info-label">Currencies</div>
              <div className="info-value small">{currencies}</div>
            </div>
          </div>

          {/* Border countries */}
          <div className="borders-section">
            <div className="borders-title">Border Countries</div>
            {country.borders && country.borders.length > 0 ? (
              <div className="borders-list">
                {country.borders.map((border) => {
                  const borderCountry = allCountries.find(
                    (c) => c.alpha3Code === border
                  );
                  return (
                    <button
                      key={border}
                      className="border-tag"
                      onClick={() => handleBorderClick(border)}
                    >
                      {borderCountry ? borderCountry.name : border}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="no-borders">Island nation — no land borders</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

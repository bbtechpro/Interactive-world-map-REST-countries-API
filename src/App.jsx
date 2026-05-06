import { useState, useEffect } from "react";
import Header from "./components/Header";
import WorldMap from "./components/WorldMap";
import CountryCard from "./components/CountryCard";
import "./App.css";

export default function App() {
  const [allCountries, setAllCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    country: null,
  });

  // Fetch country data on mount
  useEffect(() => {
    async function fetchCountries() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/data.json`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        setAllCountries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load country data:", err);
      }
    }
    fetchCountries();
  }, []);

  function handleSelectCountry(country) {
    setSelectedCountry(country);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }

  function handleCloseCard() {
    setSelectedCountry(null);
  }

  return (
    <>
      <Header />

      <main className="app-main" id="app-main">
        <section className={`map-section${selectedCountry ? " shifted" : ""}`}>
          <p className="map-hint">
            <span>Click</span> on any country to explore · Scroll to zoom · Drag to pan
          </p>

          {allCountries.length > 0 && (
            <WorldMap
              countries={allCountries}
              selectedCountry={selectedCountry}
              onSelectCountry={handleSelectCountry}
              tooltip={tooltip}
              setTooltip={setTooltip}
            />
          )}
        </section>

        <CountryCard
          country={selectedCountry}
          onClose={handleCloseCard}
          allCountries={allCountries}
          onSelectCountry={handleSelectCountry}
        />
      </main>
    </>
  );
}

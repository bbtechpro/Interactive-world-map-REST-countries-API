import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { feature } from "topojson-client";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const REGION_COLORS = {
  Africa: "#f59e0b",
  Americas: "#10b981",
  Asia: "#ef4444",
  Europe: "#6366f1",
  Oceania: "#06b6d4",
  Polar: "#a78bfa",
};

const DEFAULT_COLOR = "#334155";

const LEGEND_ITEMS = [
  { label: "Africa", color: REGION_COLORS.Africa },
  { label: "Americas", color: REGION_COLORS.Americas },
  { label: "Asia", color: REGION_COLORS.Asia },
  { label: "Europe", color: REGION_COLORS.Europe },
  { label: "Oceania", color: REGION_COLORS.Oceania },
];

// Build a lookup from various codes → country data
function buildLookup(countries) {
  const map = {};
  countries.forEach((c) => {
    if (c.numericCode) map[c.numericCode] = c;
    if (c.alpha2Code) map[c.alpha2Code] = c;
    if (c.alpha3Code) map[c.alpha3Code] = c;
  });
  return map;
}

function getRegionColor(country) {
  if (!country) return DEFAULT_COLOR;
  return REGION_COLORS[country.region] || DEFAULT_COLOR;
}

export default function WorldMap({
  countries,
  selectedCountry,
  onSelectCountry,
  tooltip,
  setTooltip,
}) {
  const [geoData, setGeoData] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomBehaviorRef = useRef(null);

  const lookup = useMemo(() => buildLookup(countries), [countries]);

  // Fetch the TopoJSON world data
  useEffect(() => {
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((topology) => {
        const geojson = feature(topology, topology.objects.countries);
        setGeoData(geojson);
      })
      .catch((err) => console.error("Failed to load map data:", err));
  }, []);

  // Setup zoom behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = select(svgRef.current);
    const g = select(gRef.current);

    const zoomBehavior = zoom()
      .scaleExtent([0.5, 8])
      .on("zoom", (event) => {
        const { transform } = event;
        g.attr("transform", transform);
        setTransform({ k: transform.k, x: transform.x, y: transform.y });
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  // Projection & path generator
  const width = 960;
  const height = 500;

  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale(155)
        .translate([width / 2, height / 2])
        .rotate([-10, 0]),
    []
  );

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const handleMouseEnter = useCallback(
    (evt, country) => {
      if (country) {
        setHoveredId(country.alpha3Code);
        setTooltip({
          visible: true,
          x: evt.clientX,
          y: evt.clientY,
          country,
        });
      }
    },
    [setTooltip]
  );

  const handleMouseMove = useCallback(
    (evt, country) => {
      if (country) {
        setTooltip({
          visible: true,
          x: evt.clientX,
          y: evt.clientY,
          country,
        });
      }
    },
    [setTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, [setTooltip]);

  const handleClick = useCallback(
    (country) => {
      if (country) onSelectCountry(country);
    },
    [onSelectCountry]
  );

  // Zoom controls - Direct transform approach
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(transform.k * 1.2, 8);
    setTransform({ k: newScale, x: transform.x, y: transform.y });
  }, [transform]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(transform.k / 1.2, 0.5);
    setTransform({ k: newScale, x: transform.x, y: transform.y });
  }, [transform]);

  const handleResetZoom = useCallback(() => {
    setTransform({ k: 1, x: 0, y: 0 });
  }, []);

  // Pan controls
  const handlePanUp = useCallback(() => {
    const panAmount = 50 / transform.k;
    setTransform(prev => ({ ...prev, y: prev.y + panAmount }));
  }, [transform.k]);

  const handlePanDown = useCallback(() => {
    const panAmount = 50 / transform.k;
    setTransform(prev => ({ ...prev, y: prev.y - panAmount }));
  }, [transform.k]);

  const handlePanLeft = useCallback(() => {
    const panAmount = 50 / transform.k;
    setTransform(prev => ({ ...prev, x: prev.x + panAmount }));
  }, [transform.k]);

  const handlePanRight = useCallback(() => {
    const panAmount = 50 / transform.k;
    setTransform(prev => ({ ...prev, x: prev.x - panAmount }));
  }, [transform.k]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    e.preventDefault();
  }, [transform]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setTransform(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleDragMove(e);
    const handleGlobalMouseUp = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!geoData) {
    return (
      <div className="map-container" id="map-container">
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <p>Loading world map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container" id="map-container">
      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button className="zoom-btn zoom-in" onClick={handleZoomIn} aria-label="Zoom in">
          +
        </button>
        <button className="zoom-btn zoom-reset" onClick={handleResetZoom} aria-label="Reset zoom">
          ⟲
        </button>
        <button className="zoom-btn zoom-out" onClick={handleZoomOut} aria-label="Zoom out">
          −
        </button>
      </div>

      {/* Pan Controls */}
      <div className="pan-controls">
        <button className="pan-btn pan-up" onClick={handlePanUp} aria-label="Pan up">
          ↑
        </button>
        <div className="pan-row">
          <button className="pan-btn pan-left" onClick={handlePanLeft} aria-label="Pan left">
            ←
          </button>
          <button className="pan-btn pan-right" onClick={handlePanRight} aria-label="Pan right">
            →
          </button>
        </div>
        <button className="pan-btn pan-down" onClick={handlePanDown} aria-label="Pan down">
          ↓
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="map-svg"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Ocean background */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="transparent"
        />

        {/* Zoomable group */}
        <g ref={gRef} transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Country paths */}
          {geoData.features.map((feat) => {
          const numericId = feat.id;
          const isoA2 = feat.properties?.ISO_A2;
          const isoA3 = feat.properties?.ISO_A3;
          const country =
            lookup[numericId] || lookup[isoA2] || lookup[isoA3] || null;
          const fill = getRegionColor(country);
          const isSelected =
            selectedCountry &&
            country &&
            country.alpha3Code === selectedCountry.alpha3Code;
          const isHovered =
            country && hoveredId === country.alpha3Code;

          const d = pathGenerator(feat);
          if (!d) return null;

          return (
            <path
              key={feat.id || Math.random()}
              d={d}
              fill={fill}
              className={`map-geography${isSelected ? " selected" : ""}${isHovered ? " hovered" : ""}`}
              style={{
                opacity: isSelected ? 1 : isHovered ? 0.95 : 0.72,
              }}
              onClick={() => handleClick(country)}
              onMouseEnter={(evt) => handleMouseEnter(evt, country)}
              onMouseMove={(evt) => handleMouseMove(evt, country)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
        </g>
      </svg>

      {/* Legend */}
      <div className="map-legend" id="map-legend">
        {LEGEND_ITEMS.map((item) => (
          <div className="legend-item" key={item.label}>
            <span className="legend-dot" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      <div
        className={`map-tooltip${tooltip.visible ? " visible" : ""}`}
        style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
      >
        {tooltip.country && (
          <>
            <img
              className="tooltip-flag"
              src={tooltip.country.flags?.png || tooltip.country.flag}
              alt=""
            />
            {tooltip.country.name}
          </>
        )}
      </div>
    </div>
  );
}

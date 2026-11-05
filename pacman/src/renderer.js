/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * SVG renderer.
 */

import {
  MAZE_CONFIG,
  MAZE_LAYOUT,
  getWallSegments,
} from "./maze.js";

import {
  createGameEvents,
} from "./game-engine.js";

import {
  renderPacmanMouth,
  renderGhostMovement,
  renderWallGlow,
  renderHudParticles,
  renderPacmanPath,
  renderGhostEscape,
  renderCollectiblePickup,
  renderSpecialCoinGlow,
} from "./animation.js";

// --------------------------------------------------
// LAYOUT
// --------------------------------------------------

const LAYOUT = {
  width: 1200,
  height: 480,
  mazeX: 45,
  mazeY: 145,
  mazeWidth: 1110,
  mazeHeight: 230,
  cycleDuration: 90,
};

// --------------------------------------------------
// COLORS
// --------------------------------------------------

const GHOST_COLORS = [
  "#FF4B75",
  "#00E5FF",
  "#FFB84D",
  "#B66DFF",
  "#FF6BCE",
  "#39D8A7",
  "#F36BFF",
  "#A5E85A",
];

const CONTRIBUTION_COLORS = [
  "#0E4429",
  "#006D32",
  "#26A641",
  "#39D353",
];

const SVG_NS = "http://www.w3.org/2000/svg";

// --------------------------------------------------
// DIMENSIONS
// --------------------------------------------------

function getMazeDimensions() {
  const rows = MAZE_LAYOUT.length;
  const columns = MAZE_LAYOUT[0].length;

  return {
    rows,
    columns,
    cellWidth: LAYOUT.mazeWidth / columns,
    cellHeight: LAYOUT.mazeHeight / rows,
  };
}

function cellCenter(x, y) {
  const { cellWidth, cellHeight } = getMazeDimensions();

  return {
    x: LAYOUT.mazeX + (x + 0.5) * cellWidth,
    y: LAYOUT.mazeY + (y + 0.5) * cellHeight,
  };
}

// --------------------------------------------------
// ROUTES
// --------------------------------------------------

function routeToSvgPath(route, relativeTo = null) {
  if (!Array.isArray(route) || route.length === 0) return "";

  const origin = relativeTo
    ? cellCenter(relativeTo.x, relativeTo.y)
    : { x: 0, y: 0 };

  return route.map((point, index) => {
    const position = cellCenter(point.x, point.y);

    const x = position.x - origin.x;
    const y = position.y - origin.y;

    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
}

function getRouteKeyPoints(route) {
  if (!Array.isArray(route) || route.length < 2) {
    return "0;1";
  }

  const positions = route.map((point) =>
    cellCenter(point.x, point.y)
  );

  const distances = [0];

  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i - 1].x;
    const dy = positions[i].y - positions[i - 1].y;

    distances.push(
      distances[i - 1] + Math.hypot(dx, dy)
    );
  }

  const total = distances[distances.length - 1] || 1;

  return distances
    .map((value) => value / total)
    .join(";");
}

function getPickupTime(routeIndex, events) {
  const times = events.speed?.keyTimes;

  if (!times?.length || routeIndex < 0) return 0;

  const index = Math.min(routeIndex, times.length - 1);

  return times[index] * LAYOUT.cycleDuration;
}

// --------------------------------------------------
// BACKGROUND
// --------------------------------------------------

function renderBackground() {
  return `
    <rect
      width="${LAYOUT.width}"
      height="${LAYOUT.height}"
      fill="${MAZE_CONFIG.background}"
    />

    <defs>
      <pattern
        id="circuit-grid"
        width="32"
        height="32"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M32 0H0V32"
          fill="none"
          stroke="#15212D"
          stroke-width="0.7"
          opacity="0.55"
        />
      </pattern>

      <filter id="cyan-glow">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="green-glow">
        <feGaussianBlur stdDeviation="1.6" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="pacman-glow">
        <feGaussianBlur stdDeviation="3.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <clipPath id="maze-clip">
        <rect
          x="${LAYOUT.mazeX}"
          y="${LAYOUT.mazeY}"
          width="${LAYOUT.mazeWidth}"
          height="${LAYOUT.mazeHeight}"
          rx="8"
        />
      </clipPath>
    </defs>

    <rect
      width="${LAYOUT.width}"
      height="${LAYOUT.height}"
      fill="url(#circuit-grid)"
    />
  `;
}

// --------------------------------------------------
// HEADER
// --------------------------------------------------

function renderHeader() {
  return `
    <g font-family="monospace">
      <text
        x="45"
        y="36"
        fill="#00D9FF"
        font-size="11"
        letter-spacing="3"
      >SYSTEM // CONTRIBUTION MATRIX</text>

      <text
        x="45"
        y="76"
        fill="#E6EDF3"
        font-size="27"
        font-weight="bold"
        letter-spacing="3"
      >WHEATLEY06</text>

      <circle cx="1150" cy="34" r="5" fill="#39D353">
        <animate
          attributeName="opacity"
          values="1;0.35;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      <text
        x="1138"
        y="56"
        text-anchor="end"
        fill="#39D353"
        font-size="11"
        letter-spacing="2"
      >ONLINE</text>

      <text
        x="45"
        y="116"
        fill="#00D9FF"
        font-size="12"
        letter-spacing="3"
      >PAC-MAN CONTRIBUTIONS</text>
    </g>
  `;
}

// --------------------------------------------------
// MAZE PANEL
// --------------------------------------------------

function renderMazePanel() {
  return `
    <rect
      x="25"
      y="128"
      width="1150"
      height="270"
      rx="13"
      fill="#080D14"
      stroke="#087FAD"
      stroke-width="1.5"
      filter="url(#cyan-glow)"
      opacity="0.95"
    />

    <rect
      x="${LAYOUT.mazeX}"
      y="${LAYOUT.mazeY}"
      width="${LAYOUT.mazeWidth}"
      height="${LAYOUT.mazeHeight}"
      rx="8"
      fill="#050A11"
      stroke="#12364B"
      stroke-width="1"
    />
  `;
}

// --------------------------------------------------
// WALLS
// --------------------------------------------------

function renderWalls() {
  const segments = getWallSegments();
  const { cellWidth, cellHeight } = getMazeDimensions();

  return segments.map((segment, index) => {
    const x = LAYOUT.mazeX + segment.x * cellWidth;
    const y = LAYOUT.mazeY + segment.y * cellHeight;

    const width = segment.width * cellWidth;
    const height = segment.height * cellHeight;

    return `
      <rect
        x="${x}"
        y="${y}"
        width="${width}"
        height="${height}"
        rx="1.5"
        fill="${MAZE_CONFIG.wallColor}"
        opacity="0.96"
      >
        ${renderWallGlow(index)}
      </rect>
    `;
  }).join("");
}

// --------------------------------------------------
// CONTRIBUTION CELLS
// --------------------------------------------------

function getRouteIndexMap(events) {
  const map = new Map();

  events.route.forEach((point, index) => {
    const id = `${point.x},${point.y}`;

    if (!map.has(id)) map.set(id, index);
  });

  return map;
}

function getContributionCandidates(events) {
  const seen = new Set();

  return events.route.filter((point) => {
    const id = `${point.x},${point.y}`;

    if (seen.has(id)) return false;
    seen.add(id);

    return MAZE_LAYOUT[point.y]?.[point.x] === ".";
  });
}

function renderContributionCells(days, events) {
  const candidates = getContributionCandidates(events);
  const routeIndexes = getRouteIndexMap(events);

  if (!candidates.length) return "";

  // When real contribution data is unavailable, create
  // a deterministic decorative distribution.
  const source = Array.isArray(days) && days.length
    ? days
    : candidates
        .filter((_, index) => index % 3 === 0)
        .map((_, index) => ({
          count: (index * 7 + 3) % 5 + 1,
        }));

  const used = new Set();

  return source.map((day, index) => {
    const count = Number(day.count ?? 0);

    const intensity = Number(
      day.level ??
      day.intensity ??
      (count > 0 ? Math.min(4, count) : 0)
    );

    if (!Number.isFinite(intensity) || intensity <= 0) {
      return "";
    }

    let point;

    const x = Number(day.x ?? day.col);
    const y = Number(day.y ?? day.row);

    if (Number.isInteger(x) && Number.isInteger(y)) {
      point = { x, y };
    } else {
      // Spread the cells through the maze rather than
      // grouping them into one horizontal strip.
      const candidateIndex = Math.floor(
        (index * candidates.length) / source.length
      );

      point = candidates[candidateIndex];
    }

    if (!point || MAZE_LAYOUT[point.y]?.[point.x] !== ".") {
      return "";
    }

    const id = `${point.x},${point.y}`;

    if (used.has(id)) return "";
    used.add(id);

    const routeIndex = routeIndexes.get(id);

    if (routeIndex === undefined) return "";

    const position = cellCenter(point.x, point.y);
    const { cellWidth, cellHeight } = getMazeDimensions();

    const size = Math.min(cellWidth, cellHeight) * 0.58;

    const color = CONTRIBUTION_COLORS[
      Math.min(3, Math.max(0, Math.floor(intensity) - 1))
    ];

    const pickupTime = getPickupTime(routeIndex, events);

    return `
      <rect
        x="${position.x - size / 2}"
        y="${position.y - size / 2}"
        width="${size}"
        height="${size}"
        rx="1"
        fill="${color}"
        filter="url(#green-glow)"
      >
        ${renderCollectiblePickup({
          duration: LAYOUT.cycleDuration,
          pickupTime,
        })}
      </rect>
    `;
  }).join("");
}

// --------------------------------------------------
// NORMAL COINS
// --------------------------------------------------

function renderNormalCoins(events) {
  return events.normalCoins.map((coin) => {
    const position = cellCenter(coin.x, coin.y);
    const pickupTime = getPickupTime(coin.routeIndex, events);

    return `
      <circle
        cx="${position.x}"
        cy="${position.y}"
        r="1.8"
        fill="#FFE58A"
      >
        ${renderCollectiblePickup({
          duration: LAYOUT.cycleDuration,
          pickupTime,
        })}
      </circle>
    `;
  }).join("");
}

// --------------------------------------------------
// SPECIAL COINS
// --------------------------------------------------

function renderSpecialCoins(events) {
  return events.specialCoins.map((coin) => {
    const position = cellCenter(coin.x, coin.y);
    const pickupTime = getPickupTime(coin.routeIndex, events);

    return `
      <g>
        <circle
          cx="${position.x}"
          cy="${position.y}"
          r="5"
          fill="none"
          stroke="#FFD166"
          stroke-width="1"
          opacity="0.75"
        >
          ${renderSpecialCoinGlow()}
        </circle>

        <circle
          cx="${position.x}"
          cy="${position.y}"
          r="2.8"
          fill="#FFD166"
          stroke="#FFF1B8"
          stroke-width="0.6"
        />

        ${renderCollectiblePickup({
          duration: LAYOUT.cycleDuration,
          pickupTime,
        })}
      </g>
    `;
  }).join("");
}

// --------------------------------------------------
// PAC-MAN
// --------------------------------------------------

function renderPacman(events) {
  const route = events.route;

  if (!route || route.length < 2) return "";

  const path = routeToSvgPath(route);
  const keyPoints = getRouteKeyPoints(route);
  const keyTimes = events.speed.keyTimes.join(";");

  const radius = Math.min(
    getMazeDimensions().cellWidth,
    getMazeDimensions().cellHeight
  ) * 0.42;

  const mouthPath = `
    M 0 0
    L ${radius} ${-radius * 0.65}
    A ${radius} ${radius} 0 1 1
    ${radius} ${radius * 0.65}
    Z
  `;

  return `
    <path
      d="${mouthPath}"
      fill="#FFD43B"
      filter="url(#pacman-glow)"
    >
      ${renderPacmanMouth(radius)}

      ${renderPacmanPath({
        path,
        duration: LAYOUT.cycleDuration,
        keyPoints,
        keyTimes,
      })}
    </path>
  `;
}

// --------------------------------------------------
// GHOST SHAPE
// --------------------------------------------------

function renderGhostShape(color, index) {
  return `
    <g>
      <path
        d="
          M -7 7
          L -7 -1
          A 7 7 0 0 1 7 -1
          L 7 7
          L 3.5 4
          L 0 7
          L -3.5 4
          Z
        "
        fill="${color}"
        stroke="#FFFFFF"
        stroke-width="0.45"
        opacity="0.97"
      />

      <ellipse cx="-2.7" cy="-1" rx="2.1" ry="2.6" fill="#FFFFFF"/>
      <ellipse cx="2.7" cy="-1" rx="2.1" ry="2.6" fill="#FFFFFF"/>

      <circle cx="-2.2" cy="-0.8" r="1" fill="#17202B"/>
      <circle cx="3.1" cy="-0.8" r="1" fill="#17202B"/>

      ${renderGhostMovement(index)}
    </g>
  `;
}

// --------------------------------------------------
// GHOSTS
// --------------------------------------------------

function renderGhosts(events) {
  return events.ghosts.map((ghost, index) => {
    const route = ghost.route;

    if (!route || route.length < 2) return "";

    const start = route[0];
    const initial = cellCenter(start.x, start.y);
    const path = routeToSvgPath(route, start);

    const color = GHOST_COLORS[index % GHOST_COLORS.length];

    return `
      <g transform="translate(${initial.x} ${initial.y})">
        ${renderGhostShape(color, index)}

        ${renderGhostEscape({
          path,
          duration: LAYOUT.cycleDuration,
          delay: ghost.delay ?? 0,
        })}
      </g>
    `;
  }).join("");
}

// --------------------------------------------------
// FOOTER
// --------------------------------------------------

function renderFooter() {
  return `
    <g
      font-family="monospace"
      font-size="10"
      letter-spacing="1.4"
    >
      <text x="45" y="430" fill="#00D9FF">
        PAC-MAN // ACTIVE
      </text>

      <text
        x="600"
        y="430"
        text-anchor="middle"
        fill="#657B8C"
      >
        CONTRIBUTION DATA // REAL-TIME VISUALIZATION
      </text>

      <text
        x="1155"
        y="430"
        text-anchor="end"
        fill="#39D353"
      >
        SYSTEM ONLINE
      </text>
    </g>
  `;
}

// --------------------------------------------------
// HUD
// --------------------------------------------------

function renderHud() {
  return `<g>${renderHudParticles()}</g>`;
}

// --------------------------------------------------
// MAIN SVG
// --------------------------------------------------

export function renderPacmanSvg(days = []) {
  const events = createGameEvents(MAZE_LAYOUT);

  const svg = `
    <svg
      xmlns="${SVG_NS}"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      width="${LAYOUT.width}"
      height="${LAYOUT.height}"
      viewBox="0 0 ${LAYOUT.width} ${LAYOUT.height}"
      role="img"
      aria-label="Wheatley06 Pac-Man contribution matrix"
    >
      ${renderBackground()}
      ${renderHeader()}
      ${renderMazePanel()}

      <g clip-path="url(#maze-clip)">
        ${renderWalls()}
        ${renderContributionCells(days, events)}
        ${renderNormalCoins(events)}
        ${renderSpecialCoins(events)}
        ${renderPacman(events)}
        ${renderGhosts(events)}
      </g>

      ${renderHud()}
      ${renderFooter()}
    </svg>
  `;

  return svg.trim();
}

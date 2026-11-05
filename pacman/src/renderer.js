
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
];

const CONTRIBUTION_COLORS = [
  "#0E4429",
  "#006D32",
  "#26A641",
  "#39D353",
];

const SVG_NS = "http://www.w3.org/2000/svg";

// --------------------------------------------------
// UTILITIES
// --------------------------------------------------

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

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

// All game-engine coordinates use x and y.
function cellCenter(x, y) {
  const dimensions = getMazeDimensions();

  return {
    x: LAYOUT.mazeX + (x + 0.5) * dimensions.cellWidth,
    y: LAYOUT.mazeY + (y + 0.5) * dimensions.cellHeight,
  };
}

// --------------------------------------------------
// ROUTE CONVERSION
// --------------------------------------------------

function routeToSvgPath(route, relativeTo = null) {
  if (!Array.isArray(route) || route.length === 0) {
    return "";
  }

  const origin = relativeTo
    ? cellCenter(relativeTo.x, relativeTo.y)
    : null;

  return route.map((point, index) => {
    const position = cellCenter(point.x, point.y);

    const x = origin
      ? position.x - origin.x
      : position.x;

    const y = origin
      ? position.y - origin.y
      : position.y;

    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
}

// Calculate the normalized distance of every route point.
// This allows Pac-Man to spend approximately the same time
// moving between adjacent maze cells.
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

  const totalDistance = distances[distances.length - 1];

  if (totalDistance === 0) {
    return route.map((_, index) =>
      index / (route.length - 1)
    ).join(";");
  }

  return distances.map((distance) =>
    distance / totalDistance
  ).join(";");
}

// --------------------------------------------------
// COLLECTIBLE TIMING
// --------------------------------------------------

function getPickupTime(routeIndex, events) {
  const keyTimes = events.speed?.keyTimes;

  if (!keyTimes || keyTimes.length === 0) {
    return 0;
  }

  const index = Math.max(
    0,
    Math.min(routeIndex, keyTimes.length - 1)
  );

  const normalizedTime = keyTimes[index] ?? 0;

  return normalizedTime * LAYOUT.cycleDuration;
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
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="green-glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="pacman-glow">
        <feGaussianBlur stdDeviation="4" result="blur"/>
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

      <circle
        cx="1150"
        cy="34"
        r="5"
        fill="#39D353"
      >
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
  const dimensions = getMazeDimensions();

  return segments.map((segment, index) => {
    const x =
      LAYOUT.mazeX + segment.x * dimensions.cellWidth;

    const y =
      LAYOUT.mazeY + segment.y * dimensions.cellHeight;

    const width =
      segment.width * dimensions.cellWidth;

    const height =
      segment.height * dimensions.cellHeight;

    return `
      <rect
        x="${x}"
        y="${y}"
        width="${width}"
        height="${height}"
        rx="${MAZE_CONFIG.cornerRadius}"
        fill="none"
        stroke="${MAZE_CONFIG.wallColor}"
        stroke-width="${MAZE_CONFIG.wallThickness}"
        filter="url(#cyan-glow)"
        opacity="0.95"
      >
        ${renderWallGlow(index)}
      </rect>
    `;
  }).join("");
}

// --------------------------------------------------
// CONTRIBUTION CELLS
// --------------------------------------------------

function renderContributionCells(days, events) {
  if (!Array.isArray(days) || days.length === 0) {
    return "";
  }

  const routeIndexByCell = new Map();

  events.route.forEach((point, index) => {
    const cellKey = `${point.x},${point.y}`;

    if (!routeIndexByCell.has(cellKey)) {
      routeIndexByCell.set(cellKey, index);
    }
  });

  const routeCells = [];
  const seen = new Set();

  for (const point of events.route) {
    const cellKey = `${point.x},${point.y}`;

    if (
      !seen.has(cellKey) &&
      MAZE_LAYOUT[point.y]?.[point.x] === "."
    ) {
      seen.add(cellKey);
      routeCells.push(point);
    }
  }

  return days.map((day, index) => {
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

    if (
      Number.isInteger(x) &&
      Number.isInteger(y)
    ) {
      point = { x, y };
    } else {
      point = routeCells[index % Math.max(1, routeCells.length)];
    }

    if (!point || MAZE_LAYOUT[point.y]?.[point.x] !== ".") {
      return "";
    }

    const routeIndex = routeIndexByCell.get(
      `${point.x},${point.y}`
    );

    if (routeIndex === undefined) {
      return "";
    }

    const position = cellCenter(point.x, point.y);

    const size = Math.max(
      3,
      getMazeDimensions().cellWidth * 0.35
    );

    const color = CONTRIBUTION_COLORS[
      Math.min(
        3,
        Math.max(0, Math.floor(intensity) - 1)
      )
    ];

    const pickupTime = getPickupTime(routeIndex, events);

    return `
      <g>
        <rect
          x="${position.x - size / 2}"
          y="${position.y - size / 2}"
          width="${size}"
          height="${size}"
          rx="1"
          fill="${color}"
          opacity="0.95"
          filter="url(#green-glow)"
        >
          ${renderCollectiblePickup({
            duration: LAYOUT.cycleDuration,
            pickupTime,
          })}
        </rect>
      </g>
    `;
  }).join("");
}

// --------------------------------------------------
// NORMAL COINS
// --------------------------------------------------

function renderNormalCoins(events) {
  return events.normalCoins.map((coin) => {
    const position = cellCenter(coin.x, coin.y);

    const pickupTime = getPickupTime(
      coin.routeIndex,
      events
    );

    return `
      <circle
        cx="${position.x}"
        cy="${position.y}"
        r="2.1"
        fill="#FFE58A"
        filter="url(#green-glow)"
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
// DECORATIVE CONTRIBUTION CELLS
// --------------------------------------------------

function renderDecorativeContributionCells(events) {
  const occupied = new Set(
    events.specialCoins.map((coin) =>
      `${coin.x},${coin.y}`
    )
  );

  const seen = new Set();

  const candidates = events.route.filter((point, index) => {
    const cellKey = `${point.x},${point.y}`;

    if (seen.has(cellKey)) return false;

    seen.add(cellKey);

    return (
      index > 0 &&
      !occupied.has(cellKey) &&
      MAZE_LAYOUT[point.y]?.[point.x] === "."
    );
  });

  return candidates.slice(0, 24).map((point, index) => {
    const position = cellCenter(point.x, point.y);

    const routeIndex = events.route.findIndex(
      (routePoint) =>
        routePoint.x === point.x &&
        routePoint.y === point.y
    );

    const size = 5.5;

    const color = CONTRIBUTION_COLORS[
      index % CONTRIBUTION_COLORS.length
    ];

    const pickupTime = getPickupTime(
      routeIndex,
      events
    );

    return `
      <rect
        x="${position.x - size / 2}"
        y="${position.y - size / 2}"
        width="${size}"
        height="${size}"
        rx="1"
        fill="${color}"
        opacity="0.95"
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
// SPECIAL COINS
// --------------------------------------------------

function renderSpecialCoins(events) {
  return events.specialCoins.map((coin) => {
    const position = cellCenter(coin.x, coin.y);

    const pickupTime = getPickupTime(
      coin.routeIndex,
      events
    );

    return `
      <g>
        <g>
          <circle
            cx="${position.x}"
            cy="${position.y}"
            r="6"
            fill="none"
            stroke="#FFD166"
            stroke-width="1"
            opacity="0.7"
          >
            ${renderSpecialCoinGlow()}
          </circle>

          <circle
            cx="${position.x}"
            cy="${position.y}"
            r="3.1"
            fill="#FFD166"
            stroke="#FFF1B8"
            stroke-width="0.7"
          />
        </g>

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

  if (!route || route.length < 2) {
    return "";
  }

  // Convert the actual game-engine route into an SVG path.
  const path = routeToSvgPath(route);

  const keyPoints = getRouteKeyPoints(route);

  const keyTimes = events.speed.keyTimes.join(";");

  const mouthRadius = 10;

  const mouthPath = `
    M 0 0
    L ${mouthRadius} ${-mouthRadius * 0.65}
    A ${mouthRadius} ${mouthRadius} 0 1 1
    ${mouthRadius} ${mouthRadius * 0.65}
    Z
  `;

  return `
    <g filter="url(#pacman-glow)">

      <path
        d="${mouthPath}"
        fill="#FFD43B"
      >
        ${renderPacmanMouth(mouthRadius)}

        ${renderPacmanPath({
          path,
          duration: LAYOUT.cycleDuration,
          keyPoints,
          keyTimes,
        })}
      </path>

    </g>
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
          M -8 7
          L -8 -1
          A 8 8 0 0 1 8 -1
          L 8 7
          L 4 4
          L 0 7
          L -4 4
          Z
        "
        fill="${color}"
        stroke="#FFFFFF"
        stroke-width="0.55"
        opacity="0.96"
      />

      <ellipse
        cx="-3"
        cy="-1"
        rx="2.5"
        ry="3"
        fill="#FFFFFF"
      />

      <ellipse
        cx="3"
        cy="-1"
        rx="2.5"
        ry="3"
        fill="#FFFFFF"
      />

      <circle
        cx="-2.5"
        cy="-1"
        r="1.2"
        fill="#17202B"
      />

      <circle
        cx="3.5"
        cy="-1"
        r="1.2"
        fill="#17202B"
      />

      ${renderGhostMovement(index)}

    </g>
  `;
}

// --------------------------------------------------
// GHOSTS
// --------------------------------------------------

function renderGhosts(events) {
  return events.ghosts.map((ghost, index) => {
    const ghostRoute = ghost.route;

    if (!ghostRoute || ghostRoute.length < 2) {
      return "";
    }

    const start = ghostRoute[0];

    const initialPosition = cellCenter(
      start.x,
      start.y
    );

    // Ghost paths use coordinates relative to their
    // initial position so they remain stationary
    // until their individual animation delay starts.
    const path = routeToSvgPath(
      ghostRoute,
      start
    );

    const color = GHOST_COLORS[
      index % GHOST_COLORS.length
    ];

    return `
      <g
        transform="translate(
          ${initialPosition.x}
          ${initialPosition.y}
        )"
      >

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

      <text
        x="45"
        y="430"
        fill="#00D9FF"
      >
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
  return `
    <g>
      ${renderHudParticles()}
    </g>
  `;
}

// --------------------------------------------------
// MAIN SVG RENDERER
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

        ${renderDecorativeContributionCells(events)}

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

/** WHEATLEY06 — PAC-MAN CYBERPUNK SVG renderer. */

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
  renderGhostVisibility,
  renderGhostExplosion,
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
  "#39D9A8",
  "#F06BFF",
  "#8AB4FF",
];

const CONTRIBUTION_COLORS = [
  "#0E4429",
  "#006D32",
  "#26A641",
  "#39D353",
];

const SVG_NS = "http://www.w3.org/2000/svg";

// --------------------------------------------------
// MAZE METRICS
// --------------------------------------------------

function mazeMetrics() {
  const cell = Math.min(
    LAYOUT.mazeWidth / MAZE_CONFIG.columns,
    LAYOUT.mazeHeight / MAZE_CONFIG.rows
  );

  const width = cell * MAZE_CONFIG.columns;
  const height = cell * MAZE_CONFIG.rows;

  return {
    cell,

    originX:
      LAYOUT.mazeX +
      (LAYOUT.mazeWidth - width) / 2,

    originY:
      LAYOUT.mazeY +
      (LAYOUT.mazeHeight - height) / 2,
  };
}

function cellCenter(x, y) {
  const metrics = mazeMetrics();

  return {
    x: metrics.originX + (x + 0.5) * metrics.cell,
    y: metrics.originY + (y + 0.5) * metrics.cell,
  };
}

// --------------------------------------------------
// SVG PATH
// --------------------------------------------------

function routeToSvgPath(route, relativeTo = null) {
  if (!Array.isArray(route) || !route.length) {
    return "";
  }

  const origin = relativeTo
    ? cellCenter(relativeTo.x, relativeTo.y)
    : { x: 0, y: 0 };

  return route
    .map((point, index) => {
      const position = cellCenter(point.x, point.y);

      return `${index ? "L" : "M"} ${
        (position.x - origin.x).toFixed(2)
      } ${
        (position.y - origin.y).toFixed(2)
      }`;
    })
    .join(" ");
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
        <feGaussianBlur stdDeviation="2.2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="green-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="pacman-glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
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
      >
        SYSTEM // CONTRIBUTION MATRIX
      </text>

      <text
        x="45"
        y="76"
        fill="#E6EDF3"
        font-size="27"
        font-weight="bold"
        letter-spacing="3"
      >
        WHEATLEY06
      </text>

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
      >
        ONLINE
      </text>

      <text
        x="45"
        y="116"
        fill="#00D9FF"
        font-size="12"
        letter-spacing="3"
      >
        PAC-MAN CONTRIBUTIONS
      </text>

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
  const metrics = mazeMetrics();

  const path = getWallSegments(MAZE_LAYOUT)
    .map((edge) => {
      const x1 = metrics.originX + edge.x1 * metrics.cell;
      const y1 = metrics.originY + edge.y1 * metrics.cell;
      const x2 = metrics.originX + edge.x2 * metrics.cell;
      const y2 = metrics.originY + edge.y2 * metrics.cell;

      return `
        M ${x1.toFixed(2)} ${y1.toFixed(2)}
        L ${x2.toFixed(2)} ${y2.toFixed(2)}
      `;
    })
    .join(" ");

  return `
    <path
      d="${path}"
      fill="none"
      stroke="${MAZE_CONFIG.wallColor}"
      stroke-width="${MAZE_CONFIG.wallThickness}"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#cyan-glow)"
    >
      ${renderWallGlow(0)}
    </path>
  `;
}

// --------------------------------------------------
// CONTRIBUTION CELLS
// --------------------------------------------------

function contributionPositions(days, events) {
  const occupied = new Set(
    [
      ...events.normalCoins,
      ...events.specialCoins,
    ].map((point) => `${point.x},${point.y}`)
  );

  const cells = [];

  MAZE_LAYOUT.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (
        cell === "." &&
        !occupied.has(`${x},${y}`)
      ) {
        cells.push({ x, y });
      }
    });
  });

  // Deterministic distribution across the maze.
  for (let i = cells.length - 1; i > 0; i--) {
    const j = (i * 37 + 11) % (i + 1);

    [cells[i], cells[j]] = [
      cells[j],
      cells[i],
    ];
  }

  const source = Array.isArray(days) ? days : [];

  const count = Math.min(
    source.length || 32,
    cells.length
  );

  return cells.slice(0, count).map((point, index) => ({
    ...point,

    intensity: source.length
      ? Number(
          source[index]?.level ??
          source[index]?.intensity ??
          (
            source[index]?.count > 0
              ? Math.min(4, source[index].count)
              : 1
          )
        )
      : 1 + (index % 4),
  }));
}

function renderContributionCells(days, events) {
  const metrics = mazeMetrics();

  return contributionPositions(days, events)
    .map((point) => {
      const position = cellCenter(point.x, point.y);

      const level = Math.max(
        1,
        Math.min(4, Math.floor(point.intensity) || 1)
      );

      const size = metrics.cell * 0.42;
      const color = CONTRIBUTION_COLORS[level - 1];

      const index = events.route.findIndex(
        (routePoint) =>
          routePoint.x === point.x &&
          routePoint.y === point.y
      );

      const pickupTime = Math.max(0, index) * 0.42;

      return `
        <rect
          x="${position.x - size / 2}"
          y="${position.y - size / 2}"
          width="${size}"
          height="${size}"
          rx="1.2"
          fill="${color}"
          opacity="0.95"
          filter="url(#green-glow)"
        >
          ${renderCollectiblePickup({
            duration: events.speed.duration,
            pickupTime,
          })}
        </rect>
      `;
    })
    .join("");
}

// --------------------------------------------------
// NORMAL COINS
// --------------------------------------------------

function renderNormalCoins(events) {
  return events.normalCoins.map((coin) => {
    const position = cellCenter(coin.x, coin.y);
    const pickupTime = Math.max(0, coin.routeIndex) * 0.42;

    return `
      <circle
        cx="${position.x}"
        cy="${position.y}"
        r="1.65"
        fill="#FFE58A"
      >
        ${renderCollectiblePickup({
          duration: events.speed.duration,
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
    const pickupTime = Math.max(0, coin.routeIndex) * 0.42;

    return `
      <g>
        ${renderCollectiblePickup({
          duration: events.speed.duration,
          pickupTime,
        })}

        <circle
          cx="${position.x}"
          cy="${position.y}"
          r="5.2"
          fill="none"
          stroke="#FFD166"
          stroke-width="1"
        >
          ${renderSpecialCoinGlow()}
        </circle>

        <circle
          cx="${position.x}"
          cy="${position.y}"
          r="2.6"
          fill="#FFD166"
          stroke="#FFF1B8"
          stroke-width="0.6"
        />
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

  const start = route[0];
  const position = cellCenter(start.x, start.y);

  const path = routeToSvgPath(route, start);

  const radius = mazeMetrics().cell * 0.43;

  const mouth = `
    M 0 0
    L ${radius} ${-radius * 0.62}
    A ${radius} ${radius} 0 1 1
    ${radius} ${radius * 0.62}
    Z
  `;

  return `
    <g
      transform="translate(${position.x} ${position.y})"
      filter="url(#pacman-glow)"
    >

      <path
        d="${mouth}"
        fill="#FFD43B"
      >
        ${renderPacmanMouth(radius)}

        ${renderPacmanPath({
          path,
          duration: events.speed.duration,
        })}
      </path>

    </g>
  `;
}

// --------------------------------------------------
// GHOST SHAPE
// --------------------------------------------------

function renderGhostShape(color) {
  return `
    <g>

      <path
        d="
          M -7 7
          L -7 -1
          A 7 7 0 0 1 7 -1
          L 7 7
          L 3.5 4.5
          L 0 7
          L -3.5 4.5
          Z
        "
        fill="${color}"
        stroke="#FFFFFF"
        stroke-width="0.45"
        opacity="0.97"
      />

      <ellipse
        cx="-2.6"
        cy="-1"
        rx="2.1"
        ry="2.7"
        fill="#FFFFFF"
      />

      <ellipse
        cx="2.6"
        cy="-1"
        rx="2.1"
        ry="2.7"
        fill="#FFFFFF"
      />

      <circle
        cx="-2.1"
        cy="-1"
        r="1"
        fill="#17202B"
      />

      <circle
        cx="3.1"
        cy="-1"
        r="1"
        fill="#17202B"
      />

      ${renderGhostMovement()}

    </g>
  `;
}

// --------------------------------------------------
// GHOSTS
// --------------------------------------------------

function renderGhosts(events) {
  return events.ghosts.map((ghost, index) => {
    const route = ghost.route;

    if (!route || route.length < 2) {
      return "";
    }

    const start = route[0];
    const position = cellCenter(start.x, start.y);

    const path = routeToSvgPath(route, start);

    const color = GHOST_COLORS[
      index % GHOST_COLORS.length
    ];

    return `
      <g
        transform="translate(${position.x} ${position.y})"
      >

        ${renderGhostShape(color)}

        ${renderGhostEscape({
          path,
          duration: events.speed.duration,
          delay: 0,
        })}

        ${renderGhostVisibility(
          ghost.collision,
          events.speed.duration
        )}

      </g>
    `;
  }).join("");
}

// --------------------------------------------------
// GHOST EXPLOSIONS
// --------------------------------------------------

function renderGhostExplosions(events) {
  return events.ghosts
    .filter((ghost) => ghost.collision)
    .map((ghost) => {
      const collision = ghost.collision;

      const position = cellCenter(
        collision.position.x,
        collision.position.y
      );

      const color = GHOST_COLORS[
        ghost.id % GHOST_COLORS.length
      ];

      return renderGhostExplosion({
        x: position.x,
        y: position.y,
        fraction: collision.fraction,
        duration: events.speed.duration,
        color,
      });
    })
    .join("");
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
// MAIN SVG RENDERER
// --------------------------------------------------

export function renderPacmanSvg(days = []) {
  const events = createGameEvents(MAZE_LAYOUT);

  return `
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

        ${renderGhostExplosions(events)}

      </g>

      <g>
        ${renderHudParticles()}
      </g>

      ${renderFooter()}

    </svg>
  `.trim();
}

// --------------------------------------------------
// MAIN SVG RENDERER
// --------------------------------------------------


export function renderPacmanSvg({ contributions = [] } = {}) {
  const days = Array.isArray(contributions)
    ? contributions
    : contributions?.days ?? [];

  const events = createGameEvents(MAZE_LAYOUT);

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      width="1200"
      height="480"
      viewBox="0 0 1200 480"
      role="img"
      aria-label="Wheatley06 Pac-Man contribution matrix"
    >
      ${renderDefinitions()}
      ${renderBackground()}
      ${renderPanel()}
      ${renderHeader()}
      ${renderMazeLabels(events, days)}

      <g clip-path="url(#mazeClip)">
        ${renderMazeFloor()}
        ${renderWalls()}
        ${renderContributionCells(days, events)}
        ${renderNormalCoins(events)}
        ${renderSpecialCoins(events)}
        ${renderPacman(events)}
        ${renderGhosts(events)}
        ${renderGhostExplosions(events)}
      </g>

      ${renderHudParticles()}
      ${renderFooter()}
    </svg>
  `.trim();
}

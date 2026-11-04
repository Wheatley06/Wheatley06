
import { MAZE_CONFIG, MAZE_LAYOUT, getMazeEntities, getWallSegments } from "./maze.js";
import { GAME_CONFIG, createGameEvents } from "./game-engine.js";
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
import { COLORS, EFFECTS } from "./config.js";

const LAYOUT = {
  width: 1200,
  height: 480,
  mazeX: 45,
  mazeY: 145,
  mazeWidth: 1110,
  mazeHeight: 230,
  cycleDuration: 90,
};

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

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cellCenter(row, col) {
  const dimensions = getMazeDimensions();

  return {
    x: LAYOUT.mazeX + (col + 0.5) * dimensions.cellWidth,
    y: LAYOUT.mazeY + (row + 0.5) * dimensions.cellHeight,
  };
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

function getRoutePosition(route, routeIndex) {
  if (!route || route.length === 0) return null;

  const index = Math.max(
    0,
    Math.min(routeIndex, route.length - 1)
  );

  const point = route[index];

  return cellCenter(point.row, point.col);
}

function getPickupTime(routeIndex, events) {
  const keyTimes = events.speed.keyTimes;

  if (!keyTimes || keyTimes.length === 0) return 0;

  const normalizedTime = keyTimes[
    Math.min(routeIndex, keyTimes.length - 1)
  ];

  return normalizedTime * LAYOUT.cycleDuration;
}

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

function renderWalls() {
  const segments = getWallSegments();

  return segments.map((segment, index) => {
    const x = LAYOUT.mazeX + segment.x * getMazeDimensions().cellWidth;
    const y = LAYOUT.mazeY + segment.y * getMazeDimensions().cellHeight;
    const width = segment.width * getMazeDimensions().cellWidth;
    const height = segment.height * getMazeDimensions().cellHeight;

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

function renderContributionCells(days, events) {
  if (!Array.isArray(days)) return "";

  const routeIndexByCell = new Map();

  events.route.forEach((point, index) => {
    const key = `${point.row},${point.col}`;

    if (!routeIndexByCell.has(key)) {
      routeIndexByCell.set(key, index);
    }
  });

  return days.map((day, index) => {
    const intensity = Number(day.level ?? day.intensity ?? 0);

    if (intensity <= 0) return "";

    const point = events.route.find((routePoint) => {
      return routePoint.row === day.row && routePoint.col === day.col;
    });

    if (!point) return "";

    const routeIndex = routeIndexByCell.get(
      `${point.row},${point.col}`
    );

    if (routeIndex === undefined) return "";

    const position = cellCenter(point.row, point.col);
    const size = Math.max(3, getMazeDimensions().cellWidth * 0.35);
    const color = CONTRIBUTION_COLORS[
      Math.min(3, Math.max(0, intensity - 1))
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

function renderNormalCoins(events) {
  return events.normalCoins.map((coin) => {
    const position = cellCenter(coin.row, coin.col);
    const pickupTime = getPickupTime(coin.routeIndex, events);

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

function renderDecorativeContributionCells(events) {
  const occupied = new Set(
    events.specialCoins.map((coin) => `${coin.row},${coin.col}`)
  );

  const candidates = events.route.filter((point, index) => {
    const key = `${point.row},${point.col}`;

    return (
      index > 0 &&
      index % 3 === 0 &&
      !occupied.has(key) &&
      MAZE_LAYOUT[point.row][point.col] === "."
    );
  });

  return candidates.slice(0, 24).map((point, index) => {
    const position = cellCenter(point.row, point.col);
    const routeIndex = events.route.findIndex((routePoint) => {
      return routePoint.row === point.row &&
        routePoint.col === point.col;
    });

    const size = 5.5;
    const color = CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length];
    const pickupTime = getPickupTime(routeIndex, events);

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

function renderSpecialCoins(events) {
  return events.specialCoins.map((coin, index) => {
    const position = cellCenter(coin.row, coin.col);
    const pickupTime = getPickupTime(coin.routeIndex, events);

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

        <animate
          attributeName="opacity"
          values="1;1;0;0;1"
          keyTimes="0;${Math.max(
            0,
            Math.min(1, pickupTime / LAYOUT.cycleDuration)
          )};${Math.max(
            0,
            Math.min(1, pickupTime / LAYOUT.cycleDuration)
          )};0.99;1"
          dur="${LAYOUT.cycleDuration}s"
          repeatCount="indefinite"
        />
      </g>
    `;
  }).join("");
}

function renderPacman(events) {
  const route = events.route;

  if (!route || route.length < 2) return "";

  const path = events.pacmanPath;
  const keyPoints = route.map((_, index) => {
    return index / (route.length - 1);
  }).join(";");

  const keyTimes = events.speed.keyTimes.join(";");

  const first = cellCenter(route[0].row, route[0].col);

  return `
    <g filter="url(#pacman-glow)">
      <circle
        cx="${first.x}"
        cy="${first.y}"
        r="10"
        fill="#FFD43B"
      >
        ${renderPacmanPath({
          path,
          duration: LAYOUT.cycleDuration,
          keyPoints,
          keyTimes,
        })}
        ${renderPacmanMouth(10)}
      </circle>
    </g>
  `;
}

function renderGhostShape(position, color, index) {
  const x = position.x;
  const y = position.y;

  return `
    <g transform="translate(${x} ${y})">
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

      <ellipse cx="-3" cy="-1" rx="2.5" ry="3" fill="#FFFFFF"/>
      <ellipse cx="3" cy="-1" rx="2.5" ry="3" fill="#FFFFFF"/>

      <circle cx="-2.5" cy="-1" r="1.2" fill="#17202B"/>
      <circle cx="3.5" cy="-1" r="1.2" fill="#17202B"/>

      ${renderGhostMovement(index)}
    </g>
  `;
}

function renderGhosts(events) {
  return events.ghosts.map((ghost, index) => {
    const ghostRoute = ghost.route;

    if (!ghostRoute || ghostRoute.length < 2) return "";

    const path = ghost.path;

    const initialPosition = cellCenter(
      ghostRoute[0].row,
      ghostRoute[0].col
    );

    const color = GHOST_COLORS[index % GHOST_COLORS.length];

    return `
      <g>
        ${renderGhostShape(initialPosition, color, index)}
        ${renderGhostEscape({
          path,
          duration: LAYOUT.cycleDuration,
          delay: ghost.delay ?? 0,
        })}
      </g>
    `;
  }).join("");
}

function renderFooter() {
  return `
    <g font-family="monospace" font-size="10" letter-spacing="1.4">
      <text x="45" y="430" fill="#00D9FF">
        PAC-MAN // ACTIVE
      </text>

      <text x="600" y="430" text-anchor="middle" fill="#657B8C">
        CONTRIBUTION DATA // REAL-TIME VISUALIZATION
      </text>

      <text x="1155" y="430" text-anchor="end" fill="#39D353">
        SYSTEM ONLINE
      </text>
    </g>
  `;
}

function renderHud(events) {
  return `
    <g>
      ${renderHudParticles()}
    </g>
  `;
}

export function renderPacmanSvg(days = []) {
  const events = createGameEvents();

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
        ${renderDecorativeContributionCells(events)}
        ${renderSpecialCoins(events)}
        ${renderPacman(events)}
        ${renderGhosts(events)}
      </g>

      ${renderHud(events)}
      ${renderFooter()}
    </svg>
  `;
}

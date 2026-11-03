
/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * Complete visual renderer.
 *
 * Contributions are embedded in maze corridors.
 * Movement is precomputed and rendered with SVG SMIL.
 */

import {
  MAZE_LAYOUT,
  getMazeEntities,
  getMazeDimensions,
  getWallSegments,
} from "./maze.js";

import {
  PROFILE,
  COLORS,
  CANVAS,
  EFFECTS,
  getContributionColor,
} from "./config.js";

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

import {
  createGameEvents,
  toSvgPath,
} from "./game-engine.js";

// --------------------------------------------------
// LAYOUT
// --------------------------------------------------

const SVG_NS = "http://www.w3.org/2000/svg";

const LAYOUT = {
  width: CANVAS.width,
  height: CANVAS.height,

  mazeX: 45,
  mazeY: 145,
  mazeWidth: 1110,
  mazeHeight: 230,

  panelX: 25,
  panelY: 115,
  panelWidth: 1150,
  panelHeight: 290,

  cycleDuration: 90,
};

const MAZE_STYLE = {
  wall: COLORS.cyan,
  pellet: "#C8F8FF",
  floor: "#0D1724",
};

const GHOST_COLORS = [
  COLORS.cyan,
  COLORS.purple,
  COLORS.magenta,
  "#FF5C8A",
  "#35E6A5",
];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCellSize() {
  const { columns, rows } = getMazeDimensions(MAZE_LAYOUT);

  return {
    columns,
    rows,
    cellWidth: LAYOUT.mazeWidth / columns,
    cellHeight: LAYOUT.mazeHeight / rows,
  };
}

function getCellCenter(position) {
  const { cellWidth, cellHeight } = getCellSize();

  return {
    x: position.x * cellWidth + cellWidth / 2,
    y: position.y * cellHeight + cellHeight / 2,
  };
}

function getContributionStats(days) {
  const counts = days.map((day) =>
    Math.max(0, Number(day.count) || 0)
  );

  return {
    total: counts.reduce((sum, count) => sum + count, 0),
    max: Math.max(1, ...counts),
  };
}

function getContributionPlacements(days, events) {
  const corridors = [];

  MAZE_LAYOUT.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === ".") corridors.push({ x, y });
    });
  });

  if (!days.length || !corridors.length) return [];

  const visibleDays = days.slice(-corridors.length);
  const { max } = getContributionStats(visibleDays);

  return visibleDays.map((day, index) => {
    const corridorIndex = Math.floor(
      index * corridors.length / visibleDays.length
    );

    const position = corridors[corridorIndex];
    const count = Math.max(0, Number(day.count) || 0);

    return {
      ...position,
      date: day.date ?? "",
      count,
      color: getContributionColor(count, max),
      intensity: count === 0 ? 0.15 : clamp(count / max, 0.25, 1),
    };
  });
}

function getRoutePickupTime(routeIndex, routeLength) {
  if (routeIndex < 0 || routeLength <= 1) return null;

  return (
    routeIndex /
    (routeLength - 1) *
    LAYOUT.cycleDuration
  );
}

// --------------------------------------------------
// SVG DEFINITIONS
// --------------------------------------------------

function renderDefinitions() {
  return `
    <defs>
      <linearGradient id="panelGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#12243A"/>
        <stop offset="55%" stop-color="#0B1728"/>
        <stop offset="100%" stop-color="#101020"/>
      </linearGradient>

      <linearGradient id="headerGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${COLORS.cyan}" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="${COLORS.blue}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${COLORS.magenta}" stop-opacity="0.8"/>
      </linearGradient>

      <linearGradient id="wallGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${COLORS.cyan}"/>
        <stop offset="100%" stop-color="${COLORS.blue}"/>
      </linearGradient>

      <radialGradient id="backgroundGlow">
        <stop offset="0%" stop-color="${COLORS.blue}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${COLORS.background}" stop-opacity="0"/>
      </radialGradient>

      <filter id="neonGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="strongGlow" x="-150%" y="-150%" width="400%" height="400%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <pattern id="circuitGrid" width="32" height="32"
        patternUnits="userSpaceOnUse">
        <path d="M32 0H0V32" fill="none"
          stroke="${COLORS.cyan}" stroke-opacity="0.07" stroke-width="1"/>
        <circle cx="0" cy="0" r="1.5"
          fill="${COLORS.cyan}" opacity="0.2"/>
      </pattern>

      <clipPath id="mazeClip">
        <rect x="0" y="0"
          width="${LAYOUT.mazeWidth}"
          height="${LAYOUT.mazeHeight}"/>
      </clipPath>
    </defs>
  `;
}

// --------------------------------------------------
// BACKGROUND AND HUD
// --------------------------------------------------

function renderBackground() {
  return `
    <rect width="${LAYOUT.width}" height="${LAYOUT.height}"
      fill="${COLORS.background}"/>

    <rect width="${LAYOUT.width}" height="${LAYOUT.height}"
      fill="url(#circuitGrid)"/>

    <ellipse cx="600" cy="240" rx="570" ry="300"
      fill="url(#backgroundGlow)"/>

    <path d="M0 90H1200 M0 420H1200"
      stroke="${COLORS.cyan}" stroke-opacity="0.15"/>

    <path d="M25 25H160L180 45H300
      M900 25H1040L1060 45H1175"
      fill="none" stroke="${COLORS.cyan}"
      stroke-opacity="0.35" stroke-width="1.5"/>
  `;
}

function renderHeader() {
  return `
    <g font-family="monospace">
      <text x="36" y="48" fill="${COLORS.cyan}"
        font-size="13" letter-spacing="4">
        SYSTEM // CONTRIBUTION MATRIX
      </text>

      <text x="36" y="78" fill="#FFFFFF"
        font-size="27" font-weight="bold" letter-spacing="3">
        ${escapeXml(PROFILE.name)}
      </text>

      <text x="1160" y="48" text-anchor="end"
        fill="${COLORS.teal}" font-size="12" letter-spacing="2">
        ● ONLINE
      </text>

      <text x="1160" y="75" text-anchor="end"
        fill="#8299B5" font-size="10" letter-spacing="2">
        ${escapeXml(PROFILE.title)}
      </text>

      <rect x="35" y="98" width="1130" height="2"
        fill="url(#headerGradient)"/>
    </g>
  `;
}

function renderPanel() {
  return `
    <rect x="${LAYOUT.panelX}" y="${LAYOUT.panelY}"
      width="${LAYOUT.panelWidth}" height="${LAYOUT.panelHeight}"
      rx="12" fill="url(#panelGradient)"
      stroke="${COLORS.cyan}" stroke-opacity="0.45"
      stroke-width="1.5"/>

    <path d="M45 135H170 M1030 135H1155
      M45 385H170 M1030 385H1155"
      fill="none" stroke="${COLORS.cyan}"
      stroke-opacity="0.5" stroke-width="2"/>

    <path d="M25 155V135Q25 115 45 115
      M1155 115Q1175 115 1175 135V155
      M25 365V385Q25 405 45 405
      M1155 405Q1175 405 1175 385V365"
      fill="none" stroke="${COLORS.cyan}"
      stroke-width="1.5" opacity="0.7"/>
  `;
}

// --------------------------------------------------
// MAZE FLOOR AND WALLS
// --------------------------------------------------

function renderMazeFloor() {
  const { columns, rows, cellWidth, cellHeight } = getCellSize();
  let output = "";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if (MAZE_LAYOUT[y][x] === "#") continue;

      output += `
        <rect
          x="${x * cellWidth}"
          y="${y * cellHeight}"
          width="${cellWidth}"
          height="${cellHeight}"
          fill="${MAZE_STYLE.floor}"
          opacity="0.65"
        />
      `;
    }
  }

  return output;
}

function renderMazeWalls() {
  const { cellWidth, cellHeight } = getCellSize();
  const walls = getWallSegments(MAZE_LAYOUT);

  return walls.map((wall, index) => `
    <rect
      x="${wall.x * cellWidth + 1}"
      y="${wall.y * cellHeight + 1}"
      width="${cellWidth - 2}"
      height="${cellHeight - 2}"
      rx="3"
      fill="url(#wallGradient)"
      fill-opacity="0.16"
      stroke="${MAZE_STYLE.wall}"
      stroke-width="1.3"
      filter="url(#neonGlow)"
    >
      ${EFFECTS.animatedWalls ? renderWallGlow(index) : ""}
    </rect>
  `).join("");
}

// --------------------------------------------------
// CONTRIBUTIONS INSIDE CORRIDORS
// --------------------------------------------------

function renderContributionCells(days, events) {
  const placements = getContributionPlacements(days, events);
  const { cellWidth, cellHeight } = getCellSize();

  return placements.map((item) => {
    const pickupTime = getRoutePickupTime(
      events.route.findIndex(
        (position) => position.x === item.x && position.y === item.y
      ),
      events.route.length
    );

    const x = item.x * cellWidth + cellWidth * 0.18;
    const y = item.y * cellHeight + cellHeight * 0.18;
    const size = Math.min(cellWidth, cellHeight) * 0.64;

    return `
      <g opacity="${item.intensity}">
        <title>${escapeXml(item.date)}: ${item.count} contributions</title>

        <rect
          x="${x}" y="${y}"
          width="${size}" height="${size}"
          rx="2"
          fill="${item.color}"
          stroke="#7CFF9B"
          stroke-opacity="0.25"
          stroke-width="0.6"
        />

        ${pickupTime !== null
          ? renderCollectiblePickup({
              duration: LAYOUT.cycleDuration,
              pickupTime,
            })
          : ""}
      </g>
    `;
  }).join("");
}

// --------------------------------------------------
// NORMAL AND SPECIAL COINS
// --------------------------------------------------

function renderNormalCoins(events) {
  const { cellWidth, cellHeight } = getCellSize();

  return events.normalCoins.map((coin) => {
    const center = getCellCenter(coin);
    const pickupTime = getRoutePickupTime(
      coin.routeIndex,
      events.route.length
    );

    return `
      <g>
        <circle
          cx="${center.x}"
          cy="${center.y}"
          r="1.65"
          fill="${MAZE_STYLE.pellet}"
          filter="url(#neonGlow)"
        >
          ${pickupTime !== null
            ? renderCollectiblePickup({
                duration: LAYOUT.cycleDuration,
                pickupTime,
              })
            : ""}
        </circle>
      </g>
    `;
  }).join("");
}

function renderSpecialCoins(events) {
  return events.specialCoins.map((coin, index) => {
    const center = getCellCenter(coin);
    const pickupTime = getRoutePickupTime(
      coin.routeIndex,
      events.route.length
    );

    return `
      <g transform="translate(${center.x} ${center.y})">
        <circle
          r="3"
          fill="${COLORS.pacman}"
          stroke="${COLORS.cyan}"
          stroke-width="1"
          filter="url(#strongGlow)"
        >
          ${renderSpecialCoinGlow()}

          ${pickupTime !== null
            ? renderCollectiblePickup({
                duration: LAYOUT.cycleDuration,
                pickupTime,
              })
            : ""}
        </circle>

        <circle r="5.2" fill="none"
          stroke="${COLORS.pacman}"
          stroke-opacity="0.35">
          <animate
            attributeName="r"
            values="4;7;4"
            dur="1.2s"
            begin="${index * 0.2}s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    `;
  }).join("");
}

// --------------------------------------------------
// PAC-MAN
// --------------------------------------------------

function renderPacman(events) {
  const entities = getMazeEntities(MAZE_LAYOUT);
  if (!entities.pacman) return "";

  const { cellWidth, cellHeight } = getCellSize();
  const radius = Math.min(cellWidth, cellHeight) * 0.42;

  const path = toSvgPath(
    events.route,
    cellWidth,
    cellHeight
  );

  return `
    <g filter="url(#strongGlow)">
      <g>
        ${renderPacmanPath({
          path,
          duration: LAYOUT.cycleDuration,
        })}

        <circle r="${radius}" fill="${COLORS.pacman}"/>

        <path
          d="M0 0 L${radius} ${-radius * 0.65}
            A${radius} ${radius} 0 1 0 ${radius} ${radius * 0.65} Z"
          fill="${COLORS.background}"
        >
          ${renderPacmanMouth(radius)}
        </path>

        <circle
          cx="${radius * 0.12}"
          cy="${-radius * 0.48}"
          r="${radius * 0.09}"
          fill="#1A1A1A"
        />
      </g>
    </g>
  `;
}

// --------------------------------------------------
// GHOSTS — ORIGINAL CHARACTER DESIGN
// --------------------------------------------------

function renderGhostShape(color, index) {
  const { cellWidth, cellHeight } = getCellSize();
  const radius = Math.min(cellWidth, cellHeight) * 0.4;

  return `
    <g filter="url(#neonGlow)">
      <g>
        <path
          d="
            M ${-radius} ${radius * 0.8}
            L ${-radius} 0
            A ${radius} ${radius} 0 0 1 ${radius} 0
            L ${radius} ${radius * 0.8}
            L ${radius * 0.5} ${radius * 0.55}
            L 0 ${radius * 0.85}
            L ${-radius * 0.5} ${radius * 0.55}
            Z
          "
          fill="${color}"
          stroke="#FFFFFF"
          stroke-opacity="0.35"
          stroke-width="0.7"
        />

        <ellipse cx="${-radius * 0.32}" cy="0"
          rx="${radius * 0.2}" ry="${radius * 0.25}"
          fill="#FFFFFF"/>

        <ellipse cx="${radius * 0.32}" cy="0"
          rx="${radius * 0.2}" ry="${radius * 0.25}"
          fill="#FFFFFF"/>

        <circle cx="${-radius * 0.27}" cy="0"
          r="${radius * 0.09}" fill="#132238"/>

        <circle cx="${radius * 0.37}" cy="0"
          r="${radius * 0.09}" fill="#132238"/>
      </g>

      ${EFFECTS.glow ? renderGhostMovement(index) : ""}
    </g>
  `;
}

function renderGhosts(events) {
  const { cellWidth, cellHeight } = getCellSize();

  return events.ghosts.map((ghost, index) => {
    const path = toSvgPath(
      ghost.route,
      cellWidth,
      cellHeight
    );

    const color = GHOST_COLORS[index];

    return `
      <g>
        ${renderGhostEscape({
          path,
          duration: 36 + index * 3,
          delay: ghost.delay,
        })}

        ${renderGhostShape(color, index)}
      </g>
    `;
  }).join("");
}

// --------------------------------------------------
// STATUS AND FOOTER
// --------------------------------------------------

function renderMazeLabels(events, days) {
  const { total } = getContributionStats(days);

  return `
    <g font-family="monospace">
      <text x="45" y="135" fill="${COLORS.cyan}"
        font-size="9" letter-spacing="1.5">
        NEON MAZE // ${events.route.length} MOVEMENT NODES
      </text>

      <text x="1155" y="135" text-anchor="end"
        fill="${COLORS.teal}" font-size="9" letter-spacing="1.5">
        ${total.toLocaleString("en-US")} CONTRIBUTIONS
      </text>
    </g>
  `;
}

function renderFooter() {
  return `
    <g font-family="monospace">
      <text x="36" y="445"
        fill="${COLORS.cyan}" font-size="10"
        letter-spacing="2">
        PAC-MAN // CONTRIBUTION ENGINE
      </text>

      <text x="1160" y="445"
        text-anchor="end"
        fill="#8299B5" font-size="10">
        GENERATED AUTOMATICALLY // GITHUB
      </text>

      <path d="M35 455H1165"
        stroke="${COLORS.cyan}"
        stroke-opacity="0.2"/>
    </g>
  `;
}

// --------------------------------------------------
// MAIN RENDERER
// --------------------------------------------------

export function renderPacmanSvg({ contributions = [] } = {}) {
  const days = Array.isArray(contributions)
    ? contributions
    : contributions?.days ?? [];

  const events = createGameEvents(MAZE_LAYOUT);

  const svg = `
    <svg
      xmlns="${SVG_NS}"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      width="${LAYOUT.width}"
      height="${LAYOUT.height}"
      viewBox="0 0 ${LAYOUT.width} ${LAYOUT.height}"
      role="img"
      aria-label="Pac-Man cyberpunk GitHub contribution visualization"
    >
      ${renderDefinitions()}

      ${renderBackground()}
      ${renderPanel()}
      ${renderHeader()}

      ${renderMazeLabels(events, days)}

      <g transform="translate(${LAYOUT.mazeX} ${LAYOUT.mazeY})"
        clip-path="url(#mazeClip)">

        ${renderMazeFloor()}
        ${renderMazeWalls()}
        ${renderContributionCells(days, events)}
        ${renderNormalCoins(events)}
        ${renderSpecialCoins(events)}
        ${renderPacman(events)}
        ${renderGhosts(events)}
      </g>

      ${EFFECTS.particles ? renderHudParticles() : ""}

      ${renderFooter()}
    </svg>
  `;

  return svg.trim();
}

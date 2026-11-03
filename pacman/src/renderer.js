
import {
  MAZE_LAYOUT,
  getMazeEntities,
  getWallSegments,
  getMazeDimensions,
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
  renderContributionGlow,
  renderHudParticles,
} from "./animation.js";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const SVG_NS = "http://www.w3.org/2000/svg";


const LAYOUT = {
  width: CANVAS.width ?? 1200,
  height: CANVAS.height ?? 480,

  // Main maze
  mazeX: 245,
  mazeY: 145,
  mazeWidth: 520,
  mazeHeight: 240,

  // Contribution calendar
  calendarX: 790,
  calendarY: 145,
  calendarCell: 5,
  calendarGap: 2,
};


const MAZE_STYLE = {
  wall: COLORS.cyan,
  wallSecondary: COLORS.blue,
  pellet: "#A6F7FF",
  empty: "#0D1724",
};

const GHOST_COLORS = [
  COLORS.cyan,
  COLORS.purple,
  COLORS.magenta,
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

function getContributionStats(days = []) {
  const counts = days.map((day) => Math.max(0, Number(day.count) || 0));

  return {
    total: counts.reduce((sum, count) => sum + count, 0),
    max: Math.max(1, ...counts),
  };
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
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <pattern id="circuitGrid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M32 0H0V32" fill="none"
          stroke="${COLORS.cyan}" stroke-opacity="0.08" stroke-width="1"/>
        <circle cx="0" cy="0" r="1.5" fill="${COLORS.cyan}" opacity="0.2"/>
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
    <rect x="25" y="115" width="1150" height="290"
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
// CONTRIBUTION DATA
// --------------------------------------------------

function renderContributionCells(days = []) {
  const { max } = getContributionStats(days);

  const columns = 53;
  const rows = 7;
  const cell = LAYOUT.calendarCell;
  const gap = LAYOUT.calendarGap;

  const startX = LAYOUT.calendarX;
  const startY = LAYOUT.calendarY;

  const visibleDays = days.slice(-columns * rows);

  return visibleDays.map((day, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;

    const x = startX + column * (cell + gap);
    const y = startY + row * (cell + gap);

    const count = Math.max(0, Number(day.count) || 0);
    const color = getContributionColor(count, max);

    const intensity = count === 0
      ? 0.15
      : clamp(count / max, 0.25, 1);

    return `
      <g>
        <title>${escapeXml(day.date)}: ${count} contributions</title>

        <rect x="${x}" y="${y}" width="${cell}" height="${cell}"
          rx="2" fill="${color}"
          stroke="${COLORS.teal}" stroke-opacity="0.18"
          stroke-width="0.5">
          ${count > 0 && EFFECTS.glow
            ? renderContributionGlow(intensity)
            : ""}
        </rect>
      </g>
    `;
  }).join("");
}

function renderContributionPanel(days = []) {
  const { total, max } = getContributionStats(days);

  return `
    <g font-family="monospace">
      <text x="${LAYOUT.calendarX}" y="130"
        fill="${COLORS.cyan}" font-size="10"
        letter-spacing="1.5">
        ACTIVITY / 53 WEEKS
      </text>

      ${renderContributionCells(days)}

      <text x="${LAYOUT.calendarX}" y="260"
        fill="#FFFFFF" font-size="19" font-weight="bold">
        ${total.toLocaleString("en-US")}
      </text>

      <text x="${LAYOUT.calendarX}" y="277"
        fill="#8299B5" font-size="9" letter-spacing="1">
        CONTRIBUTIONS
      </text>

      <text x="${LAYOUT.calendarX}" y="306"
        fill="#8299B5" font-size="9">
        MAX DAILY: ${max}
      </text>

      <g transform="translate(${LAYOUT.calendarX} 325)">
        ${COLORS.contributions.map((color, index) => `
          <rect x="${index * 14}" y="0" width="10" height="10"
            rx="2" fill="${color}"/>
        `).join("")}
      </g>

      <text x="${LAYOUT.calendarX}" y="350"
        fill="#8299B5" font-size="9">
        LOW ACTIVITY
      </text>

      <text x="${LAYOUT.calendarX + 75}" y="350"
        fill="#8299B5" font-size="9">
        HIGH ACTIVITY
      </text>
    </g>
  `;
}

// --------------------------------------------------
// MAZE
// --------------------------------------------------

function renderMazeFloor() {
  const { columns, rows, cellWidth, cellHeight } = getCellSize();

  let output = "";

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (MAZE_LAYOUT[row][column] === "#") continue;

      output += `
        <rect
          x="${column * cellWidth}"
          y="${row * cellHeight}"
          width="${cellWidth}"
          height="${cellHeight}"
          fill="${MAZE_STYLE.empty}"
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

  return walls.map((wall, index) => {
    const x = wall.x * cellWidth;
    const y = wall.y * cellHeight;

    return `
      <rect
        x="${x + 1}"
        y="${y + 1}"
        width="${cellWidth - 2}"
        height="${cellHeight - 2}"
        rx="3"
        fill="url(#wallGradient)"
        fill-opacity="0.16"
        stroke="${MAZE_STYLE.wall}"
        stroke-width="1.3"
        filter="url(#neonGlow)"
      >
        ${EFFECTS.animatedWalls
          ? renderWallGlow(index)
          : ""}
      </rect>
    `;
  }).join("");
}

function renderMazePellets() {
  const { columns, rows, cellWidth, cellHeight } = getCellSize();

  let output = "";

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = MAZE_LAYOUT[row][column];

      if (cell !== ".") continue;

      output += `
        <circle
          cx="${column * cellWidth + cellWidth / 2}"
          cy="${row * cellHeight + cellHeight / 2}"
          r="1.8"
          fill="${MAZE_STYLE.pellet}"
          opacity="0.85"
        />
      `;
    }
  }

  return output;
}

// --------------------------------------------------
// PAC-MAN
// --------------------------------------------------

function renderPacman() {
  const entities = getMazeEntities(MAZE_LAYOUT);
  const pacman = entities.pacman;

  if (!pacman) return "";

  const { cellWidth, cellHeight } = getCellSize();

  const x = pacman.x * cellWidth + cellWidth / 2;
  const y = pacman.y * cellHeight + cellHeight / 2;

  const radius = Math.min(cellWidth, cellHeight) * 0.42;

  return `
    <g transform="translate(${x} ${y})"
      filter="url(#strongGlow)">

      <circle r="${radius}" fill="${COLORS.pacman}"/>

      <path d="M0 0 L${radius} ${-radius * 0.65}
        A${radius} ${radius} 0 1 0 ${radius} ${radius * 0.65} Z"
        fill="${COLORS.background}">
        ${renderPacmanMouth(radius)}
      </path>

      <circle cx="${radius * 0.12}"
        cy="${-radius * 0.48}"
        r="${radius * 0.09}"
        fill="#1A1A1A"/>
    </g>
  `;
}

// --------------------------------------------------
// GHOSTS
// --------------------------------------------------

function renderGhost(x, y, color, index) {
  const { cellWidth, cellHeight } = getCellSize();

  const centerX = x * cellWidth + cellWidth / 2;
  const centerY = y * cellHeight + cellHeight / 2;

  const radius = Math.min(cellWidth, cellHeight) * 0.4;

  return `
    <g transform="translate(${centerX} ${centerY})"
      filter="url(#neonGlow)">

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

function renderGhosts() {
  const entities = getMazeEntities(MAZE_LAYOUT);

  return entities.ghosts.map((ghost, index) => {
    const color = GHOST_COLORS[index % GHOST_COLORS.length];

    return renderGhost(
      ghost.x,
      ghost.y,
      color,
      index
    );
  }).join("");
}

// --------------------------------------------------
// FOOTER
// --------------------------------------------------

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
    : contributions.days ?? [];

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

      <g transform="translate(${LAYOUT.mazeX} ${LAYOUT.mazeY})"
        clip-path="url(#mazeClip)">

        ${renderMazeFloor()}
        ${renderMazeWalls()}
        ${renderMazePellets()}
        ${renderPacman()}
        ${renderGhosts()}
      </g>

      ${renderContributionPanel(days)}

      ${EFFECTS.particles ? renderHudParticles() : ""}

      ${renderFooter()}
    </svg>
  `;

  return svg.trim();
}

/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * SVG rendering engine
 */

import {
  MAZE_CONFIG,
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

const SVG_NS = "http://www.w3.org/2000/svg";

function renderDefs() {
  return `
    <defs>
      <linearGradient id="hud-border" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${COLORS.cyan}"/>
        <stop offset="50%" stop-color="${COLORS.blue}"/>
        <stop offset="100%" stop-color="${COLORS.purple}"/>
      </linearGradient>

      <linearGradient id="panel-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#101A2B"/>
        <stop offset="100%" stop-color="#0D1117"/>
      </linearGradient>

      <filter id="neon-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5"/>
      </filter>

      <pattern id="micro-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24"
          fill="none" stroke="#1677FF" stroke-opacity=".09"
          stroke-width=".6"/>
      </pattern>
    </defs>
  `;
}

function renderBackground() {
  return `
    <rect width="${CANVAS.width}" height="${CANVAS.height}"
      fill="${COLORS.background}"/>

    <rect x="1" y="1" width="${CANVAS.width - 2}"
      height="${CANVAS.height - 2}" rx="16"
      fill="url(#panel-bg)"
      stroke="url(#hud-border)" stroke-width="1.5"/>

    <rect x="2" y="2" width="${CANVAS.width - 4}"
      height="${CANVAS.height - 4}" rx="15"
      fill="url(#micro-grid)"/>

    <path d="M 24 72 H 1176"
      stroke="${COLORS.cyan}" stroke-opacity=".35"/>

    <path d="M 24 74 H 220 L 232 86 H 968 L 980 74 H 1176"
      fill="none" stroke="${COLORS.blue}" stroke-opacity=".3"/>
  `;
}

function renderHeader() {
  return `
    <g>
      <circle cx="42" cy="39" r="5"
        fill="${COLORS.teal}" filter="url(#neon-glow)"/>

      <text x="58" y="36"
        fill="${COLORS.cyan}"
        font-family="monospace"
        font-size="19"
        font-weight="bold"
        letter-spacing="3">
        ${PROFILE.title}
      </text>

      <text x="59" y="53"
        fill="#8297B5"
        font-family="monospace"
        font-size="8"
        letter-spacing="2">
        ${PROFILE.name} / CONTRIBUTION MONITORING SYSTEM
      </text>

      <text x="1155" y="35"
        text-anchor="end"
        fill="${COLORS.teal}"
        font-family="monospace"
        font-size="9">
        SYSTEM ONLINE
      </text>

      <text x="1155" y="51"
        text-anchor="end"
        fill="#8297B5"
        font-family="monospace"
        font-size="8">
        GITHUB ACTIVITY
      </text>
    </g>
  `;
}

function renderContributionCalendar(days = []) {
  const columns = 53;
  const cell = 8;
  const gap = 3;
  const startX = 332;
  const startY = 87;

  const maxCount = Math.max(
    1,
    ...days.map((day) => day.count || 0)
  );

  const cells = days.slice(0, columns * 7).map((day, index) => {
    const column = Math.floor(index / 7);
    const row = index % 7;

    const x = startX + column * (cell + gap);
    const y = startY + row * (cell + gap);

    const color = getContributionColor(day.count || 0, maxCount);

    return `
      <rect x="${x}" y="${y}"
        width="${cell}" height="${cell}" rx="1.5"
        fill="${color}"
        ${day.count > 0 ? 'filter="url(#soft-glow)"' : ""}
        opacity="${day.count > 0 ? 1 : 0.65}">
        <title>${day.date || ""}: ${day.count || 0} contributions</title>
      </rect>
    `;
  }).join("");

  return `
    <g>
      <text x="332" y="81"
        fill="${COLORS.teal}"
        font-family="monospace"
        font-size="8"
        letter-spacing="1">
        CONTRIBUTION INTENSITY
      </text>
      ${cells}
    </g>
  `;
}

function renderMazeWalls() {
  const walls = getWallSegments();

  return `
    <g transform="translate(264 150)">
      ${walls.map((wall) => `
        <rect
          x="${wall.x + 2}"
          y="${wall.y + 2}"
          width="${wall.width - 4}"
          height="${wall.height - 4}"
          rx="${MAZE_CONFIG.cornerRadius}"
          fill="#10284B"
          stroke="${COLORS.blue}"
          stroke-width="${MAZE_CONFIG.wallThickness}"
          filter="${EFFECTS.glow ? 'url(#neon-glow)' : 'none'}"
        />
      `).join("")}
    </g>
  `;
}

function renderMazeDots(days = []) {
  const openCells = [];

  MAZE_LAYOUT.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "." || cell === "P" || cell === "G") {
        openCells.push({ x, y });
      }
    });
  });

  const maxCount = Math.max(
    1,
    ...days.map((day) => day.count || 0)
  );

  return `
    <g transform="translate(264 150)">
      ${openCells.map((position, index) => {
        const day = days[index];

        if (!day || !day.count) return "";

        const color = getContributionColor(day.count, maxCount);

        return `
          <rect
            x="${position.x * MAZE_CONFIG.cellSize + 9}"
            y="${position.y * MAZE_CONFIG.cellSize + 9}"
            width="6"
            height="6"
            rx="1"
            fill="${color}"
            filter="url(#neon-glow)"
          >
            <title>${day.date}: ${day.count} contributions</title>
          </rect>
        `;
      }).join("")}
    </g>
  `;
}

function renderPacman() {
  const entities = getMazeEntities();

  if (!entities.pacman) return "";

  const x = entities.pacman.x * MAZE_CONFIG.cellSize + 12;
  const y = entities.pacman.y * MAZE_CONFIG.cellSize + 12;

  return `
    <g transform="translate(${264 + x} ${150 + y})">
      <circle r="10" fill="${COLORS.pacman}"
        filter="url(#neon-glow)"/>
      <path d="M 0 0 L 10 -5 A 10 10 0 0 1 10 5 Z"
        fill="#0D1117"/>
    </g>
  `;
}

function renderGhost(x, y, color) {
  return `
    <g transform="translate(${264 + x * 24 + 12} ${150 + y * 24 + 12})">
      <path
        d="M -10 8 V -2 A 10 10 0 0 1 10 -2 V 8
           L 5 4 L 0 8 L -5 4 Z"
        fill="${color}"
        filter="url(#neon-glow)"
      />
      <circle cx="-4" cy="-2" r="2.5" fill="#FFFFFF"/>
      <circle cx="4" cy="-2" r="2.5" fill="#FFFFFF"/>
      <circle cx="-3.5" cy="-2" r="1.2" fill="#14213D"/>
      <circle cx="4.5" cy="-2" r="1.2" fill="#14213D"/>
    </g>
  `;
}

function renderGhosts() {
  const entities = getMazeEntities();

  const ghostColors = [
    COLORS.cyan,
    COLORS.purple,
    COLORS.magenta,
  ];

  return entities.ghosts.map((ghost, index) =>
    renderGhost(
      ghost.x,
      ghost.y,
      ghostColors[index % ghostColors.length]
    )
  ).join("");
}

function renderFooter() {
  return `
    <g font-family="monospace" font-size="8" fill="#8297B5">
      <text x="28" y="465">WHEATLEY06 / PACMAN ENGINE</text>
      <text x="1172" y="465" text-anchor="end">
        NEON CONTRIBUTION VISUALIZATION
      </text>
    </g>
  `;
}

/**
 * Generate complete SVG.
 *
 * @param {Object} options
 * @param {Array} options.contributions
 * @returns {string}
 */
export function renderPacmanSvg({ contributions = [] } = {}) {
  const dimensions = getMazeDimensions();

  if (
    dimensions.width > CANVAS.width ||
    dimensions.height > CANVAS.height
  ) {
    throw new Error("Maze exceeds SVG canvas dimensions.");
  }

  return `
    <svg
      xmlns="${SVG_NS}"
      width="${CANVAS.width}"
      height="${CANVAS.height}"
      viewBox="0 0 ${CANVAS.width} ${CANVAS.height}"
      role="img"
      aria-label="Wheatley06 Pac-Man Cyberpunk Contributions"
    >
      ${renderDefs()}
      ${renderBackground()}
      ${renderHeader()}
      ${renderContributionCalendar(contributions)}
      ${renderMazeWalls()}
      ${renderMazeDots(contributions)}
      ${renderPacman()}
      ${renderGhosts()}
      ${renderFooter()}
    </svg>
  `.trim();
}

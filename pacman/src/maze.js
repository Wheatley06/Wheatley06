
/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 *
 * Extended horizontal maze.
 * The height remains unchanged.
 *
 * Symbols:
 * # = wall
 * . = corridor / collectible position
 * P = Pac-Man starting position
 * G = Ghost starting position
 */

export const MAZE_CONFIG = {
  columns: 40,
  rows: 13,
  cellSize: 24,

  wallColor: "#1677FF",
  wallGlow: "#00CFFF",
  background: "#0D1117",

  wallThickness: 2.2,
  cornerRadius: 5,
};

export const MAZE_LAYOUT = [
  "########################################",
  "#P.....................................#",
  "#....####....####....####....####......#",
  "#......................................#",
  "#........####....####....####....####..#",
  "#......................................#",
  "#....####....####....####....####......#",
  "#......................................#",
  "#........####....####....####....####..#",
  "#......................................#",
  "#....####....####....####....####......#",
  "#......G.......G.......G.......G....G..#",
  "########################################",
];

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

export function validateMaze(layout = MAZE_LAYOUT) {
  if (!Array.isArray(layout) || layout.length === 0) {
    throw new Error("Maze layout must be a non-empty array.");
  }

  const width = layout[0].length;

  if (layout.some((row) => row.length !== width)) {
    throw new Error("All maze rows must have the same width.");
  }

  if (
    width !== MAZE_CONFIG.columns ||
    layout.length !== MAZE_CONFIG.rows
  ) {
    throw new Error("Maze dimensions do not match MAZE_CONFIG.");
  }

  const allowedCharacters = new Set([
    "#",
    ".",
    "P",
    "G",
    " ",
  ]);

  for (const row of layout) {
    for (const character of row) {
      if (!allowedCharacters.has(character)) {
        throw new Error(`Invalid maze character: ${character}`);
      }
    }
  }

  const entities = getMazeEntities(layout);

  if (!entities.pacman) {
    throw new Error("Pac-Man starting position is missing.");
  }

  if (entities.ghosts.length !== 5) {
    throw new Error("The maze must contain exactly five ghosts.");
  }

  return {
    valid: true,
    columns: width,
    rows: layout.length,
    ghostCount: entities.ghosts.length,
  };
}

// --------------------------------------------------
// CELL ACCESS
// --------------------------------------------------

export function getMazeCell(x, y, layout = MAZE_LAYOUT) {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    y < 0 ||
    y >= layout.length ||
    x < 0 ||
    x >= layout[y].length
  ) {
    return null;
  }

  return layout[y][x];
}

// --------------------------------------------------
// ENTITIES
// --------------------------------------------------

export function getMazeEntities(layout = MAZE_LAYOUT) {
  const entities = {
    pacman: null,
    ghosts: [],
  };

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "P") {
        entities.pacman = { x, y };
      }

      if (cell === "G") {
        entities.ghosts.push({ x, y });
      }
    });
  });

  return entities;
}

// --------------------------------------------------
// WALL GEOMETRY
// --------------------------------------------------

export function getWallSegments(layout = MAZE_LAYOUT) {
  const segments = [];

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "#") {
        segments.push({
          x,
          y,
          width: 1,
          height: 1,
          type: "wall",
        });
      }
    });
  });

  return segments;
}

// --------------------------------------------------
// DIMENSIONS
// --------------------------------------------------

export function getMazeDimensions(layout = MAZE_LAYOUT) {
  const rows = layout.length;
  const columns = layout[0]?.length ?? 0;

  return {
    columns,
    rows,
    width: columns * MAZE_CONFIG.cellSize,
    height: rows * MAZE_CONFIG.cellSize,
  };
}

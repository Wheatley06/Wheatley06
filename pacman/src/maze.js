/**
 * Wheatley06 Pac-Man Cyberpunk
 * Maze layout and geometry configuration.
 *
 * This module defines the arcade environment.
 * Rendering and animation are handled by separate modules.
 */

export const MAZE_CONFIG = {
  columns: 28,
  rows: 13,
  cellSize: 24,
  wallColor: "#1677FF",
  wallGlow: "#00CFFF",
  background: "#0D1117",
  wallThickness: 2.2,
  cornerRadius: 5,
};

/**
 * Maze legend:
 * # = wall
 * . = corridor
 * P = Pac-Man starting position
 * G = Ghost starting position
 *   = empty space
 */
export const MAZE_LAYOUT = [
  "############################",
  "#P....#.......##.......#...#",
  "##.##..#.#####.##.#####.#.##",
  "#......#................#..#",
  "###.####.##.####.##.####.###",
  "#......#....##....#........#",
  "##.####.####.##.####.####.##",
  "#......#................#..#",
  "###.##.#.####.##.####.#.##.#",
  "#....#........##......#....#",
  "#.##.#####.##.##.##.#####.##",
  "#.....G........G...........#",
  "############################",
];

/**
 * Validate the maze dimensions and allowed characters.
 */
export function validateMaze(layout = MAZE_LAYOUT) {
  if (!Array.isArray(layout) || layout.length === 0) {
    throw new Error("Maze layout must be a non-empty array.");
  }

  const width = layout[0].length;

  if (layout.some((row) => row.length !== width)) {
    throw new Error("All maze rows must have the same width.");
  }

  const allowedCharacters = new Set(["#", ".", "P", "G", " "]);

  for (const row of layout) {
    for (const character of row) {
      if (!allowedCharacters.has(character)) {
        throw new Error(`Invalid maze character: ${character}`);
      }
    }
  }

  return {
    valid: true,
    columns: width,
    rows: layout.length,
  };
}

/**
 * Retrieve a maze cell.
 */
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

/**
 * Retrieve special character positions.
 */
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

/**
 * Convert maze walls into SVG-ready rectangles.
 */
export function getWallSegments(layout = MAZE_LAYOUT) {
  const segments = [];

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "#") {
        segments.push({
          x: x * MAZE_CONFIG.cellSize,
          y: y * MAZE_CONFIG.cellSize,
          width: MAZE_CONFIG.cellSize,
          height: MAZE_CONFIG.cellSize,
          type: "wall",
        });
      }
    });
  });

  return segments;
}

/**
 * Return the complete maze dimensions in pixels.
 */
export function getMazeDimensions(layout = MAZE_LAYOUT) {
  return {
    width: layout[0].length * MAZE_CONFIG.cellSize,
    height: layout.length * MAZE_CONFIG.cellSize,
  };
}

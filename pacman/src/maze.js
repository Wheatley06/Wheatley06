/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * Connected classic maze: 50 columns x 13 rows.
 *
 * # = wall
 * . = corridor
 * P = Pac-Man
 * G = Ghost
 */

export const MAZE_CONFIG = {
  columns: 50,
  rows: 13,
  cellSize: 24,
  wallColor: "#12364B",
  wallGlow: "#00CFFF",
  background: "#0D1117",
  wallThickness: 1.8,
  cornerRadius: 2,
};

const WIDTH = MAZE_CONFIG.columns;
const HEIGHT = MAZE_CONFIG.rows;

function createMaze() {
  const grid = Array.from(
    { length: HEIGHT },
    () => Array(WIDTH).fill("#")
  );

  // Coarse grid: 24 columns x 6 rows.
  // Every node is separated by one wall cell.
  const coarseColumns = 24;
  const coarseRows = 6;

  const visited = new Set();
  const nodeKey = (x, y) => `${x},${y}`;

  const carveNode = (cx, cy) => {
    grid[1 + cy * 2][1 + cx * 2] = ".";
  };

  const carveConnection = (a, b) => {
    const ax = 1 + a.x * 2;
    const ay = 1 + a.y * 2;
    const bx = 1 + b.x * 2;
    const by = 1 + b.y * 2;

    grid[ay][ax] = ".";
    grid[by][bx] = ".";
    grid[(ay + by) / 2][(ax + bx) / 2] = ".";
  };

  // Deterministic depth-first maze generation.
  const stack = [{ x: 0, y: 0 }];
  visited.add(nodeKey(0, 0));
  carveNode(0, 0);

  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (stack.length) {
    const current = stack[stack.length - 1];

    const candidates = directions
      .map((d) => ({
        x: current.x + d.x,
        y: current.y + d.y,
      }))
      .filter((next) =>
        next.x >= 0 &&
        next.x < coarseColumns &&
        next.y >= 0 &&
        next.y < coarseRows &&
        !visited.has(nodeKey(next.x, next.y))
      );

    if (!candidates.length) {
      stack.pop();
      continue;
    }

    // Deterministic direction selection.
    candidates.sort((a, b) => {
      const scoreA = (a.x * 17 + a.y * 31 + stack.length * 7) % 23;
      const scoreB = (b.x * 17 + b.y * 31 + stack.length * 7) % 23;
      return scoreA - scoreB;
    });

    const next = candidates[0];

    carveConnection(current, next);
    visited.add(nodeKey(next.x, next.y));
    stack.push(next);
  }

  // Add loops and alternative routes to avoid a purely
  // tree-like maze with excessive dead ends.
  for (let cy = 0; cy < coarseRows; cy++) {
    for (let cx = 0; cx < coarseColumns; cx++) {
      if (cx < coarseColumns - 1 && (cx * 7 + cy * 11) % 5 === 0) {
        carveConnection(
          { x: cx, y: cy },
          { x: cx + 1, y: cy }
        );
      }

      if (cy < coarseRows - 1 && (cx * 13 + cy * 3) % 6 === 0) {
        carveConnection(
          { x: cx, y: cy },
          { x: cx, y: cy + 1 }
        );
      }
    }
  }

  // Open selected extra corridors to create wider
  // intersections and more recognizable Pac-Man routes.
  for (let y = 2; y < HEIGHT - 1; y += 2) {
    for (let x = 2; x < WIDTH - 2; x += 2) {
      if ((x * 3 + y * 5) % 11 === 0) {
        grid[y][x] = ".";
      }
    }
  }

  // Pac-Man starting position.
  grid[1][1] = "P";

  // Eight ghosts arranged around a central ghost area.
  const ghostPositions = [
    [21, 5], [23, 5], [25, 5], [27, 5],
    [21, 7], [23, 7], [25, 7], [27, 7],
  ];

  for (const [x, y] of ghostPositions) {
    grid[y][x] = "G";
  }

  return grid.map((row) => row.join(""));
}

export const MAZE_LAYOUT = createMaze();

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

export function getMazeEntities(layout = MAZE_LAYOUT) {
  const entities = {
    pacman: null,
    ghosts: [],
  };

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "P") entities.pacman = { x, y };
      if (cell === "G") entities.ghosts.push({ x, y });
    });
  });

  return entities;
}

export function getWallSegments(layout = MAZE_LAYOUT) {
  const segments = [];

  layout.forEach((row, y) => {
    let start = -1;

    for (let x = 0; x <= row.length; x++) {
      const isWall = row[x] === "#";

      if (isWall && start === -1) start = x;

      if ((!isWall || x === row.length) && start !== -1) {
        segments.push({
          x: start,
          y,
          width: x - start,
          height: 1,
          type: "wall",
        });

        start = -1;
      }
    }
  });

  return segments;
}

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

export function validateMaze(layout = MAZE_LAYOUT) {
  if (!Array.isArray(layout) || layout.length === 0) {
    throw new Error("Maze layout must be a non-empty array.");
  }

  const width = layout[0].length;

  if (layout.some((row) => row.length !== width)) {
    throw new Error("All maze rows must have the same width.");
  }

  if (width !== MAZE_CONFIG.columns || layout.length !== MAZE_CONFIG.rows) {
    throw new Error("Maze dimensions do not match MAZE_CONFIG.");
  }

  const allowed = new Set(["#", ".", "P", "G"]);

  for (const row of layout) {
    for (const character of row) {
      if (!allowed.has(character)) {
        throw new Error(`Invalid maze character: ${character}`);
      }
    }
  }

  const entities = getMazeEntities(layout);

  if (!entities.pacman) {
    throw new Error("Pac-Man starting position is missing.");
  }

  if (entities.ghosts.length !== 8) {
    throw new Error(`Expected 8 ghosts, found ${entities.ghosts.length}.`);
  }

  // Verify every walkable cell is connected to Pac-Man.
  const queue = [entities.pacman];
  const visited = new Set([`${entities.pacman.x},${entities.pacman.y}`]);

  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];

  while (queue.length) {
    const current = queue.shift();

    for (const [dx, dy] of directions) {
      const x = current.x + dx;
      const y = current.y + dy;
      const cell = getMazeCell(x, y, layout);
      const id = `${x},${y}`;

      if (cell !== null && cell !== "#" && !visited.has(id)) {
        visited.add(id);
        queue.push({ x, y });
      }
    }
  }

  const walkableCount = layout.reduce(
    (sum, row) => sum + [...row].filter((c) => c !== "#").length,
    0
  );

  if (visited.size !== walkableCount) {
    throw new Error(
      `Maze has disconnected corridors: ${visited.size}/${walkableCount} reachable.`
    );
  }

  return {
    valid: true,
    columns: width,
    rows: layout.length,
    ghostCount: entities.ghosts.length,
    walkableCount,
  };
}

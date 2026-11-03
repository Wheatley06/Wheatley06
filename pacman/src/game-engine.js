
/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * Game engine: paths, collectibles and ghost escape.
 *
 * Pure JavaScript.
 * No external dependencies.
 */

import {
  MAZE_LAYOUT,
  getMazeEntities,
  getMazeCell,
} from "./maze.js";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

export const GAME_CONFIG = {
  specialCoinCount: 5,
  ghostCount: 5,
  boostDuration: 6,
  normalSpeed: 1,
  boostedSpeed: 1.8,
};

// --------------------------------------------------
// MAZE NAVIGATION
// --------------------------------------------------

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function isWalkable(x, y, layout = MAZE_LAYOUT) {
  const cell = getMazeCell(x, y, layout);
  return cell !== null && cell !== "#";
}

export function getNeighbors(position, layout = MAZE_LAYOUT) {
  return DIRECTIONS
    .map(({ x, y }) => ({
      x: position.x + x,
      y: position.y + y,
    }))
    .filter(({ x, y }) => isWalkable(x, y, layout));
}

export function findPath(start, target, layout = MAZE_LAYOUT) {
  if (!start || !target) return [];

  if (
    !isWalkable(start.x, start.y, layout) ||
    !isWalkable(target.x, target.y, layout)
  ) {
    return [];
  }

  const queue = [[start]];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current.x === target.x && current.y === target.y) {
      return path;
    }

    for (const neighbor of getNeighbors(current, layout)) {
      const key = `${neighbor.x},${neighbor.y}`;

      if (visited.has(key)) continue;

      visited.add(key);
      queue.push([...path, neighbor]);
    }
  }

  return [];
}

// --------------------------------------------------
// COLLECTIBLES
// --------------------------------------------------

export function getCollectibles(layout = MAZE_LAYOUT) {
  const normalCoins = [];
  const corridors = [];

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === ".") {
        corridors.push({ x, y });
        normalCoins.push({ x, y, type: "normal" });
      }
    });
  });

  // Special coins are distributed across the maze.
  const specialCoinCount = Math.min(
    GAME_CONFIG.specialCoinCount,
    corridors.length
  );

  const specialCoins = [];

  for (let index = 0; index < specialCoinCount; index++) {
    const position = Math.floor(
      ((index + 1) * corridors.length) /
      (specialCoinCount + 1)
    );

    const cell = corridors[position];

    if (cell) {
      specialCoins.push({
        ...cell,
        type: "special",
      });
    }
  }

  const specialKeys = new Set(
    specialCoins.map(({ x, y }) => `${x},${y}`)
  );

  return {
    normalCoins: normalCoins.filter(
      ({ x, y }) => !specialKeys.has(`${x},${y}`)
    ),
    specialCoins,
  };
}

// --------------------------------------------------
// PAC-MAN ROUTE
// --------------------------------------------------

export function createPacmanRoute(layout = MAZE_LAYOUT) {
  const entities = getMazeEntities(layout);

  if (!entities.pacman) {
    throw new Error("Pac-Man starting position is missing.");
  }

  const route = [];
  const visited = new Set();

  let current = entities.pacman;

  // Traverse every reachable corridor cell.
  while (true) {
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) break;

    visited.add(key);
    route.push(current);

    const next = getNeighbors(current, layout).find(
      (position) =>
        !visited.has(`${position.x},${position.y}`)
    );

    if (!next) break;

    current = next;
  }

  return route;
}

// --------------------------------------------------
// GHOST ESCAPE
// --------------------------------------------------

export function createGhostRoutes(layout = MAZE_LAYOUT) {
  const entities = getMazeEntities(layout);

  return entities.ghosts.map((ghost, index) => {
    const neighbors = getNeighbors(ghost, layout);

    const route = [
      ghost,
      ...neighbors.filter(
        (position) =>
          position.x !== ghost.x ||
          position.y !== ghost.y
      ),
    ];

    return {
      id: index,
      start: ghost,
      route,
      delay: index * 0.6,
    };
  });
}

// --------------------------------------------------
// GAME EVENTS
// --------------------------------------------------

export function createGameEvents(layout = MAZE_LAYOUT) {
  const collectibles = getCollectibles(layout);
  const route = createPacmanRoute(layout);

  const routeIndex = new Map(
    route.map((position, index) => [
      `${position.x},${position.y}`,
      index,
    ])
  );

  const normalCoins = collectibles.normalCoins.map((coin) => ({
    ...coin,
    routeIndex: routeIndex.get(`${coin.x},${coin.y}`) ?? -1,
  }));

  const specialCoins = collectibles.specialCoins.map((coin) => ({
    ...coin,
    routeIndex: routeIndex.get(`${coin.x},${coin.y}`) ?? -1,
  }));

  return {
    route,
    normalCoins,
    specialCoins,
    ghosts: createGhostRoutes(layout),
  };
}

// --------------------------------------------------
// SVG PATH
// --------------------------------------------------

export function toSvgPath(route, cellWidth, cellHeight) {
  if (!Array.isArray(route) || route.length === 0) {
    return "";
  }

  return route.map((position, index) => {
    const x = position.x * cellWidth + cellWidth / 2;
    const y = position.y * cellHeight + cellHeight / 2;

    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
}

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

export function validateGameEngine(layout = MAZE_LAYOUT) {
  const entities = getMazeEntities(layout);
  const events = createGameEvents(layout);

  if (entities.ghosts.length !== GAME_CONFIG.ghostCount) {
    throw new Error("The game requires exactly five ghosts.");
  }

  if (events.route.length === 0) {
    throw new Error("Pac-Man route is empty.");
  }

  if (events.specialCoins.length !== GAME_CONFIG.specialCoinCount) {
    throw new Error("Special coin distribution is invalid.");
  }

  if (
    events.route.some(
      (position) => !isWalkable(position.x, position.y, layout)
    )
  ) {
    throw new Error("Pac-Man route crosses a wall.");
  }

  return {
    valid: true,
    routeLength: events.route.length,
    normalCoinCount: events.normalCoins.length,
    specialCoinCount: events.specialCoins.length,
    ghostCount: events.ghosts.length,
  };
}


/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * Game engine: maze traversal and collectible planning.
 *
 * Deterministic SVG animation planning.
 * No external dependencies.
 */

import {
  MAZE_LAYOUT,
  getMazeEntities,
  getMazeCell,
} from "./maze.js";

export const GAME_CONFIG = {
  specialCoinCount: 5,
  ghostCount: 5,
  boostDuration: 6,
  normalSpeed: 1,
  boostedSpeed: 1.8,
};

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function keyOf(position) {
  return `${position.x},${position.y}`;
}

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
  const visited = new Set([keyOf(start)]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (keyOf(current) === keyOf(target)) {
      return path;
    }

    for (const neighbor of getNeighbors(current, layout)) {
      const key = keyOf(neighbor);

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
  const corridors = [];

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === ".") {
        corridors.push({ x, y });
      }
    });
  });

  const specialCoinCount = Math.min(
    GAME_CONFIG.specialCoinCount,
    corridors.length
  );

  const specialCoins = [];

  for (let index = 0; index < specialCoinCount; index++) {
    const position = Math.floor(
      ((index + 1) * (corridors.length - 1)) /
      (specialCoinCount + 1)
    );

    specialCoins.push({
      ...corridors[position],
      type: "special",
    });
  }

  const specialKeys = new Set(
    specialCoins.map(keyOf)
  );

  const normalCoins = corridors
    .filter((position) => !specialKeys.has(keyOf(position)))
    .map((position) => ({
      ...position,
      type: "normal",
    }));

  return { normalCoins, specialCoins };
}

// --------------------------------------------------
// PAC-MAN FULL MAZE TRAVERSAL
// --------------------------------------------------

/**
 * Creates a deterministic DFS walk.
 * Every reachable corridor cell is visited.
 * Backtracking keeps consecutive positions adjacent.
 */
export function createPacmanRoute(layout = MAZE_LAYOUT) {
  const entities = getMazeEntities(layout);

  if (!entities.pacman) {
    throw new Error("Pac-Man starting position is missing.");
  }

  const route = [entities.pacman];
  const visited = new Set([keyOf(entities.pacman)]);

  function traverse(current) {
    const neighbors = getNeighbors(current, layout);

    for (const next of neighbors) {
      const key = keyOf(next);

      if (visited.has(key)) continue;

      visited.add(key);
      route.push(next);

      traverse(next);

      // Return along the corridor to continue exploring.
      route.push(current);
    }
  }

  traverse(entities.pacman);

  return route;
}

// --------------------------------------------------
// GHOST ESCAPE ROUTES
// --------------------------------------------------

/**
 * Finds a distant reachable destination for each ghost.
 * This creates a precomputed escape movement, not live AI.
 */
export function createGhostRoutes(layout = MAZE_LAYOUT) {
  const entities = getMazeEntities(layout);

  return entities.ghosts.map((ghost, index) => {
    const candidates = [];

    layout.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell !== "#" && cell !== "G" && cell !== "P") {
          const path = findPath(ghost, { x, y }, layout);

          if (path.length > 1) {
            candidates.push({
              target: { x, y },
              path,
              distance: path.length,
            });
          }
        }
      });
    });

    candidates.sort((a, b) => {
      const distanceDifference = b.distance - a.distance;

      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      return (
        (a.target.x + a.target.y + index) -
        (b.target.x + b.target.y + index)
      );
    });

    const escape = candidates[0];

    return {
      id: index,
      start: ghost,
      target: escape?.target ?? ghost,
      route: escape?.path ?? [ghost],
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

  const routeIndex = new Map();

  route.forEach((position, index) => {
    const key = keyOf(position);

    if (!routeIndex.has(key)) {
      routeIndex.set(key, index);
    }
  });

  const addRouteIndex = (coin) => ({
    ...coin,
    routeIndex: routeIndex.get(keyOf(coin)) ?? -1,
  });

  return {
    route,
    normalCoins: collectibles.normalCoins.map(addRouteIndex),
    specialCoins: collectibles.specialCoins.map(addRouteIndex),
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

  for (let index = 0; index < events.route.length; index++) {
    const position = events.route[index];

    if (!isWalkable(position.x, position.y, layout)) {
      throw new Error("Pac-Man route crosses a wall.");
    }

    if (index > 0) {
      const previous = events.route[index - 1];

      const distance =
        Math.abs(position.x - previous.x) +
        Math.abs(position.y - previous.y);

      if (distance !== 1) {
        throw new Error("Pac-Man route contains a discontinuity.");
      }
    }
  }

  const reachable = new Set(
    events.route.map(keyOf)
  );

  const expected = new Set();

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== "#") {
        const path = findPath(entities.pacman, { x, y }, layout);

        if (path.length > 0) {
          expected.add(`${x},${y}`);
        }
      }
    });
  });

  for (const position of expected) {
    if (!reachable.has(position)) {
      throw new Error(`Unvisited corridor cell: ${position}`);
    }
  }

  return {
    valid: true,
    routeLength: events.route.length,
    visitedCells: reachable.size,
    normalCoinCount: events.normalCoins.length,
    specialCoinCount: events.specialCoins.length,
    ghostCount: events.ghosts.length,
  };
}

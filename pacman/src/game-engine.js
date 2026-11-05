/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * Connected deterministic game engine.
 */

import {
  MAZE_LAYOUT,
  getMazeEntities,
  getMazeCell,
} from "./maze.js";

export const GAME_CONFIG = {
  specialCoinCount: 5,
  ghostCount: 8,
  normalSpeed: 1,
  ghostSteps: 32,
};

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

const key = (p) => `${p.x},${p.y}`;

const distance = (a, b) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function walkable(x, y, layout) {
  const cell = getMazeCell(x, y, layout);
  return cell !== null && cell !== "#";
}

export function getNeighbors(position, layout = MAZE_LAYOUT) {
  return DIRECTIONS
    .map((d) => ({
      x: position.x + d.x,
      y: position.y + d.y,
    }))
    .filter((p) => walkable(p.x, p.y, layout));
}

export function findPath(start, target, layout = MAZE_LAYOUT) {
  if (!start || !target) return [];
  if (!walkable(start.x, start.y, layout)) return [];
  if (!walkable(target.x, target.y, layout)) return [];

  const queue = [[start]];
  const visited = new Set([key(start)]);

  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (key(current) === key(target)) return path;

    for (const next of getNeighbors(current, layout)) {
      const id = key(next);

      if (visited.has(id)) continue;

      visited.add(id);
      queue.push([...path, next]);
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
      if (cell === "." || cell === "P" || cell === "G") {
        corridors.push({ x, y });
      }
    });
  });

  const eligible = corridors.filter(
    (p) => layout[p.y][p.x] === "."
  );

  const count = Math.min(
    GAME_CONFIG.specialCoinCount,
    eligible.length
  );

  const specialCoins = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(
      ((i + 1) * (eligible.length - 1)) / (count + 1)
    );

    specialCoins.push({
      ...eligible[index],
      type: "special",
    });
  }

  const specialKeys = new Set(specialCoins.map(key));

  const normalCoins = eligible
    .filter((p) => !specialKeys.has(key(p)))
    .map((p) => ({
      ...p,
      type: "normal",
    }));

  return { normalCoins, specialCoins };
}

// --------------------------------------------------
// PAC-MAN ROUTE
// --------------------------------------------------

export function createPacmanRoute(layout = MAZE_LAYOUT) {
  const { pacman } = getMazeEntities(layout);

  if (!pacman) {
    throw new Error("Pac-Man starting position is missing.");
  }

  const route = [pacman];
  const visited = new Set([key(pacman)]);

  // Depth-first traversal. Every movement is between
  // adjacent walkable cells; backtracking uses real paths.
  function traverse(current) {
    const neighbors = getNeighbors(current, layout);

    for (const next of neighbors) {
      const id = key(next);

      if (visited.has(id)) continue;

      visited.add(id);
      route.push(next);
      traverse(next);
      route.push(current);
    }
  }

  traverse(pacman);

  // A safety check: all walkable cells must be visited.
  const walkableCells = [];

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== "#") walkableCells.push({ x, y });
    });
  });

  for (const cell of walkableCells) {
    if (!visited.has(key(cell))) {
      const connection = findPath(route[route.length - 1], cell, layout);

      if (connection.length > 1) {
        route.push(...connection.slice(1));
        visited.add(key(cell));
      }
    }
  }

  return route;
}

// --------------------------------------------------
// TIMELINE
// --------------------------------------------------

export function buildSpeedTimeline(route, cellWidth = 1, cellHeight = 1) {
  if (!Array.isArray(route) || route.length < 2) {
    return {
      keyTimes: [0, 1],
      keyPoints: [0, 1],
      durationUnits: 1,
    };
  }

  const distances = [0];

  for (let i = 1; i < route.length; i++) {
    const dx = (route[i].x - route[i - 1].x) * cellWidth;
    const dy = (route[i].y - route[i - 1].y) * cellHeight;

    distances.push(
      distances[i - 1] + Math.hypot(dx, dy)
    );
  }

  const total = distances[distances.length - 1] || 1;

  const keyPoints = distances.map((d) => d / total);
  const keyTimes = route.map((_, i) =>
    i / (route.length - 1)
  );

  return {
    keyTimes,
    keyPoints,
    durationUnits: total / GAME_CONFIG.normalSpeed,
  };
}

function getFirstVisitIndexes(route) {
  const indexes = new Map();

  route.forEach((position, index) => {
    const id = key(position);

    if (!indexes.has(id)) indexes.set(id, index);
  });

  return indexes;
}

// --------------------------------------------------
// GHOST ROUTES
// --------------------------------------------------

function createGhostRoute(start, layout, ghostIndex) {
  const route = [start];
  let current = start;
  let previous = null;

  for (let step = 0; step < GAME_CONFIG.ghostSteps; step++) {
    const neighbors = getNeighbors(current, layout);

    let candidates = neighbors.filter(
      (p) => !previous || key(p) !== key(previous)
    );

    if (!candidates.length) candidates = neighbors;
    if (!candidates.length) break;

    // Deterministic movement, with a preference for
    // changing direction instead of immediately reversing.
    candidates.sort((a, b) => {
      const scoreA =
        (a.x * 17 + a.y * 29 + ghostIndex * 13 + step * 7) % 31;

      const scoreB =
        (b.x * 17 + b.y * 29 + ghostIndex * 13 + step * 7) % 31;

      return scoreA - scoreB;
    });

    const next = candidates[0];

    previous = current;
    current = next;
    route.push(current);
  }

  // Return to the starting cell so the loop joins smoothly.
  const returnPath = findPath(
    current,
    start,
    layout
  );

  if (returnPath.length > 1) {
    route.push(...returnPath.slice(1));
  }

  return route;
}

export function createGhostRoutes(layout = MAZE_LAYOUT) {
  const { ghosts } = getMazeEntities(layout);

  return ghosts.map((start, index) => ({
    id: index,
    start,
    route: createGhostRoute(start, layout, index),
    delay: index * 0.25,
  }));
}

// --------------------------------------------------
// GAME EVENTS
// --------------------------------------------------

export function createGameEvents(layout = MAZE_LAYOUT) {
  const collectibles = getCollectibles(layout);
  const route = createPacmanRoute(layout);
  const indexes = getFirstVisitIndexes(route);

  const attachIndex = (coin) => ({
    ...coin,
    routeIndex: indexes.get(key(coin)) ?? -1,
  });

  const normalCoins = collectibles.normalCoins.map(attachIndex);
  const specialCoins = collectibles.specialCoins.map(attachIndex);

  return {
    route,
    normalCoins,
    specialCoins,
    speed: buildSpeedTimeline(route),
    ghosts: createGhostRoutes(layout),
  };
}

// --------------------------------------------------
// SVG HELPERS
// --------------------------------------------------

export function toSvgPath(route, cellWidth, cellHeight) {
  if (!Array.isArray(route) || !route.length) return "";

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
  const events = createGameEvents(layout);
  const { ghosts } = getMazeEntities(layout);

  if (ghosts.length !== GAME_CONFIG.ghostCount) {
    throw new Error("The maze must contain exactly eight ghosts.");
  }

  if (events.specialCoins.length !== GAME_CONFIG.specialCoinCount) {
    throw new Error("The special coin count is invalid.");
  }

  if (!events.route.length) {
    throw new Error("Pac-Man route is empty.");
  }

  for (let i = 1; i < events.route.length; i++) {
    if (distance(events.route[i - 1], events.route[i]) !== 1) {
      throw new Error("Pac-Man route contains a discontinuity.");
    }
  }

  for (const ghost of events.ghosts) {
    if (ghost.route.length < 2) {
      throw new Error(`Ghost ${ghost.id} has no valid route.`);
    }

    for (let i = 1; i < ghost.route.length; i++) {
      if (distance(ghost.route[i - 1], ghost.route[i]) !== 1) {
        throw new Error(`Ghost ${ghost.id} route is disconnected.`);
      }
    }
  }

  return {
    valid: true,
    routeLength: events.route.length,
    normalCoinCount: events.normalCoins.length,
    specialCoinCount: events.specialCoins.length,
    ghostCount: events.ghosts.length,
  };
}

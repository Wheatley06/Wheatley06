
/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * Deterministic SVG game simulation.
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
};

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
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
      if (visited.has(key(next))) continue;

      visited.add(key(next));
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
      if (cell === ".") corridors.push({ x, y });
    });
  });

  const count = Math.min(
    GAME_CONFIG.specialCoinCount,
    corridors.length
  );

  const specialCoins = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(
      ((i + 1) * (corridors.length - 1)) / (count + 1)
    );

    specialCoins.push({
      ...corridors[index],
      type: "special",
    });
  }

  const specialKeys = new Set(specialCoins.map(key));

  const normalCoins = corridors
    .filter((p) => !specialKeys.has(key(p)))
    .map((p) => ({
      ...p,
      type: "normal",
    }));

  return {
    normalCoins,
    specialCoins,
  };
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

  function traverse(current) {
    for (const next of getNeighbors(current, layout)) {
      if (visited.has(key(next))) continue;

      visited.add(key(next));
      route.push(next);

      traverse(next);

      route.push(current);
    }
  }

  traverse(pacman);

  return route;
}

// --------------------------------------------------
// ROUTE TIMELINE
// --------------------------------------------------

function getFirstVisitIndexes(route) {
  const indexes = new Map();

  route.forEach((position, index) => {
    if (!indexes.has(key(position))) {
      indexes.set(key(position), index);
    }
  });

  return indexes;
}

function buildSpeedTimeline(route) {
  const segmentCount = Math.max(1, route.length - 1);

  const keyTimes = route.map((_, index) =>
    index / segmentCount
  );

  return {
    keyTimes,
    durationUnits: segmentCount / GAME_CONFIG.normalSpeed,
  };
}

// --------------------------------------------------
// GHOST MOVEMENT
// --------------------------------------------------

function createGhostRoute(start, layout, ghostIndex) {
  const route = [start];

  let current = start;
  let previous = null;

  for (let step = 0; step < 24; step++) {
    const options = getNeighbors(current, layout);

    const candidates = options.filter(
      (p) => !previous || key(p) !== key(previous)
    );

    const available = candidates.length
      ? candidates
      : options;

    if (!available.length) break;

    available.sort((a, b) => {
      const scoreA =
        (a.x * 7 + a.y * 11 + ghostIndex * 3 + step) % 17;

      const scoreB =
        (b.x * 7 + b.y * 11 + ghostIndex * 3 + step) % 17;

      return scoreA - scoreB;
    });

    previous = current;
    current = available[0];

    route.push(current);
  }

  return route;
}

export function createGhostRoutes(layout = MAZE_LAYOUT) {
  const { ghosts } = getMazeEntities(layout);

  return ghosts.map((start, index) => ({
    id: index,
    start,
    route: createGhostRoute(start, layout, index),
    delay: index * 0.35,
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

  const speed = buildSpeedTimeline(route);
  const ghosts = createGhostRoutes(layout);

  return {
    route,
    normalCoins,
    specialCoins,
    speed,
    ghosts,
  };
}

// --------------------------------------------------
// SVG PATH HELPERS
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
    throw new Error("The maze must contain eight ghosts.");
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

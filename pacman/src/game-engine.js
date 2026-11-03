
/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * Deterministic game simulation.
 */

import {
  MAZE_LAYOUT,
  getMazeEntities,
  getMazeCell,
} from "./maze.js";

export const GAME_CONFIG = {
  specialCoinCount: 5,
  ghostCount: 5,
  boostDuration: 12,
  boostMultiplier: 2,
  normalSpeed: 1,
  ghostSpeed: 0.5,
};

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const keyOf = ({ x, y }) => `${x},${y}`;

function isWalkable(x, y, layout = MAZE_LAYOUT) {
  const cell = getMazeCell(x, y, layout);
  return cell !== null && cell !== "#";
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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

  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (keyOf(current) === keyOf(target)) return path;

    for (const next of getNeighbors(current, layout)) {
      const key = keyOf(next);
      if (visited.has(key)) continue;

      visited.add(key);
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

  const specialKeys = new Set(specialCoins.map(keyOf));

  const normalCoins = corridors
    .filter((cell) => !specialKeys.has(keyOf(cell)))
    .map((cell) => ({ ...cell, type: "normal" }));

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
  const visited = new Set([keyOf(pacman)]);

  function traverse(current) {
    for (const next of getNeighbors(current, layout)) {
      const key = keyOf(next);
      if (visited.has(key)) continue;

      visited.add(key);
      route.push(next);

      traverse(next);

      // Backtrack to continue exploring other corridors.
      route.push(current);
    }
  }

  traverse(pacman);
  return route;
}

// --------------------------------------------------
// GHOST ESCAPE SIMULATION
// --------------------------------------------------

function chooseEscapeStep(ghost, previous, pacman, layout, ghostIndex) {
  const neighbors = getNeighbors(ghost, layout);

  const candidates = neighbors.filter(
    (next) => !previous || keyOf(next) !== keyOf(previous)
  );

  const available = candidates.length ? candidates : neighbors;

  if (!available.length) return ghost;

  return available
    .map((next) => ({
      position: next,
      distance: distance(next, pacman),
      tie: (next.x * 7 + next.y * 13 + ghostIndex * 3) % 17,
    }))
    .sort((a, b) =>
      b.distance - a.distance || a.tie - b.tie
    )[0].position;
}

function getBoostWindows(route, specialCoins) {
  const windows = [];

  for (const coin of specialCoins) {
    const index = route.findIndex(
      (position) => keyOf(position) === keyOf(coin)
    );

    if (index >= 0) {
      windows.push({
        start: index,
        end: Math.min(
          route.length - 1,
          index + GAME_CONFIG.boostDuration
        ),
      });
    }
  }

  return windows;
}

function isBoostActive(routeIndex, windows) {
  return windows.some(
    (window) =>
      routeIndex >= window.start &&
      routeIndex <= window.end
  );
}

/**
 * Precomputes ghost escape paths and capture events.
 *
 * Ghosts move away from Pac-Man. During boost periods,
 * Pac-Man advances faster and can capture nearby ghosts.
 */
export function createGhostRoutes(
  layout = MAZE_LAYOUT,
  pacmanRoute = createPacmanRoute(layout),
  specialCoins = getCollectibles(layout).specialCoins
) {
  const { ghosts } = getMazeEntities(layout);
  const boostWindows = getBoostWindows(pacmanRoute, specialCoins);

  const states = ghosts.map((start, index) => ({
    id: index,
    start,
    position: start,
    previous: null,
    capturedAt: null,
    route: [start],
  }));

  let pacmanIndex = 0;
  let tick = 0;

  const maxTicks = pacmanRoute.length * 3;

  while (
    states.some((ghost) => ghost.capturedAt === null) &&
    pacmanIndex < pacmanRoute.length - 1 &&
    tick < maxTicks
  ) {
    const boosted = isBoostActive(pacmanIndex, boostWindows);
    const pacman = pacmanRoute[pacmanIndex];

    for (const ghost of states) {
      if (ghost.capturedAt !== null) continue;

      const next = chooseEscapeStep(
        ghost.position,
        ghost.previous,
        pacman,
        layout,
        ghost.id
      );

      ghost.previous = ghost.position;
      ghost.position = next;
      ghost.route.push(next);

      // Capture is simulated only during a speed boost.
      if (boosted && distance(ghost.position, pacman) <= 1) {
        ghost.capturedAt = tick + 1;
      }
    }

    pacmanIndex += boosted
      ? GAME_CONFIG.boostMultiplier
      : GAME_CONFIG.normalSpeed;

    tick++;
  }

  return states;
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
    if (!routeIndex.has(key)) routeIndex.set(key, index);
  });

  const addRouteIndex = (coin) => ({
    ...coin,
    routeIndex: routeIndex.get(keyOf(coin)) ?? -1,
  });

  const normalCoins = collectibles.normalCoins.map(addRouteIndex);
  const specialCoins = collectibles.specialCoins.map(addRouteIndex);

  const boostWindows = getBoostWindows(route, specialCoins);

  const ghosts = createGhostRoutes(
    layout,
    route,
    collectibles.specialCoins
  );

  const capturedGhosts = ghosts.filter(
    (ghost) => ghost.capturedAt !== null
  ).length;

  return {
    route,
    normalCoins,
    specialCoins,
    boostWindows,
    ghosts,
    capturedGhosts,
    allGhostsCaptured: capturedGhosts === ghosts.length,
  };
}

// --------------------------------------------------
// SVG PATH
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
  const entities = getMazeEntities(layout);
  const events = createGameEvents(layout);

  if (entities.ghosts.length !== GAME_CONFIG.ghostCount) {
    throw new Error("The game requires exactly five ghosts.");
  }

  if (!events.route.length) {
    throw new Error("Pac-Man route is empty.");
  }

  if (events.specialCoins.length !== GAME_CONFIG.specialCoinCount) {
    throw new Error("Special coin distribution is invalid.");
  }

  for (let i = 1; i < events.route.length; i++) {
    if (distance(events.route[i - 1], events.route[i]) !== 1) {
      throw new Error("Pac-Man route contains a discontinuity.");
    }
  }

  for (const ghost of events.ghosts) {
    for (let i = 1; i < ghost.route.length; i++) {
      if (distance(ghost.route[i - 1], ghost.route[i]) > 1) {
        throw new Error(`Ghost ${ghost.id} route contains a discontinuity.`);
      }
    }
  }

  return {
    valid: true,
    routeLength: events.route.length,
    normalCoinCount: events.normalCoins.length,
    specialCoinCount: events.specialCoins.length,
    ghostCount: events.ghosts.length,
    capturedGhosts: events.capturedGhosts,
    allGhostsCaptured: events.allGhostsCaptured,
  };
}

/** WHEATLEY06 — Pac-Man game engine with synchronized ghost collisions. */

import {
  MAZE_LAYOUT,
  getMazeEntities,
  getMazeCell,
} from "./maze.js";

export const GAME_CONFIG = {
  specialCoinCount: 5,
  ghostCount: 8,

  // Movement speed, in seconds per maze cell.
  pacmanSecondsPerCell: 0.12,
  ghostSecondsPerCell: 0.22,

  collisionSamples: 3000,
  collisionRadius: 0.82,
};

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

const key = (p) => `${p.x},${p.y}`;

const distance = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const walkable = (x, y, layout) => {
  const cell = getMazeCell(x, y, layout);
  return cell !== null && cell !== "#";
};

// --------------------------------------------------
// NEIGHBORS
// --------------------------------------------------

export function getNeighbors(position, layout = MAZE_LAYOUT) {
  return DIRECTIONS
    .map((direction) => ({
      x: position.x + direction.x,
      y: position.y + direction.y,
    }))
    .filter((point) => walkable(point.x, point.y, layout));
}

// --------------------------------------------------
// SHORTEST PATH
// --------------------------------------------------

export function findPath(start, target, layout = MAZE_LAYOUT) {
  if (
    !start ||
    !target ||
    !walkable(start.x, start.y, layout) ||
    !walkable(target.x, target.y, layout)
  ) {
    return [];
  }

  const queue = [start];
  const previous = new Map([[key(start), null]]);

  while (queue.length) {
    const current = queue.shift();

    if (key(current) === key(target)) {
      break;
    }

    for (const next of getNeighbors(current, layout)) {
      if (previous.has(key(next))) continue;

      previous.set(key(next), current);
      queue.push(next);
    }
  }

  if (!previous.has(key(target))) {
    return [];
  }

  const path = [];
  let current = target;

  while (current) {
    path.push(current);
    current = previous.get(key(current));
  }

  return path.reverse();
}

// --------------------------------------------------
// COLLECTIBLES
// --------------------------------------------------

function collectWalkable(layout) {
  const cells = [];

  layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== "#") {
        cells.push({ x, y });
      }
    });
  });

  return cells;
}

export function getCollectibles(layout = MAZE_LAYOUT) {
  const entities = getMazeEntities(layout);

  const ghostKeys = new Set(
    entities.ghosts.map(key)
  );

  const corridors = collectWalkable(layout).filter(
    (point) =>
      layout[point.y][point.x] === "." &&
      !ghostKeys.has(key(point))
  );

  const count = Math.min(
    GAME_CONFIG.specialCoinCount,
    corridors.length
  );

  const specialCoins = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(
      ((i + 1) * (corridors.length - 1)) /
      (count + 1)
    );

    specialCoins.push({
      ...corridors[index],
      type: "special",
    });
  }

  const specialKeys = new Set(
    specialCoins.map(key)
  );

  const normalCoins = corridors
    .filter((point) => !specialKeys.has(key(point)))
    .map((point) => ({
      ...point,
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

  function visit(current) {
    const neighbors = getNeighbors(current, layout);

    for (const next of neighbors) {
      if (visited.has(key(next))) continue;

      visited.add(key(next));
      route.push(next);

      visit(next);

      route.push(current);
    }
  }

  visit(pacman);

  return route;
}

// --------------------------------------------------
// ROUTE METRICS
// --------------------------------------------------

function createRouteMetrics(route) {
  const cumulative = [0];

  for (let i = 1; i < route.length; i++) {
    cumulative.push(
      cumulative[i - 1] +
      distance(route[i - 1], route[i])
    );
  }

  return {
    route,
    cumulative,
    total: cumulative[cumulative.length - 1] || 1,
  };
}

function getPositionAtFraction(metrics, fraction) {
  const target = Math.max(
    0,
    Math.min(1, fraction)
  ) * metrics.total;

  for (let i = 1; i < metrics.cumulative.length; i++) {
    if (metrics.cumulative[i] >= target) {
      const segmentStart = metrics.cumulative[i - 1];
      const segmentLength =
        metrics.cumulative[i] - segmentStart;

      const progress = segmentLength > 0
        ? (target - segmentStart) / segmentLength
        : 0;

      const a = metrics.route[i - 1];
      const b = metrics.route[i];

      return {
        x: a.x + (b.x - a.x) * progress,
        y: a.y + (b.y - a.y) * progress,
      };
    }
  }

  return metrics.route[metrics.route.length - 1];
}

// --------------------------------------------------
// GHOST ROUTES
// --------------------------------------------------

function createGhostRoute(start, layout, index) {
  const route = [start];

  let current = start;
  let previous = null;

  for (let step = 0; step < 18; step++) {
    let options = getNeighbors(current, layout)
      .filter(
        (point) =>
          !previous ||
          key(point) !== key(previous)
      );

    if (!options.length) {
      options = getNeighbors(current, layout);
    }

    if (!options.length) break;

    options.sort((a, b) => {
      const scoreA =
        (a.x * 13 + a.y * 7 + index * 11 + step * 5) % 31;

      const scoreB =
        (b.x * 13 + b.y * 7 + index * 11 + step * 5) % 31;

      return scoreA - scoreB;
    });

    previous = current;
    current = options[0];

    route.push(current);
  }

  // Close the route so the ghost returns to its starting point.
  const home = findPath(current, start, layout);

  if (home.length > 1) {
    route.push(...home.slice(1));
  }

  return route;
}

export function createGhostRoutes(layout = MAZE_LAYOUT) {
  const { ghosts } = getMazeEntities(layout);

  return ghosts.map((start, index) => ({
    id: index,
    start,
    route: createGhostRoute(start, layout, index),

    // All ghosts start simultaneously.
    delay: 0,
  }));
}

// --------------------------------------------------
// COLLISION DETECTION
// --------------------------------------------------

function findFirstCollision(
  pacmanMetrics,
  ghostMetrics,
  pacmanDuration,
  ghostDuration
) {
  const samples = GAME_CONFIG.collisionSamples;
  const threshold = GAME_CONFIG.collisionRadius;

  for (let i = 1; i <= samples; i++) {
    const time = (i / samples) * pacmanDuration;

    const pacmanFraction = time / pacmanDuration;
    const ghostFraction =
      (time % ghostDuration) / ghostDuration;

    const pacmanPosition = getPositionAtFraction(
      pacmanMetrics,
      pacmanFraction
    );

    const ghostPosition = getPositionAtFraction(
      ghostMetrics,
      ghostFraction
    );

    if (
      distance(pacmanPosition, ghostPosition) <= threshold
    ) {
      return {
        fraction: pacmanFraction,
        position: ghostPosition,
        pacmanPosition,
      };
    }
  }

  return null;
}

// --------------------------------------------------
// GAME EVENTS
// --------------------------------------------------

function getFirstVisitIndexes(route) {
  const indexes = new Map();

  route.forEach((point, index) => {
    if (!indexes.has(key(point))) {
      indexes.set(key(point), index);
    }
  });

  return indexes;
}

export function createGameEvents(layout = MAZE_LAYOUT) {
  const collectibles = getCollectibles(layout);
  const route = createPacmanRoute(layout);

  const duration = Math.max(
    24,
    route.length * GAME_CONFIG.pacmanSecondsPerCell
  );

  const indexes = getFirstVisitIndexes(route);

  const attachRouteIndex = (coin) => ({
    ...coin,
    routeIndex: indexes.get(key(coin)) ?? -1,
  });

  const normalCoins = collectibles.normalCoins.map(
    attachRouteIndex
  );

  const specialCoins = collectibles.specialCoins.map(
    attachRouteIndex
  );

  const pacmanMetrics = createRouteMetrics(route);

  const ghosts = createGhostRoutes(layout).map((ghost) => {
    const ghostMetrics = createRouteMetrics(ghost.route);

    const ghostDuration = Math.max(
      4,
      ghostMetrics.total * GAME_CONFIG.ghostSecondsPerCell
    );

    const collision = findFirstCollision(
      pacmanMetrics,
      ghostMetrics,
      duration,
      ghostDuration
    );

    return {
      ...ghost,
      duration: ghostDuration,
      collision,
    };
  });

  return {
    route,
    normalCoins,
    specialCoins,
    ghosts,

    speed: {
      duration,
      secondsPerCell: GAME_CONFIG.pacmanSecondsPerCell,
    },
  };
}
// --------------------------------------------------
// SVG PATH
// --------------------------------------------------

export function toSvgPath(route, cellWidth, cellHeight) {
  if (!Array.isArray(route) || !route.length) {
    return "";
  }

  return route
    .map((point, index) => {
      const x = point.x * cellWidth + cellWidth / 2;
      const y = point.y * cellHeight + cellHeight / 2;

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
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

  if (
    events.specialCoins.length !==
    GAME_CONFIG.specialCoinCount
  ) {
    throw new Error("The special coin count is invalid.");
  }

  if (events.route.length < 2) {
    throw new Error("Pac-Man route is too short.");
  }

  for (let i = 1; i < events.route.length; i++) {
    if (distance(events.route[i - 1], events.route[i]) !== 1) {
      throw new Error("Pac-Man route contains a discontinuity.");
    }
  }

  for (const ghost of events.ghosts) {
    if (ghost.route.length < 2) {
      throw new Error(`Ghost ${ghost.id} route is too short.`);
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
    collisionCount: events.ghosts.filter(
      (ghost) => ghost.collision
    ).length,
  };
}

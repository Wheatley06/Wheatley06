
import assert from "node:assert/strict";

import {
  GAME_CONFIG,
  getNeighbors,
  findPath,
  getCollectibles,
  createPacmanRoute,
  createGhostRoutes,
  createGameEvents,
  toSvgPath,
  validateGameEngine,
} from "../src/game-engine.js";

import {
  MAZE_LAYOUT,
  getMazeEntities,
  getMazeCell,
} from "../src/maze.js";

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

function testGameEngineValidation() {
  const result = validateGameEngine();

  assert.equal(result.valid, true);
  assert.equal(result.ghostCount, 8);
  assert.equal(
    result.specialCoinCount,
    GAME_CONFIG.specialCoinCount
  );
  assert.ok(result.routeLength > 0);

  console.log("✓ Game engine validation");
}

// --------------------------------------------------
// NAVIGATION
// --------------------------------------------------

function testNeighbors() {
  const entities = getMazeEntities();

  const neighbors = getNeighbors(entities.pacman);

  assert.ok(neighbors.length > 0);

  for (const position of neighbors) {
    assert.notEqual(
      getMazeCell(position.x, position.y),
      "#"
    );
  }

  console.log("✓ Walkable neighbor detection");
}

function testPathfinding() {
  const entities = getMazeEntities();
  const target = entities.ghosts[0];

  const path = findPath(entities.pacman, target);

  assert.ok(path.length > 1);

  assert.deepEqual(path[0], entities.pacman);
  assert.deepEqual(path[path.length - 1], target);

  for (const position of path) {
    assert.notEqual(
      getMazeCell(position.x, position.y),
      "#"
    );
  }

  console.log("✓ Shortest path calculation");
}

// --------------------------------------------------
// COLLECTIBLES
// --------------------------------------------------

function testCollectibles() {
  const collectibles = getCollectibles();

  assert.equal(
    collectibles.specialCoins.length,
    GAME_CONFIG.specialCoinCount
  );

  assert.ok(collectibles.normalCoins.length > 0);

  const allCoins = [
    ...collectibles.normalCoins,
    ...collectibles.specialCoins,
  ];

  const uniquePositions = new Set(
    allCoins.map(({ x, y }) => `${x},${y}`)
  );

  assert.equal(uniquePositions.size, allCoins.length);

  console.log("✓ Normal and special coin distribution");
}

// --------------------------------------------------
// PAC-MAN ROUTE
// --------------------------------------------------

function testPacmanRoute() {
  const route = createPacmanRoute();

  assert.ok(route.length > 0);

  for (const position of route) {
    assert.notEqual(
      getMazeCell(position.x, position.y),
      "#"
    );
  }

  for (let index = 1; index < route.length; index++) {
    const previous = route[index - 1];
    const current = route[index];

    const distance =
      Math.abs(current.x - previous.x) +
      Math.abs(current.y - previous.y);

    assert.equal(distance, 1);
  }

  console.log("✓ Pac-Man route continuity");
}

// --------------------------------------------------
// GHOSTS
// --------------------------------------------------

function testGhostRoutes() {
  const routes = createGhostRoutes();

  assert.equal(routes.length, 8);

  for (const ghost of routes) {
    assert.ok(ghost.route.length > 0);

    assert.equal(
      ghost.route[0].x,
      ghost.start.x
    );

    assert.equal(
      ghost.route[0].y,
      ghost.start.y
    );
  }

  console.log("✓ Eight ghost routes");
}

// --------------------------------------------------
// GAME EVENTS
// --------------------------------------------------

function testGameEvents() {
  const events = createGameEvents();

  assert.ok(events.route.length > 0);

  assert.equal(
    events.specialCoins.length,
    GAME_CONFIG.specialCoinCount
  );

  assert.equal(events.ghosts.length, 8);

  // Ghosts must not be captured or removed.
  assert.equal(events.capturedGhosts, undefined);
  assert.equal(events.allGhostsCaptured, undefined);

  console.log("✓ Game event generation");
  console.log("✓ Eight ghosts without capture mechanics");
}

// --------------------------------------------------
// SVG PATH
// --------------------------------------------------

function testSvgPath() {
  const route = [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ];

  const path = toSvgPath(route, 10, 10);

  assert.match(path, /^M /);
  assert.match(path, /L /);
  assert.ok(path.includes("15 15"));

  console.log("✓ SVG path conversion");
}

// --------------------------------------------------
// RUN
// --------------------------------------------------

function runTests() {
  console.log("\nPAC-MAN GAME ENGINE TESTS\n");

  testGameEngineValidation();
  testNeighbors();
  testPathfinding();
  testCollectibles();
  testPacmanRoute();
  testGhostRoutes();
  testGameEvents();
  testSvgPath();

  console.log("\nALL GAME ENGINE TESTS PASSED\n");
}

try {
  runTests();
} catch (error) {
  console.error("\nGAME ENGINE TEST FAILED:");
  console.error(error);
  process.exitCode = 1;
}

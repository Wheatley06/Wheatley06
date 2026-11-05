
import assert from "node:assert/strict";

import { renderPacmanSvg } from "./renderer.js";
import {
  createGameEvents,
  validateGameEngine,
} from "./game-engine.js";
import { MAZE_LAYOUT } from "./maze.js";

// --------------------------------------------------
// SVG DOCUMENT
// --------------------------------------------------

function testSvgDocument() {
  const svg = renderPacmanSvg();

  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("</svg>"));
  assert.ok(svg.includes('width="1200"'));
  assert.ok(svg.includes('height="480"'));

  console.log("✓ SVG document and dimensions");
}

// --------------------------------------------------
// VISUAL IDENTITY
// --------------------------------------------------

function testVisualIdentity() {
  const svg = renderPacmanSvg();

  assert.ok(svg.includes("WHEATLEY06"));
  assert.ok(svg.includes("CONTRIBUTION MATRIX"));
  assert.ok(svg.includes("#0D1117"));
  assert.ok(svg.includes("PAC-MAN CONTRIBUTIONS"));

  console.log("✓ Cyberpunk visual identity");
}

// --------------------------------------------------
// GAME ENGINE
// --------------------------------------------------

function testGameEngine() {
  const result = validateGameEngine();

  assert.equal(result.valid, true);
  assert.equal(result.ghostCount, 8);
  assert.equal(result.specialCoinCount, 5);
  assert.ok(result.routeLength > 0);

  console.log("✓ Game engine and connected routes");
}

// --------------------------------------------------
// ANIMATED ROUTES
// --------------------------------------------------

function testAnimatedRoutes() {
  const svg = renderPacmanSvg();
  const events = createGameEvents();

  assert.ok(events.route.length > 0);
  assert.equal(events.ghosts.length, 8);
  assert.ok(svg.includes("<animateMotion"));

  const motionCount = (
    svg.match(/<animateMotion/g) || []
  ).length;

  assert.ok(
    motionCount >= 9,
    `Expected at least nine motion animations; found ${motionCount}`
  );

  console.log("✓ Pac-Man and eight ghost movements");
}

// --------------------------------------------------
// GHOSTS
// --------------------------------------------------

function testGhosts() {
  const events = createGameEvents();
  const svg = renderPacmanSvg();

  assert.equal(events.ghosts.length, 8);

  for (const ghost of events.ghosts) {
    assert.ok(ghost.route.length > 0);
  }

  // Ghost capture mechanics must not exist.
  assert.equal(events.capturedGhosts, undefined);
  assert.equal(events.allGhostsCaptured, undefined);

  console.log("✓ Eight ghosts with continuous movement");
  console.log("✓ No ghost capture mechanics");
}

// --------------------------------------------------
// GHOST COLORS
// --------------------------------------------------

function testGhostColors() {
  const svg = renderPacmanSvg();

  for (const color of [
    "#FF4B75",
    "#00E5FF",
    "#FFB84D",
    "#B66DFF",
    "#FF6BCE",
  ]) {
    assert.ok(
      svg.includes(color),
      `Missing ghost color: ${color}`
    );
  }

  console.log("✓ Ghost color palette");
}

// --------------------------------------------------
// COLLECTIBLES
// --------------------------------------------------

function testCollectibles() {
  const events = createGameEvents();
  const svg = renderPacmanSvg();

  assert.equal(events.specialCoins.length, 5);
  assert.ok(events.normalCoins.length > 0);

  assert.ok(svg.includes("#FFE58A"));
  assert.ok(svg.includes("#FFD166"));

  assert.ok(
    svg.includes('attributeName="opacity"')
  );

  console.log("✓ Normal and special collectible rendering");
}

// --------------------------------------------------
// NO BOOST EFFECTS
// --------------------------------------------------

function testNoBoostEffects() {
  const events = createGameEvents();
  const svg = renderPacmanSvg();

  assert.equal(events.boostWindows, undefined);
  assert.equal(events.speedBoost, undefined);

  // There should be no speed boost animation.
  assert.ok(!svg.includes("SPEED BOOST"));

  console.log("✓ Special coins have no boost effects");
}

// --------------------------------------------------
// CONTRIBUTION RENDERING
// --------------------------------------------------

function testContributionRendering() {
  const svg = renderPacmanSvg([]);

  assert.ok(svg.includes("PAC-MAN CONTRIBUTIONS"));
  assert.ok(svg.includes("#39D353"));

  console.log("✓ Contribution rendering");
}

// --------------------------------------------------
// SVG INTEGRITY
// --------------------------------------------------

function testSvgIntegrity() {
  const svg = renderPacmanSvg([]);

  assert.ok(!svg.includes("NaN"));
  assert.ok(!svg.includes("undefined"));
  assert.ok(!svg.includes("[object Object]"));

  console.log("✓ SVG output integrity");
}

// --------------------------------------------------
// MAZE
// --------------------------------------------------

function testMazeGhostCount() {
  const ghostCount = MAZE_LAYOUT
    .join("")
    .split("G")
    .length - 1;

  assert.equal(ghostCount, 8);

  console.log("✓ Maze contains exactly eight ghosts");
}

// --------------------------------------------------
// RUN
// --------------------------------------------------

function runTests() {
  console.log("\nPAC-MAN CONSOLIDATED TESTS\n");

  testSvgDocument();
  testVisualIdentity();
  testGameEngine();
  testAnimatedRoutes();
  testGhosts();
  testGhostColors();
  testCollectibles();
  testNoBoostEffects();
  testContributionRendering();
  testSvgIntegrity();
  testMazeGhostCount();

  console.log("\nALL PAC-MAN TESTS PASSED\n");
}

try {
  runTests();
} catch (error) {
  console.error("\nPAC-MAN TEST FAILED:");
  console.error(error);
  process.exitCode = 1;
}


import assert from "node:assert/strict";

import { renderPacmanSvg } from "./renderer.js";
import {
  createGameEvents,
  validateGameEngine,
} from "./game-engine.js";
import { MAZE_LAYOUT } from "./maze.js";

function testSvgDocument() {
  const svg = renderPacmanSvg();

  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("</svg>"));
  assert.ok(svg.includes('width="1200"'));
  assert.ok(svg.includes('height="480"'));

  console.log("✓ SVG document and dimensions");
}

function testVisualIdentity() {
  const svg = renderPacmanSvg();

  assert.ok(svg.includes("WHEATLEY06"));
  assert.ok(svg.includes("CONTRIBUTION MATRIX"));
  assert.ok(svg.includes("#0D1117"));

  console.log("✓ Cyberpunk visual identity");
}

function testGameEngine() {
  const result = validateGameEngine(MAZE_LAYOUT);

  assert.equal(result.valid, true);
  assert.equal(result.ghostCount, 5);
  assert.equal(result.specialCoinCount, 5);
  assert.ok(result.routeLength > 0);

  console.log("✓ Game engine and connected routes");
}

function testAnimatedRoutes() {
  const svg = renderPacmanSvg();
  const events = createGameEvents(MAZE_LAYOUT);

  assert.ok(events.route.length > 0);
  assert.equal(events.ghosts.length, 5);
  assert.ok(svg.includes("<animateMotion"));

  const motionCount = (svg.match(/<animateMotion/g) || []).length;

  assert.ok(
    motionCount >= 6,
    `Expected at least six motion animations; found ${motionCount}`
  );

  console.log("✓ Pac-Man and ghost movement");
}

function testGhostColors() {
  const svg = renderPacmanSvg();

  for (const color of [
    "#00CFFF",
    "#8B35FF",
    "#D946EF",
    "#FF5C8A",
    "#35E6A5",
  ]) {
    assert.ok(svg.includes(color), `Missing ghost color: ${color}`);
  }

  console.log("✓ Five distinct ghost colors");
}

function testBoostAndCaptureEvents() {
  const events = createGameEvents(MAZE_LAYOUT);

  assert.equal(events.specialCoins.length, 5);
  assert.equal(events.ghosts.length, 5);
  assert.ok(events.boostWindows.length > 0);

  for (const ghost of events.ghosts) {
    assert.ok(ghost.route.length > 0);
    assert.ok(ghost.captureIndex >= 0);
  }

  console.log("✓ Boost windows and ghost capture timeline");
}

function testContributionRendering() {
  const contributions = [
    { date: "2026-10-01", count: 0 },
    { date: "2026-10-02", count: 2 },
    { date: "2026-10-03", count: 5 },
    { date: "2026-10-04", count: 8 },
    { date: "2026-10-05", count: 12 },
  ];

  const svg = renderPacmanSvg({ contributions });

  for (const day of contributions) {
    assert.ok(svg.includes(day.date));
  }

  assert.ok(svg.includes("CONTRIBUTIONS"));

  console.log("✓ Contribution cells inside maze corridors");
}

function testCollectibles() {
  const svg = renderPacmanSvg();

  assert.ok(svg.includes("#FFE600"));
  assert.ok(svg.includes("attributeName=\"opacity\""));
  assert.ok(svg.includes("attributeName=\"r\""));

  console.log("✓ Normal and special collectible animations");
}

function testSvgIntegrity() {
  const svg = renderPacmanSvg({
    contributions: [
      { date: "2026-10-01", count: 3 },
      { date: "2026-10-02", count: 0 },
    ],
  });

  assert.ok(!svg.includes("NaN"));
  assert.ok(!svg.includes("undefined"));
  assert.ok(!svg.includes("[object Object]"));

  console.log("✓ SVG output integrity");
}

function runTests() {
  console.log("\nPAC-MAN CONSOLIDATED TESTS\n");

  testSvgDocument();
  testVisualIdentity();
  testGameEngine();
  testAnimatedRoutes();
  testGhostColors();
  testBoostAndCaptureEvents();
  testContributionRendering();
  testCollectibles();
  testSvgIntegrity();

  console.log("\nALL PAC-MAN TESTS PASSED\n");
}

try {
  runTests();
} catch (error) {
  console.error("\nPAC-MAN TEST FAILED:");
  console.error(error);
  process.exitCode = 1;
}

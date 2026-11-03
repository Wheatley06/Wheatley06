
import assert from "node:assert/strict";

import {
  MAZE_LAYOUT,
  MAZE_CONFIG,
  validateMaze,
  getMazeEntities,
  getMazeDimensions,
} from "./maze.js";

import { renderPacmanSvg } from "./renderer.js";

// --------------------------------------------------
// MOCK CONTRIBUTIONS
// --------------------------------------------------

function createMockContributions() {
  const days = [];
  const startDate = new Date("2025-11-03T12:00:00Z");

  for (let i = 0; i < 371; i++) {
    const date = new Date(startDate);

    date.setUTCDate(startDate.getUTCDate() + i);

    const count =
      i % 11 === 0
        ? 0
        : (i * 7 + Math.floor(i / 9)) % 15;

    days.push({
      date: date.toISOString().slice(0, 10),
      count,
    });
  }

  return days;
}

// --------------------------------------------------
// MAZE TESTS
// --------------------------------------------------

function testMaze() {
  const validation = validateMaze();
  const entities = getMazeEntities();
  const dimensions = getMazeDimensions();

  assert.equal(validation.valid, true);

  assert.equal(dimensions.columns, 50);
  assert.equal(dimensions.rows, 13);

  assert.equal(
    dimensions.width,
    50 * MAZE_CONFIG.cellSize
  );

  assert.equal(
    dimensions.height,
    13 * MAZE_CONFIG.cellSize
  );

  assert.ok(entities.pacman);
  assert.equal(entities.ghosts.length, 5);

  assert.equal(MAZE_LAYOUT.length, 13);

  console.log("✓ Extended maze: 50 x 13");
  console.log("✓ Five ghost positions");
}

// --------------------------------------------------
// RENDERER TEST
// --------------------------------------------------

function testRenderer() {
  const contributions = createMockContributions();

  const svg = renderPacmanSvg({
    contributions,
  });

  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("</svg>"));

  assert.ok(svg.includes("PAC-MAN"));
  assert.ok(svg.includes("ONLINE"));
  assert.ok(svg.includes("<animate"));

  assert.ok(svg.includes("contributions"));
  assert.ok(svg.includes("2025-11-03"));

  console.log("✓ SVG renderer");
  console.log(`✓ Generated SVG size: ${svg.length} characters`);
}

// --------------------------------------------------
// EMPTY CONTRIBUTIONS
// --------------------------------------------------

function testEmptyContributions() {
  const svg = renderPacmanSvg({
    contributions: [],
  });

  assert.ok(svg.includes("<svg"));
  assert.ok(svg.includes("</svg>"));

  console.log("✓ Empty contributions handling");
}

// --------------------------------------------------
// RUN TESTS
// --------------------------------------------------

function runTests() {
  console.log("\nPAC-MAN RENDERER TESTS\n");

  testMaze();
  testRenderer();
  testEmptyContributions();

  console.log("\nALL RENDERER TESTS PASSED\n");
}

try {
  runTests();
} catch (error) {
  console.error("\nRENDERER TEST FAILED:");
  console.error(error);

  process.exitCode = 1;
}

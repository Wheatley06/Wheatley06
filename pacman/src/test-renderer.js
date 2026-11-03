
/**
 * WHEATLEY06 — PAC-MAN CYBERPUNK
 * Offline renderer validation.
 *
 * Uses simulated contribution data.
 * Does not require a GitHub token or API connection.
 */

import assert from "node:assert/strict";

import {
  MAZE_LAYOUT,
  validateMaze,
  getMazeEntities,
  getMazeDimensions,
} from "./maze.js";

import { renderPacmanSvg } from "./renderer.js";

// --------------------------------------------------
// SIMULATED CONTRIBUTIONS
// --------------------------------------------------

function createMockContributions() {
  const days = [];
  const startDate = new Date("2025-11-03T12:00:00Z");

  for (let i = 0; i < 371; i++) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + i);

    // Simulated activity with varied intensity.
    const count = i % 11 === 0
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
// TESTS
// --------------------------------------------------

function testMaze() {
  console.log("Testing maze...");

  const result = validateMaze(MAZE_LAYOUT);

  assert.equal(result.valid, true);
  assert.equal(result.columns, 28);
  assert.equal(result.rows, 13);

  const entities = getMazeEntities(MAZE_LAYOUT);

  assert.ok(entities.pacman, "Pac-Man position must exist.");
  assert.ok(entities.ghosts.length > 0, "At least one ghost must exist.");

  const dimensions = getMazeDimensions(MAZE_LAYOUT);

  assert.equal(dimensions.columns, 28);
  assert.equal(dimensions.rows, 13);
  assert.ok(dimensions.width > 0);
  assert.ok(dimensions.height > 0);

  console.log("Maze: OK");
}

function testRenderer() {
  console.log("Testing SVG renderer...");

  const contributions = createMockContributions();

  const svg = renderPacmanSvg({
    contributions,
  });

  assert.ok(svg.startsWith("<svg"), "SVG opening tag is missing.");
  assert.ok(svg.includes("</svg>"), "SVG closing tag is missing.");

  assert.ok(svg.includes("PAC-MAN"), "Pac-Man title is missing.");
  assert.ok(svg.includes("ONLINE"), "System status is missing.");

  assert.ok(svg.includes("<animate"), "SVG animations are missing.");

  assert.ok(
    svg.includes("contributions"),
    "Contribution information is missing."
  );

  assert.ok(
    svg.includes("2025-11-03"),
    "Contribution date is missing."
  );

  console.log("SVG renderer: OK");
  console.log(`Generated SVG size: ${svg.length.toLocaleString()} characters`);

  return svg;
}

function testEmptyContributions() {
  console.log("Testing empty contribution data...");

  const svg = renderPacmanSvg({
    contributions: [],
  });

  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("</svg>"));

  console.log("Empty contributions: OK");
}

// --------------------------------------------------
// RUN
// --------------------------------------------------

function runTests() {
  console.log("");
  console.log("======================================");
  console.log(" PAC-MAN OFFLINE RENDERER TESTS");
  console.log("======================================");

  try {
    testMaze();
    testRenderer();
    testEmptyContributions();

    console.log("");
    console.log("======================================");
    console.log(" ALL TESTS PASSED");
    console.log("======================================");
  } catch (error) {
    console.error("");
    console.error("TEST FAILED:");
    console.error(error);
    process.exitCode = 1;
  }
}

runTests();


import assert from "node:assert/strict";

import {
  MAZE_CONFIG,
  MAZE_LAYOUT,
  validateMaze,
  getMazeCell,
  getMazeEntities,
  getWallSegments,
  getMazeDimensions,
} from "../src/maze.js";

// MAZE VALIDATION

function testMazeValidation() {
  const result = validateMaze();

  assert.equal(result.valid, true);
  assert.equal(result.columns, 50);
  assert.equal(result.rows, 13);
  assert.equal(result.ghostCount, 5);

  console.log("✓ Maze validation");
}

// MAZE DIMENSIONS

function testMazeDimensions() {
  const dimensions = getMazeDimensions();

  assert.equal(dimensions.columns, 50);
  assert.equal(dimensions.rows, 13);

  assert.equal(dimensions.width, 50 * MAZE_CONFIG.cellSize);
  assert.equal(dimensions.height, 13 * MAZE_CONFIG.cellSize);

  console.log("✓ Maze dimensions");
}

// MAZE ENTITIES

function testMazeEntities() {
  const entities = getMazeEntities();

  assert.ok(entities.pacman);
  assert.equal(entities.ghosts.length, 5);

  console.log("✓ Pac-Man and five ghosts");
}

// MAZE CELLS

function testMazeCells() {
  assert.equal(getMazeCell(0, 0), "#");
  assert.equal(getMazeCell(1, 1), "P");

  assert.equal(getMazeCell(-1, 0), null);
  assert.equal(getMazeCell(0, -1), null);
  assert.equal(getMazeCell(50, 0), null);
  assert.equal(getMazeCell(0, 13), null);

  console.log("✓ Maze cell access");
}

// WALL SEGMENTS

function testWallSegments() {
  const walls = getWallSegments();

  assert.ok(walls.length > 0);
  assert.ok(walls.every((wall) => wall.type === "wall"));

  console.log("✓ Wall segments");
}

// INVALID MAZE

function testInvalidMaze() {
  assert.throws(
    () => validateMaze(["###", "#P#", "##"]),
    /same width/
  );

  console.log("✓ Invalid maze detection");
}

// RUN TESTS

function runTests() {
  console.log("\nPAC-MAN MAZE TESTS\n");

  testMazeValidation();
  testMazeDimensions();
  testMazeEntities();
  testMazeCells();
  testWallSegments();
  testInvalidMaze();

  console.log("\nALL MAZE TESTS PASSED\n");
}

try {
  runTests();
} catch (error) {
  console.error("\nMAZE TEST FAILED:");
  console.error(error);
  process.exitCode = 1;
}


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

function testMazeValidation() {
  const result = validateMaze();

  assert.equal(result.valid, true);
  assert.equal(result.columns, MAZE_CONFIG.columns);
  assert.equal(result.rows, MAZE_CONFIG.rows);

  console.log("✓ Maze validation");
}

function testMazeDimensions() {
  const dimensions = getMazeDimensions();

  assert.equal(dimensions.columns, 28);
  assert.equal(dimensions.rows, 13);
  assert.equal(
    dimensions.width,
    28 * MAZE_CONFIG.cellSize
  );
  assert.equal(
    dimensions.height,
    13 * MAZE_CONFIG.cellSize
  );

  console.log("✓ Maze dimensions");
}

function testMazeEntities() {
  const entities = getMazeEntities();

  assert.ok(entities.pacman);
  assert.ok(entities.ghosts.length >= 1);

  console.log("✓ Maze entities");
}

function testMazeCells() {
  assert.equal(getMazeCell(0, 0), "#");
  assert.equal(getMazeCell(-1, 0), null);
  assert.equal(getMazeCell(0, -1), null);

  console.log("✓ Maze cell access");
}

function testWallSegments() {
  const walls = getWallSegments();

  assert.ok(walls.length > 0);
  assert.ok(walls.every((wall) => wall.type === "wall"));

  console.log("✓ Wall segments");
}

function testInvalidMaze() {
  assert.throws(
    () => validateMaze(["###", "#P#", "##"]),
    /same width/
  );

  console.log("✓ Invalid maze detection");
}

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

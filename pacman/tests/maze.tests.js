import assert from "node:assert/strict";

import {
  MAZE_LAYOUT,
  validateMaze,
  getMazeEntities,
  getMazeDimensions,
} from "../src/maze.js";

const validation = validateMaze();

assert.equal(validation.valid, true);
assert.equal(validation.rows, MAZE_LAYOUT.length);

const entities = getMazeEntities();

assert.ok(entities.pacman, "Pac-Man must have a starting position");
assert.ok(entities.ghosts.length > 0, "Ghosts must exist");

const dimensions = getMazeDimensions();

assert.ok(dimensions.width > 0);
assert.ok(dimensions.height > 0);

console.log("PAC-MAN MAZE TESTS: PASSED");
console.log("Dimensions:", dimensions);
console.log("Ghosts:", entities.ghosts.length);

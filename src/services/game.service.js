"use strict";
const { v4: uuidv4 } = require("uuid");
const Game = require("../models/Game");

// Generate non-overlapping rectangles that tile the board
function generateRectangles(width, height) {
  const grid = Array.from({ length: height }, () => new Array(width).fill(null));
  const rectangles = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] !== null) continue;

      // Try to place a rectangle starting here
      const maxW = Math.min(3, width - col);
      const maxH = Math.min(3, height - row);

      // Pick a random width and height that fits without overlap
      let placed = false;
      const tries = [];
      for (let w = 1; w <= maxW; w++) {
        for (let h = 1; h <= maxH; h++) {
          tries.push([w, h]);
        }
      }
      // Shuffle tries
      for (let i = tries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tries[i], tries[j]] = [tries[j], tries[i]];
      }

      for (const [w, h] of tries) {
        // Check if all cells in this rectangle are free
        let canPlace = true;
        for (let r = row; r < row + h && canPlace; r++) {
          for (let c = col; c < col + w && canPlace; c++) {
            if (grid[r][c] !== null) canPlace = false;
          }
        }
        if (!canPlace) continue;

        const id = uuidv4();
        // Mark grid
        for (let r = row; r < row + h; r++) {
          for (let c = col; c < col + w; c++) {
            grid[r][c] = id;
          }
        }
        rectangles.push({ id, x: col, y: row, width: w, height: h, locked: false, clueValue: w * h, selected: false });
        placed = true;
        break;
      }

      // Fallback: 1x1 if nothing fit (shouldn't happen but safe)
      if (!placed) {
        const id = uuidv4();
        grid[row][col] = id;
        rectangles.push({ id, x: col, y: row, width: 1, height: 1, locked: false, clueValue: 1, selected: false });
      }
    }
  }

  return rectangles;
}

// Build clues: one clue per rectangle, placed at a random cell inside it
function buildClues(rectangles) {
  return rectangles.map((rect) => {
    const row = rect.y + Math.floor(Math.random() * rect.height);
    const col = rect.x + Math.floor(Math.random() * rect.width);
    return { row, col, value: rect.clueValue };
  });
}

async function initBoard(width, height) {
  const boardId = uuidv4();
  const rectangles = generateRectangles(width, height);
  const clues = buildClues(rectangles);

  // For initial board we hide rectangles (player must place them)
  // We store the solution rectangles but return only clues to the client
  const game = await Game.create({
    boardId,
    width,
    height,
    clues,
    rectangles,
    startTime: new Date()
  });

  return game;
}

async function getBoard(boardId) {
  const game = await Game.findOne({ boardId });
  if (!game) {
    const err = new Error("Board not found");
    err.status = 404;
    throw err;
  }
  return game;
}

async function generateNewRectangles(boardId) {
  const game = await getBoard(boardId);
  const rectangles = generateRectangles(game.width, game.height);
  const clues = buildClues(rectangles);
  game.rectangles = rectangles;
  game.clues = clues;
  game.solved = false;
  game.selectedRectangleId = null;
  await game.save();
  return { rectangles, clues };
}

async function selectRectangle(boardId, rectangleId) {
  const game = await getBoard(boardId);
  const rect = game.rectangles.find((r) => r.id === rectangleId);
  if (!rect) {
    const err = new Error("Rectangle not found");
    err.status = 404;
    throw err;
  }
  if (rect.locked) {
    const err = new Error("Rectangle is already locked");
    err.status = 400;
    throw err;
  }
  // Deselect previous
  game.rectangles.forEach((r) => { r.selected = false; });
  rect.selected = true;
  game.selectedRectangleId = rectangleId;
  await game.save();
  return rect;
}

async function snapAndLock(boardId, rectangleId) {
  const game = await getBoard(boardId);
  const rect = game.rectangles.find((r) => r.id === rectangleId);
  if (!rect) {
    const err = new Error("Rectangle not found");
    err.status = 404;
    throw err;
  }
  rect.locked = true;
  rect.selected = false;
  game.selectedRectangleId = null;
  await game.save();
  return { rectangle: rect, boardState: game };
}

async function checkWinCondition(boardId) {
  const game = await getBoard(boardId);
  const allLocked = game.rectangles.every((r) => r.locked);
  if (allLocked) {
    game.solved = true;
    game.endTime = new Date();
    await game.save();
    const elapsed = Math.floor((game.endTime - game.startTime) / 1000);
    return { solved: true, message: "Congratulations! Puzzle solved!", elapsedSeconds: elapsed };
  }
  const remaining = game.rectangles.filter((r) => !r.locked).length;
  return { solved: false, message: `${remaining} rectangle(s) not yet locked.` };
}

async function resetGame(boardId) {
  const game = await getBoard(boardId);
  const rectangles = generateRectangles(game.width, game.height);
  const clues = buildClues(rectangles);
  game.rectangles = rectangles;
  game.clues = clues;
  game.solved = false;
  game.selectedRectangleId = null;
  game.startTime = new Date();
  game.endTime = null;
  await game.save();
  return game;
}

async function stopTimer(boardId) {
  const game = await getBoard(boardId);
  const now = new Date();
  const elapsed = Math.floor((now - game.startTime) / 1000);
  game.endTime = now;
  await game.save();
  return { elapsedSeconds: elapsed };
}

module.exports = {
  initBoard,
  getBoard,
  generateNewRectangles,
  selectRectangle,
  snapAndLock,
  checkWinCondition,
  resetGame,
  stopTimer
};

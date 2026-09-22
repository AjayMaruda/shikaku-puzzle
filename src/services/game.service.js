const { v4: uuidv4 } = require("uuid");
const Game = require("../models/Game");

function generateBoard(width, height) {
  const grid = Array.from({ length: height }, () => Array(width).fill(false));
  const clues = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col]) continue;

      const w = Math.min(Math.floor(Math.random() * 3) + 1, width - col);
      const h = Math.min(Math.floor(Math.random() * 3) + 1, height - row);

      let canPlace = true;
      for (let y = row; y < row + h; y++) {
        for (let x = col; x < col + w; x++) {
          if (grid[y][x]) canPlace = false;
        }
      }

      const rectWidth = canPlace ? w : 1;
      const rectHeight = canPlace ? h : 1;

      for (let y = row; y < row + rectHeight; y++) {
        for (let x = col; x < col + rectWidth; x++) {
          grid[y][x] = true;
        }
      }

      clues.push({
        row: row + Math.floor(Math.random() * rectHeight),
        col: col + Math.floor(Math.random() * rectWidth),
        value: rectWidth * rectHeight,
      });
    }
  }

  return clues;
}

async function initBoard(width, height) {
  const game = await Game.create({
    boardId: uuidv4(),
    width,
    height,
    clues: generateBoard(width, height),
    rectangles: [],
    startTime: new Date(),
  });

  return game;
}

async function placeRectangle(boardId, x, y, width, height) {
  const game = await Game.findOne({ boardId });

  if (!game) {
    throw new Error("Board not found");
  }

  if (x < 0 || y < 0 || x + width > game.width || y + height > game.height) {
    throw new Error("Rectangle is out of bounds");
  }

  const overlap = game.rectangles.some(
    (rectangle) =>
      x < rectangle.x + rectangle.width &&
      x + width > rectangle.x &&
      y < rectangle.y + rectangle.height &&
      y + height > rectangle.y,
  );

  if (overlap) {
    throw new Error("Rectangle overlaps an existing rectangle");
  }

  const clue = game.clues.find(
    (clue) =>
      clue.col >= x &&
      clue.col < x + width &&
      clue.row >= y &&
      clue.row < y + height,
  );

  if (!clue) {
    throw new Error("Rectangle must contain a number");
  }

  const clueCount = game.clues.filter(
    (clue) =>
      clue.col >= x &&
      clue.col < x + width &&
      clue.row >= y &&
      clue.row < y + height,
  ).length;

  if (clueCount !== 1) {
    throw new Error("Rectangle must contain exactly one number");
  }

  if (width * height !== clue.value) {
    throw new Error(`Rectangle area must be ${clue.value}`);
  }

  const rectangle = {
    id: uuidv4(),
    x,
    y,
    width,
    height,
    clueValue: clue.value,
  };

  game.rectangles.push(rectangle);
  await game.save();

  return rectangle;
}

async function removeRectangle(boardId, rectangleId) {
  const game = await Game.findOne({ boardId });

  if (!game) {
    throw new Error("Board not found");
  }

  game.rectangles = game.rectangles.filter(
    (rectangle) => rectangle.id !== rectangleId,
  );

  await game.save();

  return game;
}

async function checkWinCondition(boardId) {
  const game = await Game.findOne({ boardId });

  if (!game) {
    throw new Error("Board not found");
  }

  const totalArea = game.rectangles.reduce(
    (total, rectangle) => total + rectangle.width * rectangle.height,
    0,
  );

  const solved =
    totalArea === game.width * game.height &&
    game.rectangles.length === game.clues.length;

  if (solved) {
    game.solved = true;
    await game.save();

    const elapsedSeconds = Math.floor(
      (Date.now() - game.startTime.getTime()) / 1000,
    );

    return {
      solved: true,
      elapsedSeconds,
      message: "Puzzle solved!",
    };
  }

  return {
    solved: false,
    message: `${game.rectangles.length} / ${game.clues.length} rectangles completed.`,
  };
}

async function resetGame(boardId) {
  const game = await Game.findOne({ boardId });

  if (!game) {
    throw new Error("Board not found");
  }

  game.clues = generateBoard(game.width, game.height);
  game.rectangles = [];
  game.solved = false;
  game.startTime = new Date();

  await game.save();

  return game;
}

async function selectRectangle(boardId, rectangleId) {
  const game = await Game.findOne({ boardId });

  if (!game) {
    throw new Error("Board not found");
  }

  return (
    game.rectangles.find((rectangle) => rectangle.id === rectangleId) || null
  );
}

async function snapAndLock(boardId, rectangleId) {
  const game = await Game.findOne({ boardId });

  if (!game) {
    throw new Error("Board not found");
  }

  const rectangle = game.rectangles.find(
    (rectangle) => rectangle.id === rectangleId,
  );

  return {
    rectangle: rectangle || null,
    boardState: game,
  };
}

async function stopTimer(boardId) {
  const game = await Game.findOne({ boardId });

  if (!game) {
    throw new Error("Board not found");
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - game.startTime.getTime()) / 1000,
  );

  return { elapsedSeconds };
}

module.exports = {
  initBoard,
  placeRectangle,
  removeRectangle,
  checkWinCondition,
  resetGame,
  selectRectangle,
  snapAndLock,
  stopTimer,
};

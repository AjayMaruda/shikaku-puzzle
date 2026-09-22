const gameService = require("../services/game.service");

async function initBoard(req, res, next) {
  try {
    const width = parseInt(req.body.width, 10) || 6;
    const height = parseInt(req.body.height, 10) || 6;

    if (width < 4 || width > 12 || height < 4 || height > 12) {
      return res.status(400).json({ success: false, error: "Board dimensions must be between 4 and 12" });
    }

    const game = await gameService.initBoard(width, height);
    res.status(201).json({
      success: true,
      boardId: game.boardId,
      width: game.width,
      height: game.height,
      clues: game.clues
    });
  } catch (err) {
    next(err);
  }
}

async function placeRectangle(req, res, next) {
  try {
    const { x, y, width, height } = req.body;
    const rect = await gameService.placeRectangle(req.params.boardId, Number(x), Number(y), Number(width), Number(height));
    req.app.get("io").to(req.params.boardId).emit("rectangle:placed", { rectangle: rect });
    res.json({ success: true, rectangle: rect });
  } catch (err) {
    next(err);
  }
}

async function removeRectangle(req, res, next) {
  try {
    const { boardId, rectangleId } = req.params;
    await gameService.removeRectangle(boardId, rectangleId);
    req.app.get("io").to(boardId).emit("rectangle:removed", { rectangleId });
    res.json({ success: true, rectangleId });
  } catch (err) {
    next(err);
  }
}

async function selectRectangle(req, res, next) {
  try {
    const rect = await gameService.selectRectangle(req.params.boardId, req.body.rectangleId);
    req.app.get("io").to(req.params.boardId).emit("rectangle:selected", { rectangle: rect });
    res.json({ success: true, rectangle: rect });
  } catch (err) {
    next(err);
  }
}

async function snapAndLock(req, res, next) {
  try {
    const result = await gameService.snapAndLock(req.params.boardId, req.body.rectangleId);
    req.app.get("io").to(req.params.boardId).emit("rectangle:locked", { rectangle: result.rectangle });
    res.json({ success: true, rectangle: result.rectangle });
  } catch (err) {
    next(err);
  }
}

async function checkWin(req, res, next) {
  try {
    const result = await gameService.checkWinCondition(req.params.boardId);
    if (result.solved) {
      req.app.get("io").to(req.params.boardId).emit("game:won", result);
    }
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function resetGame(req, res, next) {
  try {
    const game = await gameService.resetGame(req.params.boardId);
    req.app.get("io").to(req.params.boardId).emit("game:reset", { clues: game.clues });
    res.json({ success: true, clues: game.clues });
  } catch (err) {
    next(err);
  }
}

async function stopTimer(req, res, next) {
  try {
    const result = await gameService.stopTimer(req.params.boardId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initBoard,
  placeRectangle,
  removeRectangle,
  selectRectangle,
  snapAndLock,
  checkWin,
  resetGame,
  stopTimer
};

"use strict";
const gameService = require("../services/game.service");
const { CreateBoardDto, validate: validateBoard } = require("../dtos/CreateBoardDto");
const { PlayerInputDto, validate: validatePlayer } = require("../dtos/PlayerInputDto");

async function initBoard(req, res, next) {
  try {
    const dto = new CreateBoardDto(req.body);
    const errors = validateBoard(dto);
    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }
    const game = await gameService.initBoard(dto.width, dto.height);
    res.status(201).json({
      success: true,
      boardId: game.boardId,
      width: game.width,
      height: game.height,
      clues: game.clues,
      startTime: game.startTime
    });
  } catch (err) {
    next(err);
  }
}

async function generateRectangles(req, res, next) {
  try {
    const { boardId } = req.params;
    const data = await gameService.generateNewRectangles(boardId);
    res.json({ success: true, boardId, rectangles: data.rectangles, clues: data.clues });
  } catch (err) {
    next(err);
  }
}

async function selectRectangle(req, res, next) {
  try {
    const { boardId } = req.params;
    const dto = new PlayerInputDto(req.body);
    const errors = validatePlayer(dto);
    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }
    const rect = await gameService.selectRectangle(boardId, dto.rectangleId);
    const io = req.app.get("io");
    io.to(boardId).emit("rectangle:selected", { boardId, rectangle: rect });
    res.json({ success: true, rectangle: rect });
  } catch (err) {
    next(err);
  }
}

async function snapAndLock(req, res, next) {
  try {
    const { boardId } = req.params;
    const dto = new PlayerInputDto(req.body);
    const errors = validatePlayer(dto);
    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }
    const result = await gameService.snapAndLock(boardId, dto.rectangleId);
    const io = req.app.get("io");
    io.to(boardId).emit("rectangle:locked", { boardId, rectangle: result.rectangle });
    res.json({ success: true, rectangle: result.rectangle });
  } catch (err) {
    next(err);
  }
}

async function checkWin(req, res, next) {
  try {
    const { boardId } = req.params;
    const result = await gameService.checkWinCondition(boardId);
    if (result.solved) {
      const io = req.app.get("io");
      io.to(boardId).emit("game:won", { boardId, elapsedSeconds: result.elapsedSeconds });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function resetGame(req, res, next) {
  try {
    const { boardId } = req.params;
    const game = await gameService.resetGame(boardId);
    const io = req.app.get("io");
    io.to(boardId).emit("game:reset", {
      boardId,
      clues: game.clues,
      startTime: game.startTime
    });
    res.json({
      success: true,
      boardId: game.boardId,
      clues: game.clues,
      startTime: game.startTime
    });
  } catch (err) {
    next(err);
  }
}

async function stopTimer(req, res, next) {
  try {
    const { boardId } = req.params;
    const result = await gameService.stopTimer(boardId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { initBoard, generateRectangles, selectRectangle, snapAndLock, checkWin, resetGame, stopTimer };

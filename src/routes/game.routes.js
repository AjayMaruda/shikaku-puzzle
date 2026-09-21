"use strict";
const { Router } = require("express");
const ctrl = require("../controllers/game.controller");

const router = Router();

router.post("/board", ctrl.initBoard);
router.get("/board/:boardId/rectangles", ctrl.generateRectangles);
router.post("/board/:boardId/select", ctrl.selectRectangle);
router.post("/board/:boardId/snap", ctrl.snapAndLock);
router.get("/board/:boardId/check", ctrl.checkWin);
router.post("/board/:boardId/reset", ctrl.resetGame);
router.post("/board/:boardId/timer/stop", ctrl.stopTimer);

module.exports = router;
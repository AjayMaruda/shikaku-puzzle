"use strict";

const socket = io();
let boardId = null;
let selectedRectangleId = null;
let timerInterval = null;
let elapsedSec = 0;
let boardWidth = 6;
let boardHeight = 6;
let rectangles = [];
let clues = [];

function el(id) { return document.getElementById(id); }

socket.on("rectangle:selected", function() { renderBoard(); });
socket.on("rectangle:locked", function() { renderBoard(); setStatus("Locked! Keep going."); });
socket.on("game:won", function(data) { showWin(data.elapsedSeconds); });
socket.on("game:reset", function(data) {
  clues = data.clues;
  rectangles = [];
  renderBoard();
  setStatus("Game reset. Generate rectangles to play.");
});

function setStatus(msg) { el("statusMsg").textContent = msg; }

function startTimer() {
  elapsedSec = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(function() {
    elapsedSec++;
    el("statusTimer").textContent = elapsedSec + "s";
  }, 1000);
}

function stopTimerUI() { clearInterval(timerInterval); }

function showWin(secs) {
  stopTimerUI();
  el("winBanner").classList.remove("hidden");
  el("winTime").textContent = "Time: " + secs + "s";
  setStatus("Solved!");
}

function renderBoard() {
  var board = el("board");
  var cellSize = Math.min(60, Math.floor(540 / Math.max(boardWidth, boardHeight)));
  board.style.display = "grid";
  board.style.gridTemplateColumns = "repeat(" + boardWidth + ", " + cellSize + "px)";
  board.style.width = (boardWidth * cellSize) + "px";
  board.innerHTML = "";

  var cellMap = {};
  for (var i = 0; i < rectangles.length; i++) {
    var rect = rectangles[i];
    for (var r = rect.y; r < rect.y + rect.height; r++) {
      for (var c = rect.x; c < rect.x + rect.width; c++) {
        cellMap[r + "," + c] = rect;
      }
    }
  }

  var clueMap = {};
  for (var j = 0; j < clues.length; j++) {
    clueMap[clues[j].row + "," + clues[j].col] = clues[j].value;
  }

  for (var row = 0; row < boardHeight; row++) {
    for (var col = 0; col < boardWidth; col++) {
      var cell = document.createElement("div");
      cell.style.width = cellSize + "px";
      cell.style.height = cellSize + "px";
      cell.style.boxSizing = "border-box";
      cell.style.border = "1px solid #374151";
      cell.style.display = "flex";
      cell.style.alignItems = "center";
      cell.style.justifyContent = "center";
      cell.style.fontSize = "13px";
      cell.style.fontWeight = "bold";
      cell.style.cursor = "pointer";

      var rectAtCell = cellMap[row + "," + col];
      var clueVal = clueMap[row + "," + col];

      if (rectAtCell) {
        if (rectAtCell.locked) {
          cell.style.backgroundColor = "#1e3a5f";
          cell.style.border = "2px solid #3b82f6";
        } else if (rectAtCell.selected) {
          cell.style.backgroundColor = "#3b1f5e";
          cell.style.border = "2px solid #a855f7";
        } else {
          cell.style.backgroundColor = "#1f2937";
        }
        (function(rid) {
          cell.addEventListener("click", function() { handleCellClick(rid); });
        })(rectAtCell.id);
      } else {
        cell.style.backgroundColor = "#111827";
      }

      if (clueVal !== undefined) {
        cell.textContent = clueVal;
        cell.style.color = (rectAtCell && rectAtCell.locked) ? "#93c5fd" : "#f9fafb";
      }

      board.appendChild(cell);
    }
  }
}

function handleCellClick(rectId) {
  if (!boardId || !rectId) return;
  selectedRectangleId = rectId;
  fetch("/api/game/board/" + boardId + "/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rectangleId: rectId })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      rectangles = rectangles.map(function(r) {
        return Object.assign({}, r, { selected: r.id === rectId });
      });
      renderBoard();
      setStatus("Rectangle selected. Click Snap and Lock to lock it.");
    } else {
      setStatus(data.error || "Selection failed.");
    }
  });
}

el("btnNewGame").addEventListener("click", function() {
  boardWidth = parseInt(el("boardWidth").value) || 6;
  boardHeight = parseInt(el("boardHeight").value) || 6;
  fetch("/api/game/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ width: boardWidth, height: boardHeight })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (!data.success) return alert(JSON.stringify(data.errors));
    boardId = data.boardId;
    clues = data.clues;
    rectangles = [];
    selectedRectangleId = null;
    el("statusBoardId").textContent = boardId.slice(0, 8) + "...";
    el("actionBar").classList.remove("hidden");
    el("winBanner").classList.add("hidden");
    startTimer();
    socket.emit("join:board", boardId);
    renderBoard();
    setStatus("Board created. Click Generate Rectangles to play.");
  });
});

el("btnGenRect").addEventListener("click", function() {
  if (!boardId) return;
  fetch("/api/game/board/" + boardId + "/rectangles")
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        rectangles = data.rectangles;
        clues = data.clues;
        renderBoard();
        setStatus("Rectangles generated. Click one to select it.");
      }
    });
});

el("btnSnap").addEventListener("click", function() {
  if (!boardId || !selectedRectangleId) return setStatus("Select a rectangle first.");
  fetch("/api/game/board/" + boardId + "/snap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rectangleId: selectedRectangleId })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      rectangles = rectangles.map(function(r) {
        return r.id === selectedRectangleId ? Object.assign({}, r, { locked: true, selected: false }) : r;
      });
      selectedRectangleId = null;
      renderBoard();
      setStatus("Locked! Select another rectangle.");
    }
  });
});

el("btnCheck").addEventListener("click", function() {
  if (!boardId) return;
  fetch("/api/game/board/" + boardId + "/check")
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.solved) showWin(data.elapsedSeconds);
      else setStatus(data.message);
    });
});

el("btnReset").addEventListener("click", function() {
  if (!boardId) return;
  fetch("/api/game/board/" + boardId + "/reset", { method: "POST" })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        clues = data.clues;
        rectangles = [];
        selectedRectangleId = null;
        el("winBanner").classList.add("hidden");
        startTimer();
        renderBoard();
        setStatus("Reset. Generate rectangles to play again.");
      }
    });
});

el("btnStopTimer").addEventListener("click", function() {
  if (!boardId) return;
  stopTimerUI();
  fetch("/api/game/board/" + boardId + "/timer/stop", { method: "POST" })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) setStatus("Timer stopped at " + data.elapsedSeconds + "s");
    });
});
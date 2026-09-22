const socket = io();

let boardId = null;
let boardWidth = 6;
let boardHeight = 6;
let clues = [];
let rectangles = [];
let firstClick = null;
let hoverCell = null;
let cellGrid = [];
let timer = 0;
let timerId = null;

const statusMsg = document.getElementById("statusMsg");
const statusTimer = document.getElementById("statusTimer");
const statusBoardId = document.getElementById("statusBoardId");
const boardContainer = document.getElementById("boardContainer");
const winBanner = document.getElementById("winBanner");
const winTime = document.getElementById("winTime");
const boardEl = document.getElementById("board");

function setStatus(text) {
  statusMsg.textContent = text;
}

function startTimer() {
  clearInterval(timerId);
  timer = 0;
  statusTimer.textContent = "0s";
  timerId = setInterval(() => {
    timer++;
    statusTimer.textContent = `${timer}s`;
  }, 1000);
}

function cancelSelection() {
  firstClick = null;
  hoverCell = null;
}

function getRectAt(r, c) {
  return rectangles.find(
    (rect) =>
      c >= rect.x &&
      c < rect.x + rect.width &&
      r >= rect.y &&
      r < rect.y + rect.height,
  );
}

function renderBoard() {
  boardEl.style.gridTemplateColumns = `repeat(${boardWidth}, minmax(0, 1fr))`;
  boardEl.innerHTML = "";
  cellGrid = [];

  for (let r = 0; r < boardHeight; r++) {
    cellGrid[r] = [];
    for (let c = 0; c < boardWidth; c++) {
      const cell = document.createElement("div");
      const clue = clues.find((item) => item.row === r && item.col === c);
      if (clue) cell.textContent = clue.value;

      cell.onclick = () => handleCellClick(r, c);
      cell.onmouseenter = () => handleCellHover(r, c);

      boardEl.appendChild(cell);
      cellGrid[r][c] = cell;
    }
  }

  updateStyles();
}

function updateStyles() {
  const minC =
    firstClick && hoverCell ? Math.min(firstClick.c, hoverCell.c) : -1;
  const maxC =
    firstClick && hoverCell ? Math.max(firstClick.c, hoverCell.c) : -1;
  const minR =
    firstClick && hoverCell ? Math.min(firstClick.r, hoverCell.r) : -1;
  const maxR =
    firstClick && hoverCell ? Math.max(firstClick.r, hoverCell.r) : -1;

  for (let r = 0; r < boardHeight; r++) {
    for (let c = 0; c < boardWidth; c++) {
      const cell = cellGrid[r]?.[c];
      if (!cell) continue;

      const rect = getRectAt(r, c);
      const isStart = firstClick && firstClick.r === r && firstClick.c === c;
      const inBox =
        firstClick &&
        hoverCell &&
        c >= minC &&
        c <= maxC &&
        r >= minR &&
        r <= maxR;

      let style =
        "w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-sm sm:text-base rounded border cursor-pointer select-none transition ";

      if (rect) {
        style += "bg-blue-100 border-blue-500 text-blue-900";
      } else if (isStart) {
        style += "bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-400";
      } else if (inBox) {
        style += "bg-amber-50 border-dashed border-amber-400 text-amber-900";
      } else {
        style += "bg-white border-gray-300 text-gray-800 hover:bg-gray-100";
      }

      cell.className = style;
    }
  }

  if (firstClick && hoverCell) {
    const w = maxC - minC + 1;
    const h = maxR - minR + 1;
    setStatus(`Selecting ${w}×${h} = ${w * h}`);
  }
}

function handleCellHover(r, c) {
  if (firstClick) {
    hoverCell = { r, c };
    updateStyles();
  }
}

async function handleCellClick(r, c) {
  if (!boardId) return;

  const existing = getRectAt(r, c);
  if (existing) {
    cancelSelection();
    await fetch(`/api/game/board/${boardId}/rectangles/${existing.id}`, {
      method: "DELETE",
    });
    rectangles = rectangles.filter((item) => item.id !== existing.id);
    updateStyles();
    setStatus("Rectangle removed.");
    return;
  }

  const clue = clues.find((item) => item.row === r && item.col === c);

  if (!firstClick) {
    if (clue && clue.value === 1) {
      return placeRect(c, r, 1, 1);
    }
    firstClick = { r, c };
    hoverCell = { r, c };
    updateStyles();
    setStatus("Select the second corner.");
    return;
  }

  const x = Math.min(firstClick.c, c);
  const y = Math.min(firstClick.r, r);
  const width = Math.abs(c - firstClick.c) + 1;
  const height = Math.abs(r - firstClick.r) + 1;

  cancelSelection();

  if (width === 1 && height === 1) {
    if (clue && clue.value === 1) {
      return placeRect(c, r, 1, 1);
    }
    updateStyles();
    setStatus("Selection cancelled.");
    return;
  }

  await placeRect(x, y, width, height);
}

async function placeRect(x, y, width, height) {
  const res = await fetch(`/api/game/board/${boardId}/place`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y, width, height }),
  });
  const data = await res.json();

  if (data.success) {
    rectangles.push(data.rectangle);
    updateStyles();
    setStatus(`Placed ${width}×${height} rectangle.`);
    checkWin(true);
  } else {
    updateStyles();
    setStatus(data.error || "Invalid rectangle.");
  }
}

async function checkWin(silent = false) {
  if (!boardId) return;
  const res = await fetch(`/api/game/board/${boardId}/check`);
  const data = await res.json();

  if (data.solved) {
    clearInterval(timerId);
    winBanner.classList.remove("hidden");
    winTime.textContent = `Solved in ${data.elapsedSeconds} seconds!`;
    setStatus("Puzzle solved!");
  } else if (!silent) {
    setStatus(data.message);
  }
}

document.getElementById("btnNewGame").onclick = async () => {
  boardWidth = parseInt(document.getElementById("boardWidth").value, 10) || 6;
  boardHeight = parseInt(document.getElementById("boardHeight").value, 10) || 6;

  const res = await fetch("/api/game/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ width: boardWidth, height: boardHeight }),
  });
  const data = await res.json();

  if (!data.success) {
    alert(data.error || "Failed to create board");
    return;
  }

  boardId = data.boardId;
  clues = data.clues;
  rectangles = [];
  cancelSelection();

  statusBoardId.textContent = boardId.slice(0, 8);
  boardContainer.classList.remove("hidden");
  winBanner.classList.add("hidden");

  startTimer();
  socket.emit("join:board", boardId);
  renderBoard();
  setStatus("Board ready. Click two corners to draw a rectangle.");
};

document.getElementById("btnCheck").onclick = () => checkWin(false);

document.getElementById("btnReset").onclick = async () => {
  if (!boardId) return;
  const res = await fetch(`/api/game/board/${boardId}/reset`, {
    method: "POST",
  });
  const data = await res.json();
  if (data.success) {
    clues = data.clues;
    rectangles = [];
    cancelSelection();
    winBanner.classList.add("hidden");
    startTimer();
    renderBoard();
    setStatus("Game reset.");
  }
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && firstClick) {
    cancelSelection();
    updateStyles();
    setStatus("Selection cancelled.");
  }
});

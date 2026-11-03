// ===== 1. GRAB THINGS FROM THE PAGE =====
const boardElement = document.getElementById("board");
const messageElement = document.getElementById("message");
const hintButton = document.getElementById("hint-button");
const scoreElement = document.getElementById("score");
const newGameButton = document.getElementById("new-game-button");
const difficultySelect = document.getElementById("difficulty");
const numpadElement = document.getElementById("numpad");
const mistakesElement = document.getElementById("mistakes"); // NEW
const loseOverlay = document.getElementById("lose-overlay"); // NEW

// ===== 2. DATA =====
const DIFFICULTY = { easy: 36, medium: 46, hard: 52 };
const MAX_MISTAKES = 5; // NEW

let puzzle = [];
let board = [];
let solution = [];

let selected = null;
let score = 0;
let hintsLeft = 3;
let mistakes = 0;      // NEW
let gameOver = false;  // NEW
const scoredCells = new Set();

// ===== 3. DRAWING FUNCTIONS =====
function createBoard() {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (col % 3 === 2 && col !== 8) {
        cell.classList.add("thick-right");
      }
      if (row % 3 === 2 && row !== 8) {
        cell.classList.add("thick-bottom");
      }

      cell.dataset.row = row;
      cell.dataset.col = col;

      boardElement.appendChild(cell);
    }
  }
}

function createNumpad() {
  for (let num = 1; num <= 9; num++) {
    const button = document.createElement("button");
    button.textContent = num;
    button.dataset.num = num;
    numpadElement.appendChild(button);
  }

  const eraseButton = document.createElement("button");
  eraseButton.textContent = "⌫";
  eraseButton.dataset.num = 0;
  numpadElement.appendChild(eraseButton);
}

function renderBoard() {
  const cells = document.querySelectorAll(".cell");

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = cells[row * 9 + col];
      const value = board[row][col];

      cell.textContent = value === 0 ? "" : value;

      cell.classList.toggle("given", puzzle[row][col] !== 0);

      const isSelected =
        selected !== null && selected.row === row && selected.col === col;
      cell.classList.toggle("selected", isSelected);
    }
  }
}

// CHANGED: also shows mistakes, and disables hints when the game is over
function updateStatus() {
  scoreElement.textContent = "Score: " + score;
  mistakesElement.textContent = "❌ Mistakes: " + mistakes + "/" + MAX_MISTAKES;
  hintButton.textContent = "Hint (" + hintsLeft + " left)";
  hintButton.disabled = hintsLeft === 0 || gameOver;
}

// ===== 4. GAME LOGIC =====
function isValid(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  return true;
}

function getCandidates(row, col) {
  const oldValue = board[row][col];
  board[row][col] = 0;

  const list = [];
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      list.push(num);
    }
  }

  board[row][col] = oldValue;
  return list;
}

// CHANGED: a rule-breaking move now counts as a mistake
function placeNumber(row, col, num) {
  const oldValue = board[row][col];
  board[row][col] = 0;

  if (isValid(board, row, col, num)) {
    board[row][col] = num;

    const cellId = row * 9 + col;
    if (num === solution[row][col] && !scoredCells.has(cellId)) {
      scoredCells.add(cellId);
      score += 10;
      updateStatus();
    }

    renderBoard();
    checkWin();
  } else {
    board[row][col] = oldValue;
    score = Math.max(0, score - 5);
    mistakes++;
    updateStatus();
    flashWrong(row, col);

    if (mistakes >= MAX_MISTAKES) {
      endGame();
    }
  }
}

// NEW: runs when the player makes too many mistakes
function endGame() {
  gameOver = true;
  selected = null;

  boardElement.classList.add("game-over");
  numpadElement.classList.add("game-over");
  loseOverlay.classList.add("show");
  messageElement.textContent =
    "💀 " + MAX_MISTAKES + " mistakes! Press New Game to try again.";

  renderBoard();
  updateStatus();
}

function flashWrong(row, col) {
  const cell = document.querySelectorAll(".cell")[row * 9 + col];
  cell.classList.add("wrong");
  setTimeout(function () {
    cell.classList.remove("wrong");
  }, 500);
}

function checkWin() {
  const hasEmpty = board.some(function (row) {
    return row.includes(0);
  });
  messageElement.textContent = hasEmpty
    ? ""
    : "🎉 You solved it! Final score: " + score;
}

function makeHint(row, col) {
  const answer = solution[row][col];
  const others = getCandidates(row, col).filter(function (n) {
    return n !== answer;
  });

  const options = [];

  options.push(
    answer % 2 === 0
      ? "🕵️ Psst... the secret number is EVEN!"
      : "🕵️ Psst... the secret number is ODD!"
  );

  const low = Math.max(1, answer - 2);
  const high = Math.min(9, answer + 2);
  options.push(
    "🔍 Detective tip: the number is somewhere between " +
      low + " and " + high + "!"
  );

  if (others.length > 0) {
    const decoy = others[Math.floor(Math.random() * others.length)];
    const first = Math.min(answer, decoy);
    const second = Math.max(answer, decoy);
    options.push(
      "🎯 It's either " + first + " or " + second + "... choose wisely!"
    );
  }

  return options[Math.floor(Math.random() * options.length)];
}

// ----- PUZZLE GENERATOR -----
function createEmptyGrid() {
  const grid = [];
  for (let row = 0; row < 9; row++) {
    grid.push(new Array(9).fill(0));
  }
  return grid;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function findEmpty(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        return { row: row, col: col };
      }
    }
  }
  return null;
}

function fillGrid(grid) {
  const empty = findEmpty(grid);
  if (empty === null) return true;

  const row = empty.row;
  const col = empty.col;
  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  for (let i = 0; i < numbers.length; i++) {
    const num = numbers[i];
    if (isValid(grid, row, col, num)) {
      grid[row][col] = num;

      if (fillGrid(grid)) return true;

      grid[row][col] = 0;
    }
  }

  return false;
}

function countSolutions(grid, limit) {
  let best = null;
  let bestOptions = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const options = [];
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            options.push(num);
          }
        }
        if (best === null || options.length < bestOptions.length) {
          best = { row: row, col: col };
          bestOptions = options;
        }
      }
    }
  }

  if (best === null) return 1;

  let count = 0;
  for (let i = 0; i < bestOptions.length; i++) {
    grid[best.row][best.col] = bestOptions[i];
    count += countSolutions(grid, limit - count);
    grid[best.row][best.col] = 0;

    if (count >= limit) break;
  }

  return count;
}

function generatePuzzle(blanksWanted) {
  const full = createEmptyGrid();
  fillGrid(full);

  const puzzleGrid = full.map(row => [...row]);

  const positions = [];
  for (let i = 0; i < 81; i++) {
    positions.push(i);
  }
  shuffle(positions);

  let removed = 0;
  for (let i = 0; i < positions.length && removed < blanksWanted; i++) {
    const row = Math.floor(positions[i] / 9);
    const col = positions[i] % 9;
    const backup = puzzleGrid[row][col];

    puzzleGrid[row][col] = 0;

    if (countSolutions(puzzleGrid, 2) === 1) {
      removed++;
    } else {
      puzzleGrid[row][col] = backup;
    }
  }

  return { puzzle: puzzleGrid, solution: full };
}

// CHANGED: also resets mistakes and un-greys the board
function startNewGame() {
  const blanks = DIFFICULTY[difficultySelect.value];
  const result = generatePuzzle(blanks);

  puzzle = result.puzzle;
  solution = result.solution;
  board = puzzle.map(row => [...row]);

  selected = null;
  score = 0;
  hintsLeft = 3;
  mistakes = 0;
  gameOver = false;
  scoredCells.clear();
  messageElement.textContent = "";

  boardElement.classList.remove("game-over");
  numpadElement.classList.remove("game-over");
  loseOverlay.classList.remove("show");

  renderBoard();
  updateStatus();
}

// CHANGED: does nothing if the game is over
function handleInput(num) {
  if (gameOver || selected === null) return;

  const row = selected.row;
  const col = selected.col;

  if (num === 0) {
    board[row][col] = 0;
    renderBoard();
    checkWin();
  } else {
    placeNumber(row, col, num);
  }
}

// ===== 5. PLAYER INPUT =====
boardElement.addEventListener("click", function (event) {
  if (gameOver) return; // NEW

  const cell = event.target;
  if (!cell.classList.contains("cell")) return;

  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  if (puzzle[row][col] !== 0) return;

  selected = { row: row, col: col };
  renderBoard();
});

document.addEventListener("keydown", function (event) {
  if ("123456789".includes(event.key)) {
    handleInput(Number(event.key));
  } else if (
    event.key === "Backspace" ||
    event.key === "Delete" ||
    event.key === "0"
  ) {
    handleInput(0);
  }
});

numpadElement.addEventListener("click", function (event) {
  const button = event.target;
  if (button.tagName !== "BUTTON") return;

  handleInput(Number(button.dataset.num));
});

hintButton.addEventListener("click", function () {
  if (hintsLeft === 0 || gameOver) return; // CHANGED

  if (selected === null) {
    messageElement.textContent = "👆 Click an empty cell first, then press Hint.";
    return;
  }

  const row = selected.row;
  const col = selected.col;

  if (board[row][col] === solution[row][col]) {
    messageElement.textContent = "😎 You already got this one right! No hint used.";
    return;
  }

  messageElement.textContent = makeHint(row, col);
  hintsLeft--;
  score = Math.max(0, score - 5);
  updateStatus();
});

newGameButton.addEventListener("click", startNewGame);

// ===== 6. START THE GAME =====
createBoard();
createNumpad();
startNewGame();
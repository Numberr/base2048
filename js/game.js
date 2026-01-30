// === ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â­ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¼ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ DOM ===
const gridElement = document.getElementById("grid");
const gridBackground = document.getElementById("gridBackground");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("bestScore");
const startBestScoreElement = document.getElementById("startBestScore");
const restartBtn = document.getElementById("restartBtn");
const undoBtn = document.getElementById("undoBtn");
const soundBtn = document.getElementById("soundBtn");
const timerElement = document.getElementById("timer");
const movesElement = document.getElementById("moves");
const gameOverEl = document.getElementById("gameOver");
const finalScoreEl = document.getElementById("finalScore");
const bestScoreNoteEl = document.getElementById("bestScoreNote");
const newRecordMsg = document.getElementById("newRecordMsg");
const restartConfirmEl = document.getElementById("restartConfirm");
const confirmRestartBtn = document.getElementById("confirmRestart");
const cancelRestartBtn = document.getElementById("cancelRestart");
const restartFromGameOverBtn = document.getElementById("restartFromGameOver");
const signAndSendScoreBtn = document.getElementById("signAndSendScore");
const startScreen = document.getElementById("startScreen");
const gameUI = document.getElementById("gameUI");
const scorePopup = document.getElementById("scorePopup");
const backBtn = document.getElementById("backBtn");
const gridContainer = document.getElementById("gridContainer");

// === ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¹ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ ===
const size = 4;
let grid = [];
let score = 0;
let bestScore = 0;
let previousGrid = null;
let previousScore = 0;
let soundEnabled = true;
let moves = 0;
let startTime = null;
let timerInterval = null;

// === Audio Context ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â´ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â² ===
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â³ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°
function playSound(frequency, duration, type = 'sine', volume = 0.15) {
  if (!soundEnabled) return;
  
  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.log('Audio not supported');
  }
}

// ÃƒÆ’Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹
const sounds = {
  move: () => playSound(200, 0.05, 'sine', 0.1),
  merge: (value) => {
    const baseFreq = 300;
    const freq = baseFreq + (Math.log2(value) * 50);
    playSound(freq, 0.15, 'triangle', 0.15);
    setTimeout(() => playSound(freq * 1.5, 0.1, 'sine', 0.1), 50);
  },
  newTile: () => playSound(400, 0.08, 'square', 0.08),
  gameOver: () => {
    playSound(200, 0.2, 'sawtooth', 0.2);
    setTimeout(() => playSound(150, 0.3, 'sawtooth', 0.15), 150);
  },
  victory: () => {
    playSound(523, 0.15, 'sine', 0.15);
    setTimeout(() => playSound(659, 0.15, 'sine', 0.15), 100);
    setTimeout(() => playSound(784, 0.25, 'sine', 0.2), 200);
  }
};

// === LocalStorage ===
function loadBestScore() {
  const saved = localStorage.getItem('2048-best-score');
  bestScore = saved ? parseInt(saved) : 0;
  updateBestScore();
}

function saveBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('2048-best-score', bestScore);
    updateBestScore();
    return true;
  }
  return false;
}

function updateBestScore() {
  if (bestScoreElement) {
    bestScoreElement.textContent = bestScore;
  }
  if (startBestScoreElement) {
    startBestScoreElement.textContent = bestScore;
  }
}

// === ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¹ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¼ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ ===
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimer() {
  if (!startTime) return;
  
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  timerElement.textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function resetTimer() {
  stopTimer();
  timerElement.textContent = '00:00';
  startTime = null;
}

// === ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âº ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â´ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â² ===
function updateMoves() {
  movesElement.textContent = moves;
}

function resetMoves() {
  moves = 0;
  updateMoves();
}

// === ÃƒÆ’Ã‚ÂÃƒâ€¹Ã…â€œÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ===
function startGame() {
  startScreen.classList.add("hidden");
  gameUI.classList.remove("hidden");
  init();
}

function goToMainMenu() {
  stopTimer();
  resetTimer();
  resetMoves();
  gameOverEl.classList.add("hidden");
  restartConfirmEl.classList.add("hidden");
  startScreen.classList.remove("hidden");
  gameUI.classList.add("hidden");
}

function init() {
  grid = Array(size * size).fill(0);
  score = 0;
  previousGrid = null;
  previousScore = 0;
  gameOverEl.classList.add("hidden");
  restartConfirmEl.classList.add("hidden");
  
  resetTimer();
  resetMoves();
  
  createGridBackground();
  
  addNumber();
  addNumber();
  renderGrid();
  updateScore();
}

// ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â´ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¹ ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸
function createGridBackground() {
  gridBackground.innerHTML = '';
  for (let i = 0; i < size * size; i++) {
    const bgCell = document.createElement('div');
    bgCell.className = 'cell-background';
    gridBackground.appendChild(bgCell);
  }
}

// === ÃƒÆ’Ã‚ÂÃƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â° ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¼ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¼ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ ===
let newCellIndex = null;
let mergedCells = new Set();

function renderGrid() {
  gridElement.innerHTML = '';
  
  grid.forEach((value, index) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.value = value;
    cell.dataset.index = index;
    cell.textContent = value || '';
    
    if (index === newCellIndex && value !== 0) {
      cell.classList.add('new');
    }
    
    if (mergedCells.has(index)) {
      cell.classList.add('merged');
    }
    
    gridElement.appendChild(cell);
  });
  
  newCellIndex = null;
  mergedCells.clear();
}

// === ÃƒÆ’Ã‚ÂÃƒâ€¦Ã‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â±ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â° ===
function updateScore() {
  scoreElement.textContent = score;
  

  const scoreBox = scoreElement.closest('.score-box');
  if (scoreBox) {
    if (score > bestScore && bestScore > 0) {
      scoreBox.classList.add('beating-best');
    } else {
      scoreBox.classList.remove('beating-best');
    }
  }
}

// ÃƒÆ’Ã‚ÂÃƒâ€¦Ã‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¼ popup ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â´ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â±ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¼ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¼ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸
function showScorePopup(points) {
  scorePopup.textContent = '+' + points;
  scorePopup.classList.remove('show');
  void scorePopup.offsetWidth; // Trigger reflow
  scorePopup.classList.add('show');
}

// === ÃƒÆ’Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â±ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â³ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â° ===
function addNumber() {
  const empty = grid
    .map((v, i) => v === 0 ? i : null)
    .filter(v => v !== null);

  if (!empty.length) return;

  const index = empty[Math.floor(Math.random() * empty.length)];
  grid[index] = Math.random() < 0.9 ? 2 : 4;
  newCellIndex = index;
  
  sounds.newTile();
}

// === ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ ===
function merge(line) {
  let merged = false;
  let totalPoints = 0;
  const mergePositions = [];
  
  line = line.filter(v => v);
  
  for (let i = 0; i < line.length - 1; i++) {
    if (line[i] === line[i + 1]) {
      line[i] *= 2;
      totalPoints += line[i];
      line[i + 1] = 0;
      merged = true;
      mergePositions.push(i);
      
      sounds.merge(line[i]);
      
      if (line[i] === 2048) {
        sounds.victory();
      }
    }
  }
  
  const result = line.filter(v => v).concat(Array(size).fill(0)).slice(0, size);
  
  return { line: result, merged, points: totalPoints, mergePositions };
}

// === ÃƒÆ’Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¶ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ===
function move(direction) {
  if (!gameOverEl.classList.contains("hidden") || !restartConfirmEl.classList.contains("hidden")) {
    return;
  }

  previousGrid = [...grid];
  previousScore = score;
  
  let moved = false;
  let totalPoints = 0;
  mergedCells.clear();

  for (let i = 0; i < size; i++) {
    let line = [];

    for (let j = 0; j < size; j++) {
      let index;
      if (direction === "left") index = i * size + j;
      else if (direction === "right") index = i * size + (size - 1 - j);
      else if (direction === "up") index = j * size + i;
      else if (direction === "down") index = (size - 1 - j) * size + i;

      line.push(grid[index]);
    }

    const result = merge(line);
    totalPoints += result.points;

    for (let j = 0; j < size; j++) {
      let index;
      if (direction === "left") index = i * size + j;
      else if (direction === "right") index = i * size + (size - 1 - j);
      else if (direction === "up") index = j * size + i;
      else if (direction === "down") index = (size - 1 - j) * size + i;

      if (grid[index] !== result.line[j]) {
        grid[index] = result.line[j];
        moved = true;
      }
      
      if (result.mergePositions.includes(j) && result.line[j] !== 0) {
        mergedCells.add(index);
      }
    }
  }

  if (moved) {
    if (!timerInterval) {
      startTimer();
    }
    
    moves++;
    updateMoves();
    
    sounds.move();
    score += totalPoints;
    
    if (totalPoints > 0) {
      showScorePopup(totalPoints);
    }
    
    updateScore();
    addNumber();
    renderGrid();
    
    if (checkGameOver()) {
      stopTimer();
      sounds.gameOver();
      const isNewRecord = saveBestScore();
      
      finalScoreEl.textContent = score;
      if (bestScoreNoteEl) {
        bestScoreNoteEl.textContent = bestScore;
      }
      
      if (isNewRecord) {
        newRecordMsg.classList.remove('hidden');
      } else {
        newRecordMsg.classList.add('hidden');
      }
      
      // Setup game over buttons (show sign button if needed)
      setupGameOverButtons(score);
      
      setTimeout(() => {
        gameOverEl.classList.remove("hidden");
      }, 500);
    } else {
      saveBestScore();
    }
  }
}

// === ÃƒÆ’Ã‚ÂÃƒâ€¦Ã‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â° Game Over ===
function checkGameOver() {
  if (grid.includes(0)) return false;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const index = i * size + j;
      const value = grid[index];
      if (
        (j < size - 1 && value === grid[index + 1]) ||
        (i < size - 1 && value === grid[index + size])
      ) return false;
    }
  }
  return true;
}

// === ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â£ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¹ ===
window.addEventListener("keydown", e => {
  if (!gameOverEl.classList.contains("hidden") || !restartConfirmEl.classList.contains("hidden")) {
    return;
  }
  
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    move("left");
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    move("right");
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    move("up");
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    move("down");
  }
});

// === ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¹ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â´ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¼ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â±ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬ËœÃƒâ€¦Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ (ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã¢â‚¬ËœÃƒâ€¹Ã¢â‚¬Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚ÂÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â) ===
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const SWIPE_THRESHOLD = 30;
const SWIPE_TIME_THRESHOLD = 300;

gridContainer.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
}, { passive: true });

gridContainer.addEventListener("touchmove", e => {

  e.preventDefault();
}, { passive: false });

gridContainer.addEventListener("touchend", e => {
  if (!gameOverEl.classList.contains("hidden") || !restartConfirmEl.classList.contains("hidden")) {
    return;
  }

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const touchEndTime = Date.now();
  
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  const dt = touchEndTime - touchStartTime;


  if (dt > SWIPE_TIME_THRESHOLD) return;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      dx > 0 ? move("right") : move("left");
    }
  } else {
    if (Math.abs(dy) > SWIPE_THRESHOLD) {
      dy > 0 ? move("down") : move("up");
    }
  }
}, { passive: true });

// === ÃƒÆ’Ã‚ÂÃƒâ€¦Ã‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¾ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¿ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ===
undoBtn.addEventListener("click", () => {
  if (!previousGrid) return;
  if (!gameOverEl.classList.contains("hidden") || !restartConfirmEl.classList.contains("hidden")) return;

  grid = [...previousGrid];
  score = previousScore;
  renderGrid();
  updateScore();
  sounds.move();
});

restartBtn.addEventListener("click", () => {
  restartConfirmEl.classList.remove("hidden");
});

confirmRestartBtn.addEventListener("click", () => {
  restartConfirmEl.classList.add("hidden");
  gameOverEl.classList.add("hidden");
  init();
});

cancelRestartBtn.addEventListener("click", () => {
  restartConfirmEl.classList.add("hidden");
});

restartFromGameOverBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  init();
});


// Sign and send score button
signAndSendScoreBtn.addEventListener("click", async () => {
  const scoreToSend = parseInt(signAndSendScoreBtn.dataset.score);
  if (!scoreToSend) return;
  
  // Disable button during signing
  signAndSendScoreBtn.disabled = true;
  signAndSendScoreBtn.textContent = 'Signing...';
  
  try {
    await submitScoreToBackend(scoreToSend);
    
    // Success: hide sign button, make Play Again primary
    signAndSendScoreBtn.classList.add('hidden');
    restartFromGameOverBtn.classList.add('make-primary');
    
    console.log('[Game] Score submitted successfully');
    
  } catch (error) {
    console.error('[Game] Failed to submit score:', error);
    
    // Re-enable button on error
    signAndSendScoreBtn.disabled = false;
    signAndSendScoreBtn.textContent = 'Submit';
    
    // Show error to user
    alert('Failed to submit score. Please try again.');
  }
});

backBtn.addEventListener("click", () => {
  goToMainMenu();
});

// ÃƒÆ’Ã‚ÂÃƒâ€¦Ã‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬ËœÃƒâ€¦Ã‚Â½ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂµÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â²ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°
soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  const soundIcon = soundBtn.querySelector('.sound-icon');
  const soundWave = soundIcon.querySelector('.sound-wave');
  if (soundEnabled) {
    soundWave.style.display = 'block';
  } else {
    soundWave.style.display = 'none';
  }
  soundBtn.classList.toggle('sound-off');
  
  localStorage.setItem('2048-sound', soundEnabled ? 'on' : 'off');
  
  if (soundEnabled) {
    sounds.newTile();
  }
});

// === ÃƒÆ’Ã‚ÂÃƒâ€¹Ã…â€œÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â½ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â»ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬ËœÃƒâ€šÃ‚Â ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â¸ ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â³ÃƒÆ’Ã¢â‚¬ËœÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã¢â‚¬ËœÃƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Â·ÃƒÆ’Ã‚ÂÃƒâ€šÃ‚ÂºÃƒÆ’Ã‚ÂÃƒâ€šÃ‚Âµ ===
window.addEventListener('DOMContentLoaded', async () => {
  loadBestScore();
  
  const savedSound = localStorage.getItem('2048-sound');
  if (savedSound === 'off') {
    soundEnabled = false;
    const soundIcon = soundBtn.querySelector('.sound-icon');
    const soundWave = soundIcon.querySelector('.sound-wave');
    soundWave.style.display = 'none';
    soundBtn.classList.add('sound-off');
  }
  
  // Initialize wallet UI
  try {
    const { initWalletUI } = await import('./wallet-ui.js');
    await initWalletUI();
  } catch (error) {
    console.error('[Game] Wallet UI initialization failed:', error.message);
  }
});

// Expose startGame for the inline onclick on the Play button
window.startGame = startGame;

// === Setup Game Over Buttons ===
async function setupGameOverButtons(finalScore) {
  try {
    // Import wallet manager
    const { walletManager } = await import('./wallet.js');
    
    // Reset sign button state (in case it was left in "Signing..." state)
    signAndSendScoreBtn.disabled = false;
    signAndSendScoreBtn.textContent = 'Submit';
    
    // Check if wallet is connected and has name
    const isConnected = walletManager.isConnected();
    const hasName = walletManager.hasPlayerName();
    
    if (isConnected && hasName) {
      // Show sign button
      signAndSendScoreBtn.classList.remove('hidden');
      restartFromGameOverBtn.classList.remove('make-primary');
      
      // Store score for later submission
      signAndSendScoreBtn.dataset.score = finalScore;
    } else {
      // Hide sign button, make Play Again primary
      signAndSendScoreBtn.classList.add('hidden');
      restartFromGameOverBtn.classList.add('make-primary');
    }
    
  } catch (error) {
    console.error('[Game] Error setting up game over buttons:', error);
    // Default: hide sign button
    signAndSendScoreBtn.classList.add('hidden');
    restartFromGameOverBtn.classList.add('make-primary');
  }
}

// === Backend Score Submission ===
async function submitScoreToBackend(finalScore) {
  try {
    // Import modules
    const { walletManager } = await import('./wallet.js');
    const { backendAPI } = await import('./backend-api.js');
    
    // Check if wallet is connected
    if (!walletManager.isConnected()) {
      console.log('[Game] Wallet not connected, skipping backend submission');
      return;
    }
    
    // Check if player has registered name
    if (!walletManager.hasPlayerName()) {
      console.log('[Game] No player name registered, skipping backend submission');
      return;
    }
    
    const address = walletManager.getAddress().toLowerCase();
    const playerName = walletManager.getPlayerName();
    const provider = walletManager.currentProvider;
    
    console.log('[Game] Submitting score to backend...', {
      address,
      playerName,
      score: finalScore
    });
    
    // Request signature for score submission
    const signatureResult = await backendAPI.requestScoreSignature(
      provider,
      address,
      finalScore
    );
    
    console.log('[Game] ==========================================');
    console.log('[Game] Signature result received:');
    console.log('[Game]   Type:', typeof signatureResult);
    console.log('[Game]   Keys:', Object.keys(signatureResult || {}));
    console.log('[Game]   signature:', signatureResult?.signature);
    console.log('[Game]   timestamp:', signatureResult?.timestamp);
    console.log('[Game]   message:', signatureResult?.message);
    console.log('[Game] ==========================================');
    
    const { signature, timestamp, message } = signatureResult;
    
    console.log('[Game] Destructured values:');
    console.log('[Game]   signature:', signature);
    console.log('[Game]   timestamp:', timestamp);
    console.log('[Game]   message:', message);
    
    // Submit to backend
    const result = await backendAPI.submitScore(
      address,
      playerName,
      finalScore,
      signature,
      timestamp,
      message  // Pass the exact message that was signed
    );
    
    console.log('[Game] Ã¢Å“â€œ Score submitted to backend:', result);
    
    // Show notification if new record
    if (result.data && result.data.isNewRecord) {
      console.log('[Game] Ã°Å¸Å½â€° New personal best on leaderboard!');
    }
    
  } catch (error) {
    // Propagate error to button handler
    console.error('[Game] Backend submission failed:', error.message);
    throw error;  // Re-throw to let button handler catch it
  }
}
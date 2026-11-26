// Minimal Tic Tac Toe logic + feature: apply black board class via button
// + Confetti animation implementation (no external deps)
(function () {
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const newGameBtn = document.getElementById('newGameBtn');
  const blackBtn = document.getElementById('blackBtn');
  const cells = Array.from(document.querySelectorAll('.cell'));

  let state = null;

  const WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diags
  ];

  // ===== Confetti implementation (self-contained) =====
  // Simple particle-based confetti drawn on a canvas overlay that sits on top of the board
  // Requirements met:
  // - multiple colors
  // - starts on victory
  // - stops immediately on new game
  // - pointer-events: none so it doesn't block controls
  // - respects prefers-reduced-motion

  let confettiCanvas = null;
  let confettiCtx = null;
  let confettiParticles = [];
  let confettiAnimationId = null;
  let confettiTimeoutId = null;
  let confettiRunning = false;

  // Default colors (multiple perceptible hues)
  const DEFAULT_COLORS = ['#ff6b6b', '#ffd93d', '#6be3ff', '#9b8cff', '#2ecc71', '#ff8a65'];

  function createCanvas() {
    if (confettiCanvas) return;
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.className = 'confetti-canvas';
    confettiCanvas.style.position = 'absolute';
    confettiCanvas.style.top = '0';
    confettiCanvas.style.left = '0';
    confettiCanvas.style.width = '100%';
    confettiCanvas.style.height = '100%';
    confettiCanvas.style.pointerEvents = 'none';
    boardEl.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext('2d');
    resizeCanvas();
    // keep canvas size in sync
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!confettiCanvas) return;
    const rect = boardEl.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    confettiCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
    confettiCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
    confettiCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function startConfetti(options = {}) {
    // If user prefers reduced motion, do not start the animation
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && mq.matches) return; // do not animate
    } catch (e) {
      // ignore matchMedia errors and proceed
    }

    if (confettiRunning) {
      // restart: stop current and start anew
      stopConfetti();
    }

    const colors = options.colors || DEFAULT_COLORS;
    const duration = typeof options.duration === 'number' ? options.duration : 4000; // ms
    const particleCount = typeof options.particleCount === 'number' ? options.particleCount : 90;

    createCanvas();

    // Create particles
    confettiParticles = [];
    const rect = boardEl.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    for (let i = 0; i < particleCount; i++) {
      // spawn across the top area with some upward velocity so they spread
      const x = Math.random() * width;
      const y = - (Math.random() * 20); // slightly above top
      const size = 6 + Math.random() * 8;
      const tilt = Math.random() * 360;
      const color = colors[Math.floor(Math.random() * colors.length)];
      // velocities: give a burst with random horizontal and slight upward velocity
      const vx = (Math.random() - 0.5) * 6; // -3..3
      const vy = -6 - Math.random() * 6; // -12..-6 (upwards initially)
      const angular = (Math.random() - 0.5) * 0.2;
      confettiParticles.push({ x, y, vx, vy, size, color, tilt, angular, life: 0, opacity: 1 });
    }

    confettiRunning = true;

    let lastTime = performance.now();

    function update(now) {
      const dt = Math.min(50, now - lastTime) / 1000; // seconds, clamp for tab throttling
      lastTime = now;
      const gravity = 30; // px/s^2
      const drag = 0.995;

      for (let p of confettiParticles) {
        p.vx *= drag;
        p.vy += gravity * dt;
        p.x += p.vx;
        p.y += p.vy * dt * 60 * dt; // adjust for dt (approx)
        p.tilt += p.angular * 200 * dt;
        p.life += dt;
        // fade out towards end
        if (p.life > 3) {
          p.opacity -= 0.02;
          if (p.opacity < 0) p.opacity = 0;
        }
      }

      // remove off-screen and fully faded particles to keep draws efficient
      confettiParticles = confettiParticles.filter(p => p.y < height + 50 && p.opacity > 0);

      draw();

      if (confettiRunning && (confettiParticles.length > 0)) {
        confettiAnimationId = requestAnimationFrame(update);
      } else {
        // nothing left to draw, ensure canvas cleared
        stopConfetti(true);
      }
    }

    function draw() {
      if (!confettiCtx) return;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      for (let p of confettiParticles) {
        confettiCtx.save();
        confettiCtx.globalAlpha = p.opacity;
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.tilt * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;
        // draw a small rectangle to simulate confetti piece
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        confettiCtx.restore();
      }
    }

    resizeCanvas();
    confettiAnimationId = requestAnimationFrame(update);

    // stop after duration
    confettiTimeoutId = setTimeout(() => {
      // let particles finish falling but prevent new frames spawning beyond existing
      // mark running false so update will stop when particles exhausted
      confettiRunning = confettiParticles.length > 0;
      // if no particles left, stop immediately
      if (!confettiRunning) stopConfetti(true);
    }, duration);
  }

  function stopConfetti(forceClear) {
    // forceClear: if true, clear canvas immediately
    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
    if (confettiTimeoutId) {
      clearTimeout(confettiTimeoutId);
      confettiTimeoutId = null;
    }
    confettiRunning = false;
    confettiParticles = [];
    if (confettiCtx && forceClear) {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    // keep the canvas element (so future animations are faster). If you'd rather remove it, uncomment below.
    // if (confettiCanvas && confettiCanvas.parentNode) confettiCanvas.parentNode.removeChild(confettiCanvas);
  }

  // Expose for debugging (optional): window.__confetti = { startConfetti, stopConfetti };

  // ===== End confetti implementation =====

  function newGame() {
    // Stop any confetti immediately when a new game starts
    try { stopConfetti(true); } catch (e) { /* swallow errors to avoid breaking newGame */ }

    state = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      status: 'playing', // 'playing' | 'won' | 'draw'
      winner: null,
      winningCells: []
    };
    render();
  }

  function makeMove(index) {
    if (state.status !== 'playing') return { success:false, reason: 'game_over' };
    if (state.board[index]) return { success:false, reason: 'occupied' };
    state.board[index] = state.currentPlayer;
    // check win
    const winnerInfo = checkWin();
    if (winnerInfo) {
      state.status = 'won';
      state.winner = winnerInfo.player;
      state.winningCells = winnerInfo.cells;
      render();
      // Trigger confetti on victory. Provide colors and duration; stopConfetti is idempotent.
      startConfetti({ colors: DEFAULT_COLORS, duration: 4200, particleCount: 110 });
    } else if (state.board.every(Boolean)) {
      state.status = 'draw';
      render();
    } else {
      state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
      render();
    }
    return { success:true, state };
  }

  function checkWin() {
    for (const combo of WIN_COMBOS) {
      const [a,b,c] = combo;
      if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
        return { player: state.board[a], cells: combo };
      }
    }
    return null;
  }

  function render() {
    // render cells
    cells.forEach((cellEl, idx) => {
      const val = state.board[idx];
      cellEl.textContent = val || '';
      cellEl.classList.remove('x','o','winning');
      if (val === 'X') cellEl.classList.add('x');
      if (val === 'O') cellEl.classList.add('o');
    });
    // highlight winning cells
    if (state.status === 'won' && state.winningCells.length) {
      state.winningCells.forEach(i => cells[i].classList.add('winning'));
      statusEl.textContent = `Vitória: ${state.winner}`;
    } else if (state.status === 'draw') {
      statusEl.textContent = 'Empate!';
    } else {
      statusEl.textContent = `Vez do jogador ${state.currentPlayer}`;
    }
  }

  // Event handlers
  function onCellClick(e) {
    const idx = Number(e.currentTarget.dataset.index);
    makeMove(idx);
  }

  function onCellKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const idx = Number(e.currentTarget.dataset.index);
      makeMove(idx);
    }
  }

  function applyBlackBoard() {
    // Idempotent: simply add the class; repeated clicks have no adverse effect
    boardEl.classList.add('board--black');
  }

  // Attach listeners
  cells.forEach(cell => {
    cell.addEventListener('click', onCellClick);
    cell.addEventListener('keydown', onCellKey);
  });

  newGameBtn.addEventListener('click', () => newGame());
  blackBtn.addEventListener('click', () => applyBlackBoard());

  // initialize
  newGame();
})();
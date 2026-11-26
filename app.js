// Minimal Tic Tac Toe logic + feature: apply black board class via button
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

  function newGame() {
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
    } else if (state.board.every(Boolean)) {
      state.status = 'draw';
    } else {
      state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    }
    render();
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
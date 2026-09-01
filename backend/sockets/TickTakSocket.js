let waitingQueue = [];
const games = {};

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) return 'Draw';
  return null;
}

module.exports = (tictactoeNamespace) => {
  tictactoeNamespace.on('connection', (socket) => {

    // 1. Queue player for matchmaking
    socket.on('find_match', () => {
      // Prevent duplicate queueing
      if (waitingQueue.some((s) => s.id === socket.id)) return;

      if (waitingQueue.length > 0) {
        const opponentSocket = waitingQueue.shift();
        const roomId = `ttt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        socket.join(roomId);
        opponentSocket.join(roomId);

        // Randomly assign 'X' and 'O'
        const isFirstPlayerX = Math.random() < 0.5;
        const player1Symbol = isFirstPlayerX ? 'X' : 'O';
        const player2Symbol = isFirstPlayerX ? 'O' : 'X';

        const initialBoard = Array(9).fill(null);

        games[roomId] = {
          board: initialBoard,
          players: {
            [socket.id]: player1Symbol,
            [opponentSocket.id]: player2Symbol
          },
          turn: 'X', // 'X' always moves first
          isOver: false
        };

        // Notify socket 1
        socket.emit('game_ready', {
          roomId,
          symbol: player1Symbol,
          board: initialBoard,
          turn: 'X'
        });

        // Notify socket 2
        opponentSocket.emit('game_ready', {
          roomId,
          symbol: player2Symbol,
          board: initialBoard,
          turn: 'X'
        });
      } else {
        waitingQueue.push(socket);
        socket.emit('waiting_for_opponent', { message: 'Searching for an opponent...' });
      }
    });

    // 2. Process moves
    socket.on('make_move', ({ roomId, index }) => {
      const game = games[roomId];
      if (!game || game.isOver) return;

      const playerSymbol = game.players[socket.id];

      // Validate turn and empty square
      if (!playerSymbol || game.turn !== playerSymbol) return;
      if (index < 0 || index > 8 || game.board[index] !== null) return;

      // Apply move
      game.board[index] = playerSymbol;

      // Check win or draw status
      const outcome = checkWinner(game.board);
      if (outcome) {
        game.isOver = true;
      }

      // Switch turn
      const nextTurn = playerSymbol === 'X' ? 'O' : 'X';
      game.turn = nextTurn;

      // Broadcast updated state to room
      tictactoeNamespace.to(roomId).emit('move_made', {
        board: game.board,
        turn: nextTurn
      });

      // Cleanup game if finished
      if (game.isOver) {
        delete games[roomId];
      }
    });

    // 3. Handle disconnect
    socket.on('disconnect', () => {
      // Remove from matchmaking queue if present
      waitingQueue = waitingQueue.filter((s) => s.id !== socket.id);

      // Clean up active game and notify opponent
      for (const [roomId, game] of Object.entries(games)) {
        if (game.players[socket.id]) {
          tictactoeNamespace.to(roomId).emit('opponent_left', {
            message: 'Opponent disconnected.'
          });
          delete games[roomId];
          break;
        }
      }
    });
  });
};
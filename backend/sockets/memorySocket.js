// sockets/memorySocket.js

let waitingQueue = [];
const games = {};

const CARD_VALUES = ['🍎', '🍌', '🍇', '🍒', '🍕', '🍔', '🍩', '🥊'];

// Generate and shuffle 8 pairs (16 cards)
function generateShuffledDeck() {
  const deck = [...CARD_VALUES, ...CARD_VALUES];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.map((value, id) => ({
    id,
    value,
    isMatched: false
  }));
}

module.exports = (memoryNamespace) => {
  memoryNamespace.on('connection', (socket) => {
    console.log(`[Memory] Player connected: ${socket.id}`);

    // 1. Matchmaking Queue
    socket.on('find_match', () => {
      if (waitingQueue.some((s) => s.id === socket.id)) return;

      if (waitingQueue.length > 0) {
        const opponentSocket = waitingQueue.shift();
        const roomId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        socket.join(roomId);
        opponentSocket.join(roomId);

        const deck = generateShuffledDeck();

        games[roomId] = {
          deck, // Master deck kept secure on backend
          flippedCards: [], // Max 2 indices currently face up
          scores: {
            [socket.id]: 0,
            [opponentSocket.id]: 0
          },
          turn: socket.id,
          players: [socket.id, opponentSocket.id]
        };

        // Send game initialization (masking values to prevent cheating)
        memoryNamespace.to(roomId).emit('game_ready', {
          roomId,
          boardSize: deck.length,
          turn: games[roomId].turn,
          players: games[roomId].players
        });

      } else {
        waitingQueue.push(socket);
        socket.emit('waiting_for_opponent', { message: 'Searching for Memory Match opponent...' });
      }
    });

    // 2. Card Flip Handling
    socket.on('flip_card', ({ roomId, cardIndex }) => {
      const game = games[roomId];
      if (!game) return;

      // FIX 1: Guard against invalid or out-of-bounds cardIndex
      if (
        !game.deck[cardIndex] ||
        game.turn !== socket.id ||
        game.flippedCards.length >= 2 ||
        game.deck[cardIndex].isMatched ||
        game.flippedCards.includes(cardIndex)
      ) {
        return;
      }

      // Flip card and reveal value to room
      game.flippedCards.push(cardIndex);
      const revealedCard = game.deck[cardIndex];

      memoryNamespace.to(roomId).emit('card_flipped', {
        cardIndex,
        value: revealedCard.value,
        flippedBy: socket.id
      });

      // When 2 cards are flipped, check for match
      if (game.flippedCards.length === 2) {
        const [firstIdx, secondIdx] = game.flippedCards;
        const card1 = game.deck[firstIdx];
        const card2 = game.deck[secondIdx];

        if (card1.value === card2.value) {
          // MATCH FOUND
          card1.isMatched = true;
          card2.isMatched = true;
          game.scores[socket.id] += 1;
          game.flippedCards = [];

          // Check for game end (8 total pairs)
          const totalMatches = Object.values(game.scores).reduce((a, b) => a + b, 0);
          const isGameOver = totalMatches === CARD_VALUES.length;

          let winner = null;
          if (isGameOver) {
            const [p1, p2] = game.players;
            if (game.scores[p1] > game.scores[p2]) winner = p1;
            else if (game.scores[p2] > game.scores[p1]) winner = p2;
            else winner = 'Draw';
          }

          memoryNamespace.to(roomId).emit('match_result', {
            matchedIndices: [firstIdx, secondIdx],
            scores: game.scores,
            keepTurn: true,
            turn: game.turn,
            isGameOver,
            winner
          });

          // FIX 2: Clean up completed games to prevent memory leaks
          if (isGameOver) {
            delete games[roomId];
          }

        } else {
          // NO MATCH -> Switch turns after a 1.2s delay for players to memorize
          setTimeout(() => {
            // FIX 3: Verify room still exists before mutating state (prevents crash on disconnect)
            if (!games[roomId]) return;

            const nextTurn = game.players.find((id) => id !== socket.id);
            game.turn = nextTurn;
            game.flippedCards = [];

            memoryNamespace.to(roomId).emit('match_result', {
              unflipIndices: [firstIdx, secondIdx],
              scores: game.scores,
              keepTurn: false,
              turn: game.turn,
              isGameOver: false
            });
          }, 1200);
        }
      }
    });

    // 3. Disconnect Handling
    socket.on('disconnect', () => {
      waitingQueue = waitingQueue.filter((s) => s.id !== socket.id);

      for (const [roomId, game] of Object.entries(games)) {
        if (game.players.includes(socket.id)) {
          memoryNamespace.to(roomId).emit('opponent_left', { message: 'Opponent left the memory match.' });
          delete games[roomId];
          break;
        }
      }
    });
  });
};
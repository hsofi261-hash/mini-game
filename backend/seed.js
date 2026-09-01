const sequelize = require('./db');
const Game = require('./models/Game');
const GameRule = require('./models/GameRule');

const gamesData = {
  "tic-tac-toe": {
    "id": "tic-tac-toe",
    "title": "Tic-Tac-Toe",
    "tagline": "The timeless game of grid strategy and tactical placement.",
    "description": "Challenge yourself against a smart AI opponent or match up with players worldwide. Master corner control, force double-threat setups, and dominate the 3x3 grid.",
    "category": "Strategy",
    "difficulty": "Easy",
    "icon": "❌⭕",
    "color": "from-blue-600 to-indigo-700",
    "rules": [
      { "step": 1, "title": "Grid Setup", "desc": "The game is played on a 3x3 grid of nine square spots." },
      { "step": 2, "title": "Taking Turns", "desc": "Player 1 places an X and Player 2 places an O in turn until all spots are filled or a player wins." },
      { "step": 3, "title": "Winning Condition", "desc": "Connect 3 of your marks horizontally, vertically, or diagonally to secure victory." },
      { "step": 4, "title": "Draw Condition", "desc": "If all 9 squares are filled and neither player has 3 marks in a row, the match ends in a draw." }
    ],
    "tips": [
      "Occupy the center square early to maximize potential line connections.",
      "Control two opposing corners to force your opponent into defense mode.",
      "Create a double-threat (fork) where you have two ways to win on your next turn."
    ]
  },
  "memorycards": {
    "id": "memorycards",
    "title": "Memory Cards",
    "tagline": "Test your focus and short-term visual memory matching pairs.",
    "description": "Flip and match matching pairs of cards in as few moves and fastest time as possible. Train concentration and pattern recognition skills.",
    "category": "Memory & Focus",
    "difficulty": "Medium",
    "icon": "🧠🃏",
    "color": "from-purple-600 to-pink-700",
    "rules": [
      { "step": 1, "title": "Grid Lay Out", "desc": "Cards are shuffled face-down across a rectangular grid." },
      { "step": 2, "title": "Flip Two Cards", "desc": "Select two cards to reveal their hidden symbols." },
      { "step": 3, "title": "Match or Reset", "desc": "If symbols match, cards remain face-up. If not, both cards flip back down." },
      { "step": 4, "title": "Clear the Board", "desc": "Match all card pairs in minimum total moves to maximize your high score." }
    ],
    "tips": [
      "Mentally divide grid into 2x2 quadrants to remember positions easier.",
      "Take your time on early flips to memorize board layouts.",
      "Prioritize uncovering corner cards first."
    ]
  }
};

async function seedDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync(); // Ensures tables exist before checking/inserting
    console.log('Database synchronized.');

    for (const gameKey in gamesData) {
      const gameData = gamesData[gameKey];

      // Check if game already exists in DB
      const existingGame = await Game.findByPk(gameData.id);

      if (existingGame) {
        console.log(`[SKIP] Game "${gameData.title}" (${gameData.id}) already exists.`);
        continue;
      }

      // Execute insertion inside a transaction
      await sequelize.transaction(async (t) => {
        // 1. Insert main Game record
        await Game.create({
          id: gameData.id,
          title: gameData.title,
          tagline: gameData.tagline,
          description: gameData.description,
          category: gameData.category,
          difficulty: gameData.difficulty,
          rating: gameData.rating,
          totalReviews: gameData.totalReviews,
          plays: gameData.plays,
          icon: gameData.icon,
          color: gameData.color,
          tips: gameData.tips || []
        }, { transaction: t });

        // 2. Insert Game Rules
        if (gameData.rules && gameData.rules.length > 0) {
          const rules = gameData.rules.map(rule => ({
            ...rule,
            gameId: gameData.id
          }));
          await GameRule.bulkCreate(rules, { transaction: t });
        }
      });

      console.log(`[ADDED] Game "${gameData.title}" (${gameData.id}) successfully inserted.`);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
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
  },
  "retro-snake": {
    "id": "retro-snake",
    "title": "Retro Snake",
    "tagline": "Eat food, grow longer, and avoid hitting walls or your own tail.",
    "description": "Control the snake to eat food and grow longer. Maneuver carefully through the grid without running into the walls or your growing tail.",
    "category": "Arcade",
    "difficulty": "Hard",
    "icon": "🐍",
    "color": "from-emerald-600 to-teal-700",
    "rules": [
      { "step": 1, "title": "Movement", "desc": "Use arrow keys or swipe controls to change the snake direction." },
      { "step": 2, "title": "Eat Food", "desc": "Guide the snake to food items to grow longer and gain points." },
      { "step": 3, "title": "Avoid Collisions", "desc": "Do not collide with the grid boundaries or the snake's own tail." }
    ],
    "tips": [
      "Plan your path to avoid trapping yourself against walls.",
      "Keep the tail in sight to ensure you always have an escape route."
    ]
  },
  "2048-puzzle": {
    "id": "2048-puzzle",
    "title": "2048 Puzzle",
    "tagline": "Slide tiles and combine matching numbers to reach 2048.",
    "description": "Slide tiles across the grid. When two tiles with the same number touch, they merge into one with double the value!",
    "category": "Puzzle",
    "difficulty": "Easy",
    "icon": "🔢",
    "color": "from-amber-500 to-orange-600",
    "rules": [
      { "step": 1, "title": "Slide Tiles", "desc": "Swipe in four directions to move all tiles across the grid." },
      { "step": 2, "title": "Combine Numbers", "desc": "Tiles with identical numbers merge into a single tile with double value." },
      { "step": 3, "title": "Reach 2048", "desc": "Keep combining tiles until you create the 2048 tile to win." }
    ],
    "tips": [
      "Keep your highest tile pinned in one of the corners.",
      "Build high-value tiles sequentially right next to each other."
    ]
  },
  "whack-a-mole": {
    "id": "whack-a-mole",
    "title": "Whack-a-Mole",
    "tagline": "Test your reflexes! Tap the moles before they hide back.",
    "description": "Moles pop up randomly from their holes. Tap or click them as fast as you can before they disappear to score maximum points.",
    "category": "Reflex",
    "difficulty": "Medium",
    "icon": "🔨",
    "color": "from-amber-700 to-yellow-800",
    "rules": [
      { "step": 1, "title": "Watch the Holes", "desc": "Moles emerge randomly from grid holes for a limited time." },
      { "step": 2, "title": "Tap Quickly", "desc": "Click or tap moles as soon as they emerge to score points." },
      { "step": 3, "title": "Time Limit", "desc": "Whack as many moles as possible before the timer runs out." }
    ],
    "tips": [
      "Keep your visual focus centered on the grid to react faster.",
      "Maintain a steady rhythm rather than tapping wildly."
    ]
  },
  "word-guess": {
    "id": "word-guess",
    "title": "Word Guess",
    "tagline": "Guess the hidden 5-letter word in 6 attempts or fewer.",
    "description": "Test your vocabulary skills! Each guess gives color feedback showing how close your letters are to the secret target word.",
    "category": "Word",
    "difficulty": "Medium",
    "icon": "🔤",
    "color": "from-green-600 to-emerald-700",
    "rules": [
      { "step": 1, "title": "Enter a Word", "desc": "Type any valid 5-letter word to make your first guess." },
      { "step": 2, "title": "Check Color Hints", "desc": "Green means right spot, yellow means wrong spot, gray means letter not in word." },
      { "step": 3, "title": "Solve in 6 Attempts", "desc": "Deduce the secret word within six turns to win." }
    ],
    "tips": [
      "Start with a word rich in common vowels (A, E, I) and consonants (R, S, T).",
      "Avoid reusing grayed-out letters in future attempts."
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
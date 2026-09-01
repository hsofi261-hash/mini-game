const { Op } = require('sequelize');
const Game = require('../models/Game'); 
const GameRule = require('../models/GameRule');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const Review = require('../models/Review');



const getAllGames = async (req, res) => {
  try {
    // 1. Extract query parameters with defaults
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 9; // Fixed at 9 items per page
    const search = req.query.search ? req.query.search.trim() : '';

    // 2. Calculate offset for pagination
    const offset = (page - 1) * limit;

    // 3. Build search condition (searches title, category, tagline, or description)
    const whereCondition = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { category: { [Op.like]: `%${search}%` } },
            { tagline: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // 4. Fetch items and total count in a single query
    const { count, rows: games } = await Game.findAndCountAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      order: [['title', 'ASC']], // Sort alphabetically by title
    });

    // 5. Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // 6. Return response
    return res.status(200).json({
      success: true,
      data: games,
      pagination: {
        totalGames: count,
        totalPages: totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Error fetching games:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve games.',
      error: err.message,
    });
  }
};



const getGameDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the game with all its associated models
    const game = await Game.findByPk(id, {
      include: [
        {
          model: GameRule,
          attributes: ['id', 'step', 'title', 'desc'],
        },
        {
          model: LeaderboardEntry,
          attributes: ['id', 'rank', 'user', 'avatar', 'wins', 'winRate', 'score', 'badge'],
        },
        {
          model: Review,
          attributes: ['id', 'user', 'avatar', 'rating', 'date', 'comment'],
        },
      ],
      order: [
        [{ model: GameRule }, 'step', 'ASC'],            // Sort rules step by step (1, 2, 3...)
        [{ model: LeaderboardEntry }, 'rank', 'ASC'],    // Sort leaderboard by rank (1, 2, 3...)
      ],
    });

    // Handle case where game is not found
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: game,
    });
  } catch (err) {
    console.error('Error fetching game detail:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve game details',
      error: err.message,
    });
  }
};



module.exports = {
  getAllGames,
  getGameDetail,
};
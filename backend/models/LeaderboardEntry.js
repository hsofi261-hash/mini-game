const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Game = require('./Game');

const LeaderboardEntry = sequelize.define('LeaderboardEntry', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  winRate: {
    type: DataTypes.STRING
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  badge: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Associations
Game.hasMany(LeaderboardEntry, { foreignKey: 'gameId', onDelete: 'CASCADE' });
LeaderboardEntry.belongsTo(Game, { foreignKey: 'gameId' });

module.exports = LeaderboardEntry;
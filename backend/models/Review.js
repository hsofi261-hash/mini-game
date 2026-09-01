const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Game = require('./Game');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.STRING
  },
  comment: {
    type: DataTypes.TEXT
  }
});

// Associations
Game.hasMany(Review, { foreignKey: 'gameId', onDelete: 'CASCADE' });
Review.belongsTo(Game, { foreignKey: 'gameId' });

module.exports = Review;
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tagline: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.STRING
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 5.0
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  plays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  icon: {
    type: DataTypes.STRING
  },
  color: {
    type: DataTypes.STRING
  },
  onlinePlayers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tips: {
    type: DataTypes.JSON
  }
});

module.exports = Game;
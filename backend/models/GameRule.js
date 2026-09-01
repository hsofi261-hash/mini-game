const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Game = require('./Game');

const GameRule = sequelize.define('GameRule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  step: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  desc: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

// Associations
Game.hasMany(GameRule, { foreignKey: 'gameId', onDelete: 'CASCADE' });
GameRule.belongsTo(Game, { foreignKey: 'gameId' });

module.exports = GameRule;
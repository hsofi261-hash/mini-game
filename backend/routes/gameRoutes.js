const express = require('express')
const route = express.Router();
const { getAllGames, getGameDetail } = require('../controller/gameControll')

route.get('/', getAllGames)
route.get('/:id', getGameDetail)

module.exports = route
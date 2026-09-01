const express = require('express')
const router = express.Router();
const { register, login, refreshToken, jwtverify, checkUser, logout} = require('../controller/UserControll')

router.post('/register', register);
router.post('/login', login)
router.post('/refresh', refreshToken)
router.get('/checkuser', jwtverify, checkUser)
router.post('/logout', logout)

module.exports = router
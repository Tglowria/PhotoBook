const express = require('express');
const { signup, login, updateUser } = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup );
router.post('/login', login );
router.put('/update', authMiddleware, updateUser )


module.exports = router;


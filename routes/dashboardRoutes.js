const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.post('/stats', dashboardController.stats);

module.exports = router;

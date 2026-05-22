const express = require('express');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

router.post('/today', attendanceController.today);
router.post('/punch', attendanceController.punch);
router.post('/history', attendanceController.history);

module.exports = router;

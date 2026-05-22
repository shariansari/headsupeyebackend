const express = require('express');
const employeeController = require('../controllers/employeeController');

const router = express.Router();

router.post('/search', employeeController.search);
router.post('/get', employeeController.getById);
router.post('/create', employeeController.create);
router.post('/update', employeeController.update);
router.post('/delete', employeeController.remove);

// Admin panel — reset an employee's Face ID.
router.post('/reset-face', employeeController.resetFace);

// Mobile-app endpoints — use the signed-in employee from the JWT.
router.post('/me', employeeController.me);
router.post('/enroll-face', employeeController.enrollFace);

module.exports = router;

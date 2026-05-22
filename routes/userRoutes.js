const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/search', userController.search);
router.post('/get', userController.getById);
router.post('/create', userController.create);
router.post('/update', userController.update);
router.post('/delete', userController.remove);

module.exports = router;

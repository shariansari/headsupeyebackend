const express = require('express');
const unitController = require('../controllers/unitController');

const router = express.Router();

router.post('/search', unitController.search);
router.post('/get', unitController.getById);
router.post('/create', unitController.create);
router.post('/update', unitController.update);
router.post('/delete', unitController.remove);

module.exports = router;

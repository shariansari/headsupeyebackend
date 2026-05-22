const express = require('express');
const roleController = require('../controllers/roleController');

const router = express.Router();

router.post('/search', roleController.search);
router.post('/get', roleController.getById);
router.post('/create', roleController.create);
router.post('/update', roleController.update);
router.post('/delete', roleController.remove);

module.exports = router;

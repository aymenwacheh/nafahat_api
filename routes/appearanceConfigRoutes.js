const express = require('express');
const router = express.Router();
const controller = require('../controllers/appearanceConfigController');

router.get('/:key', controller.getConfig);
router.put('/:key', controller.saveConfig);
router.delete('/:key', controller.deleteConfig);

module.exports = router;

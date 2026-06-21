// routes/videos.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// ✅ Routes pour les vidéos
router.get('/', videoController.getAllVideos);
router.get('/:id', videoController.getVideoById);
router.post('/', videoController.createVideo);
router.put('/:id', videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);
router.post('/:id/views', videoController.incrementViews);

module.exports = router;
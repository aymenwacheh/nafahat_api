// routes/chatbot.js
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Routes publiques
router.get('/categories', chatbotController.getCategories);
router.get('/qa', chatbotController.getAllQA);
router.post('/ask', chatbotController.askQuestion);

// Routes admin
router.post('/qa', chatbotController.createQA);
router.delete('/qa/:id', chatbotController.deleteQA);

module.exports = router;
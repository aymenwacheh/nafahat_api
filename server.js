const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import des routes
const formationRoutes = require('./routes/formations');
const formateurRoutes = require('./routes/formateurs');
const categorieRoutes = require('./routes/categories');
//const sousCategoriesRoutes = require('./routes/sousCategories'); 
const uploadRoutes = require('./routes/upload');
const videosRoutes = require('./routes/videos');
const dureeRoutes = require('./routes/duree');
const typeFormationRoutes = require('./routes/typeFormation');

// Utilisation des routes
app.use('/api/formations', formationRoutes);
app.use('/api/formateurs', formateurRoutes);
app.use('/api/categories', categorieRoutes);
//app.use('/api/sous-categories', sousCategoriesRoutes); 
app.use('/api/upload', uploadRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/durees', dureeRoutes);
app.use('/api/types-formation', typeFormationRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenue sur l\'API Nafahat' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
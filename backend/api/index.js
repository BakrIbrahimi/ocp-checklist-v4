const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Créer les dossiers nécessaires
const dataDir = path.join(__dirname, '../data');
const uploadsDir = path.join(__dirname, '../uploads');

fs.ensureDirSync(dataDir);
fs.ensureDirSync(uploadsDir);

// Routes API
app.use('/api/reports', require('./reports'));
app.use('/api/photos', require('./photos'));

// Servir les fichiers statiques en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
  });
}

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'OCP Checklist API is running',
    timestamp: new Date().toISOString(),
    dataDir: dataDir,
    uploadsDir: uploadsDir
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Health check: http://localhost:${PORT}/api/health`);
    console.log(`Data directory: ${dataDir}`);
    console.log(`Uploads directory: ${uploadsDir}`);
  });
}

module.exports = app;
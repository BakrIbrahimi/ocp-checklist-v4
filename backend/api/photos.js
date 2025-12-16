const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

// Servir une photo
router.get('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (await fs.pathExists(filePath)) {
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'image/jpeg';
      
      switch (ext) {
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        default:
          contentType = 'application/octet-stream';
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Error streaming photo:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur lors du chargement de la photo'
        });
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Photo non trouvée'
      });
    }
  } catch (error) {
    console.error('Error serving photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement de la photo',
      error: error.message
    });
  }
});

// Télécharger une photo
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (await fs.pathExists(filePath)) {
      res.download(filePath, filename, (error) => {
        if (error) {
          console.error('Error downloading photo:', error);
          res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement'
          });
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Photo non trouvée'
      });
    }
  } catch (error) {
    console.error('Error downloading photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement',
      error: error.message
    });
  }
});

// Supprimer une photo
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (await fs.pathExists(filePath)) {
      await fs.unlink(filePath);
      res.json({
        success: true,
        message: 'Photo supprimée avec succès'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Photo non trouvée'
      });
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo',
      error: error.message
    });
  }
});

// Liste des photos
router.get('/', async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads');
    
    if (await fs.pathExists(uploadsPath)) {
      const files = await fs.readdir(uploadsPath);
      const photos = [];
      
      for (const file of files) {
        const filePath = path.join(uploadsPath, file);
        const stats = await fs.stat(filePath);
        
        photos.push({
          filename: file,
          path: `/api/photos/${file}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        });
      }
      
      res.json({
        success: true,
        photos: photos,
        count: photos.length,
        totalSize: photos.reduce((sum, photo) => sum + photo.size, 0)
      });
    } else {
      res.json({
        success: true,
        photos: [],
        count: 0,
        totalSize: 0
      });
    }
  } catch (error) {
    console.error('Error listing photos:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du listage des photos',
      error: error.message
    });
  }
});

module.exports = router;
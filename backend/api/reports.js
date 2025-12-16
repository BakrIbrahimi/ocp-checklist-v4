const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// Configuration du stockage pour Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Configuration Multer CORRIGÉE
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max par fichier
    files: 50 // Max 50 fichiers par requête
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// Chemin du fichier de stockage des rapports
const REPORTS_FILE = path.join(__dirname, '../data/reports.json');

// Initialiser le fichier de rapports
async function initReportsFile() {
  try {
    await fs.ensureFile(REPORTS_FILE);
    const content = await fs.readFile(REPORTS_FILE, 'utf8');
    if (!content.trim()) {
      await fs.writeJson(REPORTS_FILE, { reports: [], nextId: 1 });
    }
  } catch (error) {
    await fs.writeJson(REPORTS_FILE, { reports: [], nextId: 1 });
  }
}

// Lire les rapports
async function readReports() {
  await initReportsFile();
  try {
    return await fs.readJson(REPORTS_FILE);
  } catch (error) {
    return { reports: [], nextId: 1 };
  }
}

// Écrire les rapports
async function writeReports(data) {
  try {
    await fs.writeJson(REPORTS_FILE, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error writing reports:', error);
    return false;
  }
}

// CORRIGÉ: Sauvegarder un rapport complet avec photos
router.post('/save', upload.any(), async (req, res) => {
  try {
    console.log('Saving report...');
    console.log('Files received:', req.files?.length || 0);
    console.log('Body fields:', Object.keys(req.body));
    
    // Récupérer les données du rapport
    const reportData = req.body.report ? JSON.parse(req.body.report) : {};
    const files = req.files || [];
    
    // Générer un ID unique
    const reportsData = await readReports();
    const reportId = reportsData.nextId++;
    
    console.log('Processing photos...');
    
    // Traiter les photos CORRIGÉ
    const photos = {};
    files.forEach(file => {
      console.log('Processing file:', file.fieldname, file.originalname);
      
      // Extraire les informations de la photo depuis le nom du champ
      // Format attendu: photos[taskId][type]
      const match = file.fieldname.match(/photos\[([^\]]+)\]\[([^\]]+)\]/);
      
      if (match) {
        const taskId = match[1];
        const type = match[2];
        
        console.log(`Matched: taskId=${taskId}, type=${type}`);
        
        if (taskId && type) {
          if (!photos[taskId]) photos[taskId] = {};
          
          photos[taskId][type] = {
            filename: file.filename,
            path: `/api/photos/${file.filename}`,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            fieldname: file.fieldname
          };
        }
      } else {
        // Essayer un format alternatif
        const altMatch = file.fieldname.split('-');
        if (altMatch.length >= 2) {
          const taskId = altMatch.slice(0, -1).join('-');
          const type = altMatch[altMatch.length - 1];
          
          if (taskId && type) {
            if (!photos[taskId]) photos[taskId] = {};
            
            photos[taskId][type] = {
              filename: file.filename,
              path: `/api/photos/${file.filename}`,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              fieldname: file.fieldname
            };
          }
        }
      }
    });
    
    console.log('Photos processed:', Object.keys(photos).length);
    
    // Créer le rapport complet
    const report = {
      id: reportId,
      ...reportData,
      photos: photos,
      filesCount: files.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Report created with ID:', reportId);
    
    // Ajouter le rapport
    reportsData.reports.push(report);
    
    // Sauvegarder
    const saved = await writeReports(reportsData);
    
    if (saved) {
      console.log('Report saved successfully');
      res.json({
        success: true,
        message: 'Rapport sauvegardé avec succès',
        reportId: reportId,
        report: {
          id: reportId,
          formData: report.formData,
          stats: report.stats,
          createdAt: report.createdAt,
          filesCount: files.length,
          photosCount: Object.keys(photos).length
        }
      });
    } else {
      throw new Error('Erreur lors de la sauvegarde du rapport');
    }
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde du rapport',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir tous les rapports (résumé)
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, date, hall } = req.query;
    const reportsData = await readReports();
    
    // Filtrer si nécessaire
    let filteredReports = [...reportsData.reports];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = filteredReports.filter(r => 
        (r.formData?.hall && r.formData.hall.toLowerCase().includes(searchLower)) ||
        (r.formData?.responsible && r.formData.responsible.toLowerCase().includes(searchLower))
      );
    }
    
    if (date) {
      filteredReports = filteredReports.filter(r => 
        r.formData && r.formData.date === date
      );
    }
    
    if (hall) {
      filteredReports = filteredReports.filter(r => 
        r.formData && r.formData.hall === hall
      );
    }
    
    // Trier par date (plus récent d'abord)
    filteredReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    
    const paginatedReports = filteredReports.slice(startIndex, endIndex);
    
    // Retourner seulement les informations de base
    const summaryReports = paginatedReports.map(report => ({
      id: report.id,
      formData: report.formData,
      stats: report.stats,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      filesCount: report.filesCount,
      checklistCount: report.checklistData ? report.checklistData.length : 0
    }));
    
    res.json({
      success: true,
      reports: summaryReports,
      total: filteredReports.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredReports.length / limitNum)
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rapports',
      error: error.message
    });
  }
});

// Obtenir un rapport complet par ID
router.get('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const reportsData = await readReports();
    const report = reportsData.reports.find(r => r.id === reportId);
    
    if (report) {
      res.json({
        success: true,
        report: report
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du rapport',
      error: error.message
    });
  }
});

// Supprimer un rapport
router.delete('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const reportsData = await readReports();
    const reportIndex = reportsData.reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
      const report = reportsData.reports[reportIndex];
      
      // Supprimer les photos associées
      if (report.photos) {
        for (const taskId in report.photos) {
          for (const type in report.photos[taskId]) {
            const photo = report.photos[taskId][type];
            const photoPath = path.join(__dirname, '../uploads', photo.filename);
            try {
              if (await fs.pathExists(photoPath)) {
                await fs.unlink(photoPath);
              }
            } catch (error) {
              console.error('Error deleting photo:', error);
            }
          }
        }
      }
      
      // Supprimer le rapport
      reportsData.reports.splice(reportIndex, 1);
      
      // Sauvegarder
      const saved = await writeReports(reportsData);
      
      if (saved) {
        res.json({
          success: true,
          message: 'Rapport supprimé avec succès'
        });
      } else {
        throw new Error('Erreur lors de la sauvegarde après suppression');
      }
    } else {
      res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du rapport',
      error: error.message
    });
  }
});

// Mettre à jour un rapport
router.put('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const updates = req.body;
    const reportsData = await readReports();
    const reportIndex = reportsData.reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
      reportsData.reports[reportIndex] = {
        ...reportsData.reports[reportIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      const saved = await writeReports(reportsData);
      
      if (saved) {
        res.json({
          success: true,
          message: 'Rapport mis à jour avec succès',
          report: reportsData.reports[reportIndex]
        });
      } else {
        throw new Error('Erreur lors de la sauvegarde de la mise à jour');
      }
    } else {
      res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du rapport',
      error: error.message
    });
  }
});

// Exporter les rapports en CSV
router.get('/export/csv', async (req, res) => {
  try {
    const reportsData = await readReports();
    
    let csvContent = 'ID,Date,Hall,Responsable,Effectif,Début,Fin,Taux,Tâches Planifiées,Tâches Réalisées,Total Tâches,Photos,Created At\n';
    
    reportsData.reports.forEach(report => {
      const row = [
        report.id,
        `"${report.formData?.date || ''}"`,
        `"${report.formData?.hall || ''}"`,
        `"${report.formData?.responsible || ''}"`,
        report.formData?.staffCount || '',
        report.formData?.startTime || '',
        report.formData?.endTime || '',
        report.stats?.planningRate || '0%',
        report.stats?.tasksPlanned || 0,
        report.stats?.tasksDone || 0,
        report.stats?.totalTasks || 0,
        report.filesCount || 0,
        report.createdAt
      ].join(',');
      
      csvContent += row + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=rapports_ocp_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export CSV',
      error: error.message
    });
  }
});

module.exports = router;
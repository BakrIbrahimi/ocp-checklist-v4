// Configuration de l'API
const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : '/api',
    
    ENDPOINTS: {
        REPORTS: '/reports',
        PHOTOS: '/photos',
        HEALTH: '/health'
    }
};

// Données des halls et désignations
const hallsData = {
    "HE06 JFC4/107D": {
        "Circuit de stockage": [
            "SC03 + Jetée",
            "SD02 + Jetée",
            "SE02 + Jetée",
            "AAT02 + Jetée",
            "ABT03 + Jetée"
        ],
        "Circuit de chargement": [
            "ABT05",
            "Jetée ABT05/ABT01",
            "Bâtiment de vente locale",
            "Gratteur"
        ],
        "Hall de stockage": [
            "Les couloirs",
            "Extra Hall"
        ]
    },
    "HE06 JFC2/107E": {
        "Circuit de stockage": [
            "SC02 + Jetée",
            "SD01 + Jetée",
            "SE01 + Jetée",
            "AAT02 + Jetée",
            "ABT03 + Jetée"
        ],
        "Circuit de chargement": [
            "ABT05",
            "Jetée ABT05/ABT01",
            "Bâtiment de vente locale",
            "Gratteur"
        ],
        "Hall de stockage": [
            "Les couloirs",
            "Extra Hall"
        ]
    },
    "HE03/107F": {
        "Circuit de stockage": [
            "SC01 + Jetée",
            "SD03 + Jetée",
            "SJ01 + Jetée"
        ],
        "Circuit de chargement": [
            "ABT03 + Jetée",
            "Bâtiment de vente locale",
            "Gratteur"
        ],
        "Hall de stockage": [
            "Les couloirs",
            "Extra Hall"
        ]
    }
};

// État de l'application
const appState = {
    currentHall: "HE06 JFC4/107D",
    checklistData: [],
    tasksPlanned: 0,
    tasksDone: 0,
    totalTasks: 0,
    currentPhotoTask: null,
    currentPhotoType: null,
    photoData: {},
    currentReportId: null,
    isOnline: false,
    currentPage: 1,
    reportsPerPage: 12,
    totalReports: 0,
    currentMode: 'new-report',
    currentReportDetail: null,
    galleryPhotos: [],
    currentGalleryIndex: 0
};

// Éléments DOM
const DOM = {
    // Sections
    mainContainer: document.getElementById('main-container'),
    newReportSection: document.getElementById('new-report-section'),
    savedReportsSection: document.getElementById('saved-reports-section'),
    reportDetailSection: document.getElementById('report-detail-section'),
    
    // Boutons mode
    btnNewReport: document.getElementById('btn-new-report'),
    btnViewReports: document.getElementById('btn-view-reports'),
    
    // Formulaire
    storageHallSelect: document.getElementById('storage-hall'),
    dateInput: document.getElementById('date'),
    currentDateElement: document.getElementById('current-date'),
    responsibleInput: document.getElementById('responsible'),
    staffCountInput: document.getElementById('staff-count'),
    startTimeInput: document.getElementById('start-time'),
    endTimeInput: document.getElementById('end-time'),
    
    // Statistiques
    planningRateElement: document.getElementById('planning-rate'),
    tasksDoneElement: document.getElementById('tasks-done'),
    tasksPlannedElement: document.getElementById('tasks-planned'),
    
    // Tableau
    checklistBody: document.getElementById('checklist-body'),
    
    // Boutons action
    resetAllButton: document.getElementById('reset-all'),
    saveLocalButton: document.getElementById('save-local'),
    saveServerButton: document.getElementById('save-server'),
    shareWhatsAppButton: document.getElementById('share-whatsapp'),
    
    // Boutons export
    exportExcelButton: document.getElementById('export-excel'),
    exportCSVButton: document.getElementById('export-csv'),
    exportPDFButton: document.getElementById('export-pdf'),
    exportWordButton: document.getElementById('export-word'),
    
    // Rapports sauvegardés
    searchReportsInput: document.getElementById('search-reports'),
    filterDateInput: document.getElementById('filter-date'),
    filterHallSelect: document.getElementById('filter-hall'),
    refreshReportsButton: document.getElementById('refresh-reports'),
    exportAllReportsButton: document.getElementById('export-all-reports'),
    reportsGrid: document.getElementById('reports-grid'),
    reportsPagination: document.getElementById('reports-pagination'),
    
    // Détail rapport
    backToReportsButton: document.getElementById('back-to-reports'),
    detailTitle: document.getElementById('detail-title'),
    reportDetailContent: document.getElementById('report-detail-content'),
    viewAllPhotosButton: document.getElementById('view-all-photos'),
    
    // Input file
    photoInput: document.getElementById('photo-input'),
    
    // Modals
    photoModal: document.getElementById('photo-modal'),
    galleryModal: document.getElementById('gallery-modal'),
    confirmModal: document.getElementById('confirm-modal'),
    loadingModal: document.getElementById('loading-modal'),
    
    // Footer
    currentYearElement: document.getElementById('current-year'),
    
    // Status indicator
    statusIndicator: null,
    
    // Galerie
    galleryGrid: document.getElementById('gallery-grid'),
    galleryFilterType: document.getElementById('gallery-filter-type'),
    galleryFilterStatus: document.getElementById('gallery-filter-status'),
    galleryReportInfo: document.getElementById('gallery-report-info'),
    galleryPhotoCount: document.getElementById('gallery-photo-count'),
    
    // Navigation photo
    prevPhotoButton: document.getElementById('prev-photo'),
    nextPhotoButton: document.getElementById('next-photo'),
    photoCounter: document.getElementById('photo-counter')
};

// Variables temporaires
let pendingConfirm = null;

// Initialisation de l'application
async function initApp() {
    // Initialiser la date
    const today = new Date().toISOString().split('T')[0];
    DOM.dateInput.value = today;
    DOM.filterDateInput.value = '';
    DOM.filterHallSelect.value = '';
    
    // Mettre à jour l'affichage de la date
    updateCurrentDate();
    
    // Mettre à jour l'année en cours
    DOM.currentYearElement.textContent = new Date().getFullYear();
    
    // Créer l'indicateur de statut
    createStatusIndicator();
    
    // Vérifier la connexion serveur
    await checkServerConnection();
    
    // Configurer les écouteurs d'événements
    setupEventListeners();
    
    // Générer le tableau initial
    generateChecklistTable();
    
    // Charger les données locales
    loadFromLocalStorage();
    
    // Configurer l'input file pour les photos
    setupPhotoInput();
    
    // Configurer les modals
    setupModals();
    
    showNotification('Application OCP Checklist prête!', 'success');
    
    // Charger les rapports si en mode sauvegardés
    if (appState.currentMode === 'saved-reports') {
        loadReportsFromServer();
    }
}

// Créer l'indicateur de statut
function createStatusIndicator() {
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'status-indicator';
    statusIndicator.className = 'status-indicator status-offline';
    document.body.appendChild(statusIndicator);
    DOM.statusIndicator = statusIndicator;
    updateConnectionStatus();
}

// Mettre à jour la date actuelle
function updateCurrentDate() {
    const dateDisplay = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    DOM.currentDateElement.textContent = dateDisplay;
}

// Vérifier la connexion serveur
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        appState.isOnline = response.ok;
        updateConnectionStatus();
        
        if (response.ok) {
            return true;
        }
    } catch (error) {
        console.warn('Server connection failed:', error);
        appState.isOnline = false;
        updateConnectionStatus();
    }
    return false;
}

// Mettre à jour l'indicateur de statut
function updateConnectionStatus() {
    if (!DOM.statusIndicator) return;
    
    if (appState.isOnline) {
        DOM.statusIndicator.className = 'status-indicator status-online';
        DOM.statusIndicator.innerHTML = '<i class="fas fa-wifi"></i> Connecté au serveur';
        DOM.saveServerButton.disabled = false;
    } else {
        DOM.statusIndicator.className = 'status-indicator status-offline';
        DOM.statusIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> Mode hors ligne';
        DOM.saveServerButton.disabled = true;
    }
}

// Configurer l'input file pour les photos
function setupPhotoInput() {
    DOM.photoInput.addEventListener('change', handlePhotoUpload);
}

// CORRIGÉ: Configurer les modals
function setupModals() {
    // Modal photo individuelle
    const photoModalClose = DOM.photoModal.querySelector('.modal-close');
    if (photoModalClose) {
        photoModalClose.addEventListener('click', () => {
            DOM.photoModal.classList.remove('active');
        });
    }
    
    DOM.photoModal.addEventListener('click', (e) => {
        if (e.target === DOM.photoModal) {
            DOM.photoModal.classList.remove('active');
        }
    });
    
    // Modal galerie
    const galleryModalClose = DOM.galleryModal.querySelector('.modal-close');
    if (galleryModalClose) {
        galleryModalClose.addEventListener('click', () => {
            DOM.galleryModal.classList.remove('active');
        });
    }
    
    DOM.galleryModal.addEventListener('click', (e) => {
        if (e.target === DOM.galleryModal) {
            DOM.galleryModal.classList.remove('active');
        }
    });
    
    // Modal confirmation - CORRECTION
    const confirmModalClose = DOM.confirmModal.querySelector('.modal-close');
    if (confirmModalClose) {
        confirmModalClose.addEventListener('click', () => {
            hideModal('confirm');
            if (pendingConfirm && pendingConfirm.onCancel) {
                pendingConfirm.onCancel();
            }
            pendingConfirm = null;
        });
    }
    
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmOk = document.getElementById('confirm-ok');
    
    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => {
            hideModal('confirm');
            if (pendingConfirm && pendingConfirm.onCancel) {
                pendingConfirm.onCancel();
            }
            pendingConfirm = null;
        });
    }
    
    if (confirmOk) {
        confirmOk.addEventListener('click', () => {
            hideModal('confirm');
            if (pendingConfirm && pendingConfirm.onConfirm) {
                pendingConfirm.onConfirm();
            }
            pendingConfirm = null;
        });
    }
    
    // Fermer modals avec ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (DOM.photoModal.classList.contains('active')) {
                DOM.photoModal.classList.remove('active');
            }
            if (DOM.galleryModal.classList.contains('active')) {
                DOM.galleryModal.classList.remove('active');
            }
            if (DOM.confirmModal.classList.contains('active')) {
                hideModal('confirm');
            }
        }
    });
    
    // Navigation galerie
    if (DOM.prevPhotoButton) {
        DOM.prevPhotoButton.addEventListener('click', showPrevPhoto);
    }
    
    if (DOM.nextPhotoButton) {
        DOM.nextPhotoButton.addEventListener('click', showNextPhoto);
    }
    
    // Filtres galerie
    if (DOM.galleryFilterType) {
        DOM.galleryFilterType.addEventListener('change', updateGallery);
    }
    
    if (DOM.galleryFilterStatus) {
        DOM.galleryFilterStatus.addEventListener('change', updateGallery);
    }
    
    // Télécharger photo
    const downloadPhotoBtn = document.getElementById('download-photo');
    if (downloadPhotoBtn) {
        downloadPhotoBtn.addEventListener('click', downloadCurrentPhoto);
    }
}

// Configurer les écouteurs d'événements
function setupEventListeners() {
    // Boutons mode
    DOM.btnNewReport.addEventListener('click', () => switchMode('new-report'));
    DOM.btnViewReports.addEventListener('click', () => switchMode('saved-reports'));
    
    // Changement de hall
    DOM.storageHallSelect.addEventListener('change', function() {
        const hallCode = this.value;
        const hallSuffix = hallCode === "HE03" ? "107F" : 
                          hallCode === "HE06 JFC2" ? "107E" : "107D";
        appState.currentHall = `${hallCode}/${hallSuffix}`;
        generateChecklistTable();
        saveToLocalStorage();
    });
    
    // Boutons action
    DOM.resetAllButton.addEventListener('click', resetAll);
    DOM.saveLocalButton.addEventListener('click', saveToLocalStorage);
    DOM.saveServerButton.addEventListener('click', saveToServer);
    DOM.shareWhatsAppButton.addEventListener('click', shareWhatsApp);
    DOM.viewAllPhotosButton.addEventListener('click', showAllPhotos);
    
    // Boutons export
    DOM.exportExcelButton.addEventListener('click', exportExcel);
    DOM.exportCSVButton.addEventListener('click', exportCurrentCSV);
    DOM.exportPDFButton.addEventListener('click', exportPDF);
    DOM.exportWordButton.addEventListener('click', exportWord);
    
    // Gestion des rapports
    DOM.searchReportsInput.addEventListener('input', debounce(() => loadReportsFromServer(), 300));
    DOM.filterDateInput.addEventListener('change', () => loadReportsFromServer());
    DOM.filterHallSelect.addEventListener('change', () => loadReportsFromServer());
    DOM.refreshReportsButton.addEventListener('click', () => loadReportsFromServer());
    DOM.exportAllReportsButton.addEventListener('click', exportAllReportsCSV);
    DOM.backToReportsButton.addEventListener('click', () => switchMode('saved-reports'));
    
    // Sauvegarde automatique des champs
    const autoSaveFields = [
        DOM.dateInput, DOM.responsibleInput, DOM.staffCountInput,
        DOM.startTimeInput, DOM.endTimeInput
    ];
    
    autoSaveFields.forEach(field => {
        field.addEventListener('change', () => saveToLocalStorage());
    });
}

// Débounce pour les recherches
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Changer de mode
function switchMode(mode) {
    appState.currentMode = mode;
    
    // Mettre à jour les boutons mode
    DOM.btnNewReport.classList.toggle('active', mode === 'new-report');
    DOM.btnViewReports.classList.toggle('active', mode === 'saved-reports');
    
    // Afficher/masquer les sections
    DOM.newReportSection.classList.toggle('active-section', mode === 'new-report');
    DOM.newReportSection.classList.toggle('hidden-section', mode !== 'new-report');
    
    DOM.savedReportsSection.classList.toggle('active-section', mode === 'saved-reports');
    DOM.savedReportsSection.classList.toggle('hidden-section', mode !== 'saved-reports');
    
    DOM.reportDetailSection.classList.toggle('active-section', mode === 'report-detail');
    DOM.reportDetailSection.classList.toggle('hidden-section', mode !== 'report-detail');
    
    // Actions spécifiques au mode
    if (mode === 'saved-reports') {
        loadReportsFromServer();
    } else if (mode === 'new-report') {
        // Recharger les données locales
        loadFromLocalStorage();
    }
}

// Générer le tableau de checklist
function generateChecklistTable() {
    if (!DOM.checklistBody) return;
    
    const hall = appState.currentHall;
    const hallData = hallsData[hall];
    DOM.checklistBody.innerHTML = '';
    
    // Réinitialiser l'état
    appState.checklistData = [];
    appState.tasksPlanned = 0;
    appState.tasksDone = 0;
    appState.totalTasks = 0;
    
    // Parcourir chaque circuit et ses désignations
    for (const [circuit, designations] of Object.entries(hallData)) {
        // Ajouter une ligne d'en-tête pour le circuit
        const circuitRow = document.createElement('tr');
        circuitRow.className = 'hall-header';
        circuitRow.innerHTML = `
            <td colspan="7">${circuit}</td>
        `;
        DOM.checklistBody.appendChild(circuitRow);
        
        // Ajouter chaque désignation
        designations.forEach((designation, index) => {
            const taskId = `${hall}-${circuit.replace(/\s+/g, '-')}-${index}`;
            appState.totalTasks++;
            
            // Récupérer les données sauvegardées pour cette tâche
            const savedTask = appState.checklistData.find(t => t.id === taskId) || {};
            const hasBeforePhoto = appState.photoData[`${taskId}-before`];
            const hasAfterPhoto = appState.photoData[`${taskId}-after`];
            
            const row = document.createElement('tr');
            row.dataset.taskId = taskId;
            
            row.innerHTML = `
                <td>${hall}</td>
                <td>${designation}</td>
                <td>
                    <select class="planned-select" data-task="${taskId}">
                        <option value="non" ${savedTask.planned === 'non' ? 'selected' : ''}>Non</option>
                        <option value="oui" ${savedTask.planned === 'oui' ? 'selected' : ''}>Oui</option>
                    </select>
                </td>
                <td>
                    <div class="status-options">
                        <div class="status-option">
                            <input type="radio" name="status-${taskId}" class="status-checkbox done" value="fait" 
                                   data-task="${taskId}" id="fait-${taskId}" ${savedTask.status === 'fait' ? 'checked' : ''}>
                            <label class="status-label done" for="fait-${taskId}">Fait</label>
                        </div>
                        <div class="status-option">
                            <input type="radio" name="status-${taskId}" class="status-checkbox not-done" value="non-fait" 
                                   data-task="${taskId}" id="non-fait-${taskId}" ${savedTask.status === 'non-fait' ? 'checked' : ''}>
                            <label class="status-label not-done" for="non-fait-${taskId}">Non fait</label>
                        </div>
                        <div class="status-option">
                            <input type="radio" name="status-${taskId}" class="status-checkbox partial" value="partiel" 
                                   data-task="${taskId}" id="partiel-${taskId}" ${savedTask.status === 'partiel' ? 'checked' : ''}>
                            <label class="status-label partial" for="partiel-${taskId}">Partiel</label>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="photo-upload">
                        <button type="button" class="photo-btn ${hasBeforePhoto ? 'has-photo' : ''}" 
                                data-task="${taskId}" data-type="before">
                            <i class="fas ${hasBeforePhoto ? 'fa-check-circle' : 'fa-camera'}"></i> 
                            ${hasBeforePhoto ? 'Voir photo' : 'Ajouter'}
                        </button>
                        <span class="photo-name" id="photo-before-${taskId}">
                            ${hasBeforePhoto ? 'Photo ajoutée' : ''}
                        </span>
                    </div>
                </td>
                <td>
                    <div class="photo-upload">
                        <button type="button" class="photo-btn ${hasAfterPhoto ? 'has-photo' : ''}" 
                                data-task="${taskId}" data-type="after">
                            <i class="fas ${hasAfterPhoto ? 'fa-check-circle' : 'fa-camera'}"></i> 
                            ${hasAfterPhoto ? 'Voir photo' : 'Ajouter'}
                        </button>
                        <span class="photo-name" id="photo-after-${taskId}">
                            ${hasAfterPhoto ? 'Photo ajoutée' : ''}
                        </span>
                    </div>
                </td>
                <td>
                    <textarea class="comment-input" placeholder="Ajouter un commentaire..." 
                              data-task="${taskId}">${savedTask.comment || ''}</textarea>
                </td>
            `;
            
            DOM.checklistBody.appendChild(row);
            
            // Ajouter la tâche à l'état de l'application
            appState.checklistData.push({
                id: taskId,
                hall: hall,
                circuit: circuit,
                designation: designation,
                planned: savedTask.planned || 'non',
                status: savedTask.status || null,
                photoBefore: hasBeforePhoto ? 'oui' : 'non',
                photoAfter: hasAfterPhoto ? 'oui' : 'non',
                comment: savedTask.comment || ''
            });
        });
    }
    
    // Ajouter les écouteurs d'événements aux éléments dynamiques
    addDynamicEventListeners();
    updateStats();
}

// Ajouter les écouteurs d'événements aux éléments dynamiques
function addDynamicEventListeners() {
    // Écouteurs pour les sélecteurs "Planifié"
    document.querySelectorAll('.planned-select').forEach(select => {
        select.addEventListener('change', function() {
            const taskId = this.dataset.task;
            const task = appState.checklistData.find(t => t.id === taskId);
            if (task) {
                task.planned = this.value;
                updateStats();
                saveToLocalStorage();
            }
        });
    });
    
    // Écouteurs pour les boutons radio de statut
    document.querySelectorAll('.status-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = this.dataset.task;
            const task = appState.checklistData.find(t => t.id === taskId);
            if (task) {
                task.status = this.value;
                updateStats();
                saveToLocalStorage();
            }
        });
    });
    
    // Écouteurs pour les boutons de photo
    document.querySelectorAll('.photo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.dataset.task;
            const type = this.dataset.type;
            
            // Si une photo existe déjà, l'afficher
            if (appState.photoData[`${taskId}-${type}`]) {
                showPhotoModal(taskId, type);
            } else {
                // Sinon, ouvrir le sélecteur de fichiers
                openPhotoSelector(taskId, type);
            }
        });
    });
    
    // Écouteurs pour les commentaires
    document.querySelectorAll('.comment-input').forEach(textarea => {
        const taskId = textarea.dataset.task;
        const task = appState.checklistData.find(t => t.id === taskId);
        
        if (task) {
            textarea.value = task.comment || '';
        }
        
        textarea.addEventListener('input', function() {
            const taskId = this.dataset.task;
            const task = appState.checklistData.find(t => t.id === taskId);
            if (task) {
                task.comment = this.value;
                saveToLocalStorage();
            }
        });
    });
}

// Ouvrir le sélecteur de fichiers pour les photos
function openPhotoSelector(taskId, type) {
    appState.currentPhotoTask = taskId;
    appState.currentPhotoType = type;
    DOM.photoInput.click();
}

// Gérer l'upload de photo
async function handlePhotoUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    let uploadedCount = 0;
    
    for (const file of files) {
        // Vérifier le type de fichier
        if (!file.type.match('image.*')) {
            showNotification(`Le fichier "${file.name}" n'est pas une image valide`, 'error');
            continue;
        }
        
        // Vérifier la taille du fichier (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showNotification(`L'image "${file.name}" est trop volumineuse (max 10MB)`, 'error');
            continue;
        }
        
        try {
            const photoData = await readFileAsDataURL(file);
            const photoKey = `${appState.currentPhotoTask}-${appState.currentPhotoType}`;
            
            // Stocker la photo dans l'état
            appState.photoData[photoKey] = photoData;
            
            // Mettre à jour la tâche
            const task = appState.checklistData.find(t => t.id === appState.currentPhotoTask);
            if (task) {
                if (appState.currentPhotoType === 'before') {
                    task.photoBefore = 'oui';
                } else {
                    task.photoAfter = 'oui';
                }
            }
            
            // Mettre à jour l'interface
            updatePhotoButton(appState.currentPhotoTask, appState.currentPhotoType, true);
            
            uploadedCount++;
            
        } catch (error) {
            console.error('Error reading file:', error);
            showNotification(`Erreur lors de la lecture de "${file.name}"`, 'error');
        }
    }
    
    // Sauvegarder
    saveToLocalStorage();
    
    // Réinitialiser l'input file
    DOM.photoInput.value = '';
    
    if (uploadedCount > 0) {
        showNotification(`${uploadedCount} photo(s) ajoutée(s) avec succès!`, 'success');
    }
}

// Lire un fichier comme DataURL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Mettre à jour le bouton photo
function updatePhotoButton(taskId, type, hasPhoto) {
    const button = document.querySelector(`.photo-btn[data-task="${taskId}"][data-type="${type}"]`);
    const span = document.getElementById(`photo-${type}-${taskId}`);
    
    if (button && span) {
        if (hasPhoto) {
            button.classList.add('has-photo');
            button.innerHTML = `<i class="fas fa-check-circle"></i> Voir photo`;
            span.textContent = 'Photo ajoutée';
        } else {
            button.classList.remove('has-photo');
            button.innerHTML = `<i class="fas fa-camera"></i> Ajouter`;
            span.textContent = '';
        }
    }
}

// Afficher la photo en modal
function showPhotoModal(taskId, type) {
    const photoKey = `${taskId}-${type}`;
    const photoData = appState.photoData[photoKey];
    
    if (!photoData || !DOM.photoModal) return;
    
    // Mettre à jour le contenu
    const img = document.getElementById('photo-modal-image');
    const title = document.getElementById('photo-modal-title');
    const description = document.getElementById('photo-modal-description');
    
    if (img) img.src = photoData;
    
    // Trouver la tâche correspondante
    const task = appState.checklistData.find(t => t.id === taskId);
    if (task) {
        const taskText = `${task.designation}`;
        const typeText = `Photo ${type === 'before' ? 'avant' : 'après'} nettoyage`;
        const statusText = task.status ? `Statut: ${task.status}` : 'Statut: Non défini';
        const commentText = task.comment ? `Commentaire: ${task.comment}` : '';
        
        if (title) title.textContent = `${taskText} - ${typeText}`;
        if (description) description.innerHTML = `
            <strong>${statusText}</strong><br>
            ${commentText}
        `;
    }
    
    // Stocker les infos pour le téléchargement
    DOM.photoModal.dataset.currentPhoto = photoData;
    DOM.photoModal.dataset.currentFilename = `${taskId}-${type}.jpg`;
    
    // Afficher le modal
    DOM.photoModal.classList.add('active');
}

// Fermer le modal photo
function closePhotoModal() {
    DOM.photoModal.classList.remove('active');
}

// Télécharger la photo courante
function downloadCurrentPhoto() {
    const photoData = DOM.photoModal.dataset.currentPhoto;
    const filename = DOM.photoModal.dataset.currentFilename;
    
    if (!photoData) return;
    
    const link = document.createElement('a');
    link.href = photoData;
    link.download = filename;
    link.click();
}

// Sauvegarder dans le localStorage
function saveToLocalStorage() {
    try {
        const saveData = {
            formData: {
                date: DOM.dateInput.value,
                responsible: DOM.responsibleInput.value,
                staffCount: DOM.staffCountInput.value,
                startTime: DOM.startTimeInput.value,
                endTime: DOM.endTimeInput.value,
                hall: DOM.storageHallSelect.value
            },
            checklistData: appState.checklistData,
            photoData: appState.photoData,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('ocpChecklistCurrentReport', JSON.stringify(saveData));
        
        // Mettre à jour le bouton
        const originalHTML = DOM.saveLocalButton.innerHTML;
        DOM.saveLocalButton.innerHTML = '<i class="fas fa-check"></i> Sauvegardé';
        setTimeout(() => {
            DOM.saveLocalButton.innerHTML = originalHTML;
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde locale', 'error');
        return false;
    }
}

// Charger depuis le localStorage
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('ocpChecklistCurrentReport');
        if (!savedData) {
            return false;
        }
        
        const data = JSON.parse(savedData);
        
        // Charger les données du formulaire
        if (data.formData) {
            DOM.dateInput.value = data.formData.date || '';
            DOM.responsibleInput.value = data.formData.responsible || '';
            DOM.staffCountInput.value = data.formData.staffCount || '1';
            DOM.startTimeInput.value = data.formData.startTime || '';
            DOM.endTimeInput.value = data.formData.endTime || '';
            DOM.storageHallSelect.value = data.formData.hall || 'HE06 JFC4';
            
            const hallSuffix = data.formData.hall === "HE03" ? "107F" : 
                             data.formData.hall === "HE06 JFC2" ? "107E" : "107D";
            appState.currentHall = `${data.formData.hall || 'HE06 JFC4'}/${hallSuffix}`;
        }
        
        // Charger les données du checklist
        if (data.checklistData) {
            appState.checklistData = data.checklistData;
        }
        
        // Charger les photos
        if (data.photoData) {
            appState.photoData = data.photoData;
        }
        
        // Regénérer le tableau avec les données sauvegardées
        generateChecklistTable();
        
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return false;
    }
}

// CORRIGÉ: Sauvegarder sur le serveur
async function saveToServer() {
    if (!appState.isOnline) {
        showNotification('Non connecté au serveur', 'error');
        return false;
    }
    
    try {
        // Afficher un indicateur de chargement
        showLoading('Sauvegarde du rapport sur le serveur...');
        
        // Préparer les données
        const reportData = {
            formData: {
                date: DOM.dateInput.value,
                responsible: DOM.responsibleInput.value,
                staffCount: DOM.staffCountInput.value,
                startTime: DOM.startTimeInput.value,
                endTime: DOM.endTimeInput.value,
                hall: DOM.storageHallSelect.value
            },
            checklistData: appState.checklistData,
            stats: {
                planningRate: DOM.planningRateElement.textContent,
                tasksDone: appState.tasksDone,
                tasksPlanned: appState.tasksPlanned,
                totalTasks: appState.totalTasks
            },
            createdAt: new Date().toISOString()
        };
        
        // Préparer FormData pour l'envoi CORRIGÉ
        const formData = new FormData();
        formData.append('report', JSON.stringify(reportData));
        
        // Ajouter les photos au FormData CORRIGÉ
        let photoCount = 0;
        for (const [photoKey, photoBase64] of Object.entries(appState.photoData)) {
            const [taskId, type] = photoKey.split('-');
            try {
                const blob = base64ToBlob(photoBase64);
                // Format correct pour le backend
                formData.append(`photos[${taskId}][${type}]`, blob, `${taskId}-${type}.jpg`);
                photoCount++;
            } catch (error) {
                console.error(`Erreur conversion photo ${photoKey}:`, error);
            }
        }
        
        console.log('Envoi du rapport avec', photoCount, 'photos...');
        
        // Envoyer au serveur
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}/save`, {
            method: 'POST',
            body: formData
        });
        
        hideLoading();
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', errorText);
            throw new Error(`Erreur serveur: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            appState.currentReportId = result.reportId;
            showNotification(`Rapport sauvegardé sur le serveur! (ID: ${result.reportId})`, 'success');
            
            // Mettre à jour le bouton
            const originalHTML = DOM.saveServerButton.innerHTML;
            DOM.saveServerButton.innerHTML = '<i class="fas fa-check"></i> Sauvegardé';
            setTimeout(() => {
                DOM.saveServerButton.innerHTML = originalHTML;
            }, 2000);
            
            // Recharger la liste des rapports
            if (appState.currentMode === 'saved-reports') {
                loadReportsFromServer();
            }
            
            return true;
        } else {
            throw new Error(result.message || 'Erreur inconnue du serveur');
        }
    } catch (error) {
        console.error('Erreur sauvegarde serveur:', error);
        hideLoading();
        showNotification(`Erreur: ${error.message}`, 'error');
        return false;
    }
}

// Charger les rapports depuis le serveur
async function loadReportsFromServer(page = 1) {
    if (!appState.isOnline) {
        DOM.reportsGrid.innerHTML = `
            <div class="loading-reports">
                <i class="fas fa-wifi-slash fa-3x" style="color: #f44336; margin-bottom: 20px;"></i>
                <p>Mode hors ligne - Impossible de charger les rapports</p>
            </div>
        `;
        return;
    }
    
    try {
        // Afficher le chargement
        DOM.reportsGrid.innerHTML = `
            <div class="loading-reports">
                <div class="loader"></div>
                <p>Chargement des rapports...</p>
            </div>
        `;
        
        // Construire l'URL avec les filtres
        const params = new URLSearchParams({
            page: page,
            limit: appState.reportsPerPage
        });
        
        if (DOM.searchReportsInput.value) {
            params.append('search', DOM.searchReportsInput.value);
        }
        
        if (DOM.filterDateInput.value) {
            params.append('date', DOM.filterDateInput.value);
        }
        
        if (DOM.filterHallSelect.value) {
            params.append('hall', DOM.filterHallSelect.value);
        }
        
        // Récupérer les rapports
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}/all?${params}`);
        const result = await response.json();
        
        if (result.success) {
            appState.totalReports = result.total;
            appState.currentPage = page;
            
            // Afficher les rapports
            displayReports(result.reports);
            
            // Afficher la pagination
            displayPagination(result.totalPages, page);
        } else {
            throw new Error(result.message || 'Erreur lors du chargement des rapports');
        }
    } catch (error) {
        console.error('Erreur chargement rapports:', error);
        DOM.reportsGrid.innerHTML = `
            <div class="loading-reports">
                <i class="fas fa-exclamation-triangle fa-3x" style="color: #ff9800; margin-bottom: 20px;"></i>
                <p>Erreur lors du chargement des rapports</p>
                <button class="btn btn-primary" onclick="loadReportsFromServer()">
                    <i class="fas fa-redo"></i> Réessayer
                </button>
            </div>
        `;
    }
}

// Afficher les rapports dans la grille
function displayReports(reports) {
    if (reports.length === 0) {
        DOM.reportsGrid.innerHTML = `
            <div class="loading-reports">
                <i class="fas fa-inbox fa-3x" style="color: #9e9e9e; margin-bottom: 20px;"></i>
                <p>Aucun rapport trouvé</p>
                <p class="small">Créez votre premier rapport en mode "Nouveau Rapport"</p>
            </div>
        `;
        return;
    }
    
    DOM.reportsGrid.innerHTML = reports.map(report => `
        <div class="report-card" data-id="${report.id}">
            <div class="report-card-header">
                <span class="report-id">#${report.id}</span>
                <span class="report-date">${formatDate(report.createdAt)}</span>
            </div>
            <h3>${report.formData?.hall || 'Hall non spécifié'}</h3>
            <div class="report-info">
                <p><strong>Responsable:</strong> ${report.formData?.responsible || 'Non spécifié'}</p>
                <p><strong>Date:</strong> ${report.formData?.date || 'Non spécifié'}</p>
                <p><strong>Effectif:</strong> ${report.formData?.staffCount || '1'} personne(s)</p>
            </div>
            <div class="report-stats">
                <div class="stat-badge">
                    <i class="fas fa-chart-line"></i>
                    <span>${report.stats?.planningRate || '0%'}</span>
                </div>
                <div class="stat-badge">
                    <i class="fas fa-tasks"></i>
                    <span>${report.stats?.tasksDone || 0}/${report.stats?.tasksPlanned || 0}</span>
                </div>
                <div class="stat-badge">
                    <i class="fas fa-camera"></i>
                    <span>${report.filesCount || 0} photos</span>
                </div>
            </div>
            <div class="report-actions">
                <button class="btn btn-primary btn-view-report" data-id="${report.id}">
                    <i class="fas fa-eye"></i> Voir
                </button>
                <button class="btn btn-secondary btn-delete-report" data-id="${report.id}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `).join('');
    
    // Ajouter les écouteurs d'événements
    document.querySelectorAll('.btn-view-report').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const reportId = parseInt(btn.dataset.id);
            viewReportDetail(reportId);
        });
    });
    
    document.querySelectorAll('.btn-delete-report').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const reportId = parseInt(btn.dataset.id);
            deleteReport(reportId);
        });
    });
    
    // Clic sur la carte pour voir les détails
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-view-report') && !e.target.closest('.btn-delete-report')) {
                const reportId = parseInt(card.dataset.id);
                viewReportDetail(reportId);
            }
        });
    });
}

// Afficher la pagination
function displayPagination(totalPages, currentPage) {
    if (totalPages <= 1) {
        DOM.reportsPagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Bouton précédent
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="loadReportsFromServer(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }
    
    // Pages
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
        paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
            onclick="loadReportsFromServer(${i})">${i}</button>`;
    }
    
    // Bouton suivant
    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="loadReportsFromServer(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    DOM.reportsPagination.innerHTML = paginationHTML;
}

// Voir les détails d'un rapport
async function viewReportDetail(reportId) {
    try {
        showLoading('Chargement des détails du rapport...');
        
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}/${reportId}`);
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            appState.currentReportDetail = result.report;
            displayReportDetail(result.report);
            switchMode('report-detail');
        } else {
            throw new Error(result.message || 'Rapport non trouvé');
        }
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        hideLoading();
        showNotification('Erreur lors du chargement des détails', 'error');
    }
}

// Afficher les détails d'un rapport
function displayReportDetail(report) {
    // Mettre à jour le titre
    DOM.detailTitle.textContent = `Rapport #${report.id} - ${report.formData?.hall || 'Hall non spécifié'}`;
    
    // Générer le contenu
    let html = `
        <div class="detail-section">
            <h3><i class="fas fa-info-circle"></i> Informations Générales</h3>
            <div class="detail-info-grid">
                <div class="info-item">
                    <div class="info-label">Hall de Stockage</div>
                    <div class="info-value">${report.formData?.hall || 'Non spécifié'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date</div>
                    <div class="info-value">${report.formData?.date || 'Non spécifié'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Responsable</div>
                    <div class="info-value">${report.formData?.responsible || 'Non spécifié'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Effectif</div>
                    <div class="info-value">${report.formData?.staffCount || '1'} personne(s)</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Heure Début</div>
                    <div class="info-value">${report.formData?.startTime || 'Non spécifié'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Heure Fin</div>
                    <div class="info-value">${report.formData?.endTime || 'Non spécifié'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date de création</div>
                    <div class="info-value">${formatDateTime(report.createdAt)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Dernière modification</div>
                    <div class="info-value">${formatDateTime(report.updatedAt)}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="fas fa-chart-bar"></i> Statistiques</h3>
            <div class="detail-info-grid">
                <div class="info-item">
                    <div class="info-label">Taux de réalisation</div>
                    <div class="info-value" style="color: ${getRateColor(report.stats?.planningRate || '0%')}; font-weight: bold; font-size: 1.3rem;">
                        ${report.stats?.planningRate || '0%'}
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tâches réalisées</div>
                    <div class="info-value">${report.stats?.tasksDone || 0}/${report.stats?.tasksPlanned || 0}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Total tâches</div>
                    <div class="info-value">${report.stats?.totalTasks || 0}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Nombre de photos</div>
                    <div class="info-value">${report.filesCount || 0}</div>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter la checklist si disponible
    if (report.checklistData && report.checklistData.length > 0) {
        html += `
            <div class="detail-section">
                <h3><i class="fas fa-clipboard-check"></i> Checklist des Travaux</h3>
                <div class="detail-checklist">
                    <table>
                        <thead>
                            <tr>
                                <th>Lieu</th>
                                <th>Désignation</th>
                                <th>Planifié</th>
                                <th>Statut</th>
                                <th>Commentaire</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        report.checklistData.forEach(task => {
            const statusIcon = task.status === 'fait' ? '✅' : 
                             task.status === 'non-fait' ? '❌' : 
                             task.status === 'partiel' ? '⚠️' : '';
            
            html += `
                <tr>
                    <td>${task.circuit || ''}</td>
                    <td>${task.designation || ''}</td>
                    <td>${task.planned === 'oui' ? 'Oui' : 'Non'}</td>
                    <td>${statusIcon} ${task.status || 'Non défini'}</td>
                    <td>${task.comment || ''}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Ajouter les photos si disponibles
    if (report.photos && Object.keys(report.photos).length > 0) {
        html += `
            <div class="detail-section">
                <h3><i class="fas fa-camera"></i> Photos</h3>
                <div class="photos-grid">
        `;
        
        for (const [taskId, taskPhotos] of Object.entries(report.photos)) {
            const task = report.checklistData?.find(t => t.id === taskId);
            const taskName = task ? task.designation : taskId;
            const taskStatus = task ? task.status : 'inconnu';
            const taskComment = task ? task.comment : '';
            
            for (const [type, photoInfo] of Object.entries(taskPhotos)) {
                const statusClass = getStatusClass(taskStatus);
                const statusText = getStatusText(taskStatus);
                
                html += `
                    <div class="photo-thumbnail" onclick="viewServerPhotoInGallery('${photoInfo.filename}', '${taskName}', '${type}', '${taskStatus}', '${taskComment}')">
                        <div class="photo-thumbnail-img">
                            <img src="${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PHOTOS}/${photoInfo.filename}" 
                                 alt="${taskName}" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNNjUgNzVMMTM1IDc1TTEwMCA2NVYxMzVNODAgOTVMMTIwIDk1TTcwIDExMEwxMzAgMTEwIiBzdHJva2U9IiM5RTlFOUUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+'">
                        </div>
                        <div class="photo-thumbnail-info">
                            <div class="photo-thumbnail-title">${taskName}</div>
                            <div class="photo-thumbnail-desc">${type === 'before' ? 'Avant nettoyage' : 'Après nettoyage'}</div>
                            <div class="photo-thumbnail-desc">${taskComment ? taskComment.substring(0, 30) + (taskComment.length > 30 ? '...' : '') : 'Aucun commentaire'}</div>
                            <div class="photo-thumbnail-status ${statusClass}">${statusText}</div>
                        </div>
                    </div>
                `;
            }
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    DOM.reportDetailContent.innerHTML = html;
}

// Voir toutes les photos du rapport
function showAllPhotos() {
    if (!appState.currentReportDetail || !appState.currentReportDetail.photos) {
        showNotification('Aucune photo disponible dans ce rapport', 'info');
        return;
    }
    
    // Préparer les photos pour la galerie
    appState.galleryPhotos = [];
    
    for (const [taskId, taskPhotos] of Object.entries(appState.currentReportDetail.photos)) {
        const task = appState.currentReportDetail.checklistData?.find(t => t.id === taskId);
        
        for (const [type, photoInfo] of Object.entries(taskPhotos)) {
            appState.galleryPhotos.push({
                filename: photoInfo.filename,
                taskName: task ? task.designation : taskId,
                type: type,
                status: task ? task.status : 'inconnu',
                comment: task ? task.comment : '',
                url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PHOTOS}/${photoInfo.filename}`
            });
        }
    }
    
    // Afficher la galerie
    displayGallery();
    DOM.galleryModal.classList.add('active');
}

// Afficher la galerie photos
function displayGallery() {
    if (!appState.currentReportDetail || !DOM.galleryGrid) return;
    
    // Mettre à jour les informations
    DOM.galleryReportInfo.textContent = `Rapport #${appState.currentReportDetail.id} - ${appState.currentReportDetail.formData?.hall || 'Hall non spécifié'}`;
    DOM.galleryPhotoCount.textContent = `${appState.galleryPhotos.length} photo(s)`;
    
    // Filtrer les photos
    const filterType = DOM.galleryFilterType.value;
    const filterStatus = DOM.galleryFilterStatus.value;
    
    const filteredPhotos = appState.galleryPhotos.filter(photo => {
        if (filterType !== 'all' && photo.type !== filterType) return false;
        if (filterStatus !== 'all' && photo.status !== filterStatus) return false;
        return true;
    });
    
    // Afficher les photos
    DOM.galleryGrid.innerHTML = filteredPhotos.map((photo, index) => `
        <div class="gallery-item" onclick="openPhotoInGallery(${index})">
            <img src="${photo.url}" alt="${photo.taskName}" class="gallery-item-img"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNNjUgNzVMMTM1IDc1TTEwMCA2NVYxMzVNODAgOTVMMTIwIDk1TTcwIDExMEwxMzAgMTEwIiBzdHJva2U9IiM5RTlFOUUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+';">
            <div class="gallery-item-info">
                <div class="gallery-item-type type-${photo.type}">
                    ${photo.type === 'before' ? 'Avant' : 'Après'}
                </div>
                <div style="font-size: 0.8rem; font-weight: 500; margin-bottom: 3px;">${photo.taskName.substring(0, 20)}${photo.taskName.length > 20 ? '...' : ''}</div>
                <div style="font-size: 0.7rem; color: #666;">${getStatusText(photo.status)}</div>
            </div>
        </div>
    `).join('');
    
    if (filteredPhotos.length === 0) {
        DOM.galleryGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-images fa-3x" style="margin-bottom: 20px; opacity: 0.3;"></i>
                <p>Aucune photo ne correspond aux filtres sélectionnés</p>
            </div>
        `;
    }
}

// Mettre à jour la galerie
function updateGallery() {
    displayGallery();
}

// Ouvrir une photo dans la galerie
function openPhotoInGallery(index) {
    const filteredPhotos = getFilteredGalleryPhotos();
    if (index >= 0 && index < filteredPhotos.length) {
        const photo = filteredPhotos[index];
        appState.currentGalleryIndex = index;
        showGalleryPhoto(photo);
    }
}

// Obtenir les photos filtrées de la galerie
function getFilteredGalleryPhotos() {
    const filterType = DOM.galleryFilterType.value;
    const filterStatus = DOM.galleryFilterStatus.value;
    
    return appState.galleryPhotos.filter(photo => {
        if (filterType !== 'all' && photo.type !== filterType) return false;
        if (filterStatus !== 'all' && photo.status !== filterStatus) return false;
        return true;
    });
}

// Afficher une photo de la galerie
function showGalleryPhoto(photo) {
    const img = document.getElementById('photo-modal-image');
    const title = document.getElementById('photo-modal-title');
    const description = document.getElementById('photo-modal-description');
    
    if (img) img.src = photo.url;
    if (title) title.textContent = `${photo.taskName} - ${photo.type === 'before' ? 'Avant nettoyage' : 'Après nettoyage'}`;
    if (description) description.innerHTML = `
        <strong>Statut:</strong> ${getStatusText(photo.status)}<br>
        <strong>Commentaire:</strong> ${photo.comment || 'Aucun commentaire'}
    `;
    
    // Mettre à jour le compteur
    const filteredPhotos = getFilteredGalleryPhotos();
    const currentIndex = filteredPhotos.findIndex(p => p.filename === photo.filename);
    if (DOM.photoCounter) {
        DOM.photoCounter.textContent = `${currentIndex + 1}/${filteredPhotos.length}`;
    }
    
    // Stocker les infos pour la navigation
    DOM.photoModal.dataset.currentPhoto = null;
    DOM.photoModal.dataset.currentFilename = photo.filename;
    
    // Afficher le modal
    DOM.photoModal.classList.add('active');
}

// Photo précédente dans la galerie
function showPrevPhoto() {
    const filteredPhotos = getFilteredGalleryPhotos();
    if (filteredPhotos.length > 0) {
        appState.currentGalleryIndex = (appState.currentGalleryIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
        const photo = filteredPhotos[appState.currentGalleryIndex];
        showGalleryPhoto(photo);
    }
}

// Photo suivante dans la galerie
function showNextPhoto() {
    const filteredPhotos = getFilteredGalleryPhotos();
    if (filteredPhotos.length > 0) {
        appState.currentGalleryIndex = (appState.currentGalleryIndex + 1) % filteredPhotos.length;
        const photo = filteredPhotos[appState.currentGalleryIndex];
        showGalleryPhoto(photo);
    }
}

// Fermer la galerie
function closeGalleryModal() {
    DOM.galleryModal.classList.remove('active');
}

// Voir une photo du serveur dans la galerie
function viewServerPhotoInGallery(filename, taskName, type, status, comment) {
    const photo = {
        filename: filename,
        taskName: taskName,
        type: type,
        status: status,
        comment: comment,
        url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PHOTOS}/${filename}`
    };
    
    // Trouver l'index dans la galerie
    const filteredPhotos = getFilteredGalleryPhotos();
    const index = filteredPhotos.findIndex(p => p.filename === filename);
    if (index !== -1) {
        appState.currentGalleryIndex = index;
        showGalleryPhoto(photo);
    } else {
        // Si pas dans les filtres, afficher directement
        showGalleryPhoto(photo);
    }
}

// Supprimer un rapport
async function deleteReport(reportId) {
    showConfirm(
        'Supprimer le rapport',
        `Êtes-vous sûr de vouloir supprimer le rapport #${reportId} ? Cette action est irréversible.`,
        async () => {
            try {
                showLoading('Suppression du rapport...');
                
                const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}/${reportId}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                hideLoading();
                
                if (result.success) {
                    showNotification(`Rapport #${reportId} supprimé avec succès`, 'success');
                    loadReportsFromServer(appState.currentPage);
                } else {
                    throw new Error(result.message || 'Erreur lors de la suppression');
                }
            } catch (error) {
                console.error('Erreur suppression:', error);
                hideLoading();
                showNotification('Erreur lors de la suppression du rapport', 'error');
            }
        }
    );
}

// Exporter tous les rapports en CSV
async function exportAllReportsCSV() {
    if (!appState.isOnline) {
        showNotification('Non connecté au serveur', 'error');
        return;
    }
    
    try {
        showLoading('Préparation de l\'export...');
        
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}/export/csv`);
        const blob = await response.blob();
        
        hideLoading();
        
        // Télécharger le fichier
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapports_ocp_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Export CSV réussi!', 'success');
    } catch (error) {
        console.error('Erreur export CSV:', error);
        hideLoading();
        showNotification('Erreur lors de l\'export CSV', 'error');
    }
}

// Exporter le rapport courant en CSV
function exportCurrentCSV() {
    try {
        let csvContent = "Hall,Lieu,Désignation,Planifié,Statut,Photo avant,Photo après,Commentaire\n";
        
        appState.checklistData.forEach(task => {
            const row = [
                `"${task.hall}"`,
                `"${task.circuit}"`,
                `"${task.designation}"`,
                `"${task.planned}"`,
                `"${task.status || 'Non défini'}"`,
                `"${task.photoBefore || 'Non'}"`,
                `"${task.photoAfter || 'Non'}"`,
                `"${task.comment.replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + '\n';
        });
        
        // Créer un blob et télécharger
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `checklist_${DOM.dateInput.value}_${DOM.storageHallSelect.value}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Export CSV réussi!', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'export CSV:', error);
        showNotification('Erreur lors de l\'export CSV', 'error');
    }
}

// Mettre à jour les statistiques
function updateStats() {
    // Compter les tâches planifiées
    appState.tasksPlanned = appState.checklistData.filter(task => task.planned === 'oui').length;
    
    // Compter les tâches faites parmi celles planifiées
    appState.tasksDone = appState.checklistData.filter(task => 
        task.planned === 'oui' && task.status === 'fait').length;
    
    // Calculer le taux de réalisation
    const planningRate = appState.tasksPlanned > 0 ? 
        Math.round((appState.tasksDone / appState.tasksPlanned) * 100) : 0;
    
    // Mettre à jour l'affichage
    DOM.planningRateElement.textContent = `${planningRate}%`;
    DOM.tasksDoneElement.textContent = `${appState.tasksDone}/${appState.tasksPlanned}`;
    DOM.tasksPlannedElement.textContent = appState.tasksPlanned;
    
    // Mettre à jour la couleur en fonction du taux
    if (planningRate >= 80) {
        DOM.planningRateElement.style.color = '#4caf50';
    } else if (planningRate >= 50) {
        DOM.planningRateElement.style.color = '#ff9800';
    } else {
        DOM.planningRateElement.style.color = '#f44336';
    }
}

// CORRIGÉ: Réinitialiser toutes les données
function resetAll() {
    showConfirm(
        'Tout réinitialiser',
        'Êtes-vous sûr de vouloir tout réinitialiser? Toutes les données non sauvegardées seront perdues.',
        () => {
            // Réinitialiser le formulaire
            const today = new Date().toISOString().split('T')[0];
            DOM.dateInput.value = today;
            DOM.responsibleInput.value = '';
            DOM.staffCountInput.value = '1';
            DOM.startTimeInput.value = '';
            DOM.endTimeInput.value = '';
            DOM.storageHallSelect.value = 'HE06 JFC4';
            
            // Réinitialiser l'état
            appState.photoData = {};
            appState.currentReportId = null;
            appState.checklistData = [];
            appState.currentHall = "HE06 JFC4/107D";
            
            // Réinitialiser le tableau
            generateChecklistTable();
            
            // Mettre à jour la date affichée
            updateCurrentDate();
            
            // Effacer le localStorage
            localStorage.removeItem('ocpChecklistCurrentReport');
            
            showNotification('Toutes les données ont été réinitialisées.', 'success');
        }
    );
}

// Partager via WhatsApp
function shareWhatsApp() {
    const hall = DOM.storageHallSelect.value;
    const date = DOM.dateInput.value;
    const responsible = DOM.responsibleInput.value || 'Non spécifié';
    const planningRate = DOM.planningRateElement.textContent;
    const staffCount = DOM.staffCountInput.value;
    const startTime = DOM.startTimeInput.value || 'Non spécifiée';
    const endTime = DOM.endTimeInput.value || 'Non spécifiée';
    
    const formattedDate = new Date(date).toLocaleDateString('fr-FR');
    
    const message = `*Rapport de nettoyage OCP Group*
    
Hall: ${hall}
Date: ${formattedDate}
Responsable: ${responsible}
Effectif: ${staffCount} personne(s)
Heure de début: ${startTime}
Heure de fin: ${endTime}

*Statistiques:*
Taux de réalisation: ${planningRate}
Tâches planifiées: ${appState.tasksPlanned}
Tâches réalisées: ${appState.tasksDone}

*Détails des travaux:*
${generateTasksSummary()}

--- 
Rapport généré automatiquement par l'application OCP Checklist Nettoyage`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    showNotification('Préparation du partage WhatsApp...', 'info');
}

// Exporter en Excel
function exportExcel() {
    showNotification('Préparation de l\'export Excel...', 'info');
    setTimeout(() => {
        showNotification('Export Excel simulé avec succès!', 'success');
    }, 1000);
}

// Exporter en PDF
function exportPDF() {
    showNotification('Préparation de l\'export PDF...', 'info');
    setTimeout(() => {
        showNotification('Export PDF simulé avec succès!', 'success');
    }, 1000);
}

// Exporter en Word
function exportWord() {
    showNotification('Préparation de l\'export Word...', 'info');
    setTimeout(() => {
        showNotification('Export Word simulé avec succès!', 'success');
    }, 1000);
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getRateColor(rate) {
    const numericRate = parseInt(rate);
    if (numericRate >= 80) return '#4caf50';
    if (numericRate >= 50) return '#ff9800';
    return '#f44336';
}

function getStatusClass(status) {
    switch (status) {
        case 'fait': return 'status-fait';
        case 'non-fait': return 'status-non-fait';
        case 'partiel': return 'status-partiel';
        default: return 'status-non-fait';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'fait': return 'Fait';
        case 'non-fait': return 'Non fait';
        case 'partiel': return 'Partiel';
        default: return 'Non défini';
    }
}

function generateTasksSummary() {
    let summary = '';
    const plannedTasks = appState.checklistData.filter(task => task.planned === 'oui');
    
    if (plannedTasks.length === 0) {
        return 'Aucune tâche planifiée pour ce rapport.';
    }
    
    plannedTasks.forEach(task => {
        const status = task.status === 'fait' ? '✅' : 
                      task.status === 'non-fait' ? '❌' : 
                      task.status === 'partiel' ? '⚠️' : '⏳';
        summary += `${status} ${task.designation}\n`;
    });
    
    return summary;
}

function base64ToBlob(base64) {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
}

// Modal helpers
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showLoading(message = 'Chargement en cours...') {
    const messageEl = document.getElementById('loading-message');
    if (messageEl) {
        messageEl.textContent = message;
    }
    showModal('loading-modal');
}

function hideLoading() {
    hideModal('loading-modal');
}

// CORRIGÉ: Afficher une confirmation
function showConfirm(title, message, onConfirm, onCancel = null) {
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    
    pendingConfirm = { onConfirm, onCancel };
    showModal('confirm-modal');
}

// Afficher une notification
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Fermer la notification au clic
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Fermer automatiquement après 5 secondes
    document.body.appendChild(notification);
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', initApp);

// Vérifier périodiquement la connexion
setInterval(checkServerConnection, 30000);

// Sauvegarder automatiquement toutes les 30 secondes
setInterval(() => {
    if (appState.checklistData.length > 0) {
        saveToLocalStorage();
    }
}, 30000);
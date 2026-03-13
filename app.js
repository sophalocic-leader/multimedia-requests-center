// Store Keys
const STORAGE_KEY = 'mediaTrackRequests';
const TRASH_KEY = 'mediaTrackTrash';

// State
let requests = [];
let trashBin = [];
let currentRole = 'Admin'; 

let requestCurrentPage = 1;
let trashCurrentPage = 1;
const REQUESTS_PER_PAGE = 10;
const TRASH_PER_PAGE = 4;

const navItems = document.querySelectorAll('.nav-item');
// DOM Elements (Targeted)
const views = document.querySelectorAll('.view-section');
const pageTitle = document.getElementById('page-title');
const currentDateSpan = document.getElementById('current-date');

const requestForm = document.getElementById('request-form');
const btnCancel = document.getElementById('btn-cancel');

const metricTotal = document.getElementById('metric-total');
const metricPending = document.getElementById('metric-pending');
const metricCompleted = document.getElementById('metric-completed');

const requestsList = document.getElementById('requests-list');
const emptyState = document.getElementById('empty-state');
const statusFilter = document.getElementById('status-filter');
const timeFilter = document.getElementById('time-filter');
const roleSelector = document.getElementById('role-selector'); // New Role Select

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

const themeBtns = document.querySelectorAll('.theme-btn');
const THEME_KEY = 'mediaTrackTheme';
let currentTheme = localStorage.getItem(THEME_KEY) || 'dark';

// Page Detection
const isDashboard = document.getElementById('dashboard-view') !== null;
const isFormPage = document.getElementById('new-request-view') !== null;

// Modal Elements
const detailsModal = document.getElementById('details-modal');
const modalClose = document.getElementById('modal-close');
const modalBody = document.getElementById('modal-body-content');
const modalTitle = document.getElementById('modal-title');

// Initialize App
function init() {
    // Set Current Date (if element exists)
    if (currentDateSpan) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateSpan.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Setup Theme
    setupTheme();
    
    // Load Data
    loadRequests();
    loadTrash();
    purgeOldTrash();
    
    // Setup Event Listeners
    if (isDashboard) {
        setupFilters();
        setupModal();
        setupConfirmModal();
        setupNavSwitching();
        renderDashboard();
    }
    
    if (isFormPage) {
        setupForm();
    }
}

// Data Management
function loadRequests() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        requests = JSON.parse(saved);
    }
}

function saveRequests() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    if (isDashboard) renderDashboard();
}

function loadTrash() {
    const saved = localStorage.getItem(TRASH_KEY);
    if (saved) {
        trashBin = JSON.parse(saved);
    }
}

function saveTrash() {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trashBin));
}

function purgeOldTrash() {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const before = trashBin.length;
    trashBin = trashBin.filter(item => (now - item.deletedAt) < thirtyDays);
    if (trashBin.length !== before) saveTrash();
}

function addRequest(requestData) {
    const newRequest = {
        id: Date.now().toString(), // Simple unique ID
        dateSubmitted: new Date().toISOString(),
        status: 'pending',
        ...requestData
    };
    
    // Add to beginning of array
    requests.unshift(newRequest);
    saveRequests();
}

function toggleRequestStatus(id) {
    const req = requests.find(r => r.id === id);
    if (req) {
        req.status = req.status === 'pending' ? 'completed' : 'pending';
        saveRequests();
        showToast(`Request marked as ${req.status}`);
    }
}

// Confirm Modal Logic
let pendingDeleteId = null;

function setupConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    document.getElementById('confirm-cancel').addEventListener('click', () => {
        modal.classList.add('hidden');
        pendingDeleteId = null;
    });
    document.getElementById('confirm-delete').addEventListener('click', () => {
        if (pendingDeleteId) {
            moveToTrash(pendingDeleteId);
            pendingDeleteId = null;
        }
        modal.classList.add('hidden');
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            pendingDeleteId = null;
        }
    });
}

function deleteRequest(id) {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    pendingDeleteId = id;
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-item-name').textContent = req.title;
    modal.classList.remove('hidden');
}

function moveToTrash(id) {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    req.deletedAt = Date.now();
    trashBin.unshift(req);
    requests = requests.filter(r => r.id !== id);
    saveRequests();
    saveTrash();
    updateTrashBadge();
    showToast('Moved to Trash');
}

window.restoreRequest = function(id) {
    const item = trashBin.find(r => r.id === id);
    if (!item) return;
    delete item.deletedAt;
    requests.unshift(item);
    trashBin = trashBin.filter(r => r.id !== id);
    saveRequests();
    saveTrash();
    updateTrashBadge();
    renderTrashView();
    showToast('Request restored');
};

window.permanentDelete = function(id) {
    trashBin = trashBin.filter(r => r.id !== id);
    saveTrash();
    updateTrashBadge();
    renderTrashView();
    showToast('Permanently deleted');
};

function updateTrashBadge() {
    const badge = document.getElementById('trash-count-badge');
    if (badge) {
        badge.textContent = trashBin.length;
        badge.style.display = trashBin.length > 0 ? 'inline-flex' : 'none';
    }
}

// Theme Logic
function setupTheme() {
    applyTheme(currentTheme);

    // Theme Switcher Buttons
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentTheme = btn.getAttribute('data-theme');
            localStorage.setItem(THEME_KEY, currentTheme);
            applyTheme(currentTheme);
        });
    });

    // Listen for OS theme changes (applies when in 'system' mode)
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (currentTheme === 'system') {
            applyTheme('system');
        }
    });
}

function applyTheme(theme) {
    // Update active button
    themeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        }
    });

    if (theme === 'system') {
        // Follow OS preference
        const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (preferLight) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    } else if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode'); // dark is default
    }
}

// Navigation Logic (Removed, since pages are split)

// Form Logic
function setupForm() {
    if (!requestForm) return;

    const form = document.getElementById('request-form');
    const btnCancel = document.getElementById('btn-cancel');
    const typeSelect = document.getElementById('req-type');
    
    // Dynamic Fields Handler
    typeSelect.addEventListener('change', (e) => {
        // Hide all dynamic sections and clear their inputs
        document.querySelectorAll('.dynamic-section').forEach(el => {
            el.style.display = 'none';
            el.querySelectorAll('input').forEach(input => input.value = '');
        });
        
        // Show relevant section
        const val = e.target.value;
        if (val === 'Video') document.getElementById('dynamic-video').style.display = 'block';
        else if (val === 'Graphic') document.getElementById('dynamic-graphic').style.display = 'block';
        else if (val === 'Photo') document.getElementById('dynamic-photo').style.display = 'block';
        else if (val === 'Animation') document.getElementById('dynamic-animation').style.display = 'block';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Custom Validation
        const titleInput = document.getElementById('req-title');
        const typeInput = document.getElementById('req-type');
        const priorityInput = document.getElementById('req-priority');
        const descInput = document.getElementById('req-description');
        
        // Remove previous errors
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        
        let isValid = true;
        if (!titleInput.value.trim()) { titleInput.classList.add('input-error'); isValid = false; }
        if (!typeInput.value) { typeInput.classList.add('input-error'); isValid = false; }
        if (!priorityInput.value) { priorityInput.classList.add('input-error'); isValid = false; }
        if (!descInput.value.trim()) { descInput.classList.add('input-error'); isValid = false; }
        
        if (!isValid) {
            showToast("Please fill in all required fields highlighted in red.");
            return;
        }

        // Collect new grouped accordion fields (Phase 8)
        let metadata = {};
        if (typeInput.value === 'Video') {
            const platformCheckboxes = document.querySelectorAll('#req-video-platform input[type="checkbox"]:checked');
            // Extract the value attribute from the native checkbox element
            metadata.Platforms = Array.from(platformCheckboxes).map(cb => cb.value).join(', ');
            metadata.Audience = document.getElementById('req-video-audience').value.trim();
            metadata.Metric = document.getElementById('req-video-metric').value.trim();
            metadata.Message = document.getElementById('req-video-message').value.trim();
            metadata.Duration = document.getElementById('req-video-duration').value;
            metadata.Format = document.getElementById('req-video-format').value;
            metadata.Subtitles = document.getElementById('req-video-subs').value;
            metadata.Style = document.getElementById('req-video-style').value;
            metadata.Location = document.getElementById('req-video-location-type').value;
            metadata.Talent = document.getElementById('req-video-talent').value.trim();
            metadata.Audio = document.getElementById('req-video-audio').value;
            metadata.Script = document.getElementById('req-video-script').value;
            metadata.References = document.getElementById('req-video-refs').value.trim();
        } else if (typeInput.value === 'Graphic') {
            metadata.Audience = document.getElementById('req-graphic-audience').value.trim();
            metadata.Emotion = document.getElementById('req-graphic-emotion').value;
            metadata.Destination = document.getElementById('req-graphic-destination').value;
            metadata.Purpose = document.getElementById('req-graphic-purpose').value;
            metadata.Format = document.getElementById('req-graphic-format').value;
            metadata.Dimensions = document.getElementById('req-graphic-size').value.trim();
            metadata.Brand = document.getElementById('req-graphic-brand').value;
            metadata.Colors = document.getElementById('req-graphic-colors').value.trim();
            metadata.Typography = document.getElementById('req-graphic-typography').value.trim();
            metadata.Assets = document.getElementById('req-graphic-assets').value.trim();
            metadata.Copy = document.getElementById('req-graphic-copy').value.trim();
            metadata.References = document.getElementById('req-graphic-refs').value.trim();
        } else if (typeInput.value === 'Photo') {
            metadata.ShootType = document.getElementById('req-photo-type').value;
            metadata.Location = document.getElementById('req-photo-location').value.trim();
            metadata.DateTime = document.getElementById('req-photo-datetime').value.trim();
            metadata.VIPs = document.getElementById('req-photo-vips').value.trim();
            metadata.Usage = document.getElementById('req-photo-usage').value;
            metadata.Quantity = document.getElementById('req-photo-quantity').value;
            metadata.Lighting = document.getElementById('req-photo-lighting').value;
            metadata.Wardrobe = document.getElementById('req-photo-wardrobe').value;
            metadata.ShotList = document.getElementById('req-photo-shotlist').value.trim();
            metadata.MoodBoard = document.getElementById('req-photo-moodboard').value.trim();
        } else if (typeInput.value === 'Animation') {
            metadata.Audience = document.getElementById('req-anim-audience').value.trim();
            metadata.Message = document.getElementById('req-anim-message').value.trim();
            metadata.Platform = document.getElementById('req-anim-platform').value;
            metadata.Duration = document.getElementById('req-anim-duration').value;
            metadata.Format = document.getElementById('req-anim-format').value;
            metadata.Style = document.getElementById('req-anim-style').value;
            metadata.Pacing = document.getElementById('req-anim-pacing').value;
            metadata.Voiceover = document.getElementById('req-anim-vo').value;
            metadata.Music = document.getElementById('req-anim-music').value;
            metadata.Assets = document.getElementById('req-anim-assets').value.trim();
        }

        const requestData = {
            title: titleInput.value.trim(),
            type: typeInput.value,
            priority: priorityInput.value,
            startDate: document.getElementById('req-start-date').value,
            deadline: document.getElementById('req-deadline').value,
            referenceLink: document.getElementById('req-link').value.trim(),
            referenceFile: document.getElementById('req-file').files[0] ? document.getElementById('req-file').files[0].name : '',
            description: descInput.value.trim(),
            metadata: metadata // Attach standard context
        };

        addRequest(requestData);
        
        // Reset and switch view
        // Reset form and dynamic fields
        form.reset();
        document.querySelectorAll('.dynamic-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        
        showToast('Request submitted successfully!');
    });

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            form.reset();
            document.querySelectorAll('.dynamic-section').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        });
    }
}

// Dashboard Rendering
function setupFilters() {
    statusFilter.addEventListener('change', () => {
        requestCurrentPage = 1;
        renderRequestsTable();
    });

    if (timeFilter) {
        timeFilter.addEventListener('change', () => {
            requestCurrentPage = 1;
            renderRequestsTable();
        });
    }

    if (roleSelector) {
        roleSelector.addEventListener('change', (e) => {
            currentRole = e.target.value;
            requestCurrentPage = 1;
            renderDashboard();
        });
    }
}

function setupModal() {
    if (!detailsModal) return;
    modalClose.addEventListener('click', () => {
        detailsModal.classList.add('hidden');
    });
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            detailsModal.classList.add('hidden');
        }
    });
}

window.viewRequestDetails = function(id) {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    modalTitle.textContent = req.title;
    
    let html = `
        <div class="detail-grid">
            <div class="detail-group">
                <span class="detail-label">Type</span>
                <span class="detail-value">${escapeHTML(req.type)}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Priority</span>
                <span class="detail-value">${escapeHTML(req.priority)}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Start Date</span>
                <span class="detail-value">${req.startDate ? escapeHTML(req.startDate) : 'Not specified'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Deadline</span>
                <span class="detail-value">${req.deadline ? escapeHTML(req.deadline) : 'Not specified'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Status</span>
                <span class="detail-value">${escapeHTML(req.status)}</span>
            </div>
        </div>
        
        <div class="detail-group">
            <span class="detail-label">Description</span>
            <div class="detail-value">${escapeHTML(req.description).replace(/\n/g, '<br>')}</div>
        </div>
    `;

    if (req.referenceLink || req.referenceFile) {
        html += '<div class="detail-grid">';
        if (req.referenceLink) {
             html += `
             <div class="detail-group">
                 <span class="detail-label">Reference Link</span>
                 <a href="${escapeHTML(req.referenceLink)}" target="_blank" class="detail-value" style="color: var(--accent-color); text-decoration: none;">${escapeHTML(req.referenceLink)}</a>
             </div>`;
        }
        if (req.referenceFile) {
             html += `
             <div class="detail-group">
                 <span class="detail-label">Attachment</span>
                 <span class="detail-value"><i class="fa-solid fa-paperclip"></i> ${escapeHTML(req.referenceFile)}</span>
             </div>`;
        }
        html += '</div>';
    }

    if (req.metadata && Object.keys(req.metadata).length > 0) {
        html += `
            <div style="margin-top: 10px; border-top: 1px solid var(--card-border); padding-top: 20px;">
                <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--text-primary);">Specific Requirements</h3>
                <div class="detail-grid">
        `;
        for (const [key, value] of Object.entries(req.metadata)) {
            if (value) {
                html += `
                <div class="detail-group">
                    <span class="detail-label">${escapeHTML(key)}</span>
                    <span class="detail-value">${escapeHTML(value)}</span>
                </div>
                `;
            }
        }
        html += '</div></div>';
    }

    modalBody.innerHTML = html;
    detailsModal.classList.remove('hidden');
};

function renderDashboard() {
    // Determine which requests are visible based on role
    let visibleRequests = requests;
    if (currentRole !== 'Admin') {
        visibleRequests = requests.filter(r => r.type === currentRole);
    }

    // Update Metrics
    const total = visibleRequests.length;
    const pending = visibleRequests.filter(r => r.status === 'pending').length;
    const completed = visibleRequests.filter(r => r.status === 'completed').length;

    metricTotal.textContent = total;
    metricPending.textContent = pending;
    metricCompleted.textContent = completed;

    // Update Sidebar Stats
    updateSidebarStats(visibleRequests);
    updateTrashBadge();

    // Render Table
    renderRequestsTable(visibleRequests);
}

function updateSidebarStats(visibleRequests) {
    // Type Breakdown
    const typeMap = { Video: 0, Graphic: 0, Photo: 0, Animation: 0 };
    visibleRequests.forEach(r => {
        if (typeMap.hasOwnProperty(r.type)) typeMap[r.type]++;
    });
    const videoEl = document.getElementById('sidebar-video-count');
    const graphicEl = document.getElementById('sidebar-graphic-count');
    const photoEl = document.getElementById('sidebar-photo-count');
    const animEl = document.getElementById('sidebar-anim-count');
    if (videoEl) videoEl.textContent = typeMap.Video;
    if (graphicEl) graphicEl.textContent = typeMap.Graphic;
    if (photoEl) photoEl.textContent = typeMap.Photo;
    if (animEl) animEl.textContent = typeMap.Animation;

    // Priority Breakdown
    const prioMap = { High: 0, Medium: 0, Low: 0 };
    visibleRequests.forEach(r => {
        if (prioMap.hasOwnProperty(r.priority)) prioMap[r.priority]++;
    });
    const highEl = document.getElementById('sidebar-high-count');
    const medEl = document.getElementById('sidebar-medium-count');
    const lowEl = document.getElementById('sidebar-low-count');
    if (highEl) highEl.textContent = prioMap.High;
    if (medEl) medEl.textContent = prioMap.Medium;
    if (lowEl) lowEl.textContent = prioMap.Low;

    // Update Deadlines
    updateSidebarDeadlines(visibleRequests);
}

function updateSidebarDeadlines(visibleRequests) {
    const container = document.getElementById('sidebar-deadlines');
    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get pending requests with deadlines, sorted by date
    const upcoming = visibleRequests
        .filter(r => r.deadline && r.status === 'pending')
        .map(r => ({ ...r, deadlineDate: new Date(r.deadline) }))
        .filter(r => r.deadlineDate >= today)
        .sort((a, b) => a.deadlineDate - b.deadlineDate)
        .slice(0, 4);

    if (upcoming.length === 0) {
        container.innerHTML = '<div class="sidebar-empty-hint"><i class="fa-regular fa-calendar"></i> No upcoming deadlines</div>';
        return;
    }

    container.innerHTML = upcoming.map(r => {
        const diffDays = Math.ceil((r.deadlineDate - today) / (1000 * 60 * 60 * 24));
        let urgency = 'normal';
        if (diffDays <= 3) urgency = 'urgent';
        else if (diffDays <= 7) urgency = 'soon';

        const dateStr = r.deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const label = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d left`;

        return `
            <div class="sidebar-deadline-item ${urgency}">
                <div class="deadline-info">
                    <span class="deadline-title">${r.title}</span>
                    <span class="deadline-date">${dateStr} · ${label}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderRequestsTable(visibleRequestsData = null) {
    const filter = statusFilter.value;
    const timePeriod = timeFilter ? timeFilter.value : 'all';
    
    // Determine base dataset
    let baseRequests = visibleRequestsData;
    if (!baseRequests) {
        if (currentRole !== 'Admin') {
            baseRequests = requests.filter(r => r.type === currentRole);
        } else {
            baseRequests = requests;
        }
    }

    // Apply Time Period Filter
    if (timePeriod !== 'all') {
        const now = new Date();
        let cutoff = new Date();
        if (timePeriod === 'week') {
            cutoff.setDate(now.getDate() - 7);
        } else if (timePeriod === 'month') {
            cutoff.setMonth(now.getMonth() - 1);
        } else if (timePeriod === 'year') {
            cutoff.setFullYear(now.getFullYear() - 1);
        }
        baseRequests = baseRequests.filter(r => new Date(r.dateSubmitted) >= cutoff);
    }
    
    // Apply Status Filter
    let filteredRequests = baseRequests;
    if (filter !== 'all') {
        filteredRequests = baseRequests.filter(r => r.status === filter);
    }

    // Pagination
    const totalItems = filteredRequests.length;
    const totalPages = Math.ceil(totalItems / REQUESTS_PER_PAGE);
    
    // Safety check for current page
    if (requestCurrentPage > totalPages && totalPages > 0) requestCurrentPage = totalPages;
    
    const startIdx = (requestCurrentPage - 1) * REQUESTS_PER_PAGE;
    const paginatedRequests = filteredRequests.slice(startIdx, startIdx + REQUESTS_PER_PAGE);

    renderPagination('requests-pagination', totalItems, totalPages, requestCurrentPage, (page) => {
        requestCurrentPage = page;
        renderRequestsTable(visibleRequestsData);
    });

    requestsList.innerHTML = '';
    if (paginatedRequests.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    paginatedRequests.forEach(req => {
        const tr = document.createElement('tr');
        
        // Format Date
        const submitDate = new Date(req.dateSubmitted).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });

        // Type Badge Class
        const typeClass = `badge-${req.type.toLowerCase()}`;
        
        // Badge Indicators for links/files
        let indicators = '';
        if (req.referenceLink) indicators += '<i class="fa-solid fa-link" title="Has Link"></i> ';
        if (req.referenceFile) indicators += '<i class="fa-solid fa-paperclip" title="Has Attachment"></i> ';

        // Removed inline contextHTML badges to avoid clutter

        tr.innerHTML = `
            <td>
                <div style="font-weight: 500;">${escapeHTML(req.title)} <span style="color:var(--text-secondary);font-size:0.8rem">${indicators}</span></div>
                ${req.deadline ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Due: ${escapeHTML(req.deadline)}</div>` : ''}
                <button class="btn-sm" onclick="viewRequestDetails('${req.id}')">View Details</button>
            </td>
            <td><span class="badge ${typeClass}">${escapeHTML(req.type)}</span></td>
            <td class="priority-${req.priority.toLowerCase()}">${req.priority}</td>
            <td style="color: var(--text-secondary); font-size: 0.9rem;">${submitDate}</td>
            <td><span class="badge status-${req.status}">${req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span></td>
            <td>
                <button class="btn-action complete-action" onclick="toggleRequestStatus('${req.id}')" title="Toggle Status">
                    <i class="fa-solid ${req.status === 'completed' ? 'fa-rotate-left' : 'fa-check'}"></i>
                </button>
                <button class="btn-action delete-action" onclick="deleteRequest('${req.id}')" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        requestsList.appendChild(tr);
    });
}

// Trash View
function renderTrashView() {
    const trashList = document.getElementById('trash-list');
    const trashEmpty = document.getElementById('trash-empty-state');
    if (!trashList) return;

    const totalItems = trashBin.length;
    const totalPages = Math.ceil(totalItems / TRASH_PER_PAGE);

    if (trashCurrentPage > totalPages && totalPages > 0) trashCurrentPage = totalPages;

    const startIdx = (trashCurrentPage - 1) * TRASH_PER_PAGE;
    const paginatedTrash = trashBin.slice(startIdx, startIdx + TRASH_PER_PAGE);

    renderPagination('trash-pagination', totalItems, totalPages, trashCurrentPage, (page) => {
        trashCurrentPage = page;
        renderTrashView();
    });

    if (totalItems === 0) {
        trashList.innerHTML = '';
        if (trashEmpty) trashEmpty.classList.remove('hidden');
        return;
    }
    if (trashEmpty) trashEmpty.classList.add('hidden');
    trashList.innerHTML = '';

    paginatedTrash.forEach(req => {
        const tr = document.createElement('tr');
        const deletedDate = new Date(req.deletedAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - req.deletedAt) / (1000 * 60 * 60 * 24)));
        const typeClass = `badge-${req.type.toLowerCase()}`;

        tr.innerHTML = `
            <td>
                <div style="font-weight: 500;">${escapeHTML(req.title)}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">Deleted: ${deletedDate}</div>
            </td>
            <td><span class="badge ${typeClass}">${escapeHTML(req.type)}</span></td>
            <td style="color: var(--text-secondary); font-size: 0.85rem;">${daysLeft}d left</td>
            <td>
                <button class="btn-action restore-action" onclick="restoreRequest('${req.id}')" title="Restore">
                    <i class="fa-solid fa-rotate-left"></i>
                </button>
                <button class="btn-action delete-action" onclick="permanentDelete('${req.id}')" title="Permanently Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        trashList.appendChild(tr);
    });
}

// Dashboard/Trash Nav Switching
function setupNavSwitching() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            const target = document.getElementById(view + '-view');
            if (target) target.classList.add('active');

            if (view === 'trash') {
                renderTrashView();
            }
        });
    });
}

// Helpers
function renderPagination(containerId, totalItems, totalPages, currentPage, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    let html = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;

    container.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.onclick = () => {
            const page = parseInt(btn.getAttribute('data-page'));
            if (page >= 1 && page <= totalPages) {
                onPageChange(page);
            }
        };
    });
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Start App
document.addEventListener('DOMContentLoaded', init);

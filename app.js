// Store Key
const STORAGE_KEY = 'mediaTrackRequests';

// State
let requests = [];
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

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

const themeBtns = document.querySelectorAll('.theme-btn');
const THEME_KEY = 'mediaTrackTheme';
let currentTheme = localStorage.getItem(THEME_KEY) || 'dark';

// Page Detection
const isDashboard = document.getElementById('dashboard-view') !== null;
const isFormPage = document.getElementById('new-request-view') !== null;

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
    
    // Setup Event Listeners
    if (isDashboard) {
        setupFilters();
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
        // ensure dates are loaded properly if needed
    }
}

function saveRequests() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    if (isDashboard) renderDashboard();
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

function deleteRequest(id) {
    if (confirm('Are you sure you want to delete this request?')) {
        requests = requests.filter(r => r.id !== id);
        saveRequests();
        showToast('Request deleted');
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
}

function applyTheme(theme) {
    // Update active button
    themeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        }
    });

    if (theme === 'light') {
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
        if (val === 'Video') document.getElementById('dynamic-video').style.display = 'flex';
        else if (val === 'Graphic') document.getElementById('dynamic-graphic').style.display = 'flex';
        else if (val === 'Photo') document.getElementById('dynamic-photo').style.display = 'flex';
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

        // Collect new dynamic fields
        let metadata = {};
        if (typeInput.value === 'Video') {
            metadata.platform = document.getElementById('req-video-platform').value;
            metadata.duration = document.getElementById('req-video-duration').value;
        } else if (typeInput.value === 'Graphic') {
            metadata.dimensions = document.getElementById('req-graphic-size').value;
            metadata.brand = document.getElementById('req-graphic-brand').value;
        } else if (typeInput.value === 'Photo') {
            metadata.location = document.getElementById('req-photo-location').value;
        }

        const requestData = {
            title: titleInput.value.trim(),
            type: typeInput.value,
            priority: priorityInput.value,
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
        renderRequestsTable();
    });
}

function renderDashboard() {
    // Update Metrics
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const completed = requests.filter(r => r.status === 'completed').length;

    metricTotal.textContent = total;
    metricPending.textContent = pending;
    metricCompleted.textContent = completed;

    // Render Table
    renderRequestsTable();
}

function renderRequestsTable() {
    const filter = statusFilter.value;
    
    let filteredRequests = requests;
    if (filter !== 'all') {
        filteredRequests = requests.filter(r => r.status === filter);
    }

    // Handle Empty State
    if (filteredRequests.length === 0) {
        requestsList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    requestsList.innerHTML = '';

    filteredRequests.forEach(req => {
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

        // Context Metadata from dynamic fields
        let contextHTML = '';
        if (req.metadata) {
            let metaItems = [];
            for (const [key, value] of Object.entries(req.metadata)) {
                if (value) metaItems.push(`<b>${key}:</b> ${escapeHTML(value)}`);
            }
            if (metaItems.length > 0) {
                contextHTML = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px; display: flex; gap: 8px; flex-wrap: wrap;">${metaItems.map(item => `<span style="background:var(--card-bg); padding:2px 6px; border-radius:4px; border:1px solid var(--card-border);">${item}</span>`).join('')}</div>`;
            }
        }

        tr.innerHTML = `
            <td>
                <div style="font-weight: 500;">${escapeHTML(req.title)} <span style="color:var(--text-secondary);font-size:0.8rem">${indicators}</span></div>
                ${req.deadline ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Due: ${escapeHTML(req.deadline)}</div>` : ''}
                ${contextHTML}
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

// Helpers
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

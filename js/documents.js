// js/documents.js - Real backend integration

const API_BASE = 'http://localhost:3000';
let allDocuments = [];
let filteredDocuments = [];
let currentPage = 1;
const itemsPerPage = 10;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Documents page loaded - fetching from backend');

    const token = localStorage.getItem('token');
    const sessionToken = localStorage.getItem('sessionToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    // Initialize heartbeat
    if (sessionManager) {
        sessionManager.initializeHeartbeat(2 * 60 * 1000);
    }

    // Update user info in sidebar
    updateUserInfo(user);

    // Load documents from backend
    loadDocuments();

    // Setup event listeners
    setupEventListeners();
});

function updateUserInfo(user) {
    const userInitials = document.querySelector('.w-10.h-10.bg-teal-600');
    const userName = document.querySelector('.text-sm.font-medium.text-white');
    const userRole = document.querySelector('.text-xs.text-teal-300');

    if (user.firstName && user.lastName) {
        const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
        if (userInitials) userInitials.textContent = initials;
        if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
    }

    if (user.role && userRole) {
        const roleMap = {
            'admin': 'Administrator',
            'dean': 'Dean',
            'faculty': 'Faculty Member',
            'area-chair': 'Area Chair',
            'evaluator': 'External Evaluator'
        };
        userRole.textContent = roleMap[user.role] || user.role;
    }
}

async function loadDocuments() {
    const token = localStorage.getItem('token');
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/api/documents?scope=all`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        allDocuments = await response.json();
        filteredDocuments = [...allDocuments];
        
        renderDocuments();
        updateCounts();
        
    } catch (error) {
        console.error('Error loading documents:', error);
        showError('Failed to load documents. Please try again.');
    } finally {
        hideLoading();
    }
}

function showLoading() {
    const tbody = document.getElementById('documentsTableBody');
    const mobileContainer = document.getElementById('mobileDocumentsContainer');
    
    const loadingHTML = `
        <tr><td colspan="6" class="py-8 text-center text-gray-500">
            <div class="flex items-center justify-center gap-2">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-700"></div>
                <span>Loading documents...</span>
            </div>
        </td></tr>
    `;
    
    if (tbody) tbody.innerHTML = loadingHTML;
    if (mobileContainer) mobileContainer.innerHTML = '<div class="text-center py-8 text-gray-500">Loading...</div>';
}

function hideLoading() {
    // Loading will be replaced by renderDocuments
}

function showError(message) {
    const tbody = document.getElementById('documentsTableBody');
    const mobileContainer = document.getElementById('mobileDocumentsContainer');
    
    const errorHTML = `
        <tr><td colspan="6" class="py-8 text-center text-red-600">
            <div>⚠️ ${message}</div>
        </td></tr>
    `;
    
    if (tbody) tbody.innerHTML = errorHTML;
    if (mobileContainer) mobileContainer.innerHTML = `<div class="text-center py-8 text-red-600">⚠️ ${message}</div>`;
}

function renderDocuments() {
    const tbody = document.getElementById('documentsTableBody');
    const mobileContainer = document.getElementById('mobileDocumentsContainer');

    if (filteredDocuments.length === 0) {
        const emptyHTML = `
            <tr><td colspan="6" class="py-8 text-center text-gray-500">
                <div>📄 No documents found</div>
                <div class="text-sm mt-2">Try adjusting your filters or upload a new document</div>
            </td></tr>
        `;
        if (tbody) tbody.innerHTML = emptyHTML;
        if (mobileContainer) mobileContainer.innerHTML = '<div class="text-center py-8 text-gray-500">📄 No documents found</div>';
        return;
    }

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDocs = filteredDocuments.slice(startIndex, endIndex);

    // Render desktop table
    if (tbody) {
        tbody.innerHTML = paginatedDocs.map(doc => createTableRow(doc)).join('');
        attachRowEventListeners();
    }

    // Render mobile cards
    if (mobileContainer) {
        mobileContainer.innerHTML = paginatedDocs.map(doc => createMobileCard(doc)).join('');
        attachRowEventListeners();
    }

    updatePagination();
}

function createTableRow(doc) {
    const statusBadge = getStatusBadge(doc.workflow_status);
    const categoryBadge = getCategoryBadge(doc.category);
    const departmentBadge = getDepartmentBadge(doc.department_code);
    const date = formatDate(doc.created_at);
    const uploader = doc.uploader_firstName && doc.uploader_lastName 
        ? `${doc.uploader_firstName} ${doc.uploader_lastName}` 
        : doc.author_name || 'Unknown';

    return `
        <tr class="doc-row hover:bg-gray-50 transition" data-id="${doc.id}">
            <td class="py-3 px-4">
                <div class="font-medium text-gray-800">${escapeHtml(doc.title)}</div>
                <div class="text-xs text-gray-400">by ${escapeHtml(uploader)} · ${date}</div>
            </td>
            <td class="py-3 px-4">${categoryBadge}</td>
            <td class="py-3 px-4">${departmentBadge}</td>
            <td class="py-3 px-4">${statusBadge}</td>
            <td class="py-3 px-4 text-gray-600 text-sm">${escapeHtml(doc.version || 'v1.0')}</td>
            <td class="py-3 px-4">
                <div class="flex flex-wrap gap-2">
                    <button class="btn-view" data-id="${doc.id}">View</button>
                    <button class="btn-download" data-id="${doc.id}">Download</button>
                    <button class="btn-edit" data-id="${doc.id}">Edit</button>
                    <button class="btn-delete" data-id="${doc.id}">Delete</button>
                </div>
            </td>
        </tr>
    `;
}

function createMobileCard(doc) {
    const statusBadge = getStatusBadge(doc.workflow_status);
    const categoryBadge = getCategoryBadge(doc.category);
    const departmentBadge = getDepartmentBadge(doc.department_code);
    const date = formatDate(doc.created_at);
    const uploader = doc.uploader_firstName && doc.uploader_lastName 
        ? `${doc.uploader_firstName} ${doc.uploader_lastName}` 
        : doc.author_name || 'Unknown';

    return `
        <div class="border rounded-lg p-4 bg-white" data-id="${doc.id}">
            <div class="font-medium text-gray-800">${escapeHtml(doc.title)}</div>
            <div class="text-xs text-gray-400 mb-2">by ${escapeHtml(uploader)} · ${date}</div>
            <div class="flex flex-wrap gap-2 mb-2">
                ${categoryBadge}
                ${departmentBadge}
                ${statusBadge}
            </div>
            <div class="text-sm text-gray-600 mb-3">Version: ${escapeHtml(doc.version || 'v1.0')}</div>
            <div class="flex flex-wrap gap-2">
                <button class="btn-view-sm" data-id="${doc.id}">View</button>
                <button class="btn-download-sm" data-id="${doc.id}">Download</button>
                <button class="btn-edit-sm" data-id="${doc.id}">Edit</button>
                <button class="btn-delete-sm" data-id="${doc.id}">Delete</button>
            </div>
        </div>
    `;
}

function getStatusBadge(status) {
    const statusMap = {
        'approved': { text: 'Approved', class: 'badge-approved' },
        'pending': { text: 'Pending Review', class: 'badge-pending' },
        'validated': { text: 'Validated', class: 'badge-validated' },
        'draft': { text: 'Draft', class: 'badge-draft' },
        'rejected': { text: 'Rejected', class: 'badge-rejected' },
        'locked': { text: 'Locked', class: 'badge-locked' }
    };
    
    const badge = statusMap[status] || { text: status || 'Unknown', class: 'badge-pending' };
    return `<span class="${badge.class} px-2 py-1 rounded-full text-xs">${badge.text}</span>`;
}

function getCategoryBadge(category) {
    const categoryMap = {
        'instruction': { text: 'Instruction', class: 'badge-instruction' },
        'research': { text: 'Research', class: 'badge-research' },
        'extension': { text: 'Extension', class: 'badge-extension' },
        'employment': { text: 'Employment', class: 'badge-employment' }
    };
    
    const badge = categoryMap[category] || { text: category || 'Other', class: 'badge-instruction' };
    return `<span class="${badge.class} px-2 py-1 rounded-full text-xs">${badge.text}</span>`;
}

function getDepartmentBadge(deptCode) {
    if (!deptCode) return '<span class="badge-department px-2 py-1 rounded-full text-xs">N/A</span>';
    return `<span class="badge-department px-2 py-1 rounded-full text-xs">${escapeHtml(deptCode)}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function attachRowEventListeners() {
    // View buttons
    document.querySelectorAll('.btn-view, .btn-view-sm').forEach(btn => {
        btn.addEventListener('click', handleView);
    });

    // Download buttons
    document.querySelectorAll('.btn-download, .btn-download-sm').forEach(btn => {
        btn.addEventListener('click', handleDownload);
    });

    // Edit buttons
    document.querySelectorAll('.btn-edit, .btn-edit-sm').forEach(btn => {
        btn.addEventListener('click', handleEdit);
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete, .btn-delete-sm').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}

async function handleView(e) {
    const docId = e.target.dataset.id;
    const doc = allDocuments.find(d => d.id == docId);
    
    if (!doc) return;

    if (doc.file_url) {
        const fileUrl = `${API_BASE}${doc.file_url}`;
        window.open(fileUrl, '_blank');
    } else {
        alert('No file available for this document');
    }
}

async function handleDownload(e) {
    const docId = e.target.dataset.id;
    const doc = allDocuments.find(d => d.id == docId);
    
    if (!doc || !doc.file_url) {
        alert('No file available for download');
        return;
    }

    const fileUrl = `${API_BASE}${doc.file_url}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.title || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleEdit(e) {
    const docId = e.target.dataset.id;
    const doc = allDocuments.find(d => d.id == docId);
    
    if (!doc) return;

    // For now, just show alert. In full implementation, open edit modal
    alert(`Edit functionality coming soon for: ${doc.title}`);
}

async function handleDelete(e) {
    const docId = e.target.dataset.id;
    const doc = allDocuments.find(d => d.id == docId);
    
    if (!doc) return;

    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE}/api/documents/${docId}`, {
            method: 'DELETE',
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'Failed to delete document');
        }

        alert('Document deleted successfully');
        loadDocuments(); // Reload the list
    } catch (error) {
        console.error('Delete error:', error);
        alert(error.message || 'Failed to delete document');
    }
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // Filter dropdowns
    const categoryFilter = document.getElementById('categoryFilter');
    const departmentFilter = document.getElementById('departmentFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // Upload button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            window.location.href = 'upload.html';
        });
    }

    // Pagination buttons
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderDocuments();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderDocuments();
            }
        });
    }

    // Mobile sidebar toggle
    setupMobileSidebar();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const department = document.getElementById('departmentFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';

    filteredDocuments = allDocuments.filter(doc => {
        // Search filter
        const matchesSearch = !searchTerm || 
            doc.title?.toLowerCase().includes(searchTerm) ||
            doc.author_name?.toLowerCase().includes(searchTerm) ||
            doc.description?.toLowerCase().includes(searchTerm);

        // Category filter
        const matchesCategory = category === 'all' || doc.category === category;

        // Department filter
        const matchesDepartment = department === 'all' || 
            doc.department_code?.toLowerCase() === department.toLowerCase();

        // Status filter
        const matchesStatus = status === 'all' || doc.workflow_status === status;

        return matchesSearch && matchesCategory && matchesDepartment && matchesStatus;
    });

    currentPage = 1; // Reset to first page
    renderDocuments();
    updateCounts();
}

function updateCounts() {
    const docCount = document.getElementById('docCount');
    const totalDocuments = document.getElementById('totalDocuments');
    const paginationStart = document.getElementById('paginationStart');
    const paginationEnd = document.getElementById('paginationEnd');

    if (docCount) docCount.textContent = filteredDocuments.length;
    if (totalDocuments) totalDocuments.textContent = filteredDocuments.length;

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredDocuments.length);

    if (paginationStart) paginationStart.textContent = filteredDocuments.length > 0 ? startIndex : 0;
    if (paginationEnd) paginationEnd.textContent = endIndex;
}

function updatePagination() {
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.classList.toggle('opacity-50', currentPage === 1);
        prevBtn.classList.toggle('cursor-not-allowed', currentPage === 1);
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.classList.toggle('opacity-50', currentPage >= totalPages);
        nextBtn.classList.toggle('cursor-not-allowed', currentPage >= totalPages);
    }

    updateCounts();
}

function setupMobileSidebar() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('mainSidebar');
    
    if (!menuToggle || !sidebar) return;

    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
    }

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeSidebar();
    });
}

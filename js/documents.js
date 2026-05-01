// js/documents.js - Real backend integration

const API_BASE = 'http://localhost:3000';
let allDocuments = [];
let filteredDocuments = [];
let currentPage = 1;
const itemsPerPage = 10;

// Variables for delete confirmation
let pendingDeleteId = null;
let pendingDeleteTitle = null;

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

    // Update user info in sidebar
    updateUserInfo(user);

    // Load documents from backend
    loadDocuments();

    // Setup event listeners
    setupEventListeners();
    
    // Setup preview modal
    setupPreviewModal();
    
    // Setup details modal
    setupDetailsModal();
    
    // Setup delete confirmation modal
    setupDeleteModal();
    
    // Setup comments modal
    setupCommentsModalEventListeners();
});

function setupDeleteModal() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }
}

function openDeleteModal(docId, docTitle) {
    pendingDeleteId = docId;
    pendingDeleteTitle = docTitle;
    
    const deleteModal = document.getElementById('deleteConfirmModal');
    const deleteDocTitle = document.getElementById('deleteDocTitle');
    
    if (deleteDocTitle) deleteDocTitle.textContent = docTitle;
    
    if (deleteModal) {
        deleteModal.classList.remove('hidden');
        deleteModal.style.display = 'flex';
    }
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    if (deleteModal) {
        deleteModal.classList.add('hidden');
        deleteModal.style.display = 'none';
    }
    pendingDeleteId = null;
    pendingDeleteTitle = null;
}

async function confirmDelete() {
    if (!pendingDeleteId) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE}/api/documents/${pendingDeleteId}`, {
            method: 'DELETE',
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'Failed to delete document');
        }

        showToastMessage('Document deleted successfully', 'success');
        closeDeleteModal();
        loadDocuments();
    } catch (error) {
        console.error('Delete error:', error);
        showToastMessage(error.message || 'Failed to delete document', 'error');
        closeDeleteModal();
    }
}

function showToastMessage(message, type = 'success') {
    let toast = document.querySelector('.custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(toast);
    }
    
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.textContent = message;
    toast.style.transform = 'translateX(0)';
    
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
    }, 3000);
}

function setupPreviewModal() {
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
    
    if (docPreviewCloseBtn) {
        docPreviewCloseBtn.addEventListener('click', closePreviewModal);
    }
    
    if (docPreviewModal) {
        docPreviewModal.addEventListener('click', (e) => {
            if (e.target === docPreviewModal) closePreviewModal();
        });
    }
}

function openPreviewModal(url, title) {
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewFrame = document.getElementById('docPreviewFrame');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    
    if (!docPreviewModal || !docPreviewFrame) {
        window.open(url, '_blank');
        return;
    }
    
    if (docPreviewTitle) docPreviewTitle.textContent = title || 'Document Preview';
    docPreviewFrame.src = url;
    docPreviewModal.classList.remove('hidden');
    docPreviewModal.classList.add('flex');
}

function closePreviewModal() {
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewFrame = document.getElementById('docPreviewFrame');
    
    if (!docPreviewModal) return;
    
    docPreviewModal.classList.add('hidden');
    docPreviewModal.classList.remove('flex');
    if (docPreviewFrame) docPreviewFrame.src = 'about:blank';
}

// Setup Details Modal for viewing description and keywords
function setupDetailsModal() {
    const docDetailsModal = document.getElementById('docDetailsModal');
    const docDetailsCloseBtn = document.getElementById('docDetailsCloseBtn');
    const docDetailsCloseBtn2 = document.getElementById('docDetailsCloseBtn2');
    
    if (docDetailsCloseBtn) {
        docDetailsCloseBtn.addEventListener('click', closeDetailsModal);
    }
    if (docDetailsCloseBtn2) {
        docDetailsCloseBtn2.addEventListener('click', closeDetailsModal);
    }
    if (docDetailsModal) {
        docDetailsModal.addEventListener('click', (e) => {
            if (e.target === docDetailsModal) closeDetailsModal();
        });
    }
}

function openDetailsModal(doc) {
    const modal = document.getElementById('docDetailsModal');
    const titleElem = document.getElementById('docDetailsTitle');
    const contentElem = document.getElementById('docDetailsContent');
    
    if (!modal || !contentElem) return;
    
    if (titleElem) titleElem.textContent = `Document Details: ${doc.title || 'Untitled'}`;
    
    // Format keywords as badges
    let keywordsHtml = '';
    if (doc.keywords) {
        const keywords = doc.keywords.split(',').map(k => k.trim());
        keywordsHtml = `
            <div class="flex flex-wrap gap-2 mt-2">
                ${keywords.map(k => `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">${escapeHtml(k)}</span>`).join('')}
            </div>
        `;
    } else {
        keywordsHtml = '<p class="text-gray-400 text-sm italic">No keywords provided</p>';
    }
    
    contentElem.innerHTML = `
        <div class="border-b pb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Document Information</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <span class="text-gray-500">Title:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.title || 'Untitled')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Version:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.version || 'v1.0')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Category:</span>
                    <p class="font-medium text-gray-800 mt-1">${getCategoryDisplayName(doc.category)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Department:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.department_code || doc.area || 'N/A')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Status:</span>
                    <p class="font-medium mt-1">${getStatusText(doc.workflow_status)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Uploaded by:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.author_name || doc.uploader_firstName || 'Unknown')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Uploaded on:</span>
                    <p class="font-medium text-gray-800 mt-1">${formatDateTime(doc.created_at)}</p>
                </div>
                ${doc.expiry_date ? `
                <div>
                    <span class="text-gray-500">Expiry Date:</span>
                    <p class="font-medium text-gray-800 mt-1">${formatDate(doc.expiry_date)}</p>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="border-b pb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Description / Notes</h4>
            <div class="bg-gray-50 rounded-lg p-4">
                ${doc.description ? `<p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(doc.description)}</p>` : '<p class="text-gray-400 text-sm italic">No description provided</p>'}
            </div>
        </div>
        
        <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Keywords</h4>
            ${keywordsHtml}
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeDetailsModal() {
    const modal = document.getElementById('docDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function getCategoryDisplayName(category) {
    const categoryMap = {
        'instruction': 'Instruction',
        'research': 'Research',
        'extension': 'Extension',
        'employment': 'Employment'
    };
    return categoryMap[category] || category || 'Other';
}

function getStatusText(status) {
    const statusMap = {
        'approved': 'Approved',
        'pending': 'Pending Review',
        'pending_validation': 'Pending Validation',
        'validated': 'Validated',
        'pending_approval': 'Pending Approval',
        'draft': 'Draft',
        'rejected': 'Rejected',
        'locked': 'Locked'
    };
    return statusMap[status] || status || 'Unknown';
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function updateUserInfo(user) {
    const userInitials = document.getElementById('userInitials');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');

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
            'area-chair': 'Dept. Head',
            'department-head': 'Dept. Head',
            'evaluator': 'External Evaluator'
        };
        userRole.textContent = roleMap[user.role] || user.role;
    }
}

async function loadDocuments() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role || '').toLowerCase();
    
    console.log('Loading documents for role:', role);
    
    try {
        showLoading();
        
        // Admin and Dean should see all documents
        const scopeParam = (role === 'admin' || role === 'dean') ? '?scope=all' : '';
        console.log('Fetching documents with scope:', scopeParam || 'default (own documents)');
        
        const response = await fetch(`${API_BASE}/api/documents${scopeParam}`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        allDocuments = await response.json();
        console.log('Documents loaded:', allDocuments.length);
        console.log('Departments represented:', [...new Set(allDocuments.map(d => d.department_code))]);
        
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
        </td>
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
        </td>
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
                <div>No documents found</div>
                <div class="text-sm mt-2">Try adjusting your filters or upload a new document</div>
            </td>
        `;
        if (tbody) tbody.innerHTML = emptyHTML;
        if (mobileContainer) mobileContainer.innerHTML = '<div class="text-center py-8 text-gray-500">No documents found</div>';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDocs = filteredDocuments.slice(startIndex, endIndex);

    if (tbody) {
        tbody.innerHTML = paginatedDocs.map(doc => createTableRow(doc)).join('');
        attachRowEventListeners();
    }

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

    // Show if document has description or keywords (for visual indicator)
    const hasMetadata = (doc.description && doc.description.trim()) || (doc.keywords && doc.keywords.trim());
    const metadataIcon = hasMetadata ? '<span class="ml-1 text-teal-500 text-xs" title="Has description or keywords">ℹ️</span>' : '';

    return `
        <tr class="doc-row hover:bg-gray-50 transition" data-id="${doc.id}">
            <td class="py-3 px-4">
                <div class="font-medium text-gray-800">${escapeHtml(doc.title)}${metadataIcon}</div>
                <div class="text-xs text-gray-400">by ${escapeHtml(uploader)} · ${date}</div>
            </td>
            <td class="py-3 px-4">${categoryBadge}</td>
            <td class="py-3 px-4">${departmentBadge}</td>
            <td class="py-3 px-4">${statusBadge}</td>
            <td class="py-3 px-4 text-gray-600 text-sm">${escapeHtml(doc.version || 'v1.0')}</td>
            <td class="py-3 px-4">
                <div class="flex flex-wrap gap-2">
                    <button class="btn-view" data-id="${doc.id}" title="View Document">View</button>
                    <button class="btn-details" data-id="${doc.id}" title="View Details (Description & Keywords)">Details</button>
                    ${doc.workflow_status === 'rejected' ? `<button class="btn-comments" data-id="${doc.id}" title="View Comments">Comments</button>` : ''}
                    <button class="btn-download" data-id="${doc.id}" title="Download">Download</button>
                    <button class="btn-delete" data-id="${doc.id}" title="Delete">Delete</button>
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

    const hasMetadata = (doc.description && doc.description.trim()) || (doc.keywords && doc.keywords.trim());
    const metadataIcon = hasMetadata ? '<span class="ml-1 text-teal-500 text-xs" title="Has description or keywords">ℹ️</span>' : '';

    return `
        <div class="border rounded-lg p-4 bg-white" data-id="${doc.id}">
            <div class="font-medium text-gray-800">${escapeHtml(doc.title)}${metadataIcon}</div>
            <div class="text-xs text-gray-400 mb-2">by ${escapeHtml(uploader)} · ${date}</div>
            <div class="flex flex-wrap gap-2 mb-2">
                ${categoryBadge}
                ${departmentBadge}
                ${statusBadge}
            </div>
            <div class="text-sm text-gray-600 mb-3">Version: ${escapeHtml(doc.version || 'v1.0')}</div>
            <div class="flex flex-wrap gap-2">
                <button class="btn-view-sm" data-id="${doc.id}">View</button>
                <button class="btn-details-sm" data-id="${doc.id}">Details</button>
                ${doc.workflow_status === 'rejected' ? `<button class="btn-comments-sm" data-id="${doc.id}">Comments</button>` : ''}
                <button class="btn-download-sm" data-id="${doc.id}">Download</button>
                <button class="btn-delete-sm" data-id="${doc.id}">Delete</button>
            </div>
        </div>
    `;
}

function getStatusBadge(status) {
    const statusMap = {
        'approved': { text: 'Approved', class: 'badge-approved' },
        'pending': { text: 'Pending Review', class: 'badge-pending' },
        'pending_validation': { text: 'Pending Validation', class: 'badge-pending' },
        'validated': { text: 'Validated', class: 'badge-validated' },
        'pending_approval': { text: 'Pending Approval', class: 'badge-pending' },
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
    return `<span class="badge-department px-2 py-1 rounded-full text-xs">${escapeHtml(deptCode.toUpperCase())}</span>`;
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

    // Details buttons (new)
    document.querySelectorAll('.btn-details, .btn-details-sm').forEach(btn => {
        btn.addEventListener('click', handleDetails);
    });

    // Comments buttons
    document.querySelectorAll('.btn-comments, .btn-comments-sm').forEach(btn => {
        btn.addEventListener('click', handleComments);
    });

    // Download buttons
    document.querySelectorAll('.btn-download, .btn-download-sm').forEach(btn => {
        btn.addEventListener('click', handleDownload);
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete, .btn-delete-sm').forEach(btn => {
        btn.addEventListener('click', handleDeleteClick);
    });
}

async function handleView(e) {
    const docId = e.target.dataset.id;
    const doc = allDocuments.find(d => d.id == docId);
    
    if (!doc) return;

    if (doc.file_url) {
        const fileUrl = `${API_BASE}${doc.file_url}`;
        openPreviewModal(fileUrl, doc.title);
    } else {
        showToastMessage('No file available for this document', 'error');
    }
}

function handleDetails(e) {
    const docId = e.target.dataset.id;
    const doc = allDocuments.find(d => d.id == docId);
    
    if (!doc) return;
    
    openDetailsModal(doc);
}

async function handleComments(e) {
    const docId = e.target.dataset.id;
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE}/api/documents/${docId}/comments`, {
            headers: { 'x-auth-token': token }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        const doc = allDocuments.find(d => d.id == docId);
        
        openCommentsModal(doc, data.comments || []);
    } catch (error) {
        console.error('Error fetching comments:', error);
        showToastMessage('Failed to load comments', 'error');
    }
}

function openCommentsModal(doc, comments) {
    const commentsModal = document.getElementById('commentsModal');
    const commentsDocTitle = document.getElementById('commentsDocTitle');
    const commentsDocDate = document.getElementById('commentsDocDate');
    const commentsListContainer = document.getElementById('commentsListContainer');
    
    if (!commentsModal) return;
    
    if (commentsDocTitle) commentsDocTitle.textContent = doc?.title || 'Unknown';
    if (commentsDocDate) commentsDocDate.textContent = doc?.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A';
    
    if (commentsListContainer) {
        if (comments.length === 0) {
            commentsListContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No comments found</div>';
        } else {
            commentsListContainer.innerHTML = comments.map(c => {
                const date = new Date(c.created_at).toLocaleString();
                const reviewer = c.reviewer_name || 'Reviewer';
                const text = c.reason || c.comments || 'No comment provided';
                return `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-reviewer">${escapeHtml(reviewer)}</span>
                            <span class="comment-date">${date}</span>
                        </div>
                        <div class="comment-text">${escapeHtml(text)}</div>
                    </div>
                `;
            }).join('');
        }
    }
    
    commentsModal.classList.remove('hidden');
    setTimeout(() => commentsModal.classList.add('active'), 10);
}

function closeCommentsModal() {
    const commentsModal = document.getElementById('commentsModal');
    if (!commentsModal) return;
    commentsModal.classList.remove('active');
    setTimeout(() => commentsModal.classList.add('hidden'), 300);
}

function setupCommentsModalEventListeners() {
    const closeCommentsModalBtn = document.getElementById('closeCommentsModal');
    const closeCommentsBtn = document.getElementById('closeCommentsBtn');
    if (closeCommentsModalBtn) closeCommentsModalBtn.addEventListener('click', closeCommentsModal);
    if (closeCommentsBtn) closeCommentsBtn.addEventListener('click', closeCommentsModal);

    const commentsModal = document.getElementById('commentsModal');
    if (commentsModal) {
        commentsModal.addEventListener('click', e => {
            if (e.target === commentsModal) closeCommentsModal();
        });
    }
}

async function handleDownload(e) {
    const docId = e.target.dataset.id;
    const doc = allDocuments.find(d => d.id == docId);
    
    if (!doc || !doc.file_url) {
        showToastMessage('No file available for download', 'error');
        return;
    }

    const fileUrl = `${API_BASE}${doc.file_url}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.title || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToastMessage('Download started', 'success');
}

function handleDeleteClick(e) {
    const docId = e.target.dataset.id;
    const doc = allDocuments.find(d => d.id == docId);
    
    if (!doc) return;
    
    openDeleteModal(docId, doc.title);
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    const categoryFilter = document.getElementById('categoryFilter');
    const departmentFilter = document.getElementById('departmentFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            window.location.href = 'upload.html';
        });
    }

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

    setupMobileSidebar();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const department = document.getElementById('departmentFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';

    filteredDocuments = allDocuments.filter(doc => {
        const matchesSearch = !searchTerm || 
            doc.title?.toLowerCase().includes(searchTerm) ||
            doc.author_name?.toLowerCase().includes(searchTerm) ||
            doc.description?.toLowerCase().includes(searchTerm) ||
            doc.keywords?.toLowerCase().includes(searchTerm);

        const matchesCategory = category === 'all' || doc.category === category;
        const matchesDepartment = department === 'all' || doc.department_code?.toLowerCase() === department.toLowerCase();
        const matchesStatus = status === 'all' || doc.workflow_status === status;

        return matchesSearch && matchesCategory && matchesDepartment && matchesStatus;
    });

    currentPage = 1;
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
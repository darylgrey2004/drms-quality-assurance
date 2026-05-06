// js/user-documents.js

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Documents JS loaded');

    // Initialize user session (handled by user-session.js)
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    const API_BASE = 'http://localhost:3000';

    // Toast helper
    const actionToast = document.getElementById('actionToast');
    const actionToastMsg = document.getElementById('actionToastMsg');
    const actionToastIcon = document.getElementById('actionToastIcon');
    let toastTimer;
    function showToast(msg, isError = false) {
        if (!actionToast) return;
        actionToastIcon.textContent = isError ? '✕' : '✓';
        actionToastMsg.textContent = msg;
        actionToast.querySelector('div').className = `flex items-center gap-3 ${isError ? 'bg-red-700' : 'bg-gray-900'} text-white px-4 py-3 rounded-xl shadow-xl text-sm max-w-sm`;
        actionToast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => actionToast.classList.add('hidden'), 3500);
    }
    
    // DOM elements
    const searchInput = document.getElementById('searchDocuments');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const filterBtn = document.querySelector('.bg-teal-700.text-white');
    const documentsTable = document.getElementById('documentsTable');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationButtons = document.getElementById('paginationButtons');

    let allDocuments = [];
    let filteredDocuments = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // Load categories and departments for filters
    loadFilterOptions();
    
    // Load documents
    loadDocuments();
    
    // Setup preview modal
    setupPreviewModal();

    async function setupPreviewModal() {
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

    let allStandards = []; // Store all standards globally

    async function loadFilterOptions() {
        try {
            console.log('Loading filter options...');
            
            // Load categories
            console.log('Fetching categories from:', `${API_BASE}/api/documents/categories`);
            const categoriesRes = await fetch(`${API_BASE}/api/documents/categories`, {
                headers: { 'x-auth-token': token }
            });
            console.log('Categories response status:', categoriesRes.status);
            
            if (!categoriesRes.ok) {
                throw new Error(`Failed to load categories: ${categoriesRes.status}`);
            }
            
            const categories = await categoriesRes.json();
            console.log('Categories loaded:', categories);
            
            if (categoryFilter && categories.length > 0) {
                categoryFilter.innerHTML = '<option value="all">All Categories</option>';
                categories.forEach(cat => {
                    categoryFilter.innerHTML += `<option value="${cat.name}">${cat.display_name || cat.name}</option>`;
                });
                console.log('Category filter populated with', categories.length, 'options');
            }

            // Load all standards
            console.log('Fetching standards from:', `${API_BASE}/api/documents/standards`);
            const standardsRes = await fetch(`${API_BASE}/api/documents/standards`, {
                headers: { 'x-auth-token': token }
            });
            console.log('Standards response status:', standardsRes.status);
            
            if (!standardsRes.ok) {
                throw new Error(`Failed to load standards: ${standardsRes.status}`);
            }
            
            allStandards = await standardsRes.json();
            console.log('Standards loaded:', allStandards);
            
            // Initially populate with all standards
            updateStandardsDropdown('all');

            // Load departments
            console.log('Fetching departments from:', `${API_BASE}/api/documents/departments`);
            const departmentsRes = await fetch(`${API_BASE}/api/documents/departments`, {
                headers: { 'x-auth-token': token }
            });
            console.log('Departments response status:', departmentsRes.status);
            
            if (!departmentsRes.ok) {
                throw new Error(`Failed to load departments: ${departmentsRes.status}`);
            }
            
            const departments = await departmentsRes.json();
            console.log('Departments loaded:', departments);
            
            // Add department filter if it exists in HTML
            const departmentFilter = document.getElementById('departmentFilter');
            if (departmentFilter && departments.length > 0) {
                departmentFilter.innerHTML = '<option value="all">All Departments</option>';
                departments.forEach(dept => {
                    departmentFilter.innerHTML += `<option value="${dept.code}">${dept.code} - ${dept.name}</option>`;
                });
                console.log('Department filter populated with', departments.length, 'options');
            }
        } catch (err) {
            console.error('Load filter options error:', err);
            showToast('Failed to load filter options: ' + err.message, true);
        }
    }

    // Function to update standards dropdown based on selected category
    function updateStandardsDropdown(categoryName) {
        const standardsFilter = document.getElementById('standardsFilter');
        if (!standardsFilter) return;

        // Filter standards by category
        let filteredStandards = allStandards;
        if (categoryName !== 'all') {
            // Get category ID from categories
            const selectedCategory = Array.from(categoryFilter.options).find(opt => opt.value === categoryName);
            if (selectedCategory) {
                // Filter standards that belong to this category
                filteredStandards = allStandards.filter(std => {
                    // Match by category name or display name
                    return std.category_name && std.category_name.toLowerCase().includes(categoryName.toLowerCase());
                });
            }
        }

        // Populate standards dropdown
        standardsFilter.innerHTML = '<option value="all">All Standards</option>';
        filteredStandards.forEach(std => {
            standardsFilter.innerHTML += `<option value="${std.name}">${std.name}</option>`;
        });
        
        console.log('Standards dropdown updated for category:', categoryName, 'Count:', filteredStandards.length);
    }

    function loadDocuments() {
        console.log('Loading documents...');
        console.log('API URL:', `${API_BASE}/api/documents`);
        console.log('Token:', token ? 'Present' : 'Missing');
        
        fetch(`${API_BASE}/api/documents`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => {
            console.log('Response status:', r.status);
            if (!r.ok) {
                throw new Error(`HTTP ${r.status}: ${r.statusText}`);
            }
            return r.json();
        })
        .then(docs => {
            console.log('Documents loaded:', docs);
            console.log('Number of documents:', docs.length);
            allDocuments = docs;
            applyFilters();
        })
        .catch(err => {
            console.error('Load documents error:', err);
            showToast('Failed to load documents: ' + err.message, true);
            // Show empty state
            if (documentsTable) {
                documentsTable.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-red-500">Failed to load documents. Please refresh the page.</td></tr>';
            }
        });
    }

    function applyFilters() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const status = statusFilter?.value || 'all';
        const category = categoryFilter?.value || 'all';
        const departmentFilter = document.getElementById('departmentFilter');
        const department = departmentFilter?.value || 'all';
        const standardsFilter = document.getElementById('standardsFilter');
        const standard = standardsFilter?.value || 'all';

        filteredDocuments = allDocuments.filter(doc => {
            const matchesSearch = !searchTerm ||
                doc.title.toLowerCase().includes(searchTerm) ||
                (doc.author_name || '').toLowerCase().includes(searchTerm) ||
                (doc.department_name || '').toLowerCase().includes(searchTerm);

            const matchesStatus = status === 'all' || doc.workflow_status === status;
            const matchesCategory = category === 'all' || doc.category === category || doc.category_name === category;
            const matchesDepartment = department === 'all' || doc.department_code === department;
            
            // Fix standards matching - check if document's standards array includes the selected standard name
            const matchesStandard = standard === 'all' || (doc.standards && doc.standards.length > 0 && doc.standards.some(s => s === standard || s.includes(standard)));

            return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesStandard;
        });

        currentPage = 1;
        renderDocuments();
        renderPagination();
    }

    function getStatusBadge(status) {
        const badges = {
            'draft': 'bg-gray-100 text-gray-700',
            'pending': 'bg-amber-100 text-amber-700',
            'validated': 'bg-blue-100 text-blue-700',
            'approved': 'bg-green-100 text-green-700',
            'locked': 'bg-purple-100 text-purple-700',
            'rejected': 'bg-red-100 text-red-700'
        };
        return badges[status] || 'bg-gray-100 text-gray-700';
    }

    function getStatusText(status) {
        const texts = {
            'draft': 'Draft',
            'pending': 'Validation',
            'validated': 'Approval',
            'approved': 'Approved',
            'locked': 'Locked',
            'rejected': 'Rejected'
        };
        return texts[status] || status;
    }

    function renderDocuments() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageDocuments = filteredDocuments.slice(start, end);

        if (!documentsTable) return;

        if (pageDocuments.length === 0) {
            documentsTable.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-gray-500">No documents found</td></tr>';
            return;
        }

        documentsTable.innerHTML = pageDocuments.map(doc => {
            const statusBadge = getStatusBadge(doc.workflow_status);
            const statusText = getStatusText(doc.workflow_status);
            const categoryName = doc.category_display_name || doc.category_name || doc.category || 'N/A';
            const uploaderName = doc.author_name || `${doc.uploader_firstName || ''} ${doc.uploader_lastName || ''}`.trim() || 'Unknown';
            const fileUrl = doc.file_url ? `${API_BASE}${doc.file_url}` : '#';
            
            // Render standards badges
            const standardsBadges = renderStandardsBadges(doc.standards);

            return `
                <tr data-id="${doc.id}">
                    <td class="py-3">
                        <div class="font-medium text-gray-800">${doc.title}</div>
                        <div class="text-xs text-gray-400">by ${uploaderName}</div>
                    </td>
                    <td class="py-3"><span class="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full">${categoryName}</span></td>
                    <td class="py-3">${standardsBadges}</td>
                    <td class="py-3 text-gray-600">${doc.department_code || doc.area || '-'}</td>
                    <td class="py-3"><span class="${statusBadge} px-2 py-1 rounded-full text-xs">${statusText}</span></td>
                    <td class="py-3 text-gray-600">${doc.version || 'v1.0'}</td>
                    <td class="py-3 text-gray-400">${new Date(doc.created_at).toLocaleDateString()}</td>
                    <td class="py-3">
                        <div class="flex flex-wrap gap-2">
                            <button class="btn-view view-doc" data-id="${doc.id}" data-title="${doc.title}">View</button>
                            ${doc.workflow_status === 'rejected' ? `<button class="btn-comments" data-id="${doc.id}">Comments</button>` : ''}
                            ${doc.workflow_status === 'rejected' ? `<button class="btn-delete delete-doc" data-id="${doc.id}">Delete</button>` : ''}
                            ${doc.uploader_id === user.id && doc.workflow_status === 'draft' ? `<button class="btn-delete delete-doc" data-id="${doc.id}">Delete</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        attachActionHandlers();
    }
    
    function renderStandardsBadges(standards) {
        if (!standards || standards.length === 0) return '<span class="text-gray-400 text-xs">—</span>';
        const items = standards.slice(0, 2);
        const badges = items.map(s => `<span class="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-1.5 py-0.5 rounded">${s}</span>`).join(' ');
        const more = standards.length > 2 ? ` <span class="text-gray-400 text-xs">+${standards.length - 2}</span>` : '';
        return `<div class="flex flex-wrap gap-1">${badges}${more}</div>`;
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, filteredDocuments.length);

        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${start} to ${end} of ${filteredDocuments.length}`;
        }

        if (paginationButtons) {
            let buttons = '<button class="px-3 py-1 bg-white border rounded-lg text-gray-600 text-sm" data-page="prev">Previous</button>';
            for (let i = 1; i <= totalPages; i++) {
                const active = i === currentPage ? 'bg-teal-700 text-white' : 'bg-white border text-gray-600';
                buttons += `<button class="px-3 py-1 ${active} rounded-lg text-sm" data-page="${i}">${i}</button>`;
            }
            buttons += '<button class="px-3 py-1 bg-white border rounded-lg text-gray-600 text-sm" data-page="next">Next</button>';

            paginationButtons.innerHTML = buttons;

            paginationButtons.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = btn.getAttribute('data-page');
                    if (page === 'prev' && currentPage > 1) currentPage--;
                    else if (page === 'next' && currentPage < totalPages) currentPage++;
                    else if (!isNaN(page)) currentPage = parseInt(page);
                    renderDocuments();
                    renderPagination();
                });
            });
        }
    }

    function attachActionHandlers() {
        // View buttons
        document.querySelectorAll('.view-doc').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                const docId = this.getAttribute('data-id');
                const title = this.getAttribute('data-title');
                
                try {
                    const response = await fetch(`${API_BASE}/api/documents/${docId}/download`, {
                        method: 'GET',
                        headers: { 'x-auth-token': token }
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.msg || 'Failed to view document');
                    }
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    openPreviewModal(url, title);
                } catch (error) {
                    console.error('View error:', error);
                    showToast(error.message || 'Failed to view document', true);
                }
            });
        });

        // Comments buttons
        document.querySelectorAll('.btn-comments').forEach(btn => {
            btn.addEventListener('click', function() {
                const docId = this.getAttribute('data-id');
                showRejectionComments(docId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-doc').forEach(btn => {
            btn.addEventListener('click', function() {
                const docId = this.getAttribute('data-id');
                deleteDocument(docId);
            });
        });
    }

    async function showRejectionComments(docId) {
        try {
            console.log('Fetching comments for document:', docId);
            console.log('API URL:', `${API_BASE}/api/documents/${docId}/comments`);
            
            const response = await fetch(`${API_BASE}/api/documents/${docId}/comments`, {
                headers: { 'x-auth-token': token }
            });
            
            console.log('Comments response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
                throw new Error(errorData.msg || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Comments data:', data);
            
            const doc = allDocuments.find(d => d.id == docId);
            console.log('Document found:', doc);
            
            openCommentsModal(doc, data.comments || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            showToast('Failed to load comments: ' + error.message, true);
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
                                <span class="comment-reviewer">${reviewer}</span>
                                <span class="comment-date">${date}</span>
                            </div>
                            <div class="comment-text">${text}</div>
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

    function deleteDocument(docId) {
        if (!confirm('Delete this document? This action cannot be undone.')) return;

        console.log('Deleting document:', docId);
        console.log('API URL:', `${API_BASE}/api/documents/${docId}`);
        console.log('Token:', token ? 'Present' : 'Missing');
        console.log('User role:', role);

        fetch(`${API_BASE}/api/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        })
        .then(r => {
            console.log('Delete response status:', r.status);
            if (!r.ok) {
                return r.json().then(errData => {
                    throw new Error(errData.msg || `HTTP ${r.status}`);
                });
            }
            return r.json();
        })
        .then(data => {
            console.log('Delete success:', data);
            showToast(data.msg || 'Document deleted successfully');
            loadDocuments();
        })
        .catch(err => {
            console.error('Delete error:', err);
            showToast('Failed to delete document: ' + err.message, true);
        });
    }

    // Event listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            // Update standards dropdown when category changes
            updateStandardsDropdown(this.value);
            applyFilters();
        });
    }
    const departmentFilter = document.getElementById('departmentFilter');
    if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
    const standardsFilter = document.getElementById('standardsFilter');
    if (standardsFilter) standardsFilter.addEventListener('change', applyFilters);
    
    // Upload button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            window.location.href = 'user-upload.html';
        });
    }
});

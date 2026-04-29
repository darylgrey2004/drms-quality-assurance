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

    async function loadFilterOptions() {
        try {
            // Load categories
            const categoriesRes = await fetch(`${API_BASE}/api/documents/categories`, {
                headers: { 'x-auth-token': token }
            });
            const categories = await categoriesRes.json();
            
            if (categoryFilter && categories.length > 0) {
                categoryFilter.innerHTML = '<option value="all">All Categories</option>';
                categories.forEach(cat => {
                    categoryFilter.innerHTML += `<option value="${cat.name}">${cat.display_name || cat.name}</option>`;
                });
            }

            // Load departments
            const departmentsRes = await fetch(`${API_BASE}/api/documents/departments`, {
                headers: { 'x-auth-token': token }
            });
            const departments = await departmentsRes.json();
            
            // Add department filter if it exists in HTML
            const departmentFilter = document.getElementById('departmentFilter');
            if (departmentFilter && departments.length > 0) {
                departmentFilter.innerHTML = '<option value="all">All Departments</option>';
                departments.forEach(dept => {
                    departmentFilter.innerHTML += `<option value="${dept.code}">${dept.code} - ${dept.name}</option>`;
                });
            }
        } catch (err) {
            console.error('Load filter options error:', err);
        }
    }

    function loadDocuments() {
        console.log('Loading documents...');
        fetch(`${API_BASE}/api/documents`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(docs => {
            console.log('Documents loaded:', docs);
            allDocuments = docs;
            applyFilters();
        })
        .catch(err => {
            console.error('Load documents error:', err);
        });
    }

    function applyFilters() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const status = statusFilter?.value || 'all';
        const category = categoryFilter?.value || 'all';
        const departmentFilter = document.getElementById('departmentFilter');
        const department = departmentFilter?.value || 'all';

        filteredDocuments = allDocuments.filter(doc => {
            const matchesSearch = !searchTerm ||
                doc.title.toLowerCase().includes(searchTerm) ||
                (doc.author_name || '').toLowerCase().includes(searchTerm) ||
                (doc.department_name || '').toLowerCase().includes(searchTerm);

            const matchesStatus = status === 'all' || doc.workflow_status === status;
            const matchesCategory = category === 'all' || doc.category === category || doc.category_name === category;
            const matchesDepartment = department === 'all' || doc.department_code === department;

            return matchesSearch && matchesStatus && matchesCategory && matchesDepartment;
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
            documentsTable.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-gray-500">No documents found</td></tr>';
            return;
        }

        documentsTable.innerHTML = pageDocuments.map(doc => {
            const statusBadge = getStatusBadge(doc.workflow_status);
            const statusText = getStatusText(doc.workflow_status);
            const categoryName = doc.category_display_name || doc.category_name || doc.category || 'N/A';
            const uploaderName = doc.author_name || `${doc.uploader_firstName || ''} ${doc.uploader_lastName || ''}`.trim() || 'Unknown';
            const fileUrl = doc.file_url ? `${API_BASE}${doc.file_url}` : '#';

            return `
                <tr data-id="${doc.id}">
                    <td class="py-3">
                        <div class="font-medium text-gray-800">${doc.title}</div>
                        <div class="text-xs text-gray-400">by ${uploaderName}</div>
                    </td>
                    <td class="py-3"><span class="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full">${categoryName}</span></td>
                    <td class="py-3 text-gray-600">${doc.department_code || doc.area || '-'}</td>
                    <td class="py-3"><span class="${statusBadge} px-2 py-1 rounded-full text-xs">${statusText}</span></td>
                    <td class="py-3 text-gray-600">${doc.version || 'v1.0'}</td>
                    <td class="py-3 text-gray-400">${new Date(doc.created_at).toLocaleDateString()}</td>
                    <td class="py-3">
                        <a href="${fileUrl}" target="_blank" class="text-teal-600 hover:text-teal-800 mr-2 view-doc" title="View">👁️</a>
                        <button class="text-gray-500 hover:text-gray-700 mr-2 info-doc" data-id="${doc.id}" title="Info">ℹ️</button>
                        ${doc.uploader_id === user.id && doc.workflow_status === 'draft' ? `<button class="text-red-500 hover:text-red-700 delete-doc" data-id="${doc.id}" title="Delete">🗑️</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        attachActionHandlers();
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
        document.querySelectorAll('.info-doc').forEach(btn => {
            btn.addEventListener('click', function() {
                const docId = this.getAttribute('data-id');
                showDocumentInfo(docId);
            });
        });

        document.querySelectorAll('.delete-doc').forEach(btn => {
            btn.addEventListener('click', function() {
                const docId = this.getAttribute('data-id');
                deleteDocument(docId);
            });
        });
    }

    function showDocumentInfo(docId) {
        const doc = allDocuments.find(d => d.id == docId);
        if (!doc) return;

        alert(`Document Info:\n\nTitle: ${doc.title}\nCategory: ${doc.category_name || doc.category}\nDepartment: ${doc.department_code || 'N/A'}\nStatus: ${getStatusText(doc.workflow_status)}\nVersion: ${doc.version}\nUploaded: ${new Date(doc.created_at).toLocaleDateString()}\nFiles: ${doc.files_count || 0}`);
    }

    function deleteDocument(docId) {
        if (!confirm('Delete this document? This action cannot be undone.')) return;

        fetch(`${API_BASE}/api/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(data => {
            showToast(data.msg || 'Document deleted successfully');
            loadDocuments();
        })
        .catch(err => {
            console.error('Delete error:', err);
            showToast('Failed to delete document', true);
        });
    }

    // Event listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    const departmentFilter = document.getElementById('departmentFilter');
    if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
    if (filterBtn) filterBtn.addEventListener('click', applyFilters);
});

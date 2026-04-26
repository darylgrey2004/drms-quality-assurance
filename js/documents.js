// js/documents.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const sessionToken = localStorage.getItem('sessionToken');
    const API_BASE = 'http://localhost:3000';
    const documentsList = document.getElementById('documentsList');
    
    // ── Heartbeat: Update session activity ──
    if (token && sessionManager) {
        sessionManager.initializeHeartbeat(2 * 60 * 1000);
    }
    
    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortByFilter = document.getElementById('sortByFilter');
    const uploadBtn = document.getElementById('uploadBtn');
    const tableBody = document.getElementById('documentsTableBody');
    const mobileContainer = document.getElementById('mobileDocumentsContainer');
    const docCount = document.getElementById('docCount');
    const totalDocuments = document.getElementById('totalDocuments');

    let allDocuments = [];
    const canLock = true;

    function statusLabel(doc) {
        if (Number(doc.is_locked) === 1) return 'Locked';
        const map = {
            approved: 'Approved',
            pending: 'Pending',
            validated: 'Validated',
            draft: 'Draft',
            rejected: 'Rejected'
        };
        return map[(doc.workflow_status || '').toLowerCase()] || 'Pending';
    }

    function statusClass(label) {
        const key = label.toLowerCase();
        if (key === 'approved') return 'badge-approved';
        if (key === 'draft') return 'badge-draft';
        if (key === 'locked') return 'bg-gray-800 text-white';
        if (key === 'rejected') return 'bg-red-100 text-red-700';
        return 'badge-pending';
    }

    function renderRows(docs) {
        const rows = docs.map((doc) => {
            const label = statusLabel(doc);
            const lockButton = canLock
                ? `<button class="text-xs text-purple-700 hover:underline lock-btn" data-id="${doc.id}" data-locked="${Number(doc.is_locked) === 1 ? '1' : '0'}">${Number(doc.is_locked) === 1 ? 'Unlock' : 'Lock'}</button>`
                : '';
            return `
                <tr class="doc-row hover:bg-gray-50 transition">
                    <td class="py-3 px-4 text-gray-700 text-sm">${doc.department || '-'}</td>
                    <td class="py-3 px-4">
                        <div class="font-medium text-gray-800">${doc.document_name || doc.title || 'Untitled'}</div>
                    </td>
                    <td class="py-3 px-4"><span class="px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-700">${(doc.category || '').toUpperCase()}</span></td>
                    <td class="py-3 px-4 text-gray-600 text-sm">${doc.area || '-'}</td>
                    <td class="py-3 px-4 text-gray-600 text-sm">${doc.author || doc.author_name || '-'}</td>
                    <td class="py-3 px-4"><span class="${statusClass(label)} px-2 py-1 rounded-full text-xs">${label}</span></td>
                    <td class="py-3 px-4 text-gray-600 text-sm">${doc.date_added ? new Date(doc.date_added).toISOString().slice(0, 10) : '-'}</td>
                </tr>
            `;
        }).join('');

        const cards = docs.map((doc) => {
            const label = statusLabel(doc);
            const lockButton = canLock
                ? `<button class="text-xs text-purple-700 hover:underline lock-btn" data-id="${doc.id}" data-locked="${Number(doc.is_locked) === 1 ? '1' : '0'}">${Number(doc.is_locked) === 1 ? 'Unlock' : 'Lock'}</button>`
                : '';
            return `
                <div class="border rounded-lg p-4 bg-white">
                    <div class="font-medium text-gray-800">${doc.title || 'Untitled'}</div>
                    <div class="text-xs text-gray-400 mb-2">${doc.department || '-'} · ${doc.date_added ? new Date(doc.date_added).toISOString().slice(0, 10) : ''}</div>
                    <div class="flex flex-wrap gap-2 mb-2">
                        <span class="px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-700">${(doc.category || '').toUpperCase()}</span>
                        <span class="${statusClass(label)} px-2 py-1 rounded-full text-xs">${label}</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-3">${doc.area || '-'} · ${doc.author || doc.author_name || '-'}</div>
                    <div class="flex gap-3 text-xs">
                        ${doc.file_url ? `<a class="text-teal-700 hover:underline" href="${API_BASE}${doc.file_url}" target="_blank" rel="noreferrer">View</a>` : ''}
                        ${lockButton}
                    </div>
                </div>
            `;
        }).join('');

        if (tableBody) tableBody.innerHTML = rows;
        if (mobileContainer) mobileContainer.innerHTML = cards;
        if (docCount) docCount.textContent = String(docs.length);
        if (totalDocuments) totalDocuments.textContent = String(docs.length);
    }

    function applyClientFilters() {
        const term = (searchInput?.value || '').toLowerCase().trim();
        const d = (departmentFilter?.value || 'all').toLowerCase();
        const c = (categoryFilter?.value || 'all').toLowerCase();
        const s = (statusFilter?.value || 'all').toLowerCase();

        const filtered = allDocuments.filter((doc) => {
            const label = statusLabel(doc).toLowerCase();
            const matchesSearch = !term || [doc.document_name || doc.title, doc.department, doc.area, doc.category, doc.author || doc.author_name].some((v) => String(v || '').toLowerCase().includes(term));
            const matchesDepartment = d === 'all' || String(doc.department || '').toLowerCase() === d;
            const matchesCategory = c === 'all' || String(doc.category || '').toLowerCase() === c;
            const matchesStatus = s === 'all' || label === s;
            return matchesSearch && matchesDepartment && matchesCategory && matchesStatus;
        });
        renderRows(filtered);
    }

    function populateDepartmentFilter() {
        if (!departmentFilter) return;
        const departments = [...new Set(allDocuments.map((d) => String(d.department || '').trim()).filter(Boolean))].sort();
        departmentFilter.innerHTML = '<option value="all">All Departments</option>' + departments.map((d) => `<option value="${d.toLowerCase()}">${d}</option>`).join('');
    }

    function loadDocuments() {
        const sortBy = sortByFilter?.value || 'date';
        fetch(`${API_BASE}/api/documents?scope=all&sortBy=${encodeURIComponent(sortBy)}&sortOrder=desc`, {
            headers: { 'x-auth-token': token }
        })
            .then((r) => r.json())
            .then((docs) => {
                allDocuments = Array.isArray(docs) ? docs : [];
                populateDepartmentFilter();
                applyClientFilters();
            })
            .catch(() => {
                allDocuments = [];
                renderRows([]);
            });
    }

    document.addEventListener('click', (e) => {
        const lockBtn = e.target.closest('.lock-btn');
        if (!lockBtn) return;
        if (!canLock) return;
        const id = lockBtn.getAttribute('data-id');
        const isLocked = lockBtn.getAttribute('data-locked') === '1';
        fetch(`${API_BASE}/api/documents/${id}/lock`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ is_locked: !isLocked })
        })
            .then((r) => r.json())
            .then(() => loadDocuments())
            .catch(() => {});
    });

    if (searchInput) searchInput.addEventListener('input', applyClientFilters);
    if (departmentFilter) departmentFilter.addEventListener('change', applyClientFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyClientFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyClientFilters);
    if (sortByFilter) sortByFilter.addEventListener('change', loadDocuments);
    if (uploadBtn) uploadBtn.addEventListener('click', () => window.location.href = 'upload.html');

    loadDocuments();
});
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://127.0.0.1:3000';
    const token = localStorage.getItem('token');
    const documentsList = document.getElementById('documentsList');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const docCount = document.getElementById('docCount');
    const uploadBtn = document.getElementById('uploadBtn');
    const filterBtn = document.getElementById('filterBtn');
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewBackdrop = document.getElementById('docPreviewBackdrop');
    const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
    const docPreviewFrame = document.getElementById('docPreviewFrame');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    const paginationSummary = document.querySelector('main .mt-6 .text-sm.text-gray-500');
    const paginationControls = document.querySelector('main .mt-6 .flex.gap-2');

    let documentsCache = [];
    let currentPage = 1;
    const pageSize = 8;

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
        ));
    }

    function formatDate(value) {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'N/A';
        return d.toISOString().slice(0, 10);
    }

    function getApiErrorMessage(payload, fallback) {
        return payload?.error?.details || payload?.error?.message || payload?.msg || fallback;
    }

    async function apiRequest(path, options = {}) {
        const headers = { ...(options.headers || {}) };
        if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) headers['x-auth-token'] = token;

        const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
        let payload = null;
        try {
            payload = await response.json();
        } catch (_e) {
            payload = null;
        }

        if (!response.ok) {
            throw new Error(getApiErrorMessage(payload, `Request failed (${response.status})`));
        }
        return payload;
    }

    function statusClass(status) {
        if (status === 'approved' || status === 'locked') return 'badge-approved';
        if (status === 'draft') return 'badge-draft';
        if (status === 'rejected') return 'bg-red-100 text-red-700';
        return 'badge-pending';
    }

    function openPreviewModal(url, title) {
        if (!docPreviewModal || !docPreviewFrame) {
            window.open(url, '_blank');
            return;
        }
        docPreviewTitle.textContent = title || 'Document Preview';
        docPreviewFrame.src = url;
        docPreviewModal.classList.remove('hidden');
        docPreviewModal.classList.add('flex');
    }

    function closePreviewModal() {
        if (!docPreviewModal || !docPreviewFrame) return;
        docPreviewModal.classList.add('hidden');
        docPreviewModal.classList.remove('flex');
        docPreviewFrame.src = 'about:blank';
    }

    function updateCount(items) {
        if (docCount) docCount.textContent = String(items.length);
    }

    function renderPagination(totalItems, totalPages) {
        if (paginationSummary) {
            const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const end = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);
            paginationSummary.textContent = `Showing ${start} to ${end} of ${totalItems} documents`;
        }

        if (!paginationControls) return;
        paginationControls.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.addEventListener('click', () => {
            currentPage = Math.max(1, currentPage - 1);
            renderDocuments();
        });
        paginationControls.appendChild(prevBtn);

        for (let page = 1; page <= totalPages; page += 1) {
            const pageBtn = document.createElement('button');
            const isActive = page === currentPage;
            pageBtn.className = isActive
                ? 'px-3 py-1 bg-teal-700 text-white rounded-lg'
                : 'px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50';
            pageBtn.textContent = String(page);
            pageBtn.addEventListener('click', () => {
                currentPage = page;
                renderDocuments();
            });
            paginationControls.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
        nextBtn.addEventListener('click', () => {
            currentPage = Math.min(totalPages, currentPage + 1);
            renderDocuments();
        });
        paginationControls.appendChild(nextBtn);
    }

    function renderDocuments() {
        if (!documentsList) return;

        const searchTerm = (searchInput?.value || '').trim().toLowerCase();
        const category = categoryFilter?.value || 'all';
        const status = statusFilter?.value || 'all';

        const filtered = documentsCache.filter((doc) => {
            const title = String(doc.title || '').toLowerCase();
            const cat = String(doc.category || '').toLowerCase();
            const workflow = String(doc.workflow_status || '').toLowerCase();
            const created = formatDate(doc.created_at).toLowerCase();

            const matchesSearch = !searchTerm || title.includes(searchTerm) || cat.includes(searchTerm) || workflow.includes(searchTerm) || created.includes(searchTerm);
            const matchesCategory = category === 'all' || cat === category.toLowerCase();
            const matchesStatus = status === 'all' || workflow.includes(status.toLowerCase());
            return matchesSearch && matchesCategory && matchesStatus;
        });

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        if (totalPages === 0) currentPage = 1;
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

        const startIndex = (currentPage - 1) * pageSize;
        const pagedItems = filtered.slice(startIndex, startIndex + pageSize);

        documentsList.innerHTML = pagedItems.map((doc) => {
            const workflow = String(doc.workflow_status || '').toLowerCase();
            const createdAt = formatDate(doc.created_at);
            return `
                <div class="grid grid-cols-12 py-3 text-sm items-center doc-row" data-doc-id="${doc.id}">
                    <div class="col-span-4">
                        <div class="font-medium text-gray-800">${escapeHtml(doc.title || 'Untitled')}</div>
                        <div class="text-xs text-gray-400">Created: ${escapeHtml(createdAt)}</div>
                    </div>
                    <div class="col-span-2 text-gray-600">${escapeHtml((doc.category || '').toUpperCase())}</div>
                    <div class="col-span-2 text-gray-600">${escapeHtml(doc.area || '-')}</div>
                    <div class="col-span-1"><span class="${statusClass(workflow)} px-2 py-1 rounded-full text-xs">${escapeHtml(workflow || 'pending')}</span></div>
                    <div class="col-span-1 text-gray-600">${escapeHtml(doc.version || 'v1.0')}</div>
                    <div class="col-span-2 text-teal-600 text-xs space-x-2">
                        <button class="hover:underline view-btn" data-action="view" data-id="${doc.id}">👁️</button>
                        <button class="hover:underline attach-btn" data-action="files" data-id="${doc.id}">📎</button>
                        <button class="hover:underline edit-btn" data-action="edit" data-id="${doc.id}">✏️</button>
                    </div>
                </div>
            `;
        }).join('');

        updateCount(filtered);
        renderPagination(totalItems, totalPages);
    }

    async function loadDocuments() {
        try {
            const docs = await apiRequest('/api/documents', { method: 'GET' });
            documentsCache = Array.isArray(docs) ? docs : [];
            renderDocuments();
        } catch (error) {
            alert(`Failed to load documents: ${error.message}`);
        }
    }

    async function handleViewFiles(docId, openFirstForPreview) {
        try {
            const files = await apiRequest(`/api/documents/${docId}/files`, { method: 'GET' });
            if (!Array.isArray(files) || files.length === 0) {
                alert('No files uploaded for this document yet.');
                return;
            }

            if (openFirstForPreview) {
                const first = files[0];
                const href = `${API_BASE}${first.url_path}`;
                openPreviewModal(href, first.original_name || 'Document file');
                return;
            }

            const html = `
                <html><head><title>Document Files</title></head><body style="font-family:Arial;padding:16px">
                <h3>Document Files</h3>
                <ul>
                ${files.map((file) => `<li><a href="${API_BASE}${file.url_path}" target="_blank">${escapeHtml(file.original_name || file.stored_name)}</a></li>`).join('')}
                </ul>
                </body></html>
            `;
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(html);
                win.document.close();
            }
        } catch (error) {
            alert(`Failed to fetch files: ${error.message}`);
        }
    }

    async function handleEdit(docId) {
        const doc = documentsCache.find((item) => Number(item.id) === Number(docId));
        if (!doc) return;

        const title = prompt('Title:', doc.title || '');
        if (!title) return;
        const category = prompt('Category (iso/aaccup/coe):', doc.category || '');
        if (!category) return;
        const area = prompt('Area/Clause:', doc.area || '');
        if (!area) return;
        const version = prompt('Version:', doc.version || 'v1.0');
        if (!version) return;
        const description = prompt('Description:', doc.description || '') || '';
        const keywords = prompt('Keywords (comma separated):', doc.keywords || '') || '';
        const authorName = prompt('Author name:', doc.author_name || '') || '';

        const body = {
            title,
            category,
            area,
            version,
            description,
            keywords,
            author_name: authorName
        };

        try {
            await apiRequest(`/api/documents/${docId}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            alert('Document metadata updated successfully.');
            await loadDocuments();
        } catch (error) {
            alert(`Failed to update document: ${error.message}`);
        }
    }

    if (docPreviewCloseBtn) docPreviewCloseBtn.addEventListener('click', closePreviewModal);
    if (docPreviewBackdrop) docPreviewBackdrop.addEventListener('click', closePreviewModal);
    if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; renderDocuments(); });
    if (categoryFilter) categoryFilter.addEventListener('change', () => { currentPage = 1; renderDocuments(); });
    if (statusFilter) statusFilter.addEventListener('change', () => { currentPage = 1; renderDocuments(); });

    if (documentsList) {
        documentsList.addEventListener('click', async (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            event.preventDefault();

            const docId = button.getAttribute('data-id');
            const action = button.getAttribute('data-action');
            if (!docId || !action) return;

            if (action === 'view') await handleViewFiles(docId, true);
            if (action === 'files') await handleViewFiles(docId, false);
            if (action === 'edit') await handleEdit(docId);
        });
    }

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            window.location.href = 'upload.html';
        });
    }

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            renderDocuments();
        });
    }

    const currentPath = window.location.pathname.split('/').pop() || 'documents.html';
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            navLinks.forEach((item) => {
                item.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                item.style.background = '';
            });
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1a4450';
        }
    });

    loadDocuments();
});
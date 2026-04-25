document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = String(user.role || '').toLowerCase().trim();
    const API_BASE = 'http://localhost:3000';
    const approvalsList = document.getElementById('approvalsList');
    const searchInput = document.getElementById('searchApprovals');
    const workflowStage = document.getElementById('workflowStage');
    const approvalStatus = document.getElementById('approvalStatus');
    const refreshBtn = document.getElementById('refreshApprovals');
    const pendingCount = document.getElementById('pendingCount');
    const validationCount = document.getElementById('validationCount');
    const approvalCount = document.getElementById('approvalCount');

    if (!token) {
        window.location.href = 'landing.html';
        return;
    }
    if (role !== 'admin' && role !== 'dean' && role !== 'qa coordinator') {
        window.location.href = 'user-approvals.html';
        return;
    }

    let queue = [];

    function api(path, options) {
        return fetch(`${API_BASE}${path}`, {
            ...(options || {}),
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
                ...((options && options.headers) || {})
            }
        }).then(async (res) => {
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload.error?.message || payload.msg || 'Request failed');
            return payload;
        });
    }

    function stageLabel(doc) {
        const s = String(doc.workflow_status || '').toLowerCase();
        return s === 'validated' ? 'Approval' : 'Validation';
    }

    function statusLabel(doc) {
        const s = String(doc.workflow_status || '').toLowerCase();
        return s === 'validated' ? 'Under Review' : 'Pending';
    }

    function render() {
        if (!approvalsList) return;
        const term = String(searchInput?.value || '').toLowerCase();
        const stageFilter = String(workflowStage?.value || 'all').toLowerCase();
        const statusFilter = String(approvalStatus?.value || 'all').toLowerCase();

        const filtered = queue.filter((doc) => {
            const stage = stageLabel(doc).toLowerCase();
            const status = statusLabel(doc).toLowerCase();
            const text = `${doc.title || ''} ${doc.author_name || ''} ${doc.category || ''}`.toLowerCase();
            return (!term || text.includes(term))
                && (stageFilter === 'all' || stage.includes(stageFilter))
                && (statusFilter === 'all' || status.includes(statusFilter));
        });

        approvalsList.innerHTML = filtered.map((d) => `
            <div class="grid grid-cols-12 py-3 text-sm items-center approval-item" data-id="${d.id}">
                <div class="col-span-4">
                    <div class="font-medium text-gray-800">${d.title || 'Untitled'}</div>
                    <div class="text-xs text-gray-400">by ${d.author_name || 'Uploader'}</div>
                </div>
                <div class="col-span-2 text-gray-600">${String(d.category || '').toUpperCase()}</div>
                <div class="col-span-2"><span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">${stageLabel(d)}</span></div>
                <div class="col-span-1"><span class="badge-pending px-2 py-1 rounded-full text-xs">${statusLabel(d)}</span></div>
                <div class="col-span-1 text-gray-600">${d.version || 'v1.0'}</div>
                <div class="col-span-2 text-xs space-x-2">
                    <button class="action-link validate-btn" data-id="${d.id}">✓ Validate</button>
                    <button class="action-link approve-btn" data-id="${d.id}">✓ Approve</button>
                    <button class="action-link-danger reject-btn" data-id="${d.id}">✕ Reject</button>
                </div>
            </div>
        `).join('');

        const pending = queue.filter((d) => String(d.workflow_status).toLowerCase() === 'pending').length;
        const validated = queue.filter((d) => String(d.workflow_status).toLowerCase() === 'validated').length;
        if (pendingCount) pendingCount.textContent = String(pending);
        if (validationCount) validationCount.textContent = String(pending);
        if (approvalCount) approvalCount.textContent = String(validated);
    }

    async function loadQueue() {
        queue = await api('/api/documents/approvals');
        render();
    }

    approvalsList?.addEventListener('click', async (e) => {
        const validateBtn = e.target.closest('.validate-btn');
        const approveBtn = e.target.closest('.approve-btn');
        const rejectBtn = e.target.closest('.reject-btn');
        const id = validateBtn?.dataset.id || approveBtn?.dataset.id || rejectBtn?.dataset.id;
        if (!id) return;
        try {
            if (validateBtn) await api(`/api/documents/${id}/validate`, { method: 'POST' });
            if (approveBtn) await api(`/api/documents/${id}/approve`, { method: 'POST' });
            if (rejectBtn) {
                const reason = prompt('Enter rejection reason:') || '';
                await api(`/api/documents/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
            }
            await loadQueue();
        } catch (error) {
            alert(error.message || 'Failed to update approval');
        }
    });

    searchInput?.addEventListener('input', render);
    workflowStage?.addEventListener('change', render);
    approvalStatus?.addEventListener('change', render);
    refreshBtn?.addEventListener('click', loadQueue);
    loadQueue().catch((error) => alert(error.message || 'Failed to load approvals'));
});
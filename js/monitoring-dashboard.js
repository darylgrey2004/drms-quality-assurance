document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const API_BASE = window.location.origin && window.location.origin.startsWith('http')
        ? window.location.origin
        : 'http://localhost:3000';

    const refreshBtn = document.getElementById('refreshBtn');
    const statusBanner = document.getElementById('statusBanner');
    const totalEl = document.getElementById('totalRecords');
    const approvedEl = document.getElementById('approvedRecords');
    const pendingEl = document.getElementById('pendingRecords');
    const otherEl = document.getElementById('otherRecords');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    const tableBody = document.getElementById('recordsTableBody');

    function showStatus(message, kind) {
        if (!statusBanner) return;
        statusBanner.textContent = message;
        statusBanner.classList.remove('hidden', 'status-ok', 'status-error');
        statusBanner.classList.add(kind === 'error' ? 'status-error' : 'status-ok');
    }

    function setCounts(statsRows) {
        const counts = {
            approved: 0,
            pending: 0,
            draft: 0,
            validated: 0,
            rejected: 0,
            locked: 0
        };

        (statsRows || []).forEach((row) => {
            const status = String(row.workflow_status || '').toLowerCase();
            const value = Number(row.count) || 0;
            if (Object.prototype.hasOwnProperty.call(counts, status)) {
                counts[status] = value;
            }
        });

        const pendingTotal = counts.pending + counts.validated;
        const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
        const other = total - counts.approved - pendingTotal;

        totalEl.textContent = String(total);
        approvedEl.textContent = String(counts.approved);
        pendingEl.textContent = String(pendingTotal);
        otherEl.textContent = String(other < 0 ? 0 : other);
    }

    function statusLabel(value) {
        const s = String(value || '').toLowerCase();
        if (s === 'approved') return 'Approved';
        if (s === 'pending') return 'Pending';
        if (s === 'validated') return 'Validated';
        if (s === 'draft') return 'Draft';
        if (s === 'locked') return 'Locked';
        if (s === 'rejected') return 'Rejected';
        return 'Unknown';
    }

    function safeText(value) {
        const text = String(value == null ? '' : value);
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderRows(records) {
        if (!tableBody) return;
        if (!Array.isArray(records) || records.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-500">No records available.</td></tr>';
            return;
        }

        tableBody.innerHTML = records.slice(0, 12).map((rec) => {
            const created = rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '-';
            return (
                '<tr>' +
                '<td class="py-3 font-medium text-gray-800">' + safeText(rec.title || 'Untitled') + '</td>' +
                '<td class="py-3 text-gray-600">' + safeText(rec.category || '-') + '</td>' +
                '<td class="py-3 text-gray-600">' + safeText(rec.area || '-') + '</td>' +
                '<td class="py-3"><span class="status-pill">' + safeText(statusLabel(rec.workflow_status)) + '</span></td>' +
                '<td class="py-3 text-gray-600">' + safeText(rec.version || '-') + '</td>' +
                '<td class="py-3 text-gray-600">' + safeText(created) + '</td>' +
                '</tr>'
            );
        }).join('');
    }

    async function loadDashboard() {
        if (!token) {
            showStatus('No session token found. Please sign in again.', 'error');
            return;
        }

        try {
            showStatus('Loading monitoring data...', 'ok');

            const headers = { 'x-auth-token': token };
            const [statsRes, recordsRes] = await Promise.all([
                fetch(API_BASE + '/api/documents/stats', { headers: headers }),
                fetch(API_BASE + '/api/documents?scope=all', { headers: headers })
            ]);

            if (!statsRes.ok || !recordsRes.ok) {
                throw new Error('Failed to load dashboard data');
            }

            const [stats, records] = await Promise.all([statsRes.json(), recordsRes.json()]);
            setCounts(stats);
            renderRows(records);

            const stamp = new Date().toLocaleString();
            if (lastUpdatedEl) lastUpdatedEl.textContent = 'Last updated: ' + stamp;
            showStatus('Monitoring data loaded successfully.', 'ok');
        } catch (_error) {
            showStatus('Unable to load monitoring data from server.', 'error');
        }
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboard);
    }

    loadDashboard();
});

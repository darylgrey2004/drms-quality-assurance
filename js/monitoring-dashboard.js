document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const API_BASE = 'http://127.0.0.1:3000';

    const refreshBtn = document.getElementById('refreshBtn');
    const statusBanner = document.getElementById('statusBanner');
    const totalEl = document.getElementById('totalRecords');
    const approvedEl = document.getElementById('approvedRecords');
    const pendingEl = document.getElementById('pendingRecords');
    const otherEl = document.getElementById('otherRecords');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    const tableBody = document.getElementById('recordsTableBody');
    const recordsSection = tableBody ? tableBody.closest('section') : null;

    let categoryChart = null;
    let statusChart = null;
    let categoryCanvas = null;
    let statusCanvas = null;

    function showStatus(message, kind) {
        if (!statusBanner) return;
        statusBanner.textContent = message;
        statusBanner.classList.remove('hidden', 'status-ok', 'status-error');
        statusBanner.classList.add(kind === 'error' ? 'status-error' : 'status-ok');
    }

    function getApiErrorMessage(payload, fallback) {
        return payload?.error?.details || payload?.error?.message || payload?.msg || fallback;
    }

    async function apiRequest(path) {
        const headers = token ? { 'x-auth-token': token } : {};
        const response = await fetch(API_BASE + path, { headers: headers });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(getApiErrorMessage(payload, 'Request failed'));
        }
        return payload;
    }

    function setCounts(stats) {
        const status = stats?.byStatus || {};
        const total = Number(stats?.total) || 0;
        const approved = Number(status.approved) || 0;
        const pending = (Number(status.pending) || 0) + (Number(status.validated) || 0);
        const other = total - approved - pending;

        totalEl.textContent = String(total);
        approvedEl.textContent = String(approved);
        pendingEl.textContent = String(pending);
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

    function ensureChartSection() {
        if (!recordsSection || categoryCanvas || statusCanvas) return;

        const chartSection = document.createElement('section');
        chartSection.className = 'grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6';
        chartSection.innerHTML = [
            '<article class="bg-white rounded-xl p-5 stat-card">',
            '<h2 class="font-semibold text-gray-800 text-lg mb-4">Documents Per Category</h2>',
            '<div class="h-72"><canvas id="categoryChart"></canvas></div>',
            '</article>',
            '<article class="bg-white rounded-xl p-5 stat-card">',
            '<h2 class="font-semibold text-gray-800 text-lg mb-4">Documents By Workflow Status</h2>',
            '<div class="h-72"><canvas id="statusChart"></canvas></div>',
            '</article>'
        ].join('');

        recordsSection.parentNode.insertBefore(chartSection, recordsSection);
        categoryCanvas = document.getElementById('categoryChart');
        statusCanvas = document.getElementById('statusChart');
    }

    async function ensureChartJs() {
        if (window.Chart) return;
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = function () { reject(new Error('Failed to load Chart.js')); };
            document.head.appendChild(script);
        });
    }

    function renderCharts(stats) {
        if (!window.Chart || !categoryCanvas || !statusCanvas) return;

        const categoryEntries = Object.entries(stats?.byCategory || {});
        const statusEntries = Object.entries(stats?.byStatus || {});

        const categoryLabels = categoryEntries.map((entry) => entry[0]);
        const categoryValues = categoryEntries.map((entry) => Number(entry[1]) || 0);

        const statusLabels = statusEntries.map((entry) => entry[0]);
        const statusValues = statusEntries.map((entry) => Number(entry[1]) || 0);

        if (categoryChart) categoryChart.destroy();
        if (statusChart) statusChart.destroy();

        categoryChart = new window.Chart(categoryCanvas, {
            type: 'bar',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Documents',
                    data: categoryValues,
                    backgroundColor: '#0f766e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });

        statusChart = new window.Chart(statusCanvas, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusValues,
                    backgroundColor: ['#6b7280', '#f59e0b', '#3b82f6', '#16a34a', '#111827', '#dc2626']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    async function loadDashboard() {
        if (!token) {
            showStatus('No session token found. Please sign in again.', 'error');
            return;
        }

        try {
            showStatus('Loading monitoring data...', 'ok');
            ensureChartSection();
            await ensureChartJs();
            const [stats, records] = await Promise.all([
                apiRequest('/api/documents/stats'),
                apiRequest('/api/documents')
            ]);
            setCounts(stats);
            renderRows(records);
            renderCharts(stats);

            const stamp = new Date().toLocaleString();
            if (lastUpdatedEl) lastUpdatedEl.textContent = 'Last updated: ' + stamp;
            showStatus('Monitoring data loaded successfully.', 'ok');
        } catch (error) {
            showStatus('Unable to load monitoring data: ' + (error.message || 'Unknown error'), 'error');
        }
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboard);
    }

    loadDashboard();
});

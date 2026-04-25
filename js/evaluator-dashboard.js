// js/evaluator-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) {
        window.location.href = 'landing.html';
        return;
    }

    function getApiErrorMessage(payload, fallback) {
        return payload?.error?.details || payload?.error?.message || payload?.msg || fallback;
    }

    async function apiRequest(path) {
        const response = await fetch(`http://localhost:3000${path}`, {
            headers: { 'x-auth-token': token }
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Request failed'));
        return payload;
    }

    function updateStats(stats) {
        const values = document.querySelectorAll('.stat-card .text-3xl');
        const byStatus = stats?.byStatus || {};
        if (values[0]) values[0].textContent = String(stats?.total || 0);
        if (values[1]) values[1].textContent = String(byStatus.pending || 0);
        if (values[2]) values[2].textContent = String(byStatus.validated || 0);
        if (values[3]) values[3].textContent = String(byStatus.approved || 0);
    }

    function renderTable(documents) {
        const body = document.querySelector('tbody');
        if (!body) return;
        body.innerHTML = (documents || []).slice(0, 8).map((doc) => `
            <tr>
                <td class="py-3"><div class="font-medium">${doc.title || 'Untitled'}</div></td>
                <td class="py-3 text-gray-600">${doc.category || '-'}</td>
                <td class="py-3 text-gray-600">${doc.area || '-'}</td>
                <td class="py-3 text-gray-600">${doc.workflow_status || '-'}</td>
                <td class="py-3 text-gray-500">${doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}</td>
            </tr>
        `).join('');
    }

    async function loadDashboard() {
        try {
            const [stats, documents] = await Promise.all([
                apiRequest('/api/documents/stats'),
                apiRequest('/api/documents')
            ]);
            updateStats(stats);
            renderTable(documents);
        } catch (error) {
            console.error('Evaluator dashboard load failed', error);
        }
    }

    loadDashboard();
});
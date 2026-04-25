document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    const tbody = document.querySelector('tbody');
    const countDisplay = document.querySelector('.text-sm.text-gray-500');

    function api(path) {
        return fetch(`http://localhost:3000${path}`, {
            headers: { 'x-auth-token': token }
        }).then((r) => r.json());
    }

    function renderRows(rows) {
        if (!tbody) return;
        tbody.innerHTML = rows.slice(0, 10).map((doc) => `
            <tr data-id="${doc.id}">
                <td class="py-3"><div class="font-medium">${doc.title || 'Untitled'}</div></td>
                <td class="py-3 text-gray-600">${doc.category || '-'}</td>
                <td class="py-3 text-gray-600">${doc.area || '-'}</td>
                <td class="py-3 text-gray-600">${doc.workflow_status || '-'}</td>
                <td class="py-3 text-gray-500">${doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}</td>
                <td class="py-3"><button class="view-doc text-teal-700">View</button></td>
            </tr>
        `).join('');
        if (countDisplay) countDisplay.textContent = `Showing ${Math.min(rows.length, 10)} of ${rows.length} documents`;
    }

    tbody?.addEventListener('click', async (e) => {
        const row = e.target.closest('tr[data-id]');
        if (!row || !e.target.closest('.view-doc')) return;
        const id = row.getAttribute('data-id');
        const files = await api(`/api/documents/${id}/files`).catch(() => []);
        if (Array.isArray(files) && files.length > 0) {
            window.open(`http://localhost:3000${files[0].url_path}`, '_blank');
        }
    });

    api('/api/documents')
        .then((docs) => {
            renderRows(Array.isArray(docs) ? docs : []);
        })
        .catch(() => {
            renderRows([]);
        });
});
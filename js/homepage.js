// js/homepage.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    function api(path) {
        return fetch(`http://localhost:3000${path}`, {
            headers: token ? { 'x-auth-token': token } : {}
        }).then((r) => r.json());
    }

    async function openDocFromRow(row) {
        const id = row?.getAttribute('data-id');
        if (!id) return;
        const files = await api(`/api/documents/${id}/files`).catch(() => []);
        if (Array.isArray(files) && files.length > 0) {
            window.open(`http://localhost:3000${files[0].url_path}`, '_blank');
        }
    }

    const listWrap = document.querySelector('main');
    if (listWrap) {
        api('/api/documents').then((docs) => {
            const rows = listWrap.querySelectorAll('.grid.grid-cols-12.py-2, .grid.grid-cols-12.py-3');
            rows.forEach((row, idx) => {
                const doc = docs?.[idx];
                if (!doc) return;
                row.setAttribute('data-id', String(doc.id));
                const titleEl = row.querySelector('.font-medium');
                if (titleEl) titleEl.textContent = doc.title || 'Untitled';
                const cells = row.querySelectorAll('div');
                if (cells[1]) cells[1].textContent = doc.category || '-';
                if (cells[2]) cells[2].textContent = doc.area || '-';
            });
            listWrap.querySelectorAll('button.hover\\:underline').forEach((button) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    openDocFromRow(button.closest('[data-id]'));
                });
            });
        }).catch(() => {});
    }
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'homepage.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            // Remove active class from all
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            // Add active class to current
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1a4450';
        }
    });
});
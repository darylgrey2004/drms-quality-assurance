// js/user-documents.js

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Documents JS loaded');

    // Initialize user session (handled by user-session.js)
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    
    // Search functionality
    const searchInput = document.getElementById('searchDocuments');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const filterBtn = document.querySelector('.bg-teal-700.text-white');
    const documentsTable = document.getElementById('documentsTable');
    const STORAGE_KEY = 'userUploadedDocuments';

    function formatUploadDate(isoDate) {
        const date = new Date(isoDate);
        if (Number.isNaN(date.getTime())) return 'Just now';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function renderUploadedSamples() {
        if (!documentsTable) return;
        const currentUserId = String(user.id || '');
        const storedDocs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const myDocs = storedDocs.filter((doc) => String(doc.ownerId) === currentUserId);

        myDocs.forEach((doc) => {
            const row = document.createElement('tr');
            row.classList.add('uploaded-sample-row');
            row.innerHTML = `
                <td class="py-3">
                    <div class="font-medium text-gray-800">${doc.title || 'Untitled Document'}</div>
                    <div class="text-xs text-gray-400">${doc.fileName || 'Uploaded file'}</div>
                </td>
                <td class="py-3"><span class="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full">${doc.categoryLabel || 'ISO'}</span></td>
                <td class="py-3 text-gray-600">${doc.area || '-'}</td>
                <td class="py-3"><span class="${doc.statusClass || 'badge-pending'} px-2 py-1 rounded-full text-xs">${doc.status || 'Pending'}</span></td>
                <td class="py-3 text-gray-600">${doc.version || 'v1.0'}</td>
                <td class="py-3 text-gray-400">${formatUploadDate(doc.uploadedAt)}</td>
                <td class="py-3">
                    <button class="text-teal-600 hover:text-teal-800 mr-2 view-doc">👁️</button>
                    <button class="text-gray-500 hover:text-gray-700 mr-2 attach-doc">📎</button>
                    <button class="text-blue-600 hover:text-blue-800 version-doc">📋</button>
                </td>
            `;
            documentsTable.prepend(row);
        });
    }

    renderUploadedSamples();
    
    function filterDocuments() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const status = statusFilter?.value || 'all';
        const category = categoryFilter?.value || 'all';
        
        const tableRows = document.querySelectorAll('#documentsTable tr');
        tableRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const rowStatus = row.querySelector('td:nth-child(4) span')?.textContent.toLowerCase() || '';
            const rowCategory = row.querySelector('td:nth-child(2) span')?.textContent.toLowerCase() || '';
            
            const matchesSearch = searchTerm === '' || text.includes(searchTerm);
            const matchesStatus = status === 'all' || rowStatus.includes(status);
            const matchesCategory = category === 'all' || rowCategory.includes(category);
            
            if (matchesSearch && matchesStatus && matchesCategory) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        });
    }
    
    if (searchInput) searchInput.addEventListener('input', filterDocuments);
    if (statusFilter) statusFilter.addEventListener('change', filterDocuments);
    if (categoryFilter) categoryFilter.addEventListener('change', filterDocuments);
    if (filterBtn) filterBtn.addEventListener('click', filterDocuments);
    
    // Document action buttons
    document.querySelectorAll('.view-doc').forEach(btn => {
        btn.addEventListener('click', () => alert('Document viewer would open'));
    });
    
    document.querySelectorAll('.attach-doc').forEach(btn => {
        btn.addEventListener('click', () => alert('Attachments panel would open'));
    });
    
    document.querySelectorAll('.version-doc').forEach(btn => {
        btn.addEventListener('click', () => alert('Version history would open'));
    });
    
    // Pagination
    document.querySelectorAll('.flex.gap-2 button').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === 'Previous' || this.textContent === 'Next') {
                alert(this.textContent + ' page');
            } else if (this.textContent.match(/^\d+$/)) {
                document.querySelectorAll('.flex.gap-2 button').forEach(b => {
                    b.classList.remove('bg-teal-700', 'text-white');
                    b.classList.add('bg-white', 'border', 'text-gray-600');
                });
                this.classList.add('bg-teal-700', 'text-white');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) { window.location.href = 'landing.html'; return; }

    const role = (user.role || '').toLowerCase().trim();
    const API_BASE = 'http://localhost:3000';
    const isProgramHead = role === 'area chair/program head' || role === 'program head' || role === 'area chair';
    const isCoordinator = role === 'qa coordinator';
    if (role === 'faculty member') { window.location.href = 'user-dashboard.html'; return; }
    if (role === 'dean' || role === 'admin') { window.location.href = 'approvals.html'; return; }
    if (!isProgramHead && !isCoordinator) { window.location.href = 'user-dashboard.html'; return; }

    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = `
        <div class="mb-6">
            <h1 class="text-3xl font-semibold text-gray-800 tracking-tight">${isProgramHead ? 'Program Head Validation Queue' : 'QA Coordinator Validation Queue'}</h1>
            <p class="text-sm text-gray-500 mt-1">${isProgramHead ? 'Step 1 validation for newly submitted documents' : 'Step 2 validation after Program Head review'}</p>
        </div>
        <div class="bg-white rounded-xl p-4 stat-card mb-6">
            <input type="text" id="searchApprovals" placeholder="Search by document, author, category, area..." class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500">
        </div>
        <div class="bg-white rounded-xl p-5 stat-card">
            <div id="queueCount" class="text-sm text-gray-500 mb-3"></div>
            <div class="space-y-3" id="queueList"></div>
        </div>
    `;

    const searchInput = document.getElementById('searchApprovals');
    const queueList = document.getElementById('queueList');
    const queueCount = document.getElementById('queueCount');
    let queue = [];

    function actionEndpoint() {
        return isProgramHead ? 'validate-program-head' : 'validate-coordinator';
    }

    function render() {
        const term = (searchInput?.value || '').toLowerCase().trim();
        const filtered = queue.filter((d) => [d.document_name, d.author, d.category, d.area].some((v) => String(v || '').toLowerCase().includes(term)));
        queueCount.textContent = `Showing ${filtered.length} document(s)`;
        queueList.innerHTML = filtered.map((d) => `
            <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start gap-3">
                    <div>
                        <div class="font-medium text-gray-800">${d.document_name || '-'}</div>
                        <div class="text-xs text-gray-500 mt-1">by ${d.author || '-'} · ${(d.category || '').toUpperCase()} · ${d.area || '-'}</div>
                        <div class="text-xs text-gray-400 mt-1">Status: ${d.status || '-'} · ${d.date_added ? new Date(d.date_added).toISOString().slice(0, 10) : ''}</div>
                    </div>
                    <div class="flex gap-2 text-xs">
                        ${d.file_url ? `<a class="text-teal-700 hover:underline" href="${API_BASE}${d.file_url}" target="_blank" rel="noreferrer">View</a>` : ''}
                        <button class="text-green-700 hover:underline validate-btn" data-id="${d.id}">${isProgramHead ? 'Validate Step 1' : 'Validate Step 2'}</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function loadQueue() {
        fetch(`${API_BASE}/api/documents/review-queue`, {
            headers: { 'x-auth-token': token }
        })
            .then((r) => r.json())
            .then((docs) => {
                queue = Array.isArray(docs) ? docs : [];
                render();
            })
            .catch(() => {
                queue = [];
                render();
            });
    }

    document.addEventListener('click', (e) => {
        const validateBtn = e.target.closest('.validate-btn');
        if (!validateBtn) return;
        const id = validateBtn.getAttribute('data-id');
        fetch(`${API_BASE}/api/documents/${id}/${actionEndpoint()}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        })
            .then((r) => r.json())
            .then(() => loadQueue())
            .catch(() => {});
    });

    if (searchInput) searchInput.addEventListener('input', render);
    loadQueue();
});
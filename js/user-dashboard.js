document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role || '').toLowerCase().trim();
    const API_BASE = 'http://localhost:3000';
    if (!token || !user.id) { window.location.href = 'landing.html'; return; }

    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    if (role === 'faculty member') {
        const main = document.querySelector('main');
        if (!main) return;

        main.innerHTML = `
            <div class="p-7">
                <div class="mb-6">
                    <h1 class="text-3xl font-semibold text-gray-800 tracking-tight">Faculty Dashboard</h1>
                    <p class="text-sm text-gray-500 mt-1">Track your document workflow status</p>
                </div>
                <div id="facultyStats" class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"></div>
                <div class="bg-white rounded-xl p-5 stat-card">
                    <h2 class="font-semibold text-gray-800 text-lg mb-3">Submitted Documents</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-200 text-gray-500 text-xs">
                                    <th class="text-left py-2">Document</th>
                                    <th class="text-left py-2">Category</th>
                                    <th class="text-left py-2">Area</th>
                                    <th class="text-left py-2">Status</th>
                                    <th class="text-left py-2">Workflow</th>
                                    <th class="text-left py-2">PDF</th>
                                </tr>
                            </thead>
                            <tbody id="facultyDocsTable"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const statsEl = document.getElementById('facultyStats');
        const tableEl = document.getElementById('facultyDocsTable');
        const statusLabels = {
            submitted: 'Submitted',
            validated_program_head: 'Program Head Validated',
            validated_coordinator: 'Coordinator Validated',
            approved: 'Approved',
            locked: 'Locked'
        };

        function workflowBadges(status) {
            const order = ['submitted', 'validated_program_head', 'validated_coordinator', 'approved', 'locked'];
            const idx = order.indexOf(status);
            return order.map((step, i) => {
                const active = idx >= i;
                const label = statusLabels[step] || step;
                return `<span class="px-2 py-1 rounded-full text-xs ${active ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}">${label}</span>`;
            }).join(' ');
        }

        fetch(`${API_BASE}/api/documents?scope=mine&sortBy=date&sortOrder=desc`, {
            headers: { 'x-auth-token': token }
        })
            .then((r) => r.json())
            .then((docs) => {
                const rows = Array.isArray(docs) ? docs : [];
                const counts = {
                    submitted: 0,
                    validated_program_head: 0,
                    validated_coordinator: 0,
                    approved: 0,
                    locked: 0
                };
                rows.forEach((d) => {
                    const s = String(d.status || d.workflow_status || 'submitted');
                    if (Object.prototype.hasOwnProperty.call(counts, s)) counts[s] += 1;
                });
                statsEl.innerHTML = Object.keys(counts).map((k) => `
                    <div class="bg-white rounded-xl p-4 stat-card">
                        <div class="text-xs text-gray-500">${statusLabels[k]}</div>
                        <div class="text-2xl font-semibold text-gray-800 mt-1">${counts[k]}</div>
                    </div>
                `).join('');

                tableEl.innerHTML = rows.map((d) => {
                    const status = String(d.status || d.workflow_status || 'submitted');
                    const locked = status === 'locked' || Number(d.is_locked) === 1;
                    const pdfLink = d.pdf_file_path
                        ? `<a class="text-teal-700 hover:underline" href="${API_BASE}${d.pdf_file_path}" target="_blank" rel="noreferrer">View PDF</a>`
                        : '<span class="text-gray-400">Not available</span>';
                    return `
                        <tr class="border-b border-gray-100">
                            <td class="py-3">
                                <div class="font-medium text-gray-800">${d.document_name || d.title || '-'}</div>
                                <div class="text-xs ${locked ? 'text-rose-600' : 'text-gray-400'}">${locked ? 'Locked (read-only)' : 'Editable until locked'}</div>
                            </td>
                            <td class="py-3 text-gray-600">${(d.category || '').toUpperCase()}</td>
                            <td class="py-3 text-gray-600">${d.area || '-'}</td>
                            <td class="py-3"><span class="px-2 py-1 rounded-full text-xs ${locked ? 'bg-gray-800 text-white' : 'bg-teal-100 text-teal-700'}">${statusLabels[status] || status}</span></td>
                            <td class="py-3"><div class="flex flex-wrap gap-1">${workflowBadges(status)}</div></td>
                            <td class="py-3">${pdfLink}</td>
                        </tr>
                    `;
                }).join('');
            })
            .catch(() => {
                statsEl.innerHTML = '<div class="text-sm text-rose-600">Unable to load workflow stats.</div>';
                tableEl.innerHTML = '<tr><td colspan="6" class="py-4 text-sm text-rose-600">Unable to load documents.</td></tr>';
            });

        return;
    }

    if (role !== 'qa coordinator') {
        return;
    }

    document.querySelectorAll('nav a').forEach((link) => {
        const href = link.getAttribute('href') || '';
        const text = (link.textContent || '').toLowerCase();
        if (href === 'user-documents.html' || href === 'user-approvals.html' || text.includes('my documents') || text.includes('my approvals')) {
            link.remove();
        }
    });

    const main = document.querySelector('main');
    if (!main) return;

    main.innerHTML = `
        <div class="p-7">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-semibold text-gray-800">QA Coordinator Dashboard</h1>
                    <p class="text-sm text-gray-500 mt-1">Department-based monitoring and approvals</p>
                </div>
            </div>
            <div class="bg-white rounded-xl p-5 stat-card mb-6">
                <div class="flex flex-wrap gap-3 items-end">
                    <div>
                        <label class="text-xs text-gray-500">Department</label>
                        <select id="qaDepartmentFilter" class="mt-1 px-3 py-2 border rounded-lg text-sm"><option value="">All</option></select>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500">Category</label>
                        <select id="qaCategoryFilter" class="mt-1 px-3 py-2 border rounded-lg text-sm">
                            <option value="">All</option><option value="ISO">ISO</option><option value="COE">COE</option><option value="AACCUP">AACCUP</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500">Sort</label>
                        <select id="qaSortBy" class="mt-1 px-3 py-2 border rounded-lg text-sm">
                            <option value="date">By Date</option><option value="status">By Status</option><option value="version">By Version</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-xl p-5 stat-card mb-6">
                <h2 class="font-semibold text-gray-800 mb-3">Departments</h2>
                <div id="qaDepartmentList" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
            </div>
            <div class="bg-white rounded-xl p-5 stat-card">
                <h2 class="font-semibold text-gray-800 mb-3">Recently Approved Documents</h2>
                <div id="qaRecentApproved"></div>
            </div>
            <div id="qaDeptModal" class="hidden fixed inset-0 bg-black/40 z-50 items-center justify-center p-4">
                <div class="bg-white rounded-xl w-full max-w-5xl p-5 max-h-[90vh] overflow-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 id="qaDeptTitle" class="font-semibold text-lg text-gray-800">Department Dashboard</h3>
                        <button id="qaCloseDeptModal" class="text-sm text-gray-500 hover:text-gray-700">Close</button>
                    </div>
                    <div id="qaDeptStats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"></div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead><tr class="border-b text-xs text-gray-500"><th class="text-left py-2">Department Name</th><th class="text-left py-2">Document Name</th><th class="text-left py-2">Category</th><th class="text-left py-2">Area</th><th class="text-left py-2">Status</th><th class="text-left py-2">Version</th></tr></thead>
                            <tbody id="qaDeptTable"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    const departmentFilter = document.getElementById('qaDepartmentFilter');
    const categoryFilter = document.getElementById('qaCategoryFilter');
    const sortBy = document.getElementById('qaSortBy');
    const deptList = document.getElementById('qaDepartmentList');
    const recentApproved = document.getElementById('qaRecentApproved');
    const deptModal = document.getElementById('qaDeptModal');
    const deptTitle = document.getElementById('qaDeptTitle');
    const deptStats = document.getElementById('qaDeptStats');
    const deptTable = document.getElementById('qaDeptTable');

    function fetchDocs(params) {
        const qs = new URLSearchParams(params || {}).toString();
        return fetch(`${API_BASE}/api/documents${qs ? `?${qs}` : ''}`, { headers: { 'x-auth-token': token } }).then((r) => r.json());
    }

    function renderRows(rows) {
        return rows.map((d) => `<tr class="border-b"><td class="py-2">${d.department || '-'}</td><td class="py-2">${d.title || '-'}</td><td class="py-2">${(d.category || '').toUpperCase()}</td><td class="py-2">${d.area || '-'}</td><td class="py-2">${d.workflow_status || '-'}</td><td class="py-2">${d.version || 'v1.0'}</td></tr>`).join('');
    }

    function openDeptModal(department) {
        Promise.all([
            fetch(`${API_BASE}/api/documents/stats?department=${encodeURIComponent(department)}`, { headers: { 'x-auth-token': token } }).then((r) => r.json()),
            fetchDocs({ department, sortBy: sortBy.value || 'date' })
        ]).then(([stats, docs]) => {
            deptTitle.textContent = `${department} Department Dashboard`;
            deptStats.innerHTML = `
                <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">Total Documents</div><div class="text-2xl font-semibold">${stats.total_documents || 0}</div></div>
                <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">Approved Documents</div><div class="text-2xl font-semibold">${stats.approved_documents || 0}</div></div>
                <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">Approval Percentage</div><div class="text-2xl font-semibold">${stats.approval_percentage || 0}%</div></div>
                <div class="bg-gray-50 p-3 rounded"><div class="text-xs text-gray-500">Documents Added This Month</div><div class="text-2xl font-semibold">${stats.documents_added_this_month || 0}</div></div>
            `;
            deptTable.innerHTML = renderRows(Array.isArray(docs) ? docs : []);
            deptModal.classList.remove('hidden');
            deptModal.classList.add('flex');
        });
    }

    function loadDepartments() {
        fetchDocs({ sortBy: sortBy.value || 'date' }).then((docs) => {
            const all = Array.isArray(docs) ? docs : [];
            const departments = [...new Set(all.map((d) => d.department).filter(Boolean))].sort();
            departmentFilter.innerHTML = '<option value="">All</option>' + departments.map((d) => `<option value="${d}">${d}</option>`).join('');
            deptList.innerHTML = departments.map((d) => `<button class="text-left px-3 py-2 border rounded-lg hover:bg-teal-50 dept-btn" data-dept="${d}">${d}</button>`).join('');
        });
    }

    function loadRecentApproved() {
        const params = {};
        if (departmentFilter.value) params.department = departmentFilter.value;
        fetch(`${API_BASE}/api/documents/recent-approved?${new URLSearchParams(params).toString()}`, { headers: { 'x-auth-token': token } })
            .then((r) => r.json())
            .then((docs) => {
                let rows = Array.isArray(docs) ? docs : [];
                if (categoryFilter.value) rows = rows.filter((d) => String(d.category || '').toUpperCase() === categoryFilter.value);
                recentApproved.innerHTML = `
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead><tr class="border-b text-xs text-gray-500"><th class="text-left py-2">Department Name</th><th class="text-left py-2">Document Name</th><th class="text-left py-2">Category</th><th class="text-left py-2">Area</th><th class="text-left py-2">Status</th><th class="text-left py-2">Version</th></tr></thead>
                            <tbody>${renderRows(rows)}</tbody>
                        </table>
                    </div>
                `;
            });
    }

    document.addEventListener('click', (e) => {
        const deptBtn = e.target.closest('.dept-btn');
        if (deptBtn) openDeptModal(deptBtn.getAttribute('data-dept'));
    });
    document.getElementById('qaCloseDeptModal').addEventListener('click', () => {
        deptModal.classList.add('hidden');
        deptModal.classList.remove('flex');
    });
    departmentFilter.addEventListener('change', loadRecentApproved);
    categoryFilter.addEventListener('change', loadRecentApproved);
    sortBy.addEventListener('change', () => { loadDepartments(); loadRecentApproved(); });

    loadDepartments();
    loadRecentApproved();
});
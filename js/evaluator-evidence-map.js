// js/evaluator-evidence-map.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Evidence Map JS loaded');

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        return;
    }

    // Heartbeat
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Load evidence map data from API
    async function loadEvidenceMap() {
        try {
            const response = await fetch('http://127.0.0.1:3000/api/documents/evidence-map', {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const evidenceData = await response.json();
            console.log('Evidence map data:', evidenceData);

            // Update summary cards
            updateSummaryCards(evidenceData);

            // Render department tabs
            renderDepartmentTabs(evidenceData);

        } catch (error) {
            console.error('Error loading evidence map:', error);
        }
    }

    function updateSummaryCards(evidenceData) {
        Object.keys(evidenceData).forEach(categoryName => {
            const category = evidenceData[categoryName];
            const current = category.total_current || 0;
            const expected = category.total_expected || 0;
            const percentage = expected > 0 ? Math.round((current / expected) * 100) : 0;

            // Update count badge
            const countElem = document.getElementById(`${categoryName}Count`);
            if (countElem) countElem.textContent = `${current} docs`;

            // Update uploaded/expected
            const uploadedElem = document.getElementById(`${categoryName}Uploaded`);
            const expectedElem = document.getElementById(`${categoryName}Expected`);
            if (uploadedElem) uploadedElem.textContent = current;
            if (expectedElem) expectedElem.textContent = expected;

            // Update progress bar
            const progressElem = document.getElementById(`${categoryName}Progress`);
            if (progressElem) progressElem.style.width = `${percentage}%`;

            // Update percentage text
            const percentElem = document.getElementById(`${categoryName}Percent`);
            if (percentElem) percentElem.textContent = `${percentage}% complete`;
        });
    }

    function renderDepartmentTabs(evidenceData) {
        Object.keys(evidenceData).forEach(categoryName => {
            const category = evidenceData[categoryName];
            const containerId = `${categoryName}Departments`;
            const container = document.getElementById(containerId);
            
            if (!container) return;

            container.innerHTML = category.departments.map(dept => {
                const percentage = dept.expected > 0 ? Math.round((dept.current / dept.expected) * 100) : 0;
                const statusColor = dept.status === 'complete' ? 'text-green-600' : 'text-amber-600';
                const statusText = dept.status === 'complete' ? 'Complete' : 'Partial';

                return `
                    <div class="evidence-item border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer" data-category="${categoryName}" data-department="${dept.department_code}">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <span class="badge-department px-2 py-1 rounded-full text-xs font-semibold">${dept.department_code}</span>
                                <h4 class="font-medium text-gray-800 mt-2">${dept.department_name}</h4>
                            </div>
                            <div class="text-right">
                                <span class="text-sm font-medium">${dept.current}/${dept.expected} docs</span>
                                <div class="text-xs ${statusColor}">${statusText}</div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="w-full bg-gray-200 h-2 rounded-full">
                                <div class="progress-bar bg-teal-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Attach click handlers
            container.querySelectorAll('.evidence-item').forEach(item => {
                item.addEventListener('click', function() {
                    const category = this.dataset.category;
                    const department = this.dataset.department;
                    const categoryNames = {
                        'instruction': 'Instruction',
                        'research': 'Research',
                        'extension': 'Extension',
                        'employment': 'Employment'
                    };
                    alert(`View-Only Mode\n\nOpening documents for:\n${categoryNames[category]} - ${department}\n\nThis would display the list of documents for this category and department.`);
                });
            });
        });
    }

    // Tab switching
    document.querySelectorAll('#mapTabs a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            document.querySelectorAll('#mapTabs a').forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(tabId + 'Tab').classList.remove('hidden');
        });
    });

    // Load data
    loadEvidenceMap();

    // View-only mode indicator
    console.log('Evidence Map loaded in view-only mode');

    // Block edit actions
    document.addEventListener('click', function(e) {
        if (e.target.closest('button')?.textContent.includes('Edit') ||
            e.target.closest('button')?.textContent.includes('Add') ||
            e.target.closest('button')?.textContent.includes('Delete')) {
            e.preventDefault();
            alert('❌ Edit actions are disabled. You have view-only access.');
        }
    });
});

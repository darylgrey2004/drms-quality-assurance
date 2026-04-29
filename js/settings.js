// js/settings.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page JS loaded successfully');
    
    // ── Heartbeat: Update lastActive status ──
    const token = localStorage.getItem('token');
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 2 * 60 * 1000);
    }
    
    // DOM elements
    const tabLinks = document.querySelectorAll('#settingsTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Departments Management
    let departments = [];
    let currentDeleteDeptId = null;
    
    // Load departments from localStorage or use defaults
    function loadDepartments() {
        const saved = localStorage.getItem('drms_departments');
        if (saved) {
            departments = JSON.parse(saved);
        } else {
            // Default departments
            departments = [
                { id: 1, code: 'BEED', name: 'Bachelor of Elementary Education', description: 'Elementary Education Department', status: 'active', created: '2024-01-01' },
                { id: 2, code: 'BSED', name: 'Bachelor of Secondary Education', description: 'Secondary Education Department', status: 'active', created: '2024-01-01' },
                { id: 3, code: 'BSNED', name: 'Bachelor of Special Needs Education', description: 'Special Needs Education Department', status: 'active', created: '2024-01-01' },
                { id: 4, code: 'BCAED', name: 'Bachelor of Culture and Arts Education', description: 'Culture and Arts Education Department', status: 'active', created: '2024-01-01' },
                { id: 5, code: 'BPED', name: 'Bachelor of Physical Education', description: 'Physical Education Department', status: 'active', created: '2024-01-01' }
            ];
            saveDepartments();
        }
        renderDepartments();
        updateRequirementsContainer();
    }
    
    function saveDepartments() {
        localStorage.setItem('drms_departments', JSON.stringify(departments));
        // Also update department filter dropdowns in other pages
        localStorage.setItem('drms_departments_updated', new Date().toISOString());
    }
    
    function renderDepartments() {
        const tbody = document.getElementById('departmentsTableBody');
        const emptyState = document.getElementById('departmentsEmptyState');
        
        if (!tbody) return;
        
        if (departments.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        
        tbody.innerHTML = departments.map(dept => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-2">
                    <span class="font-mono font-medium text-gray-800">${escapeHtml(dept.code)}</span>
                </td>
                <td class="py-3 px-2 text-gray-600">${escapeHtml(dept.name)}</td>
                <td class="py-3 px-2 text-gray-500 text-xs">${escapeHtml(dept.description || '—')}</td>
                <td class="py-3 px-2">
                    ${dept.status === 'active' 
                        ? '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Active</span>'
                        : '<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Inactive</span>'}
                </td>
                <td class="py-3 px-2 text-gray-400 text-xs">${dept.created || '—'}</td>
                <td class="py-3 px-2">
                    <div class="flex items-center gap-2">
                        <button class="edit-dept-btn action-icon action-edit" data-id="${dept.id}">✏️ Edit</button>
                        <button class="delete-dept-btn action-icon action-delete" data-id="${dept.id}" data-name="${dept.name}">🗑️ Delete</button>
                    </div>
                 </td>
            </tr>
        `).join('');
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-dept-btn').forEach(btn => {
            btn.addEventListener('click', () => editDepartment(parseInt(btn.dataset.id)));
        });
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-dept-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentDeleteDeptId = parseInt(btn.dataset.id);
                const deptName = btn.dataset.name;
                document.getElementById('deleteDeptName').textContent = deptName;
                document.getElementById('deleteDeptModal').classList.remove('hidden');
            });
        });
    }
    
    function editDepartment(id) {
        const dept = departments.find(d => d.id === id);
        if (!dept) return;
        
        document.getElementById('departmentModalTitle').textContent = 'Edit Department';
        document.getElementById('departmentId').value = dept.id;
        document.getElementById('deptCode').value = dept.code;
        document.getElementById('deptName').value = dept.name;
        document.getElementById('deptDescription').value = dept.description || '';
        document.getElementById('deptStatus').value = dept.status;
        document.getElementById('departmentModal').classList.remove('hidden');
    }
    
    function addDepartment() {
        document.getElementById('departmentModalTitle').textContent = 'Add Department';
        document.getElementById('departmentId').value = '';
        document.getElementById('deptCode').value = '';
        document.getElementById('deptName').value = '';
        document.getElementById('deptDescription').value = '';
        document.getElementById('deptStatus').value = 'active';
        document.getElementById('departmentModal').classList.remove('hidden');
    }
    
    function saveDepartmentFromForm() {
        const id = document.getElementById('departmentId').value;
        const code = document.getElementById('deptCode').value.trim().toUpperCase();
        const name = document.getElementById('deptName').value.trim();
        const description = document.getElementById('deptDescription').value.trim();
        const status = document.getElementById('deptStatus').value;
        
        if (!code || !name) {
            alert('Please fill in Department Code and Name');
            return;
        }
        
        if (code.length > 10) {
            alert('Department code must be 10 characters or less');
            return;
        }
        
        // Check for duplicate code
        const existingDept = departments.find(d => d.code === code && (id === '' || d.id !== parseInt(id)));
        if (existingDept) {
            alert(`Department code "${code}" already exists. Please use a unique code.`);
            return;
        }
        
        if (id) {
            // Update existing
            const index = departments.findIndex(d => d.id === parseInt(id));
            if (index !== -1) {
                departments[index] = {
                    ...departments[index],
                    code,
                    name,
                    description,
                    status,
                    updated: new Date().toISOString().split('T')[0]
                };
            }
        } else {
            // Add new
            const newId = Math.max(...departments.map(d => d.id), 0) + 1;
            departments.push({
                id: newId,
                code,
                name,
                description,
                status,
                created: new Date().toISOString().split('T')[0]
            });
        }
        
        saveDepartments();
        renderDepartments();
        updateRequirementsContainer();
        closeDepartmentModal();
        alert('Department saved successfully!');
    }
    
    function deleteDepartment() {
        if (currentDeleteDeptId) {
            departments = departments.filter(d => d.id !== currentDeleteDeptId);
            saveDepartments();
            renderDepartments();
            updateRequirementsContainer();
            closeDeleteModal();
            alert('Department deleted successfully!');
            currentDeleteDeptId = null;
        }
    }
    
    function closeDepartmentModal() {
        document.getElementById('departmentModal').classList.add('hidden');
        document.getElementById('departmentForm').reset();
    }
    
    function closeDeleteModal() {
        document.getElementById('deleteDeptModal').classList.add('hidden');
        currentDeleteDeptId = null;
    }
    
    // Update requirements container based on departments
    function updateRequirementsContainer() {
        const container = document.getElementById('requirementsContainer');
        if (!container) return;
        
        const categories = [
            { id: 'instruction', name: 'Instruction', color: 'blue' },
            { id: 'research', name: 'Research', color: 'green' },
            { id: 'extension', name: 'Extension', color: 'amber' },
            { id: 'employment', name: 'Employment', color: 'purple' }
        ];
        
        // Load saved requirements
        const savedRequirements = localStorage.getItem('documentRequirements');
        let requirements = {};
        if (savedRequirements) {
            requirements = JSON.parse(savedRequirements);
        }
        
        container.innerHTML = categories.map(cat => `
            <div class="border rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800 text-base">${cat.name}</h3>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500">Total Expected:</span>
                        <span id="${cat.id}Total" class="font-bold text-${cat.color}-700 text-lg">0</span>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${departments.filter(d => d.status === 'active').map(dept => `
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">${dept.code}</label>
                            <input type="number" id="${cat.id}_${dept.code.toLowerCase()}" 
                                   class="expected-docs w-full px-3 py-2 border border-gray-200 rounded-lg" 
                                   value="${requirements[cat.id]?.[dept.code] || getDefaultValue(cat.id, dept.code)}" 
                                   min="0" step="1">
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        // Add event listeners to calculate totals
        document.querySelectorAll('.expected-docs').forEach(input => {
            input.addEventListener('input', () => updateRequirementsTotals(categories));
        });
        
        updateRequirementsTotals(categories);
    }
    
    function getDefaultValue(category, deptCode) {
        const defaults = {
            instruction: { BEED: 45, BSED: 65, BSNED: 40, BCAED: 35, BPED: 30 },
            research: { BEED: 40, BSED: 55, BSNED: 35, BCAED: 30, BPED: 25 },
            extension: { BEED: 25, BSED: 25, BSNED: 25, BCAED: 25, BPED: 25 },
            employment: { BEED: 30, BSED: 30, BSNED: 30, BCAED: 30, BPED: 30 }
        };
        return defaults[category]?.[deptCode] || 25;
    }
    
    function updateRequirementsTotals(categories) {
        categories.forEach(cat => {
            let total = 0;
            departments.filter(d => d.status === 'active').forEach(dept => {
                const input = document.getElementById(`${cat.id}_${dept.code.toLowerCase()}`);
                if (input) {
                    total += parseInt(input.value) || 0;
                }
            });
            const totalSpan = document.getElementById(`${cat.id}Total`);
            if (totalSpan) totalSpan.textContent = total;
        });
    }
    
    function saveRequirements() {
        const categories = ['instruction', 'research', 'extension', 'employment'];
        const requirements = {};
        
        categories.forEach(cat => {
            requirements[cat] = {};
            departments.filter(d => d.status === 'active').forEach(dept => {
                const input = document.getElementById(`${cat}_${dept.code.toLowerCase()}`);
                if (input) {
                    requirements[cat][dept.code] = parseInt(input.value) || 0;
                }
            });
        });
        
        localStorage.setItem('documentRequirements', JSON.stringify(requirements));
        alert('Document requirements saved successfully!\n\nThese targets will now determine completeness percentages.');
    }
    
    function resetRequirements() {
        if (confirm('Reset all document requirements to default values?')) {
            const categories = ['instruction', 'research', 'extension', 'employment'];
            categories.forEach(cat => {
                departments.filter(d => d.status === 'active').forEach(dept => {
                    const input = document.getElementById(`${cat}_${dept.code.toLowerCase()}`);
                    if (input) {
                        input.value = getDefaultValue(cat, dept.code);
                    }
                });
            });
            updateRequirementsTotals([
                { id: 'instruction' }, { id: 'research' }, 
                { id: 'extension' }, { id: 'employment' }
            ]);
            alert('Requirements reset to default values.');
        }
    }
    
    // Tab switching functionality
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });
            
            const activeTab = document.getElementById(tabId + 'Tab');
            if (activeTab) {
                activeTab.classList.remove('hidden');
                activeTab.classList.add('block');
            }
            
            // Refresh departments tab when opened
            if (tabId === 'departments') {
                renderDepartments();
            }
            if (tabId === 'requirements') {
                updateRequirementsContainer();
            }
        });
    });
    
    // Initialize departments and requirements
    loadDepartments();
    
    // Modal event listeners
    const addDepartmentBtn = document.getElementById('addDepartmentBtn');
    const closeDepartmentModalBtn = document.getElementById('closeDepartmentModalBtn');
    const cancelDepartmentBtn = document.getElementById('cancelDepartmentBtn');
    const departmentForm = document.getElementById('departmentForm');
    const confirmDeleteDeptBtn = document.getElementById('confirmDeleteDeptBtn');
    const cancelDeleteDeptBtn = document.getElementById('cancelDeleteDeptBtn');
    
    if (addDepartmentBtn) addDepartmentBtn.addEventListener('click', addDepartment);
    if (closeDepartmentModalBtn) closeDepartmentModalBtn.addEventListener('click', closeDepartmentModal);
    if (cancelDepartmentBtn) cancelDepartmentBtn.addEventListener('click', closeDepartmentModal);
    if (departmentForm) departmentForm.addEventListener('submit', (e) => { e.preventDefault(); saveDepartmentFromForm(); });
    if (confirmDeleteDeptBtn) confirmDeleteDeptBtn.addEventListener('click', deleteDepartment);
    if (cancelDeleteDeptBtn) cancelDeleteDeptBtn.addEventListener('click', closeDeleteModal);
    
    // Save Requirements button
    const saveRequirementsBtn = document.getElementById('saveRequirements');
    const resetRequirementsBtn = document.getElementById('resetRequirements');
    if (saveRequirementsBtn) saveRequirementsBtn.addEventListener('click', saveRequirements);
    if (resetRequirementsBtn) resetRequirementsBtn.addEventListener('click', resetRequirements);
    
    // Other save buttons
    const saveGeneral = document.getElementById('saveGeneral');
    const saveWorkflow = document.getElementById('saveWorkflow');
    const saveStandards = document.getElementById('saveStandards');
    const saveNotifications = document.getElementById('saveNotifications');
    const saveBackup = document.getElementById('saveBackup');
    const saveApi = document.getElementById('saveApi');
    const backupNowBtn = document.getElementById('backupNowBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const regenerateApiKey = document.getElementById('regenerateApiKey');
    const addWebhookBtn = document.getElementById('addWebhookBtn');
    
    if (saveGeneral) saveGeneral.addEventListener('click', () => alert('General settings saved successfully!'));
    if (saveWorkflow) saveWorkflow.addEventListener('click', () => alert('Workflow settings saved successfully!'));
    if (saveStandards) saveStandards.addEventListener('click', () => alert('Standards configuration saved successfully!'));
    if (saveNotifications) saveNotifications.addEventListener('click', () => alert('Notification settings saved successfully!'));
    if (saveBackup) saveBackup.addEventListener('click', () => alert('Backup settings saved successfully!'));
    if (saveApi) saveApi.addEventListener('click', () => alert('API settings saved successfully!'));
    
    if (backupNowBtn) {
        backupNowBtn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = 'Creating backup...';
            this.disabled = true;
            setTimeout(() => {
                alert('Backup created successfully!');
                this.innerHTML = originalText;
                this.disabled = false;
            }, 2000);
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'landing.html';
        });
    }
    
    if (regenerateApiKey) {
        regenerateApiKey.addEventListener('click', () => {
            if (confirm('Regenerate API key? This will invalidate existing keys.')) {
                alert('New API key generated: ' + Math.random().toString(36).substring(2, 15));
            }
        });
    }
    
    if (addWebhookBtn) {
        addWebhookBtn.addEventListener('click', () => {
            const url = document.getElementById('webhookUrl')?.value;
            if (url) {
                alert(`Webhook added: ${url}`);
                document.getElementById('webhookUrl').value = '';
            } else {
                alert('Please enter a webhook URL');
            }
        });
    }
    
    // Cancel buttons
    document.querySelectorAll('.border.border-gray-300.rounded-lg.text-gray-700').forEach(btn => {
        if (btn.textContent === 'Cancel') {
            btn.addEventListener('click', () => alert('Changes discarded.'));
        }
    });
    
    // Helper function
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    // Sidebar active state
    const currentPath = window.location.pathname.split('/').pop() || 'settings.html';
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            });
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
        }
    });
});
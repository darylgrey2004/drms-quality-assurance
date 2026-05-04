// js/evidence-map.js

const API_BASE = 'http://localhost:3000';
let allDocuments = [];
let departments = ['BEED', 'BSED', 'BSNED', 'BCAED', 'BPED'];
let categories = [
    { id: 'instruction', name: 'Instruction', color: 'blue', expectedCount: 0 },
    { id: 'research', name: 'Research', color: 'green', expectedCount: 0 },
    { id: 'extension', name: 'Extension', color: 'amber', expectedCount: 0 },
    { id: 'employment', name: 'Employment', color: 'purple', expectedCount: 0 }
];

// Department expected document counts (will be loaded from API)
let departmentExpected = {
    'BEED': { instruction: 0, research: 0, extension: 0, employment: 0 },
    'BSED': { instruction: 0, research: 0, extension: 0, employment: 0 },
    'BSNED': { instruction: 0, research: 0, extension: 0, employment: 0 },
    'BCAED': { instruction: 0, research: 0, extension: 0, employment: 0 },
    'BPED': { instruction: 0, research: 0, extension: 0, employment: 0 }
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Evidence Map page loaded');
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }
    
    // Update user info in sidebar
    updateUserInfo();
    
    // Load requirements from API first, then load documents
    loadRequirements().then(() => {
        loadDocuments();
    });
    
    // Setup event listeners
    setupEventListeners();
    
    // Heartbeat
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);
});

function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInitials = document.getElementById('userInitials');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    if (user.firstName && user.lastName) {
        const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
        if (userInitials) userInitials.textContent = initials;
        if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
    }
    
    if (user.role && userRole) {
        const roleMap = {
            'admin': 'Administrator',
            'dean': 'Dean',
            'faculty': 'Faculty Member',
            'area-chair': 'Dept. Head',
            'department-head': 'Dept. Head',
            'evaluator': 'External Evaluator'
        };
        userRole.textContent = roleMap[user.role] || user.role;
    }
}

async function loadRequirements() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE}/api/settings/requirements`, {
            headers: { 'x-auth-token': token }
        });
        
        if (!response.ok) {
            console.warn('Failed to load requirements, using defaults');
            return;
        }
        
        const requirements = await response.json();
        
        // Update departmentExpected with values from database
        departments.forEach(dept => {
            const deptLower = dept.toLowerCase();
            categories.forEach(cat => {
                if (requirements[cat.id] && requirements[cat.id][deptLower] !== undefined) {
                    departmentExpected[dept][cat.id] = requirements[cat.id][deptLower];
                }
            });
        });
        
        // Calculate total expected counts per category
        categories.forEach(cat => {
            let total = 0;
            departments.forEach(dept => {
                total += departmentExpected[dept][cat.id] || 0;
            });
            cat.expectedCount = total;
        });
        
        console.log('Requirements loaded from database:', departmentExpected);
        
    } catch (error) {
        console.error('Error loading requirements:', error);
    }
}

async function loadDocuments() {
    const token = localStorage.getItem('token');
    const loadingMap = document.getElementById('loadingMap');
    
    if (loadingMap) loadingMap.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/api/documents?scope=all`, {
            headers: { 'x-auth-token': token }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        
        allDocuments = await response.json();
        
        // Process and display evidence map
        processEvidenceMap();
        
    } catch (error) {
        console.error('Error loading documents:', error);
        showError('Failed to load evidence map data. Please try again.');
    } finally {
        if (loadingMap) loadingMap.classList.add('hidden');
    }
}

function processEvidenceMap() {
    // Calculate counts per category and department
    const counts = {};
    
    categories.forEach(cat => {
        counts[cat.id] = {};
        departments.forEach(dept => {
            counts[cat.id][dept] = 0;
        });
    });
    
    // Count documents
    allDocuments.forEach(doc => {
        const category = doc.category || getCategoryFromId(doc.category_id);
        const department = doc.department_code || doc.area;
        
        if (category && counts[category] && department && counts[category][department.toUpperCase()] !== undefined) {
            counts[category][department.toUpperCase()]++;
        }
    });
    
    // Update category overview cards
    updateCategoryOverview(counts);
    
    // Update each category tab
    categories.forEach(cat => {
        updateCategoryTab(cat.id, cat.name, counts[cat.id]);
    });
    
    // Update mapping summary
    updateMappingSummary(counts);
}

function getCategoryFromId(categoryId) {
    const categoryMap = {
        1: 'instruction',
        2: 'research',
        3: 'extension',
        4: 'employment'
    };
    return categoryMap[categoryId];
}

function updateCategoryOverview(counts) {
    const container = document.getElementById('categoryOverview');
    if (!container) return;
    
    container.innerHTML = categories.map(cat => {
        const totalDocs = Object.values(counts[cat.id]).reduce((a, b) => a + b, 0);
        const percentage = (totalDocs / cat.expectedCount * 100).toFixed(1);
        const color = cat.color;
        
        return `
            <div class="bg-white rounded-xl p-5 stat-card">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-gray-800 text-base">${cat.name}</h3>
                    <span class="badge-${cat.id} text-xs font-medium px-2.5 py-0.5 rounded-full">${totalDocs} docs</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Documents mapped:</span>
                    <span class="font-medium">${totalDocs}/${cat.expectedCount}</span>
                </div>
                <div class="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                    <div class="bg-${color}-600 h-1.5 rounded-full progress-bar" style="width:${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="mt-2 text-xs text-${color}-700">${percentage}% complete · ${cat.expectedCount - totalDocs} missing</div>
            </div>
        `;
    }).join('');
}

function updateCategoryTab(categoryId, categoryName, counts) {
    const container = document.getElementById(`${categoryId}Departments`);
    const totalCountSpan = document.getElementById(`${categoryId}TotalCount`);
    
    if (!container) return;
    
    const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);
    if (totalCountSpan) totalCountSpan.textContent = totalDocs;
    
    container.innerHTML = departments.map(dept => {
        const docCount = counts[dept] || 0;
        const expected = departmentExpected[dept]?.[categoryId] || 25;
        const percentage = (docCount / expected * 100).toFixed(1);
        const status = docCount >= expected ? 'complete' : 'partial';
        const statusText = docCount >= expected ? 'Complete' : 'Partial';
        const statusClass = docCount >= expected ? 'badge-status-complete' : 'badge-status-partial';
        
        return `
            <div class="border rounded-lg p-4 clause-item" data-status="${status}">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="dept-badge">${dept}</span>
                            <h4 class="font-medium text-gray-800">${getDepartmentFullName(dept)}</h4>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">${categoryName} documents and materials for ${dept} department</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-4">
                        <div class="text-right">
                            <span class="text-sm font-medium">${docCount}</span>
                            <span class="text-xs text-gray-400">/${expected} docs</span>
                        </div>
                        <span class="${statusClass} text-xs font-medium px-2.5 py-1 rounded-full">${statusText}</span>
                        <button class="view-clause-btn text-teal-700 hover:text-teal-800 border border-teal-200 hover:border-teal-400 px-3 py-1 rounded text-xs transition" 
                                data-category="${categoryId}" data-department="${dept}">
                            View Documents
                        </button>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="w-full bg-gray-200 h-1.5 rounded-full">
                        <div class="bg-teal-600 h-1.5 rounded-full progress-bar" style="width:${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-clause-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            const department = this.dataset.department;
            showDocumentsForCategoryAndDepartment(category, department);
        });
    });
}

function getDepartmentFullName(deptCode) {
    const deptNames = {
        'BEED': 'Bachelor of Elementary Education',
        'BSED': 'Bachelor of Secondary Education',
        'BSNED': 'Bachelor of Special Needs Education',
        'BCAED': 'Bachelor of Culture and Arts Education',
        'BPED': 'Bachelor of Physical Education'
    };
    return deptNames[deptCode] || deptCode;
}

function updateMappingSummary(counts) {
    const container = document.getElementById('mappingSummary');
    if (!container) return;
    
    // Calculate overall completion
    let totalDocs = 0;
    let totalExpected = 0;
    
    categories.forEach(cat => {
        totalDocs += Object.values(counts[cat.id]).reduce((a, b) => a + b, 0);
        totalExpected += cat.expectedCount;
    });
    
    const overallPercentage = (totalDocs / totalExpected * 100).toFixed(1);
    
    // Calculate fully vs partially mapped departments
    let fullyMapped = 0;
    let partiallyMapped = 0;
    
    departments.forEach(dept => {
        let deptTotal = 0;
        let deptExpected = 0;
        
        categories.forEach(cat => {
            deptTotal += counts[cat.id][dept] || 0;
            deptExpected += departmentExpected[dept]?.[cat.id] || 25;
        });
        
        if (deptTotal >= deptExpected) {
            fullyMapped++;
        } else {
            partiallyMapped++;
        }
    });
    
    container.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between"><span class="text-sm">Total Categories:</span><span class="font-medium">${categories.length}</span></div>
            <div class="flex justify-between"><span class="text-sm">Total Departments:</span><span class="font-medium">${departments.length}</span></div>
            <div class="flex justify-between"><span class="text-sm">Fully Mapped:</span><span class="font-medium text-green-700">${fullyMapped} (${Math.round(fullyMapped/departments.length*100)}%)</span></div>
            <div class="flex justify-between"><span class="text-sm">Partially Mapped:</span><span class="font-medium text-yellow-700">${partiallyMapped} (${Math.round(partiallyMapped/departments.length*100)}%)</span></div>
            <div class="pt-2 mt-2 border-t">
                <div class="w-full bg-gray-200 h-2 rounded-full">
                    <div class="bg-teal-600 h-2 rounded-full progress-bar" style="width:${overallPercentage}%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-2">Overall mapping completion: <span class="font-medium">${overallPercentage}%</span></p>
            </div>
        </div>
    `;
}

function showDocumentsForCategoryAndDepartment(category, department) {
    const filteredDocs = allDocuments.filter(doc => {
        const docCategory = doc.category || getCategoryFromId(doc.category_id);
        const docDepartment = doc.department_code || doc.area;
        return docCategory === category && docDepartment?.toUpperCase() === department.toUpperCase();
    });
    
    if (filteredDocs.length === 0) {
        alert(`No documents found for ${category.toUpperCase()} - ${department}`);
        return;
    }
    
    // Create a modal or redirect to documents page with filters
    const categoryName = categories.find(c => c.id === category)?.name || category;
    const deptName = getDepartmentFullName(department);
    
    // Store filter in localStorage and redirect to documents page
    localStorage.setItem('evidenceMapFilters', JSON.stringify({
        category: category,
        department: department.toLowerCase(),
        message: `Showing ${filteredDocs.length} documents for ${categoryName} - ${deptName}`
    }));
    
    window.location.href = `documents.html?category=${category}&department=${department.toLowerCase()}`;
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setupEventListeners() {
    // Tab switching
    const tabLinks = document.querySelectorAll('#mapTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            
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
            
            // Update filter dropdown to match tab
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) categoryFilter.value = tabId;
        });
    });
    
    // Category filter dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const value = this.value;
            if (value === 'all') return;
            
            const tabLink = document.querySelector(`#mapTabs a[data-tab="${value}"]`);
            if (tabLink) tabLink.click();
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const status = this.value;
            const items = document.querySelectorAll('.clause-item');
            
            items.forEach(item => {
                if (status === 'all') {
                    item.classList.remove('hidden');
                } else if (status === 'complete') {
                    item.classList.toggle('hidden', item.dataset.status !== 'complete');
                } else if (status === 'partial') {
                    item.classList.toggle('hidden', item.dataset.status !== 'partial');
                }
            });
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchMap');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const items = document.querySelectorAll('.clause-item');
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (searchTerm === '' || text.includes(searchTerm)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshMap');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDocuments();
        });
    }
    
    // Document details modal
    setupDetailsModal();
    
    // Mobile sidebar
    setupMobileSidebar();
}

function setupDetailsModal() {
    const modal = document.getElementById('docDetailsModal');
    const closeBtn = document.getElementById('docDetailsCloseBtn');
    const closeBtn2 = document.getElementById('docDetailsCloseBtn2');
    
    if (closeBtn) closeBtn.addEventListener('click', closeDetailsModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeDetailsModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDetailsModal();
        });
    }
}

function openDetailsModal(doc) {
    const modal = document.getElementById('docDetailsModal');
    const title = document.getElementById('docDetailsTitle');
    const content = document.getElementById('docDetailsContent');
    
    if (!modal || !content) return;
    
    if (title) title.textContent = `Document Details: ${doc.title || 'Untitled'}`;
    
    // Format keywords as badges
    let keywordsHtml = '';
    if (doc.keywords) {
        const keywords = doc.keywords.split(',').map(k => k.trim());
        keywordsHtml = `
            <div class="flex flex-wrap gap-2 mt-2">
                ${keywords.map(k => `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">${escapeHtml(k)}</span>`).join('')}
            </div>
        `;
    } else {
        keywordsHtml = '<p class="text-gray-400 text-sm italic">No keywords provided</p>';
    }
    
    const date = formatDate(doc.created_at);
    const uploader = doc.author_name || (doc.uploader_firstName && doc.uploader_lastName 
        ? `${doc.uploader_firstName} ${doc.uploader_lastName}` 
        : 'Unknown');
    
    content.innerHTML = `
        <div class="border-b pb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Document Information</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <span class="text-gray-500">Title:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.title || 'Untitled')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Version:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.version || 'v1.0')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Category:</span>
                    <p class="font-medium text-gray-800 mt-1">${getCategoryDisplayName(doc.category)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Department:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.department_code || doc.area || 'N/A')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Status:</span>
                    <p class="font-medium mt-1">${getStatusDisplayName(doc.workflow_status)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Uploaded by:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(uploader)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Uploaded on:</span>
                    <p class="font-medium text-gray-800 mt-1">${date}</p>
                </div>
            </div>
        </div>
        
        <div class="border-b pb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Description / Notes</h4>
            <div class="bg-gray-50 rounded-lg p-4">
                ${doc.description ? `<p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(doc.description)}</p>` : '<p class="text-gray-400 text-sm italic">No description provided</p>'}
            </div>
        </div>
        
        <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Keywords</h4>
            ${keywordsHtml}
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeDetailsModal() {
    const modal = document.getElementById('docDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function getCategoryDisplayName(category) {
    const categoryMap = {
        'instruction': 'Instruction',
        'research': 'Research',
        'extension': 'Extension',
        'employment': 'Employment'
    };
    return categoryMap[category] || category || 'Other';
}

function getStatusDisplayName(status) {
    const statusMap = {
        'approved': 'Approved',
        'pending': 'Pending',
        'pending_validation': 'Pending Validation',
        'validated': 'Validated',
        'pending_approval': 'Pending Approval',
        'draft': 'Draft',
        'rejected': 'Rejected',
        'locked': 'Locked'
    };
    return statusMap[status] || status || 'Unknown';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function setupMobileSidebar() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('mainSidebar');
    
    if (!menuToggle || !sidebar) return;
    
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }
    
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
    }
    
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    
    overlay.addEventListener('click', closeSidebar);
    
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeSidebar();
    });
}
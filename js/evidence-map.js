// js/evidence-map.js

const API_BASE = window.API_CONFIG?.API_BASE || 'http://localhost:3000';
let allDocuments = [];
let allStandards = [];
let departments = ['BEED', 'BSED', 'BSNED', 'BCAED', 'BPED'];
let categories = [
    { id: 'instruction', name: 'Instruction', color: 'blue', expectedCount: 0 },
    { id: 'research', name: 'Research', color: 'green', expectedCount: 0 },
    { id: 'extension', name: 'Extension', color: 'amber', expectedCount: 0 },
    { id: 'employment', name: 'Employment', color: 'purple', expectedCount: 0 }
];

// Department expected document counts
let departmentExpected = {
    'BEED': { instruction: 0, research: 0, extension: 0, employment: 0 },
    'BSED': { instruction: 0, research: 0, extension: 0, employment: 0 },
    'BSNED': { instruction: 0, research: 0, extension: 0, employment: 0 },
    'BCAED': { instruction: 0, research: 0, extension: 0, employment: 0 },
    'BPED': { instruction: 0, research: 0, extension: 0, employment: 0 }
};

// Define default standards for each category (will be replaced by API data)
let standardsByCategory = {
    instruction: [],
    research: [],
    extension: [],
    employment: []
};

// Track expanded departments
let expandedDepartments = {};

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
    
    // Load standards first, then requirements, then documents
    loadStandards().then(() => {
        return loadRequirements();
    }).then(() => {
        return loadDocuments();
    }).catch(error => {
        console.error('Error loading data:', error);
        loadDocuments(); // Still try to load documents
    });
    
    // Setup event listeners using event delegation
    setupEventListeners();
    
    // Heartbeat
    function sendHeartbeat() {
        fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/heartbeat`, {
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

async function loadStandards() {
    const token = localStorage.getItem('token');
    
    try {
        // Load all standards (including inactive ones for admin view)
        const response = await fetch(`${API_BASE}/api/admin/standards/all`, {
            headers: { 'x-auth-token': token }
        });
        
        if (!response.ok) {
            console.warn('Failed to load standards, using defaults');
            setDefaultStandards();
            return;
        }
        
        allStandards = await response.json();
        
        // Group standards by category
        standardsByCategory = {
            instruction: [],
            research: [],
            extension: [],
            employment: []
        };
        
        allStandards.forEach(standard => {
            const categoryName = (standard.category_name || '').toLowerCase();
            if (standardsByCategory[categoryName]) {
                standardsByCategory[categoryName].push(standard);
            }
        });
        
        console.log('Standards loaded:', standardsByCategory);
        
    } catch (error) {
        console.error('Error loading standards:', error);
        setDefaultStandards();
    }
}

function setDefaultStandards() {
    standardsByCategory = {
        instruction: [
            { id: 1, name: 'Curriculum Development', code: 'INST-CURDEV', is_active: true },
            { id: 2, name: 'Teaching Materials', code: 'INST-TEACHMAT', is_active: true },
            { id: 3, name: 'Assessment Tools', code: 'INST-ASSESS', is_active: true },
            { id: 4, name: 'Learning Modules', code: 'INST-LEARNMOD', is_active: true },
            { id: 5, name: 'Syllabi', code: 'INST-SYLLABI', is_active: true },
            { id: 6, name: 'Lesson Plans', code: 'INST-LESSON', is_active: true }
        ],
        research: [
            { id: 7, name: 'Publications', code: 'RES-PUB', is_active: true },
            { id: 8, name: 'Research Proposals', code: 'RES-PROP', is_active: true },
            { id: 9, name: 'Ethics Clearance', code: 'RES-ETHICS', is_active: true },
            { id: 10, name: 'Research Outputs', code: 'RES-OUTPUT', is_active: true },
            { id: 11, name: 'Grants and Funding', code: 'RES-GRANTS', is_active: false },
            { id: 12, name: 'Conference Presentations', code: 'RES-CONF', is_active: false }
        ],
        extension: [
            { id: 13, name: 'Community Programs', code: 'EXT-COMM', is_active: true },
            { id: 14, name: 'Outreach Documentation', code: 'EXT-OUTREACH', is_active: true },
            { id: 15, name: 'Impact Assessment', code: 'EXT-IMPACT', is_active: true },
            { id: 16, name: 'Partnership Agreements', code: 'EXT-PARTNER', is_active: false },
            { id: 17, name: 'Beneficiary Feedback', code: 'EXT-FEEDBACK', is_active: false }
        ],
        employment: [
            { id: 18, name: 'Employment Contracts', code: 'EMP-CONTRACT', is_active: true },
            { id: 19, name: 'Personnel Records', code: 'EMP-RECORDS', is_active: true },
            { id: 20, name: 'Benefits Documentation', code: 'EMP-BENEFITS', is_active: true },
            { id: 21, name: 'Performance Reviews', code: 'EMP-PERFORM', is_active: false }
        ]
    };
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
                } else {
                    // Set default values if not found
                    const defaultValues = {
                        instruction: 45,
                        research: 40,
                        extension: 25,
                        employment: 30
                    };
                    departmentExpected[dept][cat.id] = defaultValues[cat.id] || 25;
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
    // Track which standards are covered by each document
    const standardCoverage = {};
    
    categories.forEach(cat => {
        counts[cat.id] = {};
        standardCoverage[cat.id] = {};
        departments.forEach(dept => {
            counts[cat.id][dept] = 0;
            standardCoverage[cat.id][dept] = {};
            // Initialize standard coverage for this category and department
            if (standardsByCategory[cat.id]) {
                standardsByCategory[cat.id].forEach(standard => {
                    standardCoverage[cat.id][dept][standard.id] = false;
                });
            }
        });
    });
    
    // Count documents and check standard coverage
    allDocuments.forEach(doc => {
        const category = doc.category || getCategoryFromId(doc.category_id);
        const department = doc.department_code || doc.area;
        
        // ONLY count approved or locked documents
        const isApproved = doc.workflow_status === 'approved' || doc.workflow_status === 'locked';
        
        if (isApproved && category && counts[category] && department && counts[category][department.toUpperCase()] !== undefined) {
            counts[category][department.toUpperCase()]++;
            
            // Check if document has standards array (from document_standards join)
            if (isApproved && Array.isArray(doc.standards) && doc.standards.length > 0) {
                doc.standards.forEach(standard => {
                    const standardId = standard.id || standard.standard_id;
                    if (standardId && standardCoverage[category] && standardCoverage[category][department.toUpperCase()]) {
                        standardCoverage[category][department.toUpperCase()][standardId] = true;
                    }
                });
            }
        }
    });
    
    // Update category overview cards
    updateCategoryOverview(counts);
    
    // Update each category tab with standards
    categories.forEach(cat => {
        updateCategoryTab(cat.id, cat.name, counts[cat.id], standardCoverage[cat.id]);
    });
    
    // Update mapping summary
    updateMappingSummary(counts, standardCoverage);
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
        const percentage = cat.expectedCount > 0 ? (totalDocs / cat.expectedCount * 100).toFixed(1) : 0;
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

function updateCategoryTab(categoryId, categoryName, counts, standardCoverage) {
    const container = document.getElementById(`${categoryId}Departments`);
    const totalCountSpan = document.getElementById(`${categoryId}TotalCount`);
    
    if (!container) return;
    
    const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);
    if (totalCountSpan) totalCountSpan.textContent = totalDocs;
    
    const standards = standardsByCategory[categoryId] || [];
    const activeStandards = standards.filter(s => s.is_active !== false);
    
    container.innerHTML = departments.map(dept => {
        const docCount = counts[dept] || 0;
        const expected = departmentExpected[dept]?.[categoryId] || 25;
        const percentage = expected > 0 ? (docCount / expected * 100).toFixed(1) : 0;
        const status = docCount >= expected ? 'complete' : 'partial';
        const statusText = docCount >= expected ? 'Complete' : 'Partial';
        const statusClass = docCount >= expected ? 'badge-status-complete' : 'badge-status-partial';
        
        // Calculate standards completion for this department
        const deptStandardCoverage = standardCoverage[dept] || {};
        let standardsCompleted = 0;
        const standardsStatus = activeStandards.map(standard => {
            const isCovered = deptStandardCoverage[standard.id] === true;
            if (isCovered) standardsCompleted++;
            return {
                ...standard,
                isCovered: isCovered
            };
        });
        
        const standardsPercentage = activeStandards.length > 0 ? (standardsCompleted / activeStandards.length * 100).toFixed(0) : 0;
        const isExpanded = expandedDepartments[`${categoryId}_${dept}`] || false;
        
        // Generate unique IDs for this department's standards section
        const standardsSectionId = `standards-${categoryId}-${dept.replace(/\s/g, '')}`;
        const expandBtnId = `expand-btn-${categoryId}-${dept.replace(/\s/g, '')}`;
        
        return `
            <div class="border rounded-lg p-4 department-card" data-status="${status}" data-dept="${dept}" data-category="${categoryId}" id="dept-card-${categoryId}-${dept}">
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
                        <button class="expand-btn text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-2 py-1 rounded text-xs transition" 
                                id="${expandBtnId}"
                                data-category="${categoryId}" data-department="${dept}" data-target="${standardsSectionId}">
                            <svg class="w-4 h-4 inline-block transition-transform ${isExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                            Standards
                        </button>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="w-full bg-gray-200 h-1.5 rounded-full">
                        <div class="bg-teal-600 h-1.5 rounded-full progress-bar" style="width:${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
                
                <!-- Standards Section - Expandable -->
                <div class="standards-section mt-3 pt-3 ${isExpanded ? '' : 'hidden'}" id="${standardsSectionId}">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-semibold text-gray-600">Accreditation Standards</span>
                        <span class="text-xs text-gray-500">${standardsCompleted}/${activeStandards.length} standards met (${standardsPercentage}%)</span>
                    </div>
                    <div class="standards-grid">
                        ${standardsStatus.map(standard => `
                            <div class="standard-item">
                                <span class="standard-name" title="${standard.code}">${escapeHtml(standard.name)}</span>
                                <span class="standard-status ${standard.isCovered ? 'standard-complete' : 'standard-missing'} px-2 py-0.5 rounded-full text-xs">
                                    ${standard.isCovered ? 'Covered' : 'Missing'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-2 text-right">
                        <button class="text-xs text-teal-600 hover:text-teal-700 view-standards-btn" 
                                data-category="${categoryId}" data-department="${dept}" data-category-name="${categoryName}">
                            View all standards details →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Refresh event listeners for the newly created buttons
    refreshEventListeners();
}

function refreshEventListeners() {
    // View document buttons
    document.querySelectorAll('.view-clause-btn').forEach(btn => {
        btn.removeEventListener('click', handleViewDocuments);
        btn.addEventListener('click', handleViewDocuments);
    });
    
    // Expand/Collapse buttons
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.removeEventListener('click', handleExpandCollapse);
        btn.addEventListener('click', handleExpandCollapse);
    });
    
    // View standards details buttons
    document.querySelectorAll('.view-standards-btn').forEach(btn => {
        btn.removeEventListener('click', handleViewStandards);
        btn.addEventListener('click', handleViewStandards);
    });
}

function handleViewDocuments(e) {
    const btn = e.currentTarget;
    const category = btn.dataset.category;
    const department = btn.dataset.department;
    showDocumentsForCategoryAndDepartment(category, department);
}

function handleExpandCollapse(e) {
    const btn = e.currentTarget;
    const targetId = btn.dataset.target;
    const standardsDiv = document.getElementById(targetId);
    const svg = btn.querySelector('svg');
    
    if (standardsDiv) {
        standardsDiv.classList.toggle('hidden');
        if (svg) {
            svg.classList.toggle('rotate-180');
        }
        // Store expanded state
        const category = btn.dataset.category;
        const department = btn.dataset.department;
        expandedDepartments[`${category}_${department}`] = !standardsDiv.classList.contains('hidden');
    }
}

function handleViewStandards(e) {
    const btn = e.currentTarget;
    const category = btn.dataset.category;
    const department = btn.dataset.department;
    const categoryName = btn.dataset.categoryName;
    showStandardsDetails(category, department, categoryName);
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

function updateMappingSummary(counts, standardCoverage) {
    const container = document.getElementById('mappingSummary');
    if (!container) return;
    
    // Calculate overall completion
    let totalDocs = 0;
    let totalExpected = 0;
    
    categories.forEach(cat => {
        totalDocs += Object.values(counts[cat.id]).reduce((a, b) => a + b, 0);
        totalExpected += cat.expectedCount;
    });
    
    const overallPercentage = totalExpected > 0 ? (totalDocs / totalExpected * 100).toFixed(1) : 0;
    
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
    
    // Calculate overall standards completion
    let totalStandards = 0;
    let completedStandards = 0;
    
    categories.forEach(cat => {
        const standards = standardsByCategory[cat.id] || [];
        const activeStandards = standards.filter(s => s.is_active !== false);
        totalStandards += activeStandards.length * departments.length;
        
        departments.forEach(dept => {
            const deptCoverage = standardCoverage?.[cat.id]?.[dept] || {};
            activeStandards.forEach(standard => {
                if (deptCoverage[standard.id] === true) {
                    completedStandards++;
                }
            });
        });
    });
    
    const standardsPercentage = totalStandards > 0 ? (completedStandards / totalStandards * 100).toFixed(1) : 0;
    
    container.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between"><span class="text-sm">Total Categories:</span><span class="font-medium">${categories.length}</span></div>
            <div class="flex justify-between"><span class="text-sm">Total Departments:</span><span class="font-medium">${departments.length}</span></div>
            <div class="flex justify-between"><span class="text-sm">Fully Mapped:</span><span class="font-medium text-green-700">${fullyMapped} (${Math.round(fullyMapped/departments.length*100)}%)</span></div>
            <div class="flex justify-between"><span class="text-sm">Partially Mapped:</span><span class="font-medium text-yellow-700">${partiallyMapped} (${Math.round(partiallyMapped/departments.length*100)}%)</span></div>
            <div class="pt-2 border-t">
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-600">Documents Progress:</span>
                    <span class="font-medium">${overallPercentage}%</span>
                </div>
                <div class="w-full bg-gray-200 h-2 rounded-full">
                    <div class="bg-teal-600 h-2 rounded-full progress-bar" style="width:${overallPercentage}%"></div>
                </div>
            </div>
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-600">Standards Compliance:</span>
                    <span class="font-medium">${standardsPercentage}%</span>
                </div>
                <div class="w-full bg-gray-200 h-2 rounded-full">
                    <div class="bg-indigo-600 h-2 rounded-full progress-bar" style="width:${standardsPercentage}%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">${completedStandards} of ${totalStandards} standards met across all departments</p>
            </div>
        </div>
    `;
}

function showStandardsDetails(category, department, categoryName) {
    const standards = standardsByCategory[category] || [];
    const activeStandards = standards.filter(s => s.is_active !== false);
    
    // Filter for approved/locked documents only
    const approvedDocsForDept = allDocuments.filter(doc => {
        const docCategory = doc.category || getCategoryFromId(doc.category_id);
        const docDepartment = doc.department_code || doc.area;
        const isApproved = doc.workflow_status === 'approved' || doc.workflow_status === 'locked';
        return docCategory === category && 
               docDepartment?.toUpperCase() === department.toUpperCase() && 
               isApproved;
    });
    
    // Check if document has this standard in its standards array
    const standardsWithStatus = activeStandards.map(standard => {
        // Check if any approved document has this standard
        const isCovered = approvedDocsForDept.some(doc => {
            if (Array.isArray(doc.standards)) {
                return doc.standards.some(s => s.id === standard.id || s.standard_id === standard.id);
            }
            return false;
        });
        
        // Find all approved documents that cover this standard
        const coveringDocs = approvedDocsForDept.filter(doc => {
            if (Array.isArray(doc.standards)) {
                return doc.standards.some(s => s.id === standard.id || s.standard_id === standard.id);
            }
            return false;
        });
        
        return {
            ...standard,
            isCovered: isCovered,
            coveringDocs: coveringDocs
        };
    });
    
    const completedCount = standardsWithStatus.filter(s => s.isCovered).length;
    const percentage = activeStandards.length > 0 ? (completedCount / activeStandards.length * 100).toFixed(0) : 0;
    
    const modal = document.getElementById('standardsModal');
    const modalTitle = document.getElementById('standardsModalTitle');
    const modalSubtitle = document.getElementById('standardsModalSubtitle');
    const modalContent = document.getElementById('standardsModalContent');
    
    if (!modal || !modalContent) return;
    
    modalTitle.textContent = `${categoryName} Standards`;
    modalSubtitle.textContent = `${department} - ${getDepartmentFullName(department)}`;
    
    modalContent.innerHTML = `
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-semibold text-gray-700">Overall Compliance</span>
                <span class="text-lg font-bold text-indigo-600">${percentage}%</span>
            </div>
            <div class="w-full bg-gray-200 h-2 rounded-full">
                <div class="bg-indigo-600 h-2 rounded-full" style="width:${percentage}%"></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">${completedCount} of ${activeStandards.length} standards met</p>
        </div>
        
        <div class="space-y-3">
            <h4 class="font-semibold text-gray-800 text-sm">Accreditation Standards Checklist</h4>
            ${standardsWithStatus.map(standard => `
                <div class="border rounded-lg p-3 ${standard.isCovered ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                ${standard.isCovered ? 
                                    '<span class="text-green-600 text-lg">✓</span>' : 
                                    '<span class="text-red-500 text-lg">✗</span>'
                                }
                                <div>
                                    <p class="font-medium text-gray-800 text-sm">${escapeHtml(standard.name)}</p>
                                    <p class="text-xs text-gray-500">${escapeHtml(standard.code)}</p>
                                </div>
                            </div>
                            ${standard.isCovered && standard.coveringDocs.length > 0 ? `
                                <div class="mt-2 ml-6">
                                    <p class="text-xs text-gray-600 mb-1">Supporting Documents:</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${standard.coveringDocs.slice(0, 3).map(doc => `
                                            <button class="text-xs text-teal-600 hover:text-teal-800 underline view-doc-btn" data-doc-id="${doc.id}">
                                                ${escapeHtml(doc.title || 'Untitled')}
                                            </button>
                                        `).join('')}
                                        ${standard.coveringDocs.length > 3 ? 
                                            `<span class="text-xs text-gray-500">+${standard.coveringDocs.length - 3} more</span>` : ''
                                        }
                                    </div>
                                </div>
                            ` : `
                                <div class="mt-2 ml-6">
                                    <p class="text-xs text-amber-600">No documents found for this standard</p>
                                    <button class="text-xs text-teal-600 hover:text-teal-800 mt-1 upload-missing" 
                                            data-category="${category}" data-department="${department}" data-standard="${standard.name}">
                                        + Upload missing document
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Add event listeners to view document buttons in modal
    document.querySelectorAll('.view-doc-btn').forEach(btn => {
        btn.removeEventListener('click', handleViewDocFromModal);
        btn.addEventListener('click', handleViewDocFromModal);
    });
    
    // Add event listeners to upload missing buttons in modal
    document.querySelectorAll('.upload-missing').forEach(btn => {
        btn.removeEventListener('click', handleUploadMissing);
        btn.addEventListener('click', handleUploadMissing);
    });
}

function handleViewDocFromModal(e) {
    const docId = e.currentTarget.dataset.docId;
    const doc = allDocuments.find(d => d.id == docId);
    if (doc) {
        closeStandardsModal();
        openDetailsModal(doc);
    }
}

function handleUploadMissing(e) {
    const category = e.currentTarget.dataset.category;
    const department = e.currentTarget.dataset.department;
    const standard = e.currentTarget.dataset.standard;
    
    // Store in localStorage and redirect to upload page with pre-filled info
    localStorage.setItem('uploadPreFill', JSON.stringify({
        category: category,
        department: department,
        standard: standard,
        message: `Upload document for: ${standard} (${category} - ${department})`
    }));
    window.location.href = 'upload.html';
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
    
    // Store filter in localStorage and redirect to documents page
    localStorage.setItem('evidenceMapFilters', JSON.stringify({
        category: category,
        department: department.toLowerCase(),
        message: `Showing ${filteredDocs.length} documents for ${category} - ${getDepartmentFullName(department)}`
    }));
    
    window.location.href = `documents.html?category=${category}&department=${department.toLowerCase()}`;
}

function openDetailsModal(doc) {
    const modal = document.getElementById('docDetailsModal');
    const title = document.getElementById('docDetailsTitle');
    const content = document.getElementById('docDetailsContent');
    
    if (!modal || !content) return;
    
    if (title) title.textContent = `Document Details: ${doc.title || 'Untitled'}`;
    
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
    
    // Find standard name if standard_id exists
    let standardName = 'Not specified';
    if (doc.standard_id) {
        const foundStandard = allStandards.find(s => s.id == doc.standard_id);
        if (foundStandard) {
            standardName = foundStandard.name;
        }
    }
    
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
                    <span class="text-gray-500">Standard:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(standardName)}</p>
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

function closeStandardsModal() {
    const modal = document.getElementById('standardsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
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

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
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
            const items = document.querySelectorAll('.department-card');
            
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
            const items = document.querySelectorAll('.department-card');
            
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
            loadStandards().then(() => {
                return loadRequirements();
            }).then(() => {
                return loadDocuments();
            });
        });
    }
    
    // Standards Modal close buttons
    const standardsModalCloseBtn = document.getElementById('standardsModalCloseBtn');
    const standardsModalCloseBtn2 = document.getElementById('standardsModalCloseBtn2');
    const standardsModal = document.getElementById('standardsModal');
    
    if (standardsModalCloseBtn) standardsModalCloseBtn.addEventListener('click', closeStandardsModal);
    if (standardsModalCloseBtn2) standardsModalCloseBtn2.addEventListener('click', closeStandardsModal);
    if (standardsModal) {
        standardsModal.addEventListener('click', (e) => {
            if (e.target === standardsModal) closeStandardsModal();
        });
    }
    
    // Document Details Modal close buttons
    const docDetailsCloseBtn = document.getElementById('docDetailsCloseBtn');
    const docDetailsCloseBtn2 = document.getElementById('docDetailsCloseBtn2');
    const docDetailsModal = document.getElementById('docDetailsModal');
    
    if (docDetailsCloseBtn) docDetailsCloseBtn.addEventListener('click', closeDetailsModal);
    if (docDetailsCloseBtn2) docDetailsCloseBtn2.addEventListener('click', closeDetailsModal);
    if (docDetailsModal) {
        docDetailsModal.addEventListener('click', (e) => {
            if (e.target === docDetailsModal) closeDetailsModal();
        });
    }
    
    // Mobile sidebar
    setupMobileSidebar();
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
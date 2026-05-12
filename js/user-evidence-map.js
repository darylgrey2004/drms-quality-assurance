// js/user-evidence-map.js

const API_BASE = window.API_CONFIG?.API_BASE || 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Evidence Map JS loaded');

    // Initialize user session (handled by user-session.js)
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;

    // Tab switching
    const tabLinks = document.querySelectorAll('#mapTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('searchMap');
    const categoryFilter = document.getElementById('categoryFilter');
    
    let allDocuments = [];
    let allStandards = [];
    let userDepartment = null;
    let categoryRequirements = [];
    
    // Load data from API
    await loadData();
    
    async function loadData() {
        try {
            // Get user's department
            const deptResponse = await fetch(`${API_BASE}/api/documents/user/department`, {
                headers: { 'x-auth-token': token }
            });
            
            if (deptResponse.ok) {
                const deptData = await deptResponse.json();
                userDepartment = deptData.department_code || deptData.department_name;
                console.log('User department:', userDepartment);
            }
            
            // Load documents from user's department for statistics (approved/locked only)
            const docsResponse = await fetch(`${API_BASE}/api/documents/department-stats`, {
                headers: { 'x-auth-token': token }
            });
            
            if (!docsResponse.ok) throw new Error('Failed to load documents');
            allDocuments = await docsResponse.json();
            
            // Load category requirements
            const reqResponse = await fetch(`${API_BASE}/api/documents/category-requirements`, {
                headers: { 'x-auth-token': token }
            });
            
            if (reqResponse.ok) {
                categoryRequirements = await reqResponse.json();
                console.log('Category requirements:', categoryRequirements);
            }
            
            // Load all standards
            const stdResponse = await fetch(`${API_BASE}/api/documents/standards`, {
                headers: { 'x-auth-token': token }
            });
            
            if (!stdResponse.ok) throw new Error('Failed to load standards');
            allStandards = await stdResponse.json();
            
            console.log('Loaded documents:', allDocuments.length);
            console.log('Loaded standards:', allStandards.length);
            
            // Render summary cards
            renderSummaryCards();
            
            // Render evidence map
            renderEvidenceMap();
        } catch (error) {
            console.error('Error loading data:', error);
            showError('Failed to load evidence map data. Please try again.');
        }
    }
    
    function renderSummaryCards() {
        const summaryContainer = document.getElementById('summaryCards');
        if (!summaryContainer) return;
        
        const categories = [
            { name: 'instruction', label: 'Instruction', color: 'blue', badge: 'badge-instruction' },
            { name: 'research', label: 'Research', color: 'green', badge: 'badge-research' },
            { name: 'extension', label: 'Extension', color: 'amber', badge: 'badge-extension' },
            { name: 'employment', label: 'Employment', color: 'purple', badge: 'badge-employment' }
        ];
        
        summaryContainer.innerHTML = categories.map(cat => {
            // Filter documents for user's department and approved/locked status
            const approvedDocs = allDocuments.filter(doc => {
                const isApproved = doc.workflow_status === 'approved' || doc.workflow_status === 'locked';
                const matchesCategory = (doc.category_name || doc.category || '').toLowerCase() === cat.name;
                const matchesDept = !userDepartment || doc.department_code === userDepartment || doc.department_code === userDepartment.toUpperCase();
                return isApproved && matchesCategory && matchesDept;
            });
            
            // Get expected documents from requirements
            const requirement = categoryRequirements.find(req => {
                const matchesCategory = (req.category_name || '').toLowerCase() === cat.name;
                const matchesDept = !userDepartment || req.department_code === userDepartment;
                return matchesCategory && matchesDept;
            });
            
            const current = approvedDocs.length;
            const expected = requirement ? requirement.expected_documents : 0;
            const percentage = expected > 0 ? Math.round((current / expected) * 100) : 0;
            const missing = Math.max(0, expected - current);
            
            return `
                <div class="bg-white rounded-xl p-5 stat-card">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-semibold text-gray-800">${cat.label}</h3>
                        <span class="${cat.badge} text-xs px-2.5 py-0.5 rounded-full">${current} docs</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Approved documents:</span>
                        <span class="font-medium">${current}/${expected}</span>
                    </div>
                    <div class="w-full bg-gray-200 h-2 rounded-full mt-2">
                        <div class="bg-${cat.color}-600 h-2 rounded-full" style="width:${percentage}%"></div>
                    </div>
                    <div class="mt-2 text-xs text-${cat.color}-700">${percentage}% complete · ${missing} missing</div>
                </div>
            `;
        }).join('');
    }
    
    function renderEvidenceMap() {
        // Group standards by category
        const categories = {
            instruction: [],
            research: [],
            extension: [],
            employment: []
        };
        
        allStandards.forEach(std => {
            const categoryName = (std.category_name || '').toLowerCase();
            if (categories[categoryName]) {
                // Count ONLY approved/locked documents from user's department mapped to this standard
                const mappedDocs = allDocuments.filter(doc => {
                    // Only count approved or locked documents
                    const isApproved = doc.workflow_status === 'approved' || doc.workflow_status === 'locked';
                    if (!isApproved) return false;
                    
                    // Filter by user's department
                    const matchesDept = !userDepartment || doc.department_code === userDepartment || doc.department_code === userDepartment.toUpperCase();
                    if (!matchesDept) return false;
                    
                    if (!Array.isArray(doc.standards)) return false;
                    
                    return doc.standards.some(s => {
                        // Handle string format
                        if (typeof s === 'string') {
                            return s === std.name || s === std.code;
                        }
                        // Handle object format
                        if (typeof s === 'object' && s !== null) {
                            return s.id === std.id || s.name === std.name || s.standard_id === std.id;
                        }
                        return false;
                    });
                });
                
                categories[categoryName].push({
                    ...std,
                    documentCount: mappedDocs.length,
                    documents: mappedDocs
                });
            }
        });
        
        // Render each category tab
        Object.keys(categories).forEach(category => {
            const tabContent = document.getElementById(category + 'Tab');
            if (!tabContent) return;
            
            const standards = categories[category];
            
            if (standards.length === 0) {
                tabContent.innerHTML = '<div class="text-center text-gray-500 py-8">No standards found for this category.</div>';
                return;
            }
            
            tabContent.innerHTML = standards.map(std => `
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" 
                     onclick="viewStandardDetails(${std.id}, '${std.name.replace(/'/g, "\\'")}')" 
                     data-standard-id="${std.id}">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-semibold text-gray-800">${std.name}</h4>
                        <span class="${std.documentCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} px-2 py-1 rounded-full text-xs">
                            ${std.documentCount} ${std.documentCount === 1 ? 'document' : 'documents'}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${std.description || 'No description available'}</p>
                    <div class="text-xs text-gray-500">
                        <span class="font-medium">Code:</span> ${std.code}
                    </div>
                </div>
            `).join('');
        });
    }
    
    function showError(message) {
        tabContents.forEach(content => {
            content.innerHTML = `<div class="text-center text-red-500 py-8">${message}</div>`;
        });
    }

    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');

            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');

            tabContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(tabId + 'Tab').classList.remove('hidden');

            if (categoryFilter) categoryFilter.value = tabId;
        });
    });

    // Search filter
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('.tab-content:not(.hidden) .border.rounded-lg').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(term) ? 'block' : 'none';
            });
        });
    }

    // Category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const value = this.value;
            if (value === 'all') {
                // Show first tab
                tabLinks[0].click();
            } else {
                tabLinks.forEach(link => {
                    if (link.getAttribute('data-tab') === value) {
                        link.click();
                    }
                });
            }
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshMap');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadData();
        });
    }
});

// Global function for viewing standard details
async function viewStandardDetails(standardId, standardName) {
    console.log('View standard details:', standardId, standardName);
    
    const token = localStorage.getItem('token');
    
    try {
        // Fetch standard details
        const stdResponse = await fetch(`${API_BASE}/api/documents/standards`, {
            headers: { 'x-auth-token': token }
        });
        
        if (!stdResponse.ok) throw new Error('Failed to load standard details');
        
        const allStandards = await stdResponse.json();
        const standard = allStandards.find(s => s.id === standardId);
        
        if (!standard) {
            alert('Standard not found');
            return;
        }
        
        // Fetch documents for this standard from user's department
        const docsResponse = await fetch(`${API_BASE}/api/documents/department-stats`, {
            headers: { 'x-auth-token': token }
        });
        
        if (!docsResponse.ok) throw new Error('Failed to load documents');
        
        const allDocuments = await docsResponse.json();
        
        // Filter documents that have this standard - ONLY approved/locked documents from user's department
        const mappedDocs = allDocuments.filter(doc => {
            // Only include approved or locked documents
            const isApproved = doc.workflow_status === 'approved' || doc.workflow_status === 'locked';
            if (!isApproved) return false;
            
            if (!Array.isArray(doc.standards)) return false;
            
            return doc.standards.some(s => {
                // Handle string format
                if (typeof s === 'string') {
                    return s === standard.name || s === standard.code;
                }
                // Handle object format
                if (typeof s === 'object' && s !== null) {
                    return s.id === standardId || s.name === standardName || s.standard_id === standardId;
                }
                return false;
            });
        });
        
        console.log('Mapped documents found:', mappedDocs.length);
        console.log('Sample document standards:', mappedDocs.length > 0 ? mappedDocs[0].standards : 'none');
        
        // Show modal with standard details
        showStandardModal(standard, mappedDocs);
        
    } catch (error) {
        console.error('Error loading standard details:', error);
        alert('Failed to load standard details. Please try again.');
    }
}

function showStandardModal(standard, documents) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('standardDetailsModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'standardDetailsModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                    <h3 class="text-lg font-semibold text-gray-800" id="standardModalTitle">Standard Details</h3>
                    <button id="closeStandardModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>
                <div class="p-6" id="standardModalContent"></div>
                <div class="flex justify-end gap-3 p-4 border-t bg-gray-50">
                    <button id="closeStandardModal2" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('closeStandardModal').addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
        document.getElementById('closeStandardModal2').addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }
    
    const title = document.getElementById('standardModalTitle');
    const content = document.getElementById('standardModalContent');
    
    title.textContent = standard.name;
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span class="text-gray-500">Code:</span>
                        <p class="font-medium text-gray-800 mt-1">${escapeHtml(standard.code)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500">Category:</span>
                        <p class="font-medium text-gray-800 mt-1">${escapeHtml(standard.category_name || 'N/A')}</p>
                    </div>
                    <div class="col-span-2">
                        <span class="text-gray-500">Description:</span>
                        <p class="text-gray-700 mt-1">${escapeHtml(standard.description || 'No description available')}</p>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">Mapped Documents (${documents.length})</h4>
                ${documents.length > 0 ? `
                    <div class="space-y-2">
                        ${documents.map(doc => `
                            <div class="border rounded-lg p-3 hover:bg-gray-50">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-800 text-sm">${escapeHtml(doc.title || 'Untitled')}</p>
                                        <p class="text-xs text-gray-500 mt-1">
                                            ${escapeHtml(doc.department_code || doc.area || 'N/A')} · 
                                            ${escapeHtml(doc.category_name || doc.category || 'N/A')}
                                        </p>
                                    </div>
                                    <span class="text-xs px-2 py-1 rounded-full ${
                                        doc.workflow_status === 'approved' || doc.workflow_status === 'locked' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-yellow-100 text-yellow-700'
                                    }">
                                        ${escapeHtml(doc.workflow_status || 'pending')}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <p>No documents mapped to this standard yet.</p>
                        <button class="mt-3 text-teal-600 hover:text-teal-700 text-sm" onclick="window.location.href='user-upload.html'">
                            + Upload a document for this standard
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// js/user-evidence-map.js

const API_BASE = 'http://localhost:3000';

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
            
            // Load all documents (approved only for stats)
            const docsResponse = await fetch(`${API_BASE}/api/documents?scope=all`, {
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
            // Filter approved documents for this category and user's department
            const approvedDocs = allDocuments.filter(doc => {
                const isApproved = doc.workflow_status === 'approved' || doc.workflow_status === 'locked';
                const matchesCategory = (doc.category_name || doc.category || '').toLowerCase() === cat.name;
                const matchesDept = !userDepartment || doc.department_code === userDepartment;
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
                // Count documents mapped to this standard
                const mappedDocs = allDocuments.filter(doc => 
                    Array.isArray(doc.standards) && doc.standards.includes(std.name)
                );
                
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
function viewStandardDetails(standardId, standardName) {
    console.log('View standard details:', standardId, standardName);
    alert(`Viewing details for: ${standardName}\n\nThis shows which documents are mapped to this standard.`);
}

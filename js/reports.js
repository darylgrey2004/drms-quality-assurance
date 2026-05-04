// js/reports.js

// API Base URL
const API_BASE = 'http://localhost:3000';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reports page JS loaded successfully');
    
    // ── Heartbeat: Update lastActive status ──
    const token = localStorage.getItem('token');
    function sendHeartbeat() {
        fetch(`${API_BASE}/api/user/heartbeat`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 2 * 60 * 1000);
    }
    
    // Use a small delay to ensure DOM is fully ready
    setTimeout(() => {
        console.log('Loading analytics data...');
        loadAnalyticsData();
        loadCompletenessData();
    }, 100);
    
    // Initialize reports page functionality
    initializeReportsPage();
});

// Load real analytics data from backend
async function loadAnalyticsData() {
    console.log('Loading analytics data from backend...');
    
    try {
        const token = localStorage.getItem('token');
        console.log('Reports - Token found:', token ? 'YES' : 'NO');
        
        if (!token) {
            console.error('No authentication token found');
            useFallbackAnalytics();
            return;
        }
        
        // Fetch documents and requirements
        const [docsResponse, reqResponse] = await Promise.all([
            fetch(`${API_BASE}/api/documents?scope=all`, {
                headers: { 'x-auth-token': token }
            }),
            fetch(`${API_BASE}/api/documents/category-requirements`, {
                headers: { 'x-auth-token': token }
            })
        ]);
        
        console.log('API responses:', {
            docs: docsResponse.status,
            requirements: reqResponse.status
        });
        
        if (docsResponse.ok && reqResponse.ok) {
            const documents = await docsResponse.json();
            const requirements = await reqResponse.json();
            
            console.log('SUCCESS: Data loaded:', {
                documents: documents.length,
                requirements: requirements.length
            });
            
            // Calculate requirements-based analytics
            const enhancedAnalytics = calculateRequirementsAnalytics(documents, requirements);
            updateAnalyticsDisplay(enhancedAnalytics);
        } else {
            throw new Error('Failed to fetch data');
        }
    } catch (error) {
        console.error('Failed to load analytics:', error);
        useFallbackAnalytics();
    }
}

// Calculate analytics based on requirements
function calculateRequirementsAnalytics(documents, requirements) {
    // Calculate total requirements per category from database
    const categoryRequirements = {
        instruction: 0,
        research: 0,
        extension: 0,
        employment: 0
    };
    
    // Sum requirements from database
    requirements.forEach(req => {
        const categoryName = (req.category_name || '').toLowerCase();
        if (categoryRequirements[categoryName] !== undefined) {
            categoryRequirements[categoryName] += req.expected_documents || 0;
        }
    });
    
    // Calculate requirements-based analytics
    const categoryBreakdown = [
        { category: 'Instruction', total: 0, approved: 0, pending: 0, rejected: 0, required: categoryRequirements.instruction },
        { category: 'Research', total: 0, approved: 0, pending: 0, rejected: 0, required: categoryRequirements.research },
        { category: 'Extension', total: 0, approved: 0, pending: 0, rejected: 0, required: categoryRequirements.extension },
        { category: 'Employment', total: 0, approved: 0, pending: 0, rejected: 0, required: categoryRequirements.employment }
    ];
    
    documents.forEach(doc => {
        const category = (doc.category || doc.category_name || '').toLowerCase();
        const categoryIndex = {
            'instruction': 0,
            'research': 1,
            'extension': 2,
            'employment': 3
        }[category];
        
        if (categoryIndex !== undefined) {
            categoryBreakdown[categoryIndex].total++;
            
            if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                categoryBreakdown[categoryIndex].approved++;
            } else if (doc.workflow_status === 'pending' || doc.workflow_status === 'validated') {
                categoryBreakdown[categoryIndex].pending++;
            } else if (doc.workflow_status === 'rejected') {
                categoryBreakdown[categoryIndex].rejected++;
            }
        }
    });
    
    // Calculate approval rates based on requirements
    categoryBreakdown.forEach(cat => {
        cat.approval_rate = cat.required > 0 ? ((cat.approved / cat.required) * 100).toFixed(2) : 0;
    });
    
    // Status distribution
    const statusDistribution = [
        { workflow_status: 'approved', count: documents.filter(d => d.workflow_status === 'approved' || d.workflow_status === 'locked').length, percentage: 0 },
        { workflow_status: 'pending', count: documents.filter(d => d.workflow_status === 'pending' || d.workflow_status === 'validated').length, percentage: 0 },
        { workflow_status: 'rejected', count: documents.filter(d => d.workflow_status === 'rejected').length, percentage: 0 }
    ];
    const total = documents.length;
    statusDistribution.forEach(s => {
        s.percentage = total > 0 ? ((s.count / total) * 100).toFixed(1) : 0;
    });
    
    // Department breakdown
    const departmentMap = new Map();
    documents.forEach(doc => {
        const dept = doc.department_code || doc.area || 'Other';
        if (!departmentMap.has(dept)) {
            departmentMap.set(dept, { total: 0, approved: 0, pending: 0, rejected: 0 });
        }
        const deptData = departmentMap.get(dept);
        deptData.total++;
        if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
            deptData.approved++;
        } else if (doc.workflow_status === 'pending' || doc.workflow_status === 'validated') {
            deptData.pending++;
        } else if (doc.workflow_status === 'rejected') {
            deptData.rejected++;
        }
    });
    
    const departmentBreakdown = Array.from(departmentMap.entries()).map(([code, data]) => ({
        department_code: code,
        ...data,
        approval_rate: data.total > 0 ? ((data.approved / data.total) * 100).toFixed(1) : 0
    }));
    
    return {
        status_distribution: statusDistribution,
        category_breakdown: categoryBreakdown,
        department_breakdown: departmentBreakdown,
        monthly_trends: [],
        top_uploaders: [{ firstName: 'Admin', lastName: 'User', documents_uploaded: documents.length }],
        requirements: categoryRequirements
    };
}

// Load completeness data
async function loadCompletenessData() {
    console.log('Loading completeness data...');
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            useFallbackCompleteness();
            return;
        }
        
        const [docsResponse, reqResponse] = await Promise.all([
            fetch(`${API_BASE}/api/documents?scope=all`, {
                headers: { 'x-auth-token': token }
            }),
            fetch(`${API_BASE}/api/documents/category-requirements`, {
                headers: { 'x-auth-token': token }
            })
        ]);
        
        if (docsResponse.ok) {
            const documents = await docsResponse.json();
            updateCompletenessDisplay(documents);
        } else {
            useFallbackCompleteness();
        }
    } catch (error) {
        console.error('Failed to load completeness data:', error);
        useFallbackCompleteness();
    }
}

// Update completeness display
function updateCompletenessDisplay(documents) {
    const container = document.getElementById('completenessChart');
    const tableBody = document.getElementById('departmentBreakdownTable');
    
    if (!container) return;
    
    // Load requirements from API
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/documents/category-requirements`, {
        headers: { 'x-auth-token': token }
    })
    .then(res => res.json())
    .then(requirements => {
        console.log('Requirements loaded:', requirements);
        // Calculate category totals from requirements
        const categoryTotals = { Instruction: 0, Research: 0, Extension: 0, Employment: 0 };
        requirements.forEach(req => {
            const cat = req.category_display_name;
            if (categoryTotals[cat] !== undefined) {
                categoryTotals[cat] += req.expected_documents || 0;
            }
        });
        
        // Categories with requirements from database
        const categories = [
            { name: 'Instruction', required: categoryTotals.Instruction, color: 'bg-blue-600' },
            { name: 'Research', required: categoryTotals.Research, color: 'bg-green-600' },
            { name: 'Extension', required: categoryTotals.Extension, color: 'bg-amber-600' },
            { name: 'Employment', required: categoryTotals.Employment, color: 'bg-purple-600' }
        ];
        
        // Count documents by category
        const counts = { Instruction: 0, Research: 0, Extension: 0, Employment: 0 };
        documents.forEach(doc => {
            const cat = (doc.category || doc.category_name || '');
            if (cat === 'Instruction' || cat === 'instruction') counts.Instruction++;
            else if (cat === 'Research' || cat === 'research') counts.Research++;
            else if (cat === 'Extension' || cat === 'extension') counts.Extension++;
            else if (cat === 'Employment' || cat === 'employment') counts.Employment++;
        });
        
        // Render completeness chart
        container.innerHTML = categories.map(cat => {
            const uploaded = counts[cat.name];
            const percentage = cat.required > 0 ? ((uploaded / cat.required) * 100).toFixed(0) : 0;
            const missing = Math.max(0, cat.required - uploaded);
            const status = uploaded >= cat.required ? 'Complete' : 'Partial';
            const statusColor = uploaded >= cat.required ? 'text-green-600' : 'text-amber-600';
            
            return `
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">${cat.name}</span>
                        <span class="text-sm font-semibold ${statusColor}">${percentage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 h-2 rounded-full">
                        <div class="${cat.color} h-2 rounded-full" style="width:${percentage}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>${uploaded} of ${cat.required} documents</span>
                        <span>${missing} missing</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Department breakdown table - load from database
        if (tableBody) {
            // Group requirements by department and category
            const deptMap = {};
            requirements.forEach(req => {
                const dept = req.department_code;
                const cat = req.category_name;
                if (!deptMap[dept]) deptMap[dept] = {};
                deptMap[dept][cat] = {
                    req: req.expected_documents || 0,
                    uploaded: 0,
                    verified: 0
                };
            });
            
            // Count uploaded and verified documents
            documents.forEach(doc => {
                const dept = doc.department_code;
                const cat = doc.category_display_name || doc.category;
                if (deptMap[dept] && deptMap[dept][cat]) {
                    deptMap[dept][cat].uploaded++;
                    if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                        deptMap[dept][cat].verified++;
                    }
                }
            });
            
            let tableHtml = '';
            for (const dept in deptMap) {
                for (const cat in deptMap[dept]) {
                    const data = deptMap[dept][cat];
                    const percentage = data.req > 0 ? ((data.uploaded / data.req) * 100).toFixed(0) : 0;
                    const status = data.uploaded >= data.req ? 'Complete' : 'Partial';
                    const statusClass = status === 'Complete' ? 'badge-approved' : 'badge-pending';
                    const progressColor = parseInt(percentage) >= 80 ? 'bg-green-600' : (parseInt(percentage) >= 50 ? 'bg-amber-600' : 'bg-red-600');
                    
                    tableHtml += `
                        <tr class="border-b">
                            <td class="py-3 font-medium">${dept}</td>
                            <td class="py-3">${cat}</td>
                            <td class="py-3">${data.req}</td>
                            <td class="py-3">${data.uploaded}</td>
                            <td class="py-3">${data.verified}</td>
                            <td class="py-3">
                                <div class="flex items-center gap-2">
                                    <div class="w-20 bg-gray-200 h-2 rounded-full">
                                        <div class="${progressColor} h-2 rounded-full" style="width:${percentage}%"></div>
                                    </div>
                                    <span class="text-xs">${percentage}%</span>
                                </div>
                            </td>
                            <td class="py-3"><span class="${statusClass} px-2 py-1 rounded-full text-xs">${status}</span></td>
                        </tr>
                    `;
                }
            }
            tableBody.innerHTML = tableHtml || '<tr><td colspan="7" class="text-center py-4 text-gray-500">No data available</td></tr>';
        }
    })
    .catch(err => {
        console.error('Failed to load requirements:', err);
        if (container) container.innerHTML = '<div class="text-center text-gray-500 py-4">Failed to load completeness data</div>';
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">Failed to load data</td></tr>';
    });
}

// Update analytics display with real data
function updateAnalyticsDisplay(analytics) {
    console.log('=== UPDATING ANALYTICS DISPLAY ===');
    console.log('Analytics data received:', analytics);
    
    // Update summary cards
    const totalDocs = analytics.category_breakdown.reduce((sum, cat) => sum + cat.total, 0);
    const approvedDocs = analytics.category_breakdown.reduce((sum, cat) => sum + cat.approved, 0);
    const pendingDocs = analytics.category_breakdown.reduce((sum, cat) => sum + cat.pending, 0);
    const rejectedDocs = analytics.category_breakdown.reduce((sum, cat) => sum + cat.rejected, 0);
    
    console.log('Calculated totals:');
    console.log('- Total:', totalDocs);
    console.log('- Approved:', approvedDocs);
    console.log('- Pending:', pendingDocs);
    console.log('- Rejected:', rejectedDocs);
    
    // Update elements with error checking
    const totalDocsEl = document.getElementById('totalDocs');
    const approvedDocsEl = document.getElementById('approvedDocs');
    const pendingDocsEl = document.getElementById('pendingDocs');
    const totalChangeEl = document.getElementById('totalChange');
    const approvalRateEl = document.getElementById('approvalRate');
    const pendingInfoEl = document.getElementById('pendingInfo');
    const activeUsersEl = document.getElementById('activeUsers');
    const userInfoEl = document.getElementById('userInfo');
    
    if (totalDocsEl) totalDocsEl.textContent = totalDocs;
    if (approvedDocsEl) approvedDocsEl.textContent = approvedDocs;
    if (pendingDocsEl) pendingDocsEl.textContent = pendingDocs;
    if (totalChangeEl) totalChangeEl.textContent = `${totalDocs} total documents`;
    
    const approvalRate = totalDocs > 0 ? ((approvedDocs / totalDocs) * 100).toFixed(1) : 0;
    if (approvalRateEl) approvalRateEl.textContent = `${approvalRate}% approval rate`;
    if (pendingInfoEl) pendingInfoEl.textContent = `${rejectedDocs} rejected`;
    
    const activeUsers = analytics.top_uploaders.length;
    if (activeUsersEl) activeUsersEl.textContent = activeUsers;
    if (userInfoEl) userInfoEl.textContent = `${activeUsers} active uploaders`;
    
    // Update status distribution
    updateStatusChart(analytics.status_distribution);
    
    // Update category breakdown
    updateCategoryChart(analytics.category_breakdown);
}

// Fallback analytics
function useFallbackAnalytics() {
    console.log('Using fallback analytics...');
    const fallbackAnalytics = {
        status_distribution: [
            { workflow_status: 'approved', count: 0, percentage: 0 },
            { workflow_status: 'pending', count: 0, percentage: 0 },
            { workflow_status: 'rejected', count: 0, percentage: 0 }
        ],
        category_breakdown: [
            { category: 'Instruction', total: 0, approved: 0, pending: 0, rejected: 0, required: 0, approval_rate: 0 },
            { category: 'Research', total: 0, approved: 0, pending: 0, rejected: 0, required: 0, approval_rate: 0 },
            { category: 'Extension', total: 0, approved: 0, pending: 0, rejected: 0, required: 0, approval_rate: 0 },
            { category: 'Employment', total: 0, approved: 0, pending: 0, rejected: 0, required: 0, approval_rate: 0 }
        ],
        department_breakdown: [],
        monthly_trends: [],
        top_uploaders: [],
        requirements: { instruction: 0, research: 0, extension: 0, employment: 0 }
    };
    updateAnalyticsDisplay(fallbackAnalytics);
}

function useFallbackCompleteness() {
    console.log('Using fallback completeness data...');
    const container = document.getElementById('completenessChart');
    const tableBody = document.getElementById('departmentBreakdownTable');
    
    if (container) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">Failed to load completeness data</div>';
    }
    
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">Failed to load data</td></tr>';
    }
}

function updateStatusChart(data) {
    console.log('Updating status chart with:', data);
    const container = document.getElementById('statusChart');
    if (!container || !data) return;
    
    const statusColors = {
        'approved': 'bg-green-600',
        'pending': 'bg-amber-600',
        'rejected': 'bg-red-600'
    };
    
    const statusLabels = {
        'approved': 'Approved',
        'pending': 'Pending',
        'rejected': 'Rejected'
    };
    
    container.innerHTML = data.map(item => `
        <div>
            <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">${statusLabels[item.workflow_status] || item.workflow_status}</span>
                <span class="font-medium">${item.count} (${item.percentage}%)</span>
            </div>
            <div class="w-full bg-gray-200 h-2 rounded-full">
                <div class="${statusColors[item.workflow_status] || 'bg-gray-600'} h-2 rounded-full" style="width:${item.percentage}%"></div>
            </div>
        </div>
    `).join('');
}

function updateCategoryChart(data) {
    console.log('Updating category chart with:', data);
    const container = document.getElementById('categoryChart');
    const totalContainer = document.getElementById('categoryTotal');
    if (!container || !data) return;
    
    const categoryColors = {
        'Instruction': 'bg-blue-600',
        'Research': 'bg-green-600',
        'Extension': 'bg-amber-600',
        'Employment': 'bg-purple-600'
    };
    
    const totalRequired = data.reduce((sum, cat) => sum + (cat.required || 0), 0);
    const totalApproved = data.reduce((sum, cat) => sum + cat.approved, 0);
    
    if (totalContainer) totalContainer.textContent = `${totalApproved}/${totalRequired} required`;
    
    container.innerHTML = data.map(item => {
        const percentage = (item.required || 0) > 0 ? ((item.approved / item.required) * 100).toFixed(0) : 0;
        const missing = Math.max(0, (item.required || 0) - item.approved);
        return `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-600">${item.category}</span>
                    <span class="font-medium">${item.approved}/${item.required || 0} (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 h-2 rounded-full">
                    <div class="${categoryColors[item.category] || 'bg-gray-600'} h-2 rounded-full" style="width:${percentage}%"></div>
                </div>
                <div class="text-xs text-gray-500 mt-1">${missing} missing</div>
            </div>
        `;
    }).join('');
}

// DOM elements and event handlers
function initializeReportsPage() {
    const reportPeriod = document.getElementById('reportPeriod');
    const reportFormat = document.getElementById('reportFormat');
    const generateBtn = document.getElementById('generateReport');
    const exportBtn = document.getElementById('exportReport');
    const generateGapReport = document.getElementById('generateGapReport');
    
    // Generate report button
    if (generateBtn) {
        generateBtn.addEventListener('click', async function() {
            const period = reportPeriod ? reportPeriod.value : 'this-month';
            const format = reportFormat ? reportFormat.value : 'pdf';
            
            // Find active tab
            let activeTab = 'overview';
            document.querySelectorAll('#reportTabs a').forEach(link => {
                if (link.classList.contains('active-tab')) {
                    activeTab = link.getAttribute('data-tab');
                }
            });
            
            console.log(`Generating ${format} report for ${activeTab} (${period})`);
            
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="mr-2">⏳</span> Generating...';
            this.disabled = true;
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/api/reports/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({
                        report_type: activeTab,
                        period: period,
                        format: format
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    alert(`Report generated successfully!\n\nType: ${activeTab} report\nPeriod: ${period}\nFormat: ${format}\nReport ID: ${result.report_id}`);
                    loadReportHistory();
                } else {
                    alert('Failed to generate report');
                }
            } catch (error) {
                console.error('Report generation error:', error);
                alert('Failed to generate report');
            } finally {
                this.innerHTML = originalText;
                this.disabled = false;
            }
        });
    }
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const format = reportFormat ? reportFormat.value : 'pdf';
            alert(`Exporting current view as ${format.toUpperCase()}\n\nThis would download the visible data in ${format.toUpperCase()} format.`);
        });
    }
    
    // Generate Gap Report button
    if (generateGapReport) {
        generateGapReport.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/api/reports/gap-analysis`, {
                    headers: { 'x-auth-token': token }
                });

                if (response.ok) {
                    const data = await response.json();
                    alert(`Gap Analysis Report\n\nFound ${data.gaps.length} gaps in document completeness.\n\nThis would generate a detailed report.`);
                } else {
                    alert('Failed to generate gap report');
                }
            } catch (error) {
                console.error('Gap report error:', error);
                alert('Failed to generate gap report');
            }
        });
    }
    
    // Custom period handling
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            if (this.value === 'custom') {
                const startDate = prompt('Enter start date (YYYY-MM-DD):', '2026-01-01');
                const endDate = prompt('Enter end date (YYYY-MM-DD):', '2026-12-31');
                
                if (startDate && endDate) {
                    alert(`Custom range: ${startDate} to ${endDate}`);
                } else {
                    this.value = 'this-month';
                }
            }
        });
    }
    
    // View All link
    const viewAllLink = document.querySelector('a[href="#"].text-sm.text-teal-700');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            loadReportHistory();
        });
    }
    
    // Load report history on page load
    loadReportHistory();
    
    // Active navigation state
    const currentPath = window.location.pathname.split('/').pop() || 'reports.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1a4450';
        }
    });
}

// Load report history
async function loadReportHistory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/reports/history?limit=5`, {
            headers: { 'x-auth-token': token }
        });

        if (response.ok) {
            const reports = await response.json();
            renderReportHistory(reports);
        }
    } catch (error) {
        console.error('Failed to load report history:', error);
    }
}

// Render report history
function renderReportHistory(reports) {
    const tableContainer = document.getElementById('recentReportsTable');
    const mobileContainer = document.getElementById('recentReportsMobile');

    if (reports.length === 0) {
        if (tableContainer) tableContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No reports generated yet</div>';
        if (mobileContainer) mobileContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No reports generated yet</div>';
        return;
    }

    // Desktop table
    if (tableContainer) {
        tableContainer.innerHTML = `
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b text-gray-500 text-xs">
                        <th class="text-left py-2">Report Type</th>
                        <th class="text-left py-2">Period</th>
                        <th class="text-left py-2">Format</th>
                        <th class="text-left py-2">Generated By</th>
                        <th class="text-left py-2">Date</th>
                        <th class="text-left py-2">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${reports.map(report => `
                        <tr class="hover:bg-gray-50">
                            <td class="py-3 font-medium">${report.report_type}</td>
                            <td class="py-3">${report.period}</td>
                            <td class="py-3"><span class="bg-gray-100 px-2 py-1 rounded text-xs">${report.format.toUpperCase()}</span></td>
                            <td class="py-3">${report.generated_by}</td>
                            <td class="py-3 text-gray-500">${new Date(report.generated_at).toLocaleDateString()}</td>
                            <td class="py-3"><button class="text-teal-600 hover:text-teal-800 text-sm">Download</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Mobile cards
    if (mobileContainer) {
        mobileContainer.innerHTML = reports.map(report => `
            <div class="bg-white p-4 rounded-lg border">
                <div class="flex justify-between items-start mb-2">
                    <span class="font-medium">${report.report_type}</span>
                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">${report.format.toUpperCase()}</span>
                </div>
                <div class="text-sm text-gray-500 space-y-1">
                    <div>Period: ${report.period}</div>
                    <div>By: ${report.generated_by}</div>
                    <div>${new Date(report.generated_at).toLocaleDateString()}</div>
                </div>
                <button class="mt-3 text-teal-600 hover:text-teal-800 text-sm">Download</button>
            </div>
        `).join('');
    }
}
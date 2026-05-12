// js/reports.js

// API Base URL
const API_BASE = window.API_CONFIG?.API_BASE || 'http://localhost:3000';

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
    
    // Initialize modal handlers FIRST
    initializeModalHandlers();
    
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
        
        // Count only approved/locked documents by category
        const counts = { Instruction: 0, Research: 0, Extension: 0, Employment: 0 };
        documents.forEach(doc => {
            // Only count approved or locked documents
            if (doc.workflow_status !== 'approved' && doc.workflow_status !== 'locked') return;
            
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
            
            // Count uploaded (all documents) and verified (only approved/locked)
            let matchedCount = 0;
            let unmatchedCount = 0;
            documents.forEach(doc => {
                const dept = doc.department_code;
                // Normalize category name to lowercase for matching
                const docCat = (doc.category_display_name || doc.category || '').toLowerCase();
                
                // Find matching category in deptMap (case-insensitive)
                if (deptMap[dept]) {
                    let matched = false;
                    for (const cat in deptMap[dept]) {
                        if (cat.toLowerCase() === docCat) {
                            // Count ALL documents as uploaded
                            deptMap[dept][cat].uploaded++;
                            // Only count approved or locked documents as verified
                            if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                                deptMap[dept][cat].verified++;
                            }
                            matched = true;
                            matchedCount++;
                            break;
                        }
                    }
                    if (!matched) {
                        unmatchedCount++;
                        console.log('Unmatched document:', { dept, docCat, availableCategories: Object.keys(deptMap[dept]) });
                    }
                } else {
                    unmatchedCount++;
                    console.log('Department not found:', dept, 'Available:', Object.keys(deptMap));
                }
            });
            console.log(`Department breakdown: ${matchedCount} matched, ${unmatchedCount} unmatched documents`);
            
            let tableHtml = '';
            for (const dept in deptMap) {
                for (const cat in deptMap[dept]) {
                    const data = deptMap[dept][cat];
                    // Calculate percentage based on VERIFIED (approved/locked) documents
                    const percentage = data.req > 0 ? ((data.verified / data.req) * 100).toFixed(0) : 0;
                    const status = data.verified >= data.req ? 'Complete' : 'Partial';
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
    console.log('=== INITIALIZING REPORTS PAGE ===');
    const generateBtn = document.getElementById('generateReport');
    const exportBtn = document.getElementById('exportReport');
    
    console.log('Generate button found:', !!generateBtn);
    console.log('Export button found:', !!exportBtn);
    
    // Generate report button
    if (generateBtn) {
        console.log('Adding click listener to Generate Report button');
        generateBtn.addEventListener('click', function(e) {
            console.log('Generate Report button clicked!');
            e.preventDefault();
            showReportTypeModal('generate');
        });
    }
    
    // Export button
    if (exportBtn) {
        console.log('Adding click listener to Export button');
        exportBtn.addEventListener('click', function(e) {
            console.log('Export button clicked!');
            e.preventDefault();
            showReportTypeModal('export');
        });
    }
    
    // Initialize all other handlers
    initializeAllReportHandlers();
    console.log('=== REPORTS PAGE INITIALIZED ===');
}

// Execute generate report after type selection
async function executeGenerateReport() {
    const reportPeriod = document.getElementById('reportPeriod');
    const reportFormat = document.getElementById('reportFormat');
    
    const period = reportPeriod ? reportPeriod.value : 'this-month';
    const format = reportFormat ? reportFormat.value : 'pdf';
    const reportType = selectedReportType;
    
    console.log(`Generating ${format} report (${period}) - Type: ${reportType}`);
    
    showLoadingModal('Generating Report...', `Creating ${format.toUpperCase()} ${reportType} report`);
    
    try {
        const token = localStorage.getItem('token');
        
        // Build request body with period filtering
        const requestBody = {
            report_type: reportType,
            period: period,
            format: format
        };
        
        // Add custom date range if selected
        if (period === 'custom' && customDateRange.startDate && customDateRange.endDate) {
            requestBody.date_from = customDateRange.startDate;
            requestBody.date_to = customDateRange.endDate;
        }
        
        // Fetch all data for both overview and completeness
        const [docsResponse, reqResponse] = await Promise.all([
            fetch(`${API_BASE}/api/documents?scope=all`, {
                headers: { 'x-auth-token': token }
            }),
            fetch(`${API_BASE}/api/documents/category-requirements`, {
                headers: { 'x-auth-token': token }
            })
        ]);
        
        if (!docsResponse.ok || !reqResponse.ok) {
            throw new Error('Failed to fetch data');
        }
        
        let documents = await docsResponse.json();
        const requirements = await reqResponse.json();
        
        // Apply period filter to documents
        documents = filterDocumentsByPeriod(documents, period, customDateRange);
        
        // === OVERVIEW DATA ===
                const totalDocs = documents.length;
                const approvedDocs = documents.filter(d => d.workflow_status === 'approved' || d.workflow_status === 'locked').length;
                const pendingDocs = documents.filter(d => d.workflow_status === 'pending' || d.workflow_status === 'validated').length;
                const rejectedDocs = documents.filter(d => d.workflow_status === 'rejected').length;
                
                // Category breakdown
                const categoryBreakdown = [
                    { category_name: 'Instruction', total: 0, approved: 0, pending: 0 },
                    { category_name: 'Research', total: 0, approved: 0, pending: 0 },
                    { category_name: 'Extension', total: 0, approved: 0, pending: 0 },
                    { category_name: 'Employment', total: 0, approved: 0, pending: 0 }
                ];
                
                documents.forEach(doc => {
                    const cat = (doc.category || doc.category_name || '').toLowerCase();
                    const idx = { 'instruction': 0, 'research': 1, 'extension': 2, 'employment': 3 }[cat];
                    if (idx !== undefined) {
                        categoryBreakdown[idx].total++;
                        if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                            categoryBreakdown[idx].approved++;
                        } else if (doc.workflow_status === 'pending' || doc.workflow_status === 'validated') {
                            categoryBreakdown[idx].pending++;
                        }
                    }
                });
                
                // Department breakdown
                const deptMap = new Map();
                documents.forEach(doc => {
                    const dept = doc.department_code || 'Other';
                    if (!deptMap.has(dept)) {
                        deptMap.set(dept, { total: 0, approved: 0 });
                    }
                    const data = deptMap.get(dept);
                    data.total++;
                    if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                        data.approved++;
                    }
                });
                
                const departmentBreakdown = Array.from(deptMap.entries()).map(([code, data]) => ({
                    department_code: code,
                    total: data.total,
                    approved: data.approved
                }));
                
                // === COMPLETENESS DATA ===
                const completenessData = [];
                
                requirements.forEach(req => {
                    const dept = req.department_code;
                    const cat = req.category_name;
                    
                    // Count documents for this dept/category
                    let uploaded = 0;
                    let verified = 0;
                    
                    documents.forEach(doc => {
                        const docDept = doc.department_code;
                        const docCat = (doc.category_display_name || doc.category || '').toLowerCase();
                        
                        if (docDept === dept && cat.toLowerCase() === docCat) {
                            uploaded++;
                            if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                                verified++;
                            }
                        }
                    });
                    
                    const percentage = req.expected_documents > 0 
                        ? ((verified / req.expected_documents) * 100).toFixed(2) 
                        : 0;
                    
                    completenessData.push({
                        department_code: dept,
                        category_name: cat,
                        required: req.expected_documents,
                        uploaded: uploaded,
                        verified: verified,
                        completeness_percentage: percentage
                    });
                });
                
                // === COMBINED REPORT DATA ===
                const reportData = {
                    report_type: reportType,
                    period: period,
                    data: {}
                };
                
                // Add overview data if needed
                if (reportType === 'overview' || reportType === 'combined') {
                    reportData.data.overview = {
                        statistics: {
                            total_documents: totalDocs,
                            approved: approvedDocs,
                            pending: pendingDocs,
                            rejected: rejectedDocs
                        },
                        category_breakdown: categoryBreakdown,
                        department_breakdown: departmentBreakdown
                    };
                }
                
                // Add completeness data if needed
                if (reportType === 'completeness' || reportType === 'combined') {
                    reportData.data.completeness = completenessData;
                }
                
                hideLoadingModal();
                
                // Generate and download the file
                await downloadReport(reportData, format, reportType);
                
                // Save to backend for history
                try {
                    await fetch(`${API_BASE}/api/reports/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({
                            report_type: reportType,
                            period: period,
                            format: format
                        })
                    });
                    
                    // Reload report history
                    loadReportHistory();
                } catch (historyError) {
                    console.log('Failed to save report history:', historyError);
                }
            } catch (error) {
                hideLoadingModal();
                console.error('Report generation error:', error);
                alert('Failed to generate report: ' + error.message);
            }
}

// Execute export report after type selection
async function executeExportReport() {
    const reportFormat = document.getElementById('reportFormat');
    const reportPeriod = document.getElementById('reportPeriod');
    
    const format = reportFormat ? reportFormat.value : 'pdf';
    const period = reportPeriod ? reportPeriod.value : 'this-month';
    const reportType = selectedReportType;
    
    showLoadingModal('Exporting Data...', `Preparing ${format.toUpperCase()} ${reportType} export`);
            
            try {
                const token = localStorage.getItem('token');
                
                // Fetch all data for both overview and completeness
                const [docsResponse, reqResponse] = await Promise.all([
                    fetch(`${API_BASE}/api/documents?scope=all`, {
                        headers: { 'x-auth-token': token }
                    }),
                    fetch(`${API_BASE}/api/documents/category-requirements`, {
                        headers: { 'x-auth-token': token }
                    })
                ]);
                
                if (!docsResponse.ok || !reqResponse.ok) {
                    throw new Error('Failed to fetch data');
                }
                
                let documents = await docsResponse.json();
                const requirements = await reqResponse.json();
                
                // Apply period filter to documents
                documents = filterDocumentsByPeriod(documents, period, customDateRange);
                
                // === OVERVIEW DATA ===
                const totalDocs = documents.length;
                const approvedDocs = documents.filter(d => d.workflow_status === 'approved' || d.workflow_status === 'locked').length;
                const pendingDocs = documents.filter(d => d.workflow_status === 'pending' || d.workflow_status === 'validated').length;
                const rejectedDocs = documents.filter(d => d.workflow_status === 'rejected').length;
                
                const categoryBreakdown = [
                    { category_name: 'Instruction', total: 0, approved: 0, pending: 0 },
                    { category_name: 'Research', total: 0, approved: 0, pending: 0 },
                    { category_name: 'Extension', total: 0, approved: 0, pending: 0 },
                    { category_name: 'Employment', total: 0, approved: 0, pending: 0 }
                ];
                
                documents.forEach(doc => {
                    const cat = (doc.category || doc.category_name || '').toLowerCase();
                    const idx = { 'instruction': 0, 'research': 1, 'extension': 2, 'employment': 3 }[cat];
                    if (idx !== undefined) {
                        categoryBreakdown[idx].total++;
                        if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                            categoryBreakdown[idx].approved++;
                        } else if (doc.workflow_status === 'pending' || doc.workflow_status === 'validated') {
                            categoryBreakdown[idx].pending++;
                        }
                    }
                });
                
                const deptMap = new Map();
                documents.forEach(doc => {
                    const dept = doc.department_code || 'Other';
                    if (!deptMap.has(dept)) {
                        deptMap.set(dept, { total: 0, approved: 0 });
                    }
                    const data = deptMap.get(dept);
                    data.total++;
                    if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                        data.approved++;
                    }
                });
                
                const departmentBreakdown = Array.from(deptMap.entries()).map(([code, data]) => ({
                    department_code: code,
                    total: data.total,
                    approved: data.approved
                }));
                
                // === COMPLETENESS DATA ===
                const completenessData = [];
                
                requirements.forEach(req => {
                    const dept = req.department_code;
                    const cat = req.category_name;
                    
                    let uploaded = 0;
                    let verified = 0;
                    
                    documents.forEach(doc => {
                        const docDept = doc.department_code;
                        const docCat = (doc.category_display_name || doc.category || '').toLowerCase();
                        
                        if (docDept === dept && cat.toLowerCase() === docCat) {
                            uploaded++;
                            if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
                                verified++;
                            }
                        }
                    });
                    
                    const percentage = req.expected_documents > 0 
                        ? ((verified / req.expected_documents) * 100).toFixed(2) 
                        : 0;
                    
                    completenessData.push({
                        department_code: dept,
                        category_name: cat,
                        required: req.expected_documents,
                        uploaded: uploaded,
                        verified: verified,
                        completeness_percentage: percentage
                    });
                });
                
                // === COMBINED EXPORT DATA ===
                const exportData = {
                    report_type: reportType,
                    data: {}
                };
                
                // Add overview data if needed
                if (reportType === 'overview' || reportType === 'combined') {
                    exportData.data.overview = {
                        statistics: {
                            total_documents: totalDocs,
                            approved: approvedDocs,
                            pending: pendingDocs,
                            rejected: rejectedDocs
                        },
                        category_breakdown: categoryBreakdown,
                        department_breakdown: departmentBreakdown
                    };
                }
                
                // Add completeness data if needed
                if (reportType === 'completeness' || reportType === 'combined') {
                    exportData.data.completeness = completenessData;
                }
                
                hideLoadingModal();
                
                // Download based on format
                if (format === 'pdf') {
                    await downloadPDF(exportData, `DRMS-QA-Export-${new Date().toISOString().split('T')[0]}`, reportType);
                } else if (format === 'excel') {
                    await downloadExcel(exportData, `DRMS-QA-Export-${new Date().toISOString().split('T')[0]}`);
                } else if (format === 'csv') {
                    await downloadCSV(exportData, `DRMS-QA-Export-${new Date().toISOString().split('T')[0]}`);
                }
            } catch (error) {
                hideLoadingModal();
                console.error('Export error:', error);
                alert('Failed to export data: ' + error.message);
            }
}
    
// Generate Gap Report button handler
function initializeGapReportButton() {
    const generateGapReport = document.getElementById('generateGapReport');
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
}

// Initialize all report page handlers
function initializeAllReportHandlers() {
    const reportPeriod = document.getElementById('reportPeriod');
    
    // Custom period handling
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            if (this.value === 'custom') {
                showCustomDateModal();
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
    
    // Initialize gap report button
    initializeGapReportButton();
    
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
                            <td class="py-3">
                                <button class="download-report-btn text-teal-600 hover:text-teal-800 text-sm" 
                                        data-id="${report.id}" 
                                        data-type="${report.report_type}" 
                                        data-format="${report.format}">
                                    Download
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Attach download handlers
        document.querySelectorAll('.download-report-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const reportId = this.getAttribute('data-id');
                const reportType = this.getAttribute('data-type');
                const format = this.getAttribute('data-format');
                
                showLoadingModal('Downloading Report...', 'Preparing your report file');
                
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE}/api/reports/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({
                            report_type: reportType,
                            period: 'this-month',
                            format: format
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        await downloadReport(result, format, reportType);
                    } else {
                        alert('Failed to download report');
                    }
                } catch (error) {
                    console.error('Download error:', error);
                    alert('Failed to download report: ' + error.message);
                } finally {
                    hideLoadingModal();
                }
            });
        });
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
                <button class="download-report-btn-mobile mt-3 text-teal-600 hover:text-teal-800 text-sm" 
                        data-id="${report.id}" 
                        data-type="${report.report_type}" 
                        data-format="${report.format}">
                    Download
                </button>
            </div>
        `).join('');
        
        // Attach mobile download handlers
        document.querySelectorAll('.download-report-btn-mobile').forEach(btn => {
            btn.addEventListener('click', async function() {
                const reportId = this.getAttribute('data-id');
                const reportType = this.getAttribute('data-type');
                const format = this.getAttribute('data-format');
                
                showLoadingModal('Downloading Report...', 'Preparing your report file');
                
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE}/api/reports/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({
                            report_type: reportType,
                            period: 'this-month',
                            format: format
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        await downloadReport(result, format, reportType);
                    } else {
                        alert('Failed to download report');
                    }
                } catch (error) {
                    console.error('Download error:', error);
                    alert('Failed to download report: ' + error.message);
                } finally {
                    hideLoadingModal();
                }
            });
        });
    }
}

// Show loading modal
function showLoadingModal(title, message) {
    const modal = document.getElementById('loadingModal');
    const titleEl = document.getElementById('loadingTitle');
    const messageEl = document.getElementById('loadingMessage');
    
    if (modal) {
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// Hide loading modal
function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Custom date range modal functions
let customDateRange = { startDate: null, endDate: null };
let selectedReportType = 'combined';
let pendingAction = null; // 'generate' or 'export'

// Report type modal functions
function showReportTypeModal(action) {
    console.log('=== SHOW REPORT TYPE MODAL ===');
    console.log('Action:', action);
    pendingAction = action;
    const modal = document.getElementById('reportTypeModal');
    console.log('Modal element found:', !!modal);
    if (modal) {
        console.log('Showing modal...');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        console.log('Modal classes:', modal.className);
    } else {
        console.error('Report type modal not found!');
    }
}

function hideReportTypeModal() {
    console.log('=== HIDE REPORT TYPE MODAL ===');
    const modal = document.getElementById('reportTypeModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    pendingAction = null;
}

// Filter documents by period
function filterDocumentsByPeriod(documents, period, customRange) {
    if (period === 'custom' && customRange.startDate && customRange.endDate) {
        const start = new Date(customRange.startDate);
        const end = new Date(customRange.endDate);
        end.setHours(23, 59, 59, 999); // Include entire end date
        
        return documents.filter(doc => {
            const docDate = new Date(doc.created_at);
            return docDate >= start && docDate <= end;
        });
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(period) {
        case 'today':
            return documents.filter(doc => {
                const docDate = new Date(doc.created_at);
                return docDate >= today;
            });
        
        case 'this-week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return documents.filter(doc => new Date(doc.created_at) >= weekAgo);
        
        case 'this-month':
            return documents.filter(doc => {
                const docDate = new Date(doc.created_at);
                return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
            });
        
        case 'last-month':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            return documents.filter(doc => {
                const docDate = new Date(doc.created_at);
                return docDate >= lastMonth && docDate <= lastMonthEnd;
            });
        
        case 'this-quarter':
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            return documents.filter(doc => new Date(doc.created_at) >= quarterStart);
        
        case 'last-quarter':
            const lastQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
            const lastQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
            return documents.filter(doc => {
                const docDate = new Date(doc.created_at);
                return docDate >= lastQuarterStart && docDate <= lastQuarterEnd;
            });
        
        case 'this-year':
            return documents.filter(doc => {
                const docDate = new Date(doc.created_at);
                return docDate.getFullYear() === now.getFullYear();
            });
        
        default:
            return documents; // Return all if no filter
    }
}

function showCustomDateModal() {
    const modal = document.getElementById('customDateModal');
    const startInput = document.getElementById('customStartDate');
    const endInput = document.getElementById('customEndDate');
    
    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (startInput) startInput.value = firstDay.toISOString().split('T')[0];
    if (endInput) endInput.value = today.toISOString().split('T')[0];
    
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function hideCustomDateModal() {
    const modal = document.getElementById('customDateModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Initialize custom date modal handlers
function initializeModalHandlers() {
    console.log('=== INITIALIZING MODAL HANDLERS ===');
    const cancelBtn = document.getElementById('cancelCustomDate');
    const applyBtn = document.getElementById('applyCustomDate');
    const reportPeriodSelect = document.getElementById('reportPeriod');
    const cancelReportType = document.getElementById('cancelReportType');
    const confirmReportType = document.getElementById('confirmReportType');
    
    console.log('Custom date cancel button:', !!cancelBtn);
    console.log('Custom date apply button:', !!applyBtn);
    console.log('Report type cancel button:', !!cancelReportType);
    console.log('Report type confirm button:', !!confirmReportType);
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('Custom date cancel clicked');
            hideCustomDateModal();
            if (reportPeriodSelect) reportPeriodSelect.value = 'this-month';
        });
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            console.log('Custom date apply clicked');
            const startDate = document.getElementById('customStartDate').value;
            const endDate = document.getElementById('customEndDate').value;
            
            if (!startDate || !endDate) {
                alert('Please select both start and end dates');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                alert('Start date must be before end date');
                return;
            }
            
            customDateRange = { startDate, endDate };
            hideCustomDateModal();
            console.log('Custom date range set:', customDateRange);
        });
    }
    
    // Report type modal handlers
    if (cancelReportType) {
        cancelReportType.addEventListener('click', function() {
            console.log('Report type cancel clicked');
            hideReportTypeModal();
        });
    }
    
    if (confirmReportType) {
        confirmReportType.addEventListener('click', function() {
            console.log('=== REPORT TYPE CONFIRM CLICKED ===');
            const selectedRadio = document.querySelector('input[name="reportType"]:checked');
            console.log('Selected radio:', selectedRadio);
            console.log('Selected value:', selectedRadio ? selectedRadio.value : 'none');
            console.log('Pending action:', pendingAction);
            
            if (selectedRadio) {
                selectedReportType = selectedRadio.value;
                console.log('Report type selected:', selectedReportType);
                
                // Store action before hiding modal (which resets pendingAction)
                const actionToExecute = pendingAction;
                hideReportTypeModal();
                
                // Execute the stored action
                if (actionToExecute === 'generate') {
                    console.log('Executing generate report...');
                    executeGenerateReport();
                } else if (actionToExecute === 'export') {
                    console.log('Executing export report...');
                    executeExportReport();
                } else {
                    console.error('No pending action found!');
                }
            } else {
                console.error('No radio button selected!');
            }
        });
    }
    
    console.log('=== MODAL HANDLERS INITIALIZED ===');
}

// Download report based on format
async function downloadReport(reportData, format, reportType) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `DRMS-QA-${reportType}-${timestamp}`;
    
    if (format === 'csv') {
        downloadCSV(reportData, filename);
    } else if (format === 'excel') {
        downloadExcel(reportData, filename);
    } else if (format === 'pdf') {
        downloadPDF(reportData, filename, reportType);
    }
}

// Download CSV
function downloadCSV(reportData, filename) {
    let csv = '';
    
    // === OVERVIEW SECTION ===
    if (reportData.data.overview) {
        csv += '=== OVERVIEW - SUMMARY STATISTICS ===\n';
        csv += 'Metric,Value\n';
        csv += `Total Documents,${reportData.data.overview.statistics.total_documents}\n`;
        csv += `Approved,${reportData.data.overview.statistics.approved}\n`;
        csv += `Pending,${reportData.data.overview.statistics.pending}\n`;
        csv += `Rejected,${reportData.data.overview.statistics.rejected}\n\n`;
        
        if (reportData.data.overview.category_breakdown) {
            csv += '=== CATEGORY BREAKDOWN ===\n';
            csv += 'Category,Total,Approved,Pending,Approval Rate\n';
            reportData.data.overview.category_breakdown.forEach(cat => {
                const rate = cat.total > 0 ? ((cat.approved / cat.total) * 100).toFixed(1) : 0;
                csv += `${cat.category_name},${cat.total},${cat.approved},${cat.pending},${rate}%\n`;
            });
            csv += '\n';
        }
        
        if (reportData.data.overview.department_breakdown) {
            csv += '=== DEPARTMENT BREAKDOWN ===\n';
            csv += 'Department,Total,Approved,Approval Rate\n';
            reportData.data.overview.department_breakdown.forEach(dept => {
                const rate = dept.total > 0 ? ((dept.approved / dept.total) * 100).toFixed(1) : 0;
                csv += `${dept.department_code},${dept.total},${dept.approved},${rate}%\n`;
            });
            csv += '\n';
        }
    }
    
    // === COMPLETENESS SECTION ===
    if (reportData.data.completeness) {
        csv += '=== COMPLETENESS - DEPARTMENT BREAKDOWN ===\n';
        csv += 'Department,Category,Required,Uploaded,Verified,Completeness %,Status\n';
        reportData.data.completeness.forEach(item => {
            const status = parseFloat(item.completeness_percentage) >= 100 ? 'Complete' : 'Partial';
            csv += `${item.department_code},${item.category_name},${item.required},${item.uploaded},${item.verified},${item.completeness_percentage}%,${status}\n`;
        });
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Download Excel (using CSV format for simplicity)
function downloadExcel(reportData, filename) {
    // For now, use CSV format with .xls extension
    // In production, use a library like SheetJS/xlsx
    downloadCSV(reportData, filename);
}

// Download PDF
function downloadPDF(reportData, filename, reportType) {
    // Create a simple HTML report and print to PDF
    const printWindow = window.open('', '_blank');
    
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${filename}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #0d9488; border-bottom: 3px solid #0d9488; padding-bottom: 10px; margin-bottom: 20px; }
                h2 { color: #374151; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #0d9488; color: white; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9fafb; }
                .stat-box { display: inline-block; padding: 15px 20px; margin: 10px; border: 2px solid #0d9488; border-radius: 8px; min-width: 120px; }
                .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
                .stat-value { font-size: 28px; font-weight: bold; color: #0d9488; margin-top: 5px; }
                .section { page-break-inside: avoid; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #6b7280; font-size: 11px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <h1>DRMS-QA ${reportType === 'overview' ? 'Overview' : reportType === 'completeness' ? 'Completeness' : 'Comprehensive'} Report</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Period:</strong> ${reportData.period || 'Current'}</p>
    `;
    
    // === OVERVIEW SECTION ===
    if (reportData.data.overview) {
        const overview = reportData.data.overview;
        
        htmlContent += `
            <div class="section">
                <h2>Overview - Summary Statistics</h2>
                <div style="margin: 20px 0;">
                    <div class="stat-box">
                        <div class="stat-label">Total Documents</div>
                        <div class="stat-value">${overview.statistics.total_documents}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Approved</div>
                        <div class="stat-value" style="color: #10b981;">${overview.statistics.approved}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Pending</div>
                        <div class="stat-value" style="color: #f59e0b;">${overview.statistics.pending}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Rejected</div>
                        <div class="stat-value" style="color: #ef4444;">${overview.statistics.rejected}</div>
                    </div>
                </div>
            </div>
        `;
        
        if (overview.category_breakdown && overview.category_breakdown.length > 0) {
            htmlContent += `
                <div class="section">
                    <h2>Category Breakdown</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Total</th>
                                <th>Approved</th>
                                <th>Pending</th>
                                <th>Approval Rate</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            overview.category_breakdown.forEach(cat => {
                const rate = cat.total > 0 ? ((cat.approved / cat.total) * 100).toFixed(1) : 0;
                htmlContent += `
                    <tr>
                        <td><strong>${cat.category_name}</strong></td>
                        <td>${cat.total}</td>
                        <td>${cat.approved}</td>
                        <td>${cat.pending}</td>
                        <td>${rate}%</td>
                    </tr>
                `;
            });
            htmlContent += '</tbody></table></div>';
        }
        
        if (overview.department_breakdown && overview.department_breakdown.length > 0) {
            htmlContent += `
                <div class="section">
                    <h2>Department Breakdown</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Total Documents</th>
                                <th>Approved</th>
                                <th>Approval Rate</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            overview.department_breakdown.forEach(dept => {
                const rate = dept.total > 0 ? ((dept.approved / dept.total) * 100).toFixed(1) : 0;
                htmlContent += `
                    <tr>
                        <td><strong>${dept.department_code}</strong></td>
                        <td>${dept.total}</td>
                        <td>${dept.approved}</td>
                        <td>${rate}%</td>
                    </tr>
                `;
            });
            htmlContent += '</tbody></table></div>';
        }
    }
    
    // === COMPLETENESS SECTION ===
    if (reportData.data.completeness && reportData.data.completeness.length > 0) {
        htmlContent += `
            <div class="section" style="page-break-before: always;">
                <h2>Completeness - Department Breakdown</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Category</th>
                            <th>Required</th>
                            <th>Uploaded</th>
                            <th>Verified</th>
                            <th>Completeness</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        reportData.data.completeness.forEach(item => {
            const status = parseFloat(item.completeness_percentage) >= 100 ? 'Complete' : 'Partial';
            const statusColor = status === 'Complete' ? '#10b981' : '#f59e0b';
            htmlContent += `
                <tr>
                    <td><strong>${item.department_code}</strong></td>
                    <td>${item.category_name}</td>
                    <td>${item.required}</td>
                    <td>${item.uploaded}</td>
                    <td>${item.verified}</td>
                    <td><strong>${item.completeness_percentage}%</strong></td>
                    <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
                </tr>
            `;
        });
        htmlContent += '</tbody></table></div>';
    }
    
    htmlContent += `
            <div class="footer">
                <p><strong>College of Teacher Education</strong> - Digital Records Management System (DRMS-QA)</p>
                <p>© ${new Date().getFullYear()} CTE · Quality Assurance Records</p>
                <p style="margin-top: 10px; font-size: 10px; color: #9ca3af;">This report contains ${reportData.data.overview ? reportData.data.overview.statistics.total_documents : 0} documents across ${reportData.data.completeness ? reportData.data.completeness.length : 0} department-category combinations.</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };
}
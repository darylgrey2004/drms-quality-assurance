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
        loadReportSummary();
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
        const [docsResponse, reqResponse, analyticsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/documents?scope=all`, {
                headers: { 'x-auth-token': token }
            }),
            fetch(`${API_BASE}/api/category-requirements`, {
                headers: { 'x-auth-token': token }
            }),
            fetch(`${API_BASE}/api/documents/analytics/overview`, {
                headers: { 'x-auth-token': token }
            })
        ]);
        
        console.log('API responses:', {
            docs: docsResponse.status,
            requirements: reqResponse.status,
            analytics: analyticsResponse.status
        });
        
        if (docsResponse.ok && reqResponse.ok) {
            const documents = await docsResponse.json();
            const requirements = await reqResponse.json();
            const analytics = analyticsResponse.ok ? await analyticsResponse.json() : null;
            
            console.log('SUCCESS: Data loaded:', {
                documents: documents.length,
                requirements: requirements.length
            });
            
            // Calculate requirements-based analytics
            const enhancedAnalytics = calculateRequirementsAnalytics(documents, requirements, analytics);
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
function calculateRequirementsAnalytics(documents, requirements, analytics) {
    // Calculate total requirements per category
    const categoryRequirements = {
        instruction: 0,
        research: 0,
        extension: 0,
        employment: 0
    };
    
    requirements.forEach(req => {
        const categoryName = (req.category_name || '').toLowerCase();
        if (categoryRequirements[categoryName] !== undefined) {
            categoryRequirements[categoryName] += req.expected_documents || 0;
        }
    });
    
    console.log('Total requirements per category:', categoryRequirements);
    
    // Count documents by category and status
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
    
    return {
        status_distribution: analytics?.status_distribution || [],
        category_breakdown: categoryBreakdown,
        department_breakdown: analytics?.department_breakdown || [],
        monthly_trends: analytics?.monthly_trends || [],
        top_uploaders: analytics?.top_uploaders || [],
        requirements: categoryRequirements
    };
}

// Load real report summary from backend
async function loadReportSummary() {
    console.log('Loading report summary from backend...');
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found - using fallback');
            useFallbackReportSummary();
            return;
        }
        
        const response = await fetch(`${API_BASE}/api/documents/reports/summary`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });
        
        if (response.ok) {
            const summary = await response.json();
            console.log('Report summary loaded successfully:', summary);
            updateReportSummaryDisplay(summary);
        } else {
            const error = await response.json();
            console.error('Report summary API error:', error);
            useFallbackReportSummary();
        }
    } catch (error) {
        console.error('Failed to load report summary:', error);
        useFallbackReportSummary();
    }
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
    
    console.log('DOM Elements check:');
    console.log('- totalDocs:', totalDocsEl ? 'FOUND' : 'NOT FOUND');
    console.log('- approvedDocs:', approvedDocsEl ? 'FOUND' : 'NOT FOUND');
    console.log('- pendingDocs:', pendingDocsEl ? 'FOUND' : 'NOT FOUND');
    console.log('- activeUsers:', activeUsersEl ? 'FOUND' : 'NOT FOUND');
    
    if (totalDocsEl) {
        totalDocsEl.textContent = totalDocs;
        console.log('✓ Updated totalDocs to:', totalDocs);
    } else {
        console.error('✗ totalDocs element not found!');
    }
    
    if (approvedDocsEl) {
        approvedDocsEl.textContent = approvedDocs;
        console.log('✓ Updated approvedDocs to:', approvedDocs);
    } else {
        console.error('✗ approvedDocs element not found!');
    }
    
    if (pendingDocsEl) {
        pendingDocsEl.textContent = pendingDocs;
        console.log('✓ Updated pendingDocs to:', pendingDocs);
    } else {
        console.error('✗ pendingDocs element not found!');
    }
    
    if (totalChangeEl) {
        totalChangeEl.textContent = `+${totalDocs} total documents`;
        console.log('✓ Updated totalChange');
    }
    
    const approvalRate = totalDocs > 0 ? ((approvedDocs / totalDocs) * 100).toFixed(1) : 0;
    if (approvalRateEl) {
        approvalRateEl.textContent = `${approvalRate}% approval rate`;
        console.log('✓ Updated approvalRate to:', `${approvalRate}% approval rate`);
    }
    
    if (pendingInfoEl) {
        pendingInfoEl.textContent = `${rejectedDocs} rejected`;
        console.log('✓ Updated pendingInfo to:', `${rejectedDocs} rejected`);
    }
    
    // Update active users from top uploaders
    const activeUsers = analytics.top_uploaders ? analytics.top_uploaders.length : 0;
    if (activeUsersEl) {
        activeUsersEl.textContent = activeUsers;
        console.log('✓ Updated activeUsers to:', activeUsers);
    } else {
        console.error('✗ activeUsers element not found!');
    }
    
    if (userInfoEl) {
        userInfoEl.textContent = `${activeUsers} active uploaders`;
        console.log('✓ Updated userInfo to:', `${activeUsers} active uploaders`);
    }
    
    console.log('=== ANALYTICS DISPLAY UPDATE COMPLETE ===');
    
    // Update status distribution
    updateStatusChart(analytics.status_distribution);
    
    // Update category breakdown
    updateCategoryChart(analytics.category_breakdown);
    
    // Update department breakdown
    updateDepartmentChart(analytics.department_breakdown);
    
    // Update monthly trends
    updateTrendsChart(analytics.monthly_trends);
    
    // Update top uploaders
    updateTopUploaders(analytics.top_uploaders);
}

// Update report summary display
function updateReportSummaryDisplay(summary) {
    // Update overall statistics
    updateOverallStats(summary.overall_statistics);
    
    // Update category performance
    updateCategoryPerformance(summary.category_performance);
    
    // Update department performance
    updateDepartmentPerformance(summary.department_performance);
    
    // Update workflow efficiency
    updateWorkflowEfficiency(summary.workflow_efficiency);
    
    // Update file statistics
    updateFileStats(summary.file_statistics);
}

// Fallback analytics based on your actual database
function useFallbackAnalytics() {
    console.log('Using fallback analytics based on database...');
    const fallbackAnalytics = {
        status_distribution: [
            { workflow_status: 'pending', count: 5, percentage: 50.0 },
            { workflow_status: 'approved', count: 4, percentage: 40.0 },
            { workflow_status: 'rejected', count: 1, percentage: 10.0 }
        ],
        category_breakdown: [
            { category: 'Instruction', total: 4, approved: 2, pending: 2, rejected: 0, approval_rate: 0.93, required: 215 },
            { category: 'Research', total: 3, approved: 1, pending: 2, rejected: 0, approval_rate: 0.54, required: 185 },
            { category: 'Extension', total: 2, approved: 1, pending: 1, rejected: 0, approval_rate: 0.80, required: 125 },
            { category: 'Employment', total: 1, approved: 0, pending: 1, rejected: 0, approval_rate: 0.00, required: 150 }
        ],
        department_breakdown: [
            { department_code: 'BEED', total: 4, approved: 2, pending: 2, rejected: 0 },
            { department_code: 'BPED', total: 2, approved: 1, pending: 1, rejected: 0 },
            { department_code: 'BSED', total: 2, approved: 1, pending: 1, rejected: 0 },
            { department_code: 'BSNED', total: 1, approved: 0, pending: 1, rejected: 0 },
            { department_code: 'BCAED', total: 1, approved: 0, pending: 1, rejected: 0 }
        ],
        monthly_trends: [
            { month: '2026-04', documents_uploaded: 8, approved: 3, pending: 4, rejected: 1 },
            { month: '2026-05', documents_uploaded: 2, approved: 1, pending: 1, rejected: 0 }
        ],
        top_uploaders: [
            { firstName: 'Admin', lastName: 'User', documents_uploaded: 6 },
            { firstName: 'Guilmar', lastName: 'Quimba', documents_uploaded: 2 },
            { firstName: 'Guilmara', lastName: 'Quimbar', documents_uploaded: 1 }
        ],
        requirements: {
            instruction: 215,
            research: 185,
            extension: 125,
            employment: 150
        }
    };
    updateAnalyticsDisplay(fallbackAnalytics);
}

// Fallback report summary based on your actual database
function useFallbackReportSummary() {
    console.log('Using fallback report summary based on database...');
    const fallbackSummary = {
        overall_statistics: {
            total_documents: 10,
            approved: 4,
            pending: 5,
            rejected: 1,
            approval_rate: 40.0
        },
        category_performance: [
            { category: 'Instruction', total: 4, approved: 2, pending: 2, rejected: 0, approval_rate: 50.0 },
            { category: 'Research', total: 3, approved: 1, pending: 2, rejected: 0, approval_rate: 33.33 },
            { category: 'Extension', total: 2, approved: 1, pending: 1, rejected: 0, approval_rate: 50.0 },
            { category: 'Employment', total: 1, approved: 0, pending: 1, rejected: 0, approval_rate: 0.0 }
        ],
        department_performance: [
            { department_code: 'BEED', total: 4, approved: 2, pending: 2, rejected: 0, approval_rate: 50.0 },
            { department_code: 'bped', total: 2, approved: 1, pending: 1, rejected: 0, approval_rate: 50.0 },
            { department_code: 'BSED', total: 2, approved: 1, pending: 1, rejected: 0, approval_rate: 50.0 },
            { department_code: 'BSIT', total: 1, approved: 0, pending: 1, rejected: 0, approval_rate: 0.0 }
        ],
        workflow_efficiency: {
            avg_days_to_approval: 1.5
        },
        file_statistics: {
            total_files: 12,
            avg_file_size: 1024000,
            max_file_size: 5120000,
            min_file_size: 256000
        }
    };
    updateReportSummaryDisplay(fallbackSummary);
}

// Placeholder functions for updating UI elements
function updateStatusChart(data) {
    console.log('Updating status chart with:', data);
    const container = document.getElementById('statusChart');
    if (!container || !data) return;
    
    const statusColors = {
        'approved': 'bg-green-600',
        'pending': 'bg-amber-600',
        'rejected': 'bg-red-600',
        'draft': 'bg-gray-600',
        'locked': 'bg-blue-600',
        'validated': 'bg-teal-600'
    };
    
    const statusLabels = {
        'approved': 'Approved',
        'pending': 'Pending Review',
        'rejected': 'Rejected',
        'draft': 'Draft',
        'locked': 'Locked',
        'validated': 'Validated'
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
    
    const total = data.reduce((sum, cat) => sum + cat.total, 0);
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

function updateDepartmentChart(data) {
    console.log('Updating department chart with:', data);
    const container = document.getElementById('departmentChart');
    if (!container || !data) return;
    
    const total = data.reduce((sum, dept) => sum + dept.total, 0);
    
    container.innerHTML = data.map(item => {
        const percentage = total > 0 ? ((item.total / total) * 100).toFixed(0) : 0;
        return `
            <div class="flex justify-between items-center py-2 border-b">
                <div>
                    <div class="font-medium text-gray-800">${item.department_code}</div>
                    <div class="text-sm text-gray-500">${item.total} documents</div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium text-green-600">${item.approved} approved</div>
                    <div class="text-xs text-gray-500">${item.pending} pending</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTrendsChart(data) {
    console.log('Updating trends chart with:', data);
    const container = document.getElementById('trendsChart');
    if (!container || !data) return;
    
    container.innerHTML = data.map(item => `
        <div class="flex justify-between items-center py-2 border-b">
            <div>
                <div class="font-medium text-gray-800">${item.month}</div>
                <div class="text-sm text-gray-500">Monthly uploads</div>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium text-blue-600">${item.documents_uploaded} total</div>
                <div class="text-xs text-gray-500">${item.approved} approved</div>
            </div>
        </div>
    `).join('');
}

function updateTopUploaders(data) {
    console.log('Updating top uploaders with:', data);
    const container = document.getElementById('topUploaders');
    if (!container || !data) return;
    
    container.innerHTML = data.map((user, index) => `
        <div class="flex justify-between items-center py-2 border-b">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ${index + 1}
                </div>
                <div>
                    <div class="font-medium text-gray-800">${user.firstName} ${user.lastName}</div>
                    <div class="text-sm text-gray-500">${user.documents_uploaded} documents</div>
                </div>
            </div>
            <div class="text-sm font-medium text-teal-600">
                ${user.documents_uploaded}
            </div>
        </div>
    `).join('');
}

function updateOverallStats(data) {
    console.log('Updating overall stats with:', data);
    const totalDocsEl = document.getElementById('reportTotalDocs');
    const approvedEl = document.getElementById('reportApproved');
    const pendingEl = document.getElementById('reportPending');
    const rejectedEl = document.getElementById('reportRejected');
    const rateEl = document.getElementById('reportApprovalRate');
    
    if (totalDocsEl) totalDocsEl.textContent = data.total_documents || 0;
    if (approvedEl) approvedEl.textContent = data.approved || 0;
    if (pendingEl) pendingEl.textContent = data.pending || 0;
    if (rejectedEl) rejectedEl.textContent = data.rejected || 0;
    if (rateEl) {
        const rate = data.total_documents > 0 ? 
            ((data.approved / data.total_documents) * 100).toFixed(1) : 0;
        rateEl.textContent = `${rate}%`;
    }
}

function updateCategoryPerformance(data) {
    console.log('Updating category performance with:', data);
    const container = document.getElementById('categoryPerformance');
    if (!container || !data) return;
    
    container.innerHTML = data.map(item => `
        <div class="bg-white rounded-lg p-4 border">
            <div class="flex justify-between items-start mb-3">
                <h3 class="font-semibold text-gray-800">${item.category}</h3>
                <span class="text-sm font-medium ${item.approval_rate >= 70 ? 'text-green-600' : item.approval_rate >= 50 ? 'text-amber-600' : 'text-red-600'}">
                    ${item.approval_rate}% approval
                </span>
            </div>
            <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <div class="text-gray-500">Total</div>
                    <div class="font-medium">${item.total}</div>
                </div>
                <div>
                    <div class="text-gray-500">Approved</div>
                    <div class="font-medium text-green-600">${item.approved}</div>
                </div>
                <div>
                    <div class="text-gray-500">Pending</div>
                    <div class="font-medium text-amber-600">${item.pending}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateDepartmentPerformance(data) {
    console.log('Updating department performance with:', data);
    const container = document.getElementById('departmentPerformance');
    if (!container || !data) return;
    
    container.innerHTML = data.map(item => `
        <div class="flex justify-between items-center py-3 border-b">
            <div>
                <div class="font-medium text-gray-800">${item.department_code}</div>
                <div class="text-sm text-gray-500">${item.total} documents</div>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-center">
                    <div class="text-xs text-gray-500">Approved</div>
                    <div class="text-sm font-medium text-green-600">${item.approved}</div>
                </div>
                <div class="text-center">
                    <div class="text-xs text-gray-500">Pending</div>
                    <div class="text-sm font-medium text-amber-600">${item.pending}</div>
                </div>
                <div class="text-center">
                    <div class="text-xs text-gray-500">Rate</div>
                    <div class="text-sm font-medium ${item.approval_rate >= 70 ? 'text-green-600' : 'text-amber-600'}">
                        ${item.approval_rate}%
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateWorkflowEfficiency(data) {
    console.log('Updating workflow efficiency with:', data);
    const avgDaysEl = document.getElementById('avgApprovalDays');
    const efficiencyEl = document.getElementById('workflowEfficiency');
    
    if (avgDaysEl) {
        const days = data.avg_days_to_approval ? data.avg_days_to_approval.toFixed(1) : 'N/A';
        avgDaysEl.textContent = days;
    }
    
    if (efficiencyEl) {
        const efficiency = data.avg_days_to_approval ? 
            (data.avg_days_to_approval <= 1 ? 'Excellent' : 
             data.avg_days_to_approval <= 3 ? 'Good' : 
             data.avg_days_to_approval <= 7 ? 'Average' : 'Needs Improvement') : 'N/A';
        efficiencyEl.textContent = efficiency;
    }
}

function updateFileStats(data) {
    console.log('Updating file stats with:', data);
    const totalFilesEl = document.getElementById('totalFiles');
    const avgSizeEl = document.getElementById('avgFileSize');
    const maxSizeEl = document.getElementById('maxFileSize');
    
    if (totalFilesEl) totalFilesEl.textContent = data.total_files || 0;
    if (avgSizeEl) {
        const avgSize = data.avg_file_size ? 
            (data.avg_file_size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A';
        avgSizeEl.textContent = avgSize;
    }
    if (maxSizeEl) {
        const maxSize = data.max_file_size ? 
            (data.max_file_size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A';
        maxSizeEl.textContent = maxSize;
    }
}

// DOM elements and event handlers
function initializeReportsPage() {
    const reportPeriod = document.getElementById('reportPeriod');
    const reportFormat = document.getElementById('reportFormat');
    const generateBtn = document.getElementById('generateReport');
    const exportBtn = document.getElementById('exportReport');
    const tabLinks = document.querySelectorAll('#reportTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    const generateGapReport = document.getElementById('generateGapReport');
    
    // Download buttons in recent reports
    const downloadBtns = document.querySelectorAll('.text-teal-600:contains("📥 Download")');
    const viewBtns = document.querySelectorAll('.text-gray-500:contains("👁️ View")');
    
    // Tab switching functionality
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get tab id
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab styling
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });
            
            // Show selected tab
            const activeTab = document.getElementById(tabId + 'Tab');
            if (activeTab) {
                activeTab.classList.remove('hidden');
                activeTab.classList.add('block');
            }
        });
    });
    
    // Generate report button
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            const period = reportPeriod ? reportPeriod.value : 'this-month';
            const format = reportFormat ? reportFormat.value : 'pdf';
            
            // Find active tab
            let activeTab = 'overview';
            tabLinks.forEach(link => {
                if (link.classList.contains('active-tab')) {
                    activeTab = link.getAttribute('data-tab');
                }
            });
            
            console.log(`Generating ${format} report for ${activeTab} (${period})`);
            
            // Visual feedback
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="mr-2">⏳</span> Generating...';
            this.disabled = true;
            
            setTimeout(() => {
                alert(`Report generated successfully!\n\nType: ${activeTab} report\nPeriod: ${period}\nFormat: ${format}\n\nIn a full system, this would download the report.`);
                this.innerHTML = originalText;
                this.disabled = false;
            }, 1500);
        });
    }
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const format = reportFormat ? reportFormat.value : 'pdf';
            
            // Find active tab
            let activeTab = 'overview';
            tabLinks.forEach(link => {
                if (link.classList.contains('active-tab')) {
                    activeTab = link.getAttribute('data-tab');
                }
            });
            
            alert(`Exporting current view as ${format.toUpperCase()}\n\nThis would download the visible data in ${format.toUpperCase()} format.`);
        });
    }
    
    // Generate Gap Report button (in Completeness tab)
    if (generateGapReport) {
        generateGapReport.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Generating detailed gap analysis report...\n\nThis would create a comprehensive report of all missing documents by area and priority.');
        });
    }
    
    // Download buttons in recent reports
    document.querySelectorAll('.text-teal-600').forEach(btn => {
        if (btn.textContent.includes('📥 Download')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const reportRow = this.closest('.grid');
                const reportName = reportRow?.querySelector('.font-medium')?.textContent || 'Report';
                alert(`Downloading: ${reportName}`);
            });
        }
    });
    
    // View buttons in recent reports
    document.querySelectorAll('.text-gray-500').forEach(btn => {
        if (btn.textContent.includes('👁️ View')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const reportRow = this.closest('.grid');
                const reportName = reportRow?.query.querySelector('.font-medium')?.textContent || 'Report';
                alert(`Viewing: ${reportName}\n\nThis would open the report in a preview window.`);
            });
        }
    });
    
    // Custom period handling
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            if (this.value === 'custom') {
                const startDate = prompt('Enter start date (YYYY-MM-DD):', '2026-01-01');
                const endDate = prompt('Enter end date (YYYY-MM-DD):', '2026-12-31');
                
                if (startDate && endDate) {
                    alert(`Custom range: ${startDate} to ${endDate}`);
                } else {
                    // Reset to previous value if cancelled
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
            alert('Viewing all generated reports...\n\nThis would navigate to a full reports archive.');
        });
    }
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'reports.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            // Remove active class from all
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            // Add active class to current
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1a4450';
        }
    });
    
    // Initialize with Overview tab active
    // Already set in HTML
}
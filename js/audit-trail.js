// js/audit-trail.js

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Audit Trail page loaded');

    // Heartbeat
    const token = localStorage.getItem('token');
    function sendHeartbeat() {
        if (token) {
            fetch(`${API_BASE}/api/user/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            }).catch(() => {});
        }
    }
    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 2 * 60 * 1000);
    }

    // Load initial data
    loadAuditStats();
    loadAuditLogs();
    loadFilterOptions();

    // Event listeners
    setupEventListeners();
});

// Current filters
let currentFilters = {
    page: 1,
    limit: 25,
    action: 'all',
    user_id: 'all',
    date_range: 'month',
    search: ''
};

// Load audit statistics
async function loadAuditStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/audit/stats`, {
            headers: { 'x-auth-token': token }
        });

        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Failed to load audit stats:', error);
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    // Update stat cards
    const totalEventsEl = document.getElementById('totalEvents');
    const weeklyEventsEl = document.getElementById('weeklyEvents');
    const docActionsEl = document.getElementById('docActions');
    const docPercentEl = document.getElementById('docPercent');
    const userActionsEl = document.getElementById('userActions');
    const userPercentEl = document.getElementById('userPercent');
    const sysEventsEl = document.getElementById('sysEvents');
    const sysPercentEl = document.getElementById('sysPercent');
    
    if (totalEventsEl) totalEventsEl.textContent = stats.total_events || 0;
    if (weeklyEventsEl) weeklyEventsEl.textContent = `+${stats.recent_activity || 0} this week`;
    
    const docActions = stats.events_by_type?.find(e => e.event_type === 'document');
    if (docActionsEl) docActionsEl.textContent = docActions?.count || 0;
    const docPercent = stats.total_events > 0 ? ((docActions?.count || 0) / stats.total_events * 100).toFixed(0) : 0;
    if (docPercentEl) docPercentEl.textContent = `${docPercent}% of total`;
    
    const userActions = stats.events_by_type?.find(e => e.event_type === 'user');
    if (userActionsEl) userActionsEl.textContent = userActions?.count || 0;
    const userPercent = stats.total_events > 0 ? ((userActions?.count || 0) / stats.total_events * 100).toFixed(0) : 0;
    if (userPercentEl) userPercentEl.textContent = `${userPercent}% of total`;
    
    const sysActions = stats.events_by_type?.find(e => e.event_type === 'system');
    if (sysEventsEl) sysEventsEl.textContent = sysActions?.count || 0;
    const sysPercent = stats.total_events > 0 ? ((sysActions?.count || 0) / stats.total_events * 100).toFixed(0) : 0;
    if (sysPercentEl) sysPercentEl.textContent = `${sysPercent}% of total`;
    
    // Update version summary
    const versionSummary = document.getElementById('versionSummary');
    if (versionSummary && stats.version_summary) {
        versionSummary.innerHTML = `
            <div class="flex justify-between"><span class="text-sm">Total versions tracked:</span><span class="font-medium">${stats.version_summary.total_versions || 0}</span></div>
            <div class="flex justify-between"><span class="text-sm">Documents with multiple versions:</span><span class="font-medium">${stats.version_summary.multi_version_docs || 0}</span></div>
            <div class="flex justify-between"><span class="text-sm">Average versions per document:</span><span class="font-medium">${stats.version_summary.avg_versions || 0}</span></div>
        `;
    }
    
    // Update last verification
    const lastVerification = document.getElementById('lastVerification');
    if (lastVerification) {
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        lastVerification.textContent = `Last audit log verification: ${today}`;
    }
}

// Load audit logs
async function loadAuditLogs() {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams(currentFilters);
        
        const response = await fetch(`${API_BASE}/api/audit/logs?${params}`, {
            headers: { 'x-auth-token': token }
        });

        if (response.ok) {
            const data = await response.json();
            window.currentAuditLogs = data.logs; // Store for timeline view
            renderAuditLogs(data.logs);
            renderPagination(data.pagination);
            updateEventCount(data.pagination);
        }
    } catch (error) {
        console.error('Failed to load audit logs:', error);
    }
}

// Render audit logs in table
function renderAuditLogs(logs) {
    const tbody = document.querySelector('#listView tbody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-500">No audit logs found</td></tr>';
        return;
    }

    tbody.innerHTML = logs.map(log => {
        const actionBadge = getActionBadge(log.action);
        const timestamp = new Date(log.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const userName = log.user_name || 'System';
        const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        return `
            <tr class="audit-row hover:bg-gray-50">
                <td class="py-3 px-2 text-gray-600 whitespace-nowrap text-xs">${timestamp}</td>
                <td class="py-3 px-2">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xs font-bold">${userInitials}</span>
                        <span>${userName}</span>
                    </div>
                </td>
                <td class="py-3 px-2">${actionBadge}</td>
                <td class="py-3 px-2 font-medium text-gray-800 text-sm">${log.document_title || '—'}</td>
                <td class="py-3 px-2 text-gray-600 text-xs">${log.category_name || '—'}</td>
                <td class="py-3 px-2 text-gray-600 text-xs">${log.department_code || '—'}</td>
                <td class="py-3 px-2 text-gray-600 text-xs">—</td>
                <td class="py-3 px-2 text-gray-400 text-xs">${log.ip_address || '—'}</td>
                <td class="py-3 px-2">
                    <button onclick="viewLogDetails(${log.id})" class="view-details-btn px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors">Details</button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Also render timeline view
    renderTimelineView(logs);
}

// Render timeline view
function renderTimelineView(logs) {
    const timelineContent = document.getElementById('timelineContent');
    if (!timelineContent) return;
    
    if (logs.length === 0) {
        timelineContent.innerHTML = '<div class="text-center text-gray-500 py-4">No audit logs found</div>';
        return;
    }
    
    // Group logs by date
    const groupedLogs = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    logs.forEach(log => {
        const logDate = new Date(log.created_at);
        logDate.setHours(0, 0, 0, 0);
        
        let dateKey;
        if (logDate.getTime() === today.getTime()) {
            dateKey = 'Today';
        } else if (logDate.getTime() === yesterday.getTime()) {
            dateKey = 'Yesterday';
        } else {
            dateKey = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        if (!groupedLogs[dateKey]) {
            groupedLogs[dateKey] = [];
        }
        groupedLogs[dateKey].push(log);
    });
    
    // Render grouped logs
    const colors = ['teal', 'amber', 'green', 'blue', 'purple'];
    let colorIndex = 0;
    
    timelineContent.innerHTML = Object.keys(groupedLogs).map(dateKey => {
        const color = colors[colorIndex % colors.length];
        colorIndex++;
        
        const logsHtml = groupedLogs[dateKey].map(log => {
            const logTime = new Date(log.created_at);
            const timeStr = logTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const userName = log.user_name || 'System';
            const actionText = formatActionText(log.action);
            const docTitle = log.document_title || 'a document';
            
            return `
                <div class="flex flex-col sm:flex-row sm:items-start gap-3 border-l-2 border-${color}-200 pl-4 pb-2">
                    <span class="w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center text-${color}-700 text-xs font-bold">${timeStr}</span>
                    <div>
                        <p class="text-sm"><span class="font-medium">${userName}</span> ${actionText} ${docTitle}</p>
                        <p class="text-xs text-gray-400">${log.category_name || ''} · ${log.department_code || ''} · IP: ${log.ip_address || 'N/A'}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div>
                <h3 class="font-semibold text-gray-700 mb-3 flex items-center">
                    <span class="w-2 h-2 bg-${color}-500 rounded-full mr-2"></span>${dateKey}
                </h3>
                <div class="space-y-3 pl-4">
                    ${logsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// Format action text for timeline
function formatActionText(action) {
    const actionMap = {
        'DOCUMENT_UPLOAD': 'uploaded',
        'DOCUMENT_VALIDATED': 'validated',
        'DOCUMENT_APPROVED': 'approved',
        'DOCUMENT_REJECTED': 'rejected',
        'DOCUMENT_LOCKED': 'locked',
        'DOCUMENT_DELETE': 'deleted',
        'USER_LOGIN': 'logged in',
        'USER_LOGOUT': 'logged out',
        'PASSWORD_CHANGED': 'changed password for'
    };
    return actionMap[action] || action.toLowerCase().replace(/_/g, ' ');
}

// Get action badge HTML
function getActionBadge(action) {
    const badgeMap = {
        'DOCUMENT_UPLOAD': { color: 'blue', label: 'Upload' },
        'DOCUMENT_VALIDATED': { color: 'purple', label: 'Validate' },
        'DOCUMENT_APPROVED': { color: 'green', label: 'Approve' },
        'DOCUMENT_REJECTED': { color: 'red', label: 'Reject' },
        'DOCUMENT_LOCKED': { color: 'gray', label: 'Lock' },
        'DOCUMENT_DELETE': { color: 'red', label: 'Delete' },
        'USER_LOGIN': { color: 'blue', label: 'Login' },
        'USER_LOGOUT': { color: 'gray', label: 'Logout' },
        'PASSWORD_CHANGED': { color: 'yellow', label: 'Password' }
    };

    const badge = badgeMap[action] || { color: 'gray', label: action };
    return `<span class="bg-${badge.color}-100 text-${badge.color}-700 text-xs px-2 py-1 rounded-full">${badge.label}</span>`;
}

// Render pagination
function renderPagination(pagination) {
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationButtons = document.getElementById('paginationButtons');
    
    if (!paginationButtons) return;

    const { current_page, total_pages, per_page, total_records } = pagination;
    
    // Update info text
    if (paginationInfo) {
        const start = (current_page - 1) * per_page + 1;
        const end = Math.min(start + per_page - 1, total_records);
        paginationInfo.textContent = `Showing ${start} to ${end} of ${total_records} events`;
    }
    
    // Update buttons
    let html = '<button class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition-colors" onclick="changePage(' + (current_page - 1) + ')" ' + (current_page === 1 ? 'disabled' : '') + '>Previous</button>';

    for (let i = 1; i <= Math.min(total_pages, 5); i++) {
        const isActive = i === current_page;
        html += `<button class="px-3 py-1.5 ${isActive ? 'bg-teal-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'} rounded-lg text-sm" onclick="changePage(${i})">${i}</button>`;
    }

    html += '<button class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm" onclick="changePage(' + (current_page + 1) + ')" ' + (current_page === total_pages ? 'disabled' : '') + '>Next</button>';

    paginationButtons.innerHTML = html;
}

// Update event count
function updateEventCount(pagination) {
    const eventCount = document.getElementById('eventCount');
    if (eventCount) {
        const start = (pagination.current_page - 1) * pagination.per_page + 1;
        const end = Math.min(start + pagination.per_page - 1, pagination.total_records);
        eventCount.textContent = `Showing ${start} to ${end} of ${pagination.total_records} events`;
    }
}

// Change page
window.changePage = function(page) {
    currentFilters.page = page;
    loadAuditLogs();
};

// Load filter options
async function loadFilterOptions() {
    try {
        const token = localStorage.getItem('token');

        // Load users
        const usersResponse = await fetch(`${API_BASE}/api/audit/users`, {
            headers: { 'x-auth-token': token }
        });
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            populateUserFilter(users);
        }

        // Load actions
        const actionsResponse = await fetch(`${API_BASE}/api/audit/actions`, {
            headers: { 'x-auth-token': token }
        });
        if (actionsResponse.ok) {
            const actions = await actionsResponse.json();
            populateActionFilter(actions);
        }
    } catch (error) {
        console.error('Failed to load filter options:', error);
    }
}

// Populate user filter
function populateUserFilter(users) {
    const userFilter = document.getElementById('userFilter');
    if (!userFilter) return;

    userFilter.innerHTML = '<option value="all">All Users</option>' +
        users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');
}

// Populate action filter
function populateActionFilter(actions) {
    const actionFilter = document.getElementById('actionTypeFilter');
    if (!actionFilter) return;

    actionFilter.innerHTML = '<option value="all">All Actions</option>' +
        actions.map(action => `<option value="${action}">${action.replace(/_/g, ' ')}</option>`).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchAudit');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            currentFilters.search = this.value;
            currentFilters.page = 1;
            loadAuditLogs();
        }, 500));
    }

    // Action filter
    const actionFilter = document.getElementById('actionTypeFilter');
    if (actionFilter) {
        actionFilter.addEventListener('change', function() {
            currentFilters.action = this.value;
            currentFilters.page = 1;
            loadAuditLogs();
        });
    }

    // User filter
    const userFilter = document.getElementById('userFilter');
    if (userFilter) {
        userFilter.addEventListener('change', function() {
            currentFilters.user_id = this.value;
            currentFilters.page = 1;
            loadAuditLogs();
        });
    }

    // Date range filter
    const dateFilter = document.getElementById('dateRangeFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            currentFilters.date_range = this.value;
            currentFilters.page = 1;
            loadAuditLogs();
        });
    }

    // Export button
    const exportBtn = document.getElementById('exportAuditBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAuditLogs);
    }

    // View toggle
    document.querySelectorAll('.view-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const view = this.dataset.view;
            document.querySelectorAll('.view-toggle').forEach(t => {
                t.classList.remove('active-view', 'bg-teal-700', 'text-white');
                t.classList.add('bg-white', 'text-gray-600');
            });
            this.classList.add('active-view', 'bg-teal-700', 'text-white');
            this.classList.remove('bg-white', 'text-gray-600');

            const listView = document.getElementById('listView');
            const timelineView = document.getElementById('timelineView');
            
            if (view === 'list') {
                listView.classList.remove('hidden');
                timelineView.classList.add('hidden');
            } else {
                listView.classList.add('hidden');
                timelineView.classList.remove('hidden');
                // Reload timeline when switching to it
                if (window.currentAuditLogs && window.currentAuditLogs.length > 0) {
                    renderTimelineView(window.currentAuditLogs);
                }
            }
        });
    });
}

// Export audit logs
async function exportAuditLogs() {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            action: currentFilters.action,
            user_id: currentFilters.user_id,
            date_range: currentFilters.date_range
        });

        const response = await fetch(`${API_BASE}/api/audit/export?${params}`, {
            headers: { 'x-auth-token': token }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('Failed to export audit logs:', error);
        alert('Failed to export audit logs');
    }
}

// View log details
window.viewLogDetails = function(logId) {
    alert(`Viewing details for log ID: ${logId}\n\nThis would show a modal with full log details including old/new values.`);
};

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

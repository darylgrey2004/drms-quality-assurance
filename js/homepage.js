// js/homepage.js

const API_BASE = 'http://localhost:3000';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Homepage JS loaded successfully');
    
    // ── Role-based access control ──
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('=== HOMEPAGE AUTH DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('User string from localStorage:', userStr);
    
    // Check if token exists
    if (!token) {
        console.log('ERROR: No token found - redirecting to landing');
        window.location.href = 'landing.html';
        return;
    }
    
    // Parse user object
    let user;
    try {
        user = JSON.parse(userStr || '{}');
        console.log('Parsed user object:', JSON.stringify(user));
    } catch (e) {
        console.log('ERROR: Failed to parse user object:', e);
        // Don't redirect - try to continue with token only
        console.log('Attempting to continue with token only...');
        user = {};
    }
    
    // Check if user has ID - if not, try to fetch from backend
    if (!user || !user.id) {
        console.log('WARNING: User object missing or no user.id');
        console.log('User object:', user);
        console.log('Attempting to continue anyway - backend will validate token');
        // Don't redirect immediately - let the page load and backend will validate
    }
    
    // Check if user has role
    if (!user.role) {
        console.log('WARNING: User object has no role property');
        console.log('User object keys:', Object.keys(user));
        console.log('Attempting to continue anyway - backend will validate token');
        // Don't redirect immediately - let the page load
    }
    
    // Only check role if we have it
    if (user.role) {
        const role = (user.role || '').toLowerCase().trim();
        console.log('User role (normalized):', role);
        
        // Redirect non-admin/dean users to their appropriate dashboards
        if (role === 'faculty' || role === 'department-head') {
            console.log('Redirecting to user-dashboard.html for role:', role);
            window.location.href = 'user-dashboard.html';
            return;
        }
        
        if (role === 'evaluator') {
            console.log('Redirecting to evaluator-dashboard.html');
            window.location.href = 'evaluator-dashboard.html';
            return;
        }
        
        // Only admin and dean can access homepage
        if (role !== 'admin' && role !== 'dean') {
            console.log('ERROR: Role not allowed for homepage:', role);
            alert(`Your role '${user.role}' cannot access the admin dashboard. Redirecting...`);
            window.location.href = 'landing.html';
            return;
        }
        
        console.log('✓ Auth check passed - User is', role);
    } else {
        console.log('⚠ No role found - continuing with token validation only');
    }
    
    console.log('=== END AUTH DEBUG ===');
    
    console.log('✓ Loading homepage data...');
    console.log('=== END AUTH DEBUG ===');
    
    // Load dashboard data
    loadDashboardData();
    
    // Load recent documents and activities
    loadRecentDocuments();
    loadRecentActivities();
    
    // ── Heartbeat: Update lastActive status ──
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
    
    // Add click handlers for document action buttons (👁️ and 📎)
    const viewButtons = document.querySelectorAll('button.hover\\:underline');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Get the button emoji to determine action
            const buttonText = this.textContent.trim();
            
            if (buttonText === '👁️') {
                console.log('View document clicked - would open document viewer');
                alert('Document viewer would open here (demo functionality)');
            } else if (buttonText === '📎') {
                console.log('Attachment clicked - would show attachments');
                alert('Document attachments would be shown here (demo functionality)');
            }
        });
    });
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'homepage.html';
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
});

// Load dashboard data from backend
async function loadDashboardData() {
    const token = localStorage.getItem('token');
    
    try {
        console.log('Loading dashboard data from backend...');
        
        // Fetch documents and requirements
        const [docsResponse, reqResponse] = await Promise.all([
            fetch(`${API_BASE}/api/documents?scope=all`, {
                headers: { 'x-auth-token': token }
            }),
            fetch(`${API_BASE}/api/documents/category-requirements`, {
                headers: { 'x-auth-token': token }
            })
        ]);
        
        console.log('Documents response:', docsResponse.status);
        console.log('Requirements response:', reqResponse.status);
        
        if (!docsResponse.ok || !reqResponse.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const documents = await docsResponse.json();
        const requirements = await reqResponse.json();
        
        console.log('Documents loaded:', documents.length);
        console.log('Requirements loaded:', requirements.length);
        
        // Calculate statistics
        updateDashboardStats(documents, requirements);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Use fallback data
        useFallbackData();
    }
}

function updateDashboardStats(documents, requirements) {
    console.log('Updating dashboard stats...');
    
    // Calculate total requirements per category (sum across all departments)
    const categoryRequirements = {
        instruction: 0,
        research: 0,
        extension: 0,
        employment: 0
    };
    
    // Sum up requirements from all departments
    requirements.forEach(req => {
        const categoryName = (req.category_name || '').toLowerCase();
        if (categoryRequirements[categoryName] !== undefined) {
            categoryRequirements[categoryName] += req.expected_documents || 0;
        }
    });
    
    console.log('Total requirements per category:', categoryRequirements);
    
    // Count approved documents per category
    const approvedDocs = {
        instruction: 0,
        research: 0,
        extension: 0,
        employment: 0
    };
    
    documents.forEach(doc => {
        if (doc.workflow_status === 'approved' || doc.workflow_status === 'locked') {
            const category = (doc.category || doc.category_name || '').toLowerCase();
            if (approvedDocs[category] !== undefined) {
                approvedDocs[category]++;
            }
        }
    });
    
    console.log('Approved documents per category:', approvedDocs);
    
    // Update KPI cards
    const totalRequired = Object.values(categoryRequirements).reduce((a, b) => a + b, 0);
    const totalApproved = Object.values(approvedDocs).reduce((a, b) => a + b, 0);
    const totalPending = documents.filter(d => d.workflow_status === 'pending' || d.workflow_status === 'validated').length;
    const totalRejected = documents.filter(d => d.workflow_status === 'rejected').length;
    const totalDocs = documents.length;
    
    console.log('KPI totals:', { totalDocs, totalApproved, totalPending, totalRejected, totalRequired });
    
    document.getElementById('totalDocs').textContent = totalDocs;
    document.getElementById('approvedDocs').textContent = totalApproved;
    document.getElementById('pendingDocs').textContent = totalPending;
    
    const approvalRate = totalRequired > 0 ? ((totalApproved / totalRequired) * 100).toFixed(1) : 0;
    document.getElementById('approvalRate').textContent = `${approvalRate}% of required`;
    document.getElementById('monthlyChange').textContent = `${totalApproved}/${totalRequired} required`;
    
    // Update category cards with requirements
    updateCategoryCard('instruction', approvedDocs.instruction, categoryRequirements.instruction);
    updateCategoryCard('research', approvedDocs.research, categoryRequirements.research);
    updateCategoryCard('extension', approvedDocs.extension, categoryRequirements.extension);
    updateCategoryCard('employment', approvedDocs.employment, categoryRequirements.employment);
}

function updateCategoryCard(category, approved, required) {
    const percentage = required > 0 ? ((approved / required) * 100).toFixed(0) : 0;
    const missing = Math.max(0, required - approved);
    
    console.log(`Updating ${category} card:`, { approved, required, percentage, missing });
    
    // Find the card by looking for specific text content
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach(card => {
        const categoryText = card.querySelector('.font-medium.text-gray-700');
        if (categoryText && categoryText.textContent.trim() === category.charAt(0).toUpperCase() + category.slice(1)) {
            // Update count (top right badge)
            const countSpan = card.querySelector('.text-sm.font-semibold');
            if (countSpan) countSpan.textContent = approved;
            
            // Update documents text (X/Y documents)
            const docsText = card.querySelector('.text-xs.text-gray-500');
            if (docsText) docsText.textContent = `${approved}/${required} documents`;
            
            // Update percentage text (X% complete · Y missing)
            const percentTexts = card.querySelectorAll('.text-xs');
            if (percentTexts.length > 1) {
                percentTexts[1].textContent = `${percentage}% complete · ${missing} missing`;
            }
            
            // Update progress bar
            const progressBar = card.querySelector('[class*="bg-"][class*="h-2"]');
            if (progressBar) {
                progressBar.style.width = `${Math.min(percentage, 100)}%`;
            }
        }
    });
}



function useFallbackData() {
    // Show zeros when data cannot be loaded
    document.getElementById('totalDocs').textContent = 0;
    document.getElementById('approvedDocs').textContent = 0;
    document.getElementById('pendingDocs').textContent = 0;
    document.getElementById('approvalRate').textContent = '0% of required';
    document.getElementById('monthlyChange').textContent = '0/0 required';
    
    updateCategoryCard('instruction', 0, 0);
    updateCategoryCard('research', 0, 0);
    updateCategoryCard('extension', 0, 0);
    updateCategoryCard('employment', 0, 0);
}

// Load recent activities from backend database
async function loadRecentActivities() {
    console.log('loadRecentActivities() called');
    const container = document.getElementById('recentActivities');
    if (!container) {
        console.log('recentActivities container not found');
        return;
    }
    
    // Show loading
    container.innerHTML = '<div class="text-center text-gray-500 py-2"><div class="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-teal-600"></div> Loading activities...</div>';
    
    try {
        console.log('Fetching activities from API...');
        // Get REAL activities from audit_logs table
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'exists' : 'missing');
        const response = await fetch(`${API_BASE}/api/documents/activity`, {
            method: 'GET',
            headers: {
                'x-auth-token': token || '',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Activities API response status:', response.status);
        
        if (response.ok) {
            const activities = await response.json();
            console.log('SUCCESS: Got real activities from database:', activities.length);
            
            if (Array.isArray(activities) && activities.length > 0) {
                displayActivities(activities);
            } else {
                throw new Error('No activities found');
            }
        } else {
            throw new Error(`API Error: ${response.status}`);
        }
    } catch (err) {
        console.error('Error loading recent activities:', err);
        console.log('Activities API failed, showing empty state');
        
        // Show empty state instead of hardcoded data
        container.innerHTML = '<div class="text-center text-gray-500 py-2">No recent activities found</div>';
    }
}

function displayActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    const recentActivities = activities.slice(0, 5); // Show only 5 most recent
    
    container.innerHTML = recentActivities.map(act => {
        const actionText = formatActivityAction(act.action);
        const timeAgo = formatTimeAgo(act.created_at);
        const initial = act.user_name ? act.user_name.charAt(0).toUpperCase() : 'U';
        
        return `
            <div class="flex items-start gap-3 border-b border-gray-100 pb-2">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-teal-600">${initial}</span>
                <div>
                    <p class="text-sm"><span class="font-medium">${act.user_name || 'Unknown'}</span> ${actionText} ${act.document_title ? `<span class="font-medium">${act.document_title}</span>` : ''}</p>
                    <p class="text-xs text-gray-400">${timeAgo}</p>
                </div>
            </div>
        `;
    }).join('');
}

function formatActivityAction(action) {
    const actionMap = {
        'DOCUMENT_UPLOAD': 'uploaded',
        'DOCUMENT_APPROVED': 'approved',
        'DOCUMENT_REJECTED': 'rejected',
        'DOCUMENT_VALIDATED': 'validated',
        'DOCUMENT_LOCKED': 'locked',
        'DOCUMENT_DELETE': 'deleted'
    };
    return actionMap[action] || action.toLowerCase().replace('_', ' ');
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

// Load recent documents from backend
async function loadRecentDocuments() {
    console.log('Loading recent documents from database...');
    
    const tableBody = document.getElementById('recentDocsTable');
    const mobileContainer = document.getElementById('recentDocsMobile');
    
    // Show loading
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-gray-500"><div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div> Loading documents...</td></tr>';
    }
    if (mobileContainer) {
        mobileContainer.innerHTML = '<div class="text-center text-gray-500 py-4"><div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div> Loading documents...</div>';
    }
    
    let documents = [];
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/documents?scope=all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token || ''
            }
        });
        
        console.log('Documents API response status:', response.status);
        
        if (response.ok) {
            documents = await response.json();
            console.log('SUCCESS: Got documents from database:', documents.length);
            
            if (!Array.isArray(documents) || documents.length === 0) {
                throw new Error('No documents');
            }
        } else {
            throw new Error(`API Error: ${response.status}`);
        }
    } catch (err) {
        console.log('API failed:', err.message);
        documents = [];
    }
    
    // Sort by date (most recent first) and limit to 8 documents
    documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentDocuments = documents.slice(0, 8);
    
    console.log(`Showing ${recentDocuments.length} most recent documents out of ${documents.length} total`);
    
    // Render documents
    renderDocuments(recentDocuments, tableBody, mobileContainer);
    
    // Attach event listeners
    attachButtonListeners();
}

function renderDocuments(documents, tableBody, mobileContainer) {
    // Desktop table
    if (tableBody) {
        tableBody.innerHTML = '';
        documents.forEach(doc => {
            const stds = Array.isArray(doc.standards) && doc.standards.length
                ? doc.standards.slice(0, 2).map(s => {
                    const name = typeof s === 'string' ? s : (s.name || s.standard_name || 'Unknown');
                    return `<span class="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-1.5 py-0.5 rounded">${name}</span>`;
                  }).join(' ')
                    + (doc.standards.length > 2 ? ` <span class="text-gray-400 text-xs">+${doc.standards.length - 2}</span>` : '')
                : '<span class="text-gray-400 text-xs">—</span>';
            const row = document.createElement('tr');
            
            // Check if document is locked and user is not admin
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRole = (user.role || '').toLowerCase();
            const isLocked = doc.workflow_status === 'locked';
            const canDownload = !(userRole !== 'admin' && isLocked);
            
            const downloadButtonHtml = canDownload ? 
                `<button class="btn-download" data-id="${doc.id}" data-title="${doc.title.replace(/"/g, '&quot;')}">Download</button>` : 
                `<button class="btn-download disabled-btn" disabled title="Locked documents cannot be downloaded">Locked</button>`;
            
            row.innerHTML = `
                <td class="py-3">
                    <div class="font-medium text-gray-800">${doc.title}</div>
                    <div class="text-xs text-gray-400">by ${doc.author_name || 'Unknown'} · ${formatDate(doc.created_at)}</div>
                </td>
                <td class="py-3"><span class="${getCategoryBadgeClass(doc.category_display_name)} px-2 py-1 rounded-full text-xs">${doc.category_display_name}</span></td>
                <td class="py-3"><div class="flex flex-wrap gap-1">${stds}</div></td>
                <td class="py-3 text-xs text-gray-600">${doc.department_code}</td>
                <td class="py-3"><span class="${getStatusBadgeClass(doc.workflow_status)} px-2 py-1 rounded-full text-xs">${doc.workflow_status}</span></td>
                <td class="py-3 text-xs text-gray-500">${doc.version}</td>
                <td class="py-3">
                    <div class="flex gap-2">
                        <button class="btn-view" data-id="${doc.id}" data-title="${doc.title.replace(/"/g, '&quot;')}">View</button>
                        ${downloadButtonHtml}
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Mobile cards
    if (mobileContainer) {
        mobileContainer.innerHTML = '';
        documents.forEach(doc => {
            const stds = Array.isArray(doc.standards) && doc.standards.length
                ? doc.standards.slice(0, 2).map(s => {
                    const name = typeof s === 'string' ? s : (s.name || s.standard_name || 'Unknown');
                    return `<span class="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-1.5 py-0.5 rounded">${name}</span>`;
                  }).join(' ')
                    + (doc.standards.length > 2 ? ` <span class="text-gray-400 text-xs">+${doc.standards.length - 2}</span>` : '')
                : '<span class="text-gray-400 text-xs">—</span>';
            const card = document.createElement('div');
            card.className = 'border rounded-lg p-4 bg-white';
            
            // Check if document is locked and user is not admin
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userRole = (user.role || '').toLowerCase();
            const isLocked = doc.workflow_status === 'locked';
            const canDownload = !(userRole !== 'admin' && isLocked);
            
            const downloadButtonHtml = canDownload ? 
                `<button class="btn-download-sm" data-id="${doc.id}" data-title="${doc.title.replace(/"/g, '&quot;')}">Download</button>` : 
                `<button class="btn-download-sm disabled-btn" disabled style="opacity:0.5; cursor:not-allowed;">Locked</button>`;
            
            card.innerHTML = `
                <div class="font-medium text-gray-800">${doc.title}</div>
                <div class="text-xs text-gray-400 mb-2">by ${doc.author_name || 'Unknown'} · ${formatDate(doc.created_at)}</div>
                <div class="flex flex-wrap gap-2 mb-2">
                    <span class="${getCategoryBadgeClass(doc.category_display_name)} px-2 py-1 rounded-full text-xs">${doc.category_display_name}</span>
                    <span class="${getStatusBadgeClass(doc.workflow_status)} px-2 py-1 rounded-full text-xs">${doc.workflow_status}</span>
                </div>
                <div class="flex flex-wrap gap-1 mb-2">${stds}</div>
                <div class="text-sm text-gray-600 mb-3">${doc.department_code} · ${doc.version}</div>
                <div class="flex gap-2">
                    <button class="btn-view-sm" data-id="${doc.id}" data-title="${doc.title.replace(/"/g, '&quot;')}">View</button>
                    ${downloadButtonHtml}
                </div>
            `;
            mobileContainer.appendChild(card);
        });
    }
}

function getStatusBadgeClass(status) {
    const statusMap = {
        'approved': 'badge-approved',
        'locked': 'badge-approved',
        'validated': 'badge-approved',
        'pending_review': 'badge-pending',
        'pending': 'badge-pending',
        'rejected': 'badge-rejected',
        'draft': 'badge-draft'
    };
    return statusMap[status?.toLowerCase()] || 'badge-pending';
}

function getCategoryBadgeClass(category) {
    const categoryMap = {
        'instruction': 'badge-instruction',
        'research': 'badge-research',
        'extension': 'badge-extension',
        'employment': 'badge-employment'
    };
    return categoryMap[category?.toLowerCase()] || 'badge-instruction';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return 'Unknown';
    }
}

function viewDocument(docId, title) {
    console.log('View document:', docId, title);
    const token = localStorage.getItem('token');
    
    // Fetch the file with auth token and display in modal
    fetch(`${API_BASE}/api/documents/${docId}/download`, {
        method: 'GET',
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.msg || 'Failed to view document');
            });
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        openPreviewModal(url, title);
    })
    .catch(error => {
        console.error('View error:', error);
        alert(error.message || 'Failed to view document');
    });
}

function openPreviewModal(url, title) {
    console.log('openPreviewModal called with:', { url, title });
    const modal = document.getElementById('docPreviewModal');
    const iframe = document.getElementById('docPreviewFrame');
    const titleElem = document.getElementById('docPreviewTitle');
    
    if (!modal || !iframe) {
        console.error('Preview modal not found');
        return;
    }
    
    if (titleElem) titleElem.textContent = title || 'Document Preview';
    iframe.src = url;
    
    // Show modal with proper flex centering
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    console.log('Modal opened successfully');
}

function closePreviewModal() {
    const modal = document.getElementById('docPreviewModal');
    const iframe = document.getElementById('docPreviewFrame');
    
    if (!modal) return;
    
    modal.classList.add('hidden');
    modal.style.display = 'none';
    
    if (iframe) {
        const url = iframe.src;
        iframe.src = 'about:blank';
        if (url && url.startsWith('blob:')) {
            window.URL.revokeObjectURL(url);
        }
    }
}

// Setup preview modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('docPreviewCloseBtn');
    const modal = document.getElementById('docPreviewModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closePreviewModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closePreviewModal();
        });
    }
});

function downloadDocument(docId, title) {
    console.log('Download document:', docId, title);
    const token = localStorage.getItem('token');
    
    // Fetch the file with auth token and download header
    fetch(`${API_BASE}/api/documents/${docId}/download?download=true`, {
        method: 'GET',
        headers: {
            'x-auth-token': token,
            'x-download': 'true'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.msg || 'Download failed');
            });
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = title || 'document';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('Download error:', error);
        alert(error.message || 'Failed to download document');
    });
}

// Add event listeners after rendering
function attachButtonListeners() {
    document.querySelectorAll('.btn-view, .btn-view-sm').forEach(btn => {
        btn.addEventListener('click', function() {
            const docId = this.dataset.id;
            const title = this.dataset.title;
            viewDocument(docId, title);
        });
    });
    
    document.querySelectorAll('.btn-download, .btn-download-sm').forEach(btn => {
        btn.addEventListener('click', function() {
            const docId = this.dataset.id;
            const title = this.dataset.title;
            downloadDocument(docId, title);
        });
    });
}
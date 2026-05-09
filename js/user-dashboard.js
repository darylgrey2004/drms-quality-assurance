// js/user-dashboard.js

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Dashboard JS loaded successfully');

    // Initialize user session (handled by user-session.js)
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    
    console.log('User session:', { user, role });
    
    // Load dashboard data
    await loadUserDashboardData(token, user);
    
    // Load recent documents
    await loadUserRecentDocuments(token, user);
    
    // Load recent activities
    await loadUserRecentActivities(token, user);
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'user-dashboard.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1f5a6e';
        }
    });
});

// Load dashboard data for faculty/dept-head
async function loadUserDashboardData(token, user) {
    try {
        console.log('Loading user dashboard data...');
        
        // Get user's department from faculty profile
        const deptResponse = await fetch(`${API_BASE}/api/documents/user/department`, {
            headers: { 'x-auth-token': token }
        });
        
        let userDepartment = null;
        let departmentId = null;
        
        if (deptResponse.ok) {
            const deptData = await deptResponse.json();
            userDepartment = deptData.department_code || deptData.department_name;
            departmentId = deptData.department_id;
            console.log('User department:', userDepartment, 'ID:', departmentId);
        }
        
        // Fetch documents and requirements
        const [docsResponse, reqResponse] = await Promise.all([
            fetch(`${API_BASE}/api/documents?scope=mine`, {
                headers: { 'x-auth-token': token }
            }),
            fetch(`${API_BASE}/api/documents/category-requirements`, {
                headers: { 'x-auth-token': token }
            })
        ]);
        
        if (!docsResponse.ok || !reqResponse.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const allDocuments = await docsResponse.json();
        const allRequirements = await reqResponse.json();
        
        console.log('All documents:', allDocuments.length);
        console.log('All requirements:', allRequirements.length);
        
        // Filter requirements for user's department only
        const departmentRequirements = allRequirements.filter(req => {
            if (departmentId) {
                return req.department_id === departmentId;
            } else if (userDepartment) {
                return req.department_code === userDepartment || req.department_name === userDepartment;
            }
            return false;
        });
        
        console.log('Department requirements:', departmentRequirements);
        
        // Calculate statistics
        updateUserDashboardStats(allDocuments, departmentRequirements, user);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        useFallbackUserData();
    }
}

function updateUserDashboardStats(documents, requirements, user) {
    console.log('Updating user dashboard stats...');
    
    // Calculate requirements per category for user's department
    const categoryRequirements = {
        instruction: 0,
        research: 0,
        extension: 0,
        employment: 0
    };
    
    requirements.forEach(req => {
        const categoryName = (req.category_name || '').toLowerCase();
        if (categoryRequirements[categoryName] !== undefined) {
            categoryRequirements[categoryName] = req.expected_documents || 0;
        }
    });
    
    console.log('Category requirements for department:', categoryRequirements);
    
    // Count user's documents by status
    const myTotal = documents.length;
    const myApproved = documents.filter(d => d.workflow_status === 'approved' || d.workflow_status === 'locked').length;
    const myPending = documents.filter(d => d.workflow_status === 'pending' || d.workflow_status === 'validated').length;
    const myRejected = documents.filter(d => d.workflow_status === 'rejected').length;
    
    console.log('My documents:', { myTotal, myApproved, myPending, myRejected });
    
    // Update KPI cards
    document.getElementById('totalDocs') ? document.getElementById('totalDocs').textContent = myTotal : null;
    document.getElementById('approvedDocs') ? document.getElementById('approvedDocs').textContent = myApproved : null;
    document.getElementById('pendingDocs') ? document.getElementById('pendingDocs').textContent = myPending : null;
    document.getElementById('rejectedDocs') ? document.getElementById('rejectedDocs').textContent = myRejected : null;
    
    // Update stat cards if they exist
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        // My Documents
        statCards[0].querySelector('.text-2xl, .text-3xl').textContent = myTotal;
        statCards[0].querySelector('.text-xs.text-teal-600').textContent = `${myTotal} total documents`;
        
        // Approved
        const approvalRate = myTotal > 0 ? ((myApproved / myTotal) * 100).toFixed(0) : 0;
        statCards[1].querySelector('.text-2xl, .text-3xl').textContent = myApproved;
        statCards[1].querySelector('.text-xs.text-green-600').textContent = `${approvalRate}% approval rate`;
        
        // Pending
        statCards[2].querySelector('.text-2xl, .text-3xl').textContent = myPending;
        statCards[2].querySelector('.text-xs.text-amber-600').textContent = myPending > 0 ? 'Awaiting validation' : 'No pending documents';
        
        // Rejected
        statCards[3].querySelector('.text-2xl, .text-3xl').textContent = myRejected;
        statCards[3].querySelector('.text-xs.text-red-600').textContent = myRejected > 0 ? 'Action required' : 'No rejections';
    }
}

function useFallbackUserData() {
    console.log('Using fallback data for user dashboard');
    
    // Set default values
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.text-2xl, .text-3xl').textContent = '0';
        statCards[1].querySelector('.text-2xl, .text-3xl').textContent = '0';
        statCards[2].querySelector('.text-2xl, .text-3xl').textContent = '0';
        statCards[3].querySelector('.text-2xl, .text-3xl').textContent = '0';
    }
}

// Load recent documents for user
async function loadUserRecentDocuments(token, user) {
    console.log('Loading user recent documents...');
    
    const tableBody = document.querySelector('tbody.divide-y');
    const mobileContainer = document.querySelector('.block.md\\:hidden.space-y-4');
    
    console.log('Table body found:', !!tableBody);
    console.log('Mobile container found:', !!mobileContainer);
    
    if (!tableBody && !mobileContainer) {
        console.log('No document containers found');
        return;
    }
    
    // Show loading
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500"><div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div> Loading documents...</td></tr>';
    }
    if (mobileContainer) {
        mobileContainer.innerHTML = '<div class="text-center text-gray-500 py-4"><div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div> Loading documents...</div>';
    }
    
    try {
        console.log('Fetching documents with token:', !!token);
        const response = await fetch(`${API_BASE}/api/documents?scope=mine`, {
            headers: { 'x-auth-token': token }
        });
        
        console.log('Documents response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', errorText);
            throw new Error('Failed to fetch documents');
        }
        
        let documents = await response.json();
        console.log('User documents loaded:', documents.length);
        console.log('Sample document:', documents[0]);
        
        if (!Array.isArray(documents)) {
            console.error('Documents is not an array:', documents);
            documents = [];
        }
        
        if (documents.length === 0) {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">No documents found. Upload your first document!</td></tr>';
            }
            if (mobileContainer) {
                mobileContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No documents found. Upload your first document!</div>';
            }
            return;
        }
        
        // Sort by date and limit to 5 most recent
        documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const recentDocuments = documents.slice(0, 5);
        
        console.log('Rendering', recentDocuments.length, 'recent documents');
        
        // Render documents
        renderUserDocuments(recentDocuments, tableBody, mobileContainer);
        
        // Attach event listeners
        attachButtonListeners();
        
    } catch (error) {
        console.error('Error loading user documents:', error);
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">Error loading documents. Please try again.</td></tr>';
        }
        if (mobileContainer) {
            mobileContainer.innerHTML = '<div class="text-center text-gray-500 py-4">Error loading documents. Please try again.</div>';
        }
    }
}

function renderUserDocuments(documents, tableBody, mobileContainer) {
    // Desktop table
    if (tableBody) {
        tableBody.innerHTML = '';
        documents.forEach(doc => {
            const row = document.createElement('tr');
            
            const editButton = (doc.workflow_status === 'draft' || doc.workflow_status === 'rejected') ? 
                `<button class="btn-edit" data-id="${doc.id}">Edit</button>` : '';
            
            row.innerHTML = `
                <td class="py-3">
                    <div class="font-medium text-gray-800">${doc.title}</div>
                    <div class="text-xs text-gray-400">By ${doc.author_name || 'You'}</div>
                </td>
                <td class="py-3"><span class="${getCategoryBadgeClass(doc.category_display_name || doc.category)} px-2 py-1 rounded-full text-xs">${doc.category_display_name || doc.category}</span></td>
                <td class="py-3">${renderStandardsBadges(doc.standards || [])}</td>
                <td class="py-3 text-gray-600">${doc.department_code || doc.area}</td>
                <td class="py-3"><span class="${getStatusBadgeClass(doc.workflow_status)} px-2 py-1 rounded-full text-xs">${formatStatus(doc.workflow_status)}</span></td>
                <td class="py-3 text-gray-600">${doc.version || 'v1.0'}</td>
                <td class="py-3 text-gray-400">${formatDate(doc.created_at)}</td>
                <td class="py-3">
                    <div class="flex gap-2">
                        <button class="btn-view" data-id="${doc.id}" data-title="${doc.title.replace(/"/g, '&quot;')}">View</button>
                        ${editButton}
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
            const card = document.createElement('div');
            card.className = 'border rounded-lg p-4 bg-white';
            
            const editButton = (doc.workflow_status === 'draft' || doc.workflow_status === 'rejected') ? 
                `<button class="btn-edit-sm" data-id="${doc.id}">Edit</button>` : '';
            
            card.innerHTML = `
                <div class="font-medium text-gray-800">${doc.title}</div>
                <div class="text-xs text-gray-400 mb-2">By ${doc.author_name || 'You'} · ${formatDate(doc.created_at)}</div>
                <div class="flex flex-wrap gap-2 mb-2">
                    <span class="${getCategoryBadgeClass(doc.category_display_name || doc.category)} px-2 py-1 rounded-full text-xs">${doc.category_display_name || doc.category}</span>
                    <span class="${getStatusBadgeClass(doc.workflow_status)} px-2 py-1 rounded-full text-xs">${formatStatus(doc.workflow_status)}</span>
                </div>
                <div class="text-sm text-gray-600 mb-3">${doc.department_code || doc.area} · ${doc.version || 'v1.0'}</div>
                <div class="flex gap-2">
                    <button class="btn-view-sm" data-id="${doc.id}" data-title="${doc.title.replace(/"/g, '&quot;')}">View</button>
                    ${editButton}
                </div>
            `;
            mobileContainer.appendChild(card);
        });
    }
}

// Load recent activities for user
async function loadUserRecentActivities(token, user) {
    console.log('Loading user recent activities...');
    console.log('User info:', user);
    
    // Find the notifications container (the one with space-y-3 class inside the Notifications card)
    const notificationsCard = Array.from(document.querySelectorAll('.bg-white.rounded-xl.p-5.stat-card')).find(card => {
        const heading = card.querySelector('h2');
        return heading && heading.textContent.includes('Notifications');
    });
    
    const container = notificationsCard ? notificationsCard.querySelector('.space-y-3') : null;
    
    console.log('Notifications card found:', !!notificationsCard);
    console.log('Activities container found:', !!container);
    
    if (!container) {
        console.log('Activities container not found');
        return;
    }
    
    // Show loading
    container.innerHTML = '<div class="text-center text-gray-500 py-2"><div class="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-teal-600"></div> Loading activities...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/documents/activity`, {
            headers: { 'x-auth-token': token }
        });
        
        console.log('Activities response status:', response.status);
        
        if (!response.ok) throw new Error('Failed to fetch activities');
        
        const activities = await response.json();
        console.log('Activities loaded:', activities.length);
        console.log('Sample activity:', activities[0]);
        
        // Filter activities related to user's documents
        const userActivities = activities.filter(act => {
            if (!act.user_name) return false;
            const userName = act.user_name.toLowerCase();
            const firstName = (user.firstName || '').toLowerCase();
            const lastName = (user.lastName || '').toLowerCase();
            return userName.includes(firstName) || userName.includes(lastName);
        }).slice(0, 5);
        
        console.log('User activities filtered:', userActivities.length);
        
        if (userActivities.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-2">No recent activities</div>';
            return;
        }
        
        displayUserActivities(userActivities, container);
        
    } catch (error) {
        console.error('Error loading activities:', error);
        container.innerHTML = '<div class="text-center text-gray-500 py-2">No recent activities</div>';
    }
}

function displayUserActivities(activities, container) {
    container.innerHTML = activities.map(act => {
        const actionText = formatActivityAction(act.action);
        const timeAgo = formatTimeAgo(act.created_at);
        const iconClass = getActivityIcon(act.action);
        
        return `
            <div class="flex items-start gap-3 pb-2 border-b border-gray-100">
                <span class="w-6 h-6 ${iconClass} rounded-full flex items-center justify-center text-xs font-bold">${getActivityEmoji(act.action)}</span>
                <div class="flex-1">
                    <p class="text-sm">${actionText} ${act.document_title ? `<span class="font-medium">${act.document_title}</span>` : ''}</p>
                    <p class="text-xs text-gray-400">${timeAgo}</p>
                </div>
            </div>
        `;
    }).join('');
}

function getActivityIcon(action) {
    const iconMap = {
        'DOCUMENT_UPLOAD': 'bg-blue-100 text-blue-700',
        'DOCUMENT_APPROVED': 'bg-green-100 text-green-700',
        'DOCUMENT_REJECTED': 'bg-red-100 text-red-700',
        'DOCUMENT_VALIDATED': 'bg-purple-100 text-purple-700',
        'DOCUMENT_LOCKED': 'bg-gray-100 text-gray-700'
    };
    return iconMap[action] || 'bg-gray-100 text-gray-700';
}

function getActivityEmoji(action) {
    const emojiMap = {
        'DOCUMENT_UPLOAD': '📤',
        'DOCUMENT_APPROVED': '✓',
        'DOCUMENT_REJECTED': '✗',
        'DOCUMENT_VALIDATED': 'V',
        'DOCUMENT_LOCKED': '🔒'
    };
    return emojiMap[action] || '•';
}

// Helper functions
function getCategoryBadgeClass(category) {
    const categoryMap = {
        'instruction': 'badge-instruction',
        'research': 'badge-research',
        'extension': 'badge-extension',
        'employment': 'badge-employment'
    };
    return categoryMap[category?.toLowerCase()] || 'badge-instruction';
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

function formatStatus(status) {
    const statusMap = {
        'approved': 'Approved',
        'locked': 'Locked',
        'validated': 'Validated',
        'pending_review': 'Pending Review',
        'pending': 'Pending',
        'rejected': 'Rejected',
        'draft': 'Draft'
    };
    return statusMap[status?.toLowerCase()] || status || 'Pending';
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
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
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
}

function renderStandardsBadges(standards) {
    if (!standards || standards.length === 0) {
        return '<span class="text-xs text-gray-400">—</span>';
    }
    const visible = standards.slice(0, 2);
    const remaining = standards.length - 2;
    let html = visible.map(s => {
        const name = typeof s === 'string' ? s : (s.name || s.standard_name || 'Unknown');
        return `<span class="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs mr-1 mb-1">${name}</span>`;
    }).join('');
    if (remaining > 0) {
        html += `<span class="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">+${remaining}</span>`;
    }
    return html;
}



function editDocument(docId) {
    console.log('Edit document:', docId);
    window.location.href = `user-upload.html?edit=${docId}`;
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
    
    document.querySelectorAll('.btn-edit, .btn-edit-sm').forEach(btn => {
        btn.addEventListener('click', function() {
            const docId = this.dataset.id;
            editDocument(docId);
        });
    });
}

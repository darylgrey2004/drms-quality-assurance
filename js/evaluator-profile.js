// js/evaluator-profile.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Profile JS loaded');

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        console.error('No authentication found');
        window.location.href = 'landing.html';
        return;
    }

    // Load profile data from backend
    async function loadProfileData() {
        try {
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/profile/${user.id}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const profileData = await response.json();
            console.log('Profile data loaded:', profileData);

            updateProfileDisplay(profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    // Update profile display with backend data
    function updateProfileDisplay(data) {
        // Update profile initials and name
        const profileInitials = document.getElementById('profileInitials');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileDepartment = document.getElementById('profileDepartment');
        const profileLastActive = document.getElementById('profileLastActive');
        const profileExpiry = document.getElementById('profileExpiry');

        if (data.firstName && data.lastName) {
            const initials = (data.firstName[0] + data.lastName[0]).toUpperCase();
            if (profileInitials) profileInitials.textContent = initials;
            if (profileName) profileName.textContent = `${data.firstName} ${data.lastName}`;
        }

        if (data.email && profileEmail) {
            profileEmail.textContent = data.email;
        }

        if (data.department && profileDepartment) {
            profileDepartment.textContent = data.department || 'External Evaluator';
        }

        // Update last active time
        if (profileLastActive) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            profileLastActive.textContent = `Today, ${timeString}`;
        }

        // Load evaluator access expiry
        loadEvaluatorExpiry();
    }

    // Load recent activity from audit logs
    async function loadRecentActivity() {
        try {
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/documents/activity`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const activities = await response.json();
            console.log('Activities loaded:', activities);

            updateActivityLog(activities);
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }

    // Update activity log display
    function updateActivityLog(activities) {
        const activityContainer = document.querySelector('.space-y-3');
        if (!activityContainer) return;

        // Filter activities for current user
        const userActivities = activities.filter(activity => {
            return activity.user_name === `${user.firstName} ${user.lastName}`;
        }).slice(0, 5); // Show only last 5 activities

        if (userActivities.length === 0) {
            activityContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No recent activity</p>';
            return;
        }

        activityContainer.innerHTML = userActivities.map((activity, index) => {
            const actionText = getActionText(activity.action);
            const timeAgo = formatTimeAgo(activity.created_at);
            const borderClass = index < userActivities.length - 1 ? 'border-b border-gray-100' : '';

            return `
                <div class="activity-item flex items-start gap-3 pb-2 ${borderClass}">
                    <span class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">${activity.initial}</span>
                    <div class="flex-1">
                        <p class="text-sm">${actionText} <span class="font-medium">${activity.document_title || 'Document'}</span></p>
                        <p class="text-xs text-gray-400">${timeAgo}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Get action text from action type
    function getActionText(action) {
        const actionMap = {
            'DOCUMENT_UPLOAD': 'Uploaded',
            'DOCUMENT_APPROVED': 'Approved',
            'DOCUMENT_REJECTED': 'Rejected',
            'DOCUMENT_VALIDATED': 'Validated',
            'DOCUMENT_LOCKED': 'Locked',
            'DOCUMENT_DELETE': 'Deleted',
            'DOCUMENT_VIEW': 'Viewed'
        };
        return actionMap[action] || 'Accessed';
    }

    // Format time ago
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Load documents reviewed count
    async function loadDocumentsReviewed() {
        try {
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/documents/stats/evaluator`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const stats = await response.json();
            console.log('Evaluator stats loaded:', stats);

            // Update documents reviewed count
            const docsReviewedElem = document.getElementById('profileDocsReviewed');
            if (docsReviewedElem && stats.locked) {
                docsReviewedElem.textContent = stats.locked;
            }
        } catch (error) {
            console.error('Error loading documents reviewed:', error);
            const docsReviewedElem = document.getElementById('profileDocsReviewed');
            if (docsReviewedElem) {
                docsReviewedElem.textContent = '0';
            }
        }
    }

    // Load evaluator access expiry date
    async function loadEvaluatorExpiry() {
        try {
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/admin/evaluator/access-expiry/${user.id}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Evaluator expiry loaded:', data);

            const profileExpiry = document.getElementById('profileExpiry');
            const evaluationPeriod = document.getElementById('evaluationPeriod');

            if (data.expiresAt && profileExpiry) {
                const expiryDate = new Date(data.expiresAt);
                profileExpiry.textContent = expiryDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                });

                // Calculate evaluation period (assuming it starts from creation date)
                if (data.createdAt && evaluationPeriod) {
                    const startDate = new Date(data.createdAt);
                    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const endStr = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    evaluationPeriod.textContent = `${startStr} - ${endStr}`;
                }
            } else {
                if (profileExpiry) profileExpiry.textContent = 'No expiry set';
                if (evaluationPeriod) evaluationPeriod.textContent = 'Not specified';
            }
        } catch (error) {
            console.error('Error loading evaluator expiry:', error);
            const profileExpiry = document.getElementById('profileExpiry');
            const evaluationPeriod = document.getElementById('evaluationPeriod');
            if (profileExpiry) profileExpiry.textContent = 'Not available';
            if (evaluationPeriod) evaluationPeriod.textContent = 'Not available';
        }
    }

    // Heartbeat to keep session alive
    function sendHeartbeat() {
        fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/heartbeat`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }

    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 2 * 60 * 1000);
    }

    // Load all data
    loadProfileData();
    loadRecentActivity();
    loadDocumentsReviewed();

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout from your evaluator session?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }

    console.log('Profile loaded in view-only mode');
});
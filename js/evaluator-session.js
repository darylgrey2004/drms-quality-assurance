document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role || 'Evaluator').toString();
    const el = (id) => document.getElementById(id);

    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    // Check evaluator access expiry on page load
    async function checkEvaluatorAccess() {
        const userRole = (user.role || '').toString().toLowerCase().trim();
        const isEvaluator = userRole === 'evaluator' || userRole === 'external evaluator';
        
        if (!isEvaluator) return true;
        
        try {
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/admin/evaluator/access-expiry/${user.id}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 403) {
                const data = await response.json();
                if (data.expired) {
                    alert('Your External Evaluator access has expired. Please contact the administrator.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'landing.html';
                    return false;
                }
            }
            
            if (response.ok) {
                const data = await response.json();
                const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
                const now = new Date();
                if (data.expired || (expiresAt && now >= expiresAt)) {
                    alert('Your External Evaluator access has expired. Please contact the administrator.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'landing.html';
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error checking evaluator access:', error);
            return true;
        }
    }

    // Check access first
    const hasAccess = await checkEvaluatorAccess();
    if (!hasAccess) return;

    // ── Heartbeat: Update lastActive status ──
    function sendHeartbeat() {
        fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/heartbeat`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        })
        .then(response => {
            if (response.status === 403) {
                return response.json().then(data => {
                    if (data.expired) {
                        alert('Your External Evaluator access has expired. Please contact the administrator.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = 'landing.html';
                    }
                });
            }
        })
        .catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    function getFullName(data) {
        const firstLast = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        if (firstLast) return firstLast;
        if (data.fullName) return String(data.fullName).trim();
        if (data.name) return String(data.name).trim();
        if (data.email) return String(data.email).split('@')[0];
        return 'Evaluator';
    }

    function getInitials(data, fullName) {
        const fromFirstLast = (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '');
        if (fromFirstLast.trim()) return fromFirstLast.toUpperCase();
        const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
        return ((parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '')).toUpperCase() || 'EV';
    }

    function applyIdentity(data) {
        console.log('DEBUG: applyIdentity called with:', data);
        const roleValue = data.role || 'External Evaluator';
        const fullName = getFullName(data);
        const initials = getInitials(data, fullName);
        const department = data.department || '';
        const credential = data.credential || 'CHED';
        const portal = 'External Evaluator Portal';
        
        console.log('DEBUG: fullName:', fullName);
        console.log('DEBUG: initials:', initials);
        console.log('DEBUG: credential:', credential);
        
        // Format role with credential: "External Evaluator - Credential"
        const roleDisplay = `External Evaluator - ${credential}`;

        // Update sidebar elements
        if (el('sidebarInitials')) el('sidebarInitials').textContent = initials;
        if (el('sidebarName')) el('sidebarName').textContent = fullName;
        if (el('sidebarRole')) el('sidebarRole').textContent = roleDisplay;
        if (el('sidebarPortal')) el('sidebarPortal').textContent = portal;

        // Update header elements if present
        if (el('headerName')) el('headerName').textContent = fullName;
        if (el('headerRole')) el('headerRole').textContent = roleDisplay;
        if (el('headerInitials')) el('headerInitials').textContent = initials;

        // Update profile page elements if present
        if (el('profileInitials')) el('profileInitials').textContent = initials;
        if (el('profileName')) el('profileName').textContent = fullName;
        if (el('profileDepartment')) el('profileDepartment').textContent = department || 'External Evaluator Portal';
        if (el('profileEmail')) el('profileEmail').textContent = data.email || '-';
        if (el('profileExpiry')) {
            if (data.evaluator_expires_at) {
                const expiryDate = new Date(data.evaluator_expires_at);
                el('profileExpiry').textContent = expiryDate.toLocaleDateString();
            } else {
                el('profileExpiry').textContent = '-';
            }
        }
        if (el('profileLastActive')) {
            // Display relative time for last active (like Messenger)
            const now = new Date();
            const diffMs = now - new Date();
            const relativeTime = diffMs < 60000 ? 'just now' : 'today';
            el('profileLastActive').textContent = relativeTime;
        }

        // Store applied values
        window.CurrentEvaluator = {
            id: data.id || data.userId,
            fullName,
            initials,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: roleValue,
            department: data.department || null,
            roleDisplay,
            expiresAt: data.evaluator_expires_at || null
        };
    }

    // Fetch complete profile data from server
    async function fetchAndApplyProfile() {
        console.log('DEBUG: fetchAndApplyProfile called');
        console.log('DEBUG: user object:', user);
        console.log('DEBUG: token:', token ? 'exists' : 'missing');
        console.log('DEBUG: user.id:', user.id);
        console.log('DEBUG: user.firstName:', user.firstName);
        console.log('DEBUG: user.lastName:', user.lastName);
        
        if (!user.id || !token) {
            console.log('User ID or token missing, using stored user data');
            applyIdentity(user);
            return;
        }

        try {
            console.log('Fetching profile from API for user:', user.id);
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/profile/${user.id}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 403) {
                const errorData = await response.json();
                if (errorData.expired) {
                    alert('Your External Evaluator access has expired. Please contact the administrator.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'landing.html';
                    return;
                }
            }

            if (response.ok) {
                const profileData = await response.json();
                console.log('Profile data fetched:', profileData);
                // Merge profile data with stored user data
                const mergedUser = {
                    ...user,
                    ...profileData,
                    firstName: profileData.firstName || user.firstName,
                    lastName: profileData.lastName || user.lastName,
                    email: profileData.email || user.email,
                    department: profileData.department || user.department
                };
                console.log('Merged user data:', mergedUser);
                applyIdentity(mergedUser);
            } else {
                console.log('Profile fetch failed with status:', response.status);
                console.log('Using stored user data');
                applyIdentity(user);
            }
        } catch (error) {
            console.log('Profile fetch error:', error.message);
            console.log('Using stored user data');
            applyIdentity(user);
        }
    }

    function handleLogout() {
        const logoutBtn = el('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'landing.html';
                }
            });
        }
    }

    // Apply user identity to page - fetch profile first if user ID exists
    fetchAndApplyProfile();
    handleLogout();

    // Log current evaluator info
    console.log('Evaluator Session:', {
        evaluator: window.CurrentEvaluator,
        portalAccess: 'External Evaluator - View Only'
    });
});

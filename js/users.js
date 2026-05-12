// js/users.js

// Modal Alert System
function showAlert(message, title = 'Alert', type = 'warning') {
    const modal = document.getElementById('alertModal');
    const icon = document.getElementById('alertIcon');
    const titleEl = document.getElementById('alertTitle');
    const messageEl = document.getElementById('alertMessage');
    
    if (!modal || !icon || !titleEl || !messageEl) return;
    
    // Set icon and colors based on type
    if (type === 'error') {
        icon.className = 'w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4';
        icon.innerHTML = '<span class="text-red-600 text-xl font-bold">✗</span>';
    } else if (type === 'success') {
        icon.className = 'w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4';
        icon.innerHTML = '<span class="text-green-600 text-xl font-bold">✓</span>';
    } else {
        icon.className = 'w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4';
        icon.innerHTML = '<span class="text-amber-600 text-xl font-bold">⚠</span>';
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.remove('hidden');
}

function closeAlert() {
    const modal = document.getElementById('alertModal');
    if (modal) modal.classList.add('hidden');
}

// Password Strength Checker
function checkPasswordStrength(password) {
    const bars = [
        document.getElementById('strength-bar-1'),
        document.getElementById('strength-bar-2'),
        document.getElementById('strength-bar-3'),
        document.getElementById('strength-bar-4')
    ];
    const label = document.getElementById('strength-label');
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');
    
    if (!password) {
        bars.forEach(bar => bar.className = 'h-1 flex-1 bg-gray-200 rounded transition-colors');
        if (label) label.innerHTML = 'Password strength: <span class="font-medium">None</span>';
        if (reqLength) reqLength.className = 'text-gray-400';
        if (reqUppercase) reqUppercase.className = 'text-gray-400';
        if (reqLowercase) reqLowercase.className = 'text-gray-400';
        if (reqNumber) reqNumber.className = 'text-gray-400';
        if (reqSpecial) reqSpecial.className = 'text-gray-400';
        return { strength: 0, valid: false };
    }
    
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    
    // Update requirement indicators
    if (reqLength) {
        reqLength.className = hasLength ? 'text-green-600' : 'text-gray-400';
        reqLength.innerHTML = hasLength ? '✓ At least 8 characters' : '✗ At least 8 characters';
    }
    if (reqUppercase) {
        reqUppercase.className = hasUppercase ? 'text-green-600' : 'text-gray-400';
        reqUppercase.innerHTML = hasUppercase ? '✓ One uppercase letter' : '✗ One uppercase letter';
    }
    if (reqLowercase) {
        reqLowercase.className = hasLowercase ? 'text-green-600' : 'text-gray-400';
        reqLowercase.innerHTML = hasLowercase ? '✓ One lowercase letter' : '✗ One lowercase letter';
    }
    if (reqNumber) {
        reqNumber.className = hasNumber ? 'text-green-600' : 'text-gray-400';
        reqNumber.innerHTML = hasNumber ? '✓ One number' : '✗ One number';
    }
    if (reqSpecial) {
        reqSpecial.className = hasSpecial ? 'text-green-600' : 'text-gray-400';
        reqSpecial.innerHTML = hasSpecial ? '✓ One special character (!@#$%^&*)' : '✗ One special character (!@#$%^&*)';
    }
    
    // Calculate strength
    let strength = 0;
    if (hasLength) strength++;
    if (hasUppercase) strength++;
    if (hasLowercase) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;
    
    // Update bars and label
    bars.forEach(bar => bar.className = 'h-1 flex-1 bg-gray-200 rounded transition-colors');
    
    if (strength === 1) {
        bars[0].className = 'h-1 flex-1 bg-red-500 rounded transition-colors';
        if (label) label.innerHTML = 'Password strength: <span class="font-medium text-red-600">Weak</span>';
    } else if (strength === 2 || strength === 3) {
        bars[0].className = 'h-1 flex-1 bg-amber-500 rounded transition-colors';
        bars[1].className = 'h-1 flex-1 bg-amber-500 rounded transition-colors';
        if (label) label.innerHTML = 'Password strength: <span class="font-medium text-amber-600">Fair</span>';
    } else if (strength === 4) {
        bars[0].className = 'h-1 flex-1 bg-blue-500 rounded transition-colors';
        bars[1].className = 'h-1 flex-1 bg-blue-500 rounded transition-colors';
        bars[2].className = 'h-1 flex-1 bg-blue-500 rounded transition-colors';
        if (label) label.innerHTML = 'Password strength: <span class="font-medium text-blue-600">Good</span>';
    } else if (strength === 5) {
        bars.forEach(bar => bar.className = 'h-1 flex-1 bg-green-500 rounded transition-colors');
        if (label) label.innerHTML = 'Password strength: <span class="font-medium text-green-600">Strong</span>';
    }
    
    const valid = hasLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
    return { strength, valid };
}

document.addEventListener('DOMContentLoaded', function() {
    const usersTableBody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('searchUsers');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    let token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const viewerRole = (currentUser.role || '').toString().toLowerCase().trim();
    const canDeleteUsers = viewerRole === 'admin';
    const openCreateUserModalBtn = document.getElementById('openCreateUserModalBtn');
    const closeCreateUserModalBtn = document.getElementById('closeCreateUserModalBtn');
    const cancelCreateUserBtn = document.getElementById('cancelCreateUserBtn');
    const createUserModal = document.getElementById('createUserModal');
    const createUserForm = document.getElementById('createUserForm');
    const createRole = document.getElementById('createRole');
    const evaluatorExpiryWrap = document.getElementById('evaluatorExpiryWrap');
    const createEvaluatorExpiresAt = document.getElementById('createEvaluatorExpiresAt');
    const departmentWrap = document.getElementById('departmentWrap');
    const createDepartment = document.getElementById('createDepartment');

    // Alert modal handlers
    const alertOkBtn = document.getElementById('alertOkBtn');
    if (alertOkBtn) alertOkBtn.addEventListener('click', closeAlert);
    
    // Password strength checker
    const createPassword = document.getElementById('createPassword');
    if (createPassword) {
        createPassword.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Toggle password requirements dropdown
    const toggleRequirementsBtn = document.getElementById('toggleRequirements');
    const passwordRequirements = document.getElementById('passwordRequirements');
    const requirementsArrow = document.getElementById('requirementsArrow');
    
    if (toggleRequirementsBtn && passwordRequirements && requirementsArrow) {
        toggleRequirementsBtn.addEventListener('click', function() {
            const isHidden = passwordRequirements.classList.contains('hidden');
            passwordRequirements.classList.toggle('hidden');
            
            // Rotate arrow
            if (isHidden) {
                requirementsArrow.style.transform = 'rotate(180deg)';
            } else {
                requirementsArrow.style.transform = 'rotate(0deg)';
            }
        });
    }

    let allUsers = [];
    let isRedirecting = false;

    // Function to check if token is expired
    function isTokenExpired(token) {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            return Date.now() >= exp;
        } catch (e) {
            return true;
        }
    }

    // Function to handle expired token
    function handleExpiredToken() {
        if (isRedirecting) return;
        isRedirecting = true;
        
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'landing.html';
    }

    // Check token expiration immediately
    if (!token || isTokenExpired(token)) {
        handleExpiredToken();
        return;
    }

    // ── Heartbeat: Update lastActive status ──
    function sendHeartbeat() {
        if (isTokenExpired(token)) return;
        
        fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/heartbeat`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    function openCreateUserModal() {
        if (!createUserModal || !canDeleteUsers) return;
        createUserModal.classList.remove('hidden');
    }

    function closeCreateUserModal() {
        if (!createUserModal) return;
        createUserModal.classList.add('hidden');
        if (createUserForm) createUserForm.reset();
        if (evaluatorExpiryWrap) evaluatorExpiryWrap.classList.add('hidden');
        if (createEvaluatorExpiresAt) createEvaluatorExpiresAt.required = false;
        
        // Reset password strength meter
        checkPasswordStrength('');
        
        // Hide requirements dropdown
        const passwordRequirements = document.getElementById('passwordRequirements');
        const requirementsArrow = document.getElementById('requirementsArrow');
        if (passwordRequirements) passwordRequirements.classList.add('hidden');
        if (requirementsArrow) requirementsArrow.style.transform = 'rotate(0deg)';
    }

    function syncEvaluatorExpiryField() {
        if (!createRole || !evaluatorExpiryWrap || !createEvaluatorExpiresAt) return;
        const selectedRole = (createRole.value || '').toLowerCase().trim();
        const isEvaluator = selectedRole === 'evaluator' || selectedRole === 'external evaluator';
        evaluatorExpiryWrap.classList.toggle('hidden', !isEvaluator);
        createEvaluatorExpiresAt.required = isEvaluator;
        if (!isEvaluator) createEvaluatorExpiresAt.value = '';
        
        if (departmentWrap && createDepartment) {
            const showDepartment = selectedRole === 'faculty' || selectedRole === 'area-chair' || selectedRole === 'department-head';
            departmentWrap.classList.toggle('hidden', !showDepartment);
            createDepartment.required = showDepartment;
            if (!showDepartment) createDepartment.value = '';
        }
    }

    if (openCreateUserModalBtn) {
        openCreateUserModalBtn.classList.toggle('hidden', !canDeleteUsers);
        openCreateUserModalBtn.addEventListener('click', openCreateUserModal);
    }
    if (closeCreateUserModalBtn) closeCreateUserModalBtn.addEventListener('click', closeCreateUserModal);
    if (cancelCreateUserBtn) cancelCreateUserBtn.addEventListener('click', closeCreateUserModal);
    if (createRole) createRole.addEventListener('change', syncEvaluatorExpiryField);

    if (createUserForm) {
        createUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!canDeleteUsers) return;

            // Check token again before submission
            if (isTokenExpired(token)) {
                handleExpiredToken();
                return;
            }

            const firstName = document.getElementById('createFirstName')?.value?.trim();
            const lastName = document.getElementById('createLastName')?.value?.trim();
            const middleInitial = document.getElementById('createMiddleInitial')?.value?.trim() || null;
            const email = document.getElementById('createEmail')?.value?.trim();
            const role = document.getElementById('createRole')?.value;
            const password = document.getElementById('createPassword')?.value;
            const confirmPassword = document.getElementById('createConfirmPassword')?.value;
            const departmentSelect = document.getElementById('createDepartment');
            const department = departmentSelect && !departmentSelect.closest('#departmentWrap').classList.contains('hidden') 
                ? (departmentSelect.value?.trim() || null) 
                : null;
            const evaluatorExpiresAt = createEvaluatorExpiresAt?.value || null;

            console.log('Form submission data:', { firstName, lastName, email, role, department, departmentVisible: !departmentSelect?.closest('#departmentWrap').classList.contains('hidden') });

            if (!firstName || !lastName || !email || !role || !password || !confirmPassword) {
                showAlert('Please fill in all required fields.', 'Missing Information', 'warning');
                return;
            }
            
            // Validate password strength
            const passwordCheck = checkPasswordStrength(password);
            if (!passwordCheck.valid) {
                showAlert('Password must meet all requirements: at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).', 'Weak Password', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match. Please re-enter your password.', 'Password Mismatch', 'error');
                return;
            }

            const normalizedRole = role.toLowerCase().trim();
            const isEvaluator = normalizedRole === 'evaluator' || normalizedRole === 'external evaluator';
            const requiresDepartment = normalizedRole === 'faculty' || normalizedRole === 'area-chair' || normalizedRole === 'department-head';
            
            if (requiresDepartment && !department) {
                showAlert('Please select a department for this role.', 'Department Required', 'warning');
                return;
            }
            
            // Check if department head already exists for selected department
            if (normalizedRole === 'department-head' && department) {
                try {
                    const checkResponse = await fetch(API_CONFIG.getApiUrl(`/api/auth/check-dept-head/${department}`), {
                        headers: { 'x-auth-token': token }
                    });
                    
                    if (checkResponse.ok) {
                        const checkData = await checkResponse.json();
                        if (checkData.exists) {
                            showAlert(
                                `A Department Head for ${department} already exists. Only one Department Head is allowed per department. Please select a different department or role.`,
                                'Department Head Already Exists',
                                'error'
                            );
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error checking department head:', error);
                    showAlert('Unable to verify department head availability. Please try again.', 'Verification Error', 'error');
                    return;
                }
            }
            
            if (isEvaluator && !evaluatorExpiresAt) {
                showAlert('Please set an expiration date/time for External Evaluator accounts.', 'Expiration Date Required', 'warning');
                return;
            }

            try {
                const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/admin/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        middleInitial,
                        email,
                        role,
                        password,
                        department,
                        evaluatorExpiresAt
                    })
                });

                if (response.status === 401) {
                    handleExpiredToken();
                    return;
                }

                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.msg || 'Failed to create user account.');

                showAlert(result.msg || 'User account created successfully.', 'Success', 'success');
                closeCreateUserModal();
                fetchAndRenderUsers();
            } catch (error) {
                console.error('Error creating user:', error);
                showAlert(`Failed to create user: ${error.message}`, 'Error', 'error');
            }
        });
    }

    async function fetchAndRenderUsers() {
        // Check token before fetching
        if (isTokenExpired(token)) {
            handleExpiredToken();
            return;
        }

        // Show loading state
        if (usersTableBody) {
            usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500"><div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading users...</div></td></tr>`;
        }

        try {
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/admin/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });

            if (response.status === 401) {
                handleExpiredToken();
                return;
            }

            if (!response.ok) {
                if (response.status === 403) {
                    if (viewerRole === 'dean') {
                        showAlert('Dean access to Users requires updated server permissions.', 'Access Denied', 'error');
                        setTimeout(() => window.location.href = 'index.html', 2000);
                        return;
                    }
                    showAlert('You are not authorized to view this page.', 'Access Denied', 'error');
                    setTimeout(() => window.location.href = 'index.html', 2000);
                    return;
                }

                throw new Error('Failed to fetch users.');
            }

            const users = await response.json();
            
            if (!Array.isArray(users)) {
                throw new Error('Invalid response format from server');
            }
            
            allUsers = users;
            renderUsers(users);
            updateStats(users);

        } catch (error) {
            console.error('Error fetching users:', error);
            if (usersTableBody) {
                usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8"><div class="text-red-500"><svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p class="font-medium">Error loading users</p><p class="text-sm text-gray-500 mt-1">${error.message}</p><button onclick="location.reload()" class="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Retry</button></div></td></tr>`;
            }
        }
    }

    function updateStats(users) {
        const totalUsers = users.length;
        const approvedUsers = users.filter(u => {
            // Check if evaluator is expired
            const isEvaluator = u.role && u.role.toLowerCase() === 'evaluator';
            const isExpired = isEvaluator && u.evaluatorExpiresAt && new Date(u.evaluatorExpiresAt) < new Date();
            return u.status === 'approved' && !isExpired;
        }).length;
        const pendingUsers = users.filter(u => u.status === 'pending').length;
        const expiredEvaluators = users.filter(u => {
            const isEvaluator = u.role && u.role.toLowerCase() === 'evaluator';
            return isEvaluator && u.evaluatorExpiresAt && new Date(u.evaluatorExpiresAt) < new Date();
        }).length;
        const uniqueRoles = new Set(users.map(u => u.role).filter(r => r)).size;

        const totalEl = document.querySelector('.stat-card:nth-child(1) .text-3xl');
        const approvedEl = document.querySelector('.stat-card:nth-child(2) .text-3xl');
        const pendingEl = document.querySelector('.stat-card:nth-child(3) .text-3xl');
        const rolesEl = document.querySelector('.stat-card:nth-child(4) .text-3xl');
        
        if (totalEl) totalEl.textContent = totalUsers;
        if (approvedEl) approvedEl.textContent = approvedUsers;
        if (pendingEl) pendingEl.textContent = pendingUsers;
        if (rolesEl) rolesEl.textContent = uniqueRoles;

        const activeRate = totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0;
        const approvedRateEl = document.querySelector('.stat-card:nth-child(2) .text-xs');
        const totalLabelEl = document.querySelector('.stat-card:nth-child(1) .text-xs');
        const pendingLabelEl = document.querySelector('.stat-card:nth-child(3) .text-xs');
        
        if (approvedRateEl) approvedRateEl.textContent = `${activeRate}% approved rate`;
        if (totalLabelEl) {
            if (expiredEvaluators > 0) {
                totalLabelEl.textContent = `${totalUsers} total (${expiredEvaluators} expired)`;
                totalLabelEl.className = 'text-xs text-red-600 mt-2';
            } else {
                totalLabelEl.textContent = totalUsers > 0 ? `${totalUsers} total` : 'No users yet';
                totalLabelEl.className = 'text-xs text-green-600 mt-2';
            }
        }
        if (pendingLabelEl) pendingLabelEl.textContent = pendingUsers > 0 ? 'Awaiting approval' : 'No pending users';
    }

    function renderUsers(users) {
        if (!usersTableBody) return;
        usersTableBody.innerHTML = '';

        if (!Array.isArray(users) || users.length === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500">No users found matching your criteria.</td></tr>`;
            return;
        }

        function isCurrentlyActive(lastActive) {
            if (!lastActive) return false;
            try {
                const lastActiveDate = new Date(lastActive);
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                return lastActiveDate > fiveMinutesAgo;
            } catch (e) {
                return false;
            }
        }

        function formatLastActive(lastActive, role) {
            if (!lastActive) return 'Never';
            if (role && role.toLowerCase() === 'evaluator') return 'View-Only Access';
            
            try {
                if (isCurrentlyActive(lastActive)) {
                    return '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1"><span class="heartbeat-dot"></span>active now</span>';
                }
                
                const lastActiveDate = new Date(lastActive);
                const now = new Date();
                const diffMs = now - lastActiveDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) return 'just now';
                if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                return lastActiveDate.toLocaleDateString();
            } catch (e) {
                return 'Unknown';
            }
        }

        function formatRoleName(role) {
            if (!role) return 'User';
            const roleMap = {
                'admin': 'Administrator',
                'dean': 'Dean',
                'area-chair': 'Dept. Head',
                'department-head': 'Dept. Head',
                'faculty': 'Faculty',
                'evaluator': 'External Evaluator'
            };
            return roleMap[role.toLowerCase()] || role;
        }

        users.forEach(user => {
            try {
                const row = document.createElement('tr');
                row.className = 'user-row hover:bg-gray-50 transition-colors';

                // Check if evaluator is expired
                const isEvaluator = user.role && user.role.toLowerCase() === 'evaluator';
                const isExpired = isEvaluator && user.evaluatorExpiresAt && new Date(user.evaluatorExpiresAt) < new Date();

                const statusBadge = isExpired
                    ? `<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">⏰ Expired</span>`
                    : user.status === 'approved' 
                    ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Approved</span>`
                    : user.status === 'rejected'
                    ? `<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejected</span>`
                    : `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">Pending</span>`;

                const lastActiveDisplay = formatLastActive(user.lastActive, user.role);
                const userId = user.id || user._id;
                const displayRole = formatRoleName(user.role);
                const firstName = (user.firstName || '').trim();
                const lastName = (user.lastName || '').trim();
                const email = (user.email || '').trim();
                
                // Show expiry date for evaluators in department column
                let department = (user.department || 'N/A').trim();
                if (isEvaluator && user.evaluatorExpiresAt) {
                    const expiryDate = new Date(user.evaluatorExpiresAt);
                    const formattedExpiry = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    if (isExpired) {
                        department = `<span class="text-red-600 font-medium">Expired: ${formattedExpiry}</span>`;
                    } else {
                        department = `<span class="text-amber-600">Expires: ${formattedExpiry}</span>`;
                    }
                }
                
                const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`;
                
                const actionButtons = userId
                    ? `
                        <a href="view-faculty-profile.html?userId=${encodeURIComponent(userId)}" class="action-pill action-pill-view" title="View Profile">View Profile</a>
                        ${canDeleteUsers ? `<button class="action-pill action-pill-delete delete-user" data-id="${userId}" title="Delete User">Delete</button>` : ''}
                    `
                    : '<span class="text-gray-400">N/A</span>';

                row.innerHTML = `
                    <td class="py-3 px-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                                ${initials}
                            </div>
                            <div>
                                <div class="font-medium text-gray-800">${firstName} ${lastName}</div>
                                <div class="text-xs text-gray-400">${displayRole}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-2 text-gray-600 text-sm">${email}</td>
                    <td class="py-3 px-2"><span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">${displayRole}</span></td>
                    <td class="py-3 px-2 text-gray-600 text-sm">${department}</td>
                    <td class="py-3 px-2">${statusBadge}</td>
                    <td class="py-3 px-2 text-gray-400 text-xs">${lastActiveDisplay}</td>
                    <td class="py-3 px-2">
                        <div class="flex items-center gap-2">
                            ${actionButtons}
                        </div>
                    </td>
                `;
                usersTableBody.appendChild(row);
            } catch (error) {
                console.error('Error rendering user row:', error, user);
            }
        });
    }

    usersTableBody.addEventListener('click', async function(e) {
        const deleteButton = e.target.closest('.delete-user');
        if (!deleteButton) return;

        const userId = deleteButton.getAttribute('data-id');
        if (!userId || !canDeleteUsers) return;

        if (confirm('Delete this user? Their uploaded documents will be retained but unlinked from their account.')) {
            if (isTokenExpired(token)) {
                handleExpiredToken();
                return;
            }
            await deleteUser(userId);
        }
    });

    async function deleteUser(userId) {
        try {
            const response = await fetch(API_CONFIG.getApiUrl(`/api/admin/users/${encodeURIComponent(userId)}`), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            });

            if (response.status === 401) { handleExpiredToken(); return; }

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.msg || 'Failed to delete user.');

            alert(data.msg || 'User has been deleted. Their documents have been retained.');
            fetchAndRenderUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user: ${error.message}`);
        }
    }

    fetchAndRenderUsers();

    if (searchInput) searchInput.addEventListener('input', filterUsers);
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);
    if (statusFilter) statusFilter.addEventListener('change', filterUsers);

    function filterUsers() {
        const searchTerm = searchInput?.value?.toLowerCase().trim() || '';
        const selectedRole = roleFilter?.value || 'all';
        const selectedStatus = statusFilter?.value || 'all';

        let filteredUsers = allUsers;

        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                const role = (user.role || '').toLowerCase();
                return fullName.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
            });
        }

        if (selectedRole !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === selectedRole);
        }

        if (selectedStatus !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.status === selectedStatus);
        }

        renderUsers(filteredUsers);
    }
});
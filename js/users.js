// js/users.js

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
    
    // Delete Modal Elements
    const deleteUserModal = document.getElementById('deleteUserModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    let userIdToDelete = null;

    let allUsers = [];
    let isRedirecting = false;

    // Role mapping for display
    function getRoleDisplayName(role) {
        const roleMap = {
            'admin': 'Administrator',
            'dean': 'Dean',
            'department-head': 'Department Head',
            'area-chair': 'Area Chair',
            'faculty': 'Faculty',
            'evaluator': 'External Evaluator'
        };
        return roleMap[role] || role || 'User';
    }

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
        
        fetch('http://localhost:3000/api/user/heartbeat', {
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
        if (departmentWrap) departmentWrap.classList.add('hidden');
    }

    function syncRoleFields() {
        if (!createRole) return;
        const selectedRole = (createRole.value || '').toLowerCase().trim();
        const isEvaluator = selectedRole === 'evaluator';
        
        // Show/hide evaluator expiry
        if (evaluatorExpiryWrap) {
            evaluatorExpiryWrap.classList.toggle('hidden', !isEvaluator);
            if (createEvaluatorExpiresAt) createEvaluatorExpiresAt.required = isEvaluator;
            if (!isEvaluator && createEvaluatorExpiresAt) createEvaluatorExpiresAt.value = '';
        }
        
        // Show department for faculty, area chair, department head, and dean
        if (departmentWrap && createDepartment) {
            const showDepartment = selectedRole === 'faculty' || selectedRole === 'area-chair' || selectedRole === 'department-head' || selectedRole === 'dean';
            departmentWrap.classList.toggle('hidden', !showDepartment);
        }
    }

    if (openCreateUserModalBtn) {
        openCreateUserModalBtn.classList.toggle('hidden', !canDeleteUsers);
        openCreateUserModalBtn.addEventListener('click', openCreateUserModal);
    }
    if (closeCreateUserModalBtn) closeCreateUserModalBtn.addEventListener('click', closeCreateUserModal);
    if (cancelCreateUserBtn) cancelCreateUserBtn.addEventListener('click', closeCreateUserModal);
    if (createRole) createRole.addEventListener('change', syncRoleFields);

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
            const department = document.getElementById('createDepartment')?.value?.trim() || null;
            const evaluatorExpiresAt = createEvaluatorExpiresAt?.value || null;

            if (!firstName || !lastName || !email || !role || !password || !confirmPassword) {
                alert('Please fill in all required fields.');
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }
            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }

            const normalizedRole = role.toLowerCase().trim();
            const isEvaluator = normalizedRole === 'evaluator';
            const needsDepartment = normalizedRole === 'faculty' || normalizedRole === 'area-chair' || normalizedRole === 'department-head' || normalizedRole === 'dean';
            
            if (needsDepartment && !department) {
                alert('Please select a department/program for this role.');
                return;
            }
            
            if (isEvaluator && !evaluatorExpiresAt) {
                alert('Please set an expiration date/time for External Evaluator.');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/admin/users', {
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

                alert(result.msg || 'User account created successfully.');
                closeCreateUserModal();
                fetchAndRenderUsers();
            } catch (error) {
                console.error('Error creating user:', error);
                alert(`Failed to create user: ${error.message}`);
            }
        });
    }

    // Delete User Functions
    function openDeleteModal(userId) {
        userIdToDelete = userId;
        if (deleteUserModal) deleteUserModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        userIdToDelete = null;
        if (deleteUserModal) deleteUserModal.classList.add('hidden');
    }

    async function deleteUser() {
        if (!userIdToDelete) return;
        
        if (isTokenExpired(token)) {
            handleExpiredToken();
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${userIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });

            if (response.status === 401) {
                handleExpiredToken();
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to delete user.');
            }

            alert('User has been deleted successfully.');
            closeDeleteModal();
            fetchAndRenderUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user: ${error.message}`);
        }
    }

    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteUser);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteUserModal) {
        deleteUserModal.addEventListener('click', (e) => {
            if (e.target === deleteUserModal) closeDeleteModal();
        });
    }

    async function fetchAndRenderUsers() {
        // Check token before fetching
        if (isTokenExpired(token)) {
            handleExpiredToken();
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
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
                        alert('Dean access to Users requires updated server permissions.');
                        window.location.href = 'homepage.html';
                        return;
                    }
                    alert('You are not authorized to view this page.');
                    window.location.href = 'homepage.html';
                    return;
                }

                throw new Error('Failed to fetch users.');
            }

            const users = await response.json();
            allUsers = users;
            renderUsers(users);
            updateStats(users);

        } catch (error) {
            console.error('Error fetching users:', error);
            if (usersTableBody) {
                usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-red-500">Error loading users. Please refresh the page or login again.</td></tr>`;
            }
        }
    }

    function updateStats(users) {
        const totalUsers = users.length;
        const approvedUsers = users.filter(u => u.status === 'approved').length;
        const pendingUsers = users.filter(u => u.status === 'pending').length;
        const uniqueRoles = new Set(users.map(u => u.role).filter(r => r)).size;

        const totalEl = document.getElementById('totalUsersCount');
        const approvedEl = document.getElementById('approvedUsersCount');
        const pendingEl = document.getElementById('pendingUsersCount');
        const rolesEl = document.querySelector('.stat-card:nth-child(4) .text-3xl');
        
        if (totalEl) totalEl.textContent = totalUsers;
        if (approvedEl) approvedEl.textContent = approvedUsers;
        if (pendingEl) pendingEl.textContent = pendingUsers;
        if (rolesEl) rolesEl.textContent = uniqueRoles;

        const activeRate = totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0;
        const approvedRateEl = document.querySelector('.stat-card:nth-child(2) .text-xs');
        const totalLabelEl = document.querySelector('.stat-card:nth-child(1) .text-xs');
        
        if (approvedRateEl) approvedRateEl.textContent = `${activeRate}% approved rate`;
        if (totalLabelEl) totalLabelEl.textContent = totalUsers > 0 ? `${totalUsers} total` : 'No users yet';
    }

    function getRoleBadge(role) {
        const colors = {
            'admin': 'bg-purple-100 text-purple-700',
            'dean': 'bg-indigo-100 text-indigo-700',
            'department-head': 'bg-blue-100 text-blue-700',
            'area-chair': 'bg-amber-100 text-amber-700',
            'faculty': 'bg-green-100 text-green-700',
            'evaluator': 'bg-gray-100 text-gray-700'
        };
        const color = colors[role] || 'bg-gray-100 text-gray-700';
        return `<span class="${color} text-xs px-2 py-1 rounded-full">${getRoleDisplayName(role)}</span>`;
    }

    function renderUsers(users) {
        if (!usersTableBody) return;
        usersTableBody.innerHTML = '';

        if (users.length === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500">No users found matching your criteria.</td></tr>`;
            return;
        }

        function isCurrentlyActive(lastActive) {
            if (!lastActive) return false;
            const lastActiveDate = new Date(lastActive);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return lastActiveDate > fiveMinutesAgo;
        }

        function formatLastActive(lastActive, role) {
            if (!lastActive) return 'Never';
            if (role && role.toLowerCase() === 'evaluator') return 'Never';
            if (isCurrentlyActive(lastActive)) {
                return '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">🟢 active now</span>';
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
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'user-row hover:bg-gray-50 transition-colors';

            const statusBadge = user.status === 'approved' 
                ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Approved</span>`
                : user.status === 'rejected'
                ? `<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejected</span>`
                : `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">Pending</span>`;

            const lastActiveDisplay = formatLastActive(user.lastActive, user.role);
            const userId = user.id || user._id;
            const roleDisplay = getRoleDisplayName(user.role);
            const departmentDisplay = user.department || (user.role === 'faculty' || user.role === 'area-chair' || user.role === 'department-head' || user.role === 'dean' ? 'Not Assigned' : 'N/A');
            
            const actionButtons = userId
                ? `
                    <a href="view-faculty-profile.html?userId=${encodeURIComponent(userId)}" class="action-pill action-pill-view" title="View Profile">View</a>
                    ${canDeleteUsers && user.id !== currentUser?.id ? `<button class="action-pill action-pill-delete delete-user" data-id="${userId}" title="Delete User">Delete</button>` : ''}
                `
                : '<span class="text-gray-400">N/A</span>';

            row.innerHTML = `
                <td class="py-3 px-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                            ${(user.firstName?.charAt(0) || '')}${(user.lastName?.charAt(0) || '')}
                        </div>
                        <div>
                            <div class="font-medium text-gray-800">${user.firstName || ''} ${user.lastName || ''}</div>
                            <div class="text-xs text-gray-400">${roleDisplay}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-2 text-gray-600 text-sm">${user.email || ''}</td>
                <td class="py-3 px-2">${getRoleBadge(user.role)}</td>
                <td class="py-3 px-2 text-gray-600 text-sm">${escapeHtml(departmentDisplay)}</td>
                <td class="py-3 px-2">${statusBadge}</td>
                <td class="py-3 px-2 text-gray-400 text-xs">${lastActiveDisplay}</td>
                <td class="py-3 px-2">
                    <div class="flex items-center gap-2">
                        ${actionButtons}
                    </div>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
        
        // Add delete button event listeners
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-id');
                if (userId && canDeleteUsers) {
                    openDeleteModal(userId);
                }
            });
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
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
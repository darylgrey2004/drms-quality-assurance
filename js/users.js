// js/users.js

document.addEventListener('DOMContentLoaded', function() {
    const usersTableBody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('searchUsers');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const token = localStorage.getItem('token');
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

    let allUsers = []; // Store all users for filtering

    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

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
    }

    function syncEvaluatorExpiryField() {
        if (!createRole || !evaluatorExpiryWrap || !createEvaluatorExpiresAt) return;
        const selectedRole = (createRole.value || '').toLowerCase().trim();
        const isEvaluator = selectedRole === 'evaluator' || selectedRole === 'external evaluator';
        evaluatorExpiryWrap.classList.toggle('hidden', !isEvaluator);
        createEvaluatorExpiresAt.required = isEvaluator;
        if (!isEvaluator) createEvaluatorExpiresAt.value = '';
    }

    if (openCreateUserModalBtn) {
        openCreateUserModalBtn.classList.toggle('hidden', !canDeleteUsers);
        openCreateUserModalBtn.addEventListener('click', openCreateUserModal);
    }
    if (closeCreateUserModalBtn) closeCreateUserModalBtn.addEventListener('click', closeCreateUserModal);
    if (cancelCreateUserBtn) cancelCreateUserBtn.addEventListener('click', closeCreateUserModal);
    if (createRole) createRole.addEventListener('change', syncEvaluatorExpiryField);
    if (createUserModal) {
        createUserModal.addEventListener('click', function (e) {
            if (e.target === createUserModal) closeCreateUserModal();
        });
    }

    if (createUserForm) {
        createUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!canDeleteUsers) return;

            const firstName = document.getElementById('createFirstName')?.value?.trim();
            const lastName = document.getElementById('createLastName')?.value?.trim();
            const middleInitial = document.getElementById('createMiddleInitial')?.value?.trim() || null;
            const email = document.getElementById('createEmail')?.value?.trim();
            const role = document.getElementById('createRole')?.value;
            const password = document.getElementById('createPassword')?.value;
            const confirmPassword = document.getElementById('createConfirmPassword')?.value;
            const evaluatorExpiresAt = createEvaluatorExpiresAt?.value || null;

            if (!firstName || !lastName || !email || !role || !password || !confirmPassword) {
                alert('Please fill in all required fields.');
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            const normalizedRole = role.toLowerCase().trim();
            const isEvaluator = normalizedRole === 'evaluator' || normalizedRole === 'external evaluator';
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
                        evaluatorExpiresAt
                    })
                });

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

    // Function to fetch users and render them in the table
    async function fetchAndRenderUsers() {
        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Your session has expired. Please login again.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'landing.html';
                    return;
                }

                if (response.status === 403) {
                    if (viewerRole === 'dean') {
                        alert('Dean access to Users requires updated server permissions. Please restart the backend server.');
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
            allUsers = users; // Store for filtering
            renderUsers(users);
            updateStats(users);

        } catch (error) {
            console.error('Error fetching users:', error);
            usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Error loading users. Please try again.</td></tr>`;
        }
    }

    // Function to update statistics cards
    function updateStats(users) {
        const totalUsers = users.length;
        const approvedUsers = users.filter(u => u.status === 'approved').length;
        const pendingUsers = users.filter(u => u.status === 'pending').length;
        const uniqueRoles = new Set(users.map(u => u.role).filter(r => r)).size;

        // Update stat cards
        document.querySelector('.stat-card:nth-child(1) .text-3xl').textContent = totalUsers;
        document.querySelector('.stat-card:nth-child(2) .text-3xl').textContent = approvedUsers;
        document.querySelector('.stat-card:nth-child(3) .text-3xl').textContent = pendingUsers;
        document.querySelector('.stat-card:nth-child(4) .text-3xl').textContent = uniqueRoles;

        // Update percentages
        const activeRate = totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0;
        document.querySelector('.stat-card:nth-child(2) .text-xs').textContent = `${activeRate}% approved rate`;
        document.querySelector('.stat-card:nth-child(1) .text-xs').textContent = totalUsers > 0 ? `${totalUsers} total` : 'No users yet';
    }

    // Function to render the users in the table
    function renderUsers(users) {
        usersTableBody.innerHTML = ''; // Clear existing rows

        if (users.length === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500">No users found matching your criteria.</td></tr>`;
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'user-row hover:bg-gray-50 transition-colors';

            // Define status badge based on user status
            const statusBadge = user.status === 'approved' 
                ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Approved</span>`
                : user.status === 'rejected'
                ? `<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejected</span>`
                : `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">Pending</span>`;

            // Format last active date or show 'Never'
            const lastActive = user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never';
            
            const userId = user.id || user._id;
            const actionButtons = userId
                ? `
                    <a href="view-faculty-profile.html?userId=${encodeURIComponent(userId)}" class="action-pill action-pill-view" title="View Profile">View Profile</a>
                    ${canDeleteUsers ? `<button class="action-pill action-pill-delete delete-user" data-id="${userId}" title="Delete User">Delete</button>` : ''}
                `
                : '<span class="text-gray-400">N/A</span>';

            // Construct the table row
            row.innerHTML = `
                <td class="py-3 px-2">
                    <div class="flex items-center gap-2">
                        <div>
                            <div class="font-medium text-gray-800">${user.firstName} ${user.lastName}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-2 text-gray-600">${user.email}</td>
                <td class="py-3 px-2 text-gray-600">${user.role || 'User'}</td>
                <td class="py-3 px-2 text-gray-600">${user.department || 'N/A'}</td>
                <td class="py-3 px-2">${statusBadge}</td>
                <td class="py-3 px-2 text-gray-400">${lastActive}</td>
                <td class="py-3 px-2">
                    <div class="flex items-center gap-3">
                        ${actionButtons}
                    </div>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    }

    usersTableBody.addEventListener('click', async function(e) {
        const deleteButton = e.target.closest('.delete-user');
        if (!deleteButton) return;

        const userId = deleteButton.getAttribute('data-id');
        if (!userId) return;
        if (!canDeleteUsers) return;

        if (confirm('Are you sure you want to delete this user?')) {
            await deleteUser(userId);
        }
    });

    async function deleteUser(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${encodeURIComponent(userId)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to delete user.');
            }

            alert('User has been deleted.');
            fetchAndRenderUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user: ${error.message}`);
        }
    }

    // Initial fetch and render of users
    fetchAndRenderUsers();

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterUsers();
        });
    }

    // Role filter functionality
    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            filterUsers();
        });
    }

    // Status filter functionality
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterUsers();
        });
    }

    // Filter users based on search and filters
    function filterUsers() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedRole = roleFilter.value;
        const selectedStatus = statusFilter.value;

        let filteredUsers = allUsers;

        // Filter by search term (name, email, or role)
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => {
                const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                const role = (user.role || '').toLowerCase();
                const department = (user.department || '').toLowerCase();
                
                return fullName.includes(searchTerm) || 
                       email.includes(searchTerm) || 
                       role.includes(searchTerm) ||
                       department.includes(searchTerm);
            });
        }

        // Filter by role
        if (selectedRole !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === selectedRole);
        }

        // Filter by status
        if (selectedStatus !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.status === selectedStatus);
        }

        // Render filtered users
        renderUsers(filteredUsers);
    }
});
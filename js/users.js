// js/users.js

document.addEventListener('DOMContentLoaded', function() {
    const usersTableBody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('searchUsers');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const token = localStorage.getItem('token');

    let allUsers = []; // Store all users for filtering

    if (!token) {
        window.location.href = 'landing.html';
        return;
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
                if (response.status === 401 || response.status === 403) {
                    alert('You are not authorized to view this page. Redirecting to login.');
                    localStorage.removeItem('token');
                    window.location.href = 'landing.html';
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
            
            // Determine which action buttons to show
            let actionButtons = '';
<<<<<<< Updated upstream
            if (user.status === 'pending') {
                actionButtons = `
                    <a href="view-faculty-profile.html?userId=${user.id}" class="text-teal-600 hover:text-teal-800" title="View User">View</a>
                    <button class="text-green-600 hover:text-green-800 approve-user" data-id="${user.id}" title="Approve User">✓ Approve</button>
                    <button class="text-red-600 hover:text-red-800 reject-user" data-id="${user.id}" title="Reject User">✕ Reject</button>
                `;
=======
            const isAdmin = (user.role || '').toLowerCase().trim() === 'admin';
            if (isAdmin) {
                actionButtons = '';
            } else if (isViewOnly) {
                actionButtons = `<a href="view-faculty-profile.html?userId=${user.id}" class="text-teal-600 hover:text-teal-800" title="View User">View</a>`;
>>>>>>> Stashed changes
            } else {
                actionButtons = `
                    <a href="view-faculty-profile.html?userId=${user.id}" class="text-teal-600 hover:text-teal-800" title="View User">View</a>
                    <button class="text-teal-600 hover:text-teal-800 edit-user" data-id="${user.id}" title="Edit User">✏️ Edit</button>
                    <button class="text-red-600 hover:text-red-800 delete-user" data-id="${user.id}" title="Delete User">🗑️ Delete</button>
                `;
            }

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
                    <div class="flex gap-2">
                        ${actionButtons}
                    </div>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    }

    usersTableBody.addEventListener('click', async function(e) {
        const target = e.target.closest('button'); // Ensure we get the button element
        if (!target) return;

        const userId = target.getAttribute('data-id');

        if (target.classList.contains('edit-user')) {
            alert(`Edit functionality for user ID ${userId} is not yet implemented.`);
        } else if (target.classList.contains('delete-user')) {
            if (confirm('Are you sure you want to delete this user?')) {
                await deleteUser(userId);
            }
        }
    });


    async function deleteUser(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to reject user.');
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
// Mobile Sidebar Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.w-72');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle && sidebar && overlay) {
        // Toggle sidebar when hamburger menu is clicked
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });
        
        // Close sidebar when overlay is clicked
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });
        
        // Close sidebar when a navigation link is clicked (optional)
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });
    }
    
    // Close sidebar when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    });
});
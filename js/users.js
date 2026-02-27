// js/users.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Users page JS loaded successfully');
    
    // DOM elements
    const searchInput = document.getElementById('searchUsers');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const addUserBtn = document.getElementById('addUserBtn');
    const sendInviteBtn = document.getElementById('sendInviteBtn');
    const inviteEmail = document.getElementById('inviteEmail');
    const inviteRole = document.getElementById('inviteRole');
    const userRows = document.querySelectorAll('.user-row');
    
    // Action buttons
    const editButtons = document.querySelectorAll('.edit-user');
    const viewButtons = document.querySelectorAll('.view-user');
    const deactivateButtons = document.querySelectorAll('.deactivate-user');
    const approveButtons = document.querySelectorAll('.approve-user');
    const rejectButtons = document.querySelectorAll('.reject-user');
    const reactivateButtons = document.querySelectorAll('.reactivate-user');
    
    // Filter function
    function filterUsers() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const role = roleFilter ? roleFilter.value : 'all';
        const status = statusFilter ? statusFilter.value : 'all';
        
        let visibleCount = 0;
        
        userRows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            const rowRole = row.getAttribute('data-role') || '';
            const rowStatus = row.getAttribute('data-status') || '';
            
            // Search match
            const matchesSearch = searchTerm === '' || rowText.includes(searchTerm);
            
            // Role match
            let matchesRole = role === 'all';
            if (!matchesRole) {
                matchesRole = rowRole === role;
            }
            
            // Status match
            let matchesStatus = status === 'all';
            if (!matchesStatus) {
                matchesStatus = rowStatus === status;
            }
            
            if (matchesSearch && matchesRole && matchesStatus) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });
        
        // Update visible count (could be displayed)
        console.log(`Showing ${visibleCount} of ${userRows.length} users`);
        
        // Update any counter if needed
        const showingSpan = document.querySelector('.text-sm.text-gray-500');
        if (showingSpan && showingSpan.textContent.includes('Showing')) {
            showingSpan.textContent = `Showing 1 to ${visibleCount} of ${userRows.length} users`;
        }
    }
    
    // Add event listeners for filters
    if (searchInput) searchInput.addEventListener('input', filterUsers);
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);
    if (statusFilter) statusFilter.addEventListener('change', filterUsers);
    
    // Add User button
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            alert('Add User form would open here.\n\nThis would allow creating a new user manually.');
        });
    }
    
    // Send Invitation button
    if (sendInviteBtn) {
        sendInviteBtn.addEventListener('click', function() {
            const email = inviteEmail ? inviteEmail.value : '';
            const role = inviteRole ? inviteRole.value : 'faculty';
            
            if (!email) {
                alert('Please enter an email address');
                return;
            }
            
            if (!email.includes('@')) {
                alert('Please enter a valid email address');
                return;
            }
            
            alert(`Invitation sent to ${email} with role: ${role}\n\nIn a full system, this would send an email with setup instructions.`);
            
            // Clear the input
            if (inviteEmail) inviteEmail.value = '';
        });
    }
    
    // Edit user buttons
    editButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-id') || 'unknown';
            const userRow = this.closest('tr');
            const userName = userRow?.querySelector('.font-medium')?.textContent || 'User';
            
            alert(`Editing user: ${userName} (ID: ${userId})\n\nThis would open the user edit form.`);
        });
    });
    
    // View user buttons
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-id') || 'unknown';
            const userRow = this.closest('tr');
            const userName = userRow?.querySelector('.font-medium')?.textContent || 'User';
            
            alert(`Viewing user profile: ${userName}\n\nThis would show detailed user information and activity.`);
        });
    });
    
    // Deactivate user buttons
    deactivateButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-id') || 'unknown';
            const userRow = this.closest('tr');
            const userName = userRow?.querySelector('.font-medium')?.textContent || 'User';
            
            if (confirm(`Deactivate user: ${userName}?`)) {
                alert(`User ${userName} has been deactivated.`);
                
                // Update UI (demo)
                const statusSpan = userRow?.querySelector('td:nth-child(5) span');
                if (statusSpan) {
                    statusSpan.className = 'bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs';
                    statusSpan.textContent = 'Inactive';
                }
                
                // Update data attribute
                if (userRow) {
                    userRow.setAttribute('data-status', 'inactive');
                }
            }
        });
    });
    
    // Approve pending user buttons
    approveButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-id') || 'unknown';
            const userRow = this.closest('tr');
            const userName = userRow?.querySelector('.font-medium')?.textContent || 'User';
            
            if (confirm(`Approve user: ${userName}?`)) {
                alert(`User ${userName} has been approved and activated.`);
                
                // Update UI (demo)
                const statusSpan = userRow?.querySelector('td:nth-child(5) span');
                if (statusSpan) {
                    statusSpan.className = 'badge-approved px-2 py-1 rounded-full text-xs';
                    statusSpan.textContent = 'Active';
                }
                
                // Update action buttons
                const actionCell = userRow?.querySelector('td:last-child');
                if (actionCell) {
                    actionCell.innerHTML = `
                        <div class="flex gap-2">
                            <button class="text-teal-600 hover:text-teal-800 edit-user" data-id="${userId}">✏️</button>
                            <button class="text-gray-500 hover:text-gray-700 view-user" data-id="${userId}">👁️</button>
                            <button class="text-red-500 hover:text-red-700 deactivate-user" data-id="${userId}">🔒</button>
                        </div>
                    `;
                }
                
                // Update data attribute
                if (userRow) {
                    userRow.setAttribute('data-status', 'active');
                }
            }
        });
    });
    
    // Reject pending user buttons
    rejectButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-id') || 'unknown';
            const userRow = this.closest('tr');
            const userName = userRow?.querySelector('.font-medium')?.textContent || 'User';
            
            if (confirm(`Reject user: ${userName}?`)) {
                alert(`User ${userName} has been rejected.`);
                
                // Remove row (demo)
                if (userRow) {
                    userRow.remove();
                }
            }
        });
    });
    
    // Reactivate inactive user buttons
    reactivateButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-id') || 'unknown';
            const userRow = this.closest('tr');
            const userName = userRow?.querySelector('.font-medium')?.textContent || 'User';
            
            if (confirm(`Reactivate user: ${userName}?`)) {
                alert(`User ${userName} has been reactivated.`);
                
                // Update UI (demo)
                const statusSpan = userRow?.querySelector('td:nth-child(5) span');
                if (statusSpan) {
                    statusSpan.className = 'badge-approved px-2 py-1 rounded-full text-xs';
                    statusSpan.textContent = 'Active';
                }
                
                // Update action buttons
                const actionCell = userRow?.querySelector('td:last-child');
                if (actionCell) {
                    actionCell.innerHTML = `
                        <div class="flex gap-2">
                            <button class="text-teal-600 hover:text-teal-800 edit-user" data-id="${userId}">✏️</button>
                            <button class="text-gray-500 hover:text-gray-700 view-user" data-id="${userId}">👁️</button>
                            <button class="text-red-500 hover:text-red-700 deactivate-user" data-id="${userId}">🔒</button>
                        </div>
                    `;
                }
                
                // Update data attribute
                if (userRow) {
                    userRow.setAttribute('data-status', 'active');
                }
            }
        });
    });
    
    // Pagination buttons (demo)
    const paginationButtons = document.querySelectorAll('.flex.gap-2 button');
    paginationButtons.forEach(btn => {
        if (btn.textContent === 'Previous' || btn.textContent === 'Next') {
            btn.addEventListener('click', function() {
                alert(`${this.textContent} page would load in the full system`);
            });
        } else if (btn.textContent.match(/^\d+$/)) {
            btn.addEventListener('click', function() {
                // Page number click
                paginationButtons.forEach(b => {
                    if (b.textContent.match(/^\d+$/)) {
                        b.classList.remove('bg-teal-700', 'text-white');
                        b.classList.add('bg-white', 'border', 'border-gray-300', 'text-gray-600');
                    }
                });
                this.classList.remove('bg-white', 'border', 'border-gray-300', 'text-gray-600');
                this.classList.add('bg-teal-700', 'text-white');
                
                alert(`Page ${this.textContent} would load in the full system`);
            });
        }
    });
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'users.html';
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
    
    // Initialize filter count
    filterUsers();
});
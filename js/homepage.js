// js/homepage.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // ── Admin Role-Based Access Control ──
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) { window.location.href = 'landing.html'; return; }

    const role = (user.role || '').toLowerCase().trim();
    const currentPage = window.location.pathname.split('/').pop() || 'homepage.html';

    // Redirect user-level roles to their dashboard
    if (role === 'faculty member' || role === 'area chair/program head') {
        window.location.href = 'user-dashboard.html'; return;
    }

    // Populate sidebar user info
    const elById = (id) => document.getElementById(id);
    const initials = (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
    if (elById('sidebarInitials')) elById('sidebarInitials').textContent = initials;
    if (elById('sidebarName')) elById('sidebarName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (elById('sidebarRole')) elById('sidebarRole').textContent = user.role || 'Admin';
    fetch(`http://localhost:3000/api/user/profile/${user.id}`, {
        headers: { 'x-auth-token': token }
    }).then(r => r.json()).then(data => {
        if (elById('sidebarRole')) {
            const dept = data.department ? ` · ${data.department}` : '';
            elById('sidebarRole').textContent = `${data.role || user.role}${dept}`;
        }
    }).catch(() => {});

    // Hide Upload, Users, and Settings links for QA Coordinator on all pages
    if (role === 'qa coordinator') {
        const uploadLink = document.querySelector('a[href="upload.html"]');
        if (uploadLink) uploadLink.style.display = 'none';
        const usersLink = document.querySelector('a[href="users.html"]');
        if (usersLink) usersLink.style.display = 'none';
        const settingsLink = document.querySelector('a[href="settings.html"]');
        if (settingsLink) settingsLink.style.display = 'none';
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }

    // Heartbeat
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);
    // ─────────────────────────────────────────────────

    console.log('Homepage JS loaded successfully');
    
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
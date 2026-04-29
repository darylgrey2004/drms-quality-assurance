// js/homepage.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Homepage JS loaded successfully');
    
    // ── Role-based access control ──
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        window.location.href = 'landing.html';
        return;
    }
    
    // Validate user role - only admin and dean should access homepage
    const role = (user.role || '').toLowerCase().trim();
    const allowedRoles = ['admin', 'dean'];
    
    // Redirect faculty and area-chair to user-dashboard.html
    if (role === 'faculty' || role === 'area-chair') {
        window.location.href = 'user-dashboard.html';
        return;
    }
    
    // Redirect evaluator to evaluator-dashboard.html
    if (role === 'evaluator') {
        window.location.href = 'evaluator-dashboard.html';
        return;
    }
    
    // If role is not in allowed list, redirect to landing
    if (!allowedRoles.includes(role)) {
        alert('Access denied. Invalid role for this dashboard.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'landing.html';
        return;
    }
    
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
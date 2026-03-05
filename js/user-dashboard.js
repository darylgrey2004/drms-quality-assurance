// js/user-dashboard.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('User Dashboard JS loaded successfully');
    
    // Notification button
    const notificationBtn = document.querySelector('button[class*="bg-white p-2 rounded-full"]');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            alert('Notifications panel would open here.\n\nYou have 3 new notifications.');
        });
    }
    
    // View document buttons
    const viewButtons = document.querySelectorAll('.text-teal-600.hover\\:text-teal-800');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const docName = row?.querySelector('.font-medium')?.textContent || 'Document';
            alert(`Viewing: ${docName}\n\nThis would open the document viewer.`);
        });
    });
    
    // Attachment buttons
    const attachButtons = document.querySelectorAll('.text-gray-500.hover\\:text-gray-700');
    attachButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Document attachments and version history would open here.');
        });
    });
    
    // Upload buttons in deadlines
    const uploadButtons = document.querySelectorAll('.text-xs.text-teal-700.hover\\:text-teal-800');
    uploadButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'user-upload.html';
        });
    });
    
    // View all notifications
    const viewAllLink = document.querySelector('.mt-3.text-sm.text-teal-700');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('All notifications would be displayed here.');
        });
    }
    
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
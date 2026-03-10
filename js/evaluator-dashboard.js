// js/evaluator-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Dashboard JS loaded');

    // View document buttons (read-only)
    const viewButtons = document.querySelectorAll('.view-doc');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const docName = row?.querySelector('.font-medium')?.textContent || 'Document';
            
            alert(`🔍 VIEW ONLY MODE\n\nDocument: ${docName}\n\nThis would open the document viewer. As an External Evaluator, you have view-only access.`);
        });
    });

    // Quick links - just show view confirmation
    const quickLinks = document.querySelectorAll('.hover\\:bg-gray-50');
    quickLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Let the link work normally - we just want to ensure view-only message
            const linkText = this.querySelector('.font-medium')?.textContent || 'section';
            console.log(`Navigating to ${linkText} (view-only mode)`);
        });
    });

    // Activity feed items - informational only
    const activityItems = document.querySelectorAll('.border-b.border-gray-100, .flex.items-start.gap-3');
    activityItems.forEach(item => {
        item.addEventListener('click', function() {
            const activity = this.querySelector('.text-sm')?.textContent || 'Activity';
            alert(`📋 Activity Details\n\n${activity}\n\nThis shows the activity log. No actions can be taken in view-only mode.`);
        });
    });

    // Stats cards - show summary
    const statCards = document.querySelectorAll('.stat-card .text-3xl');
    statCards.forEach(card => {
        card.addEventListener('click', function() {
            const statName = this.closest('.stat-card')?.querySelector('.text-gray-500')?.textContent || 'Statistic';
            const value = this.textContent;
            alert(`📊 ${statName}\n\nCurrent value: ${value}\n\nThis is a view-only summary.`);
        });
    });

    // View All links
    const viewAllLinks = document.querySelectorAll('a.text-sm.text-teal-700');
    viewAllLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Let the link work normally
            console.log('Navigating to view all');
        });
    });

    // Add view-only indicator to all interactive elements
    const addViewOnlyIndicator = () => {
        const interactive = document.querySelectorAll('button:not(.view-doc), a:not([href="#"]), .cursor-pointer');
        // Just for demo purposes - in production, this would be handled by CSS
    };

    // Simulate view-only mode warning on first load
    setTimeout(() => {
        console.log('External Evaluator Mode: View-Only Access Active');
    }, 1000);

    // Handle any potential upload attempts (safety)
    document.addEventListener('click', function(e) {
        if (e.target.closest('button')?.textContent.includes('Upload') ||
            e.target.closest('a')?.textContent.includes('Upload')) {
            e.preventDefault();
            alert('❌ Upload is disabled in External Evaluator mode. You have view-only access.');
        }
    });

    // Profile link
    const profileLink = document.querySelector('a[href="evaluator-profile.html"]');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            console.log('Navigating to profile (view-only mode)');
        });
    }

    // Logout simulation (if needed)
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Logout from Evaluator session?')) {
                window.location.href = 'landing.html';
            }
        });
    }
});
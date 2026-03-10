// js/evaluator-profile.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Profile JS loaded');

    // Activity log items
    const activityItems = document.querySelectorAll('.border-b, .flex.items-start.gap-3');
    activityItems.forEach(item => {
        item.addEventListener('click', function() {
            const activity = this.querySelector('.text-sm')?.textContent || 'Activity';
            alert(`📋 ${activity}\n\nThis shows details of your evaluation activity.`);
        });
    });

    // Access details boxes
    const infoBoxes = document.querySelectorAll('.border.rounded-lg');
    infoBoxes.forEach(box => {
        box.addEventListener('click', function() {
            const title = this.querySelector('.text-sm.font-medium')?.textContent || 'Information';
            const content = this.querySelector('.text-xs.text-gray-500')?.textContent || '';
            alert(`ℹ️ ${title}\n\n${content}`);
        });
    });

    // Profile information (view-only, so just informational)
    const profileFields = document.querySelectorAll('.grid .text-gray-800');
    profileFields.forEach(field => {
        field.addEventListener('click', function() {
            const label = this.previousElementSibling?.textContent || 'Field';
            const value = this.textContent;
            alert(`👤 ${label}\n\nCurrent value: ${value}\n\nProfile information is view-only. Contact administrator for changes.`);
        });
    });

    // Access expiry warning
    const expiryDate = document.querySelector('.text-gray-800:contains("March 31, 2026")');
    if (expiryDate) {
        const daysLeft = 21; // Calculate in real app
        console.log(`Access expires in ${daysLeft} days`);
    }

    // Any attempt to edit profile
    document.addEventListener('click', function(e) {
        if (e.target.closest('button')?.textContent.includes('Edit') ||
            e.target.closest('button')?.textContent.includes('Update') ||
            e.target.closest('button')?.textContent.includes('Change')) {
            e.preventDefault();
            alert('❌ Profile editing is disabled. You have view-only access.');
        }
    });

    // View-only mode indicator
    console.log('Profile loaded in view-only mode');

    // Optional: Simulate session timeout warning
    const sessionTimeout = () => {
        console.log('Session active - view-only mode');
    };

    setInterval(sessionTimeout, 60000); // Check every minute
});
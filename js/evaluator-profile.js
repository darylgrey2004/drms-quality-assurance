// js/evaluator-profile.js

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) {
        window.location.href = 'landing.html';
        return;
    }

    function api(path) {
        return fetch(`http://localhost:3000${path}`, {
            headers: { 'x-auth-token': token }
        }).then((r) => r.json());
    }

    // Activity log items
    const activityItems = document.querySelectorAll('.border-b, .flex.items-start.gap-3');
    activityItems.forEach(item => {
        item.addEventListener('click', function() {
            const activity = this.querySelector('.text-sm')?.textContent || 'Activity';
            console.log('Activity:', activity);
        });
    });

    // Access details boxes
    const infoBoxes = document.querySelectorAll('.border.rounded-lg');
    infoBoxes.forEach(box => {
        box.addEventListener('click', function() {
            const title = this.querySelector('.text-sm.font-medium')?.textContent || 'Information';
            const content = this.querySelector('.text-xs.text-gray-500')?.textContent || '';
            console.log(title, content);
        });
    });

    // Profile information (view-only, so just informational)
    const profileFields = document.querySelectorAll('.grid .text-gray-800');
    profileFields.forEach(field => {
        field.addEventListener('click', function() {
            const label = this.previousElementSibling?.textContent || 'Field';
            const value = this.textContent;
            console.log(label, value);
        });
    });

    api(`/api/user/profile/${user.id}`).then((profile) => {
        const values = document.querySelectorAll('.grid .text-gray-800');
        if (values[0] && profile.firstName) values[0].textContent = `${profile.firstName} ${profile.lastName || ''}`.trim();
        if (values[1] && profile.email) values[1].textContent = profile.email;
        if (values[2] && profile.role) values[2].textContent = profile.role;
        if (values[3] && profile.department) values[3].textContent = profile.department;
    }).catch(() => {});

    // Any attempt to edit profile
    document.addEventListener('click', function(e) {
        if (e.target.closest('button')?.textContent.includes('Edit') ||
            e.target.closest('button')?.textContent.includes('Update') ||
            e.target.closest('button')?.textContent.includes('Change')) {
            e.preventDefault();
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
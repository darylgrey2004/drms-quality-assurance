// js/user-profile.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('User Profile JS loaded');

    // DOM elements
    const changeAvatar = document.getElementById('changeAvatar');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const notificationCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const savePrefsBtn = document.querySelector('.mt-4 .bg-teal-700');

    // Change avatar
    if (changeAvatar) {
        changeAvatar.addEventListener('click', function() {
            alert('Profile picture uploader would open here.\n\nSupported formats: JPG, PNG, GIF (Max: 2MB)');
        });
    }

    // Profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = this.querySelector('input[placeholder="First Name"]')?.value;
            const lastName = this.querySelector('input[placeholder="Last Name"]')?.value;
            
            alert(`Profile updated successfully!\n\nName: ${firstName} ${lastName}`);
        });
    }

    // Password form submission
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPass = this.querySelector('input[type="password"]')?.value;
            const newPass = this.querySelectorAll('input[type="password"]')[1]?.value;
            const confirmPass = this.querySelectorAll('input[type="password"]')[2]?.value;

            if (!currentPass || !newPass || !confirmPass) {
                alert('Please fill in all password fields');
                return;
            }

            if (newPass !== confirmPass) {
                alert('New passwords do not match');
                return;
            }

            if (newPass.length < 8) {
                alert('Password must be at least 8 characters long');
                return;
            }

            alert('Password updated successfully!');
            this.reset();
        });
    }

    // Save notification preferences
    if (savePrefsBtn) {
        savePrefsBtn.addEventListener('click', function() {
            const preferences = [];
            notificationCheckboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                    const label = checkbox.nextElementSibling?.textContent || `Preference ${index + 1}`;
                    preferences.push(label);
                }
            });

            alert(`Notification preferences saved!\n\nEnabled: ${preferences.length} notifications`);
        });
    }

    // Enable 2FA button
    const enable2FABtn = document.querySelector('.border.border-gray-300.rounded-lg');
    if (enable2FABtn && enable2FABtn.textContent.includes('Enable Two-Factor')) {
        enable2FABtn.addEventListener('click', function() {
            alert('Two-factor authentication setup would begin.\n\nYou would receive instructions via email.');
        });
    }

    // Stats cards are informational only - no actions needed

    // Optional: Add logout functionality (if needed)
    const logoutItem = document.querySelector('a[href="#"]'); // Add if you have logout link
    if (logoutItem && logoutItem.textContent.includes('Logout')) {
        logoutItem.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = 'landing.html';
            }
        });
    }
});
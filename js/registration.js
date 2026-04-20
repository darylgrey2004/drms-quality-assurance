// js/registration.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Registration page loaded');
    
    const form = document.getElementById('registrationForm');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const lastName = document.getElementById('lastName').value.trim();
            const firstName = document.getElementById('firstName').value.trim();
            const middleInitial = document.getElementById('middleInitial').value.trim();
            const email = document.getElementById('email').value.trim();
            const role = document.getElementById('role').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate
            if (!lastName || !firstName || !email || !role || !password || !confirmPassword) {
                alert('Please fill in all required fields');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            // Save data to localStorage
            const registrationData = {
                firstName: firstName,
                lastName: lastName,
                middleInitial: middleInitial,
                email: email,
                password: password,
                role: role
            };

            localStorage.setItem('registrationData', JSON.stringify(registrationData));

            // Redirect to faculty profile form
            alert('Proceeding to profile setup.');
            window.location.href = 'faculty-profile-form.html';
        });
    }

    // Password toggle handlers
    if (togglePassword) {
        addToggleListener('togglePassword', 'password', 'eyeIconPass', 'eyeOffIconPass');
    }
    if (toggleConfirmPassword) {
        addToggleListener('toggleConfirmPassword', 'confirmPassword', 'eyeIconConfirm', 'eyeOffIconConfirm');
    }

    function addToggleListener(toggleId, inputId, eyeId, eyeOffId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        const eyeIcon = document.getElementById(eyeId);
        const eyeOffIcon = document.getElementById(eyeOffId);

        toggle.addEventListener('click', function() {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            eyeIcon.classList.toggle('hidden');
            eyeOffIcon.classList.toggle('hidden');
        });
    }
    
    // Helper function to parse full name (no longer needed but kept for compatibility)
    function parseFullName(fullName) {
        // Expected format: "Last, First Middle" or "First Middle Last"
        let lastName = '', firstName = '', middleName = '';
        
        if (fullName.includes(',')) {
            // Format: "Last, First Middle"
            const parts = fullName.split(',');
            lastName = parts[0].trim();
            const firstParts = parts[1]?.trim().split(' ') || [];
            firstName = firstParts[0] || '';
            middleName = firstParts.slice(1).join(' ') || '';
        } else {
            // Format: "First Middle Last"
            const parts = fullName.trim().split(' ');
            if (parts.length >= 2) {
                firstName = parts[0];
                lastName = parts[parts.length - 1];
                middleName = parts.slice(1, -1).join(' ');
            } else {
                firstName = fullName;
            }
        }
        
        return { firstName, lastName, middleName };
    }
});
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
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const role = document.getElementById('role').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate
            if (!fullName || !email || !role || !password || !confirmPassword) {
                alert('Please fill in all required fields');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }
            
            // Parse name into components
            const nameParts = parseFullName(fullName);
            if (!nameParts.firstName || !nameParts.lastName) {
                alert('Please enter your first and last name.');
                return;
            }

            // --- Step 1: Save data to localStorage ---
            const registrationData = {
                firstName: nameParts.firstName,
                lastName: nameParts.lastName,
                middleName: nameParts.middleName,
                email: email,
                password: password, // Note: Storing password temporarily. This is acceptable for a multi-step form but should be cleared after submission.
                role: role
            };

            localStorage.setItem('registrationData', JSON.stringify(registrationData));

            // --- Step 2: Redirect to the next step of the registration process ---
            // The user will be sent to the faculty profile form to complete their information.
            alert('Proceeding to profile setup.');
            window.location.href = 'faculty-profile-form.html'; // Redirect to the faculty profile form

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
    
    // Helper function to parse full name
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
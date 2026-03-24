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

            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName: nameParts.firstName,
                        lastName: nameParts.lastName,
                        email: email,
                        password: password,
                        // Note: The 'role' is not sent to the backend from here
                        // as the default is 'user' and will be managed by the admin.
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.msg || 'An unknown error occurred.');
                }

                // --- Registration Successful ---
                alert(data.msg); // Show success message (e.g., "pending approval")
                window.location.href = 'landing.html'; // Redirect to login page

            } catch (error) {
                // --- Registration Failed ---
                console.error('Registration failed:', error.message);
                alert(`Registration failed: ${error.message}`);
            }
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
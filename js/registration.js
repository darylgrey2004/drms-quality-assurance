// js/registration.js

// Use consistent API base URL (same as landing.js)
const API_BASE = 'http://127.0.0.1:3000';

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

            // Password strength validation
            if (password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }

            // Email validation (WMSU email recommended)
            if (!email.includes('@')) {
                alert('Please enter a valid email address');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            const normalizedRole = role?.toLowerCase().trim();

            // For faculty and department-head roles, skip backend registration API
            // They will complete registration through the employment form
            if (normalizedRole === 'faculty' || normalizedRole === 'area-chair' || normalizedRole === 'department-head') {
                // Store registration data in localStorage for faculty profile form
                const registrationData = {
                    firstName,
                    lastName,
                    middleInitial: middleInitial || '',
                    email,
                    password,
                    role
                };
                localStorage.setItem('registrationData', JSON.stringify(registrationData));
                
                console.log('Faculty/Dept. Head registration - redirecting to employment form');
                alert('Please complete your employment information to finish registration.');
                window.location.href = 'faculty-profile-form.html';
                return;
            }

            // For other roles (Admin, Dean, Evaluator), call the registration API
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;

            try {
                console.log('Sending registration data to backend for role:', role);
                // Call backend registration API (only for non-faculty roles)
                const response = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        middleInitial: middleInitial || null,
                        email,
                        password,
                        role
                    })
                });

                console.log('Response status:', response.status);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.msg || `Server error: ${response.status}`);
                }

                // Registration successful
                console.log('Non-faculty registration successful - redirecting to login');
                alert(data.msg || 'Registration successful! Please log in with your credentials.');
                window.location.href = 'landing.html';

            } catch (error) {
                console.error('Registration error:', error);
                alert(`Registration failed: ${error.message}`);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
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

        if (!toggle || !input || !eyeIcon || !eyeOffIcon) return;

        toggle.addEventListener('click', function() {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            eyeIcon.classList.toggle('hidden');
            eyeOffIcon.classList.toggle('hidden');
        });
    }
});

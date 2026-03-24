
// js/landing.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page JS loaded successfully');
    
    // Get form elements
    const form = document.getElementById('loginForm');
    const registerBtn = document.getElementById('registerBtn');
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');
    
    // Login form submission
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent default form submission

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;

            // Disable button and show loading state
            btn.innerText = 'Signing in...';
            btn.disabled = true;
            btn.classList.add('opacity-70');

            try {
                const response = await fetch('http://127.0.0.1:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // If response is not 2xx, throw an error with the message from the backend
                    throw new Error(data.msg || 'An unknown error occurred.');
                }

                // --- Login Successful ---
                console.log('Login successful:', data);

                // Store token and user info in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect based on role
                if (data.user.role === 'admin') {
                    window.location.href = 'homepage.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }

            } catch (error) {
                // --- Login Failed ---
                console.error('Login failed:', error.message);
                alert(`Login failed: ${error.message}`); // Display error to the user

                // Re-enable the button
                btn.innerText = originalText;
                btn.disabled = false;
                btn.classList.remove('opacity-70');
            }
        });
    }

    // Password toggle handler
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            // Toggle the type attribute
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            // Toggle the icon
            eyeIcon.classList.toggle('hidden');
            eyeOffIcon.classList.toggle('hidden');
        });
    }

    // Register button click handler - SIMPLIFIED
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            console.log('Register button clicked - redirecting to registration page');
            
            // OPTION 1: Direct to registration page (recommended)
            window.location.href = 'registration.html';
            
            // OPTION 2: If you want role selection first, uncomment below:
            /*
            // Show role selection modal/dropdown
            const role = prompt('Select your role:\n1. Faculty\n2. Area Chair\n3. Dean\n4. QA Coordinator\n5. External Evaluator', 'faculty');
            
            if (role) {
                // Redirect to role-specific registration form
                window.location.href = `registration.html?role=${role}`;
            }
            */
        });
    }

    // Forgot password link
    const forgotLink = document.querySelector('a[href="#"].text-teal-700');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgot-password.html';
        });
    }
});
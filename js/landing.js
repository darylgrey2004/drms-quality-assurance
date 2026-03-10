// js/landing.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page JS loaded successfully');
    
    // Get form elements
    const form = document.getElementById('loginForm');
    const registerBtn = document.getElementById('registerBtn');
    
    // Login form submission
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();  // prevent actual post
            
            console.log('Login form submitted - redirecting to role selection');
            
            // subtle feedback: change button text temporarily
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            btn.innerText = 'redirecting...';
            btn.disabled = true;
            btn.classList.add('opacity-70');
            
            // In a real system, this would authenticate and redirect based on role
            // For demo, we'll use a simple prompt
            const role = prompt('Select your role for demo:\n1. admin\n2. dean\n3. qa-coordinator\n4. area-chair\n5. faculty\n6. evaluator', 'faculty');
            
            // redirect based on role (simulated)
            setTimeout(() => {
                switch(role?.toLowerCase()) {
                    case 'admin':
                        window.location.href = 'homepage.html';
                        break;
                    case 'dean':
                        window.location.href = 'homepage.html'; // Dean uses admin side
                        break;
                    case 'qa-coordinator':
                        window.location.href = 'homepage.html'; // QA Coordinator uses admin side
                        break;
                    case 'area-chair':
                        window.location.href = 'user-dashboard.html';
                        break;
                    case 'faculty':
                        window.location.href = 'user-dashboard.html';
                        break;
                    case 'evaluator':
                        window.location.href = 'evaluator-dashboard.html';
                        break;
                    default:
                        window.location.href = 'user-dashboard.html'; // Default to faculty
                }
            }, 300);
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
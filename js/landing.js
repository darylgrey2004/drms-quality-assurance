
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
            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;

            btn.innerText = 'Signing in...';
            btn.disabled = true;
            btn.classList.add('opacity-70');

            try {
                const response = await fetch(API_CONFIG.getApiUrl('/api/auth/login'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.msg || 'An unknown error occurred.');
                }

                // Check if OTP is required
                if (data.requiresOTP) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                    btn.classList.remove('opacity-70');
                    
                    // Show OTP modal
                    showOTPModal(email);
                    return;
                }

                // Login successful without OTP
                console.log('Login successful:', data);
                console.log('User role:', data.user.role);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Store session token for multi-device tracking
                if (data.sessionToken) {
                    localStorage.setItem('sessionToken', data.sessionToken);
                    console.log('Session token stored for multi-device tracking');
                }

                // Redirect based on role
                redirectToDashboard(data.user.role);

            } catch (error) {
                console.error('Login failed:', error.message);
                alert(`Login failed: ${error.message}`);
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

    // Register button click handler
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            console.log('Register button clicked - redirecting to registration page');
            window.location.href = 'registration.html';
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

    // Redirect to appropriate dashboard based on role
    function redirectToDashboard(role) {
        console.log('Redirecting user with role:', role);
        
        // Normalize role for comparison
        const normalizedRole = role?.toLowerCase().trim();
        
        // Admin access - goes to admin dashboard (index.html)
        if (normalizedRole === 'admin') {
            console.log('Redirecting to admin dashboard (index.html)');
            window.location.href = 'index.html';
            return;
        }
        
        // Faculty access - goes to faculty dashboard (user-dashboard.html)
        if (normalizedRole === 'faculty') {
            console.log('Redirecting to faculty dashboard (user-dashboard.html)');
            window.location.href = 'user-dashboard.html';
            return;
        }
        
        // Area Chair - goes to faculty dashboard for now
        if (normalizedRole === 'area-chair') {
            console.log('Redirecting to area chair dashboard (user-dashboard.html)');
            window.location.href = 'user-dashboard.html';
            return;
        }
        
        // Dean - use admin-style sidebar/dashboard
        if (normalizedRole === 'dean') {
            console.log('Redirecting to dean/admin dashboard (index.html)');
            window.location.href = 'index.html';
            return;
        }
        
        // External Evaluator - goes to evaluator dashboard
        if (normalizedRole === 'evaluator') {
            console.log('Redirecting to evaluator dashboard (evaluator-dashboard.html)');
            window.location.href = 'evaluator-dashboard.html';
            return;
        }
        
        // Default fallback - goes to user dashboard
        console.log('Unknown role, redirecting to default user dashboard');
        window.location.href = 'user-dashboard.html';
    }

    // OTP Modal Functions
    function showOTPModal(email) {
        // Create modal HTML
        const modalHTML = `
            <div id="otpModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl">🔐</span>
                        </div>
                        <h2 class="text-2xl font-semibold text-gray-800">Verify Your Email</h2>
                        <p class="text-gray-500 text-sm mt-2">Enter the 6-digit code sent to<br><strong>${email}</strong></p>
                    </div>
                    
                    <form id="otpForm" class="space-y-5">
                        <div>
                            <input type="text" id="otpInput" maxlength="6" 
                                   class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                   placeholder="000000" required>
                        </div>
                        
                        <button type="submit" 
                                class="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 rounded-lg transition-colors">
                            Verify & Continue
                        </button>
                        
                        <button type="button" id="closeOTPModal"
                                class="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-colors">
                            Cancel
                        </button>
                    </form>
                    
                    <p class="text-xs text-gray-400 text-center mt-4">
                        Didn't receive the code? Check your spam folder or contact support.
                    </p>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus on OTP input
        setTimeout(() => {
            document.getElementById('otpInput').focus();
        }, 100);
        
        // Handle OTP form submission
        document.getElementById('otpForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const otp = document.getElementById('otpInput').value;
            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            if (otp.length !== 6) {
                alert('Please enter a valid 6-digit code');
                return;
            }
            
            btn.innerText = 'Verifying...';
            btn.disabled = true;
            
            try {
                const response = await fetch(API_CONFIG.getApiUrl('/api/auth/verify-otp'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, otp }),
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Invalid OTP');
                }
                
                // OTP verified successfully
                console.log('OTP verified, user role:', data.user.role);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Store session token for multi-device tracking
                if (data.sessionToken) {
                    localStorage.setItem('sessionToken', data.sessionToken);
                    console.log('Session token stored for multi-device tracking');
                }
                
                // Redirect based on role
                redirectToDashboard(data.user.role);
                
            } catch (error) {
                alert(`Verification failed: ${error.message}`);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
        
        // Handle close button
        document.getElementById('closeOTPModal').addEventListener('click', function() {
            document.getElementById('otpModal').remove();
        });
    }
});
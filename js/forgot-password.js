// js/forgot-password.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Forgot password page loaded');

    const emailForm = document.getElementById('emailForm');
    const otpSection = document.getElementById('otpSection');
    const otpForm = document.getElementById('otpForm');
    const passwordSection = document.getElementById('passwordSection');
    const passwordForm = document.getElementById('passwordForm');
    const emailInput = document.getElementById('emailInput');
    const displayEmail = document.getElementById('displayEmail');
    const otpInput = document.getElementById('otpInput');
    const changeEmailBtn = document.getElementById('changeEmailBtn');

    let userEmail = '';

    // Step 1: Submit email to receive OTP
    emailForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const btn = emailForm.querySelector('button[type="submit"]');
        const originalText = btn.innerText;

        btn.innerText = 'Sending...';
        btn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Failed to send verification code');
            }

            // Success - show OTP section
            userEmail = email;
            displayEmail.textContent = email;
            emailForm.classList.add('hidden');
            otpSection.classList.remove('hidden');
            
            setTimeout(() => {
                otpInput.focus();
            }, 100);

            alert(data.msg || 'Verification code sent to your email');

        } catch (error) {
            console.error('Error:', error.message);
            alert(`Error: ${error.message}`);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    // Step 2: Verify OTP
    otpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const otp = otpInput.value.trim();
        const btn = otpForm.querySelector('button[type="submit"]');
        const originalText = btn.innerText;

        if (otp.length !== 6) {
            alert('Please enter a valid 6-digit code');
            return;
        }

        btn.innerText = 'Verifying...';
        btn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:3000/api/auth/verify-reset-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Invalid verification code');
            }

            // Success - show password reset section
            otpSection.classList.add('hidden');
            passwordSection.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error.message);
            alert(`Error: ${error.message}`);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    // Step 3: Reset password
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const btn = passwordForm.querySelector('button[type="submit"]');
        const originalText = btn.innerText;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        btn.innerText = 'Resetting...';
        btn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:3000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Failed to reset password');
            }

            // Success - redirect to login
            alert('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                window.location.href = 'landing.html';
            }, 1500);

        } catch (error) {
            console.error('Error:', error.message);
            alert(`Error: ${error.message}`);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    // Change email button
    changeEmailBtn.addEventListener('click', function() {
        otpSection.classList.add('hidden');
        emailForm.classList.remove('hidden');
        otpInput.value = '';
        emailInput.focus();
    });

    // Password visibility toggles
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (toggleNewPassword) {
        toggleNewPassword.addEventListener('click', function() {
            const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            newPasswordInput.setAttribute('type', type);
            
            const eyeIcon = toggleNewPassword.querySelector('.eye-icon');
            const eyeOffIcon = toggleNewPassword.querySelector('.eye-off-icon');
            eyeIcon.classList.toggle('hidden');
            eyeOffIcon.classList.toggle('hidden');
        });
    }

    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            
            const eyeIcon = toggleConfirmPassword.querySelector('.eye-icon');
            const eyeOffIcon = toggleConfirmPassword.querySelector('.eye-off-icon');
            eyeIcon.classList.toggle('hidden');
            eyeOffIcon.classList.toggle('hidden');
        });
    }
});

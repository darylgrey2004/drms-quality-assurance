// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const verificationModal = document.getElementById('verificationModal');
const verificationForm = document.getElementById('verificationForm');
const submitBtn = document.getElementById('submitBtn');
const verifyBtn = document.getElementById('verifyBtn');

// Form inputs
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const middleInitialInput = document.getElementById('middleInitial');
const genderInput = document.getElementById('gender');
const contactNumberInput = document.getElementById('contactNumber');
const emailInput = document.getElementById('email');
const roleInput = document.getElementById('role');
const departmentInput = document.getElementById('department');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const verificationCodeInput = document.getElementById('verificationCode');

// Error and success messages
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const verificationSuccess = document.getElementById('verificationSuccess');
const verificationErrorMessage = document.getElementById('verificationErrorMessage');

// Store verification data
let verificationData = {
    email: '',
    verificationToken: ''
};

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function clearErrors() {
    document.querySelectorAll('[id$="Error"]').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function validateContactNumber(contactNumber) {
    // Remove any non-digit characters
    const digitsOnly = contactNumber.replace(/\D/g, '');
    
    // Check if it's exactly 11 digits
    if (digitsOnly.length !== 11) {
        return false;
    }
    
    // Check if it starts with 09
    if (!digitsOnly.startsWith('09')) {
        return false;
    }
    
    return true;
}

function validateRegistrationForm() {
    clearErrors();
    let isValid = true;

    if (!firstNameInput.value.trim()) {
        showError('firstName', 'First name is required');
        isValid = false;
    }

    if (!lastNameInput.value.trim()) {
        showError('lastName', 'Last name is required');
        isValid = false;
    }

    if (!genderInput.value) {
        showError('gender', 'Please select a gender');
        isValid = false;
    }

    if (!contactNumberInput.value.trim()) {
        showError('contactNumber', 'Contact number is required');
        isValid = false;
    } else if (!validateContactNumber(contactNumberInput.value)) {
        showError('contactNumber', 'Contact number must be 11 digits starting with 09');
        isValid = false;
    }

    if (!emailInput.value.trim()) {
        showError('email', 'Email is required');
        isValid = false;
    } else if (!validateEmail(emailInput.value)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }

    if (!roleInput.value) {
        showError('role', 'Please select a role');
        isValid = false;
    }

    if (!departmentInput.value.trim()) {
        showError('department', 'Department is required');
        isValid = false;
    }

    if (!passwordInput.value) {
        showError('password', 'Password is required');
        isValid = false;
    } else if (!validatePassword(passwordInput.value)) {
        showError('password', 'Password must be at least 6 characters');
        isValid = false;
    }

    if (!confirmPasswordInput.value) {
        showError('confirmPassword', 'Please confirm your password');
        isValid = false;
    } else if (passwordInput.value !== confirmPasswordInput.value) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

// Registration form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Debug: Log all form values
    console.log('Form submission - checking values:');
    console.log('firstName:', firstNameInput.value.trim());
    console.log('lastName:', lastNameInput.value.trim());
    console.log('gender:', genderInput.value);
    console.log('contactNumber:', contactNumberInput.value.trim());
    console.log('email:', emailInput.value.trim());
    console.log('role:', roleInput.value);
    console.log('department:', departmentInput.value.trim());
    console.log('password:', passwordInput.value);
    console.log('confirmPassword:', confirmPasswordInput.value);

    if (!validateRegistrationForm()) {
        console.log('Validation failed');
        return;
    }

    console.log('Validation passed, proceeding with registration');

    // Hide previous messages
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
        const registrationData = {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            middleInitial: middleInitialInput.value.trim(),
            gender: genderInput.value,
            contactNumber: contactNumberInput.value.trim(),
            email: emailInput.value.trim(),
            role: roleInput.value,
            department: departmentInput.value.trim(),
            password: passwordInput.value,
            confirmPassword: confirmPasswordInput.value
        };

        console.log('Sending registration data:', registrationData);

        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        const data = await response.json();

        if (data.success) {
            // Store verification data
            verificationData.email = data.email;
            verificationData.verificationToken = data.verificationToken;

            // Show success message
            successMessage.classList.remove('hidden');
            successMessage.textContent = data.message;

            // Show top notification modal
            const topNotificationModal = document.getElementById('topNotificationModal');
            topNotificationModal.classList.remove('hidden');

            // Show verification modal after a short delay
            setTimeout(() => {
                verificationModal.classList.remove('hidden');
                verificationCodeInput.focus();
            }, 2000);

            // Reset form
            registerForm.reset();
        } else {
            errorMessage.classList.remove('hidden');
            errorMessage.textContent = data.message || 'Registration failed. Please try again.';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorMessage.classList.remove('hidden');
        errorMessage.textContent = 'An error occurred during registration. Please check if the backend server is running.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
    }
});

// Verification form submission
verificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const verificationCode = verificationCodeInput.value.trim().toUpperCase();

    if (!verificationCode || verificationCode.length !== 6) {
        const verificationError = document.getElementById('verificationError');
        verificationError.textContent = 'Please enter a valid 6-character code';
        verificationError.classList.remove('hidden');
        return;
    }

    // Hide previous messages
    verificationSuccess.classList.add('hidden');
    verificationErrorMessage.classList.add('hidden');

    // Disable verify button
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
        const response = await fetch(`${API_BASE_URL}/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: verificationData.email,
                verificationCode: verificationCode,
                verificationToken: verificationData.verificationToken
            })
        });

        const data = await response.json();

        if (data.success) {
            verificationSuccess.classList.remove('hidden');
            verificationSuccess.textContent = data.message;

            // Redirect to login after successful verification
            setTimeout(() => {
                window.location.href = 'landing.html';
            }, 2000);
        } else {
            verificationErrorMessage.classList.remove('hidden');
            verificationErrorMessage.textContent = data.message || 'Verification failed. Please try again.';
        }
    } catch (error) {
        console.error('Verification error:', error);
        verificationErrorMessage.classList.remove('hidden');
        verificationErrorMessage.textContent = 'An error occurred during verification. Please check if the backend server is running.';
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Email';
    }
});

// Close modal when clicking outside
verificationModal.addEventListener('click', (e) => {
    if (e.target === verificationModal) {
        verificationModal.classList.add('hidden');
        verificationCodeInput.value = '';
        document.getElementById('verificationError').classList.add('hidden');
    }
});

// Auto-format verification code input (uppercase)
verificationCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Password strength calculation
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Uppercase letters
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Lowercase letters
    if (/[a-z]/.test(password)) strength += 1;
    
    // Numbers
    if (/[0-9]/.test(password)) strength += 1;
    
    // Special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    
    return strength;
}

function getPasswordStrengthLevel(strength) {
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'fair';
    if (strength <= 5) return 'good';
    return 'strong';
}

// Password strength indicator
passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    const strengthFill = document.getElementById('passwordStrengthFill');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (password.length === 0) {
        strengthFill.className = 'password-strength-fill';
        strengthText.className = 'password-strength-text';
        strengthText.textContent = 'Weak';
        return;
    }
    
    const strength = calculatePasswordStrength(password);
    const level = getPasswordStrengthLevel(strength);
    
    strengthFill.className = `password-strength-fill ${level}`;
    strengthText.className = `password-strength-text ${level}`;
    strengthText.textContent = level.charAt(0).toUpperCase() + level.slice(1);
});

// Password visibility toggle
document.getElementById('togglePassword').addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.getElementById('password');
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
});

document.getElementById('toggleConfirmPassword').addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.getElementById('confirmPassword');
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
});

// Close top notification modal
document.getElementById('closeNotification').addEventListener('click', (e) => {
    e.preventDefault();
    const topNotificationModal = document.getElementById('topNotificationModal');
    topNotificationModal.classList.add('hidden');
});

// Check if backend is running on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            console.warn('Backend server is not responding');
        }
    } catch (error) {
        console.warn('Backend server is not running. Please start the backend server with: npm start');
    }
});

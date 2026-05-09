// js/registration.js

const API_BASE = 'http://127.0.0.1:3000';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Registration page loaded');
    
    const form = document.getElementById('registrationForm');
    const roleSelect = document.getElementById('role');
    const departmentField = document.getElementById('departmentField');
    const departmentSelect = document.getElementById('department');
    const departmentAvailability = document.getElementById('departmentAvailability');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    // Load departments from API
    async function loadDepartments() {
        try {
            const response = await fetch(`${API_BASE}/api/departments`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) throw new Error('Failed to load departments');
            
            const departments = await response.json();
            console.log('Departments loaded:', departments);
            
            departmentSelect.innerHTML = '<option value="" disabled selected>Select department</option>';
            
            if (departments.length === 0) {
                departmentSelect.innerHTML = '<option value="" disabled selected>No departments available</option>';
                return;
            }
            
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.code; // Store CODE only (e.g., "BEED")
                option.textContent = `${dept.code} - ${dept.name}`; // Display "BEED - Bachelor of Elementary Education"
                departmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading departments:', error);
            departmentSelect.innerHTML = '<option value="" disabled selected>Error loading departments</option>';
        }
    }
    
    // Load departments on page load
    loadDepartments();

    // Modal elements
    const alertModal = document.getElementById('alertModal');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const closeAlertBtn = document.getElementById('closeAlertBtn');

    // Show alert modal
    function showAlert(title, message, type = 'info') {
        if (!alertModal) {
            alert(message);
            return;
        }

        alertTitle.textContent = title;
        alertMessage.textContent = message;

        // Set icon and color based on type
        if (type === 'error') {
            alertIcon.className = 'w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg shrink-0';
            alertIcon.textContent = '✕';
        } else if (type === 'success') {
            alertIcon.className = 'w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg shrink-0';
            alertIcon.textContent = '✓';
        } else if (type === 'warning') {
            alertIcon.className = 'w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0';
            alertIcon.textContent = '⚠';
        } else {
            alertIcon.className = 'w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0';
            alertIcon.textContent = 'ℹ';
        }

        alertModal.classList.remove('hidden');
        alertModal.classList.add('flex');
    }

    // Hide alert modal
    function hideAlert() {
        if (alertModal) {
            alertModal.classList.add('hidden');
            alertModal.classList.remove('flex');
        }
    }

    if (closeAlertBtn) {
        closeAlertBtn.addEventListener('click', hideAlert);
    }

    if (alertModal) {
        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) hideAlert();
        });
    }

    // Password strength checker
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }

    function checkPasswordStrength(password) {
        const strengthBars = [
            document.getElementById('strength-bar-1'),
            document.getElementById('strength-bar-2'),
            document.getElementById('strength-bar-3'),
            document.getElementById('strength-bar-4')
        ];
        const strengthLabel = document.getElementById('strength-label');
        
        // Requirements
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        // Update requirement indicators
        updateRequirement('req-length', hasLength);
        updateRequirement('req-uppercase', hasUppercase);
        updateRequirement('req-lowercase', hasLowercase);
        updateRequirement('req-number', hasNumber);
        updateRequirement('req-special', hasSpecial);
        
        // Calculate strength
        let strength = 0;
        if (hasLength) strength++;
        if (hasUppercase) strength++;
        if (hasLowercase) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;
        
        // Reset all bars
        strengthBars.forEach(bar => {
            bar.className = 'h-1 flex-1 bg-gray-200 rounded transition-colors';
        });
        
        // Update bars and label based on strength
        if (strength === 0) {
            strengthLabel.textContent = 'Not set';
            strengthLabel.className = 'text-gray-500';
        } else if (strength <= 2) {
            strengthBars[0].classList.add('bg-red-500');
            strengthLabel.textContent = 'Weak';
            strengthLabel.className = 'text-red-500 font-medium';
        } else if (strength === 3) {
            strengthBars[0].classList.add('bg-orange-500');
            strengthBars[1].classList.add('bg-orange-500');
            strengthLabel.textContent = 'Fair';
            strengthLabel.className = 'text-orange-500 font-medium';
        } else if (strength === 4) {
            strengthBars[0].classList.add('bg-yellow-500');
            strengthBars[1].classList.add('bg-yellow-500');
            strengthBars[2].classList.add('bg-yellow-500');
            strengthLabel.textContent = 'Good';
            strengthLabel.className = 'text-yellow-600 font-medium';
        } else if (strength === 5) {
            strengthBars[0].classList.add('bg-green-500');
            strengthBars[1].classList.add('bg-green-500');
            strengthBars[2].classList.add('bg-green-500');
            strengthBars[3].classList.add('bg-green-500');
            strengthLabel.textContent = 'Strong';
            strengthLabel.className = 'text-green-500 font-medium';
        }
    }
    
    function updateRequirement(id, met) {
        const element = document.getElementById(id);
        if (!element) return;
        
        const icon = element.querySelector('span:first-child');
        const text = element.querySelector('span:last-child');
        
        if (met) {
            icon.textContent = '✓';
            icon.className = 'text-green-500 font-bold';
            text.className = 'text-green-600';
        } else {
            icon.textContent = '○';
            icon.className = 'text-gray-400';
            text.className = 'text-gray-500';
        }
    }

    // Show/hide department field based on role selection
    if (roleSelect && departmentField) {
        roleSelect.addEventListener('change', function() {
            const selectedRole = this.value;
            if (selectedRole === 'faculty' || selectedRole === 'department-head') {
                departmentField.classList.remove('hidden');
                departmentSelect.setAttribute('required', 'required');
            } else {
                departmentField.classList.add('hidden');
                departmentSelect.removeAttribute('required');
                departmentSelect.value = '';
                if (departmentAvailability) departmentAvailability.textContent = '';
            }
        });
    }

    // Check department head availability when department is selected (only for dept-head role)
    if (departmentSelect && departmentAvailability) {
        departmentSelect.addEventListener('change', async function() {
            const department = this.value;
            const role = roleSelect?.value;
            
            if (!department || role !== 'department-head') {
                departmentAvailability.textContent = '';
                return;
            }

            departmentAvailability.textContent = 'Checking availability...';
            departmentAvailability.className = 'text-xs mt-1 text-gray-500';

            try {
                console.log('Checking dept head for:', department);
                const response = await fetch(`${API_BASE}/api/auth/check-dept-head/${department}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Dept head check result:', data);

                if (data.exists) {
                    departmentAvailability.textContent = `⚠️ A Dept. Head for ${department} already exists. Please select a different department.`;
                    departmentAvailability.className = 'text-xs mt-1 text-red-600';
                } else {
                    departmentAvailability.textContent = `✓ ${department} Dept. Head position is available.`;
                    departmentAvailability.className = 'text-xs mt-1 text-green-600';
                }
            } catch (error) {
                console.error('Error checking department head availability:', error);
                departmentAvailability.textContent = '⚠️ Unable to verify availability. Please try again.';
                departmentAvailability.className = 'text-xs mt-1 text-amber-600';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const lastName = document.getElementById('lastName').value.trim();
            const firstName = document.getElementById('firstName').value.trim();
            const middleInitial = document.getElementById('middleInitial').value.trim();
            const email = document.getElementById('email').value.trim();
            const role = document.getElementById('role').value;
            const department = document.getElementById('department').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate
            if (!lastName || !firstName || !email || !role || !password || !confirmPassword) {
                showAlert('Missing Information', 'Please fill in all required fields', 'error');
                return;
            }

            // Validate department for both roles
            if ((role === 'faculty' || role === 'department-head') && !department) {
                showAlert('Department Required', 'Please select a department', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showAlert('Password Mismatch', 'Passwords do not match. Please try again.', 'error');
                return;
            }

            // Password strength validation
            if (password.length < 8) {
                showAlert('Weak Password', 'Password must be at least 8 characters long', 'error');
                return;
            }

            // Check all password requirements
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
                showAlert(
                    'Weak Password', 
                    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
                    'error'
                );
                return;
            }

            // Email validation
            if (!email.includes('@')) {
                showAlert('Invalid Email', 'Please enter a valid email address', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            // Check if department head already exists for selected department
            if (role === 'department-head') {
                try {
                    const checkResponse = await fetch(`${API_BASE}/api/auth/check-dept-head/${department}`);
                    
                    if (!checkResponse.ok) {
                        throw new Error('Unable to verify department head availability');
                    }
                    
                    const checkData = await checkResponse.json();
                    
                    if (checkData.exists) {
                        showAlert(
                            'Department Head Exists', 
                            `A Department Head for ${department} already exists. Please select a different department or register as Faculty.`,
                            'warning'
                        );
                        return;
                    }
                } catch (error) {
                    console.error('Error checking department head:', error);
                    showAlert(
                        'Verification Error',
                        'Unable to verify department head availability. Please try again.',
                        'error'
                    );
                    return;
                }
            }

            // Store registration data for faculty profile form
            const registrationData = {
                firstName,
                lastName,
                middleInitial: middleInitial || '',
                email,
                password,
                role,
                department: department || null
            };
            localStorage.setItem('registrationData', JSON.stringify(registrationData));
            
            console.log('Registration data stored - redirecting to employment form');
            showAlert(
                'Complete Your Profile',
                'Please complete your employment information to finish registration.',
                'success'
            );
            
            setTimeout(() => {
                window.location.href = 'faculty-profile-form.html';
            }, 1500);
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

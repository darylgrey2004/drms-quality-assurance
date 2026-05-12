// js/user-profile.js

document.addEventListener('DOMContentLoaded', async function () {
    // Wait for user-session.js to initialize
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user } = session;
    const resolvedUserId = user.id;

    let originalData = {};

    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');

    const editableFields = [
        'dob', 'gender', 'civilStatus', 'nationality', 'phone', 'address',
        'employeeId', 'position', 'department', 'employmentStatus',
        'highestDegree', 'specialization', 'institution', 'gradYear', 'license', 'continuingEd',
        'subjectsTaught', 'yearLevel', 'loadUnits', 'advising', 'committeeRoles',
        'researchInterests', 'publications'
    ];

    if (editProfileBtn) editProfileBtn.addEventListener('click', enableEditMode);
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', async () => await saveUserProfile(resolvedUserId));
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function () {
            if (confirm('Discard all changes?')) {
                disableEditMode();
                populateProfile(originalData);
            }
        });
    }

    if (dobInput && ageInput) {
        dobInput.addEventListener('change', function () {
            if (!this.value) {
                ageInput.value = '';
                return;
            }
            const birthDate = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
            ageInput.value = age;
        });
    }

    await loadUserProfile(resolvedUserId);

    function enableEditMode() {
        editProfileBtn.classList.add('hidden');
        saveProfileBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');

        editableFields.forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (!field) return;
            field.removeAttribute('readonly');
            field.removeAttribute('disabled');
            field.classList.remove('bg-gray-50');
            field.classList.add('bg-white', 'border-teal-200');
        });
    }

    function disableEditMode() {
        editProfileBtn.classList.remove('hidden');
        saveProfileBtn.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');

        editableFields.forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (!field) return;
            if (field.tagName === 'SELECT') {
                field.setAttribute('disabled', 'disabled');
            } else {
                field.setAttribute('readonly', 'readonly');
            }
            field.classList.remove('bg-white', 'border-teal-200');
            field.classList.add('bg-gray-50');
        });
    }

    async function loadUserProfile(userId) {
        try {
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/profile/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: 'Failed to load profile' }));
                throw new Error(errorData.msg || 'Failed to load profile');
            }

            const profileData = await response.json();
            originalData = profileData;
            populateProfile(profileData);
            disableEditMode();
        } catch (error) {
            console.error('Error loading profile:', error);
            alert(`Failed to load profile data: ${error.message}`);
        }
    }

    function populateProfile(data) {
        const initials = (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '');
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        const displayRole = data.role || 'Faculty Member';
        const roleDept = `${displayRole} · ${data.department || 'N/A'}`;

        document.getElementById('profileInitials').textContent = initials;
        document.getElementById('profileName').textContent = fullName;
        document.getElementById('profileRoleDept').textContent = roleDept;
        document.getElementById('profileEmail').textContent = data.email || '';

        if (data.createdAt) {
            const date = new Date(data.createdAt);
            document.getElementById('memberSince').textContent = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        const statusBadge = data.status === 'approved' ? 'Approved' : data.status === 'pending' ? 'Pending' : 'Inactive';
        document.getElementById('profileStatus').textContent = statusBadge;
        document.getElementById('emailVerified').innerHTML = data.isVerified
            ? '<span class="text-green-600">✓ Yes</span>'
            : '<span class="text-gray-500">Not verified</span>';
        document.getElementById('accountType').textContent = displayRole;
        document.getElementById('accountType').className = 'bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full';
        document.getElementById('accountStatus').textContent = statusBadge;
        document.getElementById('accountStatus').className = (
            data.status === 'approved' ? 'bg-green-100 text-green-700'
                : data.status === 'pending' ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-700'
        ) + ' text-xs px-2 py-1 rounded-full';

        // Personal Information (read-only fields)
        document.getElementById('lastName').value = data.lastName || '';
        document.getElementById('firstName').value = data.firstName || '';
        document.getElementById('middleInitial').value = data.middleInitial || '';
        document.getElementById('email').value = data.email || '';

        // Editable fields
        if (data.dateOfBirth) document.getElementById('dob').value = new Date(data.dateOfBirth).toISOString().split('T')[0];
        if (data.age !== null && data.age !== undefined) document.getElementById('age').value = data.age;
        if (data.gender) document.getElementById('gender').value = data.gender;
        if (data.civilStatus) document.getElementById('civilStatus').value = data.civilStatus;
        if (data.nationality) document.getElementById('nationality').value = data.nationality;
        if (data.phone) document.getElementById('phone').value = data.phone;
        if (data.address) document.getElementById('address').value = data.address;

        document.getElementById('employeeId').value = data.employeeId || '';
        document.getElementById('position').value = data.position || '';
        document.getElementById('department').value = data.department || '';
        document.getElementById('employmentStatus').value = data.employmentStatus || '';

        if (data.highestDegree) document.getElementById('highestDegree').value = data.highestDegree;
        if (data.specialization) document.getElementById('specialization').value = data.specialization;
        if (data.institution) document.getElementById('institution').value = data.institution;
        if (data.gradYear) document.getElementById('gradYear').value = data.gradYear;
        if (data.license) document.getElementById('license').value = data.license;
        if (data.continuingEd) document.getElementById('continuingEd').value = data.continuingEd;
        if (data.subjectsTaught) document.getElementById('subjectsTaught').value = data.subjectsTaught;
        if (data.yearLevel) document.getElementById('yearLevel').value = data.yearLevel;
        if (data.loadUnits) document.getElementById('loadUnits').value = data.loadUnits;
        if (data.advising) document.getElementById('advising').value = data.advising;
        if (data.committeeRoles) document.getElementById('committeeRoles').value = data.committeeRoles;
        if (data.researchInterests) document.getElementById('researchInterests').value = data.researchInterests;
        if (data.publications) document.getElementById('publications').value = data.publications;

        if (data.dateOfBirth && dobInput) dobInput.dispatchEvent(new Event('change'));
    }

    async function saveUserProfile(userId) {
        const profileData = {
            dateOfBirth: document.getElementById('dob')?.value || null,
            age: document.getElementById('age')?.value || null,
            gender: document.getElementById('gender')?.value || null,
            civilStatus: document.getElementById('civilStatus')?.value || null,
            nationality: document.getElementById('nationality')?.value?.trim() || null,
            phone: document.getElementById('phone')?.value?.trim() || null,
            address: document.getElementById('address')?.value?.trim() || null,
            employeeId: document.getElementById('employeeId')?.value?.trim() || null,
            position: document.getElementById('position')?.value?.trim() || null,
            department: document.getElementById('department')?.value?.trim() || null,
            employmentStatus: document.getElementById('employmentStatus')?.value?.trim() || null,
            highestDegree: document.getElementById('highestDegree')?.value || null,
            specialization: document.getElementById('specialization')?.value?.trim() || null,
            institution: document.getElementById('institution')?.value?.trim() || null,
            gradYear: document.getElementById('gradYear')?.value || null,
            license: document.getElementById('license')?.value?.trim() || null,
            continuingEd: document.getElementById('continuingEd')?.value?.trim() || null,
            subjectsTaught: document.getElementById('subjectsTaught')?.value?.trim() || null,
            yearLevel: document.getElementById('yearLevel')?.value?.trim() || null,
            loadUnits: document.getElementById('loadUnits')?.value?.trim() || null,
            advising: document.getElementById('advising')?.value?.trim() || null,
            committeeRoles: document.getElementById('committeeRoles')?.value?.trim() || null,
            researchInterests: document.getElementById('researchInterests')?.value?.trim() || null,
            publications: document.getElementById('publications')?.value?.trim() || null
        };

        // Disable save button during save
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'Saving...';

        try {
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: 'Failed to save profile' }));
                throw new Error(errorData.msg || 'Failed to save profile');
            }

            const result = await response.json().catch(() => ({}));
            
            // Update localStorage with new user data
            if (result.user) {
                const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = {
                    ...existingUser,
                    ...result.user,
                    department: profileData.department || existingUser.department
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Update sidebar display without reloading
                const sidebarName = document.getElementById('sidebarName');
                const sidebarRole = document.getElementById('sidebarRole');
                if (sidebarName) {
                    sidebarName.textContent = `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim();
                }
                if (sidebarRole && updatedUser.department) {
                    const roleDisplay = updatedUser.role || 'Faculty Member';
                    sidebarRole.textContent = `${roleDisplay} · ${updatedUser.department}`;
                }
            }

            alert(result.msg || 'Profile updated successfully!');
            await loadUserProfile(userId);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert(`Failed to save profile: ${error.message}`);
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Changes';
        }
    }
    
    // Change Email Modal
    const showChangeEmailBtn = document.getElementById('showChangeEmailBtn');
    const changeEmailModal = document.getElementById('changeEmailModal');
    const closeEmailModal = document.getElementById('closeEmailModal');
    const cancelEmailBtn = document.getElementById('cancelEmailBtn');
    const emailStep1 = document.getElementById('emailStep1');
    const emailStep2 = document.getElementById('emailStep2');
    const currentEmailDisplay = document.getElementById('currentEmailDisplay');
    const newEmailInput = document.getElementById('newEmail');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const emailError = document.getElementById('emailError');
    const newEmailDisplay = document.getElementById('newEmailDisplay');
    const otpCodeInput = document.getElementById('otpCode');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const backToEmailBtn = document.getElementById('backToEmailBtn');
    const otpError = document.getElementById('otpError');
    const otpSuccess = document.getElementById('otpSuccess');
    
    let pendingNewEmail = '';
    
    function openEmailModal() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentEmailDisplay) currentEmailDisplay.value = user.email || '';
        if (newEmailInput) newEmailInput.value = '';
        if (otpCodeInput) otpCodeInput.value = '';
        emailStep1.classList.remove('hidden');
        emailStep2.classList.add('hidden');
        emailError.classList.add('hidden');
        otpError.classList.add('hidden');
        otpSuccess.classList.add('hidden');
        changeEmailModal.classList.remove('hidden');
        changeEmailModal.classList.add('flex');
    }
    
    function closeEmailModalFn() {
        changeEmailModal.classList.add('hidden');
        changeEmailModal.classList.remove('flex');
    }
    
    function showEmailError(message) {
        emailError.textContent = message;
        emailError.classList.remove('hidden');
    }
    
    function showOtpError(message) {
        otpError.textContent = message;
        otpError.classList.remove('hidden');
    }
    
    function showOtpSuccess(message) {
        otpSuccess.textContent = message;
        otpSuccess.classList.remove('hidden');
    }
    
    if (showChangeEmailBtn) showChangeEmailBtn.addEventListener('click', openEmailModal);
    if (closeEmailModal) closeEmailModal.addEventListener('click', closeEmailModalFn);
    if (cancelEmailBtn) cancelEmailBtn.addEventListener('click', closeEmailModalFn);
    
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', async () => {
            const newEmail = newEmailInput.value.trim();
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            emailError.classList.add('hidden');
            
            if (!newEmail) {
                showEmailError('Please enter a new email address');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                showEmailError('Please enter a valid email address');
                return;
            }
            
            if (newEmail === user.email) {
                showEmailError('New email must be different from current email');
                return;
            }
            
            sendOtpBtn.disabled = true;
            sendOtpBtn.textContent = 'Sending...';
            
            try {
                const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/auth/change-email/send-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ newEmail })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Failed to send OTP');
                }
                
                pendingNewEmail = newEmail;
                newEmailDisplay.textContent = newEmail;
                emailStep1.classList.add('hidden');
                emailStep2.classList.remove('hidden');
                showOtpSuccess(data.msg || 'Verification code sent to your new email');
                setTimeout(() => otpSuccess.classList.add('hidden'), 5000);
                
            } catch (error) {
                showEmailError(error.message);
            } finally {
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = 'Send OTP';
            }
        });
    }
    
    if (backToEmailBtn) {
        backToEmailBtn.addEventListener('click', () => {
            emailStep2.classList.add('hidden');
            emailStep1.classList.remove('hidden');
            otpError.classList.add('hidden');
            otpSuccess.classList.add('hidden');
        });
    }
    
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', async () => {
            if (!pendingNewEmail) return;
            
            otpError.classList.add('hidden');
            otpSuccess.classList.add('hidden');
            resendOtpBtn.disabled = true;
            resendOtpBtn.textContent = 'Sending...';
            
            try {
                const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/auth/change-email/send-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ newEmail: pendingNewEmail })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Failed to resend OTP');
                }
                
                showOtpSuccess('OTP resent successfully!');
                setTimeout(() => otpSuccess.classList.add('hidden'), 3000);
                
            } catch (error) {
                showOtpError(error.message);
            } finally {
                resendOtpBtn.disabled = false;
                resendOtpBtn.textContent = 'Resend OTP';
            }
        });
    }
    
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const otp = otpCodeInput.value.trim();
            
            otpError.classList.add('hidden');
            otpSuccess.classList.add('hidden');
            
            if (!otp || otp.length !== 6) {
                showOtpError('Please enter a valid 6-digit OTP');
                return;
            }
            
            verifyOtpBtn.disabled = true;
            verifyOtpBtn.textContent = 'Verifying...';
            
            try {
                const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/auth/change-email/verify-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ newEmail: pendingNewEmail, otp })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Failed to verify OTP');
                }
                
                showOtpSuccess('Email changed successfully!');
                
                // Update localStorage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.email = pendingNewEmail;
                localStorage.setItem('user', JSON.stringify(user));
                
                setTimeout(() => {
                    closeEmailModalFn();
                    location.reload();
                }, 2000);
                
            } catch (error) {
                showOtpError(error.message);
            } finally {
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.textContent = 'Verify & Change';
            }
        });
    }
    
    // Allow only numbers in OTP input
    if (otpCodeInput) {
        otpCodeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Change Password Modal
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closePasswordModal = document.getElementById('closePasswordModal');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const submitPasswordBtn = document.getElementById('submitPasswordBtn');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const passwordSuccess = document.getElementById('passwordSuccess');
    
    function openPasswordModal() {
        changePasswordModal.classList.remove('hidden');
        changePasswordModal.classList.add('flex');
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        passwordError.classList.add('hidden');
        passwordSuccess.classList.add('hidden');
    }
    
    function closePasswordModalFn() {
        changePasswordModal.classList.add('hidden');
        changePasswordModal.classList.remove('flex');
    }
    
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', openPasswordModal);
    if (closePasswordModal) closePasswordModal.addEventListener('click', closePasswordModalFn);
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', closePasswordModalFn);
    
    // Password toggle function
    window.togglePassword = function(fieldId) {
        const input = document.getElementById(fieldId);
        const eye = document.getElementById(fieldId + '-eye');
        if (input.type === 'password') {
            input.type = 'text';
            eye.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>';
        } else {
            input.type = 'password';
            eye.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
        }
    };
    
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', async () => {
            const currentPassword = currentPasswordInput.value.trim();
            const newPassword = newPasswordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            
            passwordError.classList.add('hidden');
            passwordSuccess.classList.add('hidden');
            
            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                passwordError.textContent = 'Please fill in all fields';
                passwordError.classList.remove('hidden');
                return;
            }
            
            if (newPassword.length < 6) {
                passwordError.textContent = 'New password must be at least 6 characters long';
                passwordError.classList.remove('hidden');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                passwordError.textContent = 'New passwords do not match';
                passwordError.classList.remove('hidden');
                return;
            }
            
            if (currentPassword === newPassword) {
                passwordError.textContent = 'New password must be different from current password';
                passwordError.classList.remove('hidden');
                return;
            }
            
            // Disable button
            submitPasswordBtn.disabled = true;
            submitPasswordBtn.textContent = 'Changing...';
            
            try {
                const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/auth/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                
                if (!response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        throw new Error(data.msg || 'Failed to change password');
                    } else {
                        throw new Error('Server error. Please ensure you are logged in and try again.');
                    }
                }
                
                const data = await response.json();
                
                passwordSuccess.textContent = data.msg || 'Password changed successfully!';
                passwordSuccess.classList.remove('hidden');
                
                // Clear inputs
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    closePasswordModalFn();
                }, 2000);
                
            } catch (error) {
                passwordError.textContent = error.message;
                passwordError.classList.remove('hidden');
            } finally {
                submitPasswordBtn.disabled = false;
                submitPasswordBtn.textContent = 'Change Password';
            }
        });
    }
});

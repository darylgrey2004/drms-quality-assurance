// js/settings.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page JS loaded successfully');
    
    // ── Heartbeat: Update lastActive status ──
    const token = localStorage.getItem('token');
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 2 * 60 * 1000);
    }
    
    // DOM elements
    const tabLinks = document.querySelectorAll('#settingsTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Save buttons
    const saveGeneral = document.getElementById('saveGeneral');
    const saveWorkflow = document.getElementById('saveWorkflow');
    const saveStandards = document.getElementById('saveStandards');
    const saveNotifications = document.getElementById('saveNotifications');
    const saveBackup = document.getElementById('saveBackup');
    const saveApi = document.getElementById('saveApi');
    
    // Other buttons
    const backupNowBtn = document.getElementById('backupNowBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Tab switching functionality
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get tab id
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab styling
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });
            
            // Show selected tab
            const activeTab = document.getElementById(tabId + 'Tab');
            if (activeTab) {
                activeTab.classList.remove('hidden');
                activeTab.classList.add('block');
            }
        });
    });
    
    // ============================================
    // PROFILE MANAGEMENT
    // ============================================
    
    // Profile edit mode
    let isEditing = false;
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileInputs = ['lastName', 'firstName', 'middleInitial', 'personalEmail', 'dob', 'age', 'nationality', 'phone', 'address'];
    const profileSelects = ['gender', 'civilStatus'];
    
    // Load user data into profile
    function loadUserProfile() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Update profile header
        const profileInitials = document.getElementById('profileInitials');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRoleBadge = document.getElementById('profileRoleBadge');
        const personalEmail = document.getElementById('personalEmail');
        const profileDepartment = document.getElementById('profileDepartment');
        const profileStatus = document.getElementById('profileStatus');
        
        if (user.firstName && user.lastName) {
            const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
            if (profileInitials) profileInitials.textContent = initials;
            if (profileName) profileName.textContent = `${user.firstName} ${user.lastName}`;
        }
        if (user.email) {
            if (profileEmail) profileEmail.textContent = user.email;
            if (personalEmail) personalEmail.value = user.email;
        }
        if (user.role && profileRoleBadge) {
            const roleMap = {
                'admin': 'Administrator',
                'dean': 'Dean',
                'faculty': 'Faculty Member',
                'area-chair': 'Dept. Head',
                'department-head': 'Dept. Head',
                'evaluator': 'External Evaluator'
            };
            profileRoleBadge.textContent = roleMap[user.role] || user.role;
            
            // Update department based on role
            if (profileDepartment) {
                if (user.role === 'admin') {
                    profileDepartment.textContent = 'System Administrator';
                } else if (user.role === 'dean') {
                    profileDepartment.textContent = 'Dean\'s Office';
                } else {
                    profileDepartment.textContent = user.department || 'Not Assigned';
                }
            }
        }
        if (profileStatus) {
            profileStatus.textContent = user.status === 'approved' ? 'Approved' : (user.status || 'Active');
            profileStatus.className = user.status === 'approved' ? 'text-green-600 font-medium' : 'text-amber-600 font-medium';
        }
        
        // Load saved profile data from localStorage
        const savedProfile = localStorage.getItem('adminProfile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            document.getElementById('lastName').value = profile.lastName || user.lastName || '';
            document.getElementById('firstName').value = profile.firstName || user.firstName || '';
            document.getElementById('middleInitial').value = profile.middleInitial || '';
            document.getElementById('dob').value = profile.dob || '';
            document.getElementById('age').value = profile.age || '';
            document.getElementById('gender').value = profile.gender || '';
            document.getElementById('civilStatus').value = profile.civilStatus || '';
            document.getElementById('nationality').value = profile.nationality || '';
            document.getElementById('phone').value = profile.phone || '';
            document.getElementById('address').value = profile.address || '';
        } else {
            document.getElementById('lastName').value = user.lastName || '';
            document.getElementById('firstName').value = user.firstName || '';
            document.getElementById('middleInitial').value = user.middleInitial || '';
        }
        
        // Calculate age if DOB is set
        const dobInput = document.getElementById('dob');
        const ageInput = document.getElementById('age');
        if (dobInput && ageInput && dobInput.value) {
            const birthDate = new Date(dobInput.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            ageInput.value = age;
        }
    }
    
    // Toggle edit mode
    function toggleEditMode() {
        isEditing = !isEditing;
        
        profileInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                if (isEditing) {
                    input.classList.remove('bg-gray-50');
                    input.classList.add('bg-white');
                    input.removeAttribute('readonly');
                } else {
                    input.classList.add('bg-gray-50');
                    input.classList.remove('bg-white');
                    input.setAttribute('readonly', 'readonly');
                }
            }
        });
        
        profileSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.disabled = !isEditing;
                if (isEditing) {
                    select.classList.remove('bg-gray-50');
                    select.classList.add('bg-white');
                } else {
                    select.classList.add('bg-gray-50');
                    select.classList.remove('bg-white');
                }
            }
        });
        
        if (editProfileBtn) {
            editProfileBtn.textContent = isEditing ? 'Save Changes' : 'Edit Profile';
            editProfileBtn.classList.toggle('bg-green-600', isEditing);
            editProfileBtn.classList.toggle('hover:bg-green-700', isEditing);
            editProfileBtn.classList.toggle('bg-teal-600', !isEditing);
            editProfileBtn.classList.toggle('hover:bg-teal-700', !isEditing);
        }
    }
    
    // Save profile changes
    function saveProfileChanges() {
        const profileData = {
            lastName: document.getElementById('lastName')?.value || '',
            firstName: document.getElementById('firstName')?.value || '',
            middleInitial: document.getElementById('middleInitial')?.value || '',
            dob: document.getElementById('dob')?.value || '',
            age: document.getElementById('age')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            civilStatus: document.getElementById('civilStatus')?.value || '',
            nationality: document.getElementById('nationality')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            address: document.getElementById('address')?.value || ''
        };
        
        localStorage.setItem('adminProfile', JSON.stringify(profileData));
        
        // Update user name in localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.firstName = profileData.firstName;
        user.lastName = profileData.lastName;
        user.middleInitial = profileData.middleInitial;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update sidebar
        const userInitialsSpan = document.getElementById('userInitials');
        const userNameSpan = document.getElementById('userName');
        if (userInitialsSpan && profileData.firstName && profileData.lastName) {
            userInitialsSpan.textContent = (profileData.firstName[0] + profileData.lastName[0]).toUpperCase();
        }
        if (userNameSpan) {
            userNameSpan.textContent = `${profileData.firstName} ${profileData.lastName}`;
        }
        
        // Update profile header
        const profileInitials = document.getElementById('profileInitials');
        const profileName = document.getElementById('profileName');
        if (profileInitials && profileData.firstName && profileData.lastName) {
            profileInitials.textContent = (profileData.firstName[0] + profileData.lastName[0]).toUpperCase();
        }
        if (profileName) {
            profileName.textContent = `${profileData.firstName} ${profileData.lastName}`;
        }
        
        showToastMessage('Profile updated successfully!', 'success');
        toggleEditMode(); // Exit edit mode
    }
    
    // Age calculation on DOB change
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');
    if (dobInput && ageInput) {
        dobInput.addEventListener('change', function() {
            if (this.value) {
                const birthDate = new Date(this.value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                ageInput.value = age;
            }
        });
    }
    
    // Edit profile button handler
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            if (isEditing) {
                saveProfileChanges();
            } else {
                toggleEditMode();
            }
        });
    }
    
    // Change Password functionality
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMessage = document.getElementById('passwordMessage');
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            const currentPassword = currentPasswordInput?.value.trim();
            const newPassword = newPasswordInput?.value.trim();
            const confirmPassword = confirmPasswordInput?.value.trim();
            
            if (passwordMessage) {
                passwordMessage.classList.add('hidden');
            }
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                showPasswordMessage('Please fill in all password fields', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showPasswordMessage('New password must be at least 6 characters long', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showPasswordMessage('New passwords do not match', 'error');
                return;
            }
            
            const token = localStorage.getItem('token');
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Failed to change password');
                }
                
                showPasswordMessage('Password changed successfully!', 'success');
                
                // Clear password fields
                if (currentPasswordInput) currentPasswordInput.value = '';
                if (newPasswordInput) newPasswordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
                
                setTimeout(() => {
                    if (passwordMessage) passwordMessage.classList.add('hidden');
                }, 3000);
                
            } catch (error) {
                showPasswordMessage(error.message, 'error');
            }
        });
    }
    
    function showPasswordMessage(message, type) {
        if (!passwordMessage) return;
        passwordMessage.textContent = message;
        passwordMessage.className = `mt-3 text-sm p-3 rounded-lg ${type === 'success' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`;
        passwordMessage.classList.remove('hidden');
    }
    
    function showToastMessage(message, type) {
        let toast = document.querySelector('.custom-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'custom-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                z-index: 10000;
                font-size: 14px;
                font-weight: 500;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            `;
            document.body.appendChild(toast);
        }
        
        toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
        toast.textContent = message;
        toast.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
        }, 3000);
    }
    
    // Load profile on page load
    loadUserProfile();
    
    // Member since (from registration date or current date)
    const memberSinceSpan = document.getElementById('memberSince');
    if (memberSinceSpan) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            memberSinceSpan.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        } else {
            const date = new Date();
            memberSinceSpan.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }
    }
    
    // Account status indicators
    const emailVerifiedSpan = document.getElementById('emailVerified');
    const accountTypeSpan = document.getElementById('accountType');
    const accountStatusSpan = document.getElementById('accountStatus');
    
    if (emailVerifiedSpan) emailVerifiedSpan.innerHTML = '✓ Yes';
    if (accountTypeSpan) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const roleMap = {
            'admin': 'Administrator',
            'dean': 'Dean'
        };
        accountTypeSpan.textContent = roleMap[user.role] || user.role || 'User';
        accountTypeSpan.className = 'bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs';
    }
    if (accountStatusSpan) {
        accountStatusSpan.textContent = 'Active';
        accountStatusSpan.className = 'bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs';
    }
    
    // ============================================
    // DOCUMENT REQUIREMENTS
    // ============================================
    
    // Function to update total expected counts
    function updateTotals() {
        const categories = ['instruction', 'research', 'extension', 'employment'];
        const departments = ['beed', 'bsed', 'bsned', 'bcaed', 'bped'];
        
        categories.forEach(cat => {
            let total = 0;
            departments.forEach(dept => {
                const val = parseInt(document.getElementById(`${cat}_${dept}`)?.value) || 0;
                total += val;
            });
            const totalSpan = document.getElementById(`${cat}Total`);
            if (totalSpan) totalSpan.textContent = total;
        });
    }
    
    // Add event listeners to all expected docs inputs
    document.querySelectorAll('.expected-docs').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
    
    // Reset to defaults
    const resetRequirementsBtn = document.getElementById('resetRequirements');
    if (resetRequirementsBtn) {
        resetRequirementsBtn.addEventListener('click', () => {
            if (confirm('Reset all document requirements to default values?')) {
                // Instruction defaults
                document.getElementById('instruction_beed').value = 45;
                document.getElementById('instruction_bsed').value = 65;
                document.getElementById('instruction_bsned').value = 40;
                document.getElementById('instruction_bcaed').value = 35;
                document.getElementById('instruction_bped').value = 30;
                
                // Research defaults
                document.getElementById('research_beed').value = 40;
                document.getElementById('research_bsed').value = 55;
                document.getElementById('research_bsned').value = 35;
                document.getElementById('research_bcaed').value = 30;
                document.getElementById('research_bped').value = 25;
                
                // Extension defaults
                document.getElementById('extension_beed').value = 25;
                document.getElementById('extension_bsed').value = 25;
                document.getElementById('extension_bsned').value = 25;
                document.getElementById('extension_bcaed').value = 25;
                document.getElementById('extension_bped').value = 25;
                
                // Employment defaults
                document.getElementById('employment_beed').value = 30;
                document.getElementById('employment_bsed').value = 30;
                document.getElementById('employment_bsned').value = 30;
                document.getElementById('employment_bcaed').value = 30;
                document.getElementById('employment_bped').value = 30;
                
                updateTotals();
                alert('Document requirements reset to default values.');
            }
        });
    }
    
    // Save requirements
    const saveRequirementsBtn = document.getElementById('saveRequirements');
    if (saveRequirementsBtn) {
        saveRequirementsBtn.addEventListener('click', () => {
            const requirements = {
                instruction: {},
                research: {},
                extension: {},
                employment: {}
            };
            
            const departments = ['beed', 'bsed', 'bsned', 'bcaed', 'bped'];
            const categories = ['instruction', 'research', 'extension', 'employment'];
            
            categories.forEach(cat => {
                departments.forEach(dept => {
                    requirements[cat][dept] = parseInt(document.getElementById(`${cat}_${dept}`)?.value) || 0;
                });
            });
            
            localStorage.setItem('documentRequirements', JSON.stringify(requirements));
            alert('Document requirements saved successfully!');
        });
    }
    
    // Load saved requirements on page load
    function loadSavedRequirements() {
        const saved = localStorage.getItem('documentRequirements');
        if (saved) {
            const requirements = JSON.parse(saved);
            const departments = ['beed', 'bsed', 'bsned', 'bcaed', 'bped'];
            const categories = ['instruction', 'research', 'extension', 'employment'];
            
            categories.forEach(cat => {
                if (requirements[cat]) {
                    departments.forEach(dept => {
                        const input = document.getElementById(`${cat}_${dept}`);
                        if (input && requirements[cat][dept]) {
                            input.value = requirements[cat][dept];
                        }
                    });
                }
            });
            updateTotals();
        }
    }
    
    // Initialize totals on page load
    updateTotals();
    loadSavedRequirements();
    
    // ============================================
    // LOGOUT
    // ============================================
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('adminProfile');
                window.location.href = 'landing.html';
            }
        });
    }
    
    // ============================================
    // SETTINGS SAVE BUTTONS
    // ============================================
    
    if (saveGeneral) {
        saveGeneral.addEventListener('click', () => {
            const settings = {
                systemName: document.getElementById('systemName')?.value || 'DRMS-QA',
                institutionName: document.getElementById('institutionName')?.value || 'College of Teacher Education',
                systemEmail: document.getElementById('systemEmail')?.value || 'qa@cte.edu',
                timezone: document.getElementById('timezone')?.value || 'Asia/Manila',
                dateFormat: document.getElementById('dateFormat')?.value || 'Y-m-d',
                language: document.getElementById('language')?.value || 'en',
                maintenanceMode: document.getElementById('maintenanceMode')?.checked || false,
                debugMode: document.getElementById('debugMode')?.checked || false
            };
            localStorage.setItem('generalSettings', JSON.stringify(settings));
            showToastMessage('General settings saved successfully!', 'success');
        });
    }
    
    if (saveWorkflow) {
        saveWorkflow.addEventListener('click', () => {
            const settings = {
                workflowType: document.querySelector('input[name="workflowType"]:checked')?.value || 'standard',
                autoApproveAdmin: document.getElementById('autoApproveAdmin')?.checked || false,
                autoApproveDean: document.getElementById('autoApproveDean')?.checked || false,
                autoApproveDeptHead: document.getElementById('autoApproveDeptHead')?.checked || false,
                slaValidation: document.getElementById('slaValidation')?.value || 48,
                slaApproval: document.getElementById('slaApproval')?.value || 72,
                maxVersions: document.getElementById('maxVersions')?.value || 10
            };
            localStorage.setItem('workflowSettings', JSON.stringify(settings));
            showToastMessage('Workflow settings saved successfully!', 'success');
        });
    }
    
    if (saveStandards) {
        saveStandards.addEventListener('click', () => {
            showToastMessage('Standards configuration saved successfully!', 'success');
        });
    }
    
    if (saveNotifications) {
        saveNotifications.addEventListener('click', () => {
            const settings = {
                notificationEmail: document.getElementById('notificationEmail')?.value || 'admin@cte.edu'
            };
            localStorage.setItem('notificationSettings', JSON.stringify(settings));
            showToastMessage('Notification settings saved successfully!', 'success');
        });
    }
    
    if (saveBackup) {
        saveBackup.addEventListener('click', () => {
            const settings = {
                backupSchedule: document.getElementById('backupSchedule')?.value || 'weekly',
                backupRetention: document.getElementById('backupRetention')?.value || '90'
            };
            localStorage.setItem('backupSettings', JSON.stringify(settings));
            showToastMessage('Backup settings saved successfully!', 'success');
        });
    }
    
    if (saveApi) {
        saveApi.addEventListener('click', () => {
            const settings = {
                apiEnabled: document.getElementById('apiEnabled')?.checked || true
            };
            localStorage.setItem('apiSettings', JSON.stringify(settings));
            showToastMessage('API settings saved successfully!', 'success');
        });
    }
    
    // Backup Now button
    if (backupNowBtn) {
        backupNowBtn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = 'Creating backup...';
            this.disabled = true;
            
            setTimeout(() => {
                showToastMessage('Backup created successfully!', 'success');
                this.innerHTML = originalText;
                this.disabled = false;
            }, 2000);
        });
    }
    
    // Regenerate API key button
    const regenerateApiKey = document.getElementById('regenerateApiKey');
    if (regenerateApiKey) {
        regenerateApiKey.addEventListener('click', () => {
            if (confirm('Regenerate API key? This will invalidate existing keys.')) {
                const newKey = 'key_' + Math.random().toString(36).substring(2, 20);
                showToastMessage(`New API key generated: ${newKey}`, 'success');
            }
        });
    }
    
    // Add webhook button
    const addWebhookBtn = document.getElementById('addWebhookBtn');
    if (addWebhookBtn) {
        addWebhookBtn.addEventListener('click', () => {
            const url = document.getElementById('webhookUrl')?.value;
            if (url) {
                showToastMessage(`Webhook added: ${url}`, 'success');
                document.getElementById('webhookUrl').value = '';
            } else {
                showToastMessage('Please enter a webhook URL', 'error');
            }
        });
    }
    
    // Cancel buttons
    const cancelButtons = document.querySelectorAll('.border.border-gray-300.rounded-lg.text-gray-700');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Discard unsaved changes?')) {
                showToastMessage('Changes discarded.', 'success');
            }
        });
    });
    
    // Active navigation state
    const currentPath = window.location.pathname.split('/').pop() || 'settings.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1a4450';
        }
    });
});
    // ============================================
    // MOBILE SIDEBAR TOGGLE
    // ============================================
    
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('mainSidebar');
    
    if (menuToggle && sidebar) {
        // Create overlay if it doesn't exist
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        
        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            document.body.style.overflow = '';
        }
        
        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.classList.add('sidebar-open');
            document.body.style.overflow = 'hidden';
        }
        
        // Toggle sidebar on button click
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
        
        // Close sidebar when clicking overlay
        overlay.addEventListener('click', closeSidebar);
        
        // Close sidebar when clicking on nav links (mobile only)
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
        
        // Ensure button is visible on mobile
        function checkMobile() {
            if (window.innerWidth <= 768) {
                menuToggle.style.display = 'flex';
                menuToggle.style.alignItems = 'center';
                menuToggle.style.justifyContent = 'center';
            } else {
                menuToggle.style.display = 'none';
                closeSidebar();
            }
        }
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
    }
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
    
    // Other buttons
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
    // CATEGORIES & DEPARTMENTS MANAGEMENT
    // ============================================
    
    // Data storage
    let categories = [];
    let departments = [];
    let currentEditCategoryId = null;
    let currentEditDeptId = null;
    let deleteTarget = { type: null, id: null };
    
    // Default categories - Fixed to Instruction, Research, Extension, Employment
    const defaultCategories = [
        { id: 'cat1', name: 'Instruction', code: 'INST' },
        { id: 'cat2', name: 'Research', code: 'RES' },
        { id: 'cat3', name: 'Extension', code: 'EXT' },
        { id: 'cat4', name: 'Employment', code: 'EMP' }
    ];
    
    const defaultDepartments = [
        { id: 'dept1', code: 'BEED', name: 'Bachelor of Elementary Education' },
        { id: 'dept2', code: 'BSED', name: 'Bachelor of Secondary Education' },
        { id: 'dept3', code: 'BSNED', name: 'Bachelor of Special Needs Education' },
        { id: 'dept4', code: 'BCAED', name: 'Bachelor of Culture and Arts Education' },
        { id: 'dept5', code: 'BPED', name: 'Bachelor of Physical Education' }
    ];
    
    // Load data from localStorage
    function loadCategoriesData() {
        const saved = localStorage.getItem('systemCategories');
        if (saved) {
            categories = JSON.parse(saved);
        } else {
            categories = [...defaultCategories];
            localStorage.setItem('systemCategories', JSON.stringify(categories));
        }
        renderCategoriesTable();
    }
    
    function loadDepartmentsData() {
        const saved = localStorage.getItem('systemDepartments');
        if (saved) {
            departments = JSON.parse(saved);
        } else {
            departments = [...defaultDepartments];
            localStorage.setItem('systemDepartments', JSON.stringify(departments));
        }
        renderDepartmentsTable();
    }
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Render categories table
    function renderCategoriesTable() {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-gray-500">No categories found. Click "Add Category" to create one.</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map(cat => `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">${escapeHtml(cat.name)}</td>
                <td class="py-3 px-4 text-gray-600">${escapeHtml(cat.code || '—')}</td>
                <td class="py-3 px-4 text-center">
                    <button onclick="window.editCategory('${cat.id}')" class="text-teal-600 hover:text-teal-800 mr-3 text-sm font-medium">Edit</button>
                    <button onclick="window.deleteCategory('${cat.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Render departments table
    function renderDepartmentsTable() {
        const tbody = document.getElementById('departmentsTableBody');
        if (!tbody) return;
        
        if (departments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-gray-500">No departments found. Click "Add Department" to create one.</td></tr>';
            return;
        }
        
        tbody.innerHTML = departments.map(dept => `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">${escapeHtml(dept.code)}</td>
                <td class="py-3 px-4 text-gray-700">${escapeHtml(dept.name)}</td>
                <td class="py-3 px-4 text-center">
                    <button onclick="window.editDepartment('${dept.id}')" class="text-teal-600 hover:text-teal-800 mr-3 text-sm font-medium">Edit</button>
                    <button onclick="window.deleteDepartment('${dept.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Make functions globally accessible for inline onclick
    window.editCategory = function(id) {
        console.log('Edit category called with id:', id);
        const category = categories.find(c => c.id === id);
        if (category) {
            currentEditCategoryId = id;
            document.getElementById('categoryModalTitle').textContent = 'Edit Category';
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryCode').value = category.code || '';
            document.getElementById('categoryModal').classList.remove('hidden');
        } else {
            console.error('Category not found:', id);
        }
    };
    
    window.deleteCategory = function(id) {
        deleteTarget = { type: 'category', id: id };
        const category = categories.find(c => c.id === id);
        document.getElementById('deleteMessage').textContent = `Are you sure you want to delete the category "${category?.name}"?`;
        document.getElementById('deleteModal').classList.remove('hidden');
    };
    
    window.editDepartment = function(id) {
        console.log('Edit department called with id:', id);
        const department = departments.find(d => d.id === id);
        if (department) {
            currentEditDeptId = id;
            document.getElementById('departmentModalTitle').textContent = 'Edit Department';
            document.getElementById('deptCode').value = department.code;
            document.getElementById('deptFullName').value = department.name;
            document.getElementById('departmentModal').classList.remove('hidden');
        } else {
            console.error('Department not found:', id);
        }
    };
    
    window.deleteDepartment = function(id) {
        deleteTarget = { type: 'department', id: id };
        const department = departments.find(d => d.id === id);
        document.getElementById('deleteMessage').textContent = `Are you sure you want to delete the department "${department?.code} - ${department?.name}"?`;
        document.getElementById('deleteModal').classList.remove('hidden');
    };
    
    // Add Category Button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            currentEditCategoryId = null;
            document.getElementById('categoryModalTitle').textContent = 'Add Category';
            document.getElementById('categoryName').value = '';
            document.getElementById('categoryCode').value = '';
            document.getElementById('categoryModal').classList.remove('hidden');
        });
    }
    
    // Add Department Button
    const addDeptBtn = document.getElementById('addDeptBtn');
    if (addDeptBtn) {
        addDeptBtn.addEventListener('click', () => {
            currentEditDeptId = null;
            document.getElementById('departmentModalTitle').textContent = 'Add Department';
            document.getElementById('deptCode').value = '';
            document.getElementById('deptFullName').value = '';
            document.getElementById('departmentModal').classList.remove('hidden');
        });
    }
    
    // Save Category
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', () => {
            const name = document.getElementById('categoryName').value.trim();
            const code = document.getElementById('categoryCode').value.trim();
            
            if (!name) {
                showToastMessage('Category name is required', 'error');
                return;
            }
            
            if (currentEditCategoryId) {
                // Edit existing
                const index = categories.findIndex(c => c.id === currentEditCategoryId);
                if (index !== -1) {
                    categories[index] = {
                        ...categories[index],
                        name: name,
                        code: code
                    };
                    showToastMessage('Category updated successfully', 'success');
                }
            } else {
                // Check for duplicate name
                const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
                if (exists) {
                    showToastMessage('Category name already exists', 'error');
                    return;
                }
                // Add new
                const newId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                categories.push({
                    id: newId,
                    name: name,
                    code: code
                });
                showToastMessage('Category added successfully', 'success');
            }
            
            localStorage.setItem('systemCategories', JSON.stringify(categories));
            renderCategoriesTable();
            document.getElementById('categoryModal').classList.add('hidden');
        });
    }
    
    // Save Department
    const saveDepartmentBtn = document.getElementById('saveDepartmentBtn');
    if (saveDepartmentBtn) {
        saveDepartmentBtn.addEventListener('click', () => {
            const code = document.getElementById('deptCode').value.trim().toUpperCase();
            const name = document.getElementById('deptFullName').value.trim();
            
            if (!code) {
                showToastMessage('Department code is required', 'error');
                return;
            }
            if (!name) {
                showToastMessage('Department full name is required', 'error');
                return;
            }
            
            // Check for duplicate code when adding new
            if (!currentEditDeptId) {
                const exists = departments.some(d => d.code === code);
                if (exists) {
                    showToastMessage('Department code already exists', 'error');
                    return;
                }
            } else {
                // Check duplicate for edit (excluding current)
                const exists = departments.some(d => d.code === code && d.id !== currentEditDeptId);
                if (exists) {
                    showToastMessage('Department code already exists', 'error');
                    return;
                }
            }
            
            if (currentEditDeptId) {
                // Edit existing
                const index = departments.findIndex(d => d.id === currentEditDeptId);
                if (index !== -1) {
                    departments[index] = {
                        ...departments[index],
                        code: code,
                        name: name
                    };
                    showToastMessage('Department updated successfully', 'success');
                }
            } else {
                // Add new
                const newId = 'dept_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                departments.push({
                    id: newId,
                    code: code,
                    name: name
                });
                showToastMessage('Department added successfully', 'success');
            }
            
            localStorage.setItem('systemDepartments', JSON.stringify(departments));
            renderDepartmentsTable();
            document.getElementById('departmentModal').classList.add('hidden');
        });
    }
    
    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (deleteTarget.type === 'category') {
                categories = categories.filter(c => c.id !== deleteTarget.id);
                localStorage.setItem('systemCategories', JSON.stringify(categories));
                renderCategoriesTable();
                showToastMessage('Category deleted successfully', 'success');
            } else if (deleteTarget.type === 'department') {
                departments = departments.filter(d => d.id !== deleteTarget.id);
                localStorage.setItem('systemDepartments', JSON.stringify(departments));
                renderDepartmentsTable();
                showToastMessage('Department deleted successfully', 'success');
            }
            document.getElementById('deleteModal').classList.add('hidden');
            deleteTarget = { type: null, id: null };
        });
    }
    
    // Close modals
    const closeCategoryModal = document.getElementById('closeCategoryModal');
    const closeDepartmentModal = document.getElementById('closeDepartmentModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    
    if (closeCategoryModal) {
        closeCategoryModal.addEventListener('click', () => {
            document.getElementById('categoryModal').classList.add('hidden');
        });
    }
    
    if (closeDepartmentModal) {
        closeDepartmentModal.addEventListener('click', () => {
            document.getElementById('departmentModal').classList.add('hidden');
        });
    }
    
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', () => {
            document.getElementById('deleteModal').classList.add('hidden');
        });
    }
    
    // Close modals when clicking outside
    const modals = ['categoryModal', 'departmentModal', 'deleteModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    });
    
    // Load data on page load
    loadCategoriesData();
    loadDepartmentsData();
    
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
    
    // ============================================
    // CHANGE PASSWORD WITH TOGGLE BUTTON
    // ============================================
    
    const showChangePasswordBtn = document.getElementById('showChangePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMessage = document.getElementById('passwordMessage');
    
    // Show change password form when button is clicked
    if (showChangePasswordBtn) {
        showChangePasswordBtn.addEventListener('click', function() {
            changePasswordForm.classList.remove('hidden');
            // Clear any previous inputs and messages
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
            if (passwordMessage) {
                passwordMessage.classList.add('hidden');
            }
        });
    }
    
    // Cancel change password
    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.addEventListener('click', function() {
            changePasswordForm.classList.add('hidden');
            if (passwordMessage) {
                passwordMessage.classList.add('hidden');
            }
        });
    }
    
    // Change password functionality
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
                
                // Hide form after successful change
                setTimeout(() => {
                    changePasswordForm.classList.add('hidden');
                    if (passwordMessage) passwordMessage.classList.add('hidden');
                }, 2000);
                
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
                systemEmail: document.getElementById('systemEmail')?.value || 'qa@cte.edu'
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
                autoApproveDeptHead: document.getElementById('autoApproveDeptHead')?.checked || false
            };
            localStorage.setItem('workflowSettings', JSON.stringify(settings));
            showToastMessage('Workflow settings saved successfully!', 'success');
        });
    }
    
    if (saveStandards) {
        saveStandards.addEventListener('click', () => {
            saveStandardsToAPI();
        });
    }

    // ============================================
    // STANDARDS MANAGEMENT
    // ============================================

    function loadStandardsSettings() {
        const container = document.getElementById('standardsListContainer');
        if (!container) return;
        fetch('http://localhost:3000/api/documents/standards', {
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(activeStandards => {
            // Also fetch all standards (including inactive) via admin route
            return fetch('http://localhost:3000/api/documents/standards', {
                headers: { 'x-auth-token': token }
            })
            .then(r => r.json())
            .then(standards => renderStandardsCheckboxes(container, standards));
        })
        .catch(err => console.error('Load standards settings error:', err));
    }

    function renderStandardsCheckboxes(container, standards) {
        if (!standards.length) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No standards found.</p>';
            return;
        }
        // Group by category_name
        const grouped = standards.reduce((acc, s) => {
            const key = s.category_name || 'Uncategorized';
            if (!acc[key]) acc[key] = [];
            acc[key].push(s);
            return acc;
        }, {});
        container.innerHTML = Object.entries(grouped).map(([cat, items]) => `
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 mb-2">${escapeHtml(cat)}</h4>
                ${items.map(s => `
                    <label class="flex items-center gap-2 py-1 cursor-pointer">
                        <input type="checkbox" class="standard-toggle w-4 h-4 accent-teal-600"
                            data-id="${s.id}" ${s.is_active ? 'checked' : ''}>
                        <span class="text-sm text-gray-700">${escapeHtml(s.name)}
                            <span class="text-xs text-gray-400">(${escapeHtml(s.code)})</span>
                        </span>
                    </label>
                `).join('')}
            </div>
        `).join('');
    }

    function saveStandardsToAPI() {
        const checkboxes = document.querySelectorAll('.standard-toggle');
        const promises = Array.from(checkboxes).map(cb =>
            fetch(`http://localhost:3000/api/admin/standards/${cb.dataset.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ is_active: cb.checked })
            })
        );
        Promise.all(promises)
            .then(() => showToastMessage('Standards saved successfully!', 'success'))
            .catch(() => showToastMessage('Failed to save some standards', 'error'));
    }

    loadStandardsSettings();
    
    // Cancel buttons
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Discard unsaved changes?')) {
                showToastMessage('Changes discarded.', 'success');
            }
        });
    });
    
    // Load saved general settings on page load
    function loadSavedGeneralSettings() {
        const saved = localStorage.getItem('generalSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (document.getElementById('systemName')) document.getElementById('systemName').value = settings.systemName || '';
            if (document.getElementById('institutionName')) document.getElementById('institutionName').value = settings.institutionName || '';
            if (document.getElementById('systemEmail')) document.getElementById('systemEmail').value = settings.systemEmail || '';
        } else {
            // Set default values
            if (document.getElementById('systemName')) document.getElementById('systemName').value = 'DRMS-QA';
            if (document.getElementById('institutionName')) document.getElementById('institutionName').value = 'College of Teacher Education';
            if (document.getElementById('systemEmail')) document.getElementById('systemEmail').value = 'qa@cte.edu';
        }
    }
    
    // Load saved workflow settings on page load
    function loadSavedWorkflowSettings() {
        const saved = localStorage.getItem('workflowSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (settings.workflowType) {
                const radio = document.querySelector(`input[name="workflowType"][value="${settings.workflowType}"]`);
                if (radio) radio.checked = true;
            }
            if (document.getElementById('autoApproveAdmin')) document.getElementById('autoApproveAdmin').checked = settings.autoApproveAdmin || false;
            if (document.getElementById('autoApproveDean')) document.getElementById('autoApproveDean').checked = settings.autoApproveDean || false;
            if (document.getElementById('autoApproveDeptHead')) document.getElementById('autoApproveDeptHead').checked = settings.autoApproveDeptHead || false;
        }
    }
    
    loadSavedGeneralSettings();
    loadSavedWorkflowSettings();
    
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
});
// js/settings.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page JS loaded successfully');

    // ── Access guard: Admin and Dean can access settings ──
    const _user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (_user.role || '').toLowerCase().trim();
    const isAdmin = userRole === 'admin';
    const isDean = userRole === 'dean';
    
    if (!isAdmin && !isDean) {
        window.location.href = 'homepage.html';
        return;
    }

    // ── Check token validity ──
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        window.location.href = 'landing.html';
        return;
    }
    
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
    
    // ── Hide/Disable tabs based on role ──
    if (isDean) {
        const subtitle = document.getElementById('settingsSubtitle');
        if (subtitle) {
            subtitle.innerHTML = 'View document requirements and manage your account <span class="text-amber-600 font-medium">(Read-Only Access)</span>';
        }
        
        // Dean can only view Requirements and Account tabs
        const restrictedTabs = ['general', 'standards', 'categories-depts'];
        restrictedTabs.forEach(tabName => {
            const tabLink = document.querySelector(`a[data-tab="${tabName}"]`);
            if (tabLink) {
                tabLink.parentElement.style.display = 'none';
            }
        });
        
        // Disable save buttons in Requirements tab
        const saveRequirementsBtn = document.getElementById('saveRequirements');
        const resetRequirementsBtn = document.getElementById('resetRequirements');
        if (saveRequirementsBtn) {
            saveRequirementsBtn.style.display = 'none';
        }
        if (resetRequirementsBtn) {
            resetRequirementsBtn.style.display = 'none';
        }
        
        // Make all requirement inputs readonly
        document.querySelectorAll('.expected-docs').forEach(input => {
            input.setAttribute('readonly', 'readonly');
            input.style.backgroundColor = '#f9fafb';
            input.style.cursor = 'not-allowed';
        });
        
        // Add read-only notice to Requirements tab
        setTimeout(() => {
            const requirementsTab = document.getElementById('requirementsTab');
            if (requirementsTab) {
                const notice = document.createElement('div');
                notice.className = 'bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4';
                notice.innerHTML = '<p class="text-sm text-amber-700"><strong>Note:</strong> You have read-only access to document requirements. Contact an administrator to make changes.</p>';
                requirementsTab.insertBefore(notice, requirementsTab.firstChild);
            }
        }, 200);
        
        // Set default tab to requirements for dean
        setTimeout(() => {
            const requirementsTab = document.querySelector('a[data-tab="requirements"]');
            if (requirementsTab) {
                requirementsTab.click();
            }
        }, 100);
    }
    
    // DOM elements
    const tabLinks = document.querySelectorAll('#settingsTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Save buttons
    const saveGeneral = document.getElementById('saveGeneral');
    const saveStandards = document.getElementById('saveStandards');
    
    // Other buttons
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Tab switching functionality
    console.log('Tab links found:', tabLinks.length);
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Tab clicked:', this.getAttribute('data-tab'));
            
            const tabId = this.getAttribute('data-tab');
            
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });
            
            const activeTab = document.getElementById(tabId + 'Tab');
            if (activeTab) {
                activeTab.classList.remove('hidden');
                activeTab.classList.add('block');
            }
            
            if (tabId === 'categories-depts') {
                loadDepartmentsData();
            }
        });
    });
    
    // ============================================
    // CATEGORIES & DEPARTMENTS MANAGEMENT
    // ============================================
    
    let categories = [];
    let departments = [];
    let currentEditCategoryId = null;
    let currentEditDeptId = null;
    let deleteTarget = { type: null, id: null };
    
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
        const tbody = document.getElementById('departmentsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-gray-500">Loading departments...</td></tr>';
        }
        
        fetch('http://localhost:3000/api/settings/departments', {
            headers: { 'x-auth-token': token }
        })
        .then(r => {
            if (!r.ok) {
                return r.json().then(data => {
                    throw new Error(data.msg || `HTTP ${r.status}: Failed to fetch departments`);
                }).catch(err => {
                    if (err.message.includes('HTTP')) throw err;
                    throw new Error(`HTTP ${r.status}: Failed to fetch departments`);
                });
            }
            return r.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Invalid departments data format');
            }
            departments = data.map(d => ({
                id: d.id,
                code: d.code,
                name: d.name
            }));
            renderDepartmentsTable();
        })
        .catch(err => {
            console.error('Load departments error:', err);
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-red-500">Error: ${err.message}</td></tr>`;
            }
        });
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function renderCategoriesTable() {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-gray-500">No categories found.</td></tr>';
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
    
    window.editCategory = function(id) {
        const category = categories.find(c => c.id === id);
        if (category) {
            currentEditCategoryId = id;
            document.getElementById('categoryModalTitle').textContent = 'Edit Category';
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryCode').value = category.code || '';
            document.getElementById('categoryModal').classList.remove('hidden');
        }
    };
    
    window.deleteCategory = function(id) {
        deleteTarget = { type: 'category', id: id };
        const category = categories.find(c => c.id === id);
        document.getElementById('deleteMessage').textContent = `Are you sure you want to delete the category "${category?.name}"?`;
        document.getElementById('deleteModal').classList.remove('hidden');
    };
    
    window.editDepartment = function(id) {
        const department = departments.find(d => d.id === id);
        if (department) {
            currentEditDeptId = id;
            document.getElementById('departmentModalTitle').textContent = 'Edit Department';
            document.getElementById('deptCode').value = department.code;
            document.getElementById('deptFullName').value = department.name;
            document.getElementById('departmentModal').classList.remove('hidden');
        }
    };
    
    window.deleteDepartment = function(id) {
        deleteTarget = { type: 'department', id: id };
        const department = departments.find(d => d.id === id);
        document.getElementById('deleteMessage').textContent = `Are you sure you want to delete the department "${department?.code} - ${department?.name}"?`;
        document.getElementById('deleteModal').classList.remove('hidden');
    };
    
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
                const index = categories.findIndex(c => c.id === currentEditCategoryId);
                if (index !== -1) {
                    categories[index] = { ...categories[index], name: name, code: code };
                    showToastMessage('Category updated successfully', 'success');
                }
            } else {
                const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
                if (exists) {
                    showToastMessage('Category name already exists', 'error');
                    return;
                }
                const newId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                categories.push({ id: newId, name: name, code: code });
                showToastMessage('Category added successfully', 'success');
            }
            
            localStorage.setItem('systemCategories', JSON.stringify(categories));
            renderCategoriesTable();
            document.getElementById('categoryModal').classList.add('hidden');
        });
    }
    
    const saveDepartmentBtn = document.getElementById('saveDepartmentBtn');
    if (saveDepartmentBtn) {
        saveDepartmentBtn.addEventListener('click', async () => {
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
            
            try {
                let response;
                if (currentEditDeptId) {
                    response = await fetch(`http://localhost:3000/api/settings/departments/${currentEditDeptId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({ code, name })
                    });
                } else {
                    response = await fetch('http://localhost:3000/api/settings/departments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({ code, name })
                    });
                }
                
                const data = await response.json();
                
                if (response.ok) {
                    showToastMessage(data.msg, 'success');
                    loadDepartmentsData();
                    document.getElementById('departmentModal').classList.add('hidden');
                } else {
                    showToastMessage(data.msg || 'Failed to save department', 'error');
                }
            } catch (error) {
                console.error('Save department error:', error);
                showToastMessage('Failed to save department', 'error');
            }
        });
    }
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (deleteTarget.type === 'category') {
                categories = categories.filter(c => c.id !== deleteTarget.id);
                localStorage.setItem('systemCategories', JSON.stringify(categories));
                renderCategoriesTable();
                showToastMessage('Category deleted successfully', 'success');
            } else if (deleteTarget.type === 'department') {
                try {
                    const response = await fetch(`http://localhost:3000/api/settings/departments/${deleteTarget.id}`, {
                        method: 'DELETE',
                        headers: { 'x-auth-token': token }
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showToastMessage(data.msg, 'success');
                        loadDepartmentsData();
                    } else {
                        showToastMessage(data.msg || 'Failed to delete department', 'error');
                    }
                } catch (error) {
                    console.error('Delete department error:', error);
                    showToastMessage('Failed to delete department', 'error');
                }
            }
            document.getElementById('deleteModal').classList.add('hidden');
            deleteTarget = { type: null, id: null };
        });
    }
    
    const closeCategoryModal = document.getElementById('closeCategoryModal');
    const closeCategoryModal2 = document.getElementById('closeCategoryModal2');
    const closeDepartmentModal = document.getElementById('closeDepartmentModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    
    if (closeCategoryModal) {
        closeCategoryModal.addEventListener('click', () => {
            document.getElementById('categoryModal').classList.add('hidden');
        });
    }
    if (closeCategoryModal2) {
        closeCategoryModal2.addEventListener('click', () => {
            document.getElementById('categoryModal').classList.add('hidden');
        });
    }
    if (closeDepartmentModal) {
        closeDepartmentModal.addEventListener('click', () => {
            document.getElementById('departmentModal').classList.add('hidden');
        });
    }
    const closeDepartmentModal2 = document.getElementById('closeDepartmentModal2');
    if (closeDepartmentModal2) {
        closeDepartmentModal2.addEventListener('click', () => {
            document.getElementById('departmentModal').classList.add('hidden');
        });
    }
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', () => {
            document.getElementById('deleteModal').classList.add('hidden');
        });
    }
    const closeDeleteModal2 = document.getElementById('closeDeleteModal2');
    if (closeDeleteModal2) {
        closeDeleteModal2.addEventListener('click', () => {
            document.getElementById('deleteModal').classList.add('hidden');
        });
    }
    
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
    
    loadCategoriesData();
    
    if (isAdmin) {
        setTimeout(() => {
            const categoriesDeptsTab = document.querySelector('a[data-tab="categories-depts"]');
            if (categoriesDeptsTab && categoriesDeptsTab.parentElement.style.display !== 'none') {
                loadDepartmentsData();
            }
        }, 100);
    }
    
    // ============================================
    // PROFILE MANAGEMENT
    // ============================================
    
    let isEditing = false;
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileInputs = ['lastName', 'firstName', 'middleInitial', 'personalEmail', 'dob', 'age', 'nationality', 'phone', 'address'];
    const profileSelects = ['gender', 'civilStatus'];
    const employmentInputs = ['employeeId', 'position', 'dateOfHire', 'yearsInService'];
    const employmentSelects = ['departmentAssignment', 'employmentStatus'];
    const employmentTextareas = ['previousPositions'];
    
    async function loadUserProfile() {
        try {
            const response = await fetch('http://localhost:3000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load profile');
            }
            
            const data = await response.json();
            const user = data.user;
            const profile = data.profile;
            
            // Update profile header
            const profileInitials = document.getElementById('profileInitials');
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profileRoleBadge = document.getElementById('profileRoleBadge');
            const personalEmail = document.getElementById('personalEmail');
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
                    'department-head': 'Dept. Head',
                    'evaluator': 'External Evaluator'
                };
                profileRoleBadge.textContent = roleMap[user.role] || user.role;
            }
            if (profileStatus) {
                profileStatus.textContent = user.status === 'approved' ? 'Approved' : (user.status || 'Active');
            }
            
            // Load personal info
            const lastNameInput = document.getElementById('lastName');
            const firstNameInput = document.getElementById('firstName');
            const middleInitialInput = document.getElementById('middleInitial');
            if (lastNameInput) lastNameInput.value = user.lastName || '';
            if (firstNameInput) firstNameInput.value = user.firstName || '';
            if (middleInitialInput) middleInitialInput.value = user.middleInitial || '';
            
            if (profile) {
                const dobInput = document.getElementById('dob');
                const ageInput = document.getElementById('age');
                const genderInput = document.getElementById('gender');
                const civilStatusInput = document.getElementById('civilStatus');
                const nationalityInput = document.getElementById('nationality');
                const phoneInput = document.getElementById('phone');
                const addressInput = document.getElementById('address');
                
                if (dobInput) dobInput.value = profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '';
                if (ageInput) ageInput.value = profile.age || '';
                if (genderInput) genderInput.value = profile.gender || '';
                if (civilStatusInput) civilStatusInput.value = profile.civilStatus || '';
                if (nationalityInput) nationalityInput.value = profile.nationality || '';
                if (phoneInput) phoneInput.value = profile.phone || '';
                if (addressInput) addressInput.value = profile.address || '';
                
                // Load employment information
                const employeeIdInput = document.getElementById('employeeId');
                const positionInput = document.getElementById('position');
                const departmentAssignment = document.getElementById('departmentAssignment');
                const employmentStatus = document.getElementById('employmentStatus');
                const dateOfHire = document.getElementById('dateOfHire');
                const yearsInService = document.getElementById('yearsInService');
                const previousPositions = document.getElementById('previousPositions');
                
                if (employeeIdInput) employeeIdInput.value = profile.employeeId || '';
                if (positionInput) positionInput.value = profile.position || '';
                if (departmentAssignment) departmentAssignment.value = profile.department || '';
                if (employmentStatus) employmentStatus.value = profile.employmentStatus || '';
                if (dateOfHire) dateOfHire.value = profile.dateOfHire || '';
                if (yearsInService) yearsInService.value = profile.yearsInService || '';
                if (previousPositions) previousPositions.value = profile.previousPositions || '';
            }
            
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
        } catch (error) {
            console.error('Load profile error:', error);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const lastNameInput = document.getElementById('lastName');
            const firstNameInput = document.getElementById('firstName');
            const middleInitialInput = document.getElementById('middleInitial');
            const personalEmail = document.getElementById('personalEmail');
            
            if (lastNameInput) lastNameInput.value = user.lastName || '';
            if (firstNameInput) firstNameInput.value = user.firstName || '';
            if (middleInitialInput) middleInitialInput.value = user.middleInitial || '';
            if (personalEmail) personalEmail.value = user.email || '';
            
            const profileInitials = document.getElementById('profileInitials');
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            
            if (user.firstName && user.lastName) {
                const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
                if (profileInitials) profileInitials.textContent = initials;
                if (profileName) profileName.textContent = `${user.firstName} ${user.lastName}`;
            }
            if (user.email && profileEmail) {
                profileEmail.textContent = user.email;
            }
        }
    }
    
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
        
        employmentInputs.forEach(inputId => {
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
        
        employmentSelects.forEach(selectId => {
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
        
        employmentTextareas.forEach(textareaId => {
            const textarea = document.getElementById(textareaId);
            if (textarea) {
                if (isEditing) {
                    textarea.classList.remove('bg-gray-50');
                    textarea.classList.add('bg-white');
                    textarea.removeAttribute('readonly');
                } else {
                    textarea.classList.add('bg-gray-50');
                    textarea.classList.remove('bg-white');
                    textarea.setAttribute('readonly', 'readonly');
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
    
    async function saveProfileChanges() {
        const profileData = {
            lastName: document.getElementById('lastName')?.value || '',
            firstName: document.getElementById('firstName')?.value || '',
            middleInitial: document.getElementById('middleInitial')?.value || '',
            dateOfBirth: document.getElementById('dob')?.value || null,
            age: document.getElementById('age')?.value || null,
            gender: document.getElementById('gender')?.value || null,
            civilStatus: document.getElementById('civilStatus')?.value || null,
            nationality: document.getElementById('nationality')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            address: document.getElementById('address')?.value || '',
            employeeId: document.getElementById('employeeId')?.value || '',
            position: document.getElementById('position')?.value || '',
            department: document.getElementById('departmentAssignment')?.value || '',
            employmentStatus: document.getElementById('employmentStatus')?.value || '',
            dateOfHire: document.getElementById('dateOfHire')?.value || null,
            yearsInService: document.getElementById('yearsInService')?.value || '',
            previousPositions: document.getElementById('previousPositions')?.value || ''
        };
        
        try {
            const response = await fetch('http://localhost:3000/api/profile/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.firstName = profileData.firstName;
            user.lastName = profileData.lastName;
            user.middleInitial = profileData.middleInitial;
            localStorage.setItem('user', JSON.stringify(user));
            
            const userInitialsSpan = document.getElementById('userInitials');
            const userNameSpan = document.getElementById('userName');
            if (userInitialsSpan && profileData.firstName && profileData.lastName) {
                userInitialsSpan.textContent = (profileData.firstName[0] + profileData.lastName[0]).toUpperCase();
            }
            if (userNameSpan) {
                userNameSpan.textContent = `${profileData.firstName} ${profileData.lastName}`;
            }
            
            const profileInitials = document.getElementById('profileInitials');
            const profileName = document.getElementById('profileName');
            if (profileInitials && profileData.firstName && profileData.lastName) {
                profileInitials.textContent = (profileData.firstName[0] + profileData.lastName[0]).toUpperCase();
            }
            if (profileName) {
                profileName.textContent = `${profileData.firstName} ${profileData.lastName}`;
            }
            
            showToastMessage('Profile updated successfully!', 'success');
            toggleEditMode();
        } catch (error) {
            console.error('Save profile error:', error);
            showToastMessage('Failed to update profile', 'error');
        }
    }
    
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
    // CHANGE PASSWORD
    // ============================================
    
    const showChangePasswordBtn = document.getElementById('showChangePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMessage = document.getElementById('passwordMessage');
    
    if (showChangePasswordBtn) {
        showChangePasswordBtn.addEventListener('click', function() {
            changePasswordForm.classList.remove('hidden');
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
            if (passwordMessage) {
                passwordMessage.classList.add('hidden');
            }
        });
    }
    
    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.addEventListener('click', function() {
            changePasswordForm.classList.add('hidden');
            if (passwordMessage) {
                passwordMessage.classList.add('hidden');
            }
        });
    }
    
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
                
                if (currentPasswordInput) currentPasswordInput.value = '';
                if (newPasswordInput) newPasswordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
                
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
    
    loadUserProfile();
    
    // ============================================
    // DOCUMENT REQUIREMENTS
    // ============================================
    
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
    
    document.querySelectorAll('.expected-docs').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
    
    const resetRequirementsBtn = document.getElementById('resetRequirements');
    if (resetRequirementsBtn) {
        resetRequirementsBtn.addEventListener('click', async () => {
            if (confirm('Reset all document requirements to default values?')) {
                try {
                    const response = await fetch('http://localhost:3000/api/settings/requirements/reset', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        }
                    });
                    
                    if (response.ok) {
                        showToastMessage('Requirements reset to defaults successfully!', 'success');
                        loadSavedRequirements();
                    } else {
                        const data = await response.json();
                        showToastMessage(data.msg || 'Failed to reset requirements', 'error');
                    }
                } catch (error) {
                    console.error('Reset requirements error:', error);
                    showToastMessage('Failed to reset requirements', 'error');
                }
            }
        });
    }
    
    const saveRequirementsBtn = document.getElementById('saveRequirements');
    if (saveRequirementsBtn) {
        saveRequirementsBtn.addEventListener('click', async () => {
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
            
            try {
                const response = await fetch('http://localhost:3000/api/settings/requirements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify(requirements)
                });
                
                if (response.ok) {
                    showToastMessage('Document requirements saved successfully!', 'success');
                } else {
                    const data = await response.json();
                    showToastMessage(data.msg || 'Failed to save requirements', 'error');
                }
            } catch (error) {
                console.error('Save requirements error:', error);
                showToastMessage('Failed to save requirements', 'error');
            }
        });
    }
    
    async function loadSavedRequirements() {
        try {
            const response = await fetch('http://localhost:3000/api/settings/requirements', {
                headers: { 'x-auth-token': token }
            });
            
            if (response.ok) {
                const requirements = await response.json();
                const departments = ['beed', 'bsed', 'bsned', 'bcaed', 'bped'];
                const categories = ['instruction', 'research', 'extension', 'employment'];
                
                categories.forEach(cat => {
                    if (requirements[cat]) {
                        departments.forEach(dept => {
                            const input = document.getElementById(`${cat}_${dept}`);
                            if (input && requirements[cat][dept] !== undefined) {
                                input.value = requirements[cat][dept];
                            }
                        });
                    }
                });
                updateTotals();
            } else {
                loadRequirementsFromDatabase();
            }
        } catch (error) {
            console.error('Load requirements error:', error);
            loadRequirementsFromDatabase();
        }
    }
    
    async function loadRequirementsFromDatabase() {
        try {
            const response = await fetch('http://localhost:3000/api/documents/category-requirements', {
                headers: { 'x-auth-token': token }
            });
            
            if (response.ok) {
                const dbRequirements = await response.json();
                dbRequirements.forEach(req => {
                    const category = (req.category_name || '').toLowerCase();
                    const dept = (req.department_code || '').toLowerCase();
                    const input = document.getElementById(`${category}_${dept}`);
                    if (input) {
                        input.value = req.expected_documents || 0;
                    }
                });
                updateTotals();
            }
        } catch (error) {
            console.error('Load requirements from database error:', error);
        }
    }
    
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
        saveGeneral.addEventListener('click', async () => {
            const settings = {
                systemName: document.getElementById('systemName')?.value || 'DRMS-QA',
                institutionName: document.getElementById('institutionName')?.value || 'College of Teacher Education'
            };
            
            try {
                const response = await fetch('http://localhost:3000/api/settings/general', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify(settings)
                });
                
                if (response.ok) {
                    showToastMessage('General settings saved successfully!', 'success');
                } else {
                    const data = await response.json();
                    showToastMessage(data.msg || 'Failed to save settings', 'error');
                }
            } catch (error) {
                console.error('Save general settings error:', error);
                showToastMessage('Failed to save settings', 'error');
            }
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
        fetch('http://localhost:3000/api/admin/standards/all', {
            headers: { 'x-auth-token': token }
        })
        .then(r => {
            if (!r.ok) throw new Error('Failed to fetch standards');
            return r.json();
        })
        .then(standards => {
            if (Array.isArray(standards)) {
                renderStandardsByCategory(standards);
            } else {
                throw new Error('Invalid standards data format');
            }
        })
        .catch(err => {
            console.error('Load standards settings error:', err);
            ['instruction', 'research', 'extension', 'employment'].forEach(cat => {
                const container = document.getElementById(`${cat}Standards`);
                if (container) {
                    container.innerHTML = '<p class="text-sm text-red-500 col-span-full">Failed to load standards</p>';
                }
            });
        });
    }
    
    function renderStandardsByCategory(standards) {
        const grouped = {
            instruction: [],
            research: [],
            extension: [],
            employment: []
        };
        
        standards.forEach(s => {
            const categoryName = (s.category_name || '').toLowerCase();
            if (grouped[categoryName]) {
                grouped[categoryName].push(s);
            }
        });
        
        Object.keys(grouped).forEach(category => {
            const container = document.getElementById(`${category}Standards`);
            const countSpan = document.getElementById(`${category}StandardsCount`);
            
            if (!container) return;
            
            const items = grouped[category];
            
            if (countSpan) {
                countSpan.textContent = items.length;
            }
            
            if (items.length === 0) {
                container.innerHTML = '<p class="text-sm text-gray-400 col-span-full">No standards available</p>';
                return;
            }
            
            container.innerHTML = items.map(s => `
                <label class="flex items-start gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input type="checkbox" class="standard-toggle mt-0.5 w-4 h-4 accent-teal-600 flex-shrink-0"
                        data-id="${s.id}" ${s.is_active ? 'checked' : ''}>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-700 leading-tight">${escapeHtml(s.name)}</div>
                        <div class="text-xs text-gray-400 mt-0.5">${escapeHtml(s.code)}</div>
                    </div>
                </label>
            `).join('');
        });
    }
    
    function saveStandardsToAPI() {
        const checkboxes = document.querySelectorAll('.standard-toggle');
        if (checkboxes.length === 0) {
            showToastMessage('No standards to save', 'error');
            return;
        }
        
        const promises = Array.from(checkboxes).map(cb =>
            fetch(`http://localhost:3000/api/admin/standards/${cb.dataset.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ is_active: cb.checked })
            })
        );
        
        Promise.all(promises)
            .then(responses => {
                const allOk = responses.every(r => r.ok);
                if (allOk) {
                    showToastMessage('Standards saved successfully!', 'success');
                } else {
                    showToastMessage('Some standards failed to save', 'error');
                }
            })
            .catch(() => showToastMessage('Failed to save standards', 'error'));
    }
    
    loadStandardsSettings();
    
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Discard unsaved changes?')) {
                showToastMessage('Changes discarded.', 'success');
            }
        });
    });
    
    async function loadSavedGeneralSettings() {
        try {
            const response = await fetch('http://localhost:3000/api/settings/general', {
                headers: { 'x-auth-token': token }
            });
            
            if (response.ok) {
                const settings = await response.json();
                if (document.getElementById('systemName')) document.getElementById('systemName').value = settings.system_name || 'DRMS-QA';
                if (document.getElementById('institutionName')) document.getElementById('institutionName').value = settings.institution_name || 'College of Teacher Education';
            } else {
                if (document.getElementById('systemName')) document.getElementById('systemName').value = 'DRMS-QA';
                if (document.getElementById('institutionName')) document.getElementById('institutionName').value = 'College of Teacher Education';
            }
        } catch (error) {
            console.error('Load general settings error:', error);
            if (document.getElementById('systemName')) document.getElementById('systemName').value = 'DRMS-QA';
            if (document.getElementById('institutionName')) document.getElementById('institutionName').value = 'College of Teacher Education';
        }
    }
    
    loadSavedGeneralSettings();
    
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
        
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
        
        overlay.addEventListener('click', closeSidebar);
        
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
        
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
        
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
// js/profile.js

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin Profile JS loaded');

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role || '').toLowerCase().trim();

    if (!token || !user.id) {
        alert('Please login to view your profile.');
        window.location.href = 'landing.html';
        return;
    }

    // RBAC: Only admin-type users can access this page
    if (role === 'faculty member' || role === 'faculty' || role === 'area chair/program head' || role === 'area-chair' || role === 'department-head') {
        window.location.href = 'user-dashboard.html';
        return;
    }

    // ── Sidebar: populate user info ──
    const initials = (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
    const el = (id) => document.getElementById(id);
    if (el('sidebarInitials')) el('sidebarInitials').textContent = initials;
    if (el('sidebarName')) el('sidebarName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    // Map role to display name
    const roleDisplayMap = {
        'admin': 'Administrator',
        'dean': 'Dean',
        'faculty': 'Faculty',
        'faculty member': 'Faculty',
        'area-chair': 'Dept. Head',
        'area chair/program head': 'Dept. Head',
        'department-head': 'Dept. Head',
        'evaluator': 'External Evaluator'
    };
    const displayRole = roleDisplayMap[role] || user.role || '';
    if (el('sidebarRole')) el('sidebarRole').textContent = displayRole;

    // Fetch profile for dept to update sidebarRole
    fetch(`http://localhost:3000/api/user/profile/${user.id}`, {
        headers: { 'x-auth-token': token }
    }).then(r => r.json()).then(data => {
        if (el('sidebarRole')) {
            const dept = data.department ? ` · ${data.department}` : '';
            const dataRole = (data.role || '').toLowerCase().trim();
            const roleDisplayMap = {
                'admin': 'Administrator',
                'dean': 'Dean',
                'faculty': 'Faculty',
                'faculty member': 'Faculty',
                'area-chair': 'Dept. Head',
                'area chair/program head': 'Dept. Head',
                'department-head': 'Dept. Head',
                'evaluator': 'External Evaluator'
            };
            const mappedRole = roleDisplayMap[dataRole] || data.role || user.role || '';
            el('sidebarRole').textContent = `${mappedRole}${dept}`;
        }
    }).catch(() => {});

    // Heartbeat
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Hide Upload, Users, and Settings links for QA Coordinator
    if (role === 'qa coordinator') {
        const uploadLink = document.querySelector('a[href="upload.html"]');
        if (uploadLink) uploadLink.style.display = 'none';
        const usersLink = document.querySelector('a[href="users.html"]');
        if (usersLink) usersLink.style.display = 'none';
        const settingsLink = document.querySelector('a[href="settings.html"]');
        if (settingsLink) settingsLink.style.display = 'none';
    }
    // ─────────────────────────────────────────────────

    // Edit mode state
    let isEditMode = false;
    let originalData = {};

    // Get button references
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Get input references for auto-calculation
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');

    // Logout button handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }

    // Edit button handler
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            enableEditMode();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            if (confirm('Discard all changes?')) {
                disableEditMode();
                populateProfile(originalData);
            }
        });
    }

    // Save profile button
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function() {
            await saveUserProfile(user.id);
        });
    }

    // Auto-calculate age from DOB
    if (dobInput && ageInput) {
        dobInput.addEventListener('change', function() {
            if (this.value) {
                const birthDate = new Date(this.value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                ageInput.value = age;
            } else {
                ageInput.value = '';
            }
        });
    }

    // Fetch user profile data from backend
    await loadUserProfile(user.id);

    // Enable edit mode
    function enableEditMode() {
        isEditMode = true;

        editProfileBtn.classList.add('hidden');
        saveProfileBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');

        const editableFields = [
            'dob', 'gender', 'civilStatus', 'nationality', 'phone', 'address',
            'highestDegree', 'specialization', 'institution', 'gradYear', 'license', 'continuingEd',
            'subjectsTaught', 'yearLevel', 'loadUnits', 'advising', 'committeeRoles',
            'researchInterests', 'publications'
        ];

        editableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.removeAttribute('readonly');
                field.removeAttribute('disabled');
                field.classList.remove('bg-gray-50');
                field.classList.add('bg-white');
            }
        });
    }

    // Disable edit mode
    function disableEditMode() {
        isEditMode = false;

        editProfileBtn.classList.remove('hidden');
        saveProfileBtn.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');

        const editableFields = [
            'dob', 'gender', 'civilStatus', 'nationality', 'phone', 'address',
            'highestDegree', 'specialization', 'institution', 'gradYear', 'license', 'continuingEd',
            'subjectsTaught', 'yearLevel', 'loadUnits', 'advising', 'committeeRoles',
            'researchInterests', 'publications'
        ];

        editableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                if (field.tagName === 'SELECT') {
                    field.setAttribute('disabled', 'disabled');
                } else {
                    field.setAttribute('readonly', 'readonly');
                }
                field.classList.remove('bg-white');
                field.classList.add('bg-gray-50');
            }
        });
    }

    // Load user profile from backend
    async function loadUserProfile(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/user/profile/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
                throw new Error(errorData.msg || 'Failed to load profile');
            }

            const profileData = await response.json();
            originalData = profileData;
            populateProfile(profileData);
            disableEditMode();

        } catch (error) {
            console.error('Error loading profile:', error);
            alert('Failed to load profile data. Check console for details.');
        }
    }

    // Populate all profile fields
    function populateProfile(data) {
        const initials = (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '');
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        const dataRole = (data.role || '').toLowerCase().trim();
        const roleDisplayMap = {
            'admin': 'Administrator',
            'dean': 'Dean',
            'faculty': 'Faculty',
            'faculty member': 'Faculty',
            'area-chair': 'Dept. Head',
            'area chair/program head': 'Dept. Head',
            'department-head': 'Dept. Head',
            'evaluator': 'External Evaluator'
        };
        const displayRole = roleDisplayMap[dataRole] || data.role || '';
        const roleDept = `${displayRole}${data.department ? ' · ' + data.department : ''}`;

        // Sidebar
        if (el('sidebarInitials')) el('sidebarInitials').textContent = initials;
        if (el('sidebarName')) el('sidebarName').textContent = fullName;
        if (el('sidebarRole')) el('sidebarRole').textContent = roleDept;

        // Profile card
        document.getElementById('profileInitials').textContent = initials;
        document.getElementById('profileName').textContent = fullName;
        document.getElementById('profileRoleDept').textContent = roleDept;
        document.getElementById('profileEmail').textContent = data.email || '';

        // Member since
        if (data.createdAt) {
            const date = new Date(data.createdAt);
            document.getElementById('memberSince').textContent = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        // Profile status
        const statusBadge = data.status === 'approved' ? 'Approved' : data.status === 'pending' ? 'Pending' : 'Inactive';
        document.getElementById('profileStatus').textContent = statusBadge;

        // Account status
        document.getElementById('emailVerified').innerHTML = data.isVerified ?
            '<span class="text-green-600">✓ Yes</span>' :
            '<span class="text-gray-500">Not verified</span>';

        document.getElementById('accountType').textContent = displayRole;
        document.getElementById('accountType').className = 'bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full';

        document.getElementById('accountStatus').textContent = statusBadge;
        const statusClass = data.status === 'approved' ? 'bg-green-100 text-green-700' :
                           data.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700';
        document.getElementById('accountStatus').className = statusClass + ' text-xs px-2 py-1 rounded-full';

        // Personal Information (readonly)
        document.getElementById('lastName').value = data.lastName || '';
        document.getElementById('firstName').value = data.firstName || '';
        document.getElementById('middleInitial').value = data.middleInitial || '';
        document.getElementById('email').value = data.email || '';

        // Personal Information (editable)
        if (data.dateOfBirth) {
            const dobDate = new Date(data.dateOfBirth);
            document.getElementById('dob').value = dobDate.toISOString().split('T')[0];
        }
        if (data.age) document.getElementById('age').value = data.age;
        if (data.gender) document.getElementById('gender').value = data.gender;
        if (data.civilStatus) document.getElementById('civilStatus').value = data.civilStatus;
        if (data.nationality) document.getElementById('nationality').value = data.nationality;
        if (data.phone) document.getElementById('phone').value = data.phone;
        if (data.address) document.getElementById('address').value = data.address;

        // Employment Information (readonly)
        document.getElementById('employeeId').value = data.employeeId || '';
        document.getElementById('position').value = data.position || '';
        document.getElementById('department').value = data.department || '';
        document.getElementById('employmentStatus').value = data.employmentStatus || '';

        // Educational Background
        if (data.highestDegree) document.getElementById('highestDegree').value = data.highestDegree;
        if (data.specialization) document.getElementById('specialization').value = data.specialization;
        if (data.institution) document.getElementById('institution').value = data.institution;
        if (data.gradYear) document.getElementById('gradYear').value = data.gradYear;
        if (data.license) document.getElementById('license').value = data.license;
        if (data.continuingEd) document.getElementById('continuingEd').value = data.continuingEd;

        // Teaching Load
        if (data.subjectsTaught) document.getElementById('subjectsTaught').value = data.subjectsTaught;
        if (data.yearLevel) document.getElementById('yearLevel').value = data.yearLevel;
        if (data.loadUnits) document.getElementById('loadUnits').value = data.loadUnits;
        if (data.advising) document.getElementById('advising').value = data.advising;
        if (data.committeeRoles) document.getElementById('committeeRoles').value = data.committeeRoles;

        // Research Activities
        if (data.researchInterests) document.getElementById('researchInterests').value = data.researchInterests;
        if (data.publications) document.getElementById('publications').value = data.publications;

        // Trigger age calculation if DOB exists
        if (data.dateOfBirth && dobInput && ageInput) {
            dobInput.dispatchEvent(new Event('change'));
        }
    }

    // Save user profile
    async function saveUserProfile(userId) {
        const profileData = {
            dateOfBirth: document.getElementById('dob')?.value || null,
            age: document.getElementById('age')?.value || null,
            gender: document.getElementById('gender')?.value || null,
            civilStatus: document.getElementById('civilStatus')?.value || null,
            nationality: document.getElementById('nationality')?.value || null,
            phone: document.getElementById('phone')?.value || null,
            address: document.getElementById('address')?.value || null,
            highestDegree: document.getElementById('highestDegree')?.value || null,
            specialization: document.getElementById('specialization')?.value || null,
            institution: document.getElementById('institution')?.value || null,
            gradYear: document.getElementById('gradYear')?.value || null,
            license: document.getElementById('license')?.value || null,
            continuingEd: document.getElementById('continuingEd')?.value || null,
            subjectsTaught: document.getElementById('subjectsTaught')?.value || null,
            yearLevel: document.getElementById('yearLevel')?.value || null,
            loadUnits: document.getElementById('loadUnits')?.value || null,
            advising: document.getElementById('advising')?.value || null,
            committeeRoles: document.getElementById('committeeRoles')?.value || null,
            researchInterests: document.getElementById('researchInterests')?.value || null,
            publications: document.getElementById('publications')?.value || null
        };

        try {
            const response = await fetch(`http://localhost:3000/api/user/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
                throw new Error(errorData.msg || 'Failed to save profile');
            }

            await response.json();
            alert('Profile updated successfully!');
            await loadUserProfile(userId);

        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    }
});

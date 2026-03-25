// js/user-profile.js

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Profile JS loaded');

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        alert('Please login to view your profile.');
        window.location.href = 'landing.html';
        return;
    }

    // Edit mode state
    let isEditMode = false;
    let originalData = {};

    // Get button references FIRST before any functions use them
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const logoutBtn = document.getElementById('logoutBtn');

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
                populateProfile(originalData); // Restore original data
            }
        });
    }

    // Save profile button
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function() {
            await saveUserProfile(user.id);
        });
    }

    // Fetch user profile data from backend (AFTER button references are set)
    await loadUserProfile(user.id);

    // Auto-calculate age from DOB
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');
    
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

    // Auto-calculate years in service from date of hire
    const hireDateInput = document.getElementById('dateOfHire');
    const yearsServiceInput = document.getElementById('yearsInService');
    
    if (hireDateInput && yearsServiceInput) {
        hireDateInput.addEventListener('change', function() {
            if (this.value) {
                const hireDate = new Date(this.value);
                const today = new Date();
                let years = today.getFullYear() - hireDate.getFullYear();
                const monthDiff = today.getMonth() - hireDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hireDate.getDate())) {
                    years--;
                }
                yearsServiceInput.value = years + (years === 1 ? ' year' : ' years');
            } else {
                yearsServiceInput.value = '';
            }
        });
    }

    // Enable edit mode
    function enableEditMode() {
        isEditMode = true;
        
        // Show/hide buttons
        editProfileBtn.classList.add('hidden');
        saveProfileBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');

        // Enable all editable fields
        const editableFields = [
            'dob', 'gender', 'civilStatus', 'nationality', 'phone', 'address',
            'dateOfHire', 'previousPositions',
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
        
        // Show/hide buttons
        editProfileBtn.classList.remove('hidden');
        saveProfileBtn.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');

        // Disable all editable fields
        const editableFields = [
            'dob', 'gender', 'civilStatus', 'nationality', 'phone', 'address',
            'dateOfHire', 'previousPositions',
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
            console.log('=== Loading Profile Debug Info ===');
            console.log('User ID:', userId);
            console.log('Token exists:', !!token);
            console.log('Token value:', token?.substring(0, 20) + '...');
            console.log('API URL:', `http://localhost:3000/api/user/profile/${userId}`);
            
            const response = await fetch(`http://localhost:3000/api/user/profile/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
                console.error('Error response:', errorData);
                throw new Error(errorData.msg || 'Failed to load profile');
            }

            const profileData = await response.json();
            console.log('Profile data loaded:', profileData);
            console.log('User role:', profileData.role);
            originalData = profileData; // Store original data
            populateProfile(profileData);
            disableEditMode(); // Start in view mode

        } catch (error) {
            console.error('=== Error Details ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error:', error);
            alert('Failed to load profile data. Check console for details.');
        }
    }

    // Populate all profile fields
    function populateProfile(data) {
        // Generate initials
        const initials = (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '');
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        
        // Format role for display
        const displayRole = data.role || 'Faculty Member';
        const roleDept = `${displayRole} · ${data.department || 'N/A'}`;

        // Sidebar
        document.getElementById('sidebarInitials').textContent = initials;
        document.getElementById('sidebarName').textContent = fullName;
        document.getElementById('sidebarRole').textContent = roleDept;

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

        // Personal Information (readonly fields)
        document.getElementById('lastName').value = data.lastName || '';
        document.getElementById('firstName').value = data.firstName || '';
        document.getElementById('middleInitial').value = data.middleInitial || '';
        document.getElementById('email').value = data.email || '';

        // Personal Information (editable fields)
        if (data.dateOfBirth) document.getElementById('dob').value = data.dateOfBirth;
        if (data.age) document.getElementById('age').value = data.age;
        if (data.gender) document.getElementById('gender').value = data.gender;
        if (data.civilStatus) document.getElementById('civilStatus').value = data.civilStatus;
        if (data.nationality) document.getElementById('nationality').value = data.nationality;
        if (data.phone) document.getElementById('phone').value = data.phone;
        if (data.address) document.getElementById('address').value = data.address;

        // Employment Information (readonly fields)
        document.getElementById('employeeId').value = data.employeeId || '';
        document.getElementById('position').value = data.position || '';
        document.getElementById('department').value = data.department || '';
        document.getElementById('employmentStatus').value = data.employmentStatus || '';

        // Employment Information (editable fields)
        if (data.dateOfHire) document.getElementById('dateOfHire').value = data.dateOfHire;
        if (data.yearsInService) document.getElementById('yearsInService').value = data.yearsInService;
        if (data.previousPositions) document.getElementById('previousPositions').value = data.previousPositions;

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
        if (data.dateOfBirth && dobInput) {
            dobInput.dispatchEvent(new Event('change'));
        }

        // Trigger years in service calculation if date of hire exists
        if (data.dateOfHire && hireDateInput) {
            hireDateInput.dispatchEvent(new Event('change'));
        }
    }

    // Save user profile
    async function saveUserProfile(userId) {
        const profileData = {
            // Personal Information
            dateOfBirth: document.getElementById('dob')?.value,
            age: document.getElementById('age')?.value,
            gender: document.getElementById('gender')?.value,
            civilStatus: document.getElementById('civilStatus')?.value,
            nationality: document.getElementById('nationality')?.value,
            phone: document.getElementById('phone')?.value,
            address: document.getElementById('address')?.value,
            // Employment Information
            dateOfHire: document.getElementById('dateOfHire')?.value,
            previousPositions: document.getElementById('previousPositions')?.value,
            // Educational Background
            highestDegree: document.getElementById('highestDegree')?.value,
            specialization: document.getElementById('specialization')?.value,
            institution: document.getElementById('institution')?.value,
            gradYear: document.getElementById('gradYear')?.value,
            license: document.getElementById('license')?.value,
            continuingEd: document.getElementById('continuingEd')?.value,
            // Teaching Load
            subjectsTaught: document.getElementById('subjectsTaught')?.value,
            yearLevel: document.getElementById('yearLevel')?.value,
            loadUnits: document.getElementById('loadUnits')?.value,
            advising: document.getElementById('advising')?.value,
            committeeRoles: document.getElementById('committeeRoles')?.value,
            // Research Activities
            researchInterests: document.getElementById('researchInterests')?.value,
            publications: document.getElementById('publications')?.value
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
                throw new Error('Failed to save profile');
            }

            const result = await response.json();
            alert('Profile updated successfully!');
            
            // Reload profile and disable edit mode
            await loadUserProfile(userId);
            disableEditMode();

        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    }
});
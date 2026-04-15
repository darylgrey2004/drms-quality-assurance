// js/user-profile.js

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        alert('Please login to view your profile.');
        window.location.href = 'landing.html';
        return;
    }

    let isEditMode = false;
    let originalData = {};

    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
<<<<<<< Updated upstream
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Get input references for auto-calculation
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');
    const hireDateInput = document.getElementById('dateOfHire');
    const yearsServiceInput = document.getElementById('yearsInService');

    // Logout button handler
=======
    const cancelEditBtn  = document.getElementById('cancelEditBtn');
    const logoutBtn      = document.getElementById('logoutBtn');
    const dobInput       = document.getElementById('dob');
    const ageInput       = document.getElementById('age');

    // Hide My Approvals link for Faculty Member
    if (role === 'faculty member') {
        const approvalsLink = document.querySelector('a[href="user-approvals.html"]');
        if (approvalsLink) approvalsLink.style.display = 'none';
    }

>>>>>>> Stashed changes
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', enableEditMode);
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            if (confirm('Discard all changes?')) {
                disableEditMode();
                populateProfile(originalData);
            }
        });
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function() {
            await saveUserProfile(user.id);
        });
    }

<<<<<<< Updated upstream
    // Auto-calculate age from DOB
=======
>>>>>>> Stashed changes
    if (dobInput && ageInput) {
        dobInput.addEventListener('change', function() {
            if (this.value) {
                const birthDate = new Date(this.value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
                ageInput.value = age;
            } else {
                ageInput.value = '';
            }
        });
    }

<<<<<<< Updated upstream
    // Auto-calculate years in service from date of hire
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

    // Fetch user profile data from backend (AFTER all references are set)
=======
>>>>>>> Stashed changes
    await loadUserProfile(user.id);

    function enableEditMode() {
        isEditMode = true;
        editProfileBtn.classList.add('hidden');
        saveProfileBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');

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

    function disableEditMode() {
        isEditMode = false;
<<<<<<< Updated upstream
        
        // Show/hide buttons
=======
>>>>>>> Stashed changes
        editProfileBtn.classList.remove('hidden');
        saveProfileBtn.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');

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
            console.error('Error loading profile:', error.message);
            alert('Failed to load profile data. Check console for details.');
        }
    }

    function populateProfile(data) {
        const initials = (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '');
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        const displayRole = data.role || 'Faculty Member';
        const roleDept = `${displayRole} · ${data.department || 'N/A'}`;

        document.getElementById('sidebarInitials').textContent = initials;
        document.getElementById('sidebarName').textContent = fullName;
        document.getElementById('sidebarRole').textContent = roleDept;
        const portalLabels = {
            'faculty member': 'Faculty Portal',
            'area chair/program head': 'Area Chair Portal'
        };
        const accessLabels = {
            'faculty member': 'Faculty Access',
            'area chair/program head': 'Area Chair Access'
        };
        const portalEl = document.getElementById('sidebarPortal');
        const accessEl = document.getElementById('sidebarAccess');
        const roleKey = (data.role || '').toLowerCase().trim();
        if (portalEl) portalEl.textContent = portalLabels[roleKey] || `${data.role || 'Faculty'} Portal`;
        if (accessEl) accessEl.textContent = accessLabels[roleKey] || `${data.role || 'Faculty'} Access`;

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
        const statusClass = data.status === 'approved' ? 'bg-green-100 text-green-700'
                          : data.status === 'pending'  ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700';
        document.getElementById('accountStatus').className = statusClass + ' text-xs px-2 py-1 rounded-full';

        // Personal Information
        document.getElementById('lastName').value      = data.lastName      || '';
        document.getElementById('firstName').value     = data.firstName     || '';
        document.getElementById('middleInitial').value = data.middleInitial || '';
        document.getElementById('email').value         = data.email         || '';

<<<<<<< Updated upstream
        // Personal Information (editable fields)
        if (data.dateOfBirth) {
            // Format date for input field (YYYY-MM-DD)
            const dobDate = new Date(data.dateOfBirth);
            const formattedDOB = dobDate.toISOString().split('T')[0];
            document.getElementById('dob').value = formattedDOB;
        }
        if (data.age) document.getElementById('age').value = data.age;
        if (data.gender) document.getElementById('gender').value = data.gender;
        if (data.civilStatus) document.getElementById('civilStatus').value = data.civilStatus;
        if (data.nationality) document.getElementById('nationality').value = data.nationality;
        if (data.phone) document.getElementById('phone').value = data.phone;
        if (data.address) document.getElementById('address').value = data.address;
=======
        if (data.dateOfBirth) document.getElementById('dob').value          = data.dateOfBirth.split('T')[0];
        if (data.age)         document.getElementById('age').value          = data.age;
        if (data.gender)      document.getElementById('gender').value       = data.gender;
        if (data.civilStatus) document.getElementById('civilStatus').value  = data.civilStatus;
        if (data.nationality) document.getElementById('nationality').value  = data.nationality;
        if (data.phone)       document.getElementById('phone').value        = data.phone;
        if (data.address)     document.getElementById('address').value      = data.address;
>>>>>>> Stashed changes

        // Employment Information
        document.getElementById('employeeId').value       = data.employeeId       || '';
        document.getElementById('position').value         = data.position         || '';
        document.getElementById('department').value       = data.department       || '';
        document.getElementById('employmentStatus').value = data.employmentStatus || '';

<<<<<<< Updated upstream
        // Employment Information (editable fields)
        if (data.dateOfHire) {
            // Format date for input field (YYYY-MM-DD)
            const hireDate = new Date(data.dateOfHire);
            const formattedHireDate = hireDate.toISOString().split('T')[0];
            document.getElementById('dateOfHire').value = formattedHireDate;
        }
        if (data.yearsInService) document.getElementById('yearsInService').value = data.yearsInService;
        if (data.previousPositions) document.getElementById('previousPositions').value = data.previousPositions;

=======
>>>>>>> Stashed changes
        // Educational Background
        if (data.highestDegree)  document.getElementById('highestDegree').value  = data.highestDegree;
        if (data.specialization) document.getElementById('specialization').value = data.specialization;
        if (data.institution)    document.getElementById('institution').value    = data.institution;
        if (data.gradYear)       document.getElementById('gradYear').value       = data.gradYear;
        if (data.license)        document.getElementById('license').value        = data.license;
        if (data.continuingEd)   document.getElementById('continuingEd').value   = data.continuingEd;

        // Teaching Load
        if (data.subjectsTaught)  document.getElementById('subjectsTaught').value  = data.subjectsTaught;
        if (data.yearLevel)       document.getElementById('yearLevel').value       = data.yearLevel;
        if (data.loadUnits)       document.getElementById('loadUnits').value       = data.loadUnits;
        if (data.advising)        document.getElementById('advising').value        = data.advising;
        if (data.committeeRoles)  document.getElementById('committeeRoles').value  = data.committeeRoles;

        // Research Activities
        if (data.researchInterests) document.getElementById('researchInterests').value = data.researchInterests;
        if (data.publications)      document.getElementById('publications').value      = data.publications;

<<<<<<< Updated upstream
        // Trigger age calculation if DOB exists (use the already declared dobInput)
        if (data.dateOfBirth && dobInput && ageInput) {
            dobInput.dispatchEvent(new Event('change'));
        }

        // Trigger years in service calculation if date of hire exists (use the already declared hireDateInput)
        if (data.dateOfHire && hireDateInput && yearsServiceInput) {
            hireDateInput.dispatchEvent(new Event('change'));
        }
=======
        // Trigger age calculation if DOB exists
        if (data.dateOfBirth && dobInput) dobInput.dispatchEvent(new Event('change'));
>>>>>>> Stashed changes
    }

    async function saveUserProfile(userId) {
        const profileData = {
<<<<<<< Updated upstream
            // Personal Information
            dateOfBirth: document.getElementById('dob')?.value || null,
            age: document.getElementById('age')?.value || null,
            gender: document.getElementById('gender')?.value || null,
            civilStatus: document.getElementById('civilStatus')?.value || null,
            nationality: document.getElementById('nationality')?.value || null,
            phone: document.getElementById('phone')?.value || null,
            address: document.getElementById('address')?.value || null,
            // Employment Information
            dateOfHire: document.getElementById('dateOfHire')?.value || null,
            previousPositions: document.getElementById('previousPositions')?.value || null,
            // Educational Background
            highestDegree: document.getElementById('highestDegree')?.value || null,
            specialization: document.getElementById('specialization')?.value || null,
            institution: document.getElementById('institution')?.value || null,
            gradYear: document.getElementById('gradYear')?.value || null,
            license: document.getElementById('license')?.value || null,
            continuingEd: document.getElementById('continuingEd')?.value || null,
            // Teaching Load
            subjectsTaught: document.getElementById('subjectsTaught')?.value || null,
            yearLevel: document.getElementById('yearLevel')?.value || null,
            loadUnits: document.getElementById('loadUnits')?.value || null,
            advising: document.getElementById('advising')?.value || null,
            committeeRoles: document.getElementById('committeeRoles')?.value || null,
            // Research Activities
            researchInterests: document.getElementById('researchInterests')?.value || null,
            publications: document.getElementById('publications')?.value || null
=======
            dateOfBirth:       document.getElementById('dob')?.value          || null,
            age:               document.getElementById('age')?.value          || null,
            gender:            document.getElementById('gender')?.value       || null,
            civilStatus:       document.getElementById('civilStatus')?.value  || null,
            nationality:       document.getElementById('nationality')?.value  || null,
            phone:             document.getElementById('phone')?.value        || null,
            address:           document.getElementById('address')?.value      || null,
            highestDegree:     document.getElementById('highestDegree')?.value,
            specialization:    document.getElementById('specialization')?.value,
            institution:       document.getElementById('institution')?.value,
            gradYear:          document.getElementById('gradYear')?.value,
            license:           document.getElementById('license')?.value,
            continuingEd:      document.getElementById('continuingEd')?.value,
            subjectsTaught:    document.getElementById('subjectsTaught')?.value,
            yearLevel:         document.getElementById('yearLevel')?.value,
            loadUnits:         document.getElementById('loadUnits')?.value,
            advising:          document.getElementById('advising')?.value,
            committeeRoles:    document.getElementById('committeeRoles')?.value,
            researchInterests: document.getElementById('researchInterests')?.value,
            publications:      document.getElementById('publications')?.value
>>>>>>> Stashed changes
        };

        console.log('=== Saving Profile ===');
        console.log('Profile data to save:', profileData);
        console.log('Date of Birth value:', profileData.dateOfBirth);

        try {
            const response = await fetch(`http://localhost:3000/api/user/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(profileData)
            });

<<<<<<< Updated upstream
            console.log('Save response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
                console.error('Save error response:', errorData);
                throw new Error(errorData.msg || 'Failed to save profile');
            }

            const result = await response.json();
            console.log('Save successful:', result);
=======
            if (!response.ok) throw new Error('Failed to save profile');

>>>>>>> Stashed changes
            alert('Profile updated successfully!');
            await loadUserProfile(userId);

        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    }
});

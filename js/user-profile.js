// js/user-profile.js

document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const resolvedUserId = resolveUserId(user, token);

    if (!token || !resolvedUserId) {
        alert('Please login to view your profile.');
        window.location.href = 'landing.html';
        return;
    }

    let originalData = {};

    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');

    const editableFields = [
        'lastName', 'firstName', 'middleInitial',
        'dob', 'gender', 'civilStatus', 'nationality', 'phone', 'address',
        'employeeId', 'position', 'department', 'employmentStatus',
        'highestDegree', 'specialization', 'institution', 'gradYear', 'license', 'continuingEd',
        'subjectsTaught', 'yearLevel', 'loadUnits', 'advising', 'committeeRoles',
        'researchInterests', 'publications'
    ];

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }

    if (editProfileBtn) editProfileBtn.addEventListener('click', enableEditMode);
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', async () => saveUserProfile(resolvedUserId));
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

    function resolveUserId(userData, authToken) {
        try {
            if (authToken) {
                const base64Url = authToken.split('.')[1] || '';
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
                const payload = JSON.parse(atob(padded));
                const tokenId = Number(payload?.user?.id ?? payload?.id ?? null);
                if (Number.isFinite(tokenId) && tokenId > 0) return tokenId;
            }
        } catch (_error) {
            // Fall back to localStorage user object when token parsing fails.
        }

        const idFromStorage = Number(userData?.id ?? userData?.userId ?? userData?._id ?? null);
        if (Number.isFinite(idFromStorage) && idFromStorage > 0) {
            return idFromStorage;
        }

        return null;
    }

    // Self-heal stale/missing localStorage user id using token-derived id.
    localStorage.setItem('user', JSON.stringify({
        ...user,
        id: resolvedUserId
    }));

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
            field.classList.add('bg-white');
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
            field.classList.remove('bg-white');
            field.classList.add('bg-gray-50');
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

        document.getElementById('sidebarInitials').textContent = initials;
        document.getElementById('sidebarName').textContent = fullName;
        document.getElementById('sidebarRole').textContent = roleDept;
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

        document.getElementById('lastName').value = data.lastName || '';
        document.getElementById('firstName').value = data.firstName || '';
        document.getElementById('middleInitial').value = data.middleInitial || '';
        document.getElementById('email').value = data.email || '';

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
            firstName: document.getElementById('firstName')?.value?.trim() || null,
            lastName: document.getElementById('lastName')?.value?.trim() || null,
            middleInitial: document.getElementById('middleInitial')?.value?.trim() || null,
            dateOfBirth: document.getElementById('dob')?.value || null,
            age: document.getElementById('age')?.value || null,
            gender: document.getElementById('gender')?.value || null,
            civilStatus: document.getElementById('civilStatus')?.value || null,
            nationality: document.getElementById('nationality')?.value || null,
            phone: document.getElementById('phone')?.value || null,
            address: document.getElementById('address')?.value || null,
            employeeId: document.getElementById('employeeId')?.value || null,
            position: document.getElementById('position')?.value || null,
            department: document.getElementById('department')?.value || null,
            employmentStatus: document.getElementById('employmentStatus')?.value || null,
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
                const errorData = await response.json().catch(() => ({ msg: 'Failed to save profile' }));
                throw new Error(errorData.msg || 'Failed to save profile');
            }

            const result = await response.json().catch(() => ({}));
            if (result.user) {
                const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({
                    ...existingUser,
                    ...result.user,
                    department: profileData.department || existingUser.department
                }));
            }

            alert(result.msg || 'Profile updated successfully!');
            await loadUserProfile(userId);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert(`Failed to save profile: ${error.message}`);
        }
    }
});

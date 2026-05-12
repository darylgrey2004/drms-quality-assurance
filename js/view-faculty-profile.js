let originalProfileData = null;

const EDITOR_CONFIG = {
    profileDob: { type: 'date' },
    profileAge: { type: 'number' },
    profileGender: { type: 'select', options: ['', 'Male', 'Female', 'Prefer not to say'] },
    profileCivilStatus: { type: 'select', options: ['', 'Single', 'Married', 'Divorced', 'Widowed'] },
    profileNationality: { type: 'text' },
    profilePhone: { type: 'text' },
    profileAddress: { type: 'textarea', rows: 2 },
    profileEmployeeId: { type: 'text' },
    profilePosition: { type: 'text' },
    profileDepartment: { type: 'text' },
    profileEmploymentStatus: { type: 'text' },
    profileDateOfHire: { type: 'date' },
    profilePreviousPositions: { type: 'textarea', rows: 2 },
    profileHighestDegree: {
        type: 'select',
        options: [
            '',
            'Doctor of Philosophy (PhD)',
            'Doctor of Education (EdD)',
            "Master's Degree",
            "Bachelor's Degree",
            'Associate Degree'
        ]
    },
    profileSpecialization: { type: 'text' },
    profileInstitution: { type: 'text' },
    profileGradYear: { type: 'number' },
    profileLicense: { type: 'text' },
    profileContinuingEd: { type: 'textarea', rows: 2 }
};

const EDITABLE_IDS = Object.keys(EDITOR_CONFIG);

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = (currentUser.role || '').toString().toLowerCase().trim() === 'admin';
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (isAdmin && editProfileBtn) {
        editProfileBtn.classList.remove('hidden');
    }

    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');

    if (!userId) {
        document.body.innerHTML = '<div class="text-center p-10"><h1>Error: No User ID provided.</h1><a href="users.html" class="text-teal-600">Back to Users</a></div>';
        return;
    }

    async function loadProfile() {
        const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/admin/profile/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('You are not authorized to view this page.');
                window.location.href = 'landing.html';
                return;
            }
            throw new Error('Failed to fetch user profile.');
        }

        const profile = await response.json();
        originalProfileData = profile;
        populateProfileData(profile);
        setEditMode(false);
    }

    if (isAdmin && editProfileBtn && saveProfileBtn && cancelEditBtn) {
        editProfileBtn.addEventListener('click', () => setEditMode(true));
        cancelEditBtn.addEventListener('click', () => {
            if (originalProfileData) populateProfileData(originalProfileData);
            setEditMode(false);
        });
        saveProfileBtn.addEventListener('click', async () => {
            try {
                const payload = buildProfilePayloadFromPage();
                const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/admin/profile/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token,
                    },
                    body: JSON.stringify(payload),
                });

                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(result.msg || 'Failed to update profile.');
                }

                alert(result.msg || 'Profile updated successfully.');
                await loadProfile();
            } catch (error) {
                console.error('Error updating profile:', error);
                alert(`Failed to save profile: ${error.message}`);
            }
        });
    }

    try {
        await loadProfile();
    } catch (error) {
        console.error('Error fetching profile:', error);
        document.body.innerHTML = `<div class="text-center p-10"><h1>Error: ${error.message}</h1><a href="users.html" class="text-teal-600">Back to Users</a></div>`;
    }
});

function populateProfileData(profile) {
    // Helper to safely display data or a dash
    const display = (value) => (value === null || value === undefined || value === '' ? '&mdash;' : value);
    const pick = (...values) => values.find((value) => value !== null && value !== undefined && value !== '');
    const formatDate = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString();
    };
    const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);
    const calculateAge = (dateValue) => {
        if (!dateValue) return null;
        const dob = new Date(dateValue);
        if (Number.isNaN(dob.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
        return age >= 0 ? age : null;
    };

    const profileData = profile?.profile || profile;
    const dateOfBirth = pick(profileData.dateOfBirth, profileData.dob, profileData.date_of_birth);
    const computedAge = pick(profileData.age, calculateAge(dateOfBirth));

    // Header
    const firstName = normalizeText(pick(profileData.firstName, profileData.first_name));
    const lastName = normalizeText(pick(profileData.lastName, profileData.last_name));
    const email = normalizeText(pick(profileData.email, profileData.emailAddress));
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Unnamed User';

    document.getElementById('profileFullName').textContent = fullName;
    document.getElementById('profileEmail').textContent = email || 'No email provided';

    const setFieldValue = (id, rawValue, displayValue = rawValue) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.dataset.rawValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);
        el.innerHTML = display(displayValue);
    };

    // Personal Information
    setFieldValue('profileDob', dateOfBirth, formatDate(dateOfBirth));
    setFieldValue('profileAge', computedAge);
    setFieldValue('profileGender', pick(profileData.gender, profileData.sex));
    setFieldValue('profileCivilStatus', pick(profileData.civilStatus, profileData.civil_status));
    setFieldValue('profileNationality', profileData.nationality);
    setFieldValue('profilePhone', pick(profileData.phone, profileData.contactNumber, profileData.contact_number));
    setFieldValue('profileAddress', profileData.address);

    // Employment Information
    setFieldValue('profileEmployeeId', pick(profileData.employeeId, profileData.employee_id));
    setFieldValue('profilePosition', profileData.position);
    setFieldValue('profileDepartment', profileData.department);
    setFieldValue('profileEmploymentStatus', pick(profileData.employmentStatus, profileData.employment_status));
    const dateOfHire = pick(profileData.dateOfHire, profileData.date_of_hire);
    setFieldValue('profileDateOfHire', dateOfHire, formatDate(dateOfHire));
    setFieldValue('profilePreviousPositions', pick(profileData.previousPositions, profileData.previous_positions));

    // Educational Background
    setFieldValue('profileHighestDegree', pick(profileData.highestDegree, profileData.highest_degree));
    setFieldValue('profileSpecialization', profileData.specialization);
    setFieldValue('profileInstitution', profileData.institution);
    setFieldValue('profileGradYear', pick(profileData.gradYear, profileData.grad_year));
    setFieldValue('profileLicense', profileData.license);
    setFieldValue('profileContinuingEd', pick(profileData.continuingEd, profileData.continuing_ed));

    // Add more sections here if you expand the view-faculty-profile.html
}

function setEditMode(enabled) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = (currentUser.role || '').toString().toLowerCase().trim() === 'admin';
    if (!isAdmin) return;

    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const toDateInputValue = (value) => {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return '';
        return parsed.toISOString().split('T')[0];
    };
    const toDisplayDate = (value) => {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return '';
        return parsed.toLocaleDateString();
    };
    const createEditorControl = (id, config, field) => {
        const currentValue = field.dataset.rawValue || '';
        let control;

        if (config.type === 'select') {
            control = document.createElement('select');
            config.options.forEach((optionValue) => {
                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = optionValue || 'Select';
                control.appendChild(option);
            });
            control.value = currentValue;
        } else if (config.type === 'textarea') {
            control = document.createElement('textarea');
            control.rows = config.rows || 2;
            control.value = currentValue;
        } else {
            control = document.createElement('input');
            control.type = config.type;
            control.value = config.type === 'date' ? toDateInputValue(currentValue) : currentValue;
            if (config.type === 'number') control.step = '1';
        }

        control.className = 'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500';
        control.setAttribute('data-editor-input', id);
        return control;
    };

    EDITABLE_IDS.forEach((id) => {
        const field = document.getElementById(id);
        if (!field) return;
        if (enabled) {
            const config = EDITOR_CONFIG[id];
            const control = createEditorControl(id, config, field);
            field.innerHTML = '';
            field.appendChild(control);
            field.classList.add('editing');
        } else {
            const control = field.querySelector(`[data-editor-input="${id}"]`);
            if (control) {
                const value = control.value?.trim() || '';
                field.dataset.rawValue = value;
                if (EDITOR_CONFIG[id]?.type === 'date') {
                    field.innerHTML = value ? toDisplayDate(value) : '&mdash;';
                } else {
                    field.innerHTML = value || '&mdash;';
                }
            }
            field.classList.remove('editing');
        }
    });

    if (enabled) {
        const dobControl = document.querySelector('[data-editor-input="profileDob"]');
        const ageControl = document.querySelector('[data-editor-input="profileAge"]');
        if (dobControl && ageControl) {
            dobControl.addEventListener('change', () => {
                const dob = new Date(dobControl.value);
                if (Number.isNaN(dob.getTime())) return;
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
                ageControl.value = age >= 0 ? String(age) : '';
            });
        }
    }

    if (editProfileBtn) editProfileBtn.classList.toggle('hidden', enabled);
    if (saveProfileBtn) saveProfileBtn.classList.toggle('hidden', !enabled);
    if (cancelEditBtn) cancelEditBtn.classList.toggle('hidden', !enabled);
}

function buildProfilePayloadFromPage() {
    const getValue = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const editor = el.querySelector(`[data-editor-input="${id}"]`);
        const value = editor ? editor.value?.trim() : el.dataset.rawValue?.trim();
        if (!value || value === '—') return null;
        return value;
    };

    const toIsoDateOrNull = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString().split('T')[0];
    };

    return {
        dateOfBirth: toIsoDateOrNull(getValue('profileDob')),
        age: getValue('profileAge'),
        gender: getValue('profileGender'),
        civilStatus: getValue('profileCivilStatus'),
        nationality: getValue('profileNationality'),
        phone: getValue('profilePhone'),
        address: getValue('profileAddress'),
        employeeId: getValue('profileEmployeeId'),
        position: getValue('profilePosition'),
        department: getValue('profileDepartment'),
        employmentStatus: getValue('profileEmploymentStatus'),
        dateOfHire: toIsoDateOrNull(getValue('profileDateOfHire')),
        previousPositions: getValue('profilePreviousPositions'),
        highestDegree: getValue('profileHighestDegree'),
        specialization: getValue('profileSpecialization'),
        institution: getValue('profileInstitution'),
        gradYear: getValue('profileGradYear'),
        license: getValue('profileLicense'),
        continuingEd: getValue('profileContinuingEd'),
    };
}

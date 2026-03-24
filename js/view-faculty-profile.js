document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    // Redirect to login if not authenticated
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    // Get user ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');

    if (!userId) {
        document.body.innerHTML = '<div class="text-center p-10"><h1>Error: No User ID provided.</h1><a href="users.html" class="text-teal-600">Back to Users</a></div>';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/admin/profile/${userId}`, {
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
            }
            throw new Error('Failed to fetch user profile.');
        }

        const profile = await response.json();
        
        // Populate the page with the fetched data
        populateProfileData(profile);

    } catch (error) {
        console.error('Error fetching profile:', error);
        document.body.innerHTML = `<div class="text-center p-10"><h1>Error: ${error.message}</h1><a href="users.html" class="text-teal-600">Back to Users</a></div>`;
    }
});

function populateProfileData(profile) {
    // Helper to safely display data or a dash
    const display = (value) => value || '&mdash;';

    // Header
    document.getElementById('profileFullName').textContent = `${profile.firstName} ${profile.lastName}`;
    document.getElementById('profileEmail').textContent = profile.email;

    // Personal Information
    document.getElementById('profileDob').innerHTML = display(profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : null);
    document.getElementById('profileAge').innerHTML = display(profile.age);
    document.getElementById('profileGender').innerHTML = display(profile.gender);
    document.getElementById('profileCivilStatus').innerHTML = display(profile.civilStatus);
    document.getElementById('profileNationality').innerHTML = display(profile.nationality);
    document.getElementById('profilePhone').innerHTML = display(profile.phone);
    document.getElementById('profileAddress').innerHTML = display(profile.address);

    // Employment Information
    document.getElementById('profileEmployeeId').innerHTML = display(profile.employeeId);
    document.getElementById('profilePosition').innerHTML = display(profile.position);
    document.getElementById('profileDepartment').innerHTML = display(profile.department);
    document.getElementById('profileEmploymentStatus').innerHTML = display(profile.employmentStatus);
    document.getElementById('profileDateOfHire').innerHTML = display(profile.dateOfHire ? new Date(profile.dateOfHire).toLocaleDateString() : null);
    document.getElementById('profilePreviousPositions').innerHTML = display(profile.previousPositions);

    // Educational Background
    document.getElementById('profileHighestDegree').innerHTML = display(profile.highestDegree);
    document.getElementById('profileSpecialization').innerHTML = display(profile.specialization);
    document.getElementById('profileInstitution').innerHTML = display(profile.institution);
    document.getElementById('profileGradYear').innerHTML = display(profile.gradYear);
    document.getElementById('profileLicense').innerHTML = display(profile.license);
    document.getElementById('profileContinuingEd').innerHTML = display(profile.continuingEd);

    // Add more sections here if you expand the view-faculty-profile.html
}

// js/faculty-profile-form.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Faculty Profile Form loaded');
    
    // Get registration data from localStorage
    const registrationDataString = localStorage.getItem('registrationData');
    
    if (!registrationDataString) {
        alert('Registration session expired. Please start over.');
        window.location.href = 'registration.html';
        return;
    }
    
    const registrationData = JSON.parse(registrationDataString);
    
    // Form submission
    const form = document.getElementById('facultyProfileForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Collect only the 4 required employment fields
            const employeeId = document.getElementById('employeeId')?.value.trim();
            const position = document.getElementById('position')?.value;
            const department = document.getElementById('department')?.value.trim();
            const employmentStatus = document.getElementById('employmentStatus')?.value;

            // Validate all 4 fields are filled
            if (!employeeId || !position || !department || !employmentStatus) {
                alert('Please fill in all required employment fields.');
                return;
            }

            // Combine registration data with employment data
            const finalPayload = {
                // From registration
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                middleInitial: registrationData.middleInitial || '',
                email: registrationData.email,
                password: registrationData.password,
                role: registrationData.role,
                // Employment information
                employeeId: employeeId,
                position: position,
                department: department,
                employmentStatus: employmentStatus
            };

            // Send to backend
            try {
                const response = await fetch('http://localhost:3000/api/profile/faculty', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(finalPayload),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.msg || 'An unknown error occurred during profile setup.');
                }

                // Success - Clear localStorage and redirect
                localStorage.removeItem('registrationData');
                alert(data.msg || 'Registration complete! Your account is pending approval.');
                window.location.href = 'landing.html';

            } catch (error) {
                console.error('Profile setup failed:', error.message);
                alert(`Profile setup failed: ${error.message}`);
            }
        });
    }
});
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
    
    // Pre-fill full name field
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput && registrationData.firstName && registrationData.lastName) {
        const fullName = `${registrationData.lastName}, ${registrationData.firstName}${registrationData.middleName ? ' ' + registrationData.middleName : ''}`;
        fullNameInput.value = fullName;
    }
    
    // Auto-calculate age from date of birth
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
    
    // Form submission
    const form = document.getElementById('facultyProfileForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // --- Step 2: Collect all form data into a flat structure ---
            const registrationDataString = localStorage.getItem('registrationData');
            if (!registrationDataString) {
                alert('Registration session expired. Please start over.');
                window.location.href = 'registration.html';
                return;
            }
            const registrationData = JSON.parse(registrationDataString);

            const profileData = {
                dateOfBirth: document.getElementById('dob')?.value,
                age: document.getElementById('age')?.value,
                gender: document.getElementById('gender')?.value,
                civilStatus: document.getElementById('civilStatus')?.value,
                nationality: document.getElementById('nationality')?.value,
                phone: document.getElementById('phone')?.value,
                address: document.getElementById('address')?.value,
                employeeId: document.getElementById('employeeId')?.value,
                position: document.getElementById('position')?.value,
                department: document.getElementById('department')?.value,
                employmentStatus: document.getElementById('employmentStatus')?.value,
                dateOfHire: document.getElementById('dateOfHire')?.value,
                previousPositions: document.getElementById('previousPositions')?.value,
                highestDegree: document.getElementById('highestDegree')?.value,
                specialization: document.getElementById('specialization')?.value,
                institution: document.getElementById('institution')?.value,
                gradYear: document.getElementById('gradYear')?.value,
                license: document.getElementById('license')?.value,
                continuingEd: document.getElementById('continuingEd')?.value,
                subjectsTaught: document.getElementById('subjectsTaught')?.value,
                yearLevel: document.getElementById('yearLevel')?.value,
                loadUnits: document.getElementById('loadUnits')?.value,
                advising: document.getElementById('advising')?.value,
                committeeRoles: document.getElementById('committeeRoles')?.value,
                researchInterests: document.getElementById('researchInterests')?.value,
                publications: document.getElementById('publications')?.value,
            };

            // --- Step 3: Combine registration and profile data ---
            const finalPayload = { ...registrationData, ...profileData };

            // --- Step 4: Send to the backend ---
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

                // --- Step 5: Success - Clear localStorage and redirect ---
                localStorage.removeItem('registrationData');
                localStorage.removeItem('facultyProfileDraft'); // Also clear the draft
                alert(data.msg); // Show success message (e.g., "pending approval")
                window.location.href = 'landing.html'; // Redirect to login page

            } catch (error) {
                console.error('Profile setup failed:', error.message);
                alert(`Profile setup failed: ${error.message}`);
            }
        });
    }
    
    // Save Draft button
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function() {
            // Collect form data and save to localStorage
            const draftData = {};
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.id) {
                    draftData[input.id] = input.value;
                }
            });
            localStorage.setItem('facultyProfileDraft', JSON.stringify(draftData));
            alert('Profile saved as draft. You can continue later.');
        });
        
        // Load draft if exists
        const savedDraft = localStorage.getItem('facultyProfileDraft');
        if (savedDraft) {
            const draftData = JSON.parse(savedDraft);
            Object.keys(draftData).forEach(id => {
                const element = document.getElementById(id);
                if (element && element.value !== draftData[id]) {
                    element.value = draftData[id];
                }
            });
            console.log('Draft loaded');
        }
    }
});
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
    
    // Auto-fill department if it exists in registration data
    if (registrationData.department) {
        const departmentInput = document.getElementById('department');
        if (departmentInput) {
            // Store the CODE only (e.g., "BEED") - don't convert to full name
            departmentInput.value = registrationData.department;
            console.log('Auto-filled department code:', registrationData.department);
        }
    }
    
    // Employee ID - only allow numbers
    const employeeIdInput = document.getElementById('employeeId');
    if (employeeIdInput) {
        employeeIdInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Form submission
    const form = document.getElementById('facultyProfileForm');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Handle cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel? You will lose your registration progress.')) {
                localStorage.removeItem('registrationData');
                window.location.href = 'registration.html';
            }
        });
    }
    
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

            // Validate employee ID is numeric
            if (!/^\d{1,6}$/.test(employeeId)) {
                alert('Employee ID must be numeric (1-6 digits).');
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

            // Disable submit button during processing
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            // Send to backend
            try {
                console.log('Sending faculty profile data to backend:', finalPayload);
                const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/profile/faculty`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(finalPayload),
                });

                console.log('Response status:', response.status);
                const contentType = response.headers.get('content-type') || '';
                const isJson = contentType.includes('application/json');
                const data = isJson ? await response.json() : { msg: await response.text() };

                console.log('Response data:', data);
                if (!response.ok) {
                    throw new Error(data.msg || `Server error: ${response.status}`);
                }

                // Success - Clear localStorage and redirect
                localStorage.removeItem('registrationData');
                alert(data.msg || 'Registration complete! Please log in and verify your WMSU email via OTP to activate your account.');
                window.location.href = 'landing.html';

            } catch (error) {
                console.error('Profile setup failed:', error);
                alert(`Profile setup failed: ${error.message}`);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});
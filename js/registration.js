// js/registration.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Registration page loaded');
    
    const form = document.getElementById('registrationForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const role = document.getElementById('role').value;
            
            // Validate
            if (!fullName || !email || !role) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Parse name into components
            const nameParts = parseFullName(fullName);
            
            // Store registration data in sessionStorage for the next page
            const registrationData = {
                fullName: fullName,
                firstName: nameParts.firstName,
                lastName: nameParts.lastName,
                middleName: nameParts.middleName,
                email: email,
                role: role
            };
            
            sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
            
            // Redirect to faculty profile form
            window.location.href = 'faculty-profile-form.html';
        });
    }
    
    // Helper function to parse full name
    function parseFullName(fullName) {
        // Expected format: "Last, First Middle" or "First Middle Last"
        let lastName = '', firstName = '', middleName = '';
        
        if (fullName.includes(',')) {
            // Format: "Last, First Middle"
            const parts = fullName.split(',');
            lastName = parts[0].trim();
            const firstParts = parts[1]?.trim().split(' ') || [];
            firstName = firstParts[0] || '';
            middleName = firstParts.slice(1).join(' ') || '';
        } else {
            // Format: "First Middle Last"
            const parts = fullName.trim().split(' ');
            if (parts.length >= 2) {
                firstName = parts[0];
                lastName = parts[parts.length - 1];
                middleName = parts.slice(1, -1).join(' ');
            } else {
                firstName = fullName;
            }
        }
        
        return { firstName, lastName, middleName };
    }
});
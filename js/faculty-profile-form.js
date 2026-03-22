// js/faculty-profile-form.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Faculty Profile Form loaded');
    
    // Get registration data from sessionStorage
    const registrationData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');
    
    // Pre-fill fields with registration data
    if (registrationData.fullName) {
        const fullNameInput = document.getElementById('fullName');
        if (fullNameInput) {
            fullNameInput.value = registrationData.fullName;
        }
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
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect all form data
            const formData = {
                registrationData: registrationData,
                personalInfo: {
                    fullName: document.getElementById('fullName')?.value,
                    dob: document.getElementById('dob')?.value,
                    age: document.getElementById('age')?.value,
                    gender: document.getElementById('gender')?.value,
                    civilStatus: document.getElementById('civilStatus')?.value,
                    nationality: document.getElementById('nationality')?.value,
                    phone: document.getElementById('phone')?.value,
                    address: document.getElementById('address')?.value
                },
                employmentInfo: {
                    employeeId: document.getElementById('employeeId')?.value,
                    position: document.getElementById('position')?.value,
                    department: document.getElementById('department')?.value,
                    employmentStatus: document.getElementById('employmentStatus')?.value,
                    dateOfHire: document.getElementById('dateOfHire')?.value,
                    yearsInService: document.getElementById('yearsInService')?.value,
                    previousPositions: document.getElementById('previousPositions')?.value
                },
                educationInfo: {
                    highestDegree: document.getElementById('highestDegree')?.value,
                    specialization: document.getElementById('specialization')?.value,
                    institution: document.getElementById('institution')?.value,
                    gradYear: document.getElementById('gradYear')?.value,
                    license: document.getElementById('license')?.value,
                    continuingEd: document.getElementById('continuingEd')?.value
                },
                teachingInfo: {
                    subjectsTaught: document.getElementById('subjectsTaught')?.value,
                    yearLevel: document.getElementById('yearLevel')?.value,
                    loadUnits: document.getElementById('loadUnits')?.value,
                    advising: document.getElementById('advising')?.value,
                    committeeRoles: document.getElementById('committeeRoles')?.value
                },
                researchInfo: {
                    researchInterests: document.getElementById('researchInterests')?.value,
                    publications: document.getElementById('publications')?.value,
                    ongoingResearch: document.getElementById('ongoingResearch')?.value,
                    researchGrants: document.getElementById('researchGrants')?.value
                },
                extensionInfo: {
                    extension: document.getElementById('extension')?.value,
                    trainings: document.getElementById('trainings')?.value,
                    organizations: document.getElementById('organizations')?.value
                },
                awardsInfo: {
                    teachingAwards: document.getElementById('teachingAwards')?.value,
                    researchAwards: document.getElementById('researchAwards')?.value,
                    serviceAwards: document.getElementById('serviceAwards')?.value
                }
            };
            
            // Show success message (in real app, this would be sent to server)
            console.log('Profile submitted:', formData);
            
            alert('✅ Profile submitted successfully!\n\nYour faculty profile has been recorded. The QA Coordinator will review your information.\n\nYou will be redirected to your dashboard.');
            
            // Redirect based on role
            const role = registrationData.role || 'faculty';
            switch(role) {
                case 'faculty':
                    window.location.href = 'user-dashboard.html';
                    break;
                case 'area-chair':
                    window.location.href = 'user-dashboard.html';
                    break;
                case 'dean':
                    window.location.href = 'homepage.html';
                    break;
                case 'qa-coordinator':
                    window.location.href = 'homepage.html';
                    break;
                case 'evaluator':
                    window.location.href = 'evaluator-dashboard.html';
                    break;
                default:
                    window.location.href = 'user-dashboard.html';
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
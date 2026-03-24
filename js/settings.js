// js/settings.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page JS loaded successfully');
    
    // DOM elements
    const tabLinks = document.querySelectorAll('#settingsTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Save buttons
    const saveGeneral = document.getElementById('saveGeneral');
    const saveWorkflow = document.getElementById('saveWorkflow');
    const saveStandards = document.getElementById('saveStandards');
    const saveNotifications = document.getElementById('saveNotifications');
    const saveBackup = document.getElementById('saveBackup');
    const saveApi = document.getElementById('saveApi');
    
    // Other buttons
    const backupNowBtn = document.getElementById('backupNowBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Tab switching functionality
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get tab id
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab styling
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });
            
            // Show selected tab
            const activeTab = document.getElementById(tabId + 'Tab');
            if (activeTab) {
                activeTab.classList.remove('hidden');
                activeTab.classList.add('block');
            }
        });
    }); // ✅ Fixed: was missing this closing );

    // Logout button functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear the user's token from local storage
            localStorage.removeItem('token');
            
            // Redirect to the login page
            window.location.href = 'landing.html';
        });
    }
    
    // Save General Settings
    if (saveGeneral) {
        saveGeneral.addEventListener('click', function() {
            const systemName = document.getElementById('systemName')?.value || 'DRMS-QA';
            const institutionName = document.getElementById('institutionName')?.value || 'College of Teacher Education';
            const systemEmail = document.getElementById('systemEmail')?.value || 'qa@cte.edu';
            const timezone = document.getElementById('timezone')?.value || 'Asia/Manila';
            const dateFormat = document.getElementById('dateFormat')?.value || 'Y-m-d';
            const language = document.getElementById('language')?.value || 'en';
            const maintenanceMode = document.getElementById('maintenanceMode')?.checked || false;
            const debugMode = document.getElementById('debugMode')?.checked || false;
            
            console.log('Saving general settings:', {
                systemName,
                institutionName,
                systemEmail,
                timezone,
                dateFormat,
                language,
                maintenanceMode,
                debugMode
            });
            
            alert('General settings saved successfully!');
        });
    }
    
    // Save Workflow Settings
    if (saveWorkflow) {
        saveWorkflow.addEventListener('click', function() {
            const workflowType = document.querySelector('input[name="workflowType"]:checked')?.value || 'standard';
            const autoApproveAdmin = document.getElementById('autoApproveAdmin')?.checked || false;
            const autoApproveDean = document.getElementById('autoApproveDean')?.checked || false;
            const autoApproveQA = document.getElementById('autoApproveQA')?.checked || false;
            const slaValidation = document.getElementById('slaValidation')?.value || 48;
            const slaApproval = document.getElementById('slaApproval')?.value || 72;
            const reminderDue = document.getElementById('reminderDue')?.checked || false;
            const reminderOverdue = document.getElementById('reminderOverdue')?.checked || false;
            const reminderDaily = document.getElementById('reminderDaily')?.checked || false;
            const maxVersions = document.getElementById('maxVersions')?.value || 10;
            
            console.log('Saving workflow settings:', {
                workflowType,
                autoApproveAdmin,
                autoApproveDean,
                autoApproveQA,
                slaValidation,
                slaApproval,
                reminderDue,
                reminderOverdue,
                reminderDaily,
                maxVersions
            });
            
            alert('Workflow settings saved successfully!');
        });
    }
    
    // Save Standards Settings
    if (saveStandards) {
        saveStandards.addEventListener('click', function() {
            alert('Standards configuration saved successfully!');
        });
    }
    
    // Save Notifications Settings
    if (saveNotifications) {
        saveNotifications.addEventListener('click', function() {
            alert('Notification settings saved successfully!');
        });
    }
    
    // Save Backup & Security Settings
    if (saveBackup) {
        saveBackup.addEventListener('click', function() {
            alert('Backup & security settings saved successfully!');
        });
    }
    
    // Save API Settings
    if (saveApi) {
        saveApi.addEventListener('click', function() {
            alert('API & integration settings saved successfully!');
        });
    }
    
    // Backup Now button
    if (backupNowBtn) {
        backupNowBtn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = 'Creating backup...';
            this.disabled = true;
            
            setTimeout(() => {
                alert('Backup created successfully!\n\nLocation: /backups/drms-qa-20260227-0300.sql\nSize: 156 MB');
                this.innerHTML = originalText;
                this.disabled = false;
            }, 2000);
        });
    }
    
    // Cancel buttons (all of them)
    const cancelButtons = document.querySelectorAll('.border.border-gray-300.rounded-lg.text-gray-700');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Discard unsaved changes?')) {
                // In a real system, this would revert to saved values
                alert('Changes discarded.');
            }
        });
    });
    
    // Regenerate API key buttons
    const regenerateButtons = document.querySelectorAll('.text-teal-600.hover\\:text-teal-800');
    regenerateButtons.forEach(btn => {
        if (btn.textContent === 'Regenerate') {
            btn.addEventListener('click', function() {
                if (confirm('Regenerate API key? This will invalidate the existing key.')) {
                    alert('New API key generated. Please update your integrations.');
                }
            });
        }
    });
    
    // Connect integration buttons
    const connectButtons = document.querySelectorAll('.border-teal-600.text-teal-700');
    connectButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const integration = this.closest('.bg-gray-50')?.querySelector('.font-medium')?.textContent || 'Integration';
            alert(`Connecting to ${integration}...\n\nThis would open OAuth flow for authentication.`);
        });
    });
    
    // Add webhook button
    const addWebhookBtn = document.querySelector('.bg-teal-700.text-white.rounded-lg');
    if (addWebhookBtn && addWebhookBtn.textContent === 'Add') {
        addWebhookBtn.addEventListener('click', function() {
            const webhookUrl = document.querySelector('input[type="url"]')?.value;
            if (!webhookUrl) {
                alert('Please enter a webhook URL');
                return;
            }
            alert(`Webhook added: ${webhookUrl}`);
        });
    }
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'settings.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            // Remove active class from all
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            // Add active class to current
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1a4450';
        }
    });
});
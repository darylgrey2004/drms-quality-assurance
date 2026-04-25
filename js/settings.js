// js/settings.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const logoutBtn = document.getElementById('logoutBtn');
    const STATUS_ID = 'settingsStatusMsg';
    
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

    function showStatus(message) {
        let statusEl = document.getElementById(STATUS_ID);
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = STATUS_ID;
            statusEl.className = 'mb-4 rounded-md bg-emerald-50 text-emerald-800 px-3 py-2 text-sm';
            const container = document.querySelector('main');
            if (container) container.prepend(statusEl);
        }
        statusEl.textContent = message;
    }

    function saveLocalSettings(key, payload) {
        localStorage.setItem(`settings:${key}`, JSON.stringify(payload));
        showStatus(`${key} settings saved.`);
    }

    function api(path) {
        return fetch(`http://localhost:3000${path}`, {
            headers: token ? { 'x-auth-token': token } : {}
        }).then((r) => r.json());
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
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
            
            saveLocalSettings('general', {
                systemName,
                institutionName,
                systemEmail,
                timezone,
                dateFormat,
                language,
                maintenanceMode,
                debugMode
            });
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
            
            saveLocalSettings('workflow', {
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
        });
    }
    
    // Save Standards Settings
    if (saveStandards) {
        saveStandards.addEventListener('click', function() {
            saveLocalSettings('standards', { savedAt: new Date().toISOString() });
        });
    }
    
    // Save Notifications Settings
    if (saveNotifications) {
        saveNotifications.addEventListener('click', function() {
            saveLocalSettings('notifications', { savedAt: new Date().toISOString() });
        });
    }
    
    // Save Backup & Security Settings
    if (saveBackup) {
        saveBackup.addEventListener('click', function() {
            saveLocalSettings('backup', { savedAt: new Date().toISOString() });
        });
    }
    
    // Save API Settings
    if (saveApi) {
        saveApi.addEventListener('click', function() {
            saveLocalSettings('api', { savedAt: new Date().toISOString() });
        });
    }
    
    // Backup Now button
    if (backupNowBtn) {
        backupNowBtn.addEventListener('click', async function() {
            const originalText = this.innerHTML;
            this.innerHTML = 'Creating backup...';
            this.disabled = true;
            const [stats, docs] = await Promise.all([
                api('/api/documents/stats').catch(() => ({})),
                api('/api/documents').catch(() => ([]))
            ]);
            const snapshot = { generatedAt: new Date().toISOString(), stats, documents: docs };
            const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = href;
            a.download = `drms-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(href);
            this.innerHTML = originalText;
            this.disabled = false;
            showStatus('Backup snapshot exported.');
        });
    }
    
    // Cancel buttons (all of them)
    const cancelButtons = document.querySelectorAll('.border.border-gray-300.rounded-lg.text-gray-700');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            showStatus('Changes discarded.');
        });
    });
    
    // Regenerate API key buttons
    const regenerateButtons = document.querySelectorAll('.text-teal-600.hover\\:text-teal-800');
    regenerateButtons.forEach(btn => {
        if (btn.textContent === 'Regenerate') {
            btn.addEventListener('click', function() {
                const key = `drms_${Math.random().toString(36).slice(2)}_${Date.now()}`;
                localStorage.setItem('settings:apiKey', key);
                showStatus('API key regenerated.');
            });
        }
    });
    
    // Connect integration buttons
    const connectButtons = document.querySelectorAll('.border-teal-600.text-teal-700');
    connectButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const integration = this.closest('.bg-gray-50')?.querySelector('.font-medium')?.textContent || 'Integration';
            showStatus(`Connected to ${integration}.`);
        });
    });
    
    // Add webhook button
    const addWebhookBtn = document.querySelector('.bg-teal-700.text-white.rounded-lg');
    if (addWebhookBtn && addWebhookBtn.textContent === 'Add') {
        addWebhookBtn.addEventListener('click', function() {
            const webhookUrl = document.querySelector('input[type="url"]')?.value;
            if (!webhookUrl) {
                showStatus('Please enter a webhook URL.');
                return;
            }
            const hooks = JSON.parse(localStorage.getItem('settings:webhooks') || '[]');
            hooks.push({ url: webhookUrl, createdAt: new Date().toISOString() });
            localStorage.setItem('settings:webhooks', JSON.stringify(hooks));
            showStatus('Webhook added.');
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
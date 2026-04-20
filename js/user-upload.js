// js/user-upload.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('User Upload JS loaded');

    // ── Sidebar: load user info + logout + heartbeat ──
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) { window.location.href = 'landing.html'; return; }
    const role = (user.role || '').toLowerCase().trim();
    const initials = (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
    const el = (id) => document.getElementById(id);
    if (el('sidebarInitials')) el('sidebarInitials').textContent = initials;
    if (el('sidebarName')) el('sidebarName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (el('sidebarRole')) el('sidebarRole').textContent = user.role || 'Faculty Member';
    const portalLabels = {
        'faculty member': 'Faculty Portal',
        'area chair/program head': 'Area Chair Portal'
    };
    if (el('sidebarPortal')) el('sidebarPortal').textContent = portalLabels[role] || `${user.role} Portal`;
    const accessLabels = { 'faculty member': 'Faculty Access', 'area chair/program head': 'Area Chair Access' };
    if (el('sidebarAccess')) el('sidebarAccess').textContent = accessLabels[role] || `${user.role} Access`;
    fetch(`http://localhost:3000/api/user/profile/${user.id}`, {
        headers: { 'x-auth-token': token }
    }).then(r => r.json()).then(data => {
        if (el('sidebarRole')) {
            const dept = data.department ? ` · ${data.department}` : '';
            el('sidebarRole').textContent = `${data.role || user.role || 'Faculty Member'}${dept}`;
        }
    }).catch(() => {});
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);
    if (role === 'faculty member') {
        const approvalsLink = document.querySelector('a[href="user-approvals.html"]');
        if (approvalsLink) approvalsLink.style.display = 'none';
    }
    // ─────────────────────────────────────────────────

    // DOM elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');
    const uploadProgressBar = document.getElementById('uploadProgressBar');
    const uploadStatusText = document.getElementById('uploadStatusText');
    const uploadPercentText = document.getElementById('uploadPercentText');
    const categorySelect = document.getElementById('category');
    const areaSelect = document.getElementById('area');
    const uploadForm = document.getElementById('uploadForm');
    const cancelBtn = document.querySelector('.border.border-gray-300');
    const uploadLoadingOverlay = document.getElementById('uploadLoadingOverlay');
    const uploadSuccessModal = document.getElementById('uploadSuccessModal');
    const uploadSuccessBackdrop = document.getElementById('uploadSuccessBackdrop');
    const closeUploadSuccessBtn = document.getElementById('closeUploadSuccessBtn');
    const STORAGE_KEY = 'userUploadedDocuments';
    let progressTimer = null;

    // Area options
    const areaOptions = {
        iso: [
            { value: 'clause4', label: 'Clause 4 - Context of the Organization' },
            { value: 'clause5', label: 'Clause 5 - Leadership' },
            { value: 'clause6', label: 'Clause 6 - Planning' },
            { value: 'clause7', label: 'Clause 7 - Support' },
            { value: 'clause8', label: 'Clause 8 - Operation' },
            { value: 'clause9', label: 'Clause 9 - Performance Evaluation' },
            { value: 'clause10', label: 'Clause 10 - Improvement' }
        ],
        aaccup: [
            { value: 'area1', label: 'Area I - Vision, Mission, Goals' },
            { value: 'area2', label: 'Area II - Faculty' },
            { value: 'area3', label: 'Area III - Curriculum' },
            { value: 'area4', label: 'Area IV - Students' },
            { value: 'area5', label: 'Area V - Research' },
            { value: 'area6', label: 'Area VI - Extension' },
            { value: 'area7', label: 'Area VII - Library' },
            { value: 'area8', label: 'Area VIII - Facilities' },
            { value: 'area9', label: 'Area IX - Laboratories' },
            { value: 'area10', label: 'Area X - Administration' }
        ],
        coe: [
            { value: 'indicator1', label: 'Indicator 1 - Quality of Teaching' },
            { value: 'indicator2', label: 'Indicator 2 - Research Output' },
            { value: 'indicator3', label: 'Indicator 3 - Extension Services' },
            { value: 'indicator4', label: 'Indicator 4 - Curriculum Development' },
            { value: 'indicator5', label: 'Indicator 5 - Faculty Development' },
            { value: 'indicator6', label: 'Indicator 6 - Student Performance' },
            { value: 'indicator7', label: 'Indicator 7 - International Linkages' }
        ]
    };

    // Update area dropdown
    if (categorySelect && areaSelect) {
        categorySelect.addEventListener('change', function() {
            const category = this.value;
            areaSelect.innerHTML = '';

            if (!category) {
                areaSelect.innerHTML = '<option value="">Select category first</option>';
                return;
            }

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select area / clause';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            areaSelect.appendChild(defaultOption);

            const options = areaOptions[category] || [];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                areaSelect.appendChild(option);
            });
        });
    }

    // File drop zone
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-teal-500', 'bg-teal-50');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-teal-500', 'bg-teal-50');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-teal-500', 'bg-teal-50');
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                updateFileInfo(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', function() {
            if (this.files.length) updateFileInfo(this.files[0]);
        });
    }

    function updateFileInfo(file) {
        if (!fileInfo || !fileName || !fileSize) return;
        
        fileName.textContent = file.name;
        const size = file.size;
        if (size < 1024) fileSize.textContent = `(${size} B)`;
        else if (size < 1024 * 1024) fileSize.textContent = `(${(size / 1024).toFixed(1)} KB)`;
        else fileSize.textContent = `(${(size / (1024 * 1024)).toFixed(1)} MB)`;
        
        fileInfo.classList.remove('hidden');
        dropZone.classList.add('border-teal-500', 'bg-teal-50');
        resetProgressUI();
    }

    function resetProgressUI() {
        if (uploadProgressBar) uploadProgressBar.style.width = '0%';
        if (uploadStatusText) uploadStatusText.textContent = 'Ready to upload';
        if (uploadPercentText) uploadPercentText.textContent = '0%';
    }

    function updateProgressUI(percent, statusText) {
        const clamped = Math.max(0, Math.min(100, percent));
        if (uploadProgressBar) uploadProgressBar.style.width = `${clamped}%`;
        if (uploadPercentText) uploadPercentText.textContent = `${Math.round(clamped)}%`;
        if (uploadStatusText) uploadStatusText.textContent = statusText;
    }

    function showUploadSuccessModal() {
        if (!uploadSuccessModal) return;
        uploadSuccessModal.classList.remove('hidden');
    }

    function hideUploadSuccessModal() {
        if (!uploadSuccessModal) return;
        uploadSuccessModal.classList.add('hidden');
    }

    if (closeUploadSuccessBtn) closeUploadSuccessBtn.addEventListener('click', hideUploadSuccessModal);
    if (uploadSuccessBackdrop) uploadSuccessBackdrop.addEventListener('click', hideUploadSuccessModal);

    if (removeFile) {
        removeFile.addEventListener('click', () => {
            if (progressTimer) {
                clearInterval(progressTimer);
                progressTimer = null;
            }
            fileInput.value = '';
            fileInfo.classList.add('hidden');
            dropZone.classList.remove('border-teal-500', 'bg-teal-50');
            resetProgressUI();
        });
    }

    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('docTitle')?.value;
            const category = document.getElementById('category')?.value;
            const area = document.getElementById('area')?.value;
            const version = document.getElementById('version')?.value || 'v1.0';
            const description = document.getElementById('description')?.value || '';
            const submitOption = document.querySelector('input[name="submitOption"]:checked')?.value || 'submit';
            const file = fileInput?.files[0];

            if (!file) {
                alert('Please select a file');
                return;
            }
            if (!title || !category || !area) {
                alert('Please fill in all required fields');
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="mr-2">⏳</span> Uploading...';
            submitBtn.disabled = true;
            if (uploadLoadingOverlay) uploadLoadingOverlay.classList.remove('hidden');
            updateProgressUI(3, 'Preparing upload...');

            if (progressTimer) clearInterval(progressTimer);
            let progress = 3;
            progressTimer = setInterval(() => {
                if (progress >= 92) return;
                progress += Math.random() * 12;
                updateProgressUI(progress, 'Uploading...');
            }, 180);

            setTimeout(() => {
                if (progressTimer) {
                    clearInterval(progressTimer);
                    progressTimer = null;
                }
                updateProgressUI(100, 'Upload completed');
                const uploadDate = new Date().toISOString();
                const currentUserId = String(user.id || '');
                const categoryLabelMap = { iso: 'ISO', aaccup: 'AACCUP', coe: 'COE' };
                const statusLabel = submitOption === 'draft' ? 'Draft' : 'Pending';
                const statusClass = submitOption === 'draft'
                    ? 'bg-gray-100 text-gray-700'
                    : 'badge-pending';
                const storedDocs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                storedDocs.unshift({
                    id: Date.now(),
                    ownerId: currentUserId,
                    title,
                    category,
                    categoryLabel: categoryLabelMap[category] || String(category || '').toUpperCase(),
                    area,
                    status: statusLabel,
                    statusClass,
                    version,
                    description,
                    fileName: file.name,
                    fileSize: file.size,
                    uploadedAt: uploadDate
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(storedDocs));

                showUploadSuccessModal();
                uploadForm.reset();
                if (fileInfo) fileInfo.classList.add('hidden');
                if (dropZone) dropZone.classList.remove('border-teal-500', 'bg-teal-50');
                if (areaSelect) areaSelect.innerHTML = '<option value="">Select category first</option>';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                if (uploadLoadingOverlay) uploadLoadingOverlay.classList.add('hidden');
                resetProgressUI();
            }, 1500);
        });
    }

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Discard upload?')) window.location.href = 'user-dashboard.html';
        });
    }
});
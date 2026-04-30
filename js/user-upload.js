// js/user-upload.js

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Upload JS loaded');

    // Initialize user session (handled by user-session.js)
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    const API_BASE = 'http://localhost:3000';

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
    const departmentInput = document.getElementById('department');
    const authorInput = document.getElementById('author');
    const validateOption = document.getElementById('validateImmediatelyOption');
    const uploadForm = document.getElementById('uploadForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const uploadLoadingOverlay = document.getElementById('uploadLoadingOverlay');
    const uploadSuccessModal = document.getElementById('uploadSuccessModal');
    const uploadSuccessBackdrop = document.getElementById('uploadSuccessBackdrop');
    const closeUploadSuccessBtn = document.getElementById('closeUploadSuccessBtn');
    const uploadErrorModal = document.getElementById('uploadErrorModal');
    const uploadErrorMessage = document.getElementById('uploadErrorMessage');
    const closeUploadErrorBtn = document.getElementById('closeUploadErrorBtn');

    function showErrorModal(msg) {
        if (!uploadErrorModal || !uploadErrorMessage) { alert(msg); return; }
        uploadErrorMessage.textContent = msg;
        uploadErrorModal.classList.remove('hidden');
        uploadErrorModal.classList.add('flex');
    }

    function hideErrorModal() {
        if (!uploadErrorModal) return;
        uploadErrorModal.classList.add('hidden');
        uploadErrorModal.classList.remove('flex');
    }

    if (closeUploadErrorBtn) closeUploadErrorBtn.addEventListener('click', hideErrorModal);

    // Load categories and departments
    loadCategories();
    autoFillUserData();

    function loadCategories() {
        fetch(`${API_BASE}/api/documents/categories`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(categories => {
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select category</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;  // Use numeric ID
                    option.textContent = cat.display_name || cat.name;
                    categorySelect.appendChild(option);
                });
            }
        })
        .catch(err => console.error('Load categories error:', err));
    }

    function autoFillUserData() {
        // Auto-fill author name (read-only)
        if (authorInput && user) {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            authorInput.value = fullName || user.username || 'User';
        }
        
        // Fetch and auto-fill department from database
        if (departmentInput) {
            fetch(`${API_BASE}/api/documents/user/department`, {
                headers: { 'x-auth-token': token }
            })
            .then(r => r.json())
            .then(data => {
                if (data.department_name || data.department_code) {
                    departmentInput.value = data.department_name || data.department_code;
                    departmentInput.setAttribute('data-department-id',   data.department_id   || '');
                    departmentInput.setAttribute('data-department-code', data.department_code || '');
                    departmentInput.setAttribute('data-department-name', data.department_name || '');
                } else {
                    departmentInput.value = 'No department assigned';
                }
            })
            .catch(err => {
                console.error('Load department error:', err);
                departmentInput.value = 'Error loading department';
            });
        }
        
        // Show "Validate Immediately" option for area-chair only
        const normalizedRole = (role || '').toLowerCase();
        if (validateOption && normalizedRole === 'area-chair') {
            validateOption.style.display = 'flex';
        }
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
                updateFileInfo(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', function() {
            if (this.files.length) updateFileInfo(this.files);
        });
    }

    function updateFileInfo(files) {
        if (!fileInfo || !fileName || !fileSize) return;
        
        if (files.length === 1) {
            fileName.textContent = files[0].name;
            const size = files[0].size;
            if (size < 1024) fileSize.textContent = `(${size} B)`;
            else if (size < 1024 * 1024) fileSize.textContent = `(${(size / 1024).toFixed(1)} KB)`;
            else fileSize.textContent = `(${(size / (1024 * 1024)).toFixed(1)} MB)`;
        } else {
            fileName.textContent = `${files.length} files selected`;
            let totalSize = 0;
            for (let i = 0; i < files.length; i++) {
                totalSize += files[i].size;
            }
            fileSize.textContent = `(${(totalSize / (1024 * 1024)).toFixed(1)} MB total)`;
        }
        
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
            fileInput.value = '';
            fileInfo.classList.add('hidden');
            dropZone.classList.remove('border-teal-500', 'bg-teal-50');
            resetProgressUI();
        });
    }

    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('docTitle')?.value;
            const category = document.getElementById('category')?.value;
            const author = document.getElementById('author')?.value;
            const department = document.getElementById('department')?.value;
            const version = document.getElementById('version')?.value || 'v1.0';
            const expiryDate = document.getElementById('expiryDate')?.value || '';
            const description = document.getElementById('description')?.value || '';
            const keywords = document.getElementById('keywords')?.value || '';
            const workflow = document.querySelector('input[name="workflow"]:checked')?.value || 'submit';
            const files = fileInput?.files;

            if (!files || files.length === 0) {
                showErrorModal('Please select at least one file before uploading.');
                return;
            }
            if (!title || !category || !author || !department) {
                const missing = [];
                if (!title) missing.push('Document Title');
                if (!category) missing.push('Category');
                if (!author) missing.push('Author');
                if (!department) missing.push('Department');
                showErrorModal(`Please fill in the following required fields: ${missing.join(', ')}`);
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="mr-2">⏳</span> Uploading...';
            submitBtn.disabled = true;
            if (uploadLoadingOverlay) uploadLoadingOverlay.classList.remove('hidden');
            updateProgressUI(10, 'Preparing upload...');

            // Resolve department: prefer code, fall back to name, then raw input value
            const departmentCode = departmentInput?.getAttribute('data-department-code')
                || departmentInput?.getAttribute('data-department-name')
                || department;

            // Create FormData
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category_id', category);   // numeric id from <select>
            formData.append('author', author);
            formData.append('department', departmentCode);
            formData.append('version', version);
            formData.append('expiryDate', expiryDate);
            formData.append('description', description);
            formData.append('keywords', keywords);
            formData.append('workflow', workflow === 'draft' ? 'draft' : workflow === 'validate' ? 'approve' : 'submit');

            // Append all files
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            try {
                updateProgressUI(30, 'Uploading files...');

                const response = await fetch(`${API_BASE}/api/documents/upload`, {
                    method: 'POST',
                    headers: {
                        'x-auth-token': token
                    },
                    body: formData
                });

                updateProgressUI(80, 'Processing...');

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.msg || 'Upload failed');
                }

                updateProgressUI(100, 'Upload completed');
                console.log('Upload successful:', data);

                showUploadSuccessModal();
                uploadForm.reset();
                if (fileInfo) fileInfo.classList.add('hidden');
                if (dropZone) dropZone.classList.remove('border-teal-500', 'bg-teal-50');
                resetProgressUI();

            } catch (error) {
                console.error('Upload error:', error);
                showErrorModal('Upload failed: ' + error.message);
                updateProgressUI(0, 'Upload failed');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                if (uploadLoadingOverlay) uploadLoadingOverlay.classList.add('hidden');
            }
        });
    }

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Discard upload? Any unsaved progress will be lost.')) {
                uploadForm.reset();
                if (fileInfo) fileInfo.classList.add('hidden');
                if (dropZone) dropZone.classList.remove('border-teal-500', 'bg-teal-50');
                resetProgressUI();
                // Re-fill auto-filled fields
                autoFillUserData();
            }
        });
    }
});

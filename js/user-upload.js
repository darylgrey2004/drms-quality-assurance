// js/user-upload.js

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Upload JS loaded');

    // Initialize user session (handled by user-session.js)
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    const API_BASE = window.API_CONFIG?.API_BASE || 'http://localhost:3000';

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
    setupVersionAutoIncrement();

    // Standard dropdown — reacts to category selection
    const standardSelect = document.getElementById('standard');
    if (categorySelect && standardSelect) {
        categorySelect.addEventListener('change', function () {
            loadStandards(this.value);
        });
    }

    function loadStandards(categoryId) {
        if (!standardSelect) return;
        standardSelect.innerHTML = '<option value="">Select standard</option>';
        if (!categoryId) return;
        fetch(`${API_BASE}/api/documents/standards?category_id=${categoryId}`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(standards => {
            if (!standards.length) {
                standardSelect.innerHTML = '<option value="">No standards available</option>';
                return;
            }
            standards.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `${s.name} (${s.code})`;
                standardSelect.appendChild(opt);
            });
        })
        .catch(err => console.error('Load standards error:', err));
    }

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
        
        // Fetch and auto-fill department from user profile
        if (departmentInput) {
            departmentInput.value = 'Loading department...';
            
            fetch(`${API_BASE}/api/user/profile/${user.id}`, {
                headers: { 'x-auth-token': token }
            })
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch profile');
                return r.json();
            })
            .then(profile => {
                if (profile.department) {
                    // Fetch departments list to get full name
                    return fetch(`${API_BASE}/api/documents/departments`, {
                        headers: { 'x-auth-token': token },
                        cache: 'no-cache'
                    })
                    .then(r => r.json())
                    .then(departments => {
                        // Find matching department by code or name
                        const deptLower = profile.department.toLowerCase();
                        const matchedDept = departments.find(d => 
                            d.code.toLowerCase() === deptLower || 
                            d.name.toLowerCase() === deptLower
                        );
                        
                        if (matchedDept) {
                            const displayName = `${matchedDept.code} (${matchedDept.name})`;
                            departmentInput.value = displayName;
                            departmentInput.setAttribute('data-department-code', matchedDept.code.toLowerCase());
                            departmentInput.setAttribute('data-department-name', matchedDept.name);
                        } else {
                            // Fallback to profile department value
                            departmentInput.value = profile.department;
                            departmentInput.setAttribute('data-department-code', deptLower);
                            departmentInput.setAttribute('data-department-name', profile.department);
                        }
                    });
                } else {
                    departmentInput.value = 'No department assigned';
                    console.warn('User has no department assigned in profile');
                }
            })
            .catch(err => {
                console.error('Load department error:', err);
                departmentInput.value = 'Error loading department';
                showErrorModal('Failed to load your department information. Please contact administrator.');
            });
        }
        
        // Show "Validate Immediately" option for area-chair/department-head only
        const normalizedRole = (role || '').toLowerCase();
        if (validateOption && (normalizedRole === 'area-chair' || normalizedRole === 'department-head')) {
            validateOption.style.display = 'flex';
        }
    }

    function setupVersionAutoIncrement() {
        const titleInput = document.getElementById('docTitle');
        const versionInput = document.getElementById('version');

        async function checkAndUpdateVersion() {
            const title = titleInput?.value.trim();
            const category = categorySelect?.value;
            const department = departmentInput?.getAttribute('data-department-code') || departmentInput?.value;

            if (!title || !category || !department || !token) {
                if (versionInput) versionInput.value = 'v1.0';
                return;
            }

            try {
                // Check if document with same title, category, and department exists
                const response = await fetch(`${API_BASE}/api/documents?scope=mine`, {
                    headers: { 'x-auth-token': token }
                });
                
                if (!response.ok) {
                    if (versionInput) versionInput.value = 'v1.0';
                    return;
                }

                const documents = await response.json();
                
                // Filter documents with same title, category, and department
                const matchingDocs = documents.filter(doc => 
                    doc.title.toLowerCase() === title.toLowerCase() && 
                    String(doc.category_id) === String(category) &&
                    (doc.department_code === department || doc.area === department)
                );

                if (matchingDocs.length === 0) {
                    if (versionInput) versionInput.value = 'v1.0';
                    return;
                }

                // Find highest version number
                let maxVersion = 1;
                matchingDocs.forEach(doc => {
                    const versionMatch = (doc.version || 'v1.0').match(/v?(\d+)(\.\d+)?/);
                    if (versionMatch) {
                        const versionNum = parseInt(versionMatch[1]);
                        if (versionNum >= maxVersion) {
                            maxVersion = versionNum + 1;
                        }
                    }
                });

                const newVersion = `v${maxVersion}.0`;
                if (versionInput) {
                    versionInput.value = newVersion;
                    versionInput.classList.add('bg-amber-50', 'border-amber-300');
                    versionInput.classList.remove('bg-gray-100');
                }

                // Get category display name
                const categoryOption = categorySelect?.querySelector(`option[value="${category}"]`);
                const categoryName = categoryOption?.textContent || 'this category';

                // Show alert to user
                const alertDiv = document.createElement('div');
                alertDiv.className = 'bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 rounded';
                alertDiv.innerHTML = `
                    <div class="flex items-start">
                        <span class="text-amber-600 mr-2">⚠️</span>
                        <div class="text-sm">
                            <p class="font-medium text-amber-800">Document Version Auto-Incremented</p>
                            <p class="text-amber-700 mt-1">A document with the title "${title}" already exists in <strong>${categoryName}</strong> category for <strong>${department}</strong> department. Version automatically set to <strong>${newVersion}</strong>.</p>
                        </div>
                    </div>
                `;
                
                // Insert alert before the form
                const form = document.getElementById('uploadForm');
                const existingAlert = form?.previousElementSibling;
                if (existingAlert && existingAlert.classList.contains('bg-amber-50')) {
                    existingAlert.remove();
                }
                form?.parentNode.insertBefore(alertDiv, form);

                // Auto-remove alert after 8 seconds
                setTimeout(() => alertDiv.remove(), 8000);

            } catch (error) {
                console.error('Version check error:', error);
                if (versionInput) versionInput.value = 'v1.0';
            }
        }

        // Check version when title or category changes
        if (titleInput) {
            titleInput.addEventListener('blur', checkAndUpdateVersion);
        }
        if (categorySelect) {
            categorySelect.addEventListener('change', checkAndUpdateVersion);
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

    function showUploadSuccessModal(documentTitle) {
        if (!uploadSuccessModal) return;
        
        // Update modal content with document title
        const modalContent = uploadSuccessModal.querySelector('.flex-1');
        if (modalContent && documentTitle) {
            modalContent.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-800">Upload Successful!</h3>
                <p class="text-sm text-gray-600 mt-1"><strong>"${documentTitle}"</strong> has been uploaded successfully.</p>
                <p class="text-sm text-gray-500 mt-1">Your document is now saved and will appear in Documents and Approvals.</p>
            `;
        }
        
        uploadSuccessModal.classList.remove('hidden');
        uploadSuccessModal.classList.add('flex');
    }

    function hideUploadSuccessModal() {
        if (!uploadSuccessModal) return;
        uploadSuccessModal.classList.add('hidden');
        uploadSuccessModal.classList.remove('flex');
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
            const description = document.getElementById('description')?.value || '';
            const keywords = document.getElementById('keywords')?.value || '';
            const workflow = document.querySelector('input[name="workflow"]:checked')?.value || 'submit';
            const standard = document.getElementById('standard')?.value;
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
            if (!standard) {
                showErrorModal('Please select a standard for this document.');
                return;
            }

            const submitButton = document.getElementById('submitBtn');
            const originalText = submitButton?.innerHTML || 'Upload Document';
            if (submitButton) {
                submitButton.innerHTML = '<span class="mr-2">⏳</span> Uploading...';
                submitButton.disabled = true;
            }
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
            formData.append('description', description);
            formData.append('keywords', keywords);
            formData.append('workflow', workflow === 'draft' ? 'draft' : workflow === 'validate' ? 'approve' : 'submit');
            
            // Add standard_id if selected
            if (standard) {
                formData.append('standard_id', standard);
            }

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

                showUploadSuccessModal(title);
                uploadForm.reset();
                if (fileInfo) fileInfo.classList.add('hidden');
                if (dropZone) dropZone.classList.remove('border-teal-500', 'bg-teal-50');
                resetProgressUI();

            } catch (error) {
                console.error('Upload error:', error);
                showErrorModal('Upload failed: ' + error.message);
                updateProgressUI(0, 'Upload failed');
            } finally {
                if (submitButton) {
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                }
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

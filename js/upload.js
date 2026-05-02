// js/upload.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Upload page JS loaded successfully');
    
    const token = localStorage.getItem('token');
    
    // ── Heartbeat: Update lastActive status ──
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 2 * 60 * 1000);
    }
    
    // DOM elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const dropZoneEmpty = document.getElementById('dropZoneEmpty');
    const dropZoneFiles = document.getElementById('dropZoneFiles');
    const uploadFileList = document.getElementById('uploadFileList');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const uploadForm = document.getElementById('uploadForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const uploadSuccessModal = document.getElementById('uploadSuccessModal');
    const uploadSuccessBackdrop = document.getElementById('uploadSuccessBackdrop');
    const closeUploadSuccessBtn = document.getElementById('closeUploadSuccessBtn');

    let selectedFiles = [];
    const API_BASE = 'http://localhost:3000';

    // Load categories and departments dynamically
    loadCategories();
    loadDepartments();
    loadRecentUploads();
    populateAuthorField();
    setupVersionAutoIncrement();

    function populateAuthorField() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const authorInput = document.getElementById('author');
        if (authorInput && user.firstName && user.lastName) {
            const fullName = `${user.firstName} ${user.lastName}`.trim();
            authorInput.value = fullName;
            authorInput.setAttribute('readonly', 'readonly');
            authorInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
    }

    function setupVersionAutoIncrement() {
        const titleInput = document.getElementById('docTitle');
        const categorySelect = document.getElementById('category');
        const departmentSelect = document.getElementById('department');
        const versionInput = document.getElementById('version');

        async function checkAndUpdateVersion() {
            const title = titleInput?.value.trim();
            const category = categorySelect?.value;
            const department = departmentSelect?.value;

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

        // Check version when title, category, or department changes
        if (titleInput) {
            titleInput.addEventListener('blur', checkAndUpdateVersion);
        }
        if (categorySelect) {
            categorySelect.addEventListener('change', checkAndUpdateVersion);
        }
        if (departmentSelect) {
            departmentSelect.addEventListener('change', checkAndUpdateVersion);
        }
    }

    function loadCategories() {
        fetch(`${API_BASE}/api/documents/categories`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(categories => {
            const categorySelect = document.getElementById('category');
            if (categorySelect && categories.length > 0) {
                categorySelect.innerHTML = '<option value="">Select category</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.display_name || cat.name;
                    categorySelect.appendChild(option);
                });
            }
        })
        .catch(err => console.error('Load categories error:', err));
    }

    function loadDepartments() {
        fetch(`${API_BASE}/api/documents/departments`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(departments => {
            const departmentSelect = document.getElementById('department');
            if (departmentSelect && departments.length > 0) {
                departmentSelect.innerHTML = '<option value="">Select department</option>';
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.code;
                    option.textContent = `${dept.code} (${dept.name})`;
                    departmentSelect.appendChild(option);
                });
            }
        })
        .catch(err => console.error('Load departments error:', err));
    }

    function loadRecentUploads() {
        fetch(`${API_BASE}/api/documents?scope=mine`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(documents => {
            renderRecentUploads(documents.slice(0, 5));
        })
        .catch(err => console.error('Load recent uploads error:', err));
    }

    function renderRecentUploads(documents) {
        const desktopContainer = document.querySelector('.hidden.md\\:block .divide-y');
        const mobileContainer = document.querySelector('.block.md\\:hidden');
        
        if (!documents || documents.length === 0) {
            if (desktopContainer) desktopContainer.innerHTML = '<div class="py-4 text-center text-gray-500 text-sm">No recent uploads</div>';
            if (mobileContainer) mobileContainer.innerHTML = '<div class="py-4 text-center text-gray-500 text-sm">No recent uploads</div>';
            return;
        }

        // Desktop view
        if (desktopContainer) {
            desktopContainer.innerHTML = documents.map(doc => {
                const uploadDate = new Date(doc.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                return `
                    <div class="grid grid-cols-12 py-2 text-sm items-center">
                        <div class="col-span-5 text-gray-700">${doc.title || 'Untitled'}</div>
                        <div class="col-span-2 text-gray-600">${doc.category_display_name || doc.category || '-'}</div>
                        <div class="col-span-2 text-gray-600">${doc.department_code || doc.area || '-'}</div>
                        <div class="col-span-3 text-gray-400 text-xs">${uploadDate}</div>
                    </div>
                `;
            }).join('');
        }

        // Mobile view
        if (mobileContainer) {
            mobileContainer.innerHTML = documents.map(doc => {
                const uploadDate = new Date(doc.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                return `
                    <div class="border-b pb-2">
                        <div class="font-medium text-gray-800 text-sm">${doc.title || 'Untitled'}</div>
                        <div class="text-xs text-gray-500">${doc.category_display_name || doc.category || '-'} · ${doc.department_code || doc.area || '-'} · ${uploadDate}</div>
                    </div>
                `;
            }).join('');
        }
    }

    function showUploadSuccessModal(documentTitle) {
        if (!uploadSuccessModal) {
            alert(`Upload Successful! "${documentTitle}" has been uploaded.`);
            return;
        }
        
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

    
    // File drop zone functionality
    if (dropZone && fileInput) {
        // Click on drop zone triggers file input
        dropZone.addEventListener('click', function(e) {
            // Avoid triggering when clicking remove buttons inside list
            const isButton = (e?.target?.tagName || '').toLowerCase() === 'button';
            if (isButton) return;
            fileInput.click();
        });
        
        // Drag over effect
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('border-teal-500', 'bg-teal-50');
        });
        
        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('border-teal-500', 'bg-teal-50');
        });
        
        // Drop event
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('border-teal-500', 'bg-teal-50');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                addFiles(Array.from(files));
            }
        });
        
        // File input change
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                addFiles(Array.from(this.files));
                this.value = ''; // allow selecting same file again (copy)
            }
        });
    }

    if (addMoreBtn) {
        addMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput?.click();
        });
    }

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function setDropZoneMode(hasFiles) {
        if (dropZoneEmpty) dropZoneEmpty.classList.toggle('hidden', hasFiles);
        if (dropZoneFiles) dropZoneFiles.classList.toggle('hidden', !hasFiles);
        if (dropZone) {
            if (hasFiles) dropZone.classList.add('border-teal-500', 'bg-teal-50');
            else dropZone.classList.remove('border-teal-500', 'bg-teal-50');
        }
    }

    function addFiles(files) {
        // allow duplicates (copies) by not de-duping
        selectedFiles = [...selectedFiles, ...files].slice(0, 10); // cap to 10 for UI sanity
        renderFileList();
    }

    function removeFileAt(index) {
        selectedFiles = selectedFiles.filter((_, i) => i !== index);
        renderFileList();
    }

    function updateRowProgress(index, percent, status) {
        const row = document.querySelector(`[data-upload-index="${index}"]`);
        if (!row) return;
        const bar = row.querySelector('[data-upload-bar]');
        const statusEl = row.querySelector('[data-upload-status]');
        const percentEl = row.querySelector('[data-upload-percent]');
        const safePercent = Math.max(0, Math.min(100, percent));
        if (bar) bar.style.width = `${safePercent}%`;
        if (statusEl) statusEl.textContent = status;
        if (percentEl) percentEl.textContent = `${Math.round(safePercent)}%`;
    }

    function renderFileList() {
        if (!uploadFileList) return;

        setDropZoneMode(selectedFiles.length > 0);
        uploadFileList.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'upload-item';
            item.setAttribute('data-upload-index', String(index));
            item.innerHTML = `
                <div class="upload-item-top">
                    <div class="upload-item-name-wrap">
                        <span class="upload-item-chip">FILE</span>
                        <span class="upload-item-name" title="${file.name}">${file.name}</span>
                        <span class="upload-item-size">(${formatSize(file.size)})</span>
                    </div>
                    <button type="button" class="upload-item-remove" data-remove-index="${index}" title="Remove file">✕</button>
                </div>
                <div class="upload-progress-track">
                    <div class="upload-progress-fill" data-upload-bar style="width:0%"></div>
                </div>
                <div class="upload-progress-meta">
                    <span data-upload-status>Ready to upload</span>
                    <span data-upload-percent>0%</span>
                </div>
            `;
            uploadFileList.appendChild(item);
        });

        uploadFileList.querySelectorAll('[data-remove-index]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = Number(btn.getAttribute('data-remove-index'));
                removeFileAt(idx);
            });
        });
    }
    
    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const title = document.getElementById('docTitle')?.value;
            const category = document.getElementById('category')?.value;
            const department = document.getElementById('department')?.value;
            const author = document.getElementById('author')?.value;
            const files = selectedFiles;
            
            if (!files || files.length === 0) {
                alert('Please select a file to upload');
                return;
            }
            
            if (!title || !category || !department || !author) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Check file sizes (25MB limit each)
            const tooLarge = files.find(f => f.size > 25 * 1024 * 1024);
            if (tooLarge) {
                alert(`File size exceeds 25MB limit: ${tooLarge.name}`);
                return;
            }
            
            // Real upload (backend)
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="mr-2">⏳</span> Uploading...';
            submitBtn.disabled = true;

            if (!token) {
                alert('Session expired. Please login again.');
                window.location.href = 'landing.html';
                return;
            }

            // Sequential backend upload with per-file progress (Drive-like).
            let currentIndex = 0;
            function uploadNext() {
                if (currentIndex >= files.length) {
                    // done - all files uploaded successfully
                    setTimeout(() => {
                        showUploadSuccessModal(title);
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        uploadForm.reset();
                        selectedFiles = [];
                        renderFileList();
                        loadRecentUploads(); // Refresh recent uploads list
                    }, 250);
                    return;
                }

                const file = files[currentIndex];
                updateRowProgress(currentIndex, 3, 'Preparing upload...');

                const formData = new FormData();
                formData.append('title', title);
                formData.append('category_id', category);
                formData.append('department', department);
                formData.append('version', document.getElementById('version')?.value || 'v1.0');
                formData.append('author', author);
                formData.append('description', document.getElementById('description')?.value || '');
                formData.append('keywords', document.getElementById('keywords')?.value || '');
                formData.append('workflow', document.querySelector('input[name="workflow"]:checked')?.value || 'submit');
                formData.append('files', file);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_BASE}/api/documents/upload`);
                xhr.setRequestHeader('x-auth-token', token);

                // Fallback simulated progress (in case progress events are sparse)
                let simulated = 3;
                let sawRealProgress = false;
                const simTimer = setInterval(() => {
                    if (sawRealProgress) return;
                    if (simulated >= 92) return;
                    simulated += Math.random() * 10;
                    updateRowProgress(currentIndex, simulated, 'Uploading...');
                }, 180);

                xhr.upload.addEventListener('progress', (event) => {
                    if (!event.lengthComputable) return;
                    sawRealProgress = true;
                    const percent = (event.loaded / event.total) * 100;
                    updateRowProgress(currentIndex, percent, 'Uploading...');
                });

                xhr.addEventListener('load', () => {
                    clearInterval(simTimer);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        updateRowProgress(currentIndex, 100, 'Upload completed');
                        currentIndex += 1;
                        uploadNext();
                    } else {
                        let msg = 'Upload failed';
                        try {
                            const parsed = JSON.parse(xhr.responseText || '{}');
                            msg = parsed.msg || msg;
                        } catch (_e) {}
                        updateRowProgress(currentIndex, 0, msg);
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        alert(`Upload failed: ${msg}`);
                    }
                });

                xhr.addEventListener('error', () => {
                    clearInterval(simTimer);
                    updateRowProgress(currentIndex, 0, 'Network error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    alert('Network error occurred during upload');
                });

                xhr.send(formData);
            }

            uploadNext();
            
            console.log('Uploading document(s):', {
                title,
                category,
                department,
                author,
                version: document.getElementById('version')?.value,
                workflow: document.querySelector('input[name="workflow"]:checked')?.value,
                files: files.map((f) => f.name)
            });
        });
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                window.location.href = 'documents.html';
            }
        });
    }
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'upload.html';
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

    // Mobile Sidebar Toggle
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('mainSidebar');
    
    if (menuToggle && sidebar) {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        
        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
        
        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.classList.add('sidebar-open');
        }
        
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
        
        overlay.addEventListener('click', closeSidebar);
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
        
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
    }
});
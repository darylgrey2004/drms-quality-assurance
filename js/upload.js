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
    const categorySelect = document.getElementById('category');
    const areaSelect = document.getElementById('area');
    const uploadForm = document.getElementById('uploadForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const uploadSuccessModal = document.getElementById('uploadSuccessModal');
    const uploadSuccessBackdrop = document.getElementById('uploadSuccessBackdrop');
    const closeUploadSuccessBtn = document.getElementById('closeUploadSuccessBtn');

    let selectedFiles = [];
    const API_BASE = 'http://localhost:3000';

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
    
    // Area options mapping based on category
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
            { value: 'area1', label: 'Area I - Vision, Mission, Goals and Objectives' },
            { value: 'area2', label: 'Area II - Faculty' },
            { value: 'area3', label: 'Area III - Curriculum and Instruction' },
            { value: 'area4', label: 'Area IV - Students' },
            { value: 'area5', label: 'Area V - Research' },
            { value: 'area6', label: 'Area VI - Extension and Community Involvement' },
            { value: 'area7', label: 'Area VII - Library' },
            { value: 'area8', label: 'Area VIII - Physical Facilities' },
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
    
    // Update area dropdown based on category selection
    if (categorySelect && areaSelect) {
        categorySelect.addEventListener('change', function() {
            const category = this.value;
            
            // Clear current options
            areaSelect.innerHTML = '';
            
            if (!category) {
                areaSelect.innerHTML = '<option value="">Select category first</option>';
                return;
            }
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select area / clause';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            areaSelect.appendChild(defaultOption);
            
            // Add options based on category
            const options = areaOptions[category] || [];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                areaSelect.appendChild(option);
            });
        });
    }
    
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
            const area = document.getElementById('area')?.value;
            const author = document.getElementById('author')?.value;
            const files = selectedFiles;
            
            if (!files || files.length === 0) {
                alert('Please select a file to upload');
                return;
            }
            
            if (!title || !category || !area || !author) {
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
                    // done
                    setTimeout(() => {
                        showUploadSuccessModal();
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                        uploadForm.reset();
                        selectedFiles = [];
                        renderFileList();
                        if (areaSelect) areaSelect.innerHTML = '<option value="">Select category first</option>';
                    }, 250);
                    return;
                }

                const file = files[currentIndex];
                updateRowProgress(currentIndex, 3, 'Preparing upload...');

                const formData = new FormData();
                formData.append('title', title);
                formData.append('category', category);
                formData.append('area', area);
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
                    }
                });

                xhr.addEventListener('error', () => {
                    clearInterval(simTimer);
                    updateRowProgress(currentIndex, 0, 'Network error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                });

                xhr.send(formData);
            }

            uploadNext();
            
            console.log('Uploading document(s):', {
                title,
                category,
                area,
                author,
                version: document.getElementById('version')?.value,
                expiryDate: document.getElementById('expiryDate')?.value,
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
});
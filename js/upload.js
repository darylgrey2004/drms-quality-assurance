// js/upload.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'http://127.0.0.1:3000';
    const token = localStorage.getItem('token');
    const sessionUser = JSON.parse(localStorage.getItem('user') || '{}');

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

    function getApiErrorMessage(payload, fallback) {
        return payload?.error?.details || payload?.error?.message || payload?.msg || fallback;
    }

    async function apiRequest(path, options = {}) {
        const headers = { ...(options.headers || {}) };
        if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) headers['x-auth-token'] = token;

        const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
        let payload = null;
        try {
            payload = await response.json();
        } catch (_e) {
            payload = null;
        }

        if (!response.ok) {
            throw new Error(getApiErrorMessage(payload, `Request failed (${response.status})`));
        }
        return payload;
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
    
    async function uploadSingleFile(documentId, file) {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest(`/api/documents/${documentId}/files`, {
            method: 'POST',
            body: formData
        });
    }

    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
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

            if (!sessionUser?.id) {
                alert('Missing user session. Please login again.');
                window.location.href = 'landing.html';
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

            try {
                const workflowChoice = document.querySelector('input[name="workflow"]:checked')?.value || 'submit';
                const workflowMap = {
                    submit: 'pending',
                    draft: 'draft',
                    approve: 'approved'
                };

                const documentPayload = {
                    title,
                    category,
                    area,
                    version: document.getElementById('version')?.value || 'v1.0',
                    description: document.getElementById('description')?.value || '',
                    keywords: document.getElementById('keywords')?.value || '',
                    workflow_status: workflowMap[workflowChoice] || 'pending',
                    uploader_id: String(sessionUser.id),
                    author_name: author
                };

                const created = await apiRequest('/api/documents', {
                    method: 'POST',
                    body: JSON.stringify(documentPayload)
                });

                const documentId = created?.id;
                if (!documentId) {
                    throw new Error('Document created but missing ID from API response.');
                }

                for (let i = 0; i < files.length; i += 1) {
                    updateRowProgress(i, 30, 'Uploading...');
                    await uploadSingleFile(documentId, files[i]);
                    updateRowProgress(i, 100, 'Upload completed');
                }

                showUploadSuccessModal();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                uploadForm.reset();
                selectedFiles = [];
                renderFileList();
                if (areaSelect) areaSelect.innerHTML = '<option value="">Select category first</option>';
            } catch (error) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                alert(`Upload failed: ${error.message}`);
            }
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
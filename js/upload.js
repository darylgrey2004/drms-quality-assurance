// js/upload.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Upload page JS loaded successfully');
    
    // DOM elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');
    const categorySelect = document.getElementById('category');
    const areaSelect = document.getElementById('area');
    const uploadForm = document.getElementById('uploadForm');
    const cancelBtn = document.getElementById('cancelBtn');
    
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
        dropZone.addEventListener('click', function() {
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
                fileInput.files = files;
                updateFileInfo(files[0]);
            }
        });
        
        // File input change
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                updateFileInfo(this.files[0]);
            }
        });
    }
    
    // Update file info display
    function updateFileInfo(file) {
        if (!fileInfo || !fileName || !fileSize) return;
        
        fileName.textContent = file.name;
        
        // Format file size
        const size = file.size;
        if (size < 1024) {
            fileSize.textContent = `(${size} B)`;
        } else if (size < 1024 * 1024) {
            fileSize.textContent = `(${(size / 1024).toFixed(1)} KB)`;
        } else {
            fileSize.textContent = `(${(size / (1024 * 1024)).toFixed(1)} MB)`;
        }
        
        fileInfo.classList.remove('hidden');
        
        // Hide drop zone or style it differently
        dropZone.classList.add('border-teal-500', 'bg-teal-50');
    }
    
    // Remove file
    if (removeFile) {
        removeFile.addEventListener('click', function() {
            if (fileInput) fileInput.value = '';
            if (fileInfo) fileInfo.classList.add('hidden');
            if (dropZone) {
                dropZone.classList.remove('border-teal-500', 'bg-teal-50');
            }
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
            const file = fileInput?.files[0];
            
            if (!file) {
                alert('Please select a file to upload');
                return;
            }
            
            if (!title || !category || !area || !author) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Check file size (25MB limit)
            if (file.size > 25 * 1024 * 1024) {
                alert('File size exceeds 25MB limit');
                return;
            }
            
            // Simulate upload
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="mr-2">⏳</span> Uploading...';
            submitBtn.disabled = true;
            
            console.log('Uploading document:', {
                title,
                category,
                area,
                author,
                version: document.getElementById('version')?.value,
                expiryDate: document.getElementById('expiryDate')?.value,
                description: document.getElementById('description')?.value,
                keywords: document.getElementById('keywords')?.value,
                workflow: document.querySelector('input[name="workflow"]:checked')?.value,
                file: file.name
            });
            
            setTimeout(() => {
                alert('Document uploaded successfully!\nIt has been submitted to the approval workflow.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Reset form
                uploadForm.reset();
                if (fileInfo) fileInfo.classList.add('hidden');
                if (dropZone) dropZone.classList.remove('border-teal-500', 'bg-teal-50');
                if (areaSelect) {
                    areaSelect.innerHTML = '<option value="">Select category first</option>';
                }
            }, 1500);
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
// Mobile Sidebar Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.w-72');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle && sidebar && overlay) {
        // Toggle sidebar when hamburger menu is clicked
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });
        
        // Close sidebar when overlay is clicked
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });
        
        // Close sidebar when a navigation link is clicked (optional)
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });
    }
    
    // Close sidebar when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    });
});
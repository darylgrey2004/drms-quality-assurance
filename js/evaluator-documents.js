// js/evaluator-documents.js

// Store document data for viewing
let documentsData = {};
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Documents JS loaded');
    
    const token = localStorage.getItem('token');
    const tbody = document.querySelector('#documentsTableBody');
    
    if (!token) {
        console.error('No authentication token found');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="py-4 text-center text-red-500">Please login to view documents</td></tr>';
        }
        return;
    }

    // ── Heartbeat: Update lastActive status ──
    function sendHeartbeat() {
        fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/heartbeat`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    // ── Document Modal Functions ──
    const modal = document.getElementById('docPreviewModal');
    const closeModal = document.getElementById('docPreviewCloseBtn');

    function closeDocumentModal() {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            const frame = document.getElementById('docPreviewFrame');
            if (frame) frame.src = 'about:blank';
        }
    }

    if (closeModal) closeModal.addEventListener('click', closeDocumentModal);
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDocumentModal();
            }
        });
    }

    function openDocumentViewer(docId) {
        const doc = documentsData[docId];
        if (!doc) {
            alert('Document not found');
            return;
        }

        // Update modal header
        const docViewerTitle = document.getElementById('docPreviewTitle');
        const frame = document.getElementById('docPreviewFrame');
        
        if (docViewerTitle) docViewerTitle.textContent = doc.title || 'Document Preview';
        
        if (frame) {
            if (doc.file_url) {
                const fileUrl = doc.file_url.startsWith('http') ? doc.file_url : `http://localhost:3000${doc.file_url}`;
                frame.src = fileUrl;
            } else {
                frame.src = 'about:blank';
            }
        }

        // Show modal
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    // Helper function to get category badge class
    function getCategoryClass(category) {
        const cat = (category || '').toLowerCase();
        if (cat === 'instruction') return 'badge-instruction';
        if (cat === 'research') return 'badge-research';
        if (cat === 'extension') return 'badge-extension';
        if (cat === 'employment') return 'badge-employment';
        return 'badge-instruction'; // default
    }

    // Helper function to get status badge class
    function getStatusClass(status) {
        const stat = (status || '').toLowerCase();
        if (stat === 'approved') return 'badge-approved';
        if (stat === 'pending') return 'badge-pending';
        if (stat === 'draft') return 'badge-draft';
        if (stat === 'expired') return 'badge-expired';
        return 'badge-pending';
    }

    // Helper function to get status text
    function getStatusText(status) {
        const stat = (status || '').toLowerCase();
        if (stat === 'approved') return 'Approved';
        if (stat === 'pending') return 'Pending';
        if (stat === 'draft') return 'Draft';
        if (stat === 'expired') return 'Expired';
        return 'Pending';
    }

    // Fetch documents from API (evaluators see only LOCKED documents)
    async function loadDocuments() {
        if (isLoading) return;
        isLoading = true;
        
        const tbody = document.querySelector('#documentsTableBody');
        
        // Show loading state immediately to prevent flash
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center"><div class="inline-block animate-spin rounded-full h-6 w-6 border-3 border-teal-600 border-t-transparent"></div><p class="text-gray-500 mt-2">Loading locked documents...</p></td></tr>';
        }
        
        try {
            console.log('Fetching locked documents for evaluator...');
            // Evaluators can only see LOCKED documents (final approved documents)
            const response = await fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/documents?status=locked`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const documents = await response.json();
            console.log('Locked documents fetched:', documents.length);
            console.log('All documents are locked:', documents.every(d => d.workflow_status === 'locked'));

            if (!tbody) return;

            if (documents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-gray-500">No locked documents available for review</td></tr>';
                isLoading = false;
                return;
            }

            // Store documents data
            documentsData = {};
            documents.forEach(doc => {
                documentsData[doc.id] = doc;
            });

            // Clear and populate table
            tbody.innerHTML = '';
            
            documents.forEach(doc => {
                console.log('Document:', doc);
                const row = document.createElement('tr');
                const categoryClass = getCategoryClass(doc.category);
                const categoryDisplay = doc.category_display_name || doc.category || 'N/A';
                const departmentDisplay = doc.department_name || doc.department_code || doc.area || 'N/A';
                const authorDisplay = doc.author_name || doc.author || 'Unknown';
                const dateDisplay = doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-CA') : 'N/A';
                const versionDisplay = doc.version || 'v1.0';
                const titleDisplay = doc.title || 'Untitled Document';
                
                // Render standards badges (show up to 2 standards with +X indicator)
                const standards = doc.standards || [];
                let standardsHtml = '';
                if (standards.length > 0) {
                    const displayStandards = standards.slice(0, 2);
                    standardsHtml = displayStandards.map(s => {
                        const standardName = typeof s === 'string' ? s : (s.name || s.code || String(s));
                        return `<span class="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs mr-1">${escapeHtml(standardName)}</span>`;
                    }).join('');
                    if (standards.length > 2) {
                        standardsHtml += `<span class="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">+${standards.length - 2}</span>`;
                    }
                } else {
                    standardsHtml = '<span class="text-gray-400 text-xs">None</span>';
                }
                
                row.innerHTML = `
                    <td class="py-3"><div class="font-medium text-gray-800">${escapeHtml(titleDisplay)}</div></td>
                    <td class="py-3"><span class="${categoryClass} px-2 py-1 rounded-full text-xs">${escapeHtml(categoryDisplay)}</span></td>
                    <td class="py-3">${standardsHtml}</td>
                    <td class="py-3 text-gray-600">${escapeHtml(departmentDisplay)}</td>
                    <td class="py-3"><span class="badge-locked px-2 py-1 rounded-full text-xs">Locked</span></td>
                    <td class="py-3 text-gray-600">${escapeHtml(versionDisplay)}</td>
                    <td class="py-3 text-gray-500 text-xs">${escapeHtml(authorDisplay)}</td>
                    <td class="py-3 text-gray-500 text-xs">${dateDisplay}</td>
                    <td class="py-3"><button class="view-doc px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 hover:text-teal-700 transition" data-doc-id="${doc.id}">View</button></td>
                `;
                tbody.appendChild(row);
            });

            // Attach event listeners to view buttons
            document.querySelectorAll('.view-doc').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const docId = this.dataset.docId;
                    openDocumentViewer(docId);
                });
            });
            
        } catch (error) {
            console.error('Error loading locked documents:', error);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="9" class="py-4 text-center text-red-500">Error loading locked documents. Please try again later.</td></tr>';
            }
        } finally {
            isLoading = false;
        }
    }

    // Helper function to escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Load documents on page load
    loadDocuments();

    // Filter functionality (now works with the loaded data)
    const filterInput = document.getElementById('filterDocuments');
    const categoryFilter = document.getElementById('categoryFilter');
    const departmentFilter = document.getElementById('departmentFilter');
    const statusFilter = document.getElementById('statusFilter');
    const applyBtn = document.getElementById('applyFiltersBtn');
    
    function applyFilters() {
        const searchTerm = filterInput?.value.toLowerCase() || '';
        const category = categoryFilter?.value || 'all';
        const department = departmentFilter?.value || 'all';
        const status = statusFilter?.value || 'all';
        
        const rows = document.querySelectorAll('#documentsTableBody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const rowCategory = row.querySelector('.badge-instruction, .badge-research, .badge-extension, .badge-employment')?.textContent.toLowerCase() || '';
            const rowDepartment = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
            const rowStatus = row.querySelector('.badge-approved, .badge-pending, .badge-draft, .badge-expired')?.textContent.toLowerCase() || '';
            
            const matchesSearch = searchTerm === '' || text.includes(searchTerm);
            const matchesCategory = category === 'all' || rowCategory.includes(category);
            const matchesDepartment = department === 'all' || rowDepartment.includes(department);
            const matchesStatus = status === 'all' || rowStatus.includes(status);
            
            if (matchesSearch && matchesCategory && matchesDepartment && matchesStatus) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update visible count if there's a counter element
        const docCountElement = document.querySelector('.text-sm.text-gray-500');
        if (docCountElement) {
            docCountElement.textContent = `Showing ${visibleCount} of ${rows.length} documents`;
        }
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }
    
    if (filterInput) {
        filterInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') applyFilters();
        });
    }
    
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
});
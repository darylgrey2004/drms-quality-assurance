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
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    // ── Document Modal Functions ──
    const modal = document.getElementById('documentModal');
    const closeModal = document.getElementById('closeModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    function closeDocumentModal() {
        if (modal) modal.classList.add('hidden');
    }

    if (closeModal) closeModal.addEventListener('click', closeDocumentModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeDocumentModal);
    
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
        const docViewerTitle = document.getElementById('docViewerTitle');
        const docViewerMeta = document.getElementById('docViewerMeta');
        if (docViewerTitle) docViewerTitle.textContent = doc.title || 'Untitled Document';
        if (docViewerMeta) {
            const deptDisplay = doc.department_code || doc.department_name || doc.area || 'N/A';
            docViewerMeta.textContent = 
                `${doc.category || 'N/A'} · ${deptDisplay} · ${doc.version || 'v1.0'} · ${doc.author_name || 'Unknown'}`;
        }

        // Load document content
        const content = document.getElementById('docViewerContent');
        
        if (doc.file_url) {
            const fileUrl = doc.file_url.startsWith('http') ? doc.file_url : `http://127.0.0.1:3000${doc.file_url}`;
            const isPDF = fileUrl.toLowerCase().endsWith('.pdf');
            
            if (isPDF && content) {
                content.innerHTML = `
                    <iframe src="${fileUrl}" class="w-full h-96 border-0 rounded" title="${escapeHtml(doc.title)}"></iframe>
                    <p class="text-sm text-gray-600 mt-4">📄 PDF Document - ${escapeHtml(doc.title)}</p>
                `;
            } else if (content) {
                content.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-4xl mb-4">📄</div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">${escapeHtml(doc.title)}</h3>
                        <p class="text-gray-600 mb-4">File Type: ${doc.file_url.split('.').pop().toUpperCase()}</p>
                        <p class="text-gray-500 text-sm mb-6">This document can be viewed or downloaded using the button below.</p>
                        <a href="${fileUrl}" download class="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
                            📥 Download Document
                        </a>
                    </div>
                `;
            }
        } else if (content) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-4xl mb-4">⚠️</div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">No File Available</h3>
                    <p class="text-gray-600">This document does not have an associated file.</p>
                </div>
            `;
        }

        // Setup download button
        const downloadBtn = document.getElementById('downloadDoc');
        if (downloadBtn) {
            if (doc.file_url) {
                const fileUrl = doc.file_url.startsWith('http') ? doc.file_url : `http://127.0.0.1:3000${doc.file_url}`;
                downloadBtn.onclick = function() {
                    const link = document.createElement('a');
                    link.href = fileUrl;
                    link.download = doc.title || 'document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };
                downloadBtn.style.display = 'block';
            } else {
                downloadBtn.style.display = 'none';
            }
        }

        // Show modal
        if (modal) modal.classList.remove('hidden');
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

    // Fetch documents from API
    async function loadDocuments() {
        if (isLoading) return;
        isLoading = true;
        
        const tbody = document.querySelector('#documentsTableBody');
        
        // Show loading state immediately to prevent flash
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center"><div class="inline-block animate-spin rounded-full h-6 w-6 border-3 border-teal-600 border-t-transparent"></div><p class="text-gray-500 mt-2">Loading documents...</p></td></tr>';
        }
        
        try {
            console.log('Fetching documents for evaluator...');
            // Evaluators automatically get only approved documents from backend
            const response = await fetch('http://127.0.0.1:3000/api/documents', {
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
            console.log('Documents fetched:', documents.length);
            console.log('All documents are approved (evaluator role):', documents.every(d => d.workflow_status === 'approved'));

            if (!tbody) return;

            if (documents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-gray-500">No approved documents available for review</td></tr>';
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
                const statusClass = getStatusClass(doc.workflow_status);
                const statusText = getStatusText(doc.workflow_status);
                const categoryDisplay = doc.category || 'N/A';
                const departmentDisplay = doc.department_code || doc.department_name || doc.area || 'N/A';
                const authorDisplay = doc.author_name || doc.author || 'Unknown';
                const dateDisplay = doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-CA') : 'N/A';
                const versionDisplay = doc.version || 'v1.0';
                const titleDisplay = doc.title || 'Untitled Document';
                
                row.innerHTML = `
                    <td class="py-3"><div class="font-medium text-gray-800">${escapeHtml(titleDisplay)}</div></td>
                    <td class="py-3"><span class="${categoryClass} px-2 py-1 rounded-full text-xs">${escapeHtml(categoryDisplay)}</span></td>
                    <td class="py-3 text-gray-600">${escapeHtml(departmentDisplay)}</td>
                    <td class="py-3"><span class="${statusClass} px-2 py-1 rounded-full text-xs">${statusText}</span></td>
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
            console.error('Error loading documents:', error);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" class="py-4 text-center text-red-500">Error loading documents. Please try again later.</td></tr>';
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
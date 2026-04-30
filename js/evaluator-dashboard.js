// js/evaluator-dashboard.js

// Store document data for viewing
let documentsData = {};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Dashboard JS loaded');

    const token = localStorage.getItem('token');
    const tbody = document.querySelector('#recentDocumentsTable tbody');
    
    if (!token) {
        console.error('No authentication token found');
        return;
    }

    // If tbody doesn't exist with specific selector, try the table tbody
    const actualTbody = tbody || document.querySelector('tbody');

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

    // Check if modal exists in dashboard page
    const hasModal = modal !== null;

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
        if (!hasModal) {
            alert('Document viewer not available on this page. Please visit the View Documents page.');
            return;
        }

        const doc = documentsData[docId];
        if (!doc) {
            alert('Document not found');
            return;
        }

        // Update modal header
        const docViewerTitle = document.getElementById('docViewerTitle');
        const docViewerMeta = document.getElementById('docViewerMeta');
        
        if (docViewerTitle) docViewerTitle.textContent = doc.title || 'Untitled Document';
        if (docViewerMeta) docViewerMeta.textContent = 
            `${doc.category || 'N/A'} · ${doc.department || 'N/A'} · ${doc.version || 'v1.0'} · ${doc.author_name || 'Unknown'}`;

        // Load document content
        const content = document.getElementById('docViewerContent');
        
        if (content) {
            if (doc.file_url) {
                // Determine file type
                const fileUrl = doc.file_url;
                const isPDF = fileUrl.toLowerCase().endsWith('.pdf');
                
                if (isPDF) {
                    // For PDF, use iframe
                    content.innerHTML = `
                        <iframe src="${fileUrl}" class="w-full h-96 border-0 rounded" title="${doc.title}"></iframe>
                        <p class="text-sm text-gray-600 mt-4">📄 PDF Document - ${doc.title}</p>
                    `;
                } else {
                    // For other files, show download prompt
                    content.innerHTML = `
                        <div class="text-center py-12">
                            <div class="text-4xl mb-4">📄</div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">${doc.title}</h3>
                            <p class="text-gray-600 mb-4">File Type: ${doc.file_url.split('.').pop().toUpperCase()}</p>
                            <p class="text-gray-500 text-sm mb-6">This document can be viewed or downloaded using the button below.</p>
                            <a href="${fileUrl}" download class="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
                                📥 Download Document
                            </a>
                        </div>
                    `;
                }
            } else {
                content.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-4xl mb-4">⚠️</div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">No File Available</h3>
                        <p class="text-gray-600">This document does not have an associated file.</p>
                    </div>
                `;
            }
        }

        // Setup download button
        const downloadBtn = document.getElementById('downloadDoc');
        if (downloadBtn) {
            if (doc.file_url) {
                downloadBtn.onclick = function() {
                    const link = document.createElement('a');
                    link.href = doc.file_url;
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

    // Helper function to get category class
    function getCategoryClass(category) {
        const cat = (category || '').toLowerCase();
        if (cat === 'instruction') return 'badge-instruction';
        if (cat === 'research') return 'badge-research';
        if (cat === 'extension') return 'badge-extension';
        if (cat === 'employment') return 'badge-employment';
        return 'badge-instruction';
    }

    // Helper function to get category display name
    function getCategoryDisplay(category) {
        const cat = (category || '').toLowerCase();
        if (cat === 'instruction') return 'Instruction';
        if (cat === 'research') return 'Research';
        if (cat === 'extension') return 'Extension';
        if (cat === 'employment') return 'Employment';
        return category || 'N/A';
    }

    // Fetch recent approved documents from API
    async function loadRecentApprovedDocuments() {
        const tableTbody = document.querySelector('#recentDocumentsTable tbody');
        const fallbackTbody = document.querySelector('table tbody');
        const targetTbody = tableTbody || fallbackTbody;
        
        if (!targetTbody) {
            console.log('No table body found on this page');
            return;
        }
        
        try {
            console.log('Fetching recent approved documents...');
            const response = await fetch('http://127.0.0.1:3000/api/documents?status=approved', {
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

            if (targetTbody) {
                // Clear existing rows
                targetTbody.innerHTML = '';

                // Take only first 4 documents for dashboard
                const recentDocs = documents.slice(0, 4);

                if (recentDocs.length === 0) {
                    targetTbody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">No approved documents available</td></tr>';
                    return;
                }

                // Store documents data
                documents.forEach(doc => {
                    documentsData[doc.id] = doc;
                });

                // Populate table with documents
                recentDocs.forEach(doc => {
                    const row = document.createElement('tr');
                    const categoryClass = getCategoryClass(doc.category);
                    const categoryDisplay = getCategoryDisplay(doc.category);
                    const departmentDisplay = doc.department || 'N/A';
                    
                    row.innerHTML = `
                        <td class="py-3">
                            <div class="font-medium text-gray-800">${escapeHtml(doc.title || 'Untitled')}</div>
                        </td>
                        <td class="py-3"><span class="${categoryClass} px-2 py-1 rounded-full text-xs">${escapeHtml(categoryDisplay)}</span></td>
                        <td class="py-3 text-gray-600">${escapeHtml(departmentDisplay)}</td>
                        <td class="py-3"><span class="badge-approved px-2 py-1 rounded-full text-xs">Approved</span></td>
                        <td class="py-3 text-gray-600">${escapeHtml(doc.version || 'v1.0')}</td>
                        <td class="py-3 text-gray-500 text-xs">${escapeHtml(doc.author_name || 'Unknown')}</td>
                        <td class="py-3">
                            <button class="view-doc text-teal-600 hover:text-teal-800 text-sm font-medium" title="View Document (Read Only)" data-doc-id="${doc.id}">View</button>
                        </td>
                    `;
                    targetTbody.appendChild(row);
                });

                // Attach event listeners to view buttons
                document.querySelectorAll('.view-doc').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        const docId = this.dataset.docId;
                        if (hasModal) {
                            openDocumentViewer(docId);
                        } else if (documentsData[docId]) {
                            window.location.href = 'evaluator-documents.html';
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            if (targetTbody) {
                targetTbody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-red-500">Error loading approved documents</td></tr>';
            }
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
    loadRecentApprovedDocuments();

    // Activity feed items - informational only
    const activityItems = document.querySelectorAll('.border-b.border-gray-100, .flex.items-start.gap-3');
    activityItems.forEach(item => {
        item.addEventListener('click', function() {
            const activity = this.querySelector('.text-sm')?.textContent || 'Activity';
            alert(`📋 Activity Details\n\n${activity}\n\nThis shows the activity log. No actions can be taken in view-only mode.`);
        });
    });

    // Stats cards - show summary
    const statCards = document.querySelectorAll('.stat-card .text-2xl, .stat-card .text-3xl');
    statCards.forEach(card => {
        card.addEventListener('click', function() {
            const statName = this.closest('.stat-card')?.querySelector('.text-gray-500')?.textContent || 'Statistic';
            const value = this.textContent;
            alert(`📊 ${statName}\n\nCurrent value: ${value}\n\nThis is a view-only summary.`);
        });
    });

    // View All links
    const viewAllLinks = document.querySelectorAll('a.text-sm.text-teal-700');
    viewAllLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log('Navigating to view all');
        });
    });

    // Simulate view-only mode warning on first load
    setTimeout(() => {
        console.log('External Evaluator Mode: View-Only Access Active');
    }, 1000);

    // Handle any potential upload attempts (safety)
    document.addEventListener('click', function(e) {
        if (e.target.closest('button')?.textContent.includes('Upload') ||
            e.target.closest('a')?.textContent.includes('Upload')) {
            e.preventDefault();
            alert('❌ Upload is disabled in External Evaluator mode. You have view-only access.');
        }
    });

    // Profile link
    const profileLink = document.querySelector('a[href="evaluator-profile.html"]');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            console.log('Navigating to profile (view-only mode)');
        });
    }

    // Handle logout (if logout button exists)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Logout from Evaluator session?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }
});
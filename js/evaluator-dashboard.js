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
        if (docViewerMeta) {
            const deptDisplay = doc.department_code || doc.department_name || doc.area || 'N/A';
            docViewerMeta.textContent = 
                `${doc.category || 'N/A'} · ${deptDisplay} · ${doc.version || 'v1.0'} · ${doc.author_name || 'Unknown'}`;
        }

        // Load document content
        const content = document.getElementById('docViewerContent');
        
        if (content) {
            if (doc.file_url) {
                // Determine file type
                const fileUrl = doc.file_url.startsWith('http') ? doc.file_url : `http://127.0.0.1:3000${doc.file_url}`;
                const isPDF = fileUrl.toLowerCase().endsWith('.pdf');
                
                if (isPDF) {
                    // For PDF, use iframe
                    content.innerHTML = `
                        <iframe src="${fileUrl}" class="w-full h-96 border-0 rounded" title="${escapeHtml(doc.title)}"></iframe>
                        <p class="text-sm text-gray-600 mt-4">📄 PDF Document - ${escapeHtml(doc.title)}</p>
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

    // Fetch dashboard statistics from API (evaluator-specific endpoint)
    async function loadDashboardStats() {
        try {
            console.log('Fetching evaluator dashboard statistics (locked documents only)...');
            const response = await fetch('http://127.0.0.1:3000/api/documents/stats/evaluator', {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const stats = await response.json();
            console.log('Evaluator dashboard stats fetched:', stats);

            // Update total locked documents with requirements
            const totalElement = document.getElementById('statTotalDocs');
            const totalDetailElement = totalElement?.closest('.stat-card')?.querySelector('.text-xs.text-gray-500');
            if (totalElement) {
                totalElement.textContent = stats.total || 0;
            }
            if (totalDetailElement) {
                const currentCount = stats.total || 0;
                const requiredCount = stats.total_required || 0;
                totalDetailElement.textContent = `${currentCount} / ${requiredCount} documents`;
            }

            // Update category stats (locked documents per category with requirements)
            stats.categories?.forEach(cat => {
                const categoryCard = Array.from(document.querySelectorAll('.stat-card')).find(card => {
                    const label = card.querySelector('.text-gray-500')?.textContent;
                    return label === cat.display_name;
                });
                if (categoryCard) {
                    const countElement = categoryCard.querySelector('.text-2xl, .text-3xl');
                    const percentElement = categoryCard.querySelector('.text-xs.text-gray-500');
                    if (countElement) countElement.textContent = cat.count || 0;
                    if (percentElement) {
                        const currentCount = cat.count || 0;
                        const requiredCount = cat.total_required || 0;
                        percentElement.textContent = `${currentCount} / ${requiredCount} documents`;
                    }
                }
            });

            // Update Approved card - shows ALL approved documents (approved + locked)
            const approvedElement = document.getElementById('statApproved');
            const approvalRateElement = document.getElementById('approvalRate');
            if (approvedElement) {
                approvedElement.textContent = stats.approved || 0;
            }
            if (approvalRateElement) {
                const approvedCount = stats.approved || 0;
                const lockedCount = stats.locked || 0;
                const notLockedCount = approvedCount - lockedCount;
                if (approvedCount > 0) {
                    approvalRateElement.textContent = `${lockedCount} locked, ${notLockedCount} not locked`;
                } else {
                    approvalRateElement.textContent = 'No approved documents';
                }
            }

            // Update Pending card - shows pending documents
            const pendingElement = document.getElementById('statPending');
            const pendingNoteElement = document.getElementById('pendingNote');
            if (pendingElement) {
                pendingElement.textContent = stats.pending || 0;
            }
            if (pendingNoteElement) {
                const pendingCount = stats.pending || 0;
                pendingNoteElement.textContent = pendingCount > 0 ? `${pendingCount} awaiting review` : 'No pending documents';
            }

            // Update departments count (total active departments from database)
            const deptCard = Array.from(document.querySelectorAll('.stat-card')).find(card => 
                card.querySelector('.text-gray-500')?.textContent === 'Departments'
            );
            if (deptCard) {
                const countElement = deptCard.querySelector('.text-2xl, .text-3xl');
                const detailElement = deptCard.querySelector('.text-xs');
                if (countElement) countElement.textContent = stats.total_departments || 0;
                if (detailElement && stats.departments) {
                    const deptCodes = stats.departments.filter(d => d.count > 0).map(d => d.code).join(', ');
                    detailElement.textContent = deptCodes || 'None';
                }
            }

        } catch (error) {
            console.error('Error loading evaluator dashboard stats:', error);
        }
    }

    // Fetch recent locked documents from API (evaluators see only LOCKED documents from ALL departments)
    async function loadRecentApprovedDocuments() {
        const tableTbody = document.querySelector('#recentDocumentsTable tbody') || document.querySelector('#recentDocsTable');
        
        if (!tableTbody) {
            console.log('No table body found on this page');
            return;
        }
        
        try {
            console.log('Fetching recent locked documents (evaluator view - all departments)...');
            // Evaluators can only see LOCKED documents from ALL departments
            const response = await fetch('http://127.0.0.1:3000/api/documents?status=locked', {
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
            console.log('Sample document:', documents[0]);

            if (tableTbody) {
                // Clear existing rows
                tableTbody.innerHTML = '';

                // Take only first 4 documents for dashboard
                const recentDocs = documents.slice(0, 4);

                if (recentDocs.length === 0) {
                    tableTbody.innerHTML = '<tr><td colspan="8" class="py-4 text-center text-gray-500">No locked documents available</td></tr>';
                    return;
                }

                // Store documents data
                documents.forEach(doc => {
                    documentsData[doc.id] = doc;
                });

                // Populate table with documents
                recentDocs.forEach(doc => {
                    console.log('Rendering document:', doc.title, 'Standards:', doc.standards);
                    const row = document.createElement('tr');
                    const categoryClass = getCategoryClass(doc.category);
                    const categoryDisplay = doc.category_display_name || getCategoryDisplay(doc.category);
                    const departmentDisplay = doc.department_name || doc.department_code || doc.area || 'N/A';
                    
                    // Render standards badges (show up to 2 standards with +X indicator)
                    const standards = doc.standards || [];
                    let standardsHtml = '';
                    if (standards.length > 0) {
                        const displayStandards = standards.slice(0, 2);
                        standardsHtml = displayStandards.map(s => 
                            `<span class="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs mr-1">${escapeHtml(s)}</span>`
                        ).join('');
                        if (standards.length > 2) {
                            standardsHtml += `<span class="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">+${standards.length - 2}</span>`;
                        }
                    } else {
                        standardsHtml = '<span class="text-gray-400 text-xs">None</span>';
                    }
                    
                    row.innerHTML = `
                        <td class="py-3">
                            <div class="font-medium text-gray-800">${escapeHtml(doc.title || 'Untitled')}</div>
                        </td>
                        <td class="py-3"><span class="${categoryClass} px-2 py-1 rounded-full text-xs">${escapeHtml(categoryDisplay)}</span></td>
                        <td class="py-3">${standardsHtml}</td>
                        <td class="py-3 text-gray-600">${escapeHtml(departmentDisplay)}</td>
                        <td class="py-3"><span class="badge-locked px-2 py-1 rounded-full text-xs">Locked</span></td>
                        <td class="py-3 text-gray-600">${escapeHtml(doc.version || 'v1.0')}</td>
                        <td class="py-3 text-gray-500 text-xs">${escapeHtml(doc.author_name || 'Unknown')}</td>
                        <td class="py-3">
                            <button class="view-doc text-teal-600 hover:text-teal-800 text-sm font-medium" title="View Document (Read Only)" data-doc-id="${doc.id}">View</button>
                        </td>
                    `;
                    tableTbody.appendChild(row);
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
            console.error('Error loading locked documents:', error);
            if (tableTbody) {
                tableTbody.innerHTML = '<tr><td colspan="8" class="py-4 text-center text-red-500">Error loading locked documents</td></tr>';
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

    // Load dashboard stats and documents on page load
    loadDashboardStats();
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
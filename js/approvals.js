// js/approvals.js - Admin Approvals Page with Role-Based Permissions

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role || '').toLowerCase();
    const API_BASE = 'http://localhost:3000';

    // Access guard
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }
    if (role !== 'admin' && role !== 'dean') {
        window.location.href = 'user-approvals.html';
        return;
    }

    // DOM elements
    const approvalsList = document.getElementById('approvalsList');
    const mobileApprovalsList = document.getElementById('mobileApprovalsList');
    const searchInput = document.getElementById('searchApprovals');
    const workflowStage = document.getElementById('workflowStage');
    const approvalStatus = document.getElementById('approvalStatus');
    const refreshBtn = document.getElementById('refreshApprovals');
    const tabLinks = document.querySelectorAll('#workflowTabs a');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationButtons = document.getElementById('paginationButtons');
    
    // Bulk action elements
    const selectAllCheckbox = document.getElementById('selectAll');
    const selectedCountSpan = document.getElementById('selectedCount');
    const bulkActionSelect = document.getElementById('bulkAction');
    const applyBulkBtn = document.getElementById('applyBulk');
    
    // Preview modal elements
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
    const docPreviewFrame = document.getElementById('docPreviewFrame');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    
    // Validate modal elements (Admin only)
    const validateModal = document.getElementById('validateModal');
    const validateModalCloseBtn = document.getElementById('validateModalCloseBtn');
    const validateModalCancelBtn = document.getElementById('validateModalCancelBtn');
    const validateModalConfirmBtn = document.getElementById('validateModalConfirmBtn');
    const validateDocTitle = document.getElementById('validateDocTitle');
    const validateComment = document.getElementById('validateComment');
    
    // Approve modal elements
    const approveModal = document.getElementById('approveModal');
    const approveModalCloseBtn = document.getElementById('approveModalCloseBtn');
    const approveModalCancelBtn = document.getElementById('approveModalCancelBtn');
    const approveModalConfirmBtn = document.getElementById('approveModalConfirmBtn');
    const approveDocTitle = document.getElementById('approveDocTitle');
    const approveComment = document.getElementById('approveComment');
    
    // Rejection modal elements
    const rejectionModal = document.getElementById('rejectionModal');
    const closeRejectionBtn = document.getElementById('closeRejectionModal');
    const cancelRejection = document.getElementById('cancelRejection');
    const submitRejection = document.getElementById('submitRejection');
    const rejectionComment = document.getElementById('rejectionComment');
    
    // Bulk rejection modal
    const bulkRejectionModal = document.getElementById('bulkRejectionModal');
    const closeBulkRejectionBtn = document.getElementById('closeBulkRejectionModal');
    const cancelBulkRejection = document.getElementById('cancelBulkRejection');
    const submitBulkRejection = document.getElementById('submitBulkRejection');
    const bulkRejectionComment = document.getElementById('bulkRejectionComment');
    const bulkRejectCount = document.getElementById('bulkRejectCount');
    
    // Lock modal elements (Admin only)
    const lockModal = document.getElementById('lockModal');
    const lockModalCloseBtn = document.getElementById('lockModalCloseBtn');
    const lockModalCancelBtn = document.getElementById('lockModalCancelBtn');
    const lockModalConfirmBtn = document.getElementById('lockModalConfirmBtn');
    const lockDocTitle = document.getElementById('lockDocTitle');
    const lockComment = document.getElementById('lockComment');
    
    // Toast elements
    const actionToast = document.getElementById('actionToast');
    const actionToastMsg = document.getElementById('actionToastMsg');
    const actionToastIcon = document.getElementById('actionToastIcon');
    const actionErrorModal = document.getElementById('actionErrorModal');
    const actionErrorMessage = document.getElementById('actionErrorMessage');
    const closeActionErrorBtn = document.getElementById('closeActionErrorBtn');
    
    let allDocuments = [];
    let filteredDocuments = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentTab = 'all';
    let currentLockDocId = null;
    let pendingRejectDocId = null;
    let pendingValidateDocId = null;
    let pendingApproveDocId = null;
    let bulkRejectIds = [];
    let toastTimer;

    // Determine if user is Admin
    const isAdmin = role === 'admin';
    const isDean = role === 'dean';

    // Update user info
    updateUserInfo();

    // Load stats and documents
    loadStats();
    loadDocuments();

    function updateUserInfo() {
        const userInitials = document.getElementById('userInitials');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        
        if (user.firstName && user.lastName) {
            const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
            if (userInitials) userInitials.textContent = initials;
            if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
        }
        if (user.role && userRole) {
            const roleMap = {
                'admin': 'Administrator',
                'dean': 'Dean',
                'faculty': 'Faculty Member',
                'area-chair': 'Dept. Head',
                'department-head': 'Dept. Head',
                'evaluator': 'External Evaluator'
            };
            userRole.textContent = roleMap[user.role] || user.role;
        }
    }

    // Helper functions
    function showToast(msg, isError = false) {
        if (!actionToast) { alert(msg); return; }
        actionToastIcon.textContent = isError ? '✕' : '✓';
        actionToastMsg.textContent = msg;
        const toastDiv = actionToast.querySelector('div');
        if (toastDiv) {
            toastDiv.className = `flex items-center gap-3 ${isError ? 'bg-red-700' : 'bg-gray-900'} text-white px-4 py-3 rounded-xl shadow-xl text-sm max-w-sm`;
        }
        actionToast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => actionToast.classList.add('hidden'), 3500);
    }

    function showErrorModal(msg) {
        if (!actionErrorModal) { alert(msg); return; }
        actionErrorMessage.textContent = msg;
        actionErrorModal.classList.remove('hidden');
        actionErrorModal.classList.add('flex');
    }

    if (closeActionErrorBtn) closeActionErrorBtn.addEventListener('click', () => {
        actionErrorModal.classList.add('hidden');
        actionErrorModal.classList.remove('flex');
    });

    // Load statistics
    async function loadStats() {
        try {
            const response = await fetch(`${API_BASE}/api/approvals/stats`, {
                headers: { 'x-auth-token': token }
            });
            const stats = await response.json();
            document.getElementById('statPendingReview').textContent = (stats.pending || 0) + (stats.validated || 0);
            document.getElementById('statAwaitingValidation').textContent = stats.pending || 0;
            document.getElementById('statPendingApproval').textContent = stats.validated || 0;
            document.getElementById('statApproved').textContent = stats.approved || 0;
            document.getElementById('statRejected').textContent = stats.rejected || 0;
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }

    // Load documents
    async function loadDocuments() {
        console.log('Loading documents from API...');
        try {
            const response = await fetch(`${API_BASE}/api/approvals/pending`, {
                headers: { 'x-auth-token': token }
            });
            const docs = await response.json();
            console.log('Documents received:', docs);
            allDocuments = docs;
            applyFilters();
        } catch (err) {
            console.error('Error loading documents:', err);
            showErrorModal('Failed to load documents');
        }
    }

    function getWorkflowStage(status) {
        const statusMap = {
            'draft': 'draft',
            'pending': 'validate',
            'validated': 'approve',
            'approved': 'lock',
            'locked': 'locked',
            'rejected': 'rejected'
        };
        return statusMap[status] || 'unknown';
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const stage = workflowStage.value;
        const status = approvalStatus.value;

        filteredDocuments = allDocuments.filter(doc => {
            const matchesSearch = !searchTerm || 
                (doc.title || '').toLowerCase().includes(searchTerm) ||
                (doc.author_name || '').toLowerCase().includes(searchTerm) ||
                (doc.department_code || '').toLowerCase().includes(searchTerm);

            const matchesStage = stage === 'all' || 
                (stage === 'validate' && (doc.workflow_status === 'pending' || doc.workflow_status === 'draft')) ||
                (stage === 'approve' && doc.workflow_status === 'validated');

            const matchesStatus = status === 'all' || doc.workflow_status === status;

            const matchesTab = currentTab === 'all' ||
                (currentTab === 'pending' && (doc.workflow_status === 'pending' || doc.workflow_status === 'validated')) ||
                (currentTab === 'validating' && doc.workflow_status === 'pending') ||
                (currentTab === 'approving' && doc.workflow_status === 'validated') ||
                (currentTab === 'rejected' && doc.workflow_status === 'rejected') ||
                (currentTab === 'recent' && (doc.workflow_status === 'approved' || doc.workflow_status === 'locked'));

            return matchesSearch && matchesStage && matchesStatus && matchesTab;
        });

        currentPage = 1;
        renderDocuments();
        renderPagination();
        updateSelectedCount();
    }

    function getStatusBadge(status) {
        const badges = {
            'draft': 'bg-gray-100 text-gray-700',
            'pending': 'bg-amber-100 text-amber-700',
            'validated': 'bg-blue-100 text-blue-700',
            'approved': 'bg-green-100 text-green-700',
            'locked': 'bg-purple-100 text-purple-700',
            'rejected': 'bg-red-100 text-red-700'
        };
        return badges[status] || 'bg-gray-100 text-gray-700';
    }

    function getStatusText(status) {
        const texts = {
            'draft': 'Draft',
            'pending': 'Pending Validation',
            'validated': 'Pending Approval',
            'approved': 'Approved',
            'locked': 'Locked',
            'rejected': 'Rejected'
        };
        return texts[status] || status;
    }

    function openPreviewModal(url, title) {
        if (!docPreviewModal || !docPreviewFrame) {
            window.open(url, '_blank');
            return;
        }
        if (docPreviewTitle) docPreviewTitle.textContent = title || 'Document Preview';
        docPreviewFrame.src = url;
        docPreviewModal.classList.remove('hidden');
        docPreviewModal.classList.add('flex');
    }

    function closePreviewModal() {
        if (!docPreviewModal || !docPreviewFrame) return;
        docPreviewModal.classList.add('hidden');
        docPreviewModal.classList.remove('flex');
        docPreviewFrame.src = 'about:blank';
    }

    if (docPreviewCloseBtn) docPreviewCloseBtn.addEventListener('click', closePreviewModal);
    if (docPreviewModal) {
        docPreviewModal.addEventListener('click', (e) => {
            if (e.target === docPreviewModal) closePreviewModal();
        });
    }
    
    // Validate modal functions (Admin only)
    function openValidateModal(docId, title) {
        if (!isAdmin) {
            showToast('Only Administrators can validate documents.', true);
            return;
        }
        pendingValidateDocId = docId;
        validateDocTitle.textContent = title;
        validateComment.value = '';
        if (validateModal) {
            validateModal.classList.remove('hidden');
            validateModal.classList.add('flex');
        }
    }
    
    function closeValidateModal() {
        pendingValidateDocId = null;
        if (validateModal) {
            validateModal.classList.add('hidden');
            validateModal.classList.remove('flex');
        }
    }
    
    // Approve modal functions (Dean and Admin)
    function openApproveModal(docId, title) {
        pendingApproveDocId = docId;
        approveDocTitle.textContent = title;
        approveComment.value = '';
        if (approveModal) {
            approveModal.classList.remove('hidden');
            approveModal.classList.add('flex');
        }
    }
    
    function closeApproveModal() {
        pendingApproveDocId = null;
        if (approveModal) {
            approveModal.classList.add('hidden');
            approveModal.classList.remove('flex');
        }
    }
    
    // Rejection modal functions
    function openRejectionModal(doc) {
        pendingRejectDocId = doc.id;
        document.getElementById('modalDocTitle').textContent = doc.title;
        document.getElementById('modalDocDate').textContent = new Date(doc.created_at).toLocaleDateString();
        document.getElementById('modalDocCategory').textContent = `${doc.category_name || doc.category || 'N/A'} / ${doc.department_code || 'N/A'}`;
        document.getElementById('modalDocAuthor').textContent = doc.author_name || 'Unknown';
        document.getElementById('modalReviewer').textContent = `${user.firstName || 'Admin'} ${user.lastName || 'User'}`;
        rejectionComment.value = '';
        if (rejectionModal) {
            rejectionModal.classList.remove('hidden');
            setTimeout(() => rejectionModal.classList.add('active'), 10);
        }
    }

    function closeRejectionModal() {
        pendingRejectDocId = null;
        if (rejectionModal) {
            rejectionModal.classList.remove('active');
            setTimeout(() => rejectionModal.classList.add('hidden'), 300);
        }
    }

    // Bulk rejection modal functions
    function openBulkRejectionModal(ids) {
        bulkRejectIds = ids;
        bulkRejectCount.textContent = ids.length;
        bulkRejectionComment.value = '';
        if (bulkRejectionModal) {
            bulkRejectionModal.classList.remove('hidden');
            setTimeout(() => bulkRejectionModal.classList.add('active'), 10);
        }
    }

    function closeBulkRejectionModal() {
        bulkRejectIds = [];
        if (bulkRejectionModal) {
            bulkRejectionModal.classList.remove('active');
            setTimeout(() => bulkRejectionModal.classList.add('hidden'), 300);
        }
    }

    // Lock modal functions (Admin only)
    function openLockModal(docId, title) {
        if (!isAdmin) {
            showToast('Only Administrators can lock documents.', true);
            return;
        }
        currentLockDocId = docId;
        if (lockDocTitle) lockDocTitle.textContent = title;
        if (lockComment) lockComment.value = '';
        if (lockModal) {
            lockModal.classList.remove('hidden');
            lockModal.classList.add('flex');
        }
    }
    
    function closeLockModal() {
        currentLockDocId = null;
        if (lockModal) {
            lockModal.classList.add('hidden');
            lockModal.classList.remove('flex');
        }
    }
    
    // Modal event listeners
    if (validateModalCloseBtn) validateModalCloseBtn.addEventListener('click', closeValidateModal);
    if (validateModalCancelBtn) validateModalCancelBtn.addEventListener('click', closeValidateModal);
    if (validateModal) {
        validateModal.addEventListener('click', (e) => {
            if (e.target === validateModal) closeValidateModal();
        });
    }
    
    if (approveModalCloseBtn) approveModalCloseBtn.addEventListener('click', closeApproveModal);
    if (approveModalCancelBtn) approveModalCancelBtn.addEventListener('click', closeApproveModal);
    if (approveModal) {
        approveModal.addEventListener('click', (e) => {
            if (e.target === approveModal) closeApproveModal();
        });
    }
    
    if (closeRejectionBtn) closeRejectionBtn.addEventListener('click', closeRejectionModal);
    if (cancelRejection) cancelRejection.addEventListener('click', closeRejectionModal);
    if (rejectionModal) rejectionModal.addEventListener('click', e => { if (e.target === rejectionModal) closeRejectionModal(); });
    
    if (closeBulkRejectionBtn) closeBulkRejectionBtn.addEventListener('click', closeBulkRejectionModal);
    if (cancelBulkRejection) cancelBulkRejection.addEventListener('click', closeBulkRejectionModal);
    if (bulkRejectionModal) bulkRejectionModal.addEventListener('click', e => { if (e.target === bulkRejectionModal) closeBulkRejectionModal(); });
    
    if (lockModalCloseBtn) lockModalCloseBtn.addEventListener('click', closeLockModal);
    if (lockModalCancelBtn) lockModalCancelBtn.addEventListener('click', closeLockModal);
    if (lockModal) {
        lockModal.addEventListener('click', (e) => {
            if (e.target === lockModal) closeLockModal();
        });
    }
    
    // Action handlers with modals
    if (validateModalConfirmBtn) {
        validateModalConfirmBtn.addEventListener('click', async () => {
            if (pendingValidateDocId && isAdmin) {
                const comments = validateComment ? validateComment.value : '';
                await performValidate(pendingValidateDocId, comments);
                closeValidateModal();
            } else if (!isAdmin) {
                showToast('Only Administrators can validate documents.', true);
                closeValidateModal();
            }
        });
    }
    
    if (approveModalConfirmBtn) {
        approveModalConfirmBtn.addEventListener('click', async () => {
            if (pendingApproveDocId) {
                const comments = approveComment ? approveComment.value : '';
                await performApprove(pendingApproveDocId, comments);
                closeApproveModal();
            }
        });
    }
    
    if (submitRejection) {
        submitRejection.addEventListener('click', async () => {
            const reason = rejectionComment?.value?.trim();
            if (!reason) { showToast('Please provide a rejection reason.', true); return; }
            if (!pendingRejectDocId) {
                showErrorModal('No document selected for rejection.');
                return;
            }
            
            console.log('Submitting rejection for document ID:', pendingRejectDocId);
            console.log('Rejection reason:', reason);
            
            await performReject(pendingRejectDocId, reason);
            closeRejectionModal();
        });
    }
    
    if (submitBulkRejection) {
        submitBulkRejection.addEventListener('click', async () => {
            const reason = bulkRejectionComment?.value?.trim();
            if (!reason) { showToast('Please provide a rejection reason for all selected documents.', true); return; }
            if (bulkRejectIds.length === 0) return;
            
            showToast(`Rejecting ${bulkRejectIds.length} documents...`, false);
            let successCount = 0;
            let failCount = 0;
            
            for (const docId of bulkRejectIds) {
                const success = await performReject(docId, reason, true);
                if (success) successCount++;
                else failCount++;
            }
            
            closeBulkRejectionModal();
            if (failCount === 0) {
                showToast(`Successfully rejected ${successCount} documents.`);
            } else {
                showToast(`Rejected ${successCount} documents, ${failCount} failed.`, true);
            }
            clearAllSelections();
            loadDocuments();
            loadStats();
        });
    }
    
    if (lockModalConfirmBtn) {
        lockModalConfirmBtn.addEventListener('click', () => {
            if (currentLockDocId && isAdmin) {
                const comments = lockComment ? lockComment.value : '';
                confirmLockDocument(currentLockDocId, comments);
                closeLockModal();
            } else if (!isAdmin) {
                showToast('Only Administrators can lock documents.', true);
                closeLockModal();
            }
        });
    }
    
    async function performValidate(docId, comments) {
        if (!isAdmin) {
            showToast('Only Administrators can validate documents.', true);
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/approvals/${docId}/validate`, {
                method: 'POST',
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Validation failed');
            showToast(data.msg || 'Document validated successfully.');
            updateDocumentStatus(parseInt(docId), 'validated');
            loadStats();
        } catch (err) {
            showErrorModal('Failed to validate document: ' + err.message);
        }
    }
    
    async function performApprove(docId, comments) {
        try {
            const response = await fetch(`${API_BASE}/api/approvals/${docId}/approve`, {
                method: 'POST',
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Approval failed');
            showToast(data.msg || 'Document approved successfully.');
            updateDocumentStatus(parseInt(docId), 'approved');
            loadStats();
        } catch (err) {
            showErrorModal('Failed to approve document: ' + err.message);
        }
    }
    
    async function performReject(docId, reason, silent = false) {
        try {
            console.log('performReject called with docId:', docId, 'reason:', reason);
            
            const response = await fetch(`${API_BASE}/api/approvals/${docId}/reject`, {
                method: 'POST',
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            
            console.log('Rejection response status:', response.status);
            
            const data = await response.json();
            console.log('Rejection response data:', data);
            
            if (!response.ok) throw new Error(data.msg || 'Failed to reject');
            if (!silent) showToast('Document rejected successfully.');
            updateDocumentStatus(docId, 'rejected');
            loadStats();
            return true;
        } catch (err) {
            console.error('Rejection error:', err);
            if (!silent) showErrorModal(err.message || 'Failed to reject document');
            return false;
        }
    }
    
    async function confirmLockDocument(docId, comments) {
        if (!isAdmin) {
            showToast('Only Administrators can lock documents.', true);
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/approvals/${docId}/lock`, {
                method: 'POST',
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Lock failed');
            showToast(data.msg || 'Document locked successfully.');
            updateDocumentStatus(parseInt(docId), 'locked');
            loadStats();
        } catch (err) {
            showErrorModal('Failed to lock document: ' + err.message);
        }
    }
    
    async function handleUnlock(docId) {
        if (!confirm('Unlock this document? It will return to approved status.')) return;
        try {
            const response = await fetch(`${API_BASE}/api/approvals/${docId}/unlock`, {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Unlock failed');
            showToast(data.msg || 'Document unlocked successfully.');
            updateDocumentStatus(parseInt(docId), 'approved');
            loadStats();
        } catch (err) {
            showErrorModal('Failed to unlock document: ' + err.message);
        }
    }
    
    async function handleDelete(docId) {
        if (!confirm('Delete this document? This action cannot be undone.')) return;
        try {
            const response = await fetch(`${API_BASE}/api/documents/${docId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Failed to delete');
            showToast('Document deleted successfully.');
            loadDocuments();
            loadStats();
        } catch (err) {
            showErrorModal(err.message);
        }
    }
    
    async function handleComments(docId) {
        try {
            const response = await fetch(`${API_BASE}/api/documents/${docId}/comments`, {
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            const doc = allDocuments.find(d => d.id == docId);
            openCommentsModal(doc, data.comments || []);
        } catch (err) {
            showErrorModal('Failed to load comments');
        }
    }
    
    function openCommentsModal(doc, comments) {
        const commentsModal = document.getElementById('commentsModal');
        const commentsDocTitle = document.getElementById('commentsDocTitle');
        const commentsDocDate = document.getElementById('commentsDocDate');
        const commentsListContainer = document.getElementById('commentsListContainer');
        
        if (!commentsModal) return;
        
        if (commentsDocTitle) commentsDocTitle.textContent = doc?.title || 'Unknown';
        if (commentsDocDate) commentsDocDate.textContent = doc?.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A';
        
        if (commentsListContainer) {
            if (comments.length === 0) {
                commentsListContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No comments found</div>';
            } else {
                commentsListContainer.innerHTML = comments.map(c => {
                    const date = new Date(c.created_at).toLocaleString();
                    const reviewer = c.reviewer_name || 'Reviewer';
                    const text = c.reason || c.comments || 'No comment provided';
                    return `
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-reviewer">${escapeHtml(reviewer)}</span>
                                <span class="comment-date">${date}</span>
                            </div>
                            <div class="comment-text">${escapeHtml(text)}</div>
                        </div>
                    `;
                }).join('');
            }
        }
        
        commentsModal.classList.remove('hidden');
        setTimeout(() => commentsModal.classList.add('active'), 10);
    }
    
    function closeCommentsModal() {
        const commentsModal = document.getElementById('commentsModal');
        if (!commentsModal) return;
        commentsModal.classList.remove('active');
        setTimeout(() => commentsModal.classList.add('hidden'), 300);
    }
    
    const closeCommentsModalBtn = document.getElementById('closeCommentsModal');
    const closeCommentsBtn = document.getElementById('closeCommentsBtn');
    if (closeCommentsModalBtn) closeCommentsModalBtn.addEventListener('click', closeCommentsModal);
    if (closeCommentsBtn) closeCommentsBtn.addEventListener('click', closeCommentsModal);
    
    const commentsModal = document.getElementById('commentsModal');
    if (commentsModal) {
        commentsModal.addEventListener('click', e => {
            if (e.target === commentsModal) closeCommentsModal();
        });
    }
    
    function updateDocumentStatus(docId, newStatus) {
        const doc = allDocuments.find(d => d.id === docId);
        if (doc) {
            doc.workflow_status = newStatus;
            applyFilters();
        }
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    function getActionButtons(doc) {
        const status = doc.workflow_status;
        const fileUrl = doc.file_url ? `${API_BASE}${doc.file_url}` : '#';
        
        let buttons = `<button class="btn-view text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded" data-id="${doc.id}" data-url="${fileUrl}" data-title="${doc.title}">View</button>`;

        if (status === 'pending' || status === 'draft') {
            // Only Admin can validate
            if (isAdmin) {
                buttons += ` <button class="btn-validate text-xs px-2 py-1 bg-blue-100 border border-blue-300 rounded text-blue-700" data-id="${doc.id}" data-title="${doc.title}">Validate</button>`;
            }
            // Both Admin and Dean can reject
            buttons += ` <button class="btn-reject text-xs px-2 py-1 bg-red-100 border border-red-300 rounded text-red-700" data-id="${doc.id}" data-title="${doc.title}">Reject</button>`;
        } else if (status === 'validated') {
            // Both Admin and Dean can approve
            buttons += ` <button class="btn-approve text-xs px-2 py-1 bg-green-100 border border-green-300 rounded text-green-700" data-id="${doc.id}" data-title="${doc.title}">Approve</button>`;
            // Both Admin and Dean can reject
            buttons += ` <button class="btn-reject text-xs px-2 py-1 bg-red-100 border border-red-300 rounded text-red-700" data-id="${doc.id}" data-title="${doc.title}">Reject</button>`;
        } else if (status === 'approved') {
            // Only Admin can lock
            if (isAdmin) {
                buttons += ` <button class="btn-lock text-xs px-2 py-1 bg-purple-100 border border-purple-300 rounded text-purple-700" data-id="${doc.id}" data-title="${doc.title}">Lock</button>`;
            }
        } else if (status === 'locked' && isAdmin) {
            // Only Admin can unlock
            buttons += ` <button class="btn-unlock text-xs px-2 py-1 bg-orange-100 border border-orange-300 rounded text-orange-700" data-id="${doc.id}">Unlock</button>`;
        } else if (status === 'rejected') {
            buttons += ` <button class="btn-comments text-xs px-2 py-1 bg-blue-100 border border-blue-300 rounded text-blue-700" data-id="${doc.id}">Comments</button>`;
            buttons += ` <button class="btn-delete text-xs px-2 py-1 bg-red-100 border border-red-300 rounded text-red-700" data-id="${doc.id}">Delete</button>`;
        }

        return buttons;
    }
    
    function getMobileActionButtons(doc) {
        const status = doc.workflow_status;
        const fileUrl = doc.file_url ? `${API_BASE}${doc.file_url}` : '#';
        
        let buttons = `<button class="btn-view text-xs px-2 py-1 bg-teal-600 text-white rounded" data-id="${doc.id}" data-url="${fileUrl}" data-title="${doc.title}">View</button>`;

        if (status === 'pending' || status === 'draft') {
            if (isAdmin) {
                buttons += ` <button class="btn-validate text-xs px-2 py-1 bg-blue-600 text-white rounded" data-id="${doc.id}" data-title="${doc.title}">Validate</button>`;
            }
            buttons += ` <button class="btn-reject text-xs px-2 py-1 bg-red-600 text-white rounded" data-id="${doc.id}" data-title="${doc.title}">Reject</button>`;
        } else if (status === 'validated') {
            buttons += ` <button class="btn-approve text-xs px-2 py-1 bg-green-600 text-white rounded" data-id="${doc.id}" data-title="${doc.title}">Approve</button>`;
            buttons += ` <button class="btn-reject text-xs px-2 py-1 bg-red-600 text-white rounded" data-id="${doc.id}" data-title="${doc.title}">Reject</button>`;
        } else if (status === 'approved') {
            if (isAdmin) {
                buttons += ` <button class="btn-lock text-xs px-2 py-1 bg-purple-600 text-white rounded" data-id="${doc.id}" data-title="${doc.title}">Lock</button>`;
            }
        } else if (status === 'locked' && isAdmin) {
            buttons += ` <button class="btn-unlock text-xs px-2 py-1 bg-orange-600 text-white rounded" data-id="${doc.id}">Unlock</button>`;
        } else if (status === 'rejected') {
            buttons += ` <button class="btn-comments text-xs px-2 py-1 bg-blue-600 text-white rounded" data-id="${doc.id}">Comments</button>`;
            buttons += ` <button class="btn-delete text-xs px-2 py-1 bg-red-600 text-white rounded" data-id="${doc.id}">Delete</button>`;
        }

        return buttons;
    }
    
    function renderDocuments() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageDocuments = filteredDocuments.slice(start, end);

        if (pageDocuments.length === 0) {
            approvalsList.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-gray-500">No documents found</td></tr>';
            mobileApprovalsList.innerHTML = '<div class="p-4 text-center text-gray-500">No documents found</div>';
            return;
        }

        // Desktop view
        approvalsList.innerHTML = pageDocuments.map(doc => {
            const stds = Array.isArray(doc.standards) && doc.standards.length
                ? doc.standards.map(s => `<span class="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-1.5 py-0.5 rounded">${escapeHtml(s)}</span>`).join(' ')
                : '<span class="text-gray-400 text-xs">—</span>';
            return `
            <tr class="approval-item hover:bg-gray-50 transition" data-id="${doc.id}" data-stage="${getWorkflowStage(doc.workflow_status)}" data-status="${doc.workflow_status}">
                <td class="py-3 px-4"><input type="checkbox" class="doc-checkbox rounded border-gray-300 text-teal-600" data-id="${doc.id}"></td>
                <td class="py-3 px-4">
                    <div class="font-medium text-gray-800">${escapeHtml(doc.title)}</div>
                    <div class="text-xs text-gray-400">by ${escapeHtml(doc.author_name || 'Unknown')} · ${new Date(doc.created_at).toLocaleDateString()}</div>
                </td>
                <td class="py-3 px-4"><span class="badge-${doc.category || 'other'} px-2 py-1 rounded-full text-xs">${escapeHtml((doc.category_name || doc.category || 'N/A').toUpperCase())}</span></td>
                <td class="py-3 px-4"><div class="flex flex-wrap gap-1">${stds}</div></td>
                <td class="py-3 px-4"><span class="badge-department px-2 py-1 rounded-full text-xs font-semibold">${escapeHtml(doc.department_code || 'N/A')}</span></td>
                <td class="py-3 px-4"><span class="${getStatusBadge(doc.workflow_status)} px-2 py-1 rounded-full text-xs font-medium">${getStatusText(doc.workflow_status)}</span></td>
                <td class="py-3 px-4 text-gray-600">${escapeHtml(doc.version || 'v1.0')}</td>
                <td class="py-3 px-4"><div class="flex flex-wrap gap-2">${getActionButtons(doc)}</div></td>
            </tr>
        `}).join('');

        // Mobile view
        mobileApprovalsList.innerHTML = pageDocuments.map(doc => {
            const stds = Array.isArray(doc.standards) && doc.standards.length
                ? doc.standards.map(s => `<span class="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-1.5 py-0.5 rounded">${escapeHtml(s)}</span>`).join(' ')
                : '<span class="text-gray-400 text-xs">—</span>';
            return `
            <div class="border rounded-lg p-4 bg-white" data-id="${doc.id}">
                <div class="flex items-start gap-2 mb-2">
                    <input type="checkbox" class="doc-checkbox mt-1 rounded border-gray-300 text-teal-600" data-id="${doc.id}">
                    <div class="flex-1">
                        <div class="font-medium text-gray-800">${escapeHtml(doc.title)}</div>
                        <div class="text-xs text-gray-400">by ${escapeHtml(doc.author_name || 'Unknown')} · ${new Date(doc.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 mb-2">
                    <span class="badge-${doc.category || 'other'} px-2 py-1 rounded-full text-xs">${escapeHtml((doc.category_name || doc.category || 'N/A').toUpperCase())}</span>
                    <span class="badge-department px-2 py-1 rounded-full text-xs font-semibold">${escapeHtml(doc.department_code || 'N/A')}</span>
                    <span class="${getStatusBadge(doc.workflow_status)} px-2 py-1 rounded-full text-xs font-medium">${getStatusText(doc.workflow_status)}</span>
                </div>
                <div class="flex flex-wrap gap-1 mb-2">${stds}</div>
                <div class="text-sm text-gray-600 mb-3">${escapeHtml(doc.version || 'v1.0')}</div>
                <div class="flex flex-wrap gap-2">${getMobileActionButtons(doc)}</div>
            </div>
        `}).join('');

        attachActionHandlers();
    }
    
    function renderPagination() {
        const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, filteredDocuments.length);

        paginationInfo.textContent = `Showing ${start} to ${end} of ${filteredDocuments.length}`;

        let buttons = '';
        buttons += `<button class="px-3 py-1 bg-white border rounded-lg text-gray-600 text-sm hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;
        
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const active = i === currentPage ? 'bg-teal-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50';
            buttons += `<button class="px-3 py-1 ${active} rounded-lg text-sm" data-page="${i}">${i}</button>`;
        }
        
        buttons += `<button class="px-3 py-1 bg-white border rounded-lg text-gray-600 text-sm hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;

        paginationButtons.innerHTML = buttons;

        paginationButtons.querySelectorAll('button:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-page');
                if (page === 'prev' && currentPage > 1) currentPage--;
                else if (page === 'next' && currentPage < totalPages) currentPage++;
                else if (!isNaN(page)) currentPage = parseInt(page);
                renderDocuments();
                renderPagination();
                updateSelectedCount();
            });
        });
    }
    
    function getSelectedDocumentIds() {
        const checkboxes = document.querySelectorAll('.doc-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-id')));
    }
    
    function updateSelectedCount() {
        const selectedIds = getSelectedDocumentIds();
        if (selectedCountSpan) selectedCountSpan.textContent = `${selectedIds.length} selected`;
        
        if (selectAllCheckbox) {
            const allCheckboxes = document.querySelectorAll('.doc-checkbox');
            if (allCheckboxes.length > 0) {
                const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
                selectAllCheckbox.indeterminate = !allChecked && selectedIds.length > 0;
            }
        }
    }
    
    function clearAllSelections() {
        const checkboxes = document.querySelectorAll('.doc-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        updateSelectedCount();
    }
    
    async function performBulkAction() {
        const action = bulkActionSelect.value;
        if (!action) {
            showToast('Please select an action to perform', true);
            return;
        }
        
        const selectedIds = getSelectedDocumentIds();
        if (selectedIds.length === 0) {
            showToast('Please select at least one document', true);
            return;
        }
        
        if (action === 'reject') {
            openBulkRejectionModal(selectedIds);
            return;
        }
        
        if (action === 'validate' && !isAdmin) {
            showToast('Only Administrators can perform bulk validation.', true);
            return;
        }
        
        if (action === 'lock' && !isAdmin) {
            showToast('Only Administrators can lock documents.', true);
            return;
        }
        
        if (action === 'validate') {
            showToast('Please use the individual Validate buttons for each document.', true);
            return;
        }
        
        if (action === 'approve') {
            showToast('Please use the individual Approve buttons for each document.', true);
            return;
        }
        
        const actionNames = {
            'lock': 'lock',
            'unlock': 'unlock'
        };
        
        if (!confirm(`Are you sure you want to ${actionNames[action]} ${selectedIds.length} document(s)?`)) return;
        
        let successCount = 0;
        let failCount = 0;
        
        for (const docId of selectedIds) {
            try {
                let response;
                if (action === 'unlock') {
                    response = await fetch(`${API_BASE}/api/approvals/${docId}/unlock`, {
                        method: 'POST',
                        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
                    });
                } else {
                    continue;
                }
                
                const data = await response.json();
                if (response.ok) {
                    successCount++;
                    updateDocumentStatus(docId, action === 'unlock' ? 'approved' : doc.workflow_status);
                } else {
                    failCount++;
                }
            } catch (err) {
                failCount++;
            }
        }
        
        if (failCount === 0) {
            showToast(`Successfully ${actionNames[action]}ed ${successCount} document(s).`);
        } else {
            showToast(`${actionNames[action]}ed ${successCount} documents, ${failCount} failed.`, true);
        }
        
        clearAllSelections();
        loadStats();
        loadDocuments();
    }
    
    function attachActionHandlers() {
        // View buttons
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const url = btn.getAttribute('data-url');
                const title = btn.getAttribute('data-title');
                openPreviewModal(url, title);
            });
        });
        
        // Validate buttons - open modal (Admin only)
        document.querySelectorAll('.btn-validate').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!isAdmin) {
                    showToast('Only Administrators can validate documents.', true);
                    return;
                }
                const docId = btn.getAttribute('data-id');
                const title = btn.getAttribute('data-title');
                openValidateModal(docId, title);
            });
        });
        
        // Approve buttons - open modal (Dean and Admin)
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-id');
                const title = btn.getAttribute('data-title');
                openApproveModal(docId, title);
            });
        });
        
        // Lock buttons (Admin only)
        document.querySelectorAll('.btn-lock').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!isAdmin) {
                    showToast('Only Administrators can lock documents.', true);
                    return;
                }
                const docId = btn.getAttribute('data-id');
                const title = btn.getAttribute('data-title');
                openLockModal(docId, title);
            });
        });
        
        // Unlock buttons
        document.querySelectorAll('.btn-unlock').forEach(btn => {
            btn.addEventListener('click', () => handleUnlock(btn.getAttribute('data-id')));
        });
        
        // Reject buttons
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = parseInt(btn.getAttribute('data-id'));
                console.log('Reject button clicked for document ID:', docId);
                const doc = allDocuments.find(d => d.id === docId || d.id === String(docId));
                console.log('Found document:', doc);
                if (doc) {
                    openRejectionModal(doc);
                } else {
                    console.error('Document not found in allDocuments array');
                    showErrorModal('Document not found. Please refresh the page and try again.');
                }
            });
        });
        
        // Comments buttons
        document.querySelectorAll('.btn-comments').forEach(btn => {
            btn.addEventListener('click', () => handleComments(btn.getAttribute('data-id')));
        });
        
        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => handleDelete(btn.getAttribute('data-id')));
        });
        
        // Checkbox event listeners for bulk actions
        document.querySelectorAll('.doc-checkbox').forEach(cb => {
            cb.removeEventListener('change', updateSelectedCount);
            cb.addEventListener('change', updateSelectedCount);
        });
    }
    
    // Event listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (workflowStage) workflowStage.addEventListener('change', applyFilters);
    if (approvalStatus) approvalStatus.addEventListener('change', applyFilters);
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        loadStats();
        loadDocuments();
    });
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.doc-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateSelectedCount();
        });
    }
    if (applyBulkBtn) applyBulkBtn.addEventListener('click', performBulkAction);
    
    // Tab switching
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            currentTab = this.getAttribute('data-tab');
            
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            applyFilters();
        });
    });
    
    // Mobile sidebar
    setupMobileSidebar();
    
    // Heartbeat to keep session alive
    function sendHeartbeat() {
        if (token) {
            fetch(`${API_BASE}/api/user/heartbeat`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            }).catch(() => {});
        }
    }
    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 2 * 60 * 1000);
    }
});

function setupMobileSidebar() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('mainSidebar');
    
    if (!menuToggle || !sidebar) return;
    
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
    
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    
    overlay.addEventListener('click', closeSidebar);
    
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeSidebar();
    });
}
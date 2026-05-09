// Bulk Action Modal Component
// Shared between approvals.js and user-approvals.js

function createBulkActionModal() {
    const modal = document.createElement('div');
    modal.id = 'bulkActionModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[9999] hidden items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div class="flex items-center justify-between p-5 border-b bg-gradient-to-r from-teal-50 to-blue-50">
                <div>
                    <h3 id="bulkModalTitle" class="text-xl font-bold text-gray-800">Bulk Action</h3>
                    <p id="bulkModalSubtitle" class="text-sm text-gray-600 mt-1">Review and confirm your action</p>
                </div>
                <button id="bulkModalClose" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <!-- Action Summary -->
                <div id="bulkActionSummary" class="mb-6 p-4 rounded-lg border-l-4"></div>
                
                <!-- Documents List -->
                <div class="mb-4">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                        <span>Selected Documents (<span id="bulkDocCount">0</span>)</span>
                        <button id="toggleDocList" class="text-teal-600 text-xs hover:underline">Show All</button>
                    </h4>
                    <div id="bulkDocumentsList" class="space-y-2 max-h-64 overflow-y-auto"></div>
                </div>
                
                <!-- Comments Section (for actions that need it) -->
                <div id="bulkCommentsSection" class="hidden">
                    <label for="bulkActionComment" class="block text-sm font-semibold text-gray-700 mb-2">
                        <span id="bulkCommentLabel">Comments</span>
                        <span id="bulkCommentRequired" class="text-red-500 hidden">*</span>
                    </label>
                    <textarea id="bulkActionComment" rows="4" 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        placeholder="Enter your comments here..."></textarea>
                    <p id="bulkCommentHint" class="text-xs text-gray-500 mt-1"></p>
                </div>
            </div>
            
            <div class="flex justify-between items-center gap-3 p-5 border-t bg-gray-50">
                <div class="text-xs text-gray-500">
                    <span id="bulkActionWarning"></span>
                </div>
                <div class="flex gap-3">
                    <button id="bulkModalCancel" class="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                        Cancel
                    </button>
                    <button id="bulkModalConfirm" class="px-5 py-2.5 text-white rounded-lg hover:opacity-90 transition text-sm font-medium">
                        Confirm Action
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

class BulkActionModalManager {
    constructor() {
        this.modal = createBulkActionModal();
        this.isExpanded = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = this.modal.querySelector('#bulkModalClose');
        const cancelBtn = this.modal.querySelector('#bulkModalCancel');
        const toggleBtn = this.modal.querySelector('#toggleDocList');
        
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        toggleBtn.addEventListener('click', () => this.toggleDocumentList());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    open(config) {
        const {
            action,
            documents,
            onConfirm,
            requiresComment = false,
            commentLabel = 'Comments',
            commentPlaceholder = 'Enter your comments here...',
            commentHint = ''
        } = config;

        this.config = config;
        this.onConfirm = onConfirm;

        // Set title and subtitle
        const titles = {
            validate: { title: 'Bulk Validate Documents', subtitle: 'Confirm validation for selected documents', color: 'blue' },
            approve: { title: 'Bulk Approve Documents', subtitle: 'Confirm approval for selected documents', color: 'green' },
            reject: { title: 'Bulk Reject Documents', subtitle: 'Provide rejection reason for selected documents', color: 'red' },
            lock: { title: 'Bulk Lock Documents', subtitle: 'Finalize and lock selected documents', color: 'purple' },
            unlock: { title: 'Bulk Unlock Documents', subtitle: 'Unlock selected documents', color: 'orange' }
        };

        const actionConfig = titles[action] || { title: 'Bulk Action', subtitle: '', color: 'gray' };
        
        this.modal.querySelector('#bulkModalTitle').textContent = actionConfig.title;
        this.modal.querySelector('#bulkModalSubtitle').textContent = actionConfig.subtitle;

        // Set action summary
        this.renderActionSummary(action, documents.length, actionConfig.color);

        // Render documents list
        this.renderDocumentsList(documents);

        // Handle comments section
        const commentsSection = this.modal.querySelector('#bulkCommentsSection');
        const commentRequired = this.modal.querySelector('#bulkCommentRequired');
        const commentLabelElem = this.modal.querySelector('#bulkCommentLabel');
        const commentTextarea = this.modal.querySelector('#bulkActionComment');
        const commentHintElem = this.modal.querySelector('#bulkCommentHint');

        if (requiresComment || action === 'reject') {
            commentsSection.classList.remove('hidden');
            commentRequired.classList.toggle('hidden', !requiresComment && action !== 'reject');
            commentLabelElem.textContent = commentLabel;
            commentTextarea.placeholder = commentPlaceholder;
            commentHintElem.textContent = commentHint;
            commentTextarea.value = '';
        } else {
            commentsSection.classList.add('hidden');
        }

        // Set confirm button style and text
        const confirmBtn = this.modal.querySelector('#bulkModalConfirm');
        const colorMap = {
            blue: 'bg-blue-600 hover:bg-blue-700',
            green: 'bg-green-600 hover:bg-green-700',
            red: 'bg-red-600 hover:bg-red-700',
            purple: 'bg-purple-600 hover:bg-purple-700',
            orange: 'bg-orange-600 hover:bg-orange-700',
            gray: 'bg-gray-600 hover:bg-gray-700'
        };
        confirmBtn.className = `px-5 py-2.5 text-white rounded-lg transition text-sm font-medium ${colorMap[actionConfig.color]}`;
        confirmBtn.textContent = `${actionConfig.title.replace('Bulk ', '')}`;

        // Set warning text
        const warningTexts = {
            validate: 'Documents will move to approval stage',
            approve: 'Documents will be marked as approved',
            reject: 'Documents will be returned to authors',
            lock: 'This action will finalize documents',
            unlock: 'Documents will return to approved status'
        };
        this.modal.querySelector('#bulkActionWarning').textContent = warningTexts[action] || '';

        // Setup confirm handler
        confirmBtn.onclick = () => this.handleConfirm();

        // Show modal
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    renderActionSummary(action, count, color) {
        const summaryDiv = this.modal.querySelector('#bulkActionSummary');
        const icons = {
            validate: '✓',
            approve: '✓',
            reject: '✕',
            lock: '🔒',
            unlock: '🔓'
        };
        const messages = {
            validate: `You are about to validate ${count} document${count > 1 ? 's' : ''}. They will proceed to the approval stage.`,
            approve: `You are about to approve ${count} document${count > 1 ? 's' : ''}. They will be ready for locking.`,
            reject: `You are about to reject ${count} document${count > 1 ? 's' : ''}. They will be returned to the authors with your comments.`,
            lock: `You are about to lock ${count} document${count > 1 ? 's' : ''}. This will finalize them and prevent further modifications.`,
            unlock: `You are about to unlock ${count} document${count > 1 ? 's' : ''}. They will return to approved status.`
        };

        const colorClasses = {
            blue: 'bg-blue-50 border-blue-400 text-blue-800',
            green: 'bg-green-50 border-green-400 text-green-800',
            red: 'bg-red-50 border-red-400 text-red-800',
            purple: 'bg-purple-50 border-purple-400 text-purple-800',
            orange: 'bg-orange-50 border-orange-400 text-orange-800'
        };

        summaryDiv.className = `mb-6 p-4 rounded-lg border-l-4 ${colorClasses[color]}`;
        summaryDiv.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-2xl">${icons[action]}</span>
                <div class="flex-1">
                    <p class="text-sm font-medium">${messages[action]}</p>
                </div>
            </div>
        `;
    }

    renderDocumentsList(documents) {
        const listDiv = this.modal.querySelector('#bulkDocumentsList');
        const countSpan = this.modal.querySelector('#bulkDocCount');
        countSpan.textContent = documents.length;

        const displayDocs = this.isExpanded ? documents : documents.slice(0, 3);
        
        listDiv.innerHTML = displayDocs.map(doc => `
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="w-8 h-8 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                    ${doc.category ? doc.category.substring(0, 2).toUpperCase() : 'DOC'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${doc.title}</p>
                    <div class="flex flex-wrap gap-2 mt-1">
                        <span class="text-xs text-gray-500">${doc.author_name || 'Unknown Author'}</span>
                        <span class="text-xs text-gray-400">•</span>
                        <span class="text-xs text-gray-500">${doc.department_code || 'N/A'}</span>
                        <span class="text-xs text-gray-400">•</span>
                        <span class="text-xs px-2 py-0.5 rounded-full ${this.getStatusBadgeClass(doc.workflow_status)}">
                            ${this.getStatusText(doc.workflow_status)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        // Update toggle button
        const toggleBtn = this.modal.querySelector('#toggleDocList');
        if (documents.length > 3) {
            toggleBtn.textContent = this.isExpanded ? 'Show Less' : `Show All (${documents.length})`;
            toggleBtn.classList.remove('hidden');
        } else {
            toggleBtn.classList.add('hidden');
        }
    }

    toggleDocumentList() {
        this.isExpanded = !this.isExpanded;
        this.renderDocumentsList(this.config.documents);
    }

    getStatusBadgeClass(status) {
        const classes = {
            draft: 'bg-gray-100 text-gray-700',
            pending: 'bg-amber-100 text-amber-700',
            validated: 'bg-blue-100 text-blue-700',
            approved: 'bg-green-100 text-green-700',
            locked: 'bg-purple-100 text-purple-700',
            rejected: 'bg-red-100 text-red-700'
        };
        return classes[status] || 'bg-gray-100 text-gray-700';
    }

    getStatusText(status) {
        const texts = {
            draft: 'Draft',
            pending: 'Pending',
            validated: 'Validated',
            approved: 'Approved',
            locked: 'Locked',
            rejected: 'Rejected'
        };
        return texts[status] || status;
    }

    handleConfirm() {
        const commentTextarea = this.modal.querySelector('#bulkActionComment');
        const comment = commentTextarea.value.trim();
        
        // Validate required comment for reject action
        if ((this.config.requiresComment || this.config.action === 'reject') && !comment) {
            commentTextarea.classList.add('border-red-500', 'ring-2', 'ring-red-200');
            commentTextarea.focus();
            setTimeout(() => {
                commentTextarea.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
            }, 2000);
            return;
        }

        if (this.onConfirm) {
            this.onConfirm(comment);
        }
        this.close();
    }

    close() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        this.isExpanded = false;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BulkActionModalManager;
}

// js/evaluator-documents.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Documents JS loaded');

    // View document buttons
    const viewButtons = document.querySelectorAll('.view-doc');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const docName = row?.querySelector('.font-medium')?.textContent || 'Document';
            const category = row?.querySelector('.bg-teal-100, .bg-amber-100, .bg-indigo-100')?.textContent || 'Category';
            
            alert(`📄 Document Viewer (View-Only Mode)\n\nDocument: ${docName}\nCategory: ${category}\n\nThis would open the complete document for review. As an External Evaluator, you have full view access.`);
        });
    });

    // Filter input is disabled (view-only)
    const filterInput = document.getElementById('filterDocuments');
    if (filterInput) {
        filterInput.addEventListener('click', function() {
            alert('🔍 Filtering is disabled in view-only mode. All documents are visible for review.');
        });
    }

    // Pagination buttons
    const paginationBtns = document.querySelectorAll('.pagination-btn, .flex.gap-2 button');
    paginationBtns.forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', function() {
                if (this.textContent === 'Previous' || this.textContent === 'Next') {
                    alert(`📑 ${this.textContent} page would load more documents for review.`);
                } else if (this.textContent.match(/^\d+$/)) {
                    // Simulate page change
                    paginationBtns.forEach(b => {
                        if (b.textContent.match(/^\d+$/)) {
                            b.classList.remove('bg-teal-700', 'text-white');
                            b.classList.add('bg-white', 'border', 'text-gray-600');
                        }
                    });
                    this.classList.add('bg-teal-700', 'text-white');
                    alert(`📑 Loading page ${this.textContent} of documents...`);
                }
            });
        }
    });

    // Table row hover effect (just for visual feedback)
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.classList.add('bg-gray-50');
        });
        row.addEventListener('mouseleave', function() {
            this.classList.remove('bg-gray-50');
        });
    });

    // Document count display
    const updateDocumentCount = () => {
        const totalDocs = document.querySelectorAll('tbody tr').length;
        const countDisplay = document.querySelector('.text-sm.text-gray-500');
        if (countDisplay && countDisplay.textContent.includes('Showing')) {
            // Already has correct count
        }
    };

    // Simulate document loading
    console.log('All documents loaded for review');
    updateDocumentCount();

    // Disabled select clicks
    const disabledSelects = document.querySelectorAll('select:disabled');
    disabledSelects.forEach(select => {
        select.addEventListener('click', function() {
            alert('❌ Filters are disabled in view-only mode. You can view all documents without filtering.');
        });
    });

    // Any attempt to interact with documents in edit mode
    document.addEventListener('click', function(e) {
        if (e.target.closest('button')?.textContent.includes('Edit') ||
            e.target.closest('button')?.textContent.includes('Delete') ||
            e.target.closest('button')?.textContent.includes('Upload')) {
            e.preventDefault();
            alert('❌ Edit/Delete/Upload actions are disabled. You have view-only access.');
        }
    });

    // View all link in header (if exists)
    const viewAllLink = document.querySelector('a[href="#"]');
    if (viewAllLink && viewAllLink.textContent.includes('View All')) {
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('📋 Showing all documents for review.');
        });
    }
});
// Shared logout modal functionality
(function() {
    'use strict';

    // Create modal HTML if it doesn't exist
    function createLogoutModal() {
        if (document.getElementById('logoutModal')) return;

        const modalHTML = `
            <div id="logoutModal" class="fixed inset-0 hidden items-center justify-center z-[9999]">
                <div class="absolute inset-0 bg-slate-900/50"></div>
                <div class="relative bg-white w-[92vw] max-w-md rounded-2xl shadow-2xl p-6 mx-4">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">Confirm Logout</h3>
                            <p class="text-sm text-gray-500 mt-1">Are you sure you want to end your session?</p>
                        </div>
                        <button id="closeLogoutModal" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <p class="text-sm text-amber-700">You will be redirected to the login page and will need to sign in again to access the system.</p>
                    </div>

                    <div class="flex justify-end gap-3">
                        <button id="cancelLogoutBtn" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                            Cancel
                        </button>
                        <button id="confirmLogoutBtn" class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Show logout modal
    function showLogoutModal() {
        const modal = document.getElementById('logoutModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    // Hide logout modal
    function hideLogoutModal() {
        const modal = document.getElementById('logoutModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    // Perform logout
    function performLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminProfile');
        window.location.href = 'landing.html';
    }

    // Initialize logout modal
    function initLogoutModal() {
        createLogoutModal();

        // Close modal handlers
        const closeBtn = document.getElementById('closeLogoutModal');
        const cancelBtn = document.getElementById('cancelLogoutBtn');
        const confirmBtn = document.getElementById('confirmLogoutBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', hideLogoutModal);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', hideLogoutModal);
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', performLogout);
        }

        // Close on outside click
        const modal = document.getElementById('logoutModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    hideLogoutModal();
                }
            });
        }
    }

    // Attach logout handler to button (prevents duplicate handlers)
    function attachLogoutHandler(buttonId) {
        const button = document.getElementById(buttonId);
        if (button && !button.dataset.logoutHandlerAttached) {
            button.dataset.logoutHandlerAttached = 'true';
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showLogoutModal();
            });
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLogoutModal);
    } else {
        initLogoutModal();
    }

    // Expose global function
    window.initLogout = function(buttonId = 'logoutBtn') {
        attachLogoutHandler(buttonId);
    };

    // Auto-attach to common logout button IDs
    window.addEventListener('load', function() {
        attachLogoutHandler('logoutBtn');
    });
})();

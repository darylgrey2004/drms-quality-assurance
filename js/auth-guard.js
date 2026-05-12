// auth-guard.js - Centralized Authentication Security
// This file MUST be loaded on every protected page

(function() {
    'use strict';
    
    // List of public pages that don't require authentication
    const PUBLIC_PAGES = [
        'landing.html',
        'registration.html',
        'forgot-password.html'
    ];
    
    // Get current page name
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check if current page is public
    const isPublicPage = PUBLIC_PAGES.some(page => currentPage.includes(page));
    
    // Function to check if page is accessed via file protocol
    function isFileProtocol() {
        return window.location.protocol === 'file:';
    }
    
    // Function to check if user is authenticated
    function isAuthenticated() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            return false;
        }
        
        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000; // Convert to milliseconds
            
            if (Date.now() >= exp) {
                console.warn('[AUTH-GUARD] Token expired');
                return false;
            }
            
            return true;
        } catch (e) {
            console.error('[AUTH-GUARD] Invalid token format:', e);
            return false;
        }
    }
    
    // Function to check evaluator expiration via API
    async function checkEvaluatorExpiration() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = (user.role || '').toLowerCase().trim();
        
        if (userRole === 'evaluator' || userRole === 'external evaluator') {
            try {
                const response = await fetch(window.API_CONFIG?.getApiUrl('/api/user/profile') || '/api/user/profile', {
                    headers: { 'x-auth-token': token }
                });
                
                if (response.status === 403) {
                    const data = await response.json();
                    if (data.expired) {
                        console.warn('[AUTH-GUARD] Evaluator access expired');
                        return false;
                    }
                }
            } catch (e) {
                console.error('[AUTH-GUARD] Error checking evaluator expiration:', e);
            }
        }
        return true;
    }
    
    // Function to clear session and redirect to login
    function redirectToLogin(reason) {
        console.warn('[AUTH-GUARD] Redirecting to login:', reason);
        
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionToken');
        
        // Redirect to landing page
        window.location.href = 'landing.html';
    }
    
    // Main security check
    async function performSecurityCheck() {
        // Skip check for public pages
        if (isPublicPage) {
            console.log('[AUTH-GUARD] Public page - no authentication required');
            return;
        }
        
        // Check: Verify authentication
        if (!isAuthenticated()) {
            console.error('[AUTH-GUARD] No valid authentication - redirecting to login');
            redirectToLogin('Not authenticated');
            return;
        }
        
        // Check: Verify user object is valid
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id || !user.role) {
                console.error('[AUTH-GUARD] Invalid user object - redirecting to login');
                redirectToLogin('Invalid user data');
                return;
            }
        } catch (e) {
            console.error('[AUTH-GUARD] Failed to parse user object:', e);
            redirectToLogin('Corrupted user data');
            return;
        }
        
        // Check: Evaluator expiration
        const isValid = await checkEvaluatorExpiration();
        if (!isValid) {
            console.error('[AUTH-GUARD] Evaluator access expired - redirecting to login');
            alert('Your External Evaluator access has expired. Please contact the administrator.');
            redirectToLogin('Evaluator access expired');
            return;
        }
        
        console.log('[AUTH-GUARD] ✓ Security check passed');
    }
    
    // Run security check immediately
    performSecurityCheck();
    
    // Also check when page becomes visible (tab switching)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && !isPublicPage) {
            performSecurityCheck();
        }
    });
    
    // Check periodically (every 5 minutes)
    if (!isPublicPage) {
        setInterval(performSecurityCheck, 5 * 60 * 1000);
    }
    
    // Expose function for manual checks
    window.AUTH_GUARD = {
        check: performSecurityCheck,
        isAuthenticated: isAuthenticated,
        redirectToLogin: redirectToLogin
    };
    
    console.log('[AUTH-GUARD] Security module loaded');
})();

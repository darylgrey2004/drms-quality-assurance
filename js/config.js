// API Configuration - Dynamically determines the API base URL
const API_CONFIG = (() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const currentPort = window.location.port;
    
    // In production (deployed), use same host without port
    // In development (localhost), use port 3000 for API
    let apiBase;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Development: API runs on port 3000
        apiBase = `${protocol}//${hostname}:3000`;
    } else {
        // Production: API runs on same host (no port needed)
        apiBase = `${protocol}//${hostname}${currentPort ? ':' + currentPort : ''}`;
    }
    
    return {
        API_BASE: apiBase,
        getApiUrl: (endpoint) => `${apiBase}${endpoint}`
    };
})();

// Export for use in other files
window.API_CONFIG = API_CONFIG;

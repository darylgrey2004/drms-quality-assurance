// API Configuration - Dynamically determines the API base URL
const API_CONFIG = (() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // ALWAYS use port 3000 for API (Node.js backend)
    const apiPort = '3000';
    
    return {
        API_BASE: `${protocol}//${hostname}:${apiPort}`,
        getApiUrl: (endpoint) => `${protocol}//${hostname}:${apiPort}${endpoint}`
    };
})();

// Export for use in other files
window.API_CONFIG = API_CONFIG;

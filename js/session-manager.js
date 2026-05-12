// session-manager.js
// Centralized session management for multi-device tracking

class SessionManager {
  constructor() {
    this.sessionToken = localStorage.getItem('sessionToken');
    this.token = localStorage.getItem('token');
    this.API_BASE = window.API_CONFIG?.API_BASE || 'http://localhost:3000';
    this.heartbeatInterval = null;
  }

  /**
   * Store session token after login
   */
  setSession(sessionToken) {
    this.sessionToken = sessionToken;
    localStorage.setItem('sessionToken', sessionToken);
  }

  /**
   * Get current session token
   */
  getSessionToken() {
    return this.sessionToken || localStorage.getItem('sessionToken');
  }

  /**
   * Initialize heartbeat with session tracking
   */
  initializeHeartbeat(intervalMs = 2 * 60 * 1000) {
    if (!this.token) return;

    // Send first heartbeat immediately
    this.sendHeartbeat();

    // Then set up interval
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, intervalMs);
  }

  /**
   * Send heartbeat with session token
   */
  async sendHeartbeat() {
    const sessionToken = this.getSessionToken();
    
    try {
      const response = await fetch(`${this.API_BASE}/api/user/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': this.token
        },
        body: JSON.stringify({ sessionToken })
      });

      if (!response.ok) {
        console.warn('Heartbeat failed:', response.statusText);
      }
    } catch (err) {
      console.warn('Heartbeat error:', err.message);
    }
  }

  /**
   * Get all active sessions for current user
   */
  async getActiveSessions() {
    try {
      const response = await fetch(`${this.API_BASE}/api/user/sessions`, {
        method: 'GET',
        headers: {
          'x-auth-token': this.token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching sessions:', err.message);
      return null;
    }
  }

  /**
   * Logout from a specific session
   */
  async logoutSession(sessionToken) {
    try {
      const response = await fetch(`${this.API_BASE}/api/user/logout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': this.token
        },
        body: JSON.stringify({ sessionToken })
      });

      if (!response.ok) {
        throw new Error('Failed to logout from session');
      }

      return await response.json();
    } catch (err) {
      console.error('Error logging out from session:', err.message);
      return null;
    }
  }

  /**
   * Logout from all sessions
   */
  async logoutAllSessions() {
    try {
      const response = await fetch(`${this.API_BASE}/api/user/logout-all-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': this.token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to logout from all sessions');
      }

      return await response.json();
    } catch (err) {
      console.error('Error logging out from all sessions:', err.message);
      return null;
    }
  }

  /**
   * Clear session on logout
   */
  clearSession() {
    this.sessionToken = null;
    this.token = null;
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('token');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Create global instance
const sessionManager = new SessionManager();

# Multi-Session User Activity Tracking - Implementation Guide

## Overview

Your DRMS-QA application now has **multi-session user tracking**. This means the system can detect when users are logged in from different browsers or devices and track their activity separately.

## What Changed

### 1. Database Schema
- **New `sessions` table** created to track individual user sessions
  - Each login creates a unique session record
  - Stores browser info, device info, IP address, and last activity timestamp
  - Maintains session-level activity status

```sql
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  browser_info VARCHAR(255),           -- Browser name and version
  device_info VARCHAR(255),            -- OS name and version
  ip_address VARCHAR(45),              -- User's IP address
  lastActive DATETIME,                 -- Last activity in this session
  isActive BOOLEAN DEFAULT TRUE,       -- Whether session is still active
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### 2. Backend Changes

#### Auth Routes (`node/routes/auth.js`)
- **New session creation logic** on login and OTP verification
- Each successful login generates:
  - A unique `sessionToken` (32-byte hex string)
  - Browser information (Chrome, Firefox, Safari, etc.)
  - Device information (Windows, macOS, Linux, etc.)
  - IP address capture

#### User Routes (`node/routes/user.js`)
- **Updated heartbeat endpoint** to track per-session activity
  - `POST /api/user/heartbeat` now updates session's `lastActive` timestamp
  - Sends `sessionToken` with heartbeat to identify which session is active

- **New endpoints:**
  - `GET /api/user/sessions` - Get all active sessions for logged-in user
  - `POST /api/user/logout-session` - Logout from a specific session/browser
  - `POST /api/user/logout-all-sessions` - Logout from all sessions at once

### 3. Frontend Changes

#### New Session Manager (`js/session-manager.js`)
Centralized class for handling session operations:

```javascript
// Initialize heartbeat with session tracking
sessionManager.initializeHeartbeat(intervalMs);

// Get all active sessions
const data = await sessionManager.getActiveSessions();

// Logout from specific session
await sessionManager.logoutSession(sessionToken);

// Logout from all sessions
await sessionManager.logoutAllSessions();
```

#### Updated Pages
- **landing.html** - Stores session token after login
- **documents.html** - Uses session manager for heartbeats
- **approvals.html** - Uses session manager for heartbeats
- **audit-trail.html** - Uses session manager for heartbeats

#### Login Response Changes
When user logs in, the response now includes:
```json
{
  "token": "jwt-token",
  "sessionToken": "unique-session-token",
  "session": {
    "sessionToken": "unique-session-token",
    "browserInfo": "Chrome 125.0",
    "deviceInfo": "Windows 10",
    "ipAddress": "192.168.1.100"
  },
  "user": { ... }
}
```

## How It Works

### Multi-Browser Login Flow

```
User logs in Browser A (Chrome)
  ↓
Server creates Session #1 (Chrome, Windows, 192.168.1.100)
Returns sessionToken for Browser A
Browser A stores sessionToken in localStorage
  ↓
User logs in Browser B (Firefox)  [Same Device or Different]
  ↓
Server creates Session #2 (Firefox, Windows, 192.168.1.100)
Returns sessionToken for Browser B
Browser B stores sessionToken in localStorage
  ↓
Both Browser A & B send heartbeats independently with their sessionTokens
  ↓
Server updates SEPARATE lastActive times for Session #1 and #2
```

### Heartbeat Tracking

Every 2 minutes, each open browser sends a heartbeat:
- Browser A sends: `{ sessionToken: "session-1-token" }`
- Browser B sends: `{ sessionToken: "session-2-token" }`

The server updates each session's `lastActive` independently.

### Activity Detection Across Browsers

**Before:** Only one `lastActive` timestamp for entire user
```
User.lastActive = 2024-04-26 15:30:00  (whichever browser updated last)
```

**After:** Separate timestamps per session
```
Session #1 (Chrome):  lastActive = 2024-04-26 15:32:00
Session #2 (Firefox): lastActive = 2024-04-26 15:30:30
```

## API Endpoints

### Get All Sessions
```bash
GET /api/user/sessions
Authorization: Bearer token

Response:
{
  "msg": "Sessions retrieved successfully",
  "sessions": [
    {
      "id": 1,
      "session_token": "abc123...",
      "browser_info": "Chrome 125.0",
      "device_info": "Windows 10",
      "ip_address": "192.168.1.100",
      "lastActive": "2024-04-26 15:32:00",
      "isActive": true,
      "createdAt": "2024-04-26 14:00:00"
    },
    {
      "id": 2,
      "session_token": "def456...",
      "browser_info": "Firefox 124.0",
      "device_info": "macOS 13.5",
      "ip_address": "203.0.113.45",
      "lastActive": "2024-04-26 15:28:30",
      "isActive": true,
      "createdAt": "2024-04-26 12:00:00"
    }
  ],
  "totalSessions": 2,
  "activeSessions": 2
}
```

### Logout From Specific Session
```bash
POST /api/user/logout-session
Authorization: Bearer token
Body: { "sessionToken": "session-to-logout" }

Response:
{ "msg": "Logged out from session successfully" }
```

### Logout From All Sessions
```bash
POST /api/user/logout-all-sessions
Authorization: Bearer token

Response:
{
  "msg": "Logged out from all sessions successfully",
  "sessionsDeactivated": 2
}
```

### Heartbeat (Updated)
```bash
POST /api/user/heartbeat
Authorization: Bearer token
Body: { "sessionToken": "current-session-token" }

Response:
{ "msg": "Session heartbeat recorded" }
```

## Usage Examples

### Frontend - Initialize Heartbeats
```javascript
// Automatically done by session manager
sessionManager.initializeHeartbeat(2 * 60 * 1000); // Every 2 minutes

// Or manually:
await sessionManager.sendHeartbeat();
```

### Frontend - View Active Sessions
```javascript
const data = await sessionManager.getActiveSessions();
console.log('Active sessions:', data.sessions);
console.log('Total devices logged in:', data.totalSessions);
```

### Frontend - Logout From Specific Device
```javascript
const sessionToken = data.sessions[0].session_token;
await sessionManager.logoutSession(sessionToken);
console.log('Logged out from that device');
```

### Frontend - Logout From All Devices
```javascript
await sessionManager.logoutAllSessions();
console.log('Logged out from all devices');
```

## Installation

1. **Run the migration** to create the new sessions table:
```bash
mysql -u user -p database_name < node/database-schema.sql
```

2. **Install new dependency**:
```bash
cd node
npm install
npm install ua-parser-js@1.0.37
```

3. **Restart the server**:
```bash
npm start
```

## Features

✅ **Multi-Device Tracking** - Know which browsers/devices user is logged into  
✅ **Per-Session Activity** - Track activity timestamp for each session independently  
✅ **Browser Detection** - Identify browser name, version, OS, and IP  
✅ **Session Management** - Logout from specific device or all devices  
✅ **Fallback Support** - Works gracefully if sessions table doesn't exist yet  
✅ **Backward Compatible** - Old single `lastActive` timestamp still works  

## Next Steps (Optional Enhancements)

1. **Admin Dashboard** - Display user sessions and device information
2. **Session Details Modal** - Show detailed info about each session
3. **Device Verification** - Send notification when new device logs in
4. **Suspicious Activity Alert** - Flag logins from unusual locations/devices
5. **Session Duration Tracking** - Calculate how long each session is active
6. **Activity History Per Session** - Log actions per session
7. **Force Logout UI** - Allow users to remotely logout from devices

## Testing

### Test Multi-Browser Login
1. Open Chrome and login to the app
2. Open Firefox and login with same account
3. Check each browser's localStorage:
   ```javascript
   // In Chrome console:
   console.log(localStorage.getItem('sessionToken')); // Chrome's session token
   
   // In Firefox console:
   console.log(localStorage.getItem('sessionToken')); // Firefox's session token
   ```
4. Each should have different session tokens

### Test Activity Tracking
1. Log in from two browsers
2. Check `/api/user/sessions` endpoint:
   ```javascript
   fetch('http://localhost:3000/api/user/sessions', {
     headers: { 'x-auth-token': token }
   }).then(r => r.json()).then(console.log);
   ```
3. You should see both sessions with separate `lastActive` times
4. Activity in one browser updates only that session's `lastActive`

### Test Session Logout
1. Get session list from `/api/user/sessions`
2. Logout from one session:
   ```javascript
   fetch('http://localhost:3000/api/user/logout-session', {
     method: 'POST',
     headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
     body: JSON.stringify({ sessionToken: 'session-token-to-logout' })
   }).then(r => r.json()).then(console.log);
   ```
3. That browser should be logged out but the other remains active

## Troubleshooting

### Sessions table doesn't exist error
```
Error: Table 'sessions' doesn't exist
```
**Fix:** Run the database migration:
```sql
ALTER TABLE sessions ADD IF NOT EXISTS ...
```

### sessionToken is undefined
**Cause:** Session creation failed or browser is on old cached login response  
**Fix:** Clear localStorage and login again

### Heartbeat not updating session
**Cause:** sessionToken not being sent with heartbeat  
**Fix:** Ensure `sessionManager.initializeHeartbeat()` is called on page load

## Files Modified/Created

**New Files:**
- `js/session-manager.js` - Centralized session management class

**Modified Backend Files:**
- `node/database-schema.sql` - Added sessions table
- `node/routes/auth.js` - Session creation on login
- `node/routes/user.js` - New session endpoints and heartbeat update
- `node/package.json` - Added ua-parser-js dependency

**Modified Frontend Files:**
- `landing.html` - Added session-manager.js script
- `landing.js` - Store sessionToken on login
- `documents.html` - Added session-manager.js script
- `documents.js` - Use sessionManager for heartbeats
- `approvals.html` - Added session-manager.js script
- `approvals.js` - Use sessionManager for heartbeats
- `audit-trail.html` - Added session-manager.js script
- `audit-trail.js` - Use sessionManager for heartbeats

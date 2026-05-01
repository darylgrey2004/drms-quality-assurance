# Change Password Feature Documentation

## Overview
Added change password functionality for all users (Admin, Dean, Faculty, Dept. Head) to allow them to securely update their account passwords.

## Implementation

### Backend API Endpoint

**File**: `node/routes/auth.js`

**Endpoint**: `POST /api/auth/change-password`

**Access**: Private (requires authentication)

**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response**:
```json
{
  "msg": "Password changed successfully"
}
```

**Features**:
- Validates current password before allowing change
- Requires new password to be at least 6 characters
- Hashes new password with bcrypt (10 salt rounds)
- Logs password change in audit_logs table
- Returns appropriate error messages for validation failures

**Error Responses**:
- `400`: Missing fields, password too short, or current password incorrect
- `404`: User not found
- `500`: Server error

### Frontend Implementation

#### For Admin/Dean (settings.html)

**Location**: Account Tab in Settings page

**Features**:
- "Change Password" button in Account section
- Modal dialog with three password fields:
  - Current Password
  - New Password (min 6 characters)
  - Confirm New Password
- Real-time validation:
  - All fields required
  - New password minimum length check
  - Password confirmation match
  - New password must differ from current
- Success/error messages displayed in modal
- Auto-closes modal 2 seconds after successful change

**Files Modified**:
1. `settings.html`:
   - Added "Change Password" button to Account tab
   - Added change password modal HTML
   - Added JavaScript for modal functionality

#### For Faculty/Dept. Head (user-profile.html)

**Location**: Account Security section (left sidebar card)

**Features**:
- "Change Password" button in Account Security card
- Same modal dialog and validation as admin/dean
- Consistent UI/UX across all user roles

**Files Modified**:
1. `user-profile.html`:
   - Renamed "Session Management" to "Account Security"
   - Added "Change Password" button above Logout button
   - Added change password modal HTML

2. `js/user-profile.js`:
   - Added change password modal functionality
   - Added validation logic
   - Added API call to change-password endpoint

## User Flow

### Step 1: Open Change Password Modal
- User clicks "Change Password" button
- Modal opens with three password input fields
- All fields are empty and ready for input

### Step 2: Enter Passwords
- User enters current password
- User enters new password (min 6 characters)
- User confirms new password

### Step 3: Validation
Frontend validates:
- All fields are filled
- New password is at least 6 characters
- New password matches confirmation
- New password differs from current password

### Step 4: Submit
- Button shows "Changing..." during API call
- Backend validates current password
- Backend hashes and saves new password
- Backend logs the change in audit trail

### Step 5: Success/Error
- **Success**: Green message "Password changed successfully!"
  - Modal auto-closes after 2 seconds
  - User can continue using the system
  
- **Error**: Red message with specific error
  - "Current password is incorrect"
  - "New password must be at least 6 characters long"
  - "New passwords do not match"
  - User can correct and retry

## Security Features

1. **Current Password Verification**: Must provide correct current password
2. **Password Hashing**: Uses bcrypt with 10 salt rounds
3. **Minimum Length**: Enforces 6-character minimum
4. **Authentication Required**: Endpoint requires valid JWT token
5. **Audit Logging**: All password changes logged with:
   - User ID
   - Action: PASSWORD_CHANGED
   - IP address
   - User agent
   - Timestamp

## Testing Checklist

### Admin/Dean Testing (settings.html)
- [ ] Navigate to Settings → Account tab
- [ ] Click "Change Password" button
- [ ] Modal opens correctly
- [ ] Try submitting with empty fields → Error shown
- [ ] Try submitting with short password (< 6 chars) → Error shown
- [ ] Try submitting with mismatched passwords → Error shown
- [ ] Try submitting with wrong current password → Error shown
- [ ] Submit with correct current password and valid new password → Success
- [ ] Modal closes automatically after 2 seconds
- [ ] Try logging out and back in with new password → Success

### Faculty/Dept. Head Testing (user-profile.html)
- [ ] Navigate to Profile page
- [ ] Scroll to "Account Security" section
- [ ] Click "Change Password" button
- [ ] Modal opens correctly
- [ ] Perform same validation tests as above
- [ ] Verify password change works
- [ ] Test login with new password

### Backend Testing
- [ ] Check audit_logs table for PASSWORD_CHANGED entries
- [ ] Verify password is hashed in database (not plain text)
- [ ] Test API endpoint with Postman/curl
- [ ] Verify authentication is required (401 without token)

## Database Schema

### audit_logs Table Entry
```sql
INSERT INTO audit_logs (
  user_id,
  action,
  entity_type,
  entity_id,
  ip_address,
  user_agent,
  created_at
) VALUES (
  63,
  'PASSWORD_CHANGED',
  'user',
  63,
  '192.168.1.100',
  'Mozilla/5.0...',
  NOW()
);
```

## Files Modified

### Backend
1. `node/routes/auth.js`
   - Added `/api/auth/change-password` endpoint
   - Added password validation logic
   - Added audit logging

### Frontend - Admin/Dean
1. `settings.html`
   - Added "Change Password" button to Account tab
   - Added change password modal HTML
   - Added JavaScript for modal functionality and API call

### Frontend - Faculty/Dept. Head
1. `user-profile.html`
   - Updated "Session Management" to "Account Security"
   - Added "Change Password" button
   - Added change password modal HTML

2. `js/user-profile.js`
   - Added change password modal event listeners
   - Added validation logic
   - Added API call to change-password endpoint

## API Endpoint Details

### Request Example
```javascript
fetch('http://localhost:3000/api/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': 'eyJhbGciOiJIUzI1NiIs...'
  },
  body: JSON.stringify({
    currentPassword: 'oldPassword123',
    newPassword: 'newPassword456'
  })
});
```

### Success Response
```json
{
  "msg": "Password changed successfully"
}
```

### Error Responses
```json
// Missing fields
{
  "msg": "Please provide current password and new password"
}

// Password too short
{
  "msg": "New password must be at least 6 characters long"
}

// Wrong current password
{
  "msg": "Current password is incorrect"
}

// User not found
{
  "msg": "User not found"
}
```

## UI/UX Considerations

1. **Modal Design**: Clean, centered modal with clear labels
2. **Validation Feedback**: Immediate feedback on validation errors
3. **Loading State**: Button shows "Changing..." during API call
4. **Success Feedback**: Green success message with auto-close
5. **Error Feedback**: Red error message with specific details
6. **Accessibility**: Proper labels, focus management, keyboard navigation
7. **Responsive**: Works on mobile and desktop

## Future Enhancements

1. **Password Strength Meter**: Visual indicator of password strength
2. **Password Requirements**: Display requirements (uppercase, numbers, symbols)
3. **Password History**: Prevent reuse of last N passwords
4. **Email Notification**: Send email when password is changed
5. **Two-Factor Authentication**: Add 2FA option
6. **Password Expiry**: Force password change after X days
7. **Show/Hide Password**: Toggle visibility of password fields

## Troubleshooting

### Issue: "Current password is incorrect"
- **Cause**: User entered wrong current password
- **Solution**: Verify current password and try again

### Issue: Modal doesn't open
- **Cause**: JavaScript not loaded or button ID mismatch
- **Solution**: Check browser console for errors, verify button ID

### Issue: API returns 401 Unauthorized
- **Cause**: Token expired or missing
- **Solution**: Log out and log back in to get new token

### Issue: Password change succeeds but can't login
- **Cause**: Browser cached old password
- **Solution**: Clear browser cache and try again

## Security Best Practices

1. ✅ Never log passwords (current or new)
2. ✅ Always hash passwords before storing
3. ✅ Use HTTPS in production
4. ✅ Validate on both frontend and backend
5. ✅ Log password changes for audit trail
6. ✅ Require current password verification
7. ✅ Enforce minimum password length
8. ✅ Use secure password hashing (bcrypt)

## Deployment Notes

1. Restart Node.js server after deploying backend changes
2. Clear browser cache after deploying frontend changes
3. Test with all user roles (Admin, Dean, Faculty, Dept. Head)
4. Verify audit logs are being created
5. Check that old passwords no longer work after change

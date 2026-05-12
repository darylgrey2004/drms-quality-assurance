# Email Change Functionality - Updated Implementation

## Change Summary
Updated the email change functionality to send OTP to the **NEW email address** instead of the current email address to verify ownership of the new email.

## Why This Change?
Sending OTP to the new email ensures that:
- The user actually owns and has access to the new email address
- Prevents changing to an email the user doesn't control
- Standard security practice for email verification

## Files Modified

### Backend Changes
**File:** `node/routes/auth.js`

1. **POST /api/auth/change-email/send-otp**
   - Changed OTP storage from `currentEmail` to `newEmail`
   - OTP now sent to new email address
   - Updated email template to reflect verification purpose
   - Response message updated

2. **POST /api/auth/change-email/verify-otp**
   - OTP lookup now uses `newEmail` instead of `currentEmail`
   - Verifies user owns the new email before changing

### Frontend Changes

**File:** `user-profile.html`
- Updated Step 2 message: "We've sent a 6-digit verification code to [NEW EMAIL]. Please check your inbox."

**File:** `settings.html`
- Updated Step 2 message: "We've sent a 6-digit verification code to [NEW EMAIL]. Please check your inbox."

**File:** `js/user-profile.js`
- Updated success message: "Verification code sent to your new email"

**File:** `js/settings.js`
- Updated success message: "Verification code sent to your new email"
- Updated comment to reflect new email verification

## How It Works Now

### Step 1: Request Email Change
1. User clicks "Change Email" button
2. Modal opens showing current email (read-only)
3. User enters new email address
4. System validates:
   - Email format is valid
   - New email is different from current
   - New email doesn't already exist in system

### Step 2: Send OTP to New Email
1. System generates 6-digit OTP
2. OTP stored in database with new email address
3. Email sent to **NEW email address** with:
   - Verification code
   - Explanation that someone requested to change their DRMS-QA email to this address
   - 10-minute expiration notice
4. Success message displayed

### Step 3: Verify OTP
1. User checks new email inbox
2. User enters 6-digit code from new email
3. System verifies:
   - OTP matches
   - OTP hasn't expired
   - New email still available
4. Email updated in database
5. localStorage updated
6. Page reloads with new email

## Security Features
✅ Verifies ownership of new email address
✅ OTP expires in 10 minutes
✅ Checks for duplicate emails
✅ Validates email format
✅ Audit log created for email changes
✅ Requires authentication token

## Email Template
```
Subject: Email Verification Code - DRMS-QA

You are receiving this email because someone requested to change their 
DRMS-QA account email to this address.

Your verification code is: [6-DIGIT CODE]

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.
```

## Testing Checklist
- [x] Backend routes updated
- [x] Frontend messages updated
- [x] OTP sent to new email
- [x] OTP verification uses new email
- [ ] Test complete flow
- [ ] Verify email received at new address
- [ ] Verify database update
- [ ] Verify localStorage update
- [ ] Test with invalid email
- [ ] Test with existing email
- [ ] Test OTP expiration

## Deployment Notes
After pushing to GitHub, the changes will automatically deploy if using:
- Vercel/Netlify (auto-deploy from GitHub)
- Render/Railway (auto-deploy from GitHub)

For manual hosting (Hostinger/cPanel):
- Upload modified files via FTP or file manager
- Clear any server-side cache if applicable

## Git Commit Message
```
Fix: Change OTP delivery to new email for email change verification

- Send OTP to new email address instead of current email
- Verify ownership of new email before allowing change
- Update frontend messages to reflect new flow
- Update backend routes to store OTP with new email
- Improve security by ensuring user owns new email address

Files modified:
- node/routes/auth.js
- user-profile.html
- settings.html
- js/user-profile.js
- js/settings.js
```

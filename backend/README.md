# DRMS-QA Registration System with Gmail Verification

This system includes a backend server for handling user registration with Gmail email verification.

## Backend Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Gmail account with App Password enabled

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure Gmail credentials:
   - Open `.env` file in the backend directory
   - Replace `your_gmail@gmail.com` with your Gmail address
   - Replace `your_app_password` with your Gmail App Password
   
   **To generate a Gmail App Password:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification if not already enabled
   - Go to App passwords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
   - Paste it in the `.env` file as `GMAIL_PASSWORD`

### Running the Backend

Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Frontend Setup

The registration form is in `registration.html`. The frontend automatically communicates with the backend API.

### Features

1. **User Registration Form**
   - Full Name
   - Email
   - Role (Faculty, Area Chair, Dean, QA Coordinator, External Evaluator)
   - Department
   - Password with confirmation

2. **Email Verification**
   - After registration, a 6-character verification code is sent to the user's email
   - User enters the code in the verification modal
   - Upon successful verification, account status is set to "pending_approval"

3. **Database**
   - Registered accounts are stored in `backend/registered_accounts.json`
   - Each account includes:
     - User information
     - Verification status
     - Account status (pending, pending_approval, active, rejected)
     - Creation timestamp

## API Endpoints

### POST /api/register
Register a new user
- **Body:**
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "Faculty",
    "department": "Computer Science",
    "password": "password123",
    "confirmPassword": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Registration successful. Verification code sent to your email.",
    "verificationToken": "token_string",
    "email": "john@example.com"
  }
  ```

### POST /api/verify-email
Verify user email with verification code
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "verificationCode": "ABC123",
    "verificationToken": "token_string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Email verified successfully. Your account is pending administrator approval."
  }
  ```

### GET /api/accounts
Get all registered accounts (for admin purposes)
- **Response:**
  ```json
  {
    "success": true,
    "accounts": [
      {
        "id": "uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "role": "Faculty",
        "department": "Computer Science",
        "isVerified": true,
        "status": "pending_approval",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### GET /api/health
Health check endpoint
- **Response:**
  ```json
  {
    "success": true,
    "message": "Server is running"
  }
  ```

## File Structure

```
backend/
├── server.js                 # Main backend server
├── package.json             # Dependencies
├─�� .env                     # Environment variables (Gmail credentials)
└── registered_accounts.json # Database file

frontend/
├── registration.html        # Registration form
├── js/
│   └── registration.js      # Frontend logic
└── css/
    └── registration.css     # Styling
```

## Troubleshooting

### Backend not connecting
- Ensure the backend server is running on port 5000
- Check that CORS is enabled (it is by default)
- Verify the API_BASE_URL in `js/registration.js` matches your backend URL

### Gmail not sending emails
- Verify Gmail credentials in `.env` file
- Ensure 2-Step Verification is enabled on your Gmail account
- Use an App Password, not your regular Gmail password
- Check spam folder for verification emails

### Database issues
- Ensure `backend/registered_accounts.json` exists and is readable
- Check file permissions
- The file will be created automatically if it doesn't exist

## Security Notes

- Passwords are currently base64 encoded. For production, use bcrypt or similar
- Implement rate limiting on registration endpoint
- Add CSRF protection
- Use HTTPS in production
- Store sensitive data securely
- Implement proper authentication for admin endpoints

## Future Enhancements

- Add password reset functionality
- Implement admin approval workflow
- Add user profile management
- Implement role-based access control
- Add audit logging
- Database migration to MongoDB or PostgreSQL

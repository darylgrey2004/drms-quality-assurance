# DRMS-QA - Document Records Management System (Quality Assurance)

A comprehensive document management system for quality assurance in educational institutions.

## Features

- 📄 Document upload and management
- 🔐 Role-based access control (Admin, Dean, Faculty, Department Head, Evaluator)
- ✅ Multi-stage approval workflow
- 📊 Analytics and reporting
- 🔍 Advanced search and filtering
- 📋 Evidence mapping
- 🔒 Audit trail and version control
- 👥 User management

## Tech Stack

- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL/MariaDB
- **Authentication**: JWT

## Deployment Instructions

### Prerequisites

- Node.js 22.x
- MySQL/MariaDB database
- Email account for OTP (Gmail recommended)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=drms_db
DB_PORT=3306

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Database Setup

1. Import the database schema:
```bash
mysql -u your_user -p drms_db < node/drms_db.sql
```

2. Create an admin user:
```bash
cd node
node create-admin.js
```

### Deployment Settings

**Framework preset**: Other  
**Branch**: main  
**Node version**: 22.x  
**Root directory**: ./  
**Build command**: None  
**Package manager**: npm  
**Output directory**: (leave empty)  
**Entry file**: index.js  

### Install Dependencies

```bash
npm install
```

### Start the Application

```bash
npm start
```

For development:
```bash
npm run dev
```

## Default Admin Credentials

After running `create-admin.js`:
- Email: admin@wmsu.edu.ph
- Password: (set during creation)

## Project Structure

```
drms-quality-assurance/
├── index.js              # Main entry point
├── package.json          # Dependencies
├── .env                  # Environment variables
├── css/                  # Stylesheets
├── js/                   # Frontend JavaScript
├── node/                 # Backend code
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── utils/           # Utilities
│   ├── uploads/         # Uploaded files
│   └── database.js      # Database connection
├── *.html               # Frontend pages
└── README.md            # This file
```

## Security Notes

- Change JWT_SECRET in production
- Use strong database passwords
- Enable HTTPS in production
- Restrict file upload types and sizes
- Regular database backups recommended

## Support

For issues or questions, contact the development team.

## License

Proprietary - All rights reserved

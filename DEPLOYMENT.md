# DRMS-QA Deployment Checklist

## Pre-Deployment Steps

### 1. Database Setup
- [ ] Create MySQL/MariaDB database named `drms_db`
- [ ] Import schema: `mysql -u user -p drms_db < node/drms_db.sql`
- [ ] Note down database credentials (host, user, password, port)

### 2. Email Configuration
- [ ] Set up Gmail account or other SMTP email
- [ ] Enable 2-factor authentication on Gmail
- [ ] Generate App Password (Google Account > Security > App Passwords)
- [ ] Note down email and app password

### 3. Environment Variables Preparation
Prepare these values before deployment:
- [ ] Database host (e.g., mysql.example.com)
- [ ] Database user
- [ ] Database password
- [ ] Database name (drms_db)
- [ ] Database port (usually 3306)
- [ ] JWT secret (generate random string: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] Email address
- [ ] Email app password

## Deployment Platform Configuration

### Settings to Configure:

**Framework preset**: Other  
**Branch**: main  
**Node version**: 22.x  
**Root directory**: ./  
**Build command**: (leave empty or "None")  
**Package manager**: npm  
**Output directory**: (leave empty)  
**Entry file**: index.js  

### Environment Variables to Add:

Add these in your deployment platform's environment variables section:

```
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=drms_db
DB_PORT=3306
JWT_SECRET=your_generated_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
PORT=3000
NODE_ENV=production
```

## Post-Deployment Steps

### 1. Create Admin User
After first deployment, connect to your server and run:
```bash
cd node
node create-admin.js
```

Follow the prompts to create your admin account.

### 2. Test the Application
- [ ] Visit your deployed URL
- [ ] Test registration with @wmsu.edu.ph email
- [ ] Test login with admin credentials
- [ ] Test file upload
- [ ] Test document approval workflow
- [ ] Test all major features

### 3. Security Checklist
- [ ] Verify HTTPS is enabled
- [ ] Change default admin password
- [ ] Test file upload restrictions
- [ ] Verify email OTP is working
- [ ] Test role-based access control
- [ ] Review audit logs

## Common Deployment Platforms

### Render.com
1. Connect GitHub repository
2. Select "Web Service"
3. Configure settings as above
4. Add environment variables
5. Deploy

### Railway.app
1. Connect GitHub repository
2. Configure settings as above
3. Add environment variables
4. Deploy

### Heroku
1. Create new app
2. Connect GitHub repository
3. Add MySQL addon (ClearDB or JawsDB)
4. Configure environment variables
5. Deploy

### DigitalOcean App Platform
1. Create new app
2. Connect GitHub repository
3. Add managed database (MySQL)
4. Configure environment variables
5. Deploy

## Troubleshooting

### Database Connection Issues
- Verify database host is accessible from deployment platform
- Check database credentials
- Ensure database port is correct (usually 3306)
- Verify database name exists

### File Upload Issues
- Ensure `node/uploads` directory exists
- Check file size limits in deployment platform
- Verify multer configuration in backend

### Email/OTP Issues
- Verify email credentials
- Check if app password is correct (not regular password)
- Ensure email service allows SMTP access

### Port Issues
- Deployment platform usually assigns PORT automatically
- Don't hardcode port 3000 in production
- Use `process.env.PORT || 3000`

## Monitoring

After deployment, monitor:
- [ ] Server logs for errors
- [ ] Database connection status
- [ ] File upload functionality
- [ ] Email delivery
- [ ] API response times
- [ ] User registrations and logins

## Backup Strategy

Set up regular backups:
- [ ] Database backups (daily recommended)
- [ ] Uploaded files backup (weekly recommended)
- [ ] Environment variables backup (secure location)

## Support Contacts

- Database issues: Contact your database provider
- Deployment issues: Contact your hosting platform support
- Application issues: Contact development team

---

**Last Updated**: 2024
**Version**: 1.0.0

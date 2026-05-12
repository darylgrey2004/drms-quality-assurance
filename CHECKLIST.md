# ✅ Pre-Deployment Checklist

## Before You Deploy - Complete This Checklist

### 1. Database Preparation
- [ ] MySQL/MariaDB database created
- [ ] Database name: `drms_db`
- [ ] Schema imported from `node/drms_db.sql`
- [ ] Database credentials noted down:
  - [ ] Host: _______________
  - [ ] User: _______________
  - [ ] Password: _______________
  - [ ] Port: _______________

### 2. Email Configuration
- [ ] Gmail account ready (or other SMTP)
- [ ] 2-Factor Authentication enabled
- [ ] App Password generated
- [ ] Email credentials noted:
  - [ ] Email: _______________
  - [ ] App Password: _______________

### 3. Security Setup
- [ ] JWT Secret generated (run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] JWT Secret noted: _______________
- [ ] Strong database password set
- [ ] Admin email decided: _______________

### 4. GitHub Repository
- [ ] GitHub account created
- [ ] New repository created
- [ ] Repository URL: _______________
- [ ] Code pushed to GitHub

### 5. Deployment Platform
- [ ] Platform chosen: ☐ Render ☐ Railway ☐ Heroku ☐ Other: _______
- [ ] Account created on platform
- [ ] Payment method added (if using paid tier)

### 6. Files Ready
- [ ] `index.js` exists in root
- [ ] `package.json` exists in root
- [ ] `.gitignore` configured
- [ ] `node/drms_db.sql` exists
- [ ] All HTML files present
- [ ] All CSS files present
- [ ] All JS files present

### 7. Environment Variables Prepared
Copy these values - you'll need them during deployment:

```
DB_HOST=_______________
DB_USER=_______________
DB_PASSWORD=_______________
DB_NAME=drms_db
DB_PORT=3306
JWT_SECRET=_______________
EMAIL_USER=_______________
EMAIL_PASSWORD=_______________
NODE_ENV=production
PORT=3000
```

### 8. Deployment Settings Ready
- [ ] Framework preset: Other
- [ ] Branch: main
- [ ] Node version: 22.x
- [ ] Root directory: ./
- [ ] Build command: (empty)
- [ ] Package manager: npm
- [ ] Entry file: index.js

## During Deployment

### Step 1: Connect Repository
- [ ] Repository connected to deployment platform
- [ ] Correct branch selected (main)

### Step 2: Configure Settings
- [ ] Framework preset set to "Other"
- [ ] Node version set to "22.x"
- [ ] Root directory set to "./"
- [ ] Entry file set to "index.js"

### Step 3: Add Environment Variables
- [ ] DB_HOST added
- [ ] DB_USER added
- [ ] DB_PASSWORD added
- [ ] DB_NAME added (drms_db)
- [ ] DB_PORT added (3306)
- [ ] JWT_SECRET added
- [ ] EMAIL_USER added
- [ ] EMAIL_PASSWORD added
- [ ] NODE_ENV added (production)

### Step 4: Deploy
- [ ] Deployment initiated
- [ ] Build logs checked for errors
- [ ] Deployment successful
- [ ] URL noted: _______________

## After Deployment

### Step 1: Create Admin User
- [ ] Connected to deployment shell/terminal
- [ ] Navigated to `node` directory
- [ ] Ran `node create-admin.js`
- [ ] Admin account created
- [ ] Admin credentials saved securely

### Step 2: Test Basic Functions
- [ ] Landing page loads
- [ ] Registration page works
- [ ] Can register with @wmsu.edu.ph email
- [ ] OTP email received
- [ ] Can verify email
- [ ] Can login with admin credentials
- [ ] Dashboard loads correctly

### Step 3: Test Core Features
- [ ] File upload works
- [ ] Document appears in documents list
- [ ] Can view document
- [ ] Can download document
- [ ] Approval workflow works
- [ ] User management works
- [ ] Audit trail records actions

### Step 4: Test All User Roles
- [ ] Admin role works
- [ ] Dean role works
- [ ] Faculty role works
- [ ] Department Head role works
- [ ] Evaluator role works

### Step 5: Security Verification
- [ ] HTTPS enabled (check for padlock icon)
- [ ] File upload restrictions work
- [ ] Role-based access control works
- [ ] Cannot access admin pages without permission
- [ ] Session timeout works
- [ ] Password requirements enforced

### Step 6: Performance Check
- [ ] Page load time acceptable (< 3 seconds)
- [ ] File upload speed acceptable
- [ ] Search functionality responsive
- [ ] No console errors in browser

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Change default admin password
- [ ] Create test accounts for each role
- [ ] Test complete workflow end-to-end
- [ ] Document any issues found
- [ ] Set up monitoring/alerts

### Short-term (Week 1)
- [ ] Set up database backups
- [ ] Configure file backup strategy
- [ ] Create user documentation
- [ ] Train initial users
- [ ] Monitor error logs daily

### Long-term (Month 1)
- [ ] Review system performance
- [ ] Analyze user feedback
- [ ] Plan improvements
- [ ] Set up regular maintenance schedule
- [ ] Document lessons learned

## Emergency Contacts

Database Provider: _______________
Hosting Platform Support: _______________
Email Service Support: _______________
Development Team: _______________

## Rollback Plan

If deployment fails:
1. [ ] Check deployment logs
2. [ ] Verify environment variables
3. [ ] Check database connection
4. [ ] Review recent code changes
5. [ ] Rollback to previous version if needed

## Success Criteria

Deployment is successful when:
- ✅ Application is accessible via URL
- ✅ All pages load without errors
- ✅ Users can register and login
- ✅ File upload works
- ✅ Email notifications work
- ✅ Database operations work
- ✅ All user roles function correctly
- ✅ No critical errors in logs

## Notes

Use this space for deployment-specific notes:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Platform**: _______________
**URL**: _______________
**Status**: ☐ Success ☐ Partial ☐ Failed

**Signature**: _______________

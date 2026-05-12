# Quick Deployment Guide

## Step-by-Step Deployment

### Step 1: Prepare Your Database

1. Create a MySQL database named `drms_db`
2. Import the schema:
   ```bash
   mysql -u your_user -p drms_db < node/drms_db.sql
   ```

### Step 2: Push to GitHub

1. Initialize git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/drms-qa.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy to Platform

#### For Render.com (Recommended):

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: drms-qa (or your choice)
   - **Branch**: main
   - **Root Directory**: ./
   - **Runtime**: Node
   - **Build Command**: (leave empty)
   - **Start Command**: npm start
   - **Instance Type**: Free (or paid for better performance)

5. Add Environment Variables (click "Advanced" → "Add Environment Variable"):
   ```
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=drms_db
   DB_PORT=3306
   JWT_SECRET=your_random_secret_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   NODE_ENV=production
   ```

6. Click "Create Web Service"

### Step 4: Set Up Database on Render

1. In Render dashboard, click "New +" → "PostgreSQL" or use external MySQL
2. For MySQL, you can use:
   - **PlanetScale** (free tier available)
   - **Railway** (MySQL addon)
   - **AWS RDS** (paid)
   - **DigitalOcean Managed Database** (paid)

3. Get connection details and update environment variables

### Step 5: Create Admin User

1. After deployment, go to Render dashboard
2. Click on your service → "Shell" tab
3. Run:
   ```bash
   cd node
   node create-admin.js
   ```
4. Follow prompts to create admin account

### Step 6: Test Your Deployment

1. Visit your deployed URL (e.g., https://drms-qa.onrender.com)
2. Test login with admin credentials
3. Test registration
4. Test file upload
5. Test all major features

## Alternative: Railway.app

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js
5. Add environment variables in "Variables" tab
6. Deploy automatically starts

## Alternative: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create drms-qa`
4. Add MySQL addon: `heroku addons:create jawsdb:kitefin`
5. Set environment variables: `heroku config:set KEY=value`
6. Deploy: `git push heroku main`

## Environment Variables Quick Reference

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Get Gmail App Password:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Use this password (not your regular Gmail password)

## Troubleshooting

**Build fails**: Check Node version is 22.x

**Database connection fails**: 
- Verify database host is accessible
- Check credentials
- Ensure database exists

**Port issues**: 
- Platform assigns PORT automatically
- Don't worry about port configuration

**File uploads fail**:
- Check if `node/uploads` directory exists
- Verify file size limits

## Need Help?

- Check DEPLOYMENT.md for detailed instructions
- Check logs in your deployment platform
- Verify all environment variables are set correctly

## Success Indicators

✅ Deployment shows "Live"  
✅ Can access landing page  
✅ Can register new user  
✅ Can login  
✅ Can upload documents  
✅ Email OTP works  

---

**Estimated Deployment Time**: 15-30 minutes  
**Difficulty**: Intermediate  
**Cost**: Free tier available on most platforms

# Deployment Guide for Streaming App

This guide will walk you through deploying the streaming application to Render.

## Prerequisites

1. A GitHub account
2. A Render account (https://render.com)
3. Git installed on your local machine

## Deployment Steps

1. **Prepare your repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a new GitHub repository**
   - Go to https://github.com/new
   - Create a new repository
   - Follow the instructions to push your existing repository

3. **Deploy to Render**
   - Go to https://dashboard.render.com/
   - Click "New" and select "Web Service"
   - Connect your GitHub account if you haven't already
   - Select your repository
   - Configure the service:
     - Name: streaming-app
     - Region: Choose the one closest to your users
     - Branch: main (or your main branch)
     - Build Command: `npm install && npm run build`
     - Start Command: `cd server && npm install && npm start`
     - Add environment variables from your .env file
   - Click "Create Web Service"

4. **Configure Environment Variables**
   - In your Render dashboard, go to your service
   - Go to the "Environment" tab
   - Add all the variables from your `.env` file
   - Click "Save Changes"

5. **Wait for deployment**
   - Render will automatically build and deploy your application
   - You can view the logs in the "Logs" tab

## Updating Your App

1. Make your changes locally
2. Commit and push to your GitHub repository
3. Render will automatically detect the changes and redeploy your application

## Troubleshooting

- Check the logs in the Render dashboard for any errors
- Make sure all environment variables are properly set
- Ensure your server is listening on the correct port (use `process.env.PORT` in your server code)

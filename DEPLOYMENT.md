# SpeedType Deployment Guide

This document outlines the deployment configuration and processes for both frontend and backend services of the SpeedType application.

## Frontend Deployment (GitHub Pages)

### Configuration

1. **GitHub Pages Setup**
   - Branch: gh-pages
   - Custom domain: speedtype.robocat.ai
   - HTTPS: Enabled
   - Build output: dist directory

2. **DNS Configuration**
   - Type: CNAME
   - Record: speedtype
   - Target: alex-iurco.github.io

3. **GitHub Actions Workflow**
   Location: `.github/workflows/deploy.yml`
   ```yaml
   # Key steps:
   - Checkout code
   - Setup Node.js
   - Install dependencies
   - Build application
   - Configure custom domain
   - Deploy to GitHub Pages
   ```

### Automatic Deployment
- Triggers on push to main branch
- Only runs when frontend or workflow files change
- Includes deployment verification
- Custom domain configuration is maintained

## Backend Deployment (Railway)

### Configuration

1. **Railway Setup**
   - Service: speedtype-backend
   - Environment: production
   - Auto-deploy: Enabled

2. **Environment Variables**
   - PORT: 3001
   - NODE_ENV: production
   - Configured via Railway dashboard

3. **GitHub Actions Workflow**
   Location: `.github/workflows/railway-deploy.yml`
   ```yaml
   # Key steps:
   - Checkout code
   - Setup Node.js
   - Install dependencies
   - Deploy to Railway
   ```

### Automatic Deployment
- Triggers on push to main branch
- Only runs when backend or workflow files change
- Includes health check verification
- Zero-downtime deployment

## Monitoring and Verification

### Frontend
- GitHub Pages deployment status
- Custom domain SSL certificate
- DNS propagation
- Build and deployment logs

### Backend
- Railway deployment logs
- Service health checks
- Application logs
- Performance metrics

## Troubleshooting

### Frontend Issues
1. Check GitHub Actions logs
2. Verify DNS configuration
3. Check GitHub Pages settings
4. Validate CNAME file

### Backend Issues
1. Check Railway deployment logs
2. Verify environment variables
3. Check service health endpoint
4. Review application logs

## Security Considerations

1. **Frontend**
   - HTTPS enforced
   - Content Security Policy
   - Secure cookie configuration

2. **Backend**
   - CORS configuration
   - Rate limiting
   - Input validation
   - Error handling

## Maintenance

### Regular Tasks
1. Monitor GitHub Actions workflow runs
2. Check Railway service metrics
3. Review application logs
4. Update dependencies

### Emergency Procedures
1. How to rollback deployments
2. Contact information for support
3. Backup and restore procedures

## Version History

- v1.0.1: Current stable release
- Production URLs:
  - Frontend: https://speedtype.robocat.ai
  - Backend: https://speedtype-backend-production.up.railway.app 
# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration

Update `.env.production` with your production values:

```bash
# Copy and update the production environment file
cp .env.production .env.production.local

# Required values to update:
# - VITE_API_BASE_URL: Your production API URL
# - VITE_RAZORPAY_KEY_ID: Your production Razorpay key
# - VITE_SENTRY_DSN: (Optional) Your Sentry DSN
# - VITE_GA_TRACKING_ID: (Optional) Your Google Analytics ID
```

### 2. Build the Application

```bash
# Install dependencies
npm install

# Run production build
npm run build

# The build output will be in the `dist` directory
```

### 3. Test the Production Build Locally

```bash
# Preview the production build
npm run preview

# Open http://localhost:4173 in your browser
```

### 4. Deployment Options

#### Option A: Static Hosting (Vercel, Netlify, etc.)

1. Connect your repository to your hosting provider
2. Set environment variables in the hosting dashboard
3. Deploy automatically on push to main branch

**Vercel Example:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Netlify Example:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Option B: Docker Deployment

```bash
# Build Docker image
docker build -t techfolks-frontend:latest .

# Run container
docker run -p 80:80 techfolks-frontend:latest
```

#### Option C: Traditional Web Server (Nginx, Apache)

1. Build the application: `npm run build`
2. Copy `dist` folder contents to your web server
3. Configure your web server for SPA routing

**Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/techfolks/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy (if needed)
    location /api {
        proxy_pass http://your-backend-api:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. Post-Deployment Verification

After deployment, verify:

- [ ] Application loads without errors
- [ ] API connection works correctly
- [ ] Authentication flow works
- [ ] Role-based navigation displays correctly
- [ ] Payment integration works (test mode first)
- [ ] All modules are accessible based on user role
- [ ] Mobile responsiveness
- [ ] Dark mode toggle works
- [ ] All environment-specific features work

### 6. Production Optimizations

#### Performance

- ✅ Code splitting enabled (automatic with Vite)
- ✅ Tree shaking enabled
- ✅ Asset optimization
- ✅ Lazy loading for routes

#### Security

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] API keys not exposed in client code
- [ ] CSP headers configured
- [ ] CORS properly configured on backend

#### Monitoring

- [ ] Error tracking (Sentry) configured
- [ ] Analytics (Google Analytics) configured
- [ ] Performance monitoring enabled
- [ ] Logging configured

### 7. Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL | Yes | `https://api.yourdomain.com/api` |
| `VITE_APP_NAME` | Application name | No | `TechFolks` |
| `VITE_APP_VERSION` | Version number | No | `1.0.0` |
| `VITE_ENV` | Environment | Yes | `production` |
| `VITE_ENABLE_*` | Feature flags | No | `true` or `false` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key | Yes* | `rzp_live_xxxxx` |
| `VITE_SENTRY_DSN` | Sentry DSN | No | `https://xxx@sentry.io/xxx` |
| `VITE_GA_TRACKING_ID` | Google Analytics ID | No | `G-XXXXXXXXXX` |

*Required if payment features are enabled

### 8. Rollback Procedure

If issues occur:

1. **Immediate**: Switch DNS/Load Balancer to previous version
2. **Investigate**: Check error logs and monitoring
3. **Fix**: Address issues in development
4. **Redeploy**: Test thoroughly before redeploying

### 9. Backend Coordination

Ensure backend is also updated with:

- Database migrations run
- Environment variables configured
- CORS origins updated for frontend domain
- Payment gateway webhooks configured
- Rate limiting properly set

### 10. SSL/TLS Certificate

- Use Let's Encrypt for free SSL certificates
- Configure auto-renewal
- Redirect HTTP to HTTPS
- Use HSTS headers

### Support

For issues or questions:
- Check logs in production
- Review error tracking dashboard (Sentry)
- Contact: support@techfolks.com

---

## Quick Deployment Commands

```bash
# Development
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod

# Docker Build
docker build -t techfolks-frontend .
docker run -p 80:80 techfolks-frontend
```

## Troubleshooting

### Issue: White screen after deployment
- Check browser console for errors
- Verify `VITE_API_BASE_URL` is correct
- Check network tab for failed API calls

### Issue: 404 errors on refresh
- Configure web server for SPA routing
- Ensure all routes fall back to `index.html`

### Issue: API calls failing
- Verify CORS configuration on backend
- Check API URL in environment variables
- Verify backend is accessible from frontend domain

### Issue: Authentication not persisting
- Check if localStorage is enabled
- Verify token is being saved
- Check browser privacy settings

### Issue: Payment integration not working
- Verify Razorpay key is correct (production key, not test)
- Check Razorpay SDK is loaded
- Verify webhook endpoints are accessible

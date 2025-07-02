# Quick Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set up custom domain**:
   - Go to Vercel dashboard → Your project → Settings → Domains
   - Add: `scheduler.mycompany.com`
   - Configure DNS records as instructed

## 🔧 Environment Variables

Set these in your Vercel project settings:

```
NEXT_PUBLIC_API_BASE_URL=https://api.mycompany.com
NEXT_PUBLIC_SCHEDULER_DOMAIN=scheduler.mycompany.com
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRES_IN=24h
```

## 🔗 Integration Steps

1. **Update your main app's vendor page** (already done)
2. **Implement API endpoints** in your main app
3. **Generate JWT tokens** for booking links
4. **Test the integration**

## 📝 Notes

- The scheduler tool is completely independent
- It connects to your main app via API calls
- JWT tokens provide secure authentication
- Can be deployed to any subdomain
- Mobile-responsive design
- Calendly-inspired UI

## 🧪 Testing

1. Create a booking link in your main app
2. Click "Open Scheduler" button
3. Test the booking flow
4. Verify API integration

## 🔒 Security

- Always use HTTPS in production
- Implement proper JWT validation
- Configure CORS for cross-domain requests
- Add rate limiting to API endpoints 
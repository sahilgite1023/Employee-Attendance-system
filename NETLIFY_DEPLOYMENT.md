# Netlify Deployment Guide

## Deploy Frontend to Netlify

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Login to Netlify**
   - Go to https://app.netlify.com/
   - Login with GitHub account

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize Netlify
   - Select repository: `sahilgite1023/Employee-Attendance-system`
   - Select branch: `main`

3. **Configure Build Settings**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

4. **Set Environment Variables**
   - Click "Show advanced" → "New variable"
   - Add: `NEXT_PUBLIC_API_URL` = `https://employee-attendance-system-1y0t.onrender.com/api`

5. **Deploy**
   - Click "Deploy site"
   - Wait for deployment to complete
   - Your site will be live at: `https://your-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to frontend directory
cd frontend

# Deploy
netlify deploy --prod
```

When prompted:
- **Create new site?** Yes
- **Team:** Select your team
- **Site name:** e-attendance-system (or your preferred name)
- **Publish directory:** `.next`

### After Deployment

1. **Get your Netlify URL** (e.g., `https://e-attendance-system.netlify.app`)

2. **Update Backend FRONTEND_URL**
   - Go to Render.com dashboard
   - Open your backend service
   - Go to Environment tab
   - Update `FRONTEND_URL` to your Netlify URL
   - Save changes and redeploy

3. **Test the Application**
   - Open your Netlify URL
   - Login with: `sahilgite511` / `sahilgite@2003`
   - Test check-in/check-out functionality

### Environment Variables on Netlify

Make sure these are set in Netlify:
```
NEXT_PUBLIC_API_URL=https://employee-attendance-system-1y0t.onrender.com/api
```

### Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add custom domain
3. Follow DNS configuration steps

---

## Troubleshooting

**Build fails?**
- Check if `netlify.toml` is in the frontend directory
- Verify Node version compatibility

**API not connecting?**
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check browser console for errors

**Pages not loading?**
- Next.js requires the Netlify plugin
- Ensure `@netlify/plugin-nextjs` is configured in netlify.toml

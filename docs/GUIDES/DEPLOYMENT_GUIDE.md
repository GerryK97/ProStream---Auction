# Vercel Deployment Guide for ProStream Auction

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Steps](#deployment-steps)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Bandwidth & Storage Calculations](#bandwidth--storage-calculations)
6. [Free Tier Analysis](#free-tier-analysis)
7. [Cost Optimization Tips](#cost-optimization-tips)

---

## 🚀 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Vercel account (free at vercel.com)
- ✅ MongoDB Atlas account (free at mongodb.com/cloud/atlas)
- ✅ Your project pushed to GitHub

---

## 📦 Deployment Steps

### Step 1: Prepare Your Project

**1.1 Create `.env.local` file (if not exists)**

```bash
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**1.2 Create `.env.example` file**

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auction-db
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
```

**1.3 Ensure `.gitignore` includes:**

```
.env.local
.env
.next/
node_modules/
```

**1.4 Update `package.json` scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 3: Deploy to Vercel

**3.1 Go to Vercel Dashboard**
- Visit https://vercel.com/dashboard
- Click "Add New Project"

**3.2 Import Git Repository**
- Select your GitHub repository
- Click "Import"

**3.3 Configure Project**
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** ./
- **Build Command:** `npm run build` (auto-filled)
- **Output Directory:** `.next` (auto-filled)
- **Install Command:** `npm install` (auto-filled)

**3.4 Add Environment Variables**

Click "Environment Variables" and add:

| Name | Value | Description |
|------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection string |
| `NEXT_PUBLIC_API_URL` | Leave empty initially | Will use Vercel domain |

**3.5 Deploy**
- Click "Deploy"
- Wait 2-3 minutes for deployment
- You'll get a URL like: `https://your-project.vercel.app`

### Step 4: Update Environment Variables

After first deployment:

**4.1 Go to Project Settings → Environment Variables**

Update `NEXT_PUBLIC_API_URL` to your Vercel domain:
```
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
```

**4.2 Redeploy**
- Go to Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"

---

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Create Free Cluster

**1.1 Go to MongoDB Atlas**
- Visit https://www.mongodb.com/cloud/atlas
- Sign up for free account
- Click "Build a Database"

**1.2 Choose Free Tier**
- Select **M0 Sandbox** (FREE)
- Choose region closest to your users
- Cluster name: `auction-cluster`
- Click "Create"

**1.3 Create Database User**
- Username: `auction-user`
- Password: Generate secure password
- Save credentials securely!

**1.4 Configure Network Access**
- IP Access List → Add IP Address
- Add: `0.0.0.0/0` (Allow from anywhere - needed for Vercel)
- ⚠️ For production, restrict to Vercel IPs

**1.5 Get Connection String**
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy connection string
- Replace `<password>` with your database password
- Replace `<dbname>` with `auction-db`

Example:
```
mongodb+srv://auction-user:YOUR_PASSWORD@auction-cluster.xxxxx.mongodb.net/auction-db?retryWrites=true&w=majority
```

### Step 2: Add to Vercel

- Go to Vercel Project → Settings → Environment Variables
- Update `MONGODB_URI` with your connection string
- Redeploy

---

## 📊 Bandwidth & Storage Calculations

### System Usage Analysis

#### Per Auction Event Breakdown:

**1. Initial Page Load (Control Panel)**
- HTML/CSS/JS: ~500 KB
- React/Next.js chunks: ~200 KB
- Total: **~700 KB per session**

**2. SSE (Server-Sent Events) - Real-time Updates**
- Connection established: ~1 KB
- Per update (auction state change): ~2 KB
- Average updates per auction: ~50-100 updates
- **Total per auction: ~100-200 KB**

**3. API Requests**
- Fetch players: ~50 KB (50 players × 1 KB each)
- Fetch teams: ~10 KB (10 teams × 1 KB each)
- Fetch tournament: ~2 KB
- Bid API calls: 100 bids × 1 KB = ~100 KB
- **Total: ~162 KB per auction**

**4. Image Loading**
- Player images: 50 players × 100 KB = 5 MB
- Team logos: 10 teams × 50 KB = 0.5 MB
- **Total: ~5.5 MB per auction** ⚠️ (Largest consumer!)

**5. Overlay Streams (OBS)**
- Each overlay SSE connection: ~100-200 KB per hour
- 7 overlays running simultaneously: ~700 KB - 1.4 MB per hour
- Average auction duration: 2 hours
- **Total: ~1.4-2.8 MB per auction**

---

### Total Per Auction Calculation

| Component | Bandwidth | Notes |
|-----------|-----------|-------|
| Control Panel Load | 700 KB | One-time |
| SSE Updates | 200 KB | Real-time data |
| API Requests | 162 KB | Player/team data |
| Image Loading | 5.5 MB | 🔴 Major usage |
| Overlay Streams (2hrs) | 2.8 MB | 7 overlays × 2 hours |
| **Total per Auction** | **~9.4 MB** | **Single auction** |

**With multiple viewers/organizers:**
- 3 control panel sessions: 9.4 MB × 3 = **28.2 MB**
- 1 OBS setup (7 overlays): Already counted above

**Total per auction (realistic):** **~30-40 MB**

---

### Storage Usage

#### MongoDB Database:

**Per Tournament:**
- Tournament document: ~1 KB
- Players (50): ~50 KB
- Teams (10): ~10 KB
- Auction states: ~5 KB
- Bid history (100 bids): ~10 KB
- **Total: ~76 KB per tournament**

**10 Tournaments:** 76 KB × 10 = **760 KB** (~1 MB)

**Images:**
- ⚠️ **DO NOT store in MongoDB!**
- Use external hosting (Cloudinary, ImgBB, or S3)
- Vercel functions have 50 MB limit

---

## 💰 Vercel Free Tier Limits

### Hobby Plan (FREE)

| Resource | Limit | Notes |
|----------|-------|-------|
| **Bandwidth** | **100 GB/month** | 🟢 Most important |
| **Build Execution** | 6,000 minutes/month | 🟢 More than enough |
| **Serverless Function** | 100 GB-hours | 🟢 Sufficient |
| **Edge Requests** | 1 million/month | 🟢 Plenty |
| **Projects** | Unlimited | 🟢 |
| **Custom Domains** | Unlimited | 🟢 |
| **Team Members** | 1 (only you) | 🔴 No collaboration |

### Key Limitation: **100 GB Bandwidth/Month**

---

## 🧮 Free Tier Auction Capacity

### Scenario 1: Minimal Setup (Image CDN)

**If you host images externally (recommended):**

**Bandwidth per auction:**
- Control Panel + API + SSE: ~4 MB
- 3 simultaneous users: 4 MB × 3 = **12 MB per auction**

**Calculation:**
```
100 GB ÷ 12 MB = 8,333 auctions/month
```

✅ **~8,000+ auctions per month** (virtually unlimited!)

---

### Scenario 2: Images Hosted on Vercel (Not Recommended)

**Bandwidth per auction:**
- Everything including images: ~40 MB per auction
- 3 simultaneous users: 40 MB × 3 = **120 MB per auction**

**Calculation:**
```
100 GB ÷ 120 MB = 833 auctions/month
```

⚠️ **~800 auctions per month** (still generous)

---

### Realistic Monthly Usage

**Assuming:**
- 1 auction per day
- 3 hours per auction
- 3-5 users (organizers + OBS)
- Images hosted externally

**Monthly bandwidth:**
```
30 auctions × 12 MB = 360 MB/month
```

**Percentage of free tier used:**
```
360 MB ÷ 100 GB = 0.36% of bandwidth
```

✅ **You can run 30 auctions/month using only 0.36% of free tier!**

---

## 🎯 Free Tier Capacity Summary

| Hosting Strategy | Auctions/Month (Free) | Recommended |
|------------------|----------------------|-------------|
| **Images External (CDN)** | **~8,000+** | ✅ **Highly Recommended** |
| Images on Vercel | ~800 | ⚠️ Works but wasteful |
| **Typical Usage** | **30-50 easily** | 🟢 **Well within limits** |

---

## 🛡️ MongoDB Atlas Free Tier

### M0 Sandbox (FREE Forever)

| Resource | Limit | Notes |
|----------|-------|-------|
| **Storage** | **512 MB** | 🟢 More than enough |
| **RAM** | 512 MB | 🟢 Sufficient |
| **Connections** | 500 | 🟢 Plenty |
| **Bandwidth** | Unlimited | 🟢 No worries! |

### Storage Calculation

**Your app per auction:** 76 KB

**Capacity:**
```
512 MB ÷ 76 KB = 6,736 tournaments
```

✅ **Can store ~6,700 tournaments!** (Years of data!)

---

## 💡 Cost Optimization Tips

### 1. **Use External Image Hosting (Critical!)**

**Recommended Free CDNs:**

#### Option A: Cloudinary (Free Tier)
- **Storage:** 25 GB
- **Bandwidth:** 25 GB/month
- **Transformations:** 25,000/month
- **Perfect for:** Player/team images

**Setup:**
```bash
npm install cloudinary
```

Add to `.env.local`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Option B: ImgBB (Free)
- **Direct image links**
- **No bandwidth limits**
- **Simple API**

#### Option C: AWS S3 (Generous Free Tier)
- **5 GB storage** (first year free)
- **20,000 GET requests**
- **2,000 PUT requests**

### 2. **Optimize Images**

**Before uploading:**
- Compress images: Use TinyPNG or ImageOptim
- Target size: 50-100 KB per player image
- Format: WebP (50% smaller than JPEG)

### 3. **Enable Vercel Image Optimization**

Use Next.js `<Image>` component:
```typescript
import Image from 'next/image';

<Image
  src={player.imageURL}
  width={100}
  height={100}
  alt={player.name}
/>
```

Benefits:
- Automatic WebP conversion
- Lazy loading
- Responsive sizing
- Cached on Vercel CDN

### 4. **Implement Browser Caching**

Add to `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
    ];
  },
};
```

### 5. **Monitor Usage**

**Vercel Analytics:**
- Go to Project → Analytics
- Monitor bandwidth usage
- Check build times
- Track function invocations

**Set up alerts:**
- Vercel → Project Settings → Usage
- Set threshold alerts at 80 GB (80% of free tier)

---

## 📈 Scaling Beyond Free Tier

### When You Might Need Pro Plan ($20/month)

**Indicators:**
- More than 100 GB bandwidth/month
- Need team collaboration
- Want advanced analytics
- Require faster builds
- Need priority support

### Pro Plan Includes:
- **1 TB bandwidth** (10x increase)
- **Unlimited team members**
- **Advanced analytics**
- **Priority support**
- **Faster builds**

**Cost per auction (Pro):**
- $20 ÷ 1000 auctions = **$0.02 per auction**
- Very affordable even at scale!

---

## 🔧 Post-Deployment Checklist

### Immediately After Deployment:

- [ ] Test all pages load correctly
- [ ] Verify database connection works
- [ ] Test SSE real-time updates
- [ ] Check all overlays load in OBS
- [ ] Test auction flow end-to-end
- [ ] Verify image loading from CDN
- [ ] Check API endpoints respond
- [ ] Test on mobile devices

### Custom Domain Setup (Optional):

**1. Buy domain** (Namecheap, GoDaddy, etc.)

**2. Add to Vercel:**
- Project Settings → Domains
- Add your domain
- Follow DNS instructions

**3. Update environment:**
```
NEXT_PUBLIC_API_URL=https://your-domain.com
```

---

## 🚨 Common Deployment Issues

### Issue 1: Build Fails

**Error:** "Module not found"

**Solution:**
```bash
# Ensure all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue 2: MongoDB Connection Fails

**Error:** "MongoServerError: Authentication failed"

**Solution:**
- Check MongoDB URI is correct
- Verify IP whitelist includes `0.0.0.0/0`
- Confirm password has no special characters (or encode them)
- Test connection locally first

### Issue 3: Environment Variables Not Working

**Error:** "Cannot read property of undefined"

**Solution:**
- Redeploy after adding environment variables
- Ensure variables start with `NEXT_PUBLIC_` for client-side
- Check capitalization matches exactly

### Issue 4: SSE Disconnects

**Error:** "Connection closed"

**Solution:**
- Vercel serverless functions have 10-second timeout (Hobby)
- Use Edge Runtime for long connections:

```typescript
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
```

---

## 📝 Environment Variables Guide

### Required Variables:

```bash
# MongoDB Connection (Server-side only)
MONGODB_URI=mongodb+srv://...

# API Base URL (Client-side accessible)
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app

# Optional: Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🎓 Summary

### Free Tier Capacity:

✅ **Recommended Setup (External Images):**
- **Bandwidth:** 100 GB/month
- **Realistic usage:** 30-50 auctions = ~360-600 MB
- **Capacity:** ~8,000 auctions/month theoretically
- **Percentage used:** Less than 1% of free tier
- **Cost:** $0/month

✅ **Database (MongoDB Atlas M0):**
- **Storage:** 512 MB
- **Your usage per auction:** 76 KB
- **Capacity:** ~6,700 tournaments
- **Cost:** $0/month

### Bottom Line:

🎉 **You can run 30-50 auctions per month COMPLETELY FREE indefinitely!**

Even heavy usage (100+ auctions/month) would stay within free tier if images are hosted externally.

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Pricing:** https://vercel.com/pricing
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Cloudinary:** https://cloudinary.com
- **Next.js Deployment Docs:** https://nextjs.org/docs/deployment

---

## 📞 Need Help?

- **Vercel Support:** https://vercel.com/support
- **MongoDB Support:** https://www.mongodb.com/support
- **Next.js Discord:** https://nextjs.org/discord

---

**Last Updated:** November 2024
**Version:** 2.0

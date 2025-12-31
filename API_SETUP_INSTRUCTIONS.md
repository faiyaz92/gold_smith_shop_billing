# 🏆 Gold Price API Setup Instructions
## Free APIs for GoldSmith Project

---

## 📋 Quick Start (5 Minutes)

### Option 1: Use CoinGecko (Zero Setup - Works Immediately)
✅ **NO API KEY REQUIRED**  
✅ **100% FREE**  
✅ **No Sign Up Needed**

The system will automatically use CoinGecko's PAX Gold (PAXG) price as a fallback. PAXG is a cryptocurrency backed 1:1 by physical gold in vaults.

**You can start using the app right now with zero configuration!**

---

### Option 2: Get Free API Keys (Recommended for Production)

#### 1️⃣ GoldAPI.io (Best Free Tier - 1000 requests/month)

**Why use this?**
- Most generous free tier (1000 requests/month)
- Real-time spot gold prices
- Updates every 60 seconds
- Covers 41+ days of hourly updates

**How to get FREE API key:**

1. Visit https://www.goldapi.io/
2. Click **"Get API Key"** (top right)
3. Sign up with email (no credit card required)
4. Confirm your email
5. Go to Dashboard → copy your API key
6. Create `.env.local` file in project root:
   ```bash
   NEXT_PUBLIC_GOLD_API_KEY=your_api_key_here
   ```

**Example API Key:**
```
goldapi-1a2b3c4d5e6f7g8h9i0j
```

---

#### 2️⃣ MetalpriceAPI.com (Secondary Fallback - 100 requests/month)

**Why use this?**
- Good backup API
- 100 free requests/month
- Covers 4+ days as fallback
- Reliable metal prices

**How to get FREE API key:**

1. Visit https://metalpriceapi.com/
2. Click **"Get Free API Key"**
3. Sign up with email
4. Check email and activate account
5. Login → Dashboard → copy API key
6. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_METAL_PRICE_API_KEY=your_api_key_here
   ```

---

## 🔄 How the Fallback System Works

```
┌─────────────────────────────────────────────┐
│  GOLD PRICE API FALLBACK CHAIN             │
└─────────────────────────────────────────────┘

Try #1: GoldAPI.io (1000/month)
   ↓ (if fails)
Try #2: MetalpriceAPI.com (100/month)
   ↓ (if fails)
Try #3: CoinGecko (unlimited, free)
   ↓ (if fails)
Fallback: Manual Entry Required
```

**Auto-Update Schedule:**
- System fetches price every **1 hour**
- 24 requests per day = 720 requests per month
- GoldAPI covers ~41 days alone
- Total coverage: **Infinite** (thanks to CoinGecko fallback)

---

## 📦 Installation Steps

### Step 1: Copy Environment File

```bash
# In project root directory
cp .env.local.example .env.local
```

### Step 2: Add Your API Keys

Edit `.env.local`:

```bash
# GoldAPI.io (Primary)
NEXT_PUBLIC_GOLD_API_KEY=goldapi-1a2b3c4d5e6f7g8h9i0j

# MetalpriceAPI.com (Secondary)
NEXT_PUBLIC_METAL_PRICE_API_KEY=metalapi-9z8y7x6w5v4u3t2s1r0q

# CoinGecko - No key needed, always works!
```

### Step 3: Restart Development Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## ✅ Testing the APIs

### Test API Refresh in Dashboard

1. Open Dashboard: http://localhost:3000/admin/dashboard
2. Look for **Gold Price Widget**
3. Click **"API Refresh"** button (blue button with globe icon)
4. Check the console for API source:
   - ✅ `goldapi.io` = Primary working
   - ✅ `metalpriceapi.com` = Secondary working
   - ✅ `coingecko.com (PAXG)` = Fallback working
   - ❌ `Manual entry required` = All APIs failed

### Console Messages to Look For

```javascript
// Success
[Gold Price API] Updated successfully: $2050.43/oz ($65.82/g) from goldapi.io

// Fallback
[Gold Price API] Primary API failed, trying secondary API (MetalpriceAPI)...

// Warning
[Gold Price API] ALERT: Significant gold price change: 2.5%
```

---

## 🆓 Free Tier Limits

| API | Free Requests | Coverage (Hourly) | Signup Required | Credit Card |
|-----|---------------|-------------------|-----------------|-------------|
| **GoldAPI.io** | 1000/month | 41 days | ✅ Yes (email) | ❌ No |
| **MetalpriceAPI** | 100/month | 4 days | ✅ Yes (email) | ❌ No |
| **CoinGecko** | Unlimited | Forever | ❌ No | ❌ No |

**Total Coverage:** ♾️ **Infinite** (CoinGecko has no limits)

---

## 🚨 Important Notes

### 1. API Key Security
- ✅ **DO:** Use `.env.local` file (already in .gitignore)
- ❌ **DON'T:** Commit API keys to Git
- ❌ **DON'T:** Share your API keys publicly

### 2. Rate Limiting
- GoldAPI: 1000 requests/month = ~33/day = hourly updates ✅
- MetalpriceAPI: 100 requests/month = ~3/day = backup ✅
- CoinGecko: No limits = always available ✅

### 3. Price Source Reliability
- **GoldAPI**: Most accurate (direct spot prices)
- **MetalpriceAPI**: Reliable (metal exchanges)
- **CoinGecko**: Good proxy (PAXG backed 1:1 by gold)

### 4. Auto-Update Behavior
- Updates every 1 hour automatically
- Alerts if price changes >2%
- Stores source (API/manual) with timestamp
- Falls back gracefully if API fails

---

## 🔧 Troubleshooting

### Problem: "All APIs failed" error

**Solution:**
1. Check internet connection
2. Verify API keys are correct in `.env.local`
3. Restart dev server: `npm run dev`
4. Check console for specific error messages
5. Try manual entry as fallback

### Problem: CoinGecko returns stale prices

**Solution:**
- CoinGecko updates less frequently (~5 minutes)
- Use GoldAPI or MetalpriceAPI for real-time prices
- Manual entry always available

### Problem: Rate limit exceeded

**Solution:**
- GoldAPI: Wait for monthly reset or upgrade plan
- System automatically tries next API in chain
- CoinGecko will always work (no limits)

---

## 📊 API Response Examples

### GoldAPI.io Success Response
```json
{
  "price": 2050.43,
  "timestamp": 1704067200,
  "metal": "XAU",
  "currency": "USD"
}
```

### MetalpriceAPI Success Response
```json
{
  "success": true,
  "timestamp": 1704067200,
  "base": "USD",
  "rates": {
    "XAU": 0.000488
  }
}
```

### CoinGecko Success Response
```json
{
  "pax-gold": {
    "usd": 2050.43
  }
}
```

---

## 🎯 Production Recommendations

### For Development
- Use **CoinGecko only** (no setup, works immediately)

### For Testing
- Add **GoldAPI** for real-time prices
- Keep CoinGecko as fallback

### For Production
- Use **all three APIs** for maximum reliability
- GoldAPI (primary) → MetalpriceAPI (backup) → CoinGecko (failsafe)

---

## 📞 Support

### API Provider Support
- **GoldAPI**: support@goldapi.io
- **MetalpriceAPI**: support@metalpriceapi.com
- **CoinGecko**: https://www.coingecko.com/en/api/documentation

### GoldSmith App Support
- Check console logs for error messages
- Review API documentation links above
- Manual entry always available as ultimate fallback

---

## ✨ Quick Reference

```bash
# Clone repo
git clone <repo-url>

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Add API keys (optional - CoinGecko works without keys)
nano .env.local

# Start server
npm run dev

# Test API refresh
# Dashboard → Gold Price Widget → Click "API Refresh"
```

**That's it! Your gold price API is ready! 🎉**

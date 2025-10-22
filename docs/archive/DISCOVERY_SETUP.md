# Web Discovery Configuration

## Overview

The crawler now uses **real internet search** to discover dental practices instead of hard-coded lists. It supports multiple discovery methods:

1. **Google Custom Search API** (Recommended)
2. **Bing Search API** 
3. **Web Scraping** (Fallback)
4. **Curated List** (Last resort fallback)

## Setup Instructions

### Method 1: Google Custom Search API (Best Results)

#### Step 1: Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Custom Search API**
4. Go to **APIs & Services** > **Credentials**
5. Create **API Key**
6. Copy your API key

#### Step 2: Create Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **Add** to create new search engine
3. Configure:
   - **Sites to search**: Leave empty for "Search the entire web"
   - **Name**: Dental Practice Finder
   - **Search settings**: Enable "Search the entire web"
4. Click **Create**
5. Copy your **Search engine ID** (cx parameter)

#### Step 3: Configure Environment

Add to `.env` file:

```bash
# Google Custom Search API
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_SEARCH_ENGINE_ID=YOUR_SEARCH_ENGINE_ID

# Example:
# GOOGLE_API_KEY=AIzaSyDhF8Gz9k2XxYYw-ABC123xyz
# GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i
```

**Pricing**: 
- Free: 100 queries/day
- Paid: $5 per 1000 queries

---

### Method 2: Bing Search API (Alternative)

#### Step 1: Get Bing API Key

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create **Bing Search v7** resource
3. Get your API key from **Keys and Endpoint**

#### Step 2: Configure Environment

Add to `.env` file:

```bash
# Bing Search API
BING_API_KEY=YOUR_BING_API_KEY_HERE

# Example:
# BING_API_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

**Pricing**: 
- Free tier: 1000 queries/month
- S1: $7 per 1000 queries

---

### Method 3: Web Scraping (No API Required)

This method is **automatically enabled** as a fallback. It scrapes:
- Official dental association directories
- Healthcare provider directories
- Public dental listings

**No configuration needed** - works out of the box!

---

### Method 4: Curated List (Fallback)

If all methods fail, the system falls back to a small curated list of known dental practices.

---

## Complete Setup Example

### 1. Create `.env` file in project root:

```bash
# Server Configuration
PORT=5000

# Google Custom Search (Primary method)
GOOGLE_API_KEY=AIzaSyDhF8Gz9k2XxYYw-ABC123xyz
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i

# Bing Search (Secondary method)
BING_API_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p

# Database (if applicable)
DATABASE_URL=postgresql://user:pass@localhost:5432/crm

# CORS
CORS_ORIGIN=*
```

### 2. Install dotenv support:

```bash
npm install @nestjs/config
```

### 3. Update `app.module.ts`:

```typescript
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TrackingModule,
    CrawlerModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 4. Restart the server:

```bash
npm run start:dev
```

---

## Usage Examples

### With Google Custom Search:

```bash
# Discover 20 US dental practices
curl "http://localhost:5000/crawler/discover?country=US&maxResults=20"

# Response will include practices from Google Search:
{
  "country": "US",
  "count": 20,
  "practices": [
    {
      "name": "Bright Smile Dental - New York",
      "url": "https://www.brightsmileny.com",
      "country": "US",
      "source": "google-custom-search",
      "discoveredAt": "2025-10-17T..."
    },
    // ... 19 more real practices
  ]
}
```

### Bulk Crawl with Discovery:

```bash
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "maxSites": 50,
    "maxPagesPerSite": 5,
    "downloadResources": true,
    "injectScript": true,
    "scriptConfig": {
      "clientId": "real-discovery-test",
      "trackingScriptUrl": "http://localhost:5000/script/real-discovery-test.js"
    }
  }'

# This will:
# 1. Search Google for 50 real US dental practices
# 2. Crawl each practice's website
# 3. Download 5 pages from each
# 4. Inject your tracking script
# 5. Return results
```

---

## Supported Countries

With API-based discovery, you can search in **any country**:

**Americas**: US, CA, MX, BR, AR, CL, CO  
**Europe**: UK, DE, FR, ES, IT, NL, BE, CH, AT, SE, NO, DK, FI, IE, PT, PL  
**Asia Pacific**: AU, NZ, SG, JP, IN, CN, KR, TH, MY, PH  
**Middle East**: AE, SA, IL  
**Africa**: ZA, EG, NG  

### Example: Discover in Multiple Countries

```bash
# Germany
curl "http://localhost:5000/crawler/discover?country=DE"

# Japan  
curl "http://localhost:5000/crawler/discover?country=JP"

# Australia
curl "http://localhost:5000/crawler/discover?country=AU"
```

---

## Discovery Methods Priority

The system tries methods in this order:

1. **Google Custom Search** (if API key configured)
   - Most accurate
   - Best quality results
   - Official websites

2. **Bing Search** (if API key configured)
   - Good alternative
   - Different results than Google
   - Complements Google results

3. **Web Scraping** (always available)
   - Scrapes dental directories
   - Free, no API needed
   - May be slower

4. **Curated Fallback** (last resort)
   - Small hand-picked list
   - Only if all methods fail
   - Ensures something always works

---

## Performance & Rate Limits

### Google Custom Search:
- **Free**: 100 searches/day
- **Rate**: ~10 results per search
- **Total free**: ~1000 practices/day

### Bing Search:
- **Free**: 1000 searches/month (~33/day)
- **Rate**: ~50 results per search
- **Total free**: ~1500 practices/day

### Web Scraping:
- **Unlimited** but slower
- Respectful delays (2s between requests)
- May be blocked by some sites

---

## Monitoring & Logs

Check logs to see which method is being used:

```bash
npm run start:dev

# You'll see:
[DiscoveryService] Discovering dental practices in US using multiple sources
[DiscoveryService] Found 15 practices via Google Custom Search
[DiscoveryService] Found 8 practices via Bing Search
[DiscoveryService] Found 12 practices via directory scraping
[DiscoveryService] Total discovered: 35 dental practices in US
```

---

## Cost Estimation

### For 1000 dental practices:

**Option 1: Google Custom Search Only**
- Searches needed: ~100 (10 results each)
- Cost: $0 (within free tier)
- Time: ~10 minutes

**Option 2: Google + Bing**
- Google: 50 searches ($0)
- Bing: 50 searches ($0)
- Cost: $0 (both free tier)
- Time: ~15 minutes

**Option 3: Web Scraping Only**
- Cost: $0 (completely free)
- Time: ~30-60 minutes (slower)

---

## Troubleshooting

### No results found:

```bash
# Check logs for errors
tail -f logs/app.log

# Verify API keys
echo $GOOGLE_API_KEY
echo $BING_API_KEY
```

### API quota exceeded:

```bash
# System will automatically fall back to scraping
# Or wait for quota to reset (daily/monthly)
```

### Invalid API key:

```bash
# Verify your .env file
cat .env | grep API_KEY

# Test API key directly
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_KEY&cx=YOUR_CX&q=test"
```

---

## Production Recommendations

1. **Use Google Custom Search** - Best quality results
2. **Add Bing as backup** - Different results, good complement
3. **Enable scraping fallback** - Always works, no cost
4. **Monitor quotas** - Set up alerts before limits
5. **Cache results** - Save discovered practices to database
6. **Rotate API keys** - Use multiple keys for higher volume

---

## Next Steps

1. Get your API keys (see setup above)
2. Add to `.env` file
3. Restart server
4. Test discovery: `curl http://localhost:5000/crawler/discover?country=US`
5. Run bulk crawl with real discovered practices

**Now you can discover thousands of real dental practices worldwide!** 🌍

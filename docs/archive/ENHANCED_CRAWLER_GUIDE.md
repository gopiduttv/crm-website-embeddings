# Enhanced Dental Practice Crawler - Complete Guide

## 🎯 Vision & Purpose

This crawler system is designed to:
1. **Discover** dental practice websites by country
2. **Download** pages in bulk for testing
3. **Inject** your tracking script into downloaded pages
4. **Test** if the script works correctly (form tracking, widgets, etc.)
5. **Measure** performance impact on the websites

## 🚀 Quick Start

### 1. Discover Dental Practices by Country

```bash
# Get supported countries
curl http://localhost:5000/crawler/countries

# Discover practices in the US
curl http://localhost:5000/crawler/discover?country=US

# Discover practices in the UK
curl http://localhost:5000/crawler/discover?country=UK
```

### 2. Bulk Crawl by Country

Download all dental practice websites from a specific country:

```bash
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "maxSites": 10,
    "maxPagesPerSite": 5,
    "downloadResources": true,
    "injectScript": false
  }'
```

### 3. Inject Your Tracking Script

After downloading sites, inject your tracking script:

```bash
curl -X POST http://localhost:5000/crawler/inject-script \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-dental-tracker",
    "trackingScriptUrl": "http://localhost:5000/v1/track/client-script.js",
    "position": "body-end",
    "config": {
      "forms": {
        "enabled": true,
        "autoCapture": true
      },
      "clicks": {
        "enabled": true
      }
    }
  }'
```

### 4. Test Your Tracking Script

Open the downloaded HTML files in a browser and test:
- Form submissions are captured
- Clicks are tracked
- Widgets are embedded correctly
- No JavaScript errors

### 5. Measure Performance Impact

```bash
curl "http://localhost:5000/crawler/performance-test-template?original=https://original-site.com&modified=http://localhost:8080/modified-site.html"
```

## 📋 Complete API Reference

### Discovery Endpoints

#### Get Supported Countries
```http
GET /crawler/countries
```

**Response:**
```json
{
  "countries": ["US", "UK", "CA", "AU"],
  "count": 4
}
```

#### Discover Practices by Country
```http
GET /crawler/discover?country=US
```

**Response:**
```json
{
  "country": "US",
  "count": 10,
  "practices": [
    {
      "name": "Aspen Dental - Vail",
      "url": "https://www.aspendentalvail.com",
      "country": "US",
      "source": "curated",
      "discoveredAt": "2025-10-17T..."
    }
  ]
}
```

### Bulk Crawling

#### Bulk Crawl by Country
```http
POST /crawler/bulk-crawl
Content-Type: application/json
```

**Request Body:**
```json
{
  "country": "US",
  "maxSites": 10,
  "maxPagesPerSite": 5,
  "downloadResources": true,
  "injectScript": true,
  "scriptConfig": {
    "clientId": "test-client",
    "trackingScriptUrl": "http://localhost:5000/v1/track/client-script.js",
    "position": "body-end",
    "config": {
      "forms": { "enabled": true }
    }
  }
}
```

**Response:**
```json
{
  "country": "US",
  "totalSites": 10,
  "totalPagesAttempted": 50,
  "totalPagesSuccessful": 48,
  "scriptInjected": true,
  "injectionResults": {
    "totalFiles": 48,
    "successful": 48,
    "failed": 0
  },
  "outputDirectory": "/path/to/downloaded-sites",
  "sites": [
    {
      "name": "Aspen Dental - Vail",
      "url": "https://www.aspendentalvail.com",
      "pagesDownloaded": 5,
      "pagesFailed": 0
    }
  ]
}
```

### Script Injection

#### Inject Script into Downloaded Sites
```http
POST /crawler/inject-script
Content-Type: application/json
```

**Request Body:**
```json
{
  "clientId": "test-tracker",
  "trackingScriptUrl": "http://localhost:5000/v1/track/client-script.js",
  "position": "body-end",
  "directory": "/path/to/downloaded-sites",
  "config": {
    "forms": {
      "enabled": true,
      "autoCapture": true,
      "excludeFields": ["password", "ssn"]
    },
    "clicks": {
      "enabled": true
    },
    "sessions": {
      "enabled": true,
      "recordDuration": true
    }
  }
}
```

**Position Options:**
- `head` - Inject in `<head>` section
- `body-start` - Right after `<body>` tag
- `body-end` - Before `</body>` tag (default)

**Response:**
```json
{
  "directory": "/path/to/downloaded-sites",
  "totalFiles": 48,
  "successful": 48,
  "failed": 0,
  "results": [
    {
      "file": "index.html",
      "success": true,
      "originalSize": 12458,
      "modifiedSize": 13120,
      "sizeDiff": 662
    }
  ]
}
```

#### Remove Injected Scripts
```http
POST /crawler/remove-scripts
Content-Type: application/json
```

**Request Body:**
```json
{
  "directory": "/path/to/downloaded-sites"
}
```

**Response:**
```json
{
  "directory": "/path/to/downloaded-sites",
  "restoredFiles": 48,
  "message": "Restored 48 files from backup"
}
```

### Performance Testing

#### Get Performance Test Template
```http
GET /crawler/performance-test-template?original=https://example.com&modified=http://localhost:8080/modified.html
```

Returns an HTML template for comparing performance between original and modified sites.

## 🔧 Complete Workflow Example

### Step 1: Discover and Bulk Crawl

```bash
# Discover US dental practices
curl http://localhost:5000/crawler/discover?country=US | jq '.practices[] | .name, .url'

# Bulk crawl without script injection first
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "maxSites": 5,
    "maxPagesPerSite": 3,
    "downloadResources": true,
    "injectScript": false
  }' | jq '.'
```

### Step 2: Inject Tracking Script

```bash
curl -X POST http://localhost:5000/crawler/inject-script \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "dental-test-001",
    "trackingScriptUrl": "http://localhost:5000/script/dental-test-001.js",
    "position": "body-end",
    "config": {
      "forms": {
        "enabled": true,
        "autoCapture": true,
        "excludeFields": ["password", "creditCard"]
      },
      "clicks": {
        "enabled": true,
        "captureSelectors": true
      },
      "sessions": {
        "enabled": true,
        "recordDuration": true
      },
      "debug": true
    }
  }' | jq '.'
```

### Step 3: Serve Files Locally

```bash
# Navigate to output directory
cd downloaded-sites

# Serve with Python
python3 -m http.server 8080

# Or with Node.js
npx http-server -p 8080 --cors
```

### Step 4: Test in Browser

Open in browser:
```
http://localhost:8080/www_aspendentalvail_com/index.html
```

**Test Checklist:**
- [ ] Page loads without errors
- [ ] Forms can be filled out
- [ ] Form submissions are tracked
- [ ] Clicks are recorded
- [ ] No console errors
- [ ] Widgets appear correctly
- [ ] No visual glitches

### Step 5: Monitor Tracking Data

```bash
# Check if events are being captured
curl http://localhost:5000/v1/tracking/events/dental-test-001

# Check form submissions
curl http://localhost:5000/v1/tracking/forms/dental-test-001

# Check sessions
curl http://localhost:5000/v1/tracking/sessions/dental-test-001
```

### Step 6: Performance Testing

```bash
# Generate performance comparison page
curl "http://localhost:5000/crawler/performance-test-template?original=https://www.aspendentalvail.com&modified=http://localhost:8080/www_aspendentalvail_com/index.html" | jq -r '.template' > performance-test.html

# Open in browser
open performance-test.html
```

### Step 7: Cleanup

```bash
# Remove injected scripts (restore originals)
curl -X POST http://localhost:5000/crawler/remove-scripts

# Or delete everything
curl -X DELETE http://localhost:5000/crawler/cleanup
```

## 🧪 Testing Scenarios

### Scenario 1: Form Tracking Test

1. Bulk crawl dental sites
2. Inject script with form tracking enabled
3. Open each site locally
4. Fill out appointment/contact forms
5. Verify data in tracking dashboard

### Scenario 2: Performance Impact Test

1. Crawl sites WITHOUT script injection
2. Measure baseline performance
3. Inject tracking script
4. Measure performance again
5. Compare metrics (should be < 5% impact)

### Scenario 3: Multi-Country Test

1. Crawl sites from US, UK, CA
2. Inject script with same config
3. Test across different site structures
4. Verify tracking works universally

### Scenario 4: Widget Integration Test

1. Crawl sites with complex layouts
2. Inject script with widget config
3. Verify widgets render correctly
4. Test responsiveness on mobile

## 📊 Expected Results

### Good Performance Impact:
- Load time increase: < 100ms
- Script size: < 50KB (gzipped)
- No blocking resources
- Async loading

### Successful Tracking:
- 100% of forms captured
- All button clicks recorded
- No JavaScript errors
- Proper data structure

## 🎯 Supported Countries

Currently supported:
- **US** (United States) - 10+ practices
- **UK** (United Kingdom) - 3+ practices  
- **CA** (Canada) - 2+ practices
- **AU** (Australia) - 2+ practices

## 🔄 Automated Testing Script

Create `test-all-countries.sh`:

```bash
#!/bin/bash

COUNTRIES=("US" "UK" "CA" "AU")

for country in "${COUNTRIES[@]}"; do
    echo "Testing $country..."
    
    # Bulk crawl
    curl -X POST http://localhost:5000/crawler/bulk-crawl \
      -H "Content-Type: application/json" \
      -d "{
        \"country\": \"$country\",
        \"maxSites\": 3,
        \"maxPagesPerSite\": 2,
        \"downloadResources\": true,
        \"injectScript\": true,
        \"scriptConfig\": {
          \"clientId\": \"test-$country\",
          \"trackingScriptUrl\": \"http://localhost:5000/v1/track/client-script.js\",
          \"position\": \"body-end\"
        }
      }" | jq '.'
    
    echo "✅ $country complete"
    echo "---"
done

echo "All countries tested!"
```

## 🛠️ Troubleshooting

### Issue: No sites discovered
**Solution**: Check if country code is correct (US, UK, CA, AU)

### Issue: Script injection fails
**Solution**: Ensure HTML files have proper `<body>` tags

### Issue: Performance degradation
**Solution**: 
- Check script size
- Enable async loading
- Minimize API calls
- Use efficient selectors

### Issue: CORS errors
**Solution**: Serve files with proper CORS headers:
```bash
npx http-server -p 8080 --cors
```

## 📝 Best Practices

1. **Start small**: Test with 2-3 sites first
2. **Backup originals**: Always keep original files
3. **Test incrementally**: Test one feature at a time
4. **Monitor performance**: Check impact on each site
5. **Use staging**: Test before production deployment
6. **Respect robots.txt**: Follow crawling guidelines
7. **Rate limit**: Add delays between requests
8. **Clean up**: Remove test data regularly

## 🚀 Next Steps

1. Expand country support
2. Add more dental practices
3. Implement Google Custom Search API
4. Add automated testing suite
5. Create performance benchmarks
6. Build CI/CD pipeline for testing

---

**You now have a complete system to:**
- ✅ Discover dental practices by country
- ✅ Download sites in bulk
- ✅ Inject tracking scripts
- ✅ Test functionality
- ✅ Measure performance impact

Ready to test your CRM tracking system at scale! 🎉

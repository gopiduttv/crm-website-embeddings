# ⚡ Quick Script Test Guide - Test Your Tracking Script in 2 Minutes

## 🎯 Goal
Test if your tracking script works on a real dental practice website downloaded from the internet.

---

## 🚀 Method 1: Fastest Way (One Command)

### Step 1: Download & Inject in One Command
```bash
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "maxSites": 1,
    "maxPagesPerSite": 1,
    "useSimpleDiscovery": true,
    "injectScript": true,
    "scriptConfig": {
      "clientId": "quick-test",
      "serverUrl": "http://localhost:5000",
      "position": "head"
    }
  }'
```

**What this does:**
1. ✅ Discovers 1 real dental practice (e.g., Gorman Dental)
2. ✅ Downloads the homepage
3. ✅ Injects your tracking script
4. ✅ Returns summary with file location

**Output:**
```json
{
  "country": "US",
  "totalSites": 1,
  "totalPagesSuccessful": 1,
  "scriptInjected": true,
  "sites": [
    {
      "name": "Gorman Dental",
      "url": "https://mgormandental.com/",
      "pagesDownloaded": 1
    }
  ]
}
```

### Step 2: Open the Downloaded Page
```bash
# Find the downloaded file
ls -lh downloaded-sites/

# Open in Firefox
firefox downloaded-sites/mgormandental_com/index.html

# Or Chrome
google-chrome downloaded-sites/mgormandental_com/index.html
```

### Step 3: Check if Script is Loaded
Open browser DevTools (F12) and check Console:
```
✅ Look for: "CRM Tracker initialized"
✅ Check Network tab for: /script/quick-test.js
✅ Test forms on the page to see tracking events
```

**Done! ⚡ You just tested your script on a real dental website!**

---

## 🎨 Method 2: Using Dashboard (Visual)

### Step 1: Open Dashboard
```
http://localhost:5000/crawler-test.html
```

### Step 2: Bulk Crawl Section (Section 2)
1. **Country**: Select "United States"
2. **Max sites**: `1`
3. **Pages per site**: `1`
4. **Check**: ✅ Inject Tracking Script
5. **Check**: ✅ Use Simple Discovery
6. **Click**: "🚀 Start Bulk Crawl"

### Step 3: Wait for Results
```
🔄 Starting bulk crawl...
✅ Downloaded 1 site
✅ Script injected successfully
```

### Step 4: Open Downloaded Page
Click the file path shown in results, or:
```bash
cd downloaded-sites
ls
# You'll see something like: mgormandental_com/
cd mgormandental_com
open index.html  # Mac
firefox index.html  # Linux
```

### Step 5: Verify Script in Browser
1. **Open DevTools** (F12 or Right-click → Inspect)
2. **Go to Console tab**
3. **Look for**:
   ```
   CRM Tracker initialized for client: bulk-test-US
   ```
4. **Check Network tab**:
   - Filter by "JS"
   - Look for: `bulk-test-US.js` (should be loaded)

---

## 🔍 Method 3: Test Specific Tracking Features

### Download a Site with Forms
```bash
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "maxSites": 1,
    "maxPagesPerSite": 3,
    "useSimpleDiscovery": true,
    "injectScript": true,
    "scriptConfig": {
      "clientId": "form-test",
      "serverUrl": "http://localhost:5000"
    }
  }'
```

### Test Form Tracking
1. Open downloaded page: `downloaded-sites/*/index.html`
2. **Find a contact form** on the page
3. **Fill out the form**
4. **Submit the form**
5. **Check DevTools Console**:
   ```
   ✅ Form submitted: contact-form
   ✅ Sending to: /v1/track/events
   ```

### Test Widget Embedding
1. Open the page
2. Look for **chat widget** or **booking widget** in bottom-right
3. Widget should be injected by your script

---

## 📊 Verify Script is Working

### Check 1: Script Tag Exists
```bash
# Search for your script in the downloaded HTML
grep -r "script/quick-test.js" downloaded-sites/

# Should show:
# <script src="http://localhost:5000/script/quick-test.js"></script>
```

### Check 2: View Script Source
```bash
# View the actual script being served
curl http://localhost:5000/script/quick-test.js | head -50
```

**Expected output:**
```javascript
(function() {
  // CRM Web Tracker - Client: quick-test
  console.log('CRM Tracker initialized for client: quick-test');
  
  // Track page views
  // Track form submissions
  // Embed widgets
  // ...
})();
```

### Check 3: Test Tracking Endpoint
```bash
# Check if tracking server receives events
curl -X POST http://localhost:5000/v1/track/events \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "quick-test",
    "eventType": "form_submission",
    "eventData": {
      "formId": "contact-form",
      "fields": {"name": "Test User", "email": "test@example.com"}
    }
  }'
```

**Expected:** 
```json
{"success": true, "message": "Event tracked"}
```

---

## 🎯 Complete Test Workflow (5 Minutes)

### Minute 1: Download & Inject
```bash
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{"country":"US","maxSites":1,"maxPagesPerSite":2,"useSimpleDiscovery":true,"injectScript":true,"scriptConfig":{"clientId":"test-123","serverUrl":"http://localhost:5000"}}'
```

### Minute 2: Verify Files
```bash
ls -lah downloaded-sites/
# Check that website folder exists
```

### Minute 3: Check Script Injection
```bash
# Pick any HTML file
cat downloaded-sites/*/index.html | grep -A 5 "script/test-123.js"
```

**Should see:**
```html
<script src="http://localhost:5000/script/test-123.js"></script>
```

### Minute 4: Open in Browser
```bash
firefox downloaded-sites/*/index.html &
```

### Minute 5: Test Features
1. Open DevTools (F12)
2. **Console**: Look for init message
3. **Network**: Check script loads (200 status)
4. **Fill a form**: Check tracking works
5. **Check widgets**: Look for embedded widgets

**✅ All working? Your script is production-ready!**

---

## 🐛 Troubleshooting

### Issue 1: Script Not Found in HTML
```bash
# Check injection results
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -d '...' | grep -A 5 "injectionResults"
```

**If successful = 0:**
- Files might not be HTML
- Script injector might have failed
- Check server logs

**Fix:**
```bash
# Manually inject into existing downloads
curl -X POST http://localhost:5000/crawler/inject-script \
  -H "Content-Type: application/json" \
  -d '{
    "directory": "downloaded-sites/mgormandental_com",
    "scriptConfig": {
      "clientId": "manual-test",
      "serverUrl": "http://localhost:5000"
    }
  }'
```

### Issue 2: Script Loads but No Tracking
**Check browser console for errors:**
```
❌ CORS error → Enable CORS in .env
❌ Network error → Check server is running
❌ Script error → Check script syntax
```

**Test script directly:**
```bash
# Visit in browser:
http://localhost:5000/script/test-123.js

# Should return JavaScript code
```

### Issue 3: No Dental Sites Found
```bash
# If simple discovery returns 0 sites, try different country
curl 'http://localhost:5000/crawler/discover?country=UK&simple=true'

# Or use curated fallback (always works)
curl 'http://localhost:5000/crawler/sample-websites'
```

---

## 📝 Real-World Test Script

Save this as `test-script.sh`:

```bash
#!/bin/bash

echo "🚀 Quick Script Test - Starting..."
echo ""

# Step 1: Create a client
echo "1️⃣ Creating test client..."
curl -s -X POST http://localhost:5000/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "quick-dental-test",
    "name": "Quick Test Practice",
    "widgets": {
      "forms": {"enabled": true, "autoCapture": true}
    }
  }' | python3 -m json.tool

echo ""
echo "2️⃣ Downloading real dental website with script..."
RESULT=$(curl -s -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "maxSites": 1,
    "maxPagesPerSite": 2,
    "useSimpleDiscovery": true,
    "injectScript": true,
    "scriptConfig": {
      "clientId": "quick-dental-test",
      "serverUrl": "http://localhost:5000",
      "position": "head"
    }
  }')

echo "$RESULT" | python3 -m json.tool
echo ""

# Extract site info
SITE_NAME=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['sites'][0]['name'])")
SITE_URL=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['sites'][0]['url'])")

echo "3️⃣ Downloaded: $SITE_NAME"
echo "   URL: $SITE_URL"
echo ""

# Find the downloaded file
HTML_FILE=$(find downloaded-sites -name "index.html" | head -1)

if [ -f "$HTML_FILE" ]; then
    echo "4️⃣ Verifying script injection..."
    if grep -q "quick-dental-test.js" "$HTML_FILE"; then
        echo "   ✅ Script found in HTML!"
        echo ""
        echo "5️⃣ Script tag:"
        grep "quick-dental-test.js" "$HTML_FILE"
    else
        echo "   ❌ Script NOT found in HTML"
    fi
    
    echo ""
    echo "6️⃣ Opening in browser..."
    echo "   File: $HTML_FILE"
    
    # Open in default browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "$HTML_FILE"
    elif command -v firefox &> /dev/null; then
        firefox "$HTML_FILE" &
    else
        echo "   Please manually open: $HTML_FILE"
    fi
    
    echo ""
    echo "✅ Test complete!"
    echo "   👉 Check browser DevTools console for tracking messages"
else
    echo "❌ No HTML file found"
fi
```

### Run the test script:
```bash
chmod +x test-script.sh
./test-script.sh
```

---

## 🎉 Success Checklist

After running the quick test, verify:

- ✅ **Script downloaded** a real dental website (not hardcoded list)
- ✅ **Script injected** into HTML `<head>` or `<body>`
- ✅ **Browser loads** the tracking script (check Network tab)
- ✅ **Console shows** "CRM Tracker initialized" message
- ✅ **Form tracking** works (if forms exist on page)
- ✅ **Widgets embed** correctly (if configured)
- ✅ **Events sent** to tracking endpoint (check Network tab)

**All checked? Your tracking script is working perfectly! 🎊**

---

## 📚 Next Steps

### Test More Features:
1. **Multiple pages**: Set `maxPagesPerSite: 5`
2. **Multiple sites**: Set `maxSites: 10`
3. **Different countries**: Try UK, CA, AU
4. **Form tracking**: Test contact forms
5. **Widget embedding**: Test chat widgets
6. **Performance**: Check page load time impact

### Production Deployment:
1. Get API keys for more dental sites (optional)
2. Deploy to production server
3. Update `serverUrl` in script config
4. Test on live dental practice websites
5. Monitor tracking data in your CRM

**Need help? Check the full documentation:**
- `SIMPLE_DISCOVERY_INTEGRATION.md` - How discovery works
- `DASHBOARD_UPDATE_SUMMARY.md` - Dashboard features
- `API_DOCS.md` - Full API reference

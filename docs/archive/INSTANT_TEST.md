# ⚡ FASTEST WAY TO TEST YOUR SCRIPT (30 Seconds)

## 🎯 One Command Does Everything

This single command will:
1. ✅ Find a real dental practice website (from OpenStreetMap)
2. ✅ Download the homepage  
3. ✅ Inject your tracking script
4. ✅ Save to `downloaded-sites/` folder

### The Magic Command:

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
      "clientId": "my-test",
      "serverUrl": "http://localhost:5000"
    }
  }'
```

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

---

## 📂 Find Your Downloaded Website

```bash
# List downloaded sites
ls downloaded-sites/

# You'll see something like:
# mgormandental_com/
```

---

## 🌐 Open in Browser

```bash
# Method 1: Firefox
firefox downloaded-sites/*/index.html

# Method 2: Chrome
google-chrome downloaded-sites/*/index.html

# Method 3: Find the exact path
find downloaded-sites -name "index.html"
# Then open that file
```

---

## ✅ Verify Script is Working

### 1. Open Browser DevTools (F12)

### 2. Check Console Tab
Look for:
```
CRM Tracker initialized for client: my-test
```

### 3. Check Network Tab
- Filter by "JS"
- Look for: `my-test.js` (should show 200 OK status)

### 4. Check HTML Source
- View Page Source (Ctrl+U)
- Search for: `script/my-test.js`
- Should find:
  ```html
  <script src="http://localhost:5000/script/my-test.js"></script>
  ```

---

## 🎨 Using Dashboard (Visual Way)

### Open Dashboard:
```
http://localhost:5000/crawler-test.html
```

### Steps:
1. Go to **Section 2: Bulk Crawl by Country**
2. Select: **United States**
3. Max sites: **1**
4. Pages per site: **1** 
5. ✅ Check: **Inject Tracking Script**
6. ✅ Check: **Use Simple Discovery**
7. Click: **🚀 Start Bulk Crawl**
8. Wait ~10 seconds
9. Click the file path in results to open

---

## 🔍 Verify Script Manually

```bash
# Check if script was injected
grep -r "my-test.js" downloaded-sites/

# Should output:
# downloaded-sites/mgormandental_com/index.html:<script src="http://localhost:5000/script/my-test.js"></script>
```

---

## 🧪 Test Different Dental Sites

### Test 3 sites at once:
```bash
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "maxSites": 3,
    "maxPagesPerSite": 2,
    "useSimpleDiscovery": true,
    "injectScript": true,
    "scriptConfig": {
      "clientId": "multi-test",
      "serverUrl": "http://localhost:5000"
    }
  }'
```

**Result:** 3 real dental websites downloaded with your script injected!

---

## 💡 Pro Tips

### Test Form Tracking
1. Download a site: (use command above)
2. Open the downloaded page
3. Find a contact form
4. Fill it out
5. Check DevTools Console for form tracking events

### Test Widget Embedding  
1. Check if your script embeds widgets
2. Look for chat bubble in bottom-right corner
3. Check Console for widget initialization messages

### Test Performance
1. Open DevTools → Network tab
2. Reload page
3. Check:
   - Script load time (should be <100ms)
   - No console errors
   - Total page load not significantly impacted

---

## 🚀 Complete Test Example

```bash
# 1. Download site with script
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{"country":"US","maxSites":1,"maxPagesPerSite":1,"useSimpleDiscovery":true,"injectScript":true,"scriptConfig":{"clientId":"test-123","serverUrl":"http://localhost:5000"}}'

# 2. Verify script injection
grep -r "test-123.js" downloaded-sites/

# 3. Check the script content
curl http://localhost:5000/script/test-123.js | head -20

# 4. Open in browser
firefox downloaded-sites/*/index.html &

# 5. Check DevTools Console (should see initialization message)
```

---

## ✅ Success Checklist

After running the test, verify:

- ✅ Website downloaded to `downloaded-sites/` folder
- ✅ Script tag exists in HTML: `<script src="http://localhost:5000/script/my-test.js"></script>`
- ✅ Script loads in browser (Network tab shows 200 OK)
- ✅ Console shows: "CRM Tracker initialized"
- ✅ No JavaScript errors in console
- ✅ Page displays correctly (script doesn't break site)

**All checked? Your script works! 🎉**

---

## 📚 More Details

- **Full Guide**: See `QUICK_SCRIPT_TEST.md`
- **Dashboard Guide**: See `DASHBOARD_UPDATE_SUMMARY.md`
- **Integration Details**: See `SIMPLE_DISCOVERY_INTEGRATION.md`

---

## 🎯 Summary

**Fastest way to test:**
```bash
# One command:
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{"country":"US","maxSites":1,"useSimpleDiscovery":true,"injectScript":true,"scriptConfig":{"clientId":"quick","serverUrl":"http://localhost:5000"}}'

# Open result:
firefox downloaded-sites/*/index.html

# Check DevTools → Console for "CRM Tracker initialized"
```

**That's it! 30 seconds from command to verified working script! ⚡**

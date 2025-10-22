# Testing Tracking Integration with Crawled Sites

## Overview
This guide shows how to use the crawled dental practice websites to test your CRM tracking system.

## Step-by-Step Testing Process

### 1. Crawl a Test Website
```bash
curl -X POST http://localhost:5000/crawler/crawl-single \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.aspendentalvail.com",
    "maxPages": 3,
    "downloadResources": true
  }'
```

### 2. Locate Downloaded Files
The files will be in: `website-service/downloaded-sites/www_aspendentalvail_com/`

### 3. Inject Your Tracking Script

#### Option A: Modify HTML Files
Add your tracking script to the downloaded HTML files:

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Original head content -->
    
    <!-- Add your tracking script -->
    <script src="http://localhost:5000/v1/track/client-script.js?clientId=test-client-123"></script>
</head>
<body>
    <!-- Original body content -->
</body>
</html>
```

#### Option B: Create a Test Wrapper
Create a new HTML file that loads the downloaded page in an iframe:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Tracking Test Wrapper</title>
    <script src="http://localhost:5000/v1/track/client-script.js?clientId=test-client-123"></script>
</head>
<body>
    <h1>Testing: www.aspendentalvail.com</h1>
    <iframe src="downloaded-sites/www_aspendentalvail_com/index.html" 
            width="100%" 
            height="800px">
    </iframe>
</body>
</html>
```

### 4. Serve the Files Locally

#### Using Python:
```bash
cd website-service
python3 -m http.server 8080
```

#### Using Node.js (http-server):
```bash
npx http-server -p 8080
```

#### Using the built-in NestJS static serving:
The files are already accessible if you configure static file serving in NestJS.

### 5. Test Tracking Features

Open the served HTML file in your browser and test:

#### A. Form Tracking
1. Fill out any forms on the dental practice site
2. Check your tracking dashboard for form submissions
3. Verify field-level tracking works

#### B. Click Tracking
1. Click various links and buttons
2. Check for click events in your tracking data
3. Verify click heatmaps if implemented

#### C. Session Recording
1. Navigate through multiple pages
2. Check if session recordings are captured
3. Verify replay functionality

#### D. Custom Events
1. Trigger specific interactions (modals, menus, etc.)
2. Check if custom events are captured
3. Verify event metadata

### 6. Verify Data Collection

Check your tracking API for collected data:

```bash
# Get recent events
curl http://localhost:5000/v1/tracking/events/test-client-123

# Get sessions
curl http://localhost:5000/v1/tracking/sessions/test-client-123

# Get form submissions
curl http://localhost:5000/v1/tracking/forms/test-client-123
```

## Automated Testing Script

Create `test-tracking-integration.sh`:

```bash
#!/bin/bash

CLIENT_ID="test-dental-site"
BASE_URL="http://localhost:5000"

echo "🧪 Testing Tracking Integration"
echo "================================"

# 1. Crawl a test site
echo "1. Crawling test website..."
CRAWL_RESULT=$(curl -s -X POST ${BASE_URL}/crawler/crawl-single \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.aspendentalvail.com",
    "maxPages": 2,
    "downloadResources": true
  }')

echo "✅ Crawl complete"
echo ""

# 2. Get output directory
OUTPUT_DIR=$(echo $CRAWL_RESULT | jq -r '.outputDirectory')
echo "2. Files saved to: $OUTPUT_DIR"
echo ""

# 3. List downloaded HTML files
echo "3. Downloaded HTML files:"
find "$OUTPUT_DIR" -name "*.html" | head -5
echo ""

# 4. Create a test HTML file with tracking
TEST_FILE="$OUTPUT_DIR/../../public/tracking-test.html"
cat > "$TEST_FILE" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Tracking Test</title>
    <script src="http://localhost:5000/v1/track/client-script.js?clientId=test-dental-site"></script>
</head>
<body>
    <h1>Test Dental Practice Site</h1>
    
    <form id="appointment-form">
        <input type="text" name="name" placeholder="Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="tel" name="phone" placeholder="Phone" required>
        <button type="submit">Book Appointment</button>
    </form>

    <script>
        document.getElementById('appointment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Form submitted! Check your tracking dashboard.');
        });
    </script>
</body>
</html>
EOF

echo "4. Created test file: $TEST_FILE"
echo ""

# 5. Instructions
echo "5. Next steps:"
echo "   - Open in browser: http://localhost:5000/tracking-test.html"
echo "   - Fill out the form"
echo "   - Check tracking data at: ${BASE_URL}/v1/tracking/events/${CLIENT_ID}"
echo ""

echo "================================"
echo "✅ Test setup complete!"
```

## Expected Results

### Successful Tracking Should Show:

1. **Page Views**: Each HTML file visit logged
2. **Form Interactions**: 
   - Field focus events
   - Field blur events
   - Form submission events
   - Field values (if configured)

3. **Click Events**:
   - All clickable elements tracked
   - Element selectors captured
   - Click coordinates recorded

4. **Session Data**:
   - Session ID
   - Duration
   - Page sequence
   - User agent info

## Common Issues & Solutions

### Issue: Tracking Script Not Loading
**Solution**: Check CORS configuration in your NestJS app:
```typescript
app.enableCors({
  origin: '*', // or specific origins
  credentials: true,
});
```

### Issue: No Events Captured
**Solution**: 
1. Check browser console for errors
2. Verify client ID is correct
3. Check WebSocket connection (if used)
4. Verify tracking script is loaded before page content

### Issue: Form Data Not Captured
**Solution**:
1. Ensure form tracking is enabled in client config
2. Check excluded fields configuration
3. Verify form submission events are firing

### Issue: Cross-Origin Errors
**Solution**: Serve files from the same origin as tracking server, or configure CORS properly

## Performance Testing

Test with multiple concurrent users:

```bash
# Use Apache Bench
ab -n 100 -c 10 http://localhost:8080/tracking-test.html

# Or use wrk
wrk -t4 -c10 -d30s http://localhost:8080/tracking-test.html
```

Monitor tracking server performance during load testing.

## Clean Up

After testing:
```bash
curl -X DELETE http://localhost:5000/crawler/cleanup
```

## Next Steps

1. **Test with real forms**: Use actual dental practice forms
2. **Test different browsers**: Chrome, Firefox, Safari
3. **Test mobile devices**: Use responsive design testing
4. **Test edge cases**: Form validation, errors, timeouts
5. **Performance testing**: High traffic scenarios
6. **Privacy compliance**: Verify PII handling

## Integration Checklist

- [ ] Tracking script loads successfully
- [ ] Page views are captured
- [ ] Form interactions are tracked
- [ ] Click events are recorded
- [ ] Session data is correct
- [ ] No console errors
- [ ] CORS is configured properly
- [ ] Performance is acceptable
- [ ] Data privacy is maintained
- [ ] Error handling works

---

**Ready to test!** Follow these steps to validate your tracking integration with real dental practice websites.

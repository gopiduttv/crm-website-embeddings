# Website Crawler Service - Quick Start Guide

## 🎯 Overview

A complete web crawler service that downloads dental practice websites for testing your CRM tracking integration. Built with NestJS, it automatically crawls websites, downloads HTML pages with their resources (CSS, JS, images), and organizes them for easy testing.

## 📦 What Was Created

### Core Files:
1. **`src/crawler/crawler.service.ts`** - Main crawler service with all crawling logic
2. **`src/crawler/crawler.controller.ts`** - REST API endpoints
3. **`src/crawler/crawler.module.ts`** - NestJS module configuration
4. **`public/crawler-test.html`** - Interactive web dashboard for testing
5. **`test-crawler.sh`** - Bash script for command-line testing
6. **`CRAWLER_README.md`** - Comprehensive documentation

### Features:
- ✅ Crawl single or multiple websites
- ✅ Download HTML, CSS, JavaScript, and images
- ✅ Follow internal links automatically
- ✅ Configurable crawl depth and options
- ✅ Pre-configured with 5 dental practice websites
- ✅ Organized output directory structure
- ✅ REST API for integration
- ✅ Interactive test dashboard

## 🚀 Quick Start

### 1. Dependencies are already installed:
```bash
npm install axios cheerio @types/cheerio
```

### 2. Start the server:
```bash
npm run start:dev
```

### 3. Test with the web dashboard:
Open in your browser:
```
http://localhost:5000/crawler-test.html
```

### 4. Or use the command-line test script:
```bash
./test-crawler.sh
```

## 📋 API Endpoints

### Crawl Multiple Sites (Default Sample Sites)
```bash
curl -X POST http://localhost:5000/crawler/crawl \
  -H "Content-Type: application/json" \
  -d '{"maxPages": 5, "downloadResources": true}'
```

### Crawl Single Site
```bash
curl -X POST http://localhost:5000/crawler/crawl-single \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.aspendentalvail.com",
    "maxPages": 3,
    "downloadResources": true
  }'
```

### Get Sample Websites
```bash
curl http://localhost:5000/crawler/sample-websites
```

### Get Output Directory
```bash
curl http://localhost:5000/crawler/output-directory
```

### Cleanup Downloads
```bash
curl -X DELETE http://localhost:5000/crawler/cleanup
```

## 📁 Output Structure

Downloaded websites are saved to:
```
website-service/downloaded-sites/
├── www_aspendentalvail_com/
│   ├── index.html
│   ├── about.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       └── logo.png
└── www_smileteam_com/
    └── ...
```

## 🏥 Sample Dental Practice Websites

Pre-configured websites for testing:
1. https://www.aspendentalvail.com
2. https://www.smileteam.com
3. https://www.westlakedentistry.com
4. https://www.drcaratozzolo.com
5. https://www.elevatedentistry.com

## 🧪 Testing Your Tracking Integration

1. **Crawl websites:**
   ```bash
   curl -X POST http://localhost:5000/crawler/crawl
   ```

2. **Find downloaded files:**
   ```bash
   ls -la downloaded-sites/
   ```

3. **Open HTML files** in your browser

4. **Test your tracking:**
   - Form capture
   - Click tracking
   - Session recording
   - Custom events

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxPages` | number | 10 | Max pages per website |
| `downloadResources` | boolean | true | Download CSS/JS/images |
| `followLinks` | boolean | true | Follow internal links |
| `sameOriginOnly` | boolean | true | Stay on same domain |

## 🔧 Programmatic Usage

```typescript
import { CrawlerService } from './crawler/crawler.service';

constructor(private crawlerService: CrawlerService) {}

async crawlSite() {
  const results = await this.crawlerService.crawlWebsite(
    'https://example-dental.com',
    { maxPages: 5, downloadResources: true }
  );
  console.log('Downloaded:', results);
}
```

## 📊 Example Response

```json
{
  "totalWebsites": 5,
  "totalPages": 25,
  "successfulPages": 23,
  "failedPages": 2,
  "outputDirectory": "/path/to/downloaded-sites",
  "results": [
    {
      "website": "https://www.aspendentalvail.com",
      "pagesDownloaded": 5,
      "pagesFailed": 0
    }
  ]
}
```

## 🎨 Interactive Dashboard

Access the web-based test dashboard at:
```
http://localhost:5000/crawler-test.html
```

Features:
- Browse sample websites
- Start crawl operations
- View real-time results
- Check output directory
- Cleanup downloads

## ⚠️ Best Practices

1. **Be Respectful**: Built-in delays prevent server overload
2. **Check robots.txt**: Ensure crawling is allowed
3. **Limit Scope**: Use `maxPages` to control crawl depth
4. **Test Incrementally**: Start with 1-2 pages before full crawl
5. **Cleanup Regularly**: Remove old downloads to save space

## 🐛 Troubleshooting

### Server not running
```bash
npm run start:dev
```

### Port already in use
Change port in `src/main.ts`:
```typescript
await app.listen(5001); // Use different port
```

### Timeouts
Increase timeout in `crawler.service.ts`:
```typescript
timeout: 15000, // milliseconds
```

### Missing resources
Check network connectivity and CORS policies

## 📚 Additional Resources

- **Full Documentation**: See `CRAWLER_README.md`
- **Test Script**: Run `./test-crawler.sh`
- **Dashboard**: Open `public/crawler-test.html`

## 🎯 Next Steps

1. Start the server: `npm run start:dev`
2. Open dashboard: `http://localhost:5000/crawler-test.html`
3. Click "Crawl Single Site" to test
4. Check `downloaded-sites/` folder
5. Use downloaded HTML files to test your tracking system

## 💡 Tips

- Start with `maxPages: 3` for quick tests
- Use the dashboard for visual feedback
- Check console logs for detailed progress
- Downloaded files are static - perfect for testing
- Each website gets its own subdirectory

---

**Ready to test!** 🚀 Start the server and open the dashboard to begin crawling dental practice websites.

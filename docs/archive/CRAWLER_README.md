# Website Crawler Service

A NestJS service for crawling dental practice websites and downloading their pages for testing the CRM tracking system integration.

## Features

- 🕷️ Crawl single or multiple websites
- 📥 Download HTML pages with CSS, JavaScript, and images
- 🔗 Follow internal links automatically
- 🎯 Configurable crawl depth and resource downloading
- 🏥 Pre-configured with sample dental practice websites
- 📁 Organized output directory structure
- 🧹 Easy cleanup of downloaded content

## Installation

Install the required dependencies:

```bash
npm install axios cheerio
npm install -D @types/cheerio
```

## Usage

### API Endpoints

#### 1. Crawl Multiple Websites (with defaults)

```bash
POST /crawler/crawl
```

**Request Body (optional):**
```json
{
  "urls": ["https://example-dental.com", "https://another-dental.com"],
  "maxPages": 10,
  "downloadResources": true,
  "followLinks": true,
  "sameOriginOnly": true
}
```

If no URLs are provided, it will use the default sample dental practice websites.

**Example:**
```bash
curl -X POST http://localhost:5000/crawler/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "maxPages": 5,
    "downloadResources": true
  }'
```

#### 2. Crawl Single Website

```bash
POST /crawler/crawl-single
```

**Request Body:**
```json
{
  "url": "https://www.aspendentalvail.com",
  "maxPages": 10,
  "downloadResources": true,
  "followLinks": true,
  "sameOriginOnly": true
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/crawler/crawl-single \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.smileteam.com",
    "maxPages": 5
  }'
```

#### 3. Get Sample Websites

```bash
GET /crawler/sample-websites
```

Returns the list of pre-configured dental practice websites.

**Example:**
```bash
curl http://localhost:5000/crawler/sample-websites
```

#### 4. Get Output Directory

```bash
GET /crawler/output-directory
```

Returns the path where downloaded websites are stored.

**Example:**
```bash
curl http://localhost:5000/crawler/output-directory
```

#### 5. Cleanup Downloaded Sites

```bash
DELETE /crawler/cleanup
```

Removes all downloaded websites from the output directory.

**Example:**
```bash
curl -X DELETE http://localhost:5000/crawler/cleanup
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxPages` | number | 10 | Maximum number of pages to crawl per website |
| `downloadResources` | boolean | true | Download CSS, JS, and images |
| `followLinks` | boolean | true | Follow links found on pages |
| `sameOriginOnly` | boolean | true | Only crawl links from the same domain |

## Output Structure

Downloaded websites are organized in the following structure:

```
website-service/
└── downloaded-sites/
    ├── www_aspendentalvail_com/
    │   ├── index.html
    │   ├── about.html
    │   ├── css/
    │   │   ├── styles.css
    │   │   └── theme.css
    │   ├── js/
    │   │   ├── main.js
    │   │   └── analytics.js
    │   └── images/
    │       ├── logo.png
    │       └── banner.jpg
    └── www_smileteam_com/
        └── ...
```

## Integration with App Module

Add the CrawlerModule to your main app module:

```typescript
import { Module } from '@nestjs/common';
import { CrawlerModule } from './crawler/crawler.module';

@Module({
  imports: [
    // ... other modules
    CrawlerModule,
  ],
})
export class AppModule {}
```

## Sample Dental Practice Websites

The service comes pre-configured with the following sample dental practice websites:

1. https://www.aspendentalvail.com
2. https://www.smileteam.com
3. https://www.westlakedentistry.com
4. https://www.drcaratozzolo.com
5. https://www.elevatedentistry.com

## Using Downloaded Sites for Testing

After downloading websites, you can use them to test your tracking system:

1. **Start the crawl:**
   ```bash
   curl -X POST http://localhost:5000/crawler/crawl
   ```

2. **Check the output directory:**
   ```bash
   ls -la downloaded-sites/
   ```

3. **Serve the downloaded HTML files** using your tracking system to test:
   - Form capture functionality
   - Click tracking
   - Session recording
   - Custom events

4. **Open the HTML files** in a browser and verify that your tracking scripts work correctly

## Best Practices

- **Be Respectful**: The crawler includes delays between requests to avoid overwhelming servers
- **Check robots.txt**: Ensure you have permission to crawl the websites
- **Limit Scope**: Use `maxPages` to limit the crawl depth for testing purposes
- **Same Origin**: Keep `sameOriginOnly: true` to avoid crawling external sites
- **Cleanup Regularly**: Use the cleanup endpoint to remove old downloads

## Troubleshooting

### CORS Issues
The downloaded HTML files are static and won't have CORS issues when served locally.

### Missing Resources
If resources aren't downloading, check:
- The website's CORS policy
- Network connectivity
- Resource URL resolution

### Timeout Errors
Increase timeout in the service configuration if needed:
```typescript
// In crawler.service.ts
timeout: 15000, // Increase from 10000
```

## Advanced Usage

### Programmatic Usage

You can also use the CrawlerService directly in your code:

```typescript
import { CrawlerService } from './crawler/crawler.service';

// In your service/controller
constructor(private crawlerService: CrawlerService) {}

async testCrawler() {
  const results = await this.crawlerService.crawlWebsite(
    'https://example-dental.com',
    {
      maxPages: 5,
      downloadResources: true,
      followLinks: true,
      sameOriginOnly: true,
    }
  );
  
  console.log('Crawl results:', results);
}
```

## License

Part of the CRM Web Tracker project.

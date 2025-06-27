# Dead Link Detector - Professional Website Health Monitor

A full-stack web application designed to scan websites for broken or dead links and generate detailed reports. Built with Flask and modern web technologies, this tool helps IT teams and website administrators maintain healthy websites.

## 🌟 Features

### 1. Website URL Scanner
- Input field for target URL scanning
- Optional email reporting
- External link checking toggle
- Support for both HTTP and HTTPS
- Automatic scheme fixing

### 2. Real-time Scanning
- Visual progress tracking
- Scan duration monitoring
- Dynamic UI updates

### 3. Comprehensive Dashboard
- Total links scanned
- Broken links count
- Internal vs External links breakdown
- Average response time metrics
- Error type distribution (404, 500, 503, etc.)

### 4. Smart Recommendations
- AI-generated suggestions for improvements
- Priority-based issue highlighting
- Page-specific recommendations

### 5. Analytics & Insights
- Interactive charts and visualizations
- Historical scan data
- Performance trends
- Link type distribution

### 6. Export Options
- CSV export functionality
- Email reporting
- Detailed scan summaries

### 7. Scheduled Scans
- Configurable scan frequency
- Automated monitoring
- Email notifications

## 🛠️ Technology Stack

### Frontend
- HTML5/CSS3
- JavaScript (Vanilla)
- Chart.js for visualizations
- Responsive design

### Backend
- Flask web framework
- SQLite database
- APScheduler for task scheduling
- BeautifulSoup for web scraping

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dead-link-detector
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Unix/MacOS
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python backend/app.py
```

5. Access the application at `http://localhost:5000`

## 🔧 Configuration

The application can be configured through the settings page:

1. **Scan Settings**
   - Request timeout
   - Maximum crawl depth
   - Concurrent requests
   - Link type filtering

2. **Schedule Settings**
   - Scan frequency (daily/weekly/monthly)
   - Notification preferences
   - Email settings

3. **Display Settings**
   - Theme selection
   - Date format
   - Data visualization preferences

## 📊 Database

The application uses SQLite databases:
- `scan_data.db`: Stores scan results and analytics
- `jobs.db`: Manages scheduled tasks

Databases are automatically created in the `database` directory.

## 🔒 Security Considerations

- Input validation for URLs
- Rate limiting for concurrent requests
- Secure email handling
- No sensitive data storage

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Flask framework
- BeautifulSoup library
- Chart.js
- APScheduler
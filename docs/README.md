# Simple Coding Time Tracker - GitHub Pages Site

This directory contains the GitHub Pages website for the Simple Coding Time Tracker VS Code extension.

## 🌐 Live Site

The site is hosted at: `https://twentytwo.github.io/vsc-ext-coding-time-tracker/`

## 📁 Structure

```
docs/
├── index.html              # Main landing page
├── documentation.html      # Complete documentation
├── css/
│   └── style.css          # Styles for all pages
├── js/
│   └── main.js            # Interactive features
└── assets/                # Additional assets (if needed)
```

## 🚀 Features

### Landing Page (`index.html`)
- Hero section with call-to-action buttons
- Feature showcase with interactive cards
- Screenshot gallery with light/dark theme examples
- Installation guide
- Use cases section
- Responsive design for all devices

### Documentation Page (`documentation.html`)
- Complete user guide
- Configuration reference
- Feature details
- Health notifications guide
- Command reference
- Troubleshooting section
- FAQ

## 🎨 Design

- **Responsive:** Works on desktop, tablet, and mobile
- **Modern:** Clean, professional design with smooth animations
- **Accessible:** Semantic HTML and proper ARIA labels
- **Fast:** Optimized CSS and JavaScript
- **Theme-aware:** Matches VS Code aesthetic

## 🔧 Local Development

To test the site locally:

1. Open `index.html` in your browser, or
2. Use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (with http-server)
   npx http-server
   ```
3. Navigate to `http://localhost:8000`

## 📝 Updating Content

### Adding Screenshots
Place images in the root directory or `assets/` folder and update the `<img>` tags in `index.html`.

### Modifying Styles
Edit `css/style.css` to customize colors, fonts, layouts, etc.

### Adding Interactivity
Update `js/main.js` for new interactive features.

## 🌍 GitHub Pages Setup

To enable GitHub Pages:

1. Go to your repository settings
2. Navigate to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Choose the `main` branch and `/docs` folder
5. Click "Save"
6. Your site will be available at: `https://twentytwo.github.io/vsc-ext-coding-time-tracker/`

## 📦 Technologies Used

- Pure HTML5, CSS3, JavaScript (no frameworks)
- Responsive Grid and Flexbox layouts
- CSS animations and transitions
- Intersection Observer API for scroll animations
- Mobile-first responsive design

## 🤝 Contributing

To improve the website:

1. Edit files in the `docs/` directory
2. Test locally
3. Commit and push changes
4. Changes will be live within minutes

## 📄 License

This website and the extension are licensed under the MIT License.

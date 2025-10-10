# 🚀 GitHub Pages Setup Guide

## Quick Setup Steps

Follow these steps to enable your GitHub Pages site:

### 1. Push the docs folder to GitHub

```bash
git add docs/
git commit -m "Add GitHub Pages site for extension demonstration"
git push origin feature/extension-site
```

### 2. Merge to main branch (if needed)

If you want the site live on main:
```bash
git checkout main
git merge feature/extension-site
git push origin main
```

### 3. Enable GitHub Pages

1. Go to your repository: https://github.com/twentyTwo/vsc-ext-coding-time-tracker
2. Click on **Settings** tab
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**:
   - Select **Deploy from a branch**
   - Choose **main** branch
   - Select **/docs** folder
   - Click **Save**

### 4. Wait for Deployment

- GitHub will build and deploy your site (usually takes 1-2 minutes)
- You'll see a message: "Your site is live at https://twentytwo.github.io/vsc-ext-coding-time-tracker/"
- Click the link to view your live site!

## 🎯 What You'll Get

### Landing Page Features:
✅ Beautiful hero section with gradient background  
✅ Feature showcase with 9 key features  
✅ Screenshot gallery (light/dark themes)  
✅ Installation instructions  
✅ Use cases section  
✅ Responsive design (mobile, tablet, desktop)  
✅ Smooth animations and transitions  
✅ Links to VS Code Marketplace and Open VSX  

### Documentation Page Features:
✅ Complete user guide  
✅ Configuration reference table  
✅ Feature explanations  
✅ Health notifications guide  
✅ All available commands  
✅ Troubleshooting section  
✅ FAQ section  
✅ Table of contents with smooth scrolling  

## 🔗 Adding to Your Extension

Once live, add the site URL to:

1. **README.md** - Add a link to the live demo site
2. **package.json** - Add to repository URL or homepage field
3. **VS Code Marketplace** - Update extension description with site link

## 📱 Testing Locally

Before pushing, test locally:

```bash
cd docs
python -m http.server 8000
# Or use: npx http-server
```

Open: http://localhost:8000

## 🎨 Customization Options

### Colors (in css/style.css)
```css
:root {
    --primary-color: #007acc;      /* VS Code blue */
    --secondary-color: #68217a;     /* Purple accent */
    --accent-color: #f9826c;        /* Coral accent */
}
```

### Screenshots
- Replace URLs in index.html with your own screenshot URLs
- Current screenshots are pulled from your GitHub static hosting

### Content
- Edit text in index.html and documentation.html
- Update links to match your repository

## ⚡ Performance

The site is optimized for:
- Fast loading (no external dependencies)
- Mobile-first responsive design
- SEO-friendly semantic HTML
- Accessible (ARIA labels, keyboard navigation)

## 🐛 Troubleshooting

**Site not showing up?**
- Wait 2-5 minutes after enabling
- Check Settings → Pages for build status
- Ensure /docs folder exists on the branch
- Hard refresh browser (Ctrl+Shift+R)

**Images not loading?**
- Verify image URLs are correct
- Check if images are accessible publicly
- Use relative paths for local images

**Mobile menu not working?**
- Clear browser cache
- Check browser console for errors
- Verify main.js is loading

## 📞 Support

Need help? Open an issue on GitHub!

---

**Your site will be live at:**  
🌐 https://twentytwo.github.io/vsc-ext-coding-time-tracker/

Enjoy your new extension showcase website! 🎉

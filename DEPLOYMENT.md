# Flashy Ready - Deployment Guide

## Quick Deploy to Netlify (30 seconds!)

1. Go to: https://app.netlify.com/drop

2. Select these 6 files from `C:\Users\PetervandeGiessen\flashy-ready`:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `auth.js`
   - `config.js`
   - `manifest.json`

3. Drag and drop them onto the Netlify Drop page

4. Get your URL (like `https://your-app-name.netlify.app`)

5. Open that URL on your phone and add to home screen!

## Files to Upload

**Required files (6 total):**
- ✅ index.html (main app)
- ✅ styles.css (styling)
- ✅ app.js (main functionality)
- ✅ auth.js (authentication & sync)
- ✅ config.js (Supabase configuration)
- ✅ manifest.json (PWA config)

**Optional files (not needed for deployment):**
- ❌ README.md (documentation only)
- ❌ DEPLOYMENT.md (this file)
- ❌ test-text.txt (sample text)

## What's New in This Version

### Cloud Sync & Authentication:
- 🔐 **User Authentication** - Login/signup with email
- ☁️ **Cloud Sync** - Books, progress, and settings sync across devices
- 🔄 **Auto-Sync** - Automatic synchronization when logged in
- 📱 **Multi-Device** - Access your library from any device

### Advanced RSVP Features:
- ⚡ **Perfect ORP Alignment** - Red letter stays in exact same spot
- ⚡ **Smart Punctuation Pauses** - Natural reading rhythm
- ⚡ **Word Length Timing** - Longer words display longer
- ⚡ **Research-Based** - Uses Spritz methodology

### File Format Support:
- 📄 **PDF Files** - Full text extraction using PDF.js
- 📚 **EPUB E-books** - Complete parsing using EPUBjs
- 📝 **Plain Text** - Direct .txt file support
- 📋 **Copy/Paste** - Instant text input

### Features:
- 🎨 4 Themes (Dark, Light, Sepia, Blue)
- 🔖 Bookmarks for important positions
- 💾 Auto-save progress for each book
- ⚙️ Customizable font size
- ⌨️ Keyboard shortcuts
- 📱 PWA installable on phone

## Install on Phone

### iPhone:
1. Open the Netlify URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

### Android:
1. Open the Netlify URL in Chrome
2. Tap the menu (3 dots)
3. Tap "Add to Home screen" or "Install app"
4. Tap "Install"

## External Dependencies

The app loads these libraries from CDN:
- PDF.js v3.11.174 (Mozilla's PDF library)
- EPUBjs (from jsDelivr)
- Supabase JS Client v2 (for authentication and cloud sync)

All are loaded from reliable CDNs and cached by the browser.

## Browser Requirements

Works in all modern browsers:
- Chrome/Edge 90+
- Safari 14+
- Firefox 88+

## Troubleshooting

**PDF not loading?**
- The PDF may be image-based (scanned) rather than text
- Use the copy/paste workaround

**EPUB not loading?**
- The EPUB may have DRM protection
- Use the copy/paste workaround

**App not installing on phone?**
- Must be served via HTTPS (Netlify provides this)
- Some browsers don't support PWA

## Support

For issues or questions, check the main README.md file.

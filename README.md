# ⚡ Flashy Ready

A fast, mobile-friendly RSVP (Rapid Serial Visual Presentation) reading app for speed reading.

## Features

- **RSVP Reading Engine**: Read at speeds from 200-1200 WPM
- **File Support**: Upload .txt files or paste text directly
- **ORP Highlighting**: Optimal Recognition Point highlighting for faster reading
- **Customizable**: Adjust font size, themes (Dark, Light, Sepia, Blue)
- **Progress Tracking**: Automatically saves your position in each book
- **Bookmarks**: Mark important positions in your reading
- **Keyboard Shortcuts**: Control playback with keyboard
- **Mobile-First**: Works great on phones and can be installed as a PWA

## How to Use

### Option 1: Open Locally (Easiest)
1. Simply open `index.html` in your web browser
2. That's it! No server needed for basic functionality

### Option 2: Install on Your Phone (Recommended)
1. Host the files on a web server (see hosting options below)
2. Open the URL on your phone
3. Add to home screen:
   - **iPhone**: Tap Share → Add to Home Screen
   - **Android**: Tap Menu → Add to Home Screen

## Hosting Options (Free)

### GitHub Pages (Recommended)
1. Create a GitHub account at https://github.com
2. Create a new repository
3. Upload all files (index.html, styles.css, app.js, manifest.json)
4. Go to Settings → Pages
5. Select main branch as source
6. Your app will be live at: `https://yourusername.github.io/flashy-ready`

### Netlify Drop
1. Go to https://app.netlify.com/drop
2. Drag and drop the entire `flashy-ready` folder
3. Get instant hosting with a URL

### Vercel
1. Go to https://vercel.com
2. Sign up and import your project
3. Deploy with one click

## Keyboard Shortcuts

When reading:
- `Space` or `K`: Play/Pause
- `R`: Restart from beginning
- `B`: Add bookmark at current position
- `↑`: Increase speed by 50 WPM
- `↓`: Decrease speed by 50 WPM
- `Esc`: Close modals

## File Format Support

Fully supported:
- **.txt** files - Plain text files
- **.epub** files - E-books (uses EPUBjs library)
- **.pdf** files - PDF documents (uses PDF.js library)
- **Copy/Paste** - Direct text input

**Note**: Some EPUB files with DRM protection or image-based PDFs may not work. In these cases, use the copy/paste workaround.

## Browser Compatibility

Works best in modern browsers:
- Chrome/Edge (desktop & mobile)
- Safari (desktop & mobile)
- Firefox (desktop & mobile)

## Privacy

All data is stored locally in your browser. Nothing is sent to any server. Your books, progress, and settings stay on your device.

## Customization Tips

1. **Find Your Speed**: Start at 300 WPM and gradually increase
2. **ORP Highlighting**: The highlighted letter helps your eyes focus - keep it on!
3. **Font Size**: Adjust to what's comfortable for your device
4. **Themes**: Sepia or Blue themes can reduce eye strain

## Troubleshooting

**App not loading?**
- Make sure all files are in the same folder
- Try a different browser
- Check browser console for errors (F12)

**Lost your progress?**
- Don't clear browser data/cookies
- If using private/incognito mode, data won't persist

**Can't install on phone?**
- Must be served via HTTPS (use one of the hosting options)
- Some browsers don't support PWA installation

## Future Enhancements

- Full EPUB support with library integration
- PDF text extraction
- Reading statistics and analytics
- Custom color schemes
- Word chunking options
- Export reading history

## Credits

Built with vanilla JavaScript, HTML, and CSS. No frameworks, no dependencies.

---

Happy speed reading! ⚡

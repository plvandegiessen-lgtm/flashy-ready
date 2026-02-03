// Flashy Ready - RSVP Reading App
// Main Application Logic

class FlashyReady {
    constructor() {
        this.currentBook = null;
        this.words = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.wpm = 300;
        this.interval = null;
        this.settings = {
            fontSize: 48,
            theme: 'dark',
            highlightORP: true
        };
        this.bookmarks = [];

        this.init();
    }

    init() {
        this.loadSettings();
        this.loadRecentBooks();
        this.attachEventListeners();
        this.updateRecentBooksList();
    }

    // ==================== Event Listeners ====================
    attachEventListeners() {
        // File upload
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        // Paste button
        document.getElementById('pasteBtn').addEventListener('click', () => this.showPasteModal());
        document.getElementById('pasteConfirmBtn').addEventListener('click', () => this.handlePasteText());
        document.getElementById('pasteCancelBtn').addEventListener('click', () => this.hidePasteModal());

        // Reader controls
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('bookmarkBtn').addEventListener('click', () => this.addBookmark());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('backBtn').addEventListener('click', () => this.backToUpload());

        // Speed controls
        document.getElementById('wpmSlider').addEventListener('input', (e) => this.updateWPM(e.target.value));
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wpm = e.target.dataset.wpm;
                this.updateWPM(wpm);
                document.getElementById('wpmSlider').value = wpm;
            });
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('settingsCloseBtn').addEventListener('click', () => this.hideSettings());
        document.getElementById('fontSizeSlider').addEventListener('input', (e) => this.updateFontSize(e.target.value));
        document.getElementById('themeSelect').addEventListener('change', (e) => this.updateTheme(e.target.value));
        document.getElementById('highlightToggle').addEventListener('change', (e) => this.toggleHighlight(e.target.checked));
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // ==================== File Handling ====================
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileType = file.name.split('.').pop().toLowerCase();

        if (fileType === 'txt') {
            this.loadTextFile(file);
        } else if (fileType === 'epub') {
            this.showLoading('Processing EPUB file...');
            this.loadEpubFile(file);
        } else if (fileType === 'pdf') {
            this.showLoading('Processing PDF file...');
            this.loadPdfFile(file);
        } else {
            alert('Unsupported file format. Please use .txt, .epub, or .pdf files.');
        }
    }

    showLoading(message = 'Processing file...') {
        document.getElementById('loadingIndicator').classList.remove('hidden');
        document.getElementById('loadingText').textContent = message;
    }

    hideLoading() {
        document.getElementById('loadingIndicator').classList.add('hidden');
    }

    loadTextFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            this.loadBook(file.name, text);
        };
        reader.readAsText(file);
    }

    async loadEpubFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const book = ePub(arrayBuffer);

            // Wait for book to be ready
            await book.ready;

            let fullText = '';

            // Get the spine (ordered list of content)
            const spine = await book.loaded.spine;
            const totalSections = spine.items.length;

            // Extract text from each section
            for (let i = 0; i < spine.items.length; i++) {
                const item = spine.items[i];
                this.showLoading(`Processing EPUB: section ${i + 1} of ${totalSections}...`);

                try {
                    // Load the section content
                    const section = book.spine.get(item.href);
                    await section.load(book.load.bind(book));

                    // Get the document content
                    const doc = section.document || section.contents;

                    if (doc) {
                        // Extract text from the document
                        let sectionText = '';
                        if (typeof doc === 'string') {
                            sectionText = this.extractTextFromHTML(doc);
                        } else if (doc.body) {
                            sectionText = doc.body.textContent || doc.body.innerText || '';
                        } else if (doc.textContent) {
                            sectionText = doc.textContent;
                        }

                        fullText += sectionText + '\n\n';
                    }
                } catch (e) {
                    console.warn('Could not load section:', item.href, e);
                    // Continue to next section instead of failing completely
                }
            }

            if (fullText.trim().length === 0) {
                throw new Error('No text extracted from EPUB. The file may be DRM-protected or use an unsupported format.');
            }

            this.hideLoading();
            this.loadBook(file.name, fullText);
        } catch (error) {
            this.hideLoading();
            console.error('Error loading EPUB:', error);
            alert('Error loading EPUB file: ' + error.message + '\n\nThe file may be DRM-protected or corrupted.\n\nWorkaround:\n1. Open your EPUB in an e-reader\n2. Copy the text\n3. Use the "Paste Text" option');
        }
    }

    extractTextFromHTML(htmlContent) {
        // Create a temporary div to parse HTML and extract text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Remove script and style elements
        const scripts = tempDiv.getElementsByTagName('script');
        const styles = tempDiv.getElementsByTagName('style');
        for (let i = scripts.length - 1; i >= 0; i--) {
            scripts[i].remove();
        }
        for (let i = styles.length - 1; i >= 0; i--) {
            styles[i].remove();
        }

        // Get text content
        return tempDiv.textContent || tempDiv.innerText || '';
    }

    async loadPdfFile(file) {
        try {
            // Configure PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = '';

            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                this.showLoading(`Processing PDF page ${pageNum} of ${pdf.numPages}...`);

                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Combine text items from the page
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');

                fullText += pageText + '\n\n';
            }

            if (fullText.trim().length === 0) {
                throw new Error('No text extracted from PDF');
            }

            this.hideLoading();
            this.loadBook(file.name, fullText);
        } catch (error) {
            this.hideLoading();
            console.error('Error loading PDF:', error);
            alert('Error loading PDF file. The PDF may be image-based or corrupted.\n\nWorkaround:\n1. Open your PDF\n2. Select and copy the text\n3. Use the "Paste Text" option');
        }
    }

    showPasteModal() {
        document.getElementById('pasteModal').classList.remove('hidden');
        document.getElementById('pasteTextarea').focus();
    }

    hidePasteModal() {
        document.getElementById('pasteModal').classList.add('hidden');
        document.getElementById('pasteTextarea').value = '';
    }

    handlePasteText() {
        const text = document.getElementById('pasteTextarea').value.trim();
        if (!text) {
            alert('Please paste some text first.');
            return;
        }

        const title = 'Pasted Text ' + new Date().toLocaleDateString();
        this.loadBook(title, text);
        this.hidePasteModal();
    }

    // ==================== Book Loading & Processing ====================
    loadBook(title, text) {
        // Process text into words
        this.words = this.processText(text);

        if (this.words.length === 0) {
            alert('No text found in the file.');
            return;
        }

        this.currentBook = {
            title: title,
            text: text,
            totalWords: this.words.length,
            lastPosition: 0,
            lastReadDate: new Date().toISOString()
        };

        this.currentIndex = 0;
        this.saveCurrentBook();
        this.showReader();
    }

    processText(text) {
        // Clean and split text into words
        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .split(/\s+/) // Split by whitespace
            .filter(word => word.length > 0);
    }

    // ==================== RSVP Reader Engine ====================
    showReader() {
        document.getElementById('uploadScreen').classList.remove('active');
        document.getElementById('readerScreen').classList.add('active');
        this.updateDisplay();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.currentIndex >= this.words.length) {
            this.currentIndex = 0;
        }

        this.isPlaying = true;
        this.updatePlayPauseButton();

        this.scheduleNextWord();
    }

    scheduleNextWord() {
        if (!this.isPlaying) return;

        if (this.currentIndex < this.words.length) {
            const word = this.words[this.currentIndex];
            this.displayWord(word);
            this.currentIndex++;
            this.updateProgress();
            this.saveProgress();

            // Calculate delay for this word based on length and punctuation
            const delay = this.calculateWordDelay(word);

            this.interval = setTimeout(() => {
                this.scheduleNextWord();
            }, delay);
        } else {
            this.pause();
            this.showCompletionMessage();
        }
    }

    calculateWordDelay(word) {
        const baseDelay = 60000 / this.wpm;

        // Word length multiplier (longer words need more time)
        let lengthMultiplier = 1.0;
        if (word.length > 8) {
            lengthMultiplier = 1.3;
        } else if (word.length > 12) {
            lengthMultiplier = 1.5;
        }

        // Punctuation multipliers for natural reading rhythm
        let punctuationMultiplier = 1.0;

        // Sentence endings - longest pause
        if (/[.!?]$/.test(word)) {
            punctuationMultiplier = 2.5;
        }
        // Clause separators - medium pause
        else if (/[,;:]$/.test(word)) {
            punctuationMultiplier = 1.8;
        }
        // Dashes and parentheses - short pause
        else if (/[-—()]/.test(word)) {
            punctuationMultiplier = 1.3;
        }

        // Numbers need extra processing time
        if (/\d/.test(word)) {
            lengthMultiplier *= 1.5;
        }

        return baseDelay * lengthMultiplier * punctuationMultiplier;
    }

    pause() {
        this.isPlaying = false;
        if (this.interval) {
            clearTimeout(this.interval);
            this.interval = null;
        }
        this.updatePlayPauseButton();
        this.saveProgress();
    }

    restart() {
        this.pause();
        this.currentIndex = 0;
        this.updateDisplay();
    }

    displayWord(word) {
        const wordDisplay = document.getElementById('wordText');

        if (this.settings.highlightORP) {
            // Calculate Optimal Recognition Point
            const orpIndex = this.calculateORPIndex(word.length);
            const before = word.substring(0, orpIndex);
            const orp = word.charAt(orpIndex) || '';
            const after = word.substring(orpIndex + 1);

            // Build the word with the ORP at absolute center
            // The ORP letter is positioned absolutely at 50% (center)
            // Before text ends at the ORP, after text starts at the ORP
            wordDisplay.innerHTML = `
                <span class="word-before">${before}</span><span class="word-orp">${orp}</span><span class="word-after">${after}</span>
            `;

            // Position the before/after parts relative to the centered ORP
            requestAnimationFrame(() => {
                const orpElement = wordDisplay.querySelector('.word-orp');
                const beforeElement = wordDisplay.querySelector('.word-before');
                const afterElement = wordDisplay.querySelector('.word-after');

                if (orpElement && beforeElement && afterElement) {
                    // ORP is centered at 50% horizontally and vertically
                    // Before text should end right before the ORP
                    // After text should start right after the ORP

                    const orpWidth = orpElement.offsetWidth;

                    // Position before text to end at the left edge of ORP
                    beforeElement.style.position = 'absolute';
                    beforeElement.style.right = `calc(50% + ${orpWidth / 2}px)`;
                    beforeElement.style.top = '50%';
                    beforeElement.style.transform = 'translateY(-50%)';
                    beforeElement.style.whiteSpace = 'nowrap';

                    // Position after text to start at the right edge of ORP
                    afterElement.style.position = 'absolute';
                    afterElement.style.left = `calc(50% + ${orpWidth / 2}px)`;
                    afterElement.style.top = '50%';
                    afterElement.style.transform = 'translateY(-50%)';
                    afterElement.style.whiteSpace = 'nowrap';
                }
            });
        } else {
            wordDisplay.textContent = word;
            wordDisplay.style.position = 'static';
        }
    }

    calculateORPIndex(wordLength) {
        // Research-based ORP positioning (Spritz method)
        // The ORP is slightly left of center for optimal recognition
        if (wordLength === 1) return 0;
        if (wordLength === 2 || wordLength === 3) return 0;
        if (wordLength === 4 || wordLength === 5) return 1;
        if (wordLength === 6 || wordLength === 7 || wordLength === 8) return 2;
        if (wordLength === 9 || wordLength === 10 || wordLength === 11) return 3;
        if (wordLength === 12 || wordLength === 13) return 4;
        // For longer words, use roughly 1/3 position
        return Math.floor(wordLength * 0.35);
    }

    updateDisplay() {
        if (this.words.length === 0) return;

        const word = this.words[this.currentIndex] || 'Ready';
        this.displayWord(word);
        this.updateProgress();
    }

    updateProgress() {
        const progress = (this.currentIndex / this.words.length) * 100;
        document.getElementById('progressFill').style.width = progress + '%';

        const position = `${this.currentIndex} / ${this.words.length}`;
        document.getElementById('wordPosition').textContent = position;

        const wordsRemaining = this.words.length - this.currentIndex;
        const minutesRemaining = wordsRemaining / this.wpm;
        const minutes = Math.floor(minutesRemaining);
        const seconds = Math.floor((minutesRemaining - minutes) * 60);
        document.getElementById('timeRemaining').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        if (this.isPlaying) {
            btn.textContent = '⏸️ Pause';
            btn.classList.add('playing');
        } else {
            btn.textContent = '▶️ Play';
            btn.classList.remove('playing');
        }
    }

    updateWPM(wpm) {
        this.wpm = parseInt(wpm);
        document.getElementById('wpmValue').textContent = this.wpm;

        // If currently playing, the new speed will apply to the next word automatically
        // No need to restart - this gives smoother speed adjustment

        this.saveSettings();
    }

    showCompletionMessage() {
        document.getElementById('wordText').textContent = '✓ Finished!';
        setTimeout(() => {
            if (!this.isPlaying) {
                this.restart();
            }
        }, 2000);
    }

    backToUpload() {
        this.pause();
        this.saveProgress();
        document.getElementById('readerScreen').classList.remove('active');
        document.getElementById('uploadScreen').classList.add('active');
        this.updateRecentBooksList();
    }

    // ==================== Bookmarks ====================
    addBookmark() {
        if (!this.currentBook) return;

        const bookmark = {
            id: Date.now(),
            bookTitle: this.currentBook.title,
            position: this.currentIndex,
            word: this.words[this.currentIndex],
            timestamp: new Date().toISOString()
        };

        this.bookmarks.push(bookmark);
        this.saveBookmarks();

        // Visual feedback
        const btn = document.getElementById('bookmarkBtn');
        btn.textContent = '✓';
        setTimeout(() => {
            btn.textContent = '🔖';
        }, 1000);
    }

    loadBookmark(bookmark) {
        // Find the book and load it
        const books = this.getRecentBooks();
        const book = books.find(b => b.title === bookmark.bookTitle);

        if (book) {
            this.loadBook(book.title, book.text);
            this.currentIndex = bookmark.position;
            this.updateDisplay();
        }
    }

    deleteBookmark(bookmarkId) {
        this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
        this.saveBookmarks();
        this.updateBookmarksList();
    }

    updateBookmarksList() {
        const list = document.getElementById('bookmarksList');

        if (this.bookmarks.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary);">No bookmarks yet</p>';
            return;
        }

        list.innerHTML = this.bookmarks.map(bookmark => `
            <div class="bookmark-item">
                <div>
                    <div style="font-weight: 600;">${bookmark.bookTitle}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        Position: ${bookmark.position} - "${bookmark.word}"
                    </div>
                </div>
                <button class="bookmark-delete" onclick="app.deleteBookmark(${bookmark.id})">Delete</button>
            </div>
        `).join('');
    }

    // ==================== Settings ====================
    showSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
        this.updateBookmarksList();
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    updateFontSize(size) {
        this.settings.fontSize = parseInt(size);
        document.getElementById('fontSizeValue').textContent = size + 'px';
        document.getElementById('wordText').style.fontSize = size + 'px';
        this.saveSettings();
    }

    updateTheme(theme) {
        this.settings.theme = theme;
        document.body.className = 'theme-' + theme;
        this.saveSettings();
    }

    toggleHighlight(enabled) {
        this.settings.highlightORP = enabled;
        this.updateDisplay();
        this.saveSettings();
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This will remove all books, progress, and settings.')) {
            localStorage.clear();
            location.reload();
        }
    }

    // ==================== Local Storage ====================
    saveSettings() {
        localStorage.setItem('flashy-settings', JSON.stringify(this.settings));
        localStorage.setItem('flashy-wpm', this.wpm);
    }

    loadSettings() {
        const settings = localStorage.getItem('flashy-settings');
        if (settings) {
            this.settings = JSON.parse(settings);
            document.getElementById('fontSizeSlider').value = this.settings.fontSize;
            document.getElementById('fontSizeValue').textContent = this.settings.fontSize + 'px';
            document.getElementById('wordText').style.fontSize = this.settings.fontSize + 'px';
            document.getElementById('themeSelect').value = this.settings.theme;
            document.getElementById('highlightToggle').checked = this.settings.highlightORP;
            document.body.className = 'theme-' + this.settings.theme;
        }

        const wpm = localStorage.getItem('flashy-wpm');
        if (wpm) {
            this.wpm = parseInt(wpm);
            document.getElementById('wpmSlider').value = this.wpm;
            document.getElementById('wpmValue').textContent = this.wpm;
        }

        const bookmarks = localStorage.getItem('flashy-bookmarks');
        if (bookmarks) {
            this.bookmarks = JSON.parse(bookmarks);
        }
    }

    saveCurrentBook() {
        const books = this.getRecentBooks();

        // Remove if already exists
        const filtered = books.filter(b => b.title !== this.currentBook.title);

        // Add to beginning
        filtered.unshift(this.currentBook);

        // Keep only last 10 books
        const recent = filtered.slice(0, 10);

        localStorage.setItem('flashy-books', JSON.stringify(recent));
    }

    saveProgress() {
        if (!this.currentBook) return;

        this.currentBook.lastPosition = this.currentIndex;
        this.currentBook.lastReadDate = new Date().toISOString();
        this.saveCurrentBook();
    }

    getRecentBooks() {
        const books = localStorage.getItem('flashy-books');
        return books ? JSON.parse(books) : [];
    }

    loadRecentBooks() {
        const books = this.getRecentBooks();
        return books;
    }

    updateRecentBooksList() {
        const books = this.getRecentBooks();
        const container = document.getElementById('recentBooks');
        const list = document.getElementById('recentBooksList');

        if (books.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        list.innerHTML = books.map((book, index) => {
            const progress = Math.round((book.lastPosition / book.totalWords) * 100);
            return `
                <div class="recent-book-item" onclick="app.continueBook(${index})">
                    <div class="recent-book-title">${book.title}</div>
                    <div class="recent-book-progress">${progress}% complete · ${book.totalWords.toLocaleString()} words</div>
                </div>
            `;
        }).join('');
    }

    continueBook(index) {
        const books = this.getRecentBooks();
        const book = books[index];

        this.loadBook(book.title, book.text);
        this.currentIndex = book.lastPosition || 0;
        this.updateDisplay();
    }

    saveBookmarks() {
        localStorage.setItem('flashy-bookmarks', JSON.stringify(this.bookmarks));
    }

    // ==================== Keyboard Shortcuts ====================
    handleKeyboard(e) {
        // Only handle shortcuts when reader is active
        if (!document.getElementById('readerScreen').classList.contains('active')) return;

        // Ignore if typing in input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'r':
                e.preventDefault();
                this.restart();
                break;
            case 'b':
                e.preventDefault();
                this.addBookmark();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.updateWPM(Math.min(1200, this.wpm + 50));
                document.getElementById('wpmSlider').value = this.wpm;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.updateWPM(Math.max(200, this.wpm - 50));
                document.getElementById('wpmSlider').value = this.wpm;
                break;
            case 'Escape':
                if (!document.getElementById('settingsModal').classList.contains('hidden')) {
                    this.hideSettings();
                } else if (!document.getElementById('pasteModal').classList.contains('hidden')) {
                    this.hidePasteModal();
                }
                break;
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new FlashyReady();
    });
} else {
    window.app = new FlashyReady();
}

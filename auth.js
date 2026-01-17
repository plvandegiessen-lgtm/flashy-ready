// Authentication and Sync Manager for Flashy Ready
// Handles Supabase authentication and data synchronization

class AuthManager {
    constructor() {
        // Initialize Supabase client
        this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.currentUser = null;
        this.isAuthMode = 'login'; // 'login' or 'signup'
    }

    async init() {
        // Check if user is already logged in
        const { data: { session } } = await this.supabase.auth.getSession();

        if (session) {
            this.currentUser = session.user;
            this.showApp();
        } else {
            this.showAuthScreen();
        }

        // Listen for auth state changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.currentUser = session.user;
                this.showApp();
            } else {
                this.currentUser = null;
                this.showAuthScreen();
            }
        });
    }

    attachEventListeners() {
        // Tab switching
        document.getElementById('loginTab').addEventListener('click', () => this.switchToLogin());
        document.getElementById('signupTab').addEventListener('click', () => this.switchToSignup());

        // Form submission
        document.getElementById('authForm').addEventListener('submit', (e) => this.handleAuth(e));

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }

    switchToLogin() {
        this.isAuthMode = 'login';
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('authConfirmPassword').classList.add('hidden');
        document.getElementById('authSubmitBtn').textContent = 'Login';
        this.clearMessages();
    }

    switchToSignup() {
        this.isAuthMode = 'signup';
        document.getElementById('signupTab').classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('authConfirmPassword').classList.remove('hidden');
        document.getElementById('authSubmitBtn').textContent = 'Sign Up';
        this.clearMessages();
    }

    async handleAuth(e) {
        e.preventDefault();

        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const confirmPassword = document.getElementById('authConfirmPassword').value;

        this.clearMessages();

        if (this.isAuthMode === 'signup' && password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        const submitBtn = document.getElementById('authSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = this.isAuthMode === 'login' ? 'Logging in...' : 'Signing up...';

        try {
            if (this.isAuthMode === 'login') {
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                this.currentUser = data.user;
                this.showSuccess('Logged in successfully!');
                setTimeout(() => this.showApp(), 1000);
            } else {
                const { data, error } = await this.supabase.auth.signUp({
                    email,
                    password
                });

                if (error) throw error;

                this.showSuccess('Account created! Please check your email to verify your account.');
                // Note: Supabase sends a verification email automatically
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showError(error.message || 'Authentication failed');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = this.isAuthMode === 'login' ? 'Login' : 'Sign Up';
        }
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            this.showAuthScreen();
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
        }
    }

    showAuthScreen() {
        document.getElementById('authScreen').classList.add('active');
        document.getElementById('uploadScreen').classList.remove('active');
        document.getElementById('readerScreen').classList.remove('active');
        document.getElementById('userInfo').classList.add('hidden');
    }

    async showApp() {
        document.getElementById('authScreen').classList.remove('active');
        document.getElementById('uploadScreen').classList.add('active');
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('userEmail').textContent = this.currentUser.email;

        // Trigger initial sync
        if (window.app) {
            await window.app.syncFromCloud();
        }
    }

    showError(message) {
        const errorEl = document.getElementById('authError');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    showSuccess(message) {
        const successEl = document.getElementById('authSuccess');
        successEl.textContent = message;
        successEl.classList.remove('hidden');
    }

    clearMessages() {
        document.getElementById('authError').classList.add('hidden');
        document.getElementById('authSuccess').classList.add('hidden');
    }

    // Cloud sync methods
    async syncBooks(books) {
        if (!this.currentUser) return;

        try {
            // Delete existing books for this user
            await this.supabase
                .from('books')
                .delete()
                .eq('user_id', this.currentUser.id);

            // Insert current books
            if (books.length > 0) {
                const booksData = books.map(book => ({
                    user_id: this.currentUser.id,
                    title: book.title,
                    text: book.text,
                    total_words: book.totalWords,
                    last_position: book.lastPosition || 0,
                    last_read_date: book.lastReadDate
                }));

                await this.supabase
                    .from('books')
                    .insert(booksData);
            }
        } catch (error) {
            console.error('Error syncing books:', error);
        }
    }

    async fetchBooks() {
        if (!this.currentUser) return [];

        try {
            const { data, error } = await this.supabase
                .from('books')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('last_read_date', { ascending: false });

            if (error) throw error;

            return data.map(book => ({
                title: book.title,
                text: book.text,
                totalWords: book.total_words,
                lastPosition: book.last_position,
                lastReadDate: book.last_read_date
            }));
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    }

    async syncSettings(settings) {
        if (!this.currentUser) return;

        try {
            const { error } = await this.supabase
                .from('user_settings')
                .upsert({
                    user_id: this.currentUser.id,
                    font_size: settings.fontSize,
                    theme: settings.theme,
                    highlight_orp: settings.highlightORP,
                    wpm: settings.wpm || 300
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error syncing settings:', error);
        }
    }

    async fetchSettings() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await this.supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

            if (!data) return null;

            return {
                fontSize: data.font_size,
                theme: data.theme,
                highlightORP: data.highlight_orp,
                wpm: data.wpm
            };
        } catch (error) {
            console.error('Error fetching settings:', error);
            return null;
        }
    }

    async syncBookmarks(bookmarks) {
        if (!this.currentUser) return;

        try {
            // Delete existing bookmarks for this user
            await this.supabase
                .from('bookmarks')
                .delete()
                .eq('user_id', this.currentUser.id);

            // Insert current bookmarks
            if (bookmarks.length > 0) {
                const bookmarksData = bookmarks.map(bookmark => ({
                    user_id: this.currentUser.id,
                    book_title: bookmark.bookTitle,
                    position: bookmark.position,
                    word: bookmark.word,
                    created_at: bookmark.timestamp
                }));

                await this.supabase
                    .from('bookmarks')
                    .insert(bookmarksData);
            }
        } catch (error) {
            console.error('Error syncing bookmarks:', error);
        }
    }

    async fetchBookmarks() {
        if (!this.currentUser) return [];

        try {
            const { data, error } = await this.supabase
                .from('bookmarks')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(bookmark => ({
                id: Date.now() + Math.random(), // Generate a client-side ID
                bookTitle: bookmark.book_title,
                position: bookmark.position,
                word: bookmark.word,
                timestamp: bookmark.created_at
            }));
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
            return [];
        }
    }
}

// Initialize auth manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authManager = new AuthManager();
        window.authManager.init();
        window.authManager.attachEventListeners();
    });
} else {
    window.authManager = new AuthManager();
    window.authManager.init();
    window.authManager.attachEventListeners();
}

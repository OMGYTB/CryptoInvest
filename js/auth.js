/**
 * Authentication Module for CryptoInvest
 * Handles user registration, login, logout, and session management
 */

// Configuration
const AUTH_CONFIG = {
    // Storage keys
    STORAGE_KEY_USER: 'cryptoinvest_user',
    STORAGE_KEY_TOKEN: 'cryptoinvest_token',
    
    // Session duration (in milliseconds)
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    
    // Redirect paths
    REDIRECT_AFTER_LOGIN: 'portfolio.html',
    REDIRECT_AFTER_LOGOUT: '../index.html',
    REDIRECT_IF_UNAUTHENTICATED: 'login.html',
    
    // Membership levels
    MEMBERSHIP_LEVELS: {
        FREE: 'free',
        BASIC: 'basic',
        PREMIUM: 'premium',
        PRO: 'pro'
    }
};

// User class to manage user data
class User {
    constructor(data) {
        this.id = data.id || this._generateId();
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.email = data.email || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastLogin = data.lastLogin || new Date().toISOString();
        this.membershipLevel = data.membershipLevel || AUTH_CONFIG.MEMBERSHIP_LEVELS.FREE;
        this.membershipExpiry = data.membershipExpiry || null;
    }

    _generateId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    
    /**
     * Check if user has an active membership of at least the specified level
     * @param {string} requiredLevel - The membership level to check against
     * @returns {boolean} - True if user has required level or higher
     */
    hasMembership(requiredLevel) {
        // If no membership level is required, return true
        if (!requiredLevel) return true;
        
        // If user is free but something is required, return false
        if (this.membershipLevel === AUTH_CONFIG.MEMBERSHIP_LEVELS.FREE && requiredLevel !== AUTH_CONFIG.MEMBERSHIP_LEVELS.FREE) {
            return false;
        }
        
        // Check if membership is expired
        if (this.membershipExpiry && new Date(this.membershipExpiry) < new Date()) {
            return false;
        }
        
        // Check membership level hierarchy
        const levels = Object.values(AUTH_CONFIG.MEMBERSHIP_LEVELS);
        const userLevelIndex = levels.indexOf(this.membershipLevel);
        const requiredLevelIndex = levels.indexOf(requiredLevel);
        
        return userLevelIndex >= requiredLevelIndex;
    }
    
    /**
     * Update user's membership level
     * @param {string} level - New membership level
     * @param {number} durationDays - Duration in days
     */
    updateMembership(level, durationDays) {
        if (!Object.values(AUTH_CONFIG.MEMBERSHIP_LEVELS).includes(level)) {
            throw new Error('Niveau d\'abonnement invalide');
        }
        
        this.membershipLevel = level;
        
        // Set expiry date if not free tier
        if (level !== AUTH_CONFIG.MEMBERSHIP_LEVELS.FREE && durationDays) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + durationDays);
            this.membershipExpiry = expiryDate.toISOString();
        } else if (level === AUTH_CONFIG.MEMBERSHIP_LEVELS.FREE) {
            this.membershipExpiry = null;
        }
    }

    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin,
            membershipLevel: this.membershipLevel,
            membershipExpiry: this.membershipExpiry
        };
    }
}

// Authentication class
class Auth {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.initialized = false;
        
        // Initialize auth state
        this._init();
    }

    /**
     * Initialize authentication state from local storage
     * @private
     */
    _init() {
        if (this.initialized) return;
        
        // Try to get user data from local storage
        const userData = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY_USER);
        const token = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY_TOKEN);
        
        if (userData && token) {
            try {
                const parsedUserData = JSON.parse(userData);
                this.currentUser = new User(parsedUserData);
                this.token = token;
                
                // Check if token is expired
                if (this._isTokenExpired(token)) {
                    this.logout();
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        }
        
        this.initialized = true;
        
            // Update UI based on auth state
            this._updateUI();
            
            // Check if membership has expired
            if (this.currentUser && this.currentUser.membershipExpiry) {
                const expiryDate = new Date(this.currentUser.membershipExpiry);
                if (expiryDate < new Date()) {
                    console.log('Membership expired, downgrading to free tier');
                    this.currentUser.updateMembership(AUTH_CONFIG.MEMBERSHIP_LEVELS.FREE);
                    this._saveCurrentUser();
                }
            }
    }

    /**
     * Check if a token is expired
     * @param {string} token - The authentication token
     * @returns {boolean} - True if token is expired, false otherwise
     * @private
     */
    _isTokenExpired(token) {
        try {
            // In a real app, you would decode the JWT token and check its expiration
            // For this demo, we'll use a simple timestamp check
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            return tokenData.exp < Date.now();
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    }

    /**
     * Generate a simple token
     * @param {User} user - The user to generate a token for
     * @returns {string} - The generated token
     * @private
     */
    _generateToken(user) {
        // In a real app, this would be a JWT token generated on the server
        // For this demo, we'll create a simple token with an expiration
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = {
            sub: user.id,
            email: user.email,
            exp: Date.now() + AUTH_CONFIG.SESSION_DURATION
        };
        
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(payload));
        const signature = btoa(`${user.id}_${Date.now()}`); // Not a real signature
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    /**
     * Update UI elements based on authentication state
     * @private
     */
    _updateUI() {
        const navButtons = document.querySelector('.nav-button');
        if (!navButtons) return;
        
        if (this.isAuthenticated()) {
            // User is logged in
            navButtons.innerHTML = `
                <a href="${AUTH_CONFIG.REDIRECT_AFTER_LOGIN}" class="login-btn">Mon compte</a>
                <a href="membership.html" class="membership-btn">Abonnement</a>
                <a href="#" class="sign-btn logout-btn">Déconnexion</a>
            `;
            
            // Add event listener to logout button
            const logoutBtn = navButtons.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
            
            // Update user info in dashboard if on portfolio page
            const userNameElement = document.querySelector('.user-details h3');
            const userEmailElement = document.querySelector('.user-details p');
            const userMembershipElement = document.querySelector('.user-membership');
            
            if (userNameElement && this.currentUser) {
                userNameElement.textContent = this.currentUser.getFullName();
            }
            
            if (userEmailElement && this.currentUser) {
                userEmailElement.textContent = this.currentUser.email;
            }
            
            if (userMembershipElement && this.currentUser) {
                const membershipName = this.currentUser.membershipLevel.charAt(0).toUpperCase() + 
                                      this.currentUser.membershipLevel.slice(1);
                
                let expiryInfo = '';
                if (this.currentUser.membershipExpiry && this.currentUser.membershipLevel !== AUTH_CONFIG.MEMBERSHIP_LEVELS.FREE) {
                    const expiryDate = new Date(this.currentUser.membershipExpiry);
                    expiryInfo = ` - Expire le ${expiryDate.toLocaleDateString()}`;
                }
                
                userMembershipElement.textContent = `Abonnement: ${membershipName}${expiryInfo}`;
            }
        } else {
            // User is not logged in
            navButtons.innerHTML = `
                <a href="login.html" class="login-btn">Connexion</a>
                <a href="signup.html" class="sign-btn">Inscription</a>
            `;
        }
    }
    
    /**
     * Save current user to localStorage
     * @private
     */
    _saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem(AUTH_CONFIG.STORAGE_KEY_USER, JSON.stringify(this.currentUser.toJSON()));
        }
    }

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<User>} - The registered user
     */
    async register(userData) {
        // Validate required fields
        if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
            throw new Error('Tous les champs sont requis');
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Format d\'email invalide');
        }
        
        // Validate password strength
        if (userData.password.length < 8) {
            throw new Error('Le mot de passe doit contenir au moins 8 caractères');
        }
        
        // In a real app, you would send this data to a server
        // For this demo, we'll simulate a successful registration
        
        // Check if user already exists
        const existingUsers = this._getUsers();
        const userExists = existingUsers.some(user => user.email === userData.email);
        
        if (userExists) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }
        
        // Create new user
        const newUser = new User({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            createdAt: new Date().toISOString()
        });
        
        // Store user in "database" (localStorage)
        this._saveUser(newUser, userData.password);
        
        // Return the new user (without password)
        return newUser;
    }

    /**
     * Log in a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<User>} - The logged in user
     */
    async login(email, password) {
        // Validate inputs
        if (!email || !password) {
            throw new Error('Email et mot de passe requis');
        }
        
        // In a real app, you would send this data to a server
        // For this demo, we'll check against our localStorage "database"
        
        // Get users from storage
        const users = this._getUsers();
        
        // Find user by email
        const user = users.find(u => u.email === email);
        
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        
        // Check password
        if (user.password !== this._hashPassword(password)) {
            throw new Error('Mot de passe incorrect');
        }
        
        // Create user instance
        this.currentUser = new User(user);
        
        // Update last login
        this.currentUser.lastLogin = new Date().toISOString();
        
        // Generate token
        this.token = this._generateToken(this.currentUser);
        
        // Save to localStorage
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY_USER, JSON.stringify(this.currentUser.toJSON()));
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY_TOKEN, this.token);
        
        // Update UI
        this._updateUI();
        
        return this.currentUser;
    }

    /**
     * Log out the current user
     */
    logout() {
        // Clear user data
        this.currentUser = null;
        this.token = null;
        
        // Remove from localStorage
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY_USER);
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY_TOKEN);
        
        // Update UI
        this._updateUI();
        
        // Redirect to home page
        window.location.href = AUTH_CONFIG.REDIRECT_AFTER_LOGOUT;
    }

    /**
     * Check if a user is authenticated
     * @returns {boolean} - True if user is authenticated, false otherwise
     */
    isAuthenticated() {
        return !!this.currentUser && !!this.token && !this._isTokenExpired(this.token);
    }

    /**
     * Get the current user
     * @returns {User|null} - The current user or null if not authenticated
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Update the current user's membership
     * @param {string} level - Membership level
     * @param {number} durationDays - Duration in days
     * @returns {Promise<User>} - Updated user
     */
    async updateUserMembership(level, durationDays) {
        if (!this.isAuthenticated()) {
            throw new Error('Utilisateur non connecté');
        }
        
        // Update membership
        this.currentUser.updateMembership(level, durationDays);
        
        // Save to localStorage
        this._saveCurrentUser();
        
        // Update UI
        this._updateUI();
        
        return this.currentUser;
    }
    
    /**
     * Check if current user has required membership level
     * @param {string} requiredLevel - Required membership level
     * @returns {boolean} - True if user has required level
     */
    hasRequiredMembership(requiredLevel) {
        if (!this.isAuthenticated()) return false;
        return this.currentUser.hasMembership(requiredLevel);
    }

    /**
     * Protect a page by requiring authentication
     * Redirects to login page if user is not authenticated
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = AUTH_CONFIG.REDIRECT_IF_UNAUTHENTICATED;
        }
    }

    /**
     * Simple password hashing (for demo purposes only)
     * @param {string} password - The password to hash
     * @returns {string} - The hashed password
     * @private
     */
    _hashPassword(password) {
        // In a real app, you would use a proper hashing algorithm
        // For this demo, we'll use a simple hash
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    /**
     * Get users from localStorage
     * @returns {Array} - Array of users
     * @private
     */
    _getUsers() {
        const usersJson = localStorage.getItem('cryptoinvest_users') || '[]';
        try {
            return JSON.parse(usersJson);
        } catch (error) {
            console.error('Error parsing users:', error);
            return [];
        }
    }

    /**
     * Save a user to localStorage
     * @param {User} user - The user to save
     * @param {string} password - The user's password
     * @private
     */
    _saveUser(user, password) {
        const users = this._getUsers();
        
        // Add password to user data (in a real app, this would be hashed on the server)
        const userData = {
            ...user.toJSON(),
            password: this._hashPassword(password)
        };
        
        // Add to users array
        users.push(userData);
        
        // Save to localStorage
        localStorage.setItem('cryptoinvest_users', JSON.stringify(users));
    }
}

// Create and export auth instance
const auth = new Auth();

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    auth._init();
    
    // Check if current page requires authentication
    const requiresAuth = document.body.hasAttribute('data-require-auth');
    if (requiresAuth) {
        auth.requireAuth();
    }
});

// Export auth instance
window.CryptoInvestAuth = auth;
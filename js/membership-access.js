/**
 * Membership Access Control Module for CryptoInvest
 * Handles access control for learning content based on user membership level
 */

// Configuration for content access levels
const CONTENT_ACCESS = {
    // Learning paths access requirements
    LEARNING_PATHS: {
        'beginner': 'free',     // Level 1 - Free access
        'intermediate': 'basic', // Level 2 - Requires Basic membership
        'expert': 'premium'      // Level 3 - Requires Premium membership
    },
    
    // Course access requirements
    COURSES: {
        'bitcoin-basics': 'free',          // Bitcoin Basics - Free access
        'trading-beginners': 'basic',      // Trading for Beginners - Requires Basic
        'defi-introduction': 'premium',    // DeFi Introduction - Requires Premium
        'algorithmic-trading': 'pro',      // Algorithmic Trading - Requires Pro
        'smart-contracts': 'pro',          // Smart Contracts - Requires Pro
        'tokenomics': 'premium'            // Tokenomics - Requires Premium
    }
};

// Class to manage content access
class MembershipAccess {
    constructor() {
        this.auth = window.CryptoInvestAuth;
        this.initialized = false;
        
        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    /**
     * Initialize access control
     */
    init() {
        if (this.initialized) return;
        
        // Apply access control to learning paths
        this.updateLearningPathsAccess();
        
        // Apply access control to courses
        this.updateCoursesAccess();
        
        // Add event listeners for login/logout
        document.addEventListener('user-auth-changed', () => {
            this.updateLearningPathsAccess();
            this.updateCoursesAccess();
        });
        
        this.initialized = true;
    }
    
    /**
     * Update access control for learning paths
     */
    updateLearningPathsAccess() {
        const pathCards = document.querySelectorAll('.path-card');
        
        pathCards.forEach((card, index) => {
            // Determine required membership level based on index
            let requiredLevel;
            
            switch(index) {
                case 0: // Beginner
                    requiredLevel = CONTENT_ACCESS.LEARNING_PATHS.beginner;
                    break;
                case 1: // Intermediate
                    requiredLevel = CONTENT_ACCESS.LEARNING_PATHS.intermediate;
                    break;
                case 2: // Expert
                    requiredLevel = CONTENT_ACCESS.LEARNING_PATHS.expert;
                    break;
                default:
                    requiredLevel = 'free';
            }
            
            // Check if user has required membership
            const hasAccess = this.auth.hasRequiredMembership(requiredLevel);
            
            // Update UI based on access
            const button = card.querySelector('.path-button');
            const progressText = card.querySelector('.path-progress span');
            const modules = card.querySelectorAll('.path-modules li');
            
            if (hasAccess) {
                // User has access
                button.classList.remove('disabled');
                button.innerHTML = 'Commencer le parcours <i class="fas fa-arrow-right"></i>';
                
                // Update modules
                modules.forEach(module => {
                    const icon = module.querySelector('i');
                    if (icon.classList.contains('fa-lock')) {
                        icon.classList.remove('fa-lock');
                        icon.classList.add('fa-check-circle');
                    }
                });
                
                // Update progress text if needed
                if (progressText && progressText.textContent.includes('Nécessite')) {
                    progressText.textContent = '0% complété';
                }
            } else {
                // User doesn't have access
                button.classList.add('disabled');
                
                // Determine which membership is required
                let membershipRequired = requiredLevel.charAt(0).toUpperCase() + requiredLevel.slice(1);
                
                button.innerHTML = `Abonnement ${membershipRequired} requis <i class="fas fa-lock"></i>`;
                
                // Update progress text
                if (progressText) {
                    progressText.textContent = `Nécessite abonnement ${membershipRequired}`;
                }
            }
        });
    }
    
    /**
     * Update access control for courses
     */
    updateCoursesAccess() {
        const courseCards = document.querySelectorAll('.course-card');
        
        courseCards.forEach((card, index) => {
            // Get course ID from data attribute or fallback to index-based mapping
            let courseId = card.getAttribute('data-course-id');
            
            // Fallback mapping if no data attribute
            if (!courseId) {
                switch(index) {
                    case 0: courseId = 'bitcoin-basics'; break;
                    case 1: courseId = 'trading-beginners'; break;
                    case 2: courseId = 'defi-introduction'; break;
                    default: courseId = 'unknown';
                }
            }
            
            // Get required membership level
            const requiredLevel = CONTENT_ACCESS.COURSES[courseId] || 'premium';
            
            // Check if user has required membership
            const hasAccess = this.auth.hasRequiredMembership(requiredLevel);
            
            // Update UI based on access
            const button = card.querySelector('.course-button');
            const progressText = card.querySelector('.course-progress span');
            
            if (hasAccess) {
                // User has access
                button.classList.remove('disabled');
                button.innerHTML = 'Commencer le cours <i class="fas fa-arrow-right"></i>';
                
                // Update progress text if needed
                if (progressText && progressText.textContent.includes('Nécessite')) {
                    progressText.textContent = '0% complété';
                }
            } else {
                // User doesn't have access
                button.classList.add('disabled');
                
                // Determine which membership is required
                let membershipRequired = requiredLevel.charAt(0).toUpperCase() + requiredLevel.slice(1);
                
                button.innerHTML = `Abonnement ${membershipRequired} requis <i class="fas fa-lock"></i>`;
                
                // Update progress text
                if (progressText) {
                    progressText.textContent = `Nécessite abonnement ${membershipRequired}`;
                }
            }
        });
    }
    
    /**
     * Check if a specific content is accessible to the current user
     * @param {string} contentId - ID of the content to check
     * @param {string} contentType - Type of content ('course' or 'path')
     * @returns {boolean} - True if user has access, false otherwise
     */
    canAccessContent(contentId, contentType) {
        let requiredLevel;
        
        if (contentType === 'course') {
            requiredLevel = CONTENT_ACCESS.COURSES[contentId];
        } else if (contentType === 'path') {
            requiredLevel = CONTENT_ACCESS.LEARNING_PATHS[contentId];
        } else {
            return false;
        }
        
        if (!requiredLevel) return false;
        
        return this.auth.hasRequiredMembership(requiredLevel);
    }
}

// Create and export instance
const membershipAccess = new MembershipAccess();

// Export for global access
window.CryptoInvestAccess = membershipAccess;
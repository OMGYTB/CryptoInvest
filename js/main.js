// Configuration
const CONFIG = {
    API_ENDPOINTS: {
        COINGECKO: 'https://api.coingecko.com/api/v3',
        NEWS: 'https://cryptonews-api.com/api/v1'
    },
    REFRESH_INTERVAL: 30000,
    CRYPTO_LIST: {
        bitcoin: { name: 'Bitcoin', symbol: 'BTC', color: '#ff9f43' },
        ethereum: { name: 'Ethereum', symbol: 'ETH', color: '#4facfe' },
        ripple: { name: 'Ripple', symbol: 'XRP', color: '#00f2fe' },
        cardano: { name: 'Cardano', symbol: 'ADA', color: '#0acffe' },
        solana: { name: 'Solana', symbol: 'SOL', color: '#45e3ff' }
    }
};

// Utilitaires de formatage
const formatters = {
    price: new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    }),
    
    percentage: new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }),

    number: new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })
};

// Classe principale pour la gestion des cryptomonnaies
class CryptoTracker {
    constructor() {
        this.prices = new Map();
        this.container = document.getElementById('crypto-prices');
        this.init();
    }

    async init() {
        await this.fetchPrices();
        this.startAutoRefresh();
        this.initScrollAnimation();
    }

    async fetchPrices() {
        try {
            const ids = Object.keys(CONFIG.CRYPTO_LIST).join(',');
            const response = await fetch(
                `${CONFIG.API_ENDPOINTS.COINGECKO}/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true&include_market_cap=true&include_volume=true`
            );
            const data = await response.json();
            this.updatePrices(data);
        } catch (error) {
            this.handleError('Erreur de chargement des prix');
        }
    }

    updatePrices(data) {
        Object.entries(data).forEach(([id, details]) => {
            const previousPrice = this.prices.get(id)?.eur;
            this.prices.set(id, details);
            this.updateCard(id, details, previousPrice);
        });
    }

    createCard(id, data) {
        const crypto = CONFIG.CRYPTO_LIST[id];
        const card = document.createElement('div');
        card.className = 'crypto-card';
        card.setAttribute('data-crypto', id);

        const priceChange = data.eur_24h_change;
        const changeClass = priceChange >= 0 ? 'positive-change' : 'negative-change';
        const changeIcon = priceChange >= 0 ? '▲' : '▼';

        card.innerHTML = `
            <div class="card-header">
                <h3>${crypto.name}</h3>
                <span class="symbol">${crypto.symbol}</span>
            </div>
            <div class="price-container">
                <p class="price">${formatters.price.format(data.eur)}</p>
                <p class="change ${changeClass}">
                    ${changeIcon} ${formatters.percentage.format(data.eur_24h_change / 100)}
                </p>
            </div>
            <div class="card-details">
                <div class="detail">
                    <span class="label">Volume 24h</span>
                    <span class="value">${formatters.price.format(data.eur_volume)}</span>
                </div>
                <div class="detail">
                    <span class="label">Cap. Marché</span>
                    <span class="value">${formatters.price.format(data.eur_market_cap)}</span>
                </div>
            </div>
        `;

        return card;
    }

    updateCard(id, data, previousPrice) {
        const existingCard = this.container.querySelector(`[data-crypto="${id}"]`);
        
        if (!existingCard) {
            const newCard = this.createCard(id, data);
            this.container.appendChild(newCard);
            return;
        }

        const priceElement = existingCard.querySelector('.price');
        const changeElement = existingCard.querySelector('.change');
        const newPrice = data.eur;

        // Animation de transition des prix
        if (previousPrice && previousPrice !== newPrice) {
            const direction = newPrice > previousPrice ? 'up' : 'down';
            this.animatePrice(priceElement, newPrice, direction);
        }

        // Mise à jour du changement
        const changeClass = data.eur_24h_change >= 0 ? 'positive-change' : 'negative-change';
        const changeIcon = data.eur_24h_change >= 0 ? '▲' : '▼';
        changeElement.className = `change ${changeClass}`;
        changeElement.textContent = `${changeIcon} ${formatters.percentage.format(data.eur_24h_change / 100)}`;
    }

    animatePrice(element, newPrice, direction) {
        element.classList.add(`price-${direction}`);
        element.textContent = formatters.price.format(newPrice);
        
        setTimeout(() => {
            element.classList.remove(`price-${direction}`);
        }, 600);
    }

    startAutoRefresh() {
        setInterval(() => this.fetchPrices(), CONFIG.REFRESH_INTERVAL);
    }

    initScrollAnimation() {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            const header = document.querySelector('header');

            if (currentScroll > lastScroll && currentScroll > 50) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            lastScroll = currentScroll;
        });
    }

    handleError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    new CryptoTracker();
});

document.addEventListener('DOMContentLoaded', () => {
    AOS.init({
        duration: 800,
        offset: 100,
        once: true
    });
    new CryptoTracker();
});

particlesJS('particles-js', {
    particles: {
        number: { value: 80 },
        color: { value: '#00f2fe' },
        shape: { type: 'circle' },
        opacity: { value: 0.5 },
        size: { value: 3 },
        move: {
            enable: true,
            speed: 2
        }
    }
});

class MarketPage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.cryptoData = [];
        this.filteredData = [];
        this.init();
    }

    async init() {
        this.initializeElements();
        this.setupEventListeners();
        await this.fetchMarketData();
        this.initializeCharts();
        this.initializeHeatmap();
        this.updateMarketStats();
    }

    initializeElements() {
        // Market stats elements
        this.marketCapEl = document.getElementById('total-market-cap');
        this.volumeEl = document.getElementById('total-volume');
        this.btcDominanceEl = document.getElementById('btc-dominance');

        // Controls
        this.searchInput = document.getElementById('crypto-search');
        this.sortSelect = document.getElementById('market-sort');
        this.viewButtons = document.querySelectorAll('.view-btn');
        
        // View containers
        this.tableView = document.querySelector('.table-view');
        this.gridView = document.querySelector('.grid-view');
        
        // Pagination
        this.prevButton = document.getElementById('prev-page');
        this.nextButton = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.sortSelect.addEventListener('change', () => this.handleSort());
        this.prevButton.addEventListener('click', () => this.changePage(-1));
        this.nextButton.addEventListener('click', () => this.changePage(1));
        
        this.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });
    }

    async fetchMarketData() {
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/coins/markets?' +
                'vs_currency=eur' +
                '&order=market_cap_desc' +
                '&per_page=250' +
                '&page=1' +
                '&sparkline=true' +
                '&price_change_percentage=24h,7d'
            );
            
            if (!response.ok) throw new Error('Erreur réseau');
            
            this.cryptoData = await response.json();
            this.filteredData = [...this.cryptoData];
            this.renderData();
            this.updateMarketStats();
        } catch (error) {
            this.showError('Erreur lors du chargement des données');
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    }

    formatPercentage(percentage) {
        if (!percentage) return 'N/A';
        return new Intl.NumberFormat('fr-FR', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(percentage / 100);
    }

    formatLargeNumber(number) {
        if (number >= 1e9) {
            return `${(number / 1e9).toFixed(2)}B €`;
        } else if (number >= 1e6) {
            return `${(number / 1e6).toFixed(2)}M €`;
        } else if (number >= 1e3) {
            return `${(number / 1e3).toFixed(2)}K €`;
        }
        return number.toFixed(2);
    }

    renderTableView(data) {
        const tbody = document.querySelector('#market-table tbody');
        tbody.innerHTML = data.map((crypto, index) => `
            <tr>
                <td>${(this.currentPage - 1) * this.itemsPerPage + index + 1}</td>
                <td>
                    <div class="crypto-name">
                        <img src="${crypto.image}" alt="${crypto.name}" width="24">
                        <span>${crypto.name}</span>
                        <span class="symbol">${crypto.symbol.toUpperCase()}</span>
                    </div>
                </td>
                <td>${this.formatPrice(crypto.current_price)}</td>
                <td class="${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                    ${this.formatPercentage(crypto.price_change_percentage_24h)}
                </td>
                <td class="${crypto.price_change_percentage_7d_in_currency >= 0 ? 'positive' : 'negative'}">
                    ${this.formatPercentage(crypto.price_change_percentage_7d_in_currency)}
                </td>
                <td>${this.formatLargeNumber(crypto.market_cap)}</td>
                <td>${this.formatLargeNumber(crypto.total_volume)}</td>
                <td>${this.formatLargeNumber(crypto.circulating_supply)} ${crypto.symbol.toUpperCase()}</td>
            </tr>
        `).join('');
    }

    renderGridView(data) {
        this.gridView.innerHTML = data.map(crypto => `
            <div class="crypto-card">
                <div class="crypto-card-header">
                    <img src="${crypto.image}" alt="${crypto.name}">
                    <div class="crypto-info">
                        <h3>${crypto.name}</h3>
                        <span class="symbol">${crypto.symbol.toUpperCase()}</span>
                    </div>
                </div>
                <div class="crypto-price">
                    <span class="current-price">${this.formatPrice(crypto.current_price)}</span>
                    <span class="price-change ${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                        ${this.formatPercentage(crypto.price_change_percentage_24h)}
                    </span>
                </div>
                <div class="crypto-stats">
                    <div class="stat">
                        <span class="label">Cap. Marché</span>
                        <span class="value">${this.formatLargeNumber(crypto.market_cap)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Volume 24h</span>
                        <span class="value">${this.formatLargeNumber(crypto.total_volume)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    switchView(view) {
        this.viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.tableView.classList.toggle('active', view === 'table');
        this.gridView.classList.toggle('active', view === 'grid');
        this.renderData();
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        this.filteredData = this.cryptoData.filter(crypto => 
            crypto.name.toLowerCase().includes(searchTerm) ||
            crypto.symbol.toLowerCase().includes(searchTerm)
        );
        this.currentPage = 1;
        this.renderData();
    }

    handleSort() {
        const [field, direction] = this.sortSelect.value.split('_');
        this.filteredData.sort((a, b) => {
            let comparison = 0;
            switch (field) {
                case 'market':
                    comparison = a.market_cap - b.market_cap;
                    break;
                case 'price':
                    comparison = a.current_price - b.current_price;
                    break;
                case 'volume':
                    comparison = a.total_volume - b.total_volume;
                    break;
            }
            return direction === 'asc' ? comparison : -comparison;
        });
        this.renderData();
    }

    changePage(delta) {
        const maxPage = Math.ceil(this.filteredData.length / this.itemsPerPage);
        this.currentPage = Math.max(1, Math.min(this.currentPage + delta, maxPage));
        this.renderData();
    }

    updatePagination() {
        const maxPage = Math.ceil(this.filteredData.length / this.itemsPerPage);
        this.pageInfo.textContent = `Page ${this.currentPage} sur ${maxPage}`;
        this.prevButton.disabled = this.currentPage === 1;
        this.nextButton.disabled = this.currentPage === maxPage;
    }

    renderData() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredData.slice(start, end);

        if (this.tableView.classList.contains('active')) {
            this.renderTableView(pageData);
        } else {
            this.renderGridView(pageData);
        }

        this.updatePagination();
    }

    updateMarketStats() {
        const totalMarketCap = this.cryptoData.reduce((sum, crypto) => sum + crypto.market_cap, 0);
        const totalVolume = this.cryptoData.reduce((sum, crypto) => sum + crypto.total_volume, 0);
        const btcDominance = (this.cryptoData[0]?.market_cap / totalMarketCap * 100) || 0;

        this.marketCapEl.textContent = this.formatLargeNumber(totalMarketCap);
        this.volumeEl.textContent = this.formatLargeNumber(totalVolume);
        this.btcDominanceEl.textContent = this.formatPercentage(btcDominance);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }

    initializeCharts() {
        // Implémentation des graphiques avec Chart.js
        // À ajouter selon vos besoins
    }

    initializeHeatmap() {
        // Implémentation de la heatmap
        // À ajouter selon vos besoins
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    new MarketPage();
});

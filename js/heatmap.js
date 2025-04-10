async function fetchMarketData(timeframe = '24h') {
    try {
        const url = `${API_ENDPOINTS.COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=${timeframe}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.map(coin => ({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            priceChange: coin.price_change_percentage_24h_in_currency || 0
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des données du marché:", error);
        return null;
    }
}

function createHeatmapTable(marketData) {
    const table = document.createElement('table');
    const headerRow = table.insertRow();
    const thSymbol = document.createElement('th');
    thSymbol.textContent = 'Symbole';
    headerRow.appendChild(thSymbol);
    const thName = document.createElement('th');
    thName.textContent = 'Nom';
    headerRow.appendChild(thName);
    const thChange = document.createElement('th');
    thChange.textContent = 'Variation (%)';
    headerRow.appendChild(thChange);

    marketData.forEach(coin => {
        const row = table.insertRow();
        const tdSymbol = row.insertCell();
        tdSymbol.textContent = coin.symbol;
        const tdName = row.insertCell();
        tdName.textContent = coin.name;
        const tdChange = row.insertCell();
        tdChange.textContent = coin.priceChange.toFixed(2);

        // Appliquer une couleur en fonction de la variation
        if (coin.priceChange > 0) {
            tdChange.style.backgroundColor = `rgba(0, 255, 0, ${coin.priceChange / 100})`; // Vert
        } else {
            tdChange.style.backgroundColor = `rgba(255, 0, 0, ${Math.abs(coin.priceChange) / 100})`; // Rouge
        }
    });

    return table;
}

async function updateHeatmap(timeframe = '24h') {
    const marketData = await fetchMarketData(timeframe);
    if (!marketData) {
        console.log("Impossible de récupérer les données du marché.");
        return;
    }

    const heatmapContainer = document.getElementById('market-heatmap-container');
    heatmapContainer.innerHTML = ''; // Effacer le contenu précédent
    const table = createHeatmapTable(marketData);
    heatmapContainer.appendChild(table);
}

// Initialisation et gestion du sélecteur de période
document.addEventListener('DOMContentLoaded', () => {
    const timeframeSelect = document.getElementById('heatmap-timeframe');
    timeframeSelect.addEventListener('change', (event) => {
        const selectedTimeframe = event.target.value;
        updateHeatmap(selectedTimeframe);
    });

    // Initialiser le heatmap avec la période par défaut
    updateHeatmap();
});
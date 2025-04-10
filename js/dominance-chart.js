const API_ENDPOINTS = {
    COINGECKO: 'https://api.coingecko.com/api/v3',
    NEWS: 'https://cryptonews-api.com/api/v1'
};

async function fetchDominanceData() {
    try {
        const url = `${API_ENDPOINTS.COINGECKO}/global`;
        const response = await fetch(url);
        const data = await response.json();
        return data.data.market_cap_percentage; // BTC, ETH, etc.
    } catch (error) {
        console.error("Erreur lors de la récupération des données de dominance:", error);
        return null;
    }
}

async function drawDominanceChart() {
    const dominanceData = await fetchDominanceData();

    if (!dominanceData) {
        console.log("Impossible de récupérer les données de dominance.");
        return;
    }

    const canvas = document.getElementById('dominance-chart');
    const ctx = canvas.getContext('2d');

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Préparation des données pour le graphique
    const labels = Object.keys(dominanceData);
    const values = Object.values(dominanceData);
    const total = values.reduce((a, b) => a + b, 0);

    // Couleurs pour chaque section du graphique
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

    // Dessiner le graphique en camembert
    let startAngle = 0;
    for (let i = 0; i < labels.length; i++) {
        const sliceAngle = 2 * Math.PI * (values[i] / total);
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        // Mise à jour de l'angle de départ pour la prochaine section
        startAngle += sliceAngle;
    }

    // Légende
    const legendX = 20;
    let legendY = 20;
    for (let i = 0; i < labels.length; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(legendX, legendY, 10, 10);
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.fillText(`${labels[i]} (${dominanceData[labels[i]].toFixed(1)}%)`, legendX + 15, legendY + 10);
        legendY += 20;
    }
}

// Appeler la fonction pour dessiner le graphique
drawDominanceChart();
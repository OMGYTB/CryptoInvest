async function fetchVolumeData() {
    try {
        const url = `${API_ENDPOINTS.COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`;
        const response = await fetch(url);
        const data = await response.json();
        return data.map(coin => ({
            symbol: coin.symbol.toUpperCase(),
            volume: coin.total_volume
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des données de volume:", error);
        return null;
    }
}

async function drawVolumeChart() {
    const volumeData = await fetchVolumeData();

    if (!volumeData) {
        console.log("Impossible de récupérer les données de volume.");
        return;
    }

    const canvas = document.getElementById('volume-chart');
    const ctx = canvas.getContext('2d');

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Paramètres du graphique
    const barWidth = 20;
    const barSpacing = 5;
    const startX = 50;
    const startY = canvas.height - 30;
    const maxValue = Math.max(...volumeData.map(coin => coin.volume));
    const chartHeight = canvas.height - 60;

    // Dessiner les barres
    for (let i = 0; i < volumeData.length; i++) {
        const barHeight = (volumeData[i].volume / maxValue) * chartHeight;
        const x = startX + i * (barWidth + barSpacing);
        const y = startY - barHeight;

        ctx.fillStyle = '#36A2EB';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Ajouter le label
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(volumeData[i].symbol, x + barWidth / 2, canvas.height - 10);
    }

    // Dessiner les axes
    ctx.beginPath();
    ctx.moveTo(startX - 10, startY);
    ctx.lineTo(canvas.width - 20, startY);
    ctx.moveTo(startX - 10, startY);
    ctx.lineTo(startX - 10, 20);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Ajouter les labels des axes (exemple)
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Cryptomonnaies', canvas.width / 2, canvas.height - 2);
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Volume (USD)', 0, 0);
    ctx.restore();
}

// Appeler la fonction pour dessiner le graphique
drawVolumeChart();
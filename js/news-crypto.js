async function fetchNews(category = 'crypto') {
    try {
        const url = `${API_ENDPOINTS.NEWS}/news?category=${category}&apikey=${NEWS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.data; // Assurez-vous que la structure de la réponse correspond
    } catch (error) {
        console.error("Erreur lors de la récupération des news:", error);
        return null;
    }
}

function createNewsItem(news) {
    const newsItem = document.createElement('div');
    newsItem.classList.add('news-item');

    const title = document.createElement('h3');
    title.textContent = news.title;
    newsItem.appendChild(title);

    const description = document.createElement('p');
    description.textContent = news.description;
    newsItem.appendChild(description);

    const link = document.createElement('a');
    link.href = news.url;
    link.textContent = 'Lire la suite';
    link.target = '_blank'; // Ouvrir dans un nouvel onglet
    newsItem.appendChild(link);

    return newsItem;
}

async function updateNews(category = 'crypto') {
    const newsData = await fetchNews(category);
    if (!newsData) {
        console.log("Impossible de récupérer les news.");
        return;
    }

    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = ''; // Effacer le contenu précédent

    newsData.forEach(news => {
        const newsItem = createNewsItem(news);
        newsContainer.appendChild(newsItem);
    });
}

// Initialisation et gestion du sélecteur de catégorie
document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('news-category');
    categorySelect.addEventListener('change', (event) => {
        const selectedCategory = event.target.value;
        updateNews(selectedCategory);
    });

    // Initialiser les news avec la catégorie par défaut
    updateNews();
});
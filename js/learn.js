// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Sélectionner tous les éléments FAQ
    const faqItems = document.querySelectorAll('.faq-item');

    // Ajouter un écouteur d'événements à chaque question
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Vérifier si la question actuelle est déjà active
            const isActive = item.classList.contains('active');

            // Fermer toutes les autres réponses
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Basculer l'état actif de la question cliquée
            item.classList.toggle('active');

            // Animation fluide de la flèche
            const icon = question.querySelector('i');
            if (isActive) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    // Ouvrir la première question par défaut (optionnel)
    if (faqItems.length > 0) {
        faqItems[0].classList.add('active');
        faqItems[0].querySelector('.faq-question i').style.transform = 'rotate(180deg)';
    }
});

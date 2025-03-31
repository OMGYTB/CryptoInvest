// Gestion du menu burger
const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');

burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Fermer le menu quand on clique sur un lien
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Fermer le menu quand on clique en dehors
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-links') && !e.target.closest('.burger')) {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
    }
});

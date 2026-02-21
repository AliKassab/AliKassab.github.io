// ===== SMOOTH SCROLL FOR NAVIGATION =====
const navLinks = document.querySelectorAll('.header-nav a');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== HEADER BACKGROUND ON SCROLL =====
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ===== ACTIVE NAVIGATION HIGHLIGHTING =====
const sections = document.querySelectorAll('.section, .hero');

const observerOptions = {
    threshold: 0.3,
    rootMargin: '-100px 0px -66% 0px'
};

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}, observerOptions);

sections.forEach(section => {
    navObserver.observe(section);
});

// ===== STAGGERED CARD REVEAL ANIMATION =====
function initCardRevealAnimation(selector) {
    const cards = document.querySelectorAll(selector);
    
    cards.forEach((card, index) => {
        card.setAttribute('data-card-index', index);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0', 10);
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, cardIndex * 100);
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(card => observer.observe(card));
}

// Initialize reveal animations for all card types
initCardRevealAnimation('.project-card');
initCardRevealAnimation('.game-card');
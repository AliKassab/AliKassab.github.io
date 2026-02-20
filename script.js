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

// ===== INTERSECTION OBSERVER FOR PROJECT CARDS =====
const projectCards = document.querySelectorAll('.project-card');

// Store card index as data attribute for proper stagger timing
projectCards.forEach((card, index) => {
    card.setAttribute('data-card-index', index);
});

const cardObserverOptions = {
    threshold: 0.15,
    rootMargin: '0px'
};

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0', 10);
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, cardIndex * 100);
        }
    });
}, cardObserverOptions);

projectCards.forEach(card => {
    cardObserver.observe(card);
});

// ===== INTERSECTION OBSERVER FOR GAME CARDS =====
const gameCards = document.querySelectorAll('.game-card');

// Store card index as data attribute for proper stagger timing
gameCards.forEach((card, index) => {
    card.setAttribute('data-card-index', index);
});

const gameCardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0', 10);
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, cardIndex * 100);
        }
    });
}, cardObserverOptions);

gameCards.forEach(card => {
    gameCardObserver.observe(card);
});

// ===== PROJECT CARD HOVER EFFECT =====
projectCards.forEach(card => {
    // Add hover effect enhancement
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    });
});
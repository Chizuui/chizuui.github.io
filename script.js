document.addEventListener('DOMContentLoaded', function() {
    /* ==== Navigation Links Observer ==== */
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-chip');

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const observerOptions = {
        root: null,
        threshold: 0.3,
        rootMargin: "-50px 0px 0px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => link.classList.remove('active'));
                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.nav-chip[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    /* ==== Fade Up Scroll Animations ==== */
    const fadeElements = document.querySelectorAll('.hero-card, .gallery-card, .contact-card, .affiliation-card, .section-title');
    
    const fadeObserverOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, fadeObserverOptions);

    fadeElements.forEach((el, index) => {
        el.classList.add('animate-on-scroll');
        // Add a slight stagger delay for gallery cards
        if(el.classList.contains('gallery-card')) {
            el.style.transitionDelay = `${(index % 4) * 0.1}s`;
        }
        fadeObserver.observe(el);
    });

    /* ==== Theme Toggles (Dark/Light and Monet) ==== */
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const colorBtn = document.getElementById('color-toggle');
    const body = document.body;

    // Dark/Light Mode Logic
    themeBtn.addEventListener('click', () => {
        if (body.classList.contains('theme-light')) {
            body.classList.remove('theme-light');
            body.classList.add('theme-dark');
            themeIcon.textContent = 'light_mode'; // change icon to light mode
        } else {
            body.classList.remove('theme-dark');
            body.classList.add('theme-light');
            themeIcon.textContent = 'dark_mode'; // change icon to dark mode
        }
    });

    // Monet Random Color Engine Mode
    colorBtn.addEventListener('click', () => {
        // Random Hue between 0 and 360
        const randomHue = Math.floor(Math.random() * 361);
        // Random Saturation between 60% and 100%
        const randomSat = Math.floor(Math.random() * 41) + 60; 
        
        // Apply to CSS variables
        document.documentElement.style.setProperty('--m3-hue', randomHue);
        document.documentElement.style.setProperty('--m3-sat', `${randomSat}%`);
    });

    /* ==== Context Menu Disable ==== */
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    /* ==== Externalized Gallery Card Navigation ==== */
    const galleryCards = document.querySelectorAll('.gallery-card[data-href]');
    galleryCards.forEach(card => {
        card.addEventListener('click', function() {
            const url = this.getAttribute('data-href');
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });
    });
});

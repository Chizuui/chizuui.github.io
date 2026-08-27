// The html.js gate is added by a tiny inline script in <head> (before the
// stylesheet), so CSS knows JS is available before first paint. It swaps
// the top-bar chips for the hamburger overlay and arms the hero entrance.
document.addEventListener('DOMContentLoaded', function () {
    const railQuery = window.matchMedia('(min-width: 1025px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ==== Navigation ==== */

    const navLinks = Array.from(document.querySelectorAll('.nav-chip'));
    const indicator = document.getElementById('nav-indicator');
    const line = document.querySelector('.sidebar-line');

    // Measured from the rail, so the chip count can change without touching this.
    function updateSidebarIndicator(link) {
        if (!indicator || !line || !link) return;

        if (!railQuery.matches) {
            indicator.style.transform = '';
            indicator.style.height = '';
            return;
        }

        const lineTop = line.getBoundingClientRect().top;
        const rect = link.getBoundingClientRect();
        indicator.style.height = `${rect.height}px`;
        indicator.style.transform = `translateY(${rect.top - lineTop}px)`;
    }

    // Rail chips and overlay chips share hrefs, so the active state is
    // matched by section instead of by element identity.
    function setActive(link) {
        if (!link) return;
        const href = link.getAttribute('href');

        navLinks.forEach(l => {
            const on = l.getAttribute('href') === href;
            l.classList.toggle('active', on);
            if (on) l.setAttribute('aria-current', 'true');
            else l.removeAttribute('aria-current');
        });

        updateSidebarIndicator(document.querySelector(`.nav-chip[href="${href}"]`));
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => setActive(link));
    });

    railQuery.addEventListener('change', () => {
        updateSidebarIndicator(document.querySelector('.nav-chip.active'));
    });

    // A thin band across the viewport midline. Only one section can straddle it,
    // so exactly one chip is ever active regardless of how tall sections are.
    const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            setActive(document.querySelector(`.nav-chip[href="#${entry.target.id}"]`));
        });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    document.querySelectorAll('main > section[id]').forEach(s => navObserver.observe(s));

    // The last section may never reach the midline band on very tall
    // viewports, so the footer doubles as a bottom sentinel: once it
    // enters the bottom strip of the viewport, the page is at its end.
    // Pure IntersectionObserver - no scroll listeners, per the skill.
    const footer = document.querySelector('.site-footer');
    if (footer) {
        const footerObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                setActive(document.querySelector('.nav-chip[href="#contact"]'));
            });
        }, { rootMargin: '-85% 0px 0px 0px', threshold: 0 });
        footerObserver.observe(footer);
    }

    updateSidebarIndicator(document.querySelector('.nav-chip.active') || navLinks[0]);


    /* ==== Mobile overlay menu ==== */

    const navToggle = document.getElementById('nav-toggle');
    const navOverlay = document.getElementById('nav-overlay');
    const overlayLinks = navOverlay ? Array.from(navOverlay.querySelectorAll('a')) : [];

    function setOverlay(open) {
        if (!navToggle || !navOverlay) return;
        navOverlay.classList.toggle('is-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        navOverlay.setAttribute('aria-hidden', String(!open));
        navOverlay.inert = !open; // keeps the closed menu out of tab order
        document.body.classList.toggle('nav-locked', open);
        (open ? (overlayLinks[0] || navToggle) : navToggle).focus();
    }

    if (navToggle && navOverlay) {
        navToggle.addEventListener('click', () => {
            setOverlay(!navOverlay.classList.contains('is-open'));
        });

        // Choosing a destination closes the menu; the anchor jump still runs.
        overlayLinks.forEach(link => link.addEventListener('click', () => setOverlay(false)));

        // Tapping the empty backdrop dismisses it.
        navOverlay.addEventListener('click', e => {
            if (e.target === navOverlay) setOverlay(false);
        });

        window.addEventListener('keydown', e => {
            if (e.key === 'Escape' && navOverlay.classList.contains('is-open')) setOverlay(false);
        });

        // Growing past the tablet breakpoint drops the overlay entirely.
        railQuery.addEventListener('change', e => {
            if (e.matches) setOverlay(false);
        });
    }


    /* ==== Gallery reveal ==== */

    // Cards are visible by default; the hidden state is only ever added here,
    // so the page renders fully with JS disabled.
    if (!reduceMotion.matches) {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.gallery-grid').forEach(grid => {
            // Stagger is counted per grid, so it tracks the real column run
            // instead of drifting with document order.
            grid.querySelectorAll('.animate-me').forEach((el, i) => {
                el.style.setProperty('--delay', `${Math.min(i, 3) * 0.08}s`);
                el.classList.add('animate-on-scroll');
                revealObserver.observe(el);
            });
        });

        // Section heads — one per section, shallow stagger.
        document.querySelectorAll('.section-head').forEach((el, i) => {
            el.style.setProperty('--delay', `${Math.min(i, 3) * 0.08}s`);
            el.classList.add('animate-on-scroll');
            revealObserver.observe(el);
        });
    }


    /* ==== Hero entrance ==== */

    // Hero elements are hidden by CSS under html.js, so they blur-fade in
    // once on load. The reveal class is dropped once settled so hover
    // physics (CTA pill, gallery) take over their own transitions.
    if (!reduceMotion.matches) {
        const heroReveals = Array.from(document.querySelectorAll('.hero-reveal'));
        heroReveals.forEach((el, i) => {
            el.style.setProperty('--delay', `${0.15 + i * 0.1}s`);
        });

        // Double rAF guarantees the hidden state is painted before the
        // visible state lands, so the transition actually runs.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                heroReveals.forEach(el => el.classList.add('is-visible'));
            });
        });

        // 0.8s transition + first delay + stagger, plus slack.
        const settleMs = 1000 + 0.15 * 1000 + (heroReveals.length - 1) * 100 + 200;
        setTimeout(() => {
            heroReveals.forEach(el => {
                el.classList.remove('hero-reveal');
                el.style.removeProperty('--delay');
            });
        }, settleMs);
    }
    /* ==== Poster lightbox ==== */

    const posterLinks = Array.from(document.querySelectorAll('.gallery--posters a.operation-node'));
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
        <button class="lightbox-close" type="button" aria-label="Close preview">×</button>
        <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous poster">←</button>
        <figure class="lightbox-figure">
            <img class="lightbox-image" alt="">
            <figcaption class="lightbox-caption">
                <span class="lightbox-index"></span>
                <span class="lightbox-name"></span>
            </figcaption>
            <a class="lightbox-original" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Open original ↗</a>
        </figure>
        <button class="lightbox-nav lightbox-next" type="button" aria-label="Next poster">→</button>
    `;
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxIndex = lightbox.querySelector('.lightbox-index');
    const lightboxName = lightbox.querySelector('.lightbox-name');
    const lightboxOriginal = lightbox.querySelector('.lightbox-original');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxPrev = lightbox.querySelector('.lightbox-prev');
    const lightboxNext = lightbox.querySelector('.lightbox-next');
    let activePosterIndex = 0;
    let previousFocus = null;

    function updateLightbox(index) {
        const link = posterLinks[index];
        const image = link ? link.querySelector('img') : null;
        if (!link || !image) return;

        activePosterIndex = index;
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
        lightboxIndex.textContent = `${String(index + 1).padStart(2, '0')} / ${String(posterLinks.length).padStart(2, '0')}`;
        lightboxName.textContent = image.alt;
        lightboxOriginal.href = link.href;
        lightboxPrev.disabled = posterLinks.length < 2;
        lightboxNext.disabled = posterLinks.length < 2;
    }

    function setLightbox(open) {
        lightbox.classList.toggle('is-open', open);
        lightbox.setAttribute('aria-hidden', String(!open));
        document.body.classList.toggle('lightbox-locked', open);
        if (open) lightboxClose.focus();
        else if (previousFocus) previousFocus.focus();
    }

    function openPoster(index) {
        if (!posterLinks.length) return;
        previousFocus = document.activeElement;
        updateLightbox((index + posterLinks.length) % posterLinks.length);
        setLightbox(true);
    }

    function stepPoster(direction) {
        if (!posterLinks.length) return;
        updateLightbox((activePosterIndex + direction + posterLinks.length) % posterLinks.length);
    }

    posterLinks.forEach((link, index) => {
        link.addEventListener('click', event => {
            event.preventDefault();
            openPoster(index);
        });
    });

    lightboxClose.addEventListener('click', () => setLightbox(false));
    lightboxPrev.addEventListener('click', () => stepPoster(-1));
    lightboxNext.addEventListener('click', () => stepPoster(1));
    lightbox.addEventListener('click', event => {
        if (event.target === lightbox) setLightbox(false);
    });

    window.addEventListener('keydown', event => {
        if (!lightbox.classList.contains('is-open')) return;
        if (event.key === 'Escape') setLightbox(false);
        if (event.key === 'ArrowLeft') stepPoster(-1);
        if (event.key === 'ArrowRight') stepPoster(1);
    });

    /* ==== Copy email ==== */

    const copyEmailButton = document.querySelector('.copy-email');
    const copyFeedback = document.querySelector('.copy-feedback');

    if (copyEmailButton && copyFeedback) {
        copyEmailButton.addEventListener('click', async () => {
            const email = copyEmailButton.dataset.copyEmail;
            try {
                await navigator.clipboard.writeText(email);
                copyFeedback.textContent = 'Email copied';
            } catch {
                copyFeedback.textContent = 'Copy failed — select the email above';
            }
        });
    }
});

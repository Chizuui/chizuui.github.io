document.addEventListener('DOMContentLoaded', function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 640px)');
    const navLinks = Array.from(document.querySelectorAll('.nav-chip'));
    const navToggle = document.getElementById('nav-toggle');
    const navOverlay = document.getElementById('nav-overlay');

    function containFocus(dialog) {
        dialog.addEventListener('keydown', event => {
            if (event.key !== 'Tab') return;
            const controls = [...dialog.querySelectorAll('a[href], button:not(:disabled), [tabindex="0"]')]
                .filter(element => element.getClientRects().length > 0);
            const first = controls[0];
            const last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        });
    }
    containFocus(navOverlay);

    function setActive(href) {
        navLinks.forEach(link => {
            const active = link.getAttribute('href') === href;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }

    navLinks.forEach(link => link.addEventListener('click', () => {
        setActive(link.getAttribute('href'));
        if (navOverlay.open) navOverlay.close();
    }));

    function reportOverlay() {
        document.dispatchEvent(new CustomEvent('portfolio:overlay', {
            detail: { open: Boolean(document.querySelector('dialog[open]')) }
        }));
    }

    navToggle.addEventListener('click', () => {
        navOverlay.showModal();
        navToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-locked');
        navOverlay.querySelector('a').focus();
        reportOverlay();
    });
    navOverlay.querySelector('.menu-close').addEventListener('click', () => navOverlay.close());
    navOverlay.addEventListener('close', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-locked');
        reportOverlay();
    });
    mobileQuery.addEventListener('change', event => {
        if (!event.matches && navOverlay.open) {
            navOverlay.close();
            document.querySelector('.nav-brand').focus({ preventScroll: true });
        }
    });
    // No inline JS gate: a blocked/failed script leaves real navigation visible.
    document.documentElement.classList.add('js');

    if ('IntersectionObserver' in window) {
        const navObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActive(`#${entry.target.id}`);
            });
        }, { rootMargin: '-40% 0px -50% 0px' });
        document.querySelectorAll('main > section[id]').forEach(section => navObserver.observe(section));
        const footerObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) setActive('#contact');
        }, { rootMargin: '-80% 0px 0px 0px' });
        footerObserver.observe(document.querySelector('.site-footer'));

        if (!reduceMotion.matches) {
            const revealObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                });
            }, { threshold: 0.08 });
            document.querySelectorAll('.animate-me').forEach(element => {
                element.classList.add('animate-on-scroll');
                revealObserver.observe(element);
            });
            reduceMotion.addEventListener('change', event => {
                if (!event.matches) return;
                revealObserver.disconnect();
                document.querySelectorAll('.animate-on-scroll').forEach(element => element.classList.add('is-visible'));
            });
        }
    }

    /* Native dialogs provide focus containment, Escape and background inertness. */
    const posters = Array.from(document.querySelectorAll('.gallery--posters a.operation-node'), element => ({
        element,
        image: element.querySelector('img'),
        href: element.getAttribute('href')
    }));
    const lightbox = document.createElement('dialog');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-label', 'Artwork preview');
    lightbox.innerHTML = `
        <button class="lightbox-close" type="button" aria-label="Close preview">×</button>
        <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous poster">←</button>
        <figure class="lightbox-figure">
            <img class="lightbox-image" alt="">
            <figcaption class="lightbox-caption" aria-live="polite" aria-atomic="true">
                <span class="lightbox-index"></span>
                <span class="lightbox-name"></span>
            </figcaption>
            <a class="lightbox-original" target="_blank" rel="noopener noreferrer">Open original <span aria-hidden="true">↗</span></a>
        </figure>
        <button class="lightbox-nav lightbox-next" type="button" aria-label="Next poster">→</button>
    `;
    document.body.appendChild(lightbox);
    containFocus(lightbox);

    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxIndex = lightbox.querySelector('.lightbox-index');
    const lightboxName = lightbox.querySelector('.lightbox-name');
    const lightboxOriginal = lightbox.querySelector('.lightbox-original');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxPrev = lightbox.querySelector('.lightbox-prev');
    const lightboxNext = lightbox.querySelector('.lightbox-next');
    let activePosterIndex = 0;
    let previousFocus = null;
    let activeCollection = posters;

    function updateLightbox(index) {
        activePosterIndex = (index + activeCollection.length) % activeCollection.length;
        const { image, href } = activeCollection[activePosterIndex];
        lightboxImage.src = image.getAttribute('src');
        lightboxImage.alt = image.alt;
        lightboxIndex.textContent = `${String(activePosterIndex + 1).padStart(2, '0')} / ${String(activeCollection.length).padStart(2, '0')}`;
        lightboxName.textContent = image.alt;
        lightboxOriginal.hidden = !href;
        if (href) lightboxOriginal.href = href;
        else lightboxOriginal.removeAttribute('href');
        lightboxPrev.disabled = activeCollection.length < 2;
        lightboxNext.disabled = activeCollection.length < 2;
    }

    function openArtwork(index, collection = posters) {
        if (!collection.length) return;
        activeCollection = collection;
        previousFocus = document.activeElement;
        updateLightbox(index);
        lightbox.showModal();
        document.body.classList.add('lightbox-locked');
        lightboxClose.focus();
        reportOverlay();
    }

    posters.forEach(({ element }, index) => {
        element.addEventListener('click', event => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            openArtwork(index);
        });
    });

    const otherWorks = Array.from(document.querySelectorAll('.gallery--other .operation-node'), element => ({
        element,
        image: element.querySelector('img'),
        href: null
    }));
    otherWorks.forEach(({ element, image }, index) => {
        const preview = document.createElement('button');
        preview.type = 'button';
        preview.className = 'artwork-preview';
        preview.setAttribute('aria-label', `Preview ${image.alt.toLowerCase()}`);
        const label = document.createElement('span');
        label.textContent = 'View artwork ↗';
        label.setAttribute('aria-hidden', 'true');
        preview.appendChild(label);
        element.querySelector('.node-image').appendChild(preview);
        preview.addEventListener('click', () => openArtwork(index, otherWorks));
    });

    lightboxClose.addEventListener('click', () => lightbox.close());
    lightboxPrev.addEventListener('click', () => updateLightbox(activePosterIndex - 1));
    lightboxNext.addEventListener('click', () => updateLightbox(activePosterIndex + 1));
    lightbox.addEventListener('click', event => {
        if (event.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener('close', () => {
        document.body.classList.remove('lightbox-locked');
        previousFocus?.focus({ preventScroll: true });
        reportOverlay();
    });
    lightbox.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        updateLightbox(activePosterIndex + (event.key === 'ArrowLeft' ? -1 : 1));
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

    // The archive, contact links and lightbox do not depend on the 3D module.
    import('./gallery.js?v=3.0.0')
        .then(({ initGallery }) => initGallery(posters, index => openArtwork(index)))
        .catch(() => {
            document.querySelector('.stage-mode').textContent = 'Poster selection';
        });
});

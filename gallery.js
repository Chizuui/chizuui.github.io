export function initGallery(posters, openPoster) {
    const room = document.querySelector('.gallery-room');
    if (!room || !posters.length) return;
    const stage = room.querySelector('.gallery-stage');
    const count = room.querySelector('.stage-count');
    const selectedLink = room.querySelector('.stage-poster');
    const selectedImage = room.querySelector('.fallback-main');
    const leftImage = room.querySelector('.fallback-left');
    const rightImage = room.querySelector('.fallback-right');
    const fallback = room.querySelector('.stage-fallback');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const items = posters.map(({ image }) => ({ src: image.dataset.preview || image.getAttribute('src') }));
    const motionToggle = room.querySelector('.motion-toggle');
    const viewToggle = room.querySelector('.view-toggle');
    const instructions = room.querySelector('.stage-instructions');
    const mode = room.querySelector('.stage-mode');
    const simpleInstructions = 'Use the arrows to browse · Enter to take a closer look';
    let selected = 0;
    let scene = null;
    let generation = 0;
    let pendingScene = null;
    let loading = false;
    let inView = true;
    let overlayOpen = Boolean(document.querySelector('dialog[open]'));
    // Desktop opens in the full experience. Respect accessibility and data-saving signals.
    let paused = reducedMotion.matches;
    let simple = reducedMotion.matches || Boolean(navigator.connection?.saveData);

    function readPreference(key) {
        try { return localStorage.getItem(`chizz-gallery-${key}`) === 'true'; }
        catch { return false; }
    }

    function savePreference(key, value) {
        try { localStorage.setItem(`chizz-gallery-${key}`, String(value)); }
        catch { /* Storage restrictions must not disable the gallery. */ }
    }

    function updateSettings() {
        motionToggle.hidden = !scene;
        motionToggle.textContent = paused ? 'Resume motion' : 'Pause motion';
        motionToggle.setAttribute('aria-pressed', String(paused));
        viewToggle.disabled = loading;
        viewToggle.textContent = loading ? 'Preparing 3D…' : scene ? 'Use simple view' : 'Use 3D view';
        viewToggle.setAttribute('aria-pressed', String(!scene));
        room.dataset.motion = paused ? 'paused' : 'running';
    }

    function select(index) {
        selected = ((index % posters.length) + posters.length) % posters.length;
        const item = posters[selected];
        const number = String(selected + 1).padStart(2, '0');
        count.textContent = `${number} / ${String(posters.length).padStart(2, '0')}`;
        selectedImage.src = items[selected].src;
        selectedImage.alt = item.image.alt;
        leftImage.src = items[(selected - 1 + posters.length) % posters.length].src;
        rightImage.src = items[(selected + 1) % posters.length].src;
        selectedLink.href = item.href;
        selectedLink.setAttribute('aria-label', `View poster ${number}`);
        scene?.select(selected);
    }

    room.querySelector('.stage-controls').hidden = false;
    room.querySelector('.stage-prev').addEventListener('click', () => select(selected - 1));
    room.querySelector('.stage-next').addEventListener('click', () => select(selected + 1));
    room.querySelector('.stage-open').addEventListener('click', () => openPoster(selected));
    selectedLink.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openPoster(selected);
    });
    stage.tabIndex = 0;
    stage.setAttribute('role', 'group');
    instructions.textContent = simpleInstructions;
    stage.addEventListener('keydown', event => {
        if (event.target !== stage) return;
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') select(selected - 1);
        if (event.key === 'ArrowRight') select(selected + 1);
        if (event.key === 'Home') select(0);
        if (event.key === 'End') select(posters.length - 1);
        if (event.key === 'Enter' || event.key === ' ') openPoster(selected);
    });
    select(0);

    function simpleView(reason = 'Simple view') {
        generation++;
        pendingScene?.abort();
        pendingScene = null;
        scene?.dispose();
        scene = null;
        loading = false;
        room.dataset.renderer = 'static';
        mode.textContent = reason;
        instructions.textContent = simpleInstructions;
        fallback.removeAttribute('aria-hidden');
        fallback.inert = false;
        stage.classList.remove('is-interactive');
        updateSettings();
    }

    function syncActivity() {
        scene?.setActive(inView && !document.hidden && !overlayOpen);
    }

    async function enableScene() {
        const current = ++generation;
        pendingScene?.abort();
        const request = new AbortController();
        pendingScene = request;
        loading = true;
        updateSettings();
        try {
            const { createPosterScene } = await import('./gallery-scene.js?v=3.0.0');
            if (current !== generation) return;
            const result = await createPosterScene(stage, items, {
                onSelect: select,
                onOpen: openPoster,
                onFallback: () => simpleView('Simple view · 3D unavailable'),
                signal: request.signal
            });
            if (current !== generation) { result.dispose(); return; }
            scene = result;
            loading = false;
            scene.setMotion(!paused);
            scene.select(selected, true);
            syncActivity();
            room.dataset.renderer = 'webgl';
            mode.textContent = 'An interactive selection';
            instructions.textContent = 'Drag to explore · Click to view · Or use arrow keys';
            fallback.setAttribute('aria-hidden', 'true');
            fallback.inert = true;
            stage.classList.add('is-interactive');
            updateSettings();
        } catch {
            if (current === generation) simpleView('Simple view · 3D unavailable');
        }
    }

    room.querySelector('.stage-settings').hidden = false;
    motionToggle.addEventListener('click', () => {
        paused = !paused;
        savePreference('paused', paused);
        scene?.setMotion(!paused);
        updateSettings();
    });
    viewToggle.addEventListener('click', () => {
        simple = Boolean(scene);
        savePreference('simple', simple);
        if (simple) simpleView();
        else enableScene();
    });
    reducedMotion.addEventListener('change', event => {
        if (!event.matches) return;
        paused = true;
        simpleView('Reduced motion');
    });
    document.addEventListener('visibilitychange', syncActivity);
    document.addEventListener('portfolio:overlay', event => {
        overlayOpen = event.detail.open;
        syncActivity();
    });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            inView = entries[0].isIntersecting;
            syncActivity();
        }, { threshold: 0 }).observe(stage);
    }
    window.addEventListener('pagehide', event => {
        if (event.persisted) scene?.setActive(false);
        else simpleView();
    });
    window.addEventListener('pageshow', syncActivity);
    updateSettings();
    if (simple) simpleView(reducedMotion.matches ? 'Reduced motion' : 'Simple view');
    else enableScene();
}

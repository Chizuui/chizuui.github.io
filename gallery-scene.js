import {
    Scene, PerspectiveCamera, WebGLRenderer, PlaneGeometry, Mesh,
    MeshBasicMaterial, Group, Texture, Raycaster, Vector2,
    SRGBColorSpace, DoubleSide, NoToneMapping
} from './vendor/three/three.module.js';

// Only this optional module owns WebGL. Content and controls live in the DOM.
export async function createPosterScene(stage, items, callbacks) {
    const canvas = document.createElement('canvas');
    canvas.className = 'gallery-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const attributes = { alpha: true, antialias: true, powerPreference: 'low-power' };
    const context = canvas.getContext('webgl2', attributes);
    if (!context) throw new Error('WebGL 2 is unavailable');
    const renderer = new WebGLRenderer({ canvas, context, ...attributes });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    const scene = new Scene();
    const camera = new PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 0, 10);
    const resources = new Set();
    const cards = [];
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const controller = new AbortController();
    const { signal } = controller;
    let disposed = false;
    let position = 0;
    let target = 0;
    let hoverX = 0;
    let hoverY = 0;
    let currentHoverX = 0;
    let currentHoverY = 0;
    let gesture = null;
    let frame = 0;
    let previousTime = 0;
    let previousDraw = 0;
    let elapsed = 0;
    let active = true;
    let motion = true;
    let width = 1;
    let height = 1;
    let resizeObserver;

    const keep = resource => { resources.add(resource); return resource; };
    const wrap = value => ((value % items.length) + items.length) % items.length;
    const offset = value => wrap(value + items.length / 2) - items.length / 2;
    const geometry = keep(new PlaneGeometry(2.36, 2.95, 16, 20));
    // Give each print a shallow physical curve, not a CSS rotate pretending to be 3D.
    const vertices = geometry.attributes.position;
    for (let index = 0; index < vertices.count; index++) {
        const x = vertices.getX(index);
        vertices.setZ(index, 0.085 * x * x);
    }
    geometry.computeVertexNormals();
    const paperGeometry = keep(geometry.clone());
    paperGeometry.scale(1.045, 1.035, 1);
    const paperMaterial = keep(new MeshBasicMaterial({ color: 0xf8f4ee, side: DoubleSide }));
    const shadowGeometry = keep(new PlaneGeometry(2.5, 3.12));
    const shadowMaterial = keep(new MeshBasicMaterial({
        color: 0x382719, transparent: true, opacity: 0.075, depthWrite: false
    }));

    function dispose() {
        if (disposed) return;
        disposed = true;
        cancelAnimationFrame(frame);
        controller.abort();
        resizeObserver?.disconnect();
        stage.classList.remove('is-dragging');
        resources.forEach(resource => resource.dispose());
        resources.clear();
        renderer.dispose();
        // Release the GPU context when switching to simple view, not just meshes.
        renderer.forceContextLoss();
        canvas.remove();
    }

    function fail() {
        dispose();
        callbacks.onFallback();
    }

    callbacks.signal?.addEventListener('abort', dispose, { once: true, signal });
    if (callbacks.signal?.aborted) {
        dispose();
        throw new Error('Gallery initialization cancelled');
    }

    async function loadTexture(src) {
        const image = new Image();
        image.decoding = 'async';
        image.src = src;
        let timeout;
        try {
            await Promise.race([
                image.decode(),
                new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Texture timed out')), 10_000); })
            ]);
        } finally { clearTimeout(timeout); }
        if (disposed) return null;
        const texture = keep(new Texture(image));
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
        return texture;
    }

    function layout(delta) {
        const smooth = motion ? 1 - Math.exp(-delta * 12) : 1;
        position += (target - position) * smooth;
        currentHoverX += (hoverX - currentHoverX) * smooth;
        currentHoverY += (hoverY - currentHoverY) * smooth;
        const compact = width < 640;
        const spacing = compact ? 2.05 : 2.6;
        cards.forEach((card, index) => {
            const distance = offset(index - position);
            const absolute = Math.abs(distance);
            card.visible = absolute < (compact ? 2.1 : 3.1) && Boolean(card.children[2].material.map);
            if (!card.visible) return;
            const float = motion ? Math.sin(elapsed * 0.8 + index * 0.9) * 0.065 : 0;
            card.position.set(
                distance * spacing + currentHoverX * 0.1,
                -Math.min(absolute, 2) * 0.14 + float + currentHoverY * 0.035,
                0.45 - absolute * 1.03
            );
            card.rotation.set(
                currentHoverY * 0.035,
                -distance * 0.18 + currentHoverX * 0.055,
                -0.045 - distance * 0.085
            );
        });
    }

    function draw(now) {
        frame = 0;
        if (disposed || !active) return;
        // Gentle floating needs 30fps, not a full-speed 120Hz render loop.
        if (motion && now - previousDraw < 1000 / 30) {
            frame = requestAnimationFrame(draw);
            return;
        }
        previousDraw = now;
        const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 1 / 60;
        previousTime = now;
        elapsed += motion ? delta : 0;
        layout(delta);
        try {
            renderer.render(scene, camera);
        } catch {
            fail();
            return;
        }
        const unsettled = Math.abs(target - position) > 0.001;
        if (motion || unsettled || gesture?.dragging) frame = requestAnimationFrame(draw);
    }

    function invalidate() {
        if (!disposed && active && !frame) frame = requestAnimationFrame(draw);
    }

    function resize() {
        width = stage.clientWidth;
        height = stage.clientHeight;
        if (!width || !height) return;
        // A hard pixel budget matters more than the phone's advertised DPR.
        const ratio = Math.min(window.devicePixelRatio || 1, width < 640 ? 1.25 : 1.5);
        const scale = Math.min(ratio, Math.sqrt(1_500_000 / (width * height)));
        renderer.setSize(Math.floor(width * scale), Math.floor(height * scale), false);
        camera.aspect = width / height;
        camera.position.z = width < 640 ? 8.6 : 7.1;
        camera.updateProjectionMatrix();
        invalidate();
    }

    function hitTest(event) {
        const rect = canvas.getBoundingClientRect();
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
            -(event.clientY - rect.top) / rect.height * 2 + 1);
        scene.updateMatrixWorld(true);
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObjects(cards, true)
            .find(hit => hit.object.userData.poster !== undefined && hit.object.parent.visible)?.object.userData.poster;
    }

    function select(index) {
        target += offset(index - target);
        if (!motion) position = target;
        invalidate();
    }

    function finishGesture(event, cancelled = false) {
        if (!gesture || gesture.id !== event.pointerId) return;
        const finished = gesture;
        gesture = null;
        stage.classList.remove('is-dragging');
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        if (cancelled) {
            target = Math.round(target);
            callbacks.onSelect(wrap(target));
        } else if (finished.dragging) {
            const delta = (event.clientX - finished.x) / Math.max(160, width * 0.27);
            target = finished.target - Math.sign(delta) * Math.max(1, Math.round(Math.abs(delta)));
            callbacks.onSelect(wrap(target));
        } else {
            const hit = hitTest(event);
            if (hit === wrap(Math.round(target))) callbacks.onOpen(hit);
            else if (hit !== undefined) { select(hit); callbacks.onSelect(hit); }
        }
        invalidate();
    }

    try {
        for (let index = 0; index < items.length; index++) {
            const group = new Group();
            const paper = new Mesh(paperGeometry, paperMaterial);
            paper.position.z = -0.015;
            const shadow = new Mesh(shadowGeometry, shadowMaterial);
            shadow.position.set(0.07, -0.1, -0.045);
            const material = keep(new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide }));
            const print = new Mesh(geometry, material);
            print.userData.poster = index;
            group.add(shadow, paper, print);
            scene.add(group);
            cards.push(group);
        }
        // Load only the visible neighbors first. The remainder is demand-loaded.
        const ready = new Map();
        async function ensureTexture(index) {
            const normalized = wrap(index);
            if (!ready.has(normalized)) {
                ready.set(normalized, loadTexture(items[normalized].src).then(texture => {
                    if (!texture) return;
                    const material = cards[normalized].children[2].material;
                    material.map = texture;
                    material.needsUpdate = true;
                    invalidate();
                }));
            }
            return ready.get(normalized);
        }
        await Promise.all([0, 1, 2, items.length - 1, items.length - 2].map(ensureTexture));
        if (disposed) throw new Error('Gallery initialization cancelled');
        stage.appendChild(canvas);
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(stage);
        resize();
        layout(1);
        renderer.render(scene, camera);

        canvas.addEventListener('webglcontextlost', event => {
            event.preventDefault();
            fail();
        }, { signal });
        canvas.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button !== 0) return;
            stage.focus({ preventScroll: true });
            gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, target: Math.round(target), dragging: false };
        }, { signal });
        canvas.addEventListener('pointermove', event => {
            const rect = canvas.getBoundingClientRect();
            hoverX = motion ? (event.clientX - rect.left) / rect.width * 2 - 1 : 0;
            hoverY = motion ? (event.clientY - rect.top) / rect.height * 2 - 1 : 0;
            if (!gesture || gesture.id !== event.pointerId) return;
            const dx = event.clientX - gesture.x;
            const dy = event.clientY - gesture.y;
            if (!gesture.dragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
                gesture = null;
                return; // Native vertical scrolling must win over the carousel.
            }
            if (!gesture.dragging && Math.abs(dx) > 8) {
                gesture.dragging = true;
                canvas.setPointerCapture(event.pointerId);
                stage.classList.add('is-dragging');
            }
            if (gesture.dragging) {
                target = gesture.target - dx / Math.max(160, width * 0.27);
                const center = Math.round(target);
                Promise.all([center - 2, center - 1, center, center + 1, center + 2].map(ensureTexture)).catch(fail);
                invalidate();
            }
        }, { signal });
        canvas.addEventListener('pointerup', event => finishGesture(event), { signal });
        canvas.addEventListener('pointercancel', event => finishGesture(event, true), { signal });
        canvas.addEventListener('lostpointercapture', event => finishGesture(event, true), { signal });
        canvas.addEventListener('pointerleave', () => {
            hoverX = 0;
            hoverY = 0;
            if (gesture && !gesture.dragging) gesture = null;
        }, { signal });
        return {
            select(index, instant = false) {
                select(index);
                if (instant) position = target;
                Promise.all([index - 2, index - 1, index, index + 1, index + 2].map(ensureTexture)).catch(fail);
            },
            setActive(value) {
                active = value;
                previousTime = 0;
                if (!active) { cancelAnimationFrame(frame); frame = 0; }
                else invalidate();
            },
            setMotion(value) {
                motion = value;
                if (!value) { hoverX = 0; hoverY = 0; position = target; }
                invalidate();
            },
            dispose
        };
    } catch (error) {
        dispose();
        throw error;
    }
}

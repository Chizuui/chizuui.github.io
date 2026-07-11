document.addEventListener('DOMContentLoaded', function() {
    /* ==== Boot Loading Screen Animation (3s duration) ==== */
    const bootScreen = document.getElementById('boot-screen');
    const bootProgress = document.getElementById('boot-progress');
    const bootStatus = document.getElementById('boot-status');

    if (bootScreen && bootProgress) {
        document.body.style.overflow = 'hidden'; // Disable scroll during load

        let progress = 0;
        const duration = 1000; // 2 seconds load time
        const intervalTime = 50;
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        const statuses = [
            "> INITIATE WEBSITE...",
            "> SCANNING BLUEPRINTS...",
            "> CACHING RENDER SHARDS...",
            "> ALMOST THERE..."
        ];

        const progressInterval = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                bootProgress.style.width = '100%';
                if (bootStatus) bootStatus.textContent = "> SYSTEM ONLINE. INITIALIZING NODE VIEW...";
                
                setTimeout(() => {
                    bootScreen.classList.add('fade-out');
                    document.body.style.overflow = ''; // Restore scroll
                }, 400);
            } else {
                bootProgress.style.width = `${progress}%`;
                
                const statusIndex = Math.min(
                    Math.floor((progress / 100) * statuses.length),
                    statuses.length - 1
                );
                if (bootStatus) {
                    bootStatus.textContent = statuses[statusIndex];
                }
            }
        }, intervalTime);
    }

    /* ==== Floating Particles Canvas ==== */
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let W, H, particles;

        const PARTICLE_COUNT = 110;
        const CONNECTION_DIST = 130;

        const COLORS = [
            'rgba(255, 59, 59, 0.55)',
            'rgba(255, 59, 59, 0.35)',
            'rgba(200, 80, 80, 0.3)',
            'rgba(180, 100, 100, 0.2)',
            'rgba(26, 21, 21, 0.2)',
            'rgba(26, 21, 21, 0.1)',
        ];

        function randomBetween(a, b) {
            return a + Math.random() * (b - a);
        }

        function createParticle(isAccent = false) {
            return {
                x: randomBetween(0, W || window.innerWidth),
                y: randomBetween(0, H || window.innerHeight),
                r: isAccent ? randomBetween(2.5, 4.5) : randomBetween(0.7, 2.2),
                vx: randomBetween(-0.2, 0.2),
                vy: randomBetween(-0.28, -0.05),
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                wobble: randomBetween(0, Math.PI * 2),
                wobbleSpeed: randomBetween(0.003, 0.01),
                wobbleAmt: randomBetween(0.08, 0.4),
                isAccent,
            };
        }

        function resize() {
            W = canvas.width = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        }

        function init() {
            resize();
            // Mix of regular + 12 accent particles
            particles = [
                ...Array.from({ length: PARTICLE_COUNT - 12 }, () => createParticle(false)),
                ...Array.from({ length: 12 }, () => createParticle(true)),
            ];
        }

        function tick() {
            ctx.clearRect(0, 0, W, H);

            // Draw connection lines first (behind particles)
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DIST) {
                        const alpha = (1 - dist / CONNECTION_DIST) * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(255, 59, 59, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            for (const p of particles) {
                p.wobble += p.wobbleSpeed;
                p.x += p.vx + Math.sin(p.wobble) * p.wobbleAmt;
                p.y += p.vy;

                // Wrap around
                if (p.y < -10) p.y = H + 10;
                if (p.x < -10) p.x = W + 10;
                if (p.x > W + 10) p.x = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }

            requestAnimationFrame(tick);
        }

        window.addEventListener('resize', resize);

        init();
        tick();
    }

    /* ==== Navigation Links Observer & Line Sidebar ==== */
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-chip');

    function updateSidebarIndicator(activeLink) {
        const indicator = document.getElementById('nav-indicator');
        if (!indicator || !activeLink) return;
        const index = activeLink.getAttribute('data-index');
        if (window.innerWidth > 1024) {
            indicator.style.transform = `translateY(${index * 40}px)`;
        } else {
            indicator.style.transform = 'none';
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            updateSidebarIndicator(this);
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
                    updateSidebarIndicator(activeLink);
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Initialize indicator on load
    const initialActive = document.querySelector('.nav-chip.active');
    if (initialActive) {
        updateSidebarIndicator(initialActive);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        const activeLink = document.querySelector('.nav-chip.active');
        if (activeLink) {
            updateSidebarIndicator(activeLink);
        }
    });

    /* ==== Fade Up Scroll Animations ==== */
    const fadeElements = document.querySelectorAll('.animate-me');
    
    const fadeObserverOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, fadeObserverOptions);

    fadeElements.forEach((el, index) => {
        el.classList.add('animate-on-scroll');
        if(el.classList.contains('operation-node')) {
            const delay = `${(index % 4) * 0.15}s`;
            el.style.setProperty('--delay', delay);
            el.style.transitionDelay = delay;
        }
        fadeObserver.observe(el);
    });



    /* ==== Context Menu Disable ==== */
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    /* ==== Prevent DevTools Hotkeys ==== */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            return false;
        }
    });

    /* ==== Anti-DevTools Debugger Loop ==== */
    setInterval(function() {
        (function() {
            try {
                (function a(i) {
                    if (("" + i / i)["length"] !== 1 || i % 20 === 0) {
                        (function() {}
                            ["constructor"]("debugger")());
                    } else {
                        debugger;
                    }
                    a(++i);
                })(0);
            } catch (e) {}
        })();
    }, 1000);

    /* ==== Externalized Gallery Card Navigation ==== */
    const galleryCards = document.querySelectorAll('.operation-node[data-href]');
    galleryCards.forEach(card => {
        card.addEventListener('click', function() {
            const url = this.getAttribute('data-href');
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });
    });

    /* ==== Live Telemetry Telemetry Update ==== */
    const coordEl = document.getElementById('telemetry-coord');
    const loadEl = document.getElementById('telemetry-load');
    const flowEl = document.getElementById('telemetry-flow');

    if (coordEl || loadEl || flowEl) {
        setInterval(() => {
            if (coordEl) {
                const x = (Math.random() * 200 + 100).toFixed(2);
                const y = (Math.random() * 800 + 100).toFixed(2);
                coordEl.textContent = `X: ${x} Y: ${y}`;
            }
            if (loadEl) {
                const load = (Math.random() * 10 + 35).toFixed(1);
                loadEl.textContent = `${load}%`;
            }
            if (flowEl) {
                const flow = (Math.random() * 0.5 + 0.8).toFixed(2);
                flowEl.textContent = `${flow} GB/S`;
            }
        }, 1500);
    }
});

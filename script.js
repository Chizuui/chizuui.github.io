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
            el.style.transitionDelay = `${(index % 4) * 0.1}s`;
        }
        fadeObserver.observe(el);
    });

    /* ==== Cursor Parallax for Background ==== */
    const blueprintBg = document.querySelector('.blueprint-bg');
    if (blueprintBg) {
        document.addEventListener('mousemove', function(e) {
            const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

            // Move shard wraps
            const wraps = document.querySelectorAll('.shard-wrap');
            wraps.forEach((wrap, index) => {
                const speed = (index + 1) * 15;
                wrap.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
            });

            // Move silhouette
            const silhouette = document.querySelector('.silhouette');
            if (silhouette) {
                silhouette.style.transform = `translate(${mouseX * -20}px, ${mouseY * -20}px)`;
            }

            // Move axis lines slightly
            const axisX = document.querySelector('.axis-x');
            const axisY = document.querySelector('.axis-y');
            if (axisX) axisX.style.transform = `translateY(${mouseY * 10}px)`;
            if (axisY) axisY.style.transform = `translateX(${mouseX * 10}px)`;
        });
    }

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

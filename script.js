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

    function setActive(link) {
        if (!link || link.classList.contains('active')) return;

        navLinks.forEach(l => {
            const on = l === link;
            l.classList.toggle('active', on);
            if (on) l.setAttribute('aria-current', 'true');
            else l.removeAttribute('aria-current');
        });

        updateSidebarIndicator(link);
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

    // Sections are content-height now, so the last one may never reach the band.
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
            setActive(navLinks[navLinks.length - 1]);
        }
    }, { passive: true });

    updateSidebarIndicator(document.querySelector('.nav-chip.active') || navLinks[0]);


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
                el.style.setProperty('--delay', `${Math.min(i, 3) * 0.06}s`);
                el.classList.add('animate-on-scroll');
                revealObserver.observe(el);
            });
        });
    }
});

        // Theme toggle (initial value is set by the inline script in <head>)
        const themeToggle = document.getElementById('theme-toggle');
        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            themeToggle.setAttribute('aria-label',
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

        themeToggle.addEventListener('click', () => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem('theme', next); } catch (e) { }
            applyTheme(next);
        });

        // Follow the system setting until the visitor picks a side
        darkQuery.addEventListener('change', e => {
            let stored = null;
            try { stored = localStorage.getItem('theme'); } catch (err) { }
            if (!stored) applyTheme(e.matches ? 'dark' : 'light');
        });

        const navLinks = document.querySelectorAll('.nav-link');
        const currentPage = location.pathname.split('/').pop() || 'index.html';
        navLinks.forEach(link => {
            const active = link.getAttribute('href') === currentPage;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
        });

        // Mobile menu
        const navToggle = document.getElementById('nav-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        function closeMenu() {
            mobileMenu.classList.add('hidden');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.innerHTML = '&#9776;';
        }
        function openMenu() {
            mobileMenu.classList.remove('hidden');
            navToggle.setAttribute('aria-expanded', 'true');
            navToggle.innerHTML = '&#10005;';
        }
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.contains('hidden') ? openMenu() : closeMenu();
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Scroll reveal
        const revObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        document.querySelectorAll('.reveal').forEach(el => revObserver.observe(el));

        // Back to top
        const toTop = document.getElementById('to-top');
        window.addEventListener('scroll', () => {
            toTop.classList.toggle('show', window.scrollY > window.innerHeight * 0.6);
        }, { passive: true });
        toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        // Desktop-only guard
        function isMobileDevice() {
            return window.matchMedia('(max-width: 768px)').matches
                || (window.matchMedia('(pointer: coarse)').matches && window.matchMedia('(hover: none)').matches);
        }
        const warning = document.getElementById('mobile-warning');
        let warnTimer;
        document.querySelectorAll('[data-desktop-only]').forEach(btn => {
            btn.addEventListener('click', e => {
                if (isMobileDevice()) {
                    e.preventDefault();
                    warning.classList.add('show');
                    clearTimeout(warnTimer);
                    warnTimer = setTimeout(() => warning.classList.remove('show'), 4500);
                }
            });
        });
        warning.addEventListener('click', () => warning.classList.remove('show'));

        // Steam showcase
        (function () {
            const el = id => document.getElementById(id);
            if (!el('steam-name')) return;
            const esc = s => String(s).replace(/[&<>"']/g, c =>
                ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
            fetch('steam-data.json', { cache: 'no-cache' })
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(d => {
                    const p = d.profile || {};
                    if (p.name) el('steam-name').textContent = p.name;
                    if (p.avatar) { const a = el('steam-avatar'); a.src = p.avatar; a.classList.remove('hidden'); }
                    const sub = [];
                    if (p.memberSince) sub.push('Member since ' + p.memberSince);
                    if (p.country && p.country.name) sub.push((p.country.flag ? p.country.flag + ' ' : '') + p.country.name);
                    if (sub.length) el('steam-state').textContent = sub.join('  ·  ');
                    if (p.level != null || p.gameCount != null || p.totalHours != null || p.achievements != null) {
                        if (p.level != null) el('steam-level').textContent = p.level;
                        if (p.gameCount != null) el('steam-games').textContent = p.gameCount.toLocaleString();
                        if (p.totalHours != null) el('steam-hours').textContent = p.totalHours.toLocaleString();
                        if (p.achievements != null) {
                            el('steam-ach').textContent = p.achievements.toLocaleString();
                            el('steam-ach-tile').classList.remove('hidden');
                        }
                        el('steam-stats').classList.remove('hidden');
                    }
                    const gameCard = (g, meta) => `
                        <a href="https://store.steampowered.com/app/${encodeURIComponent(g.appid)}/" target="_blank" rel="noopener noreferrer" class="block flex-shrink-0 w-[140px] rounded border border-line overflow-hidden">
                            <img src="${esc(g.img)}" alt="${esc(g.name)}" loading="lazy" decoding="async" class="w-full h-auto" />
                            <div class="px-2 py-2">
                                <p class="text-[0.72rem] text-ink leading-tight">${esc(g.name)}</p>
                                <p class="text-[0.62rem] text-muted mt-0.5">${meta}</p>
                            </div>
                        </a>`;
                    if (Array.isArray(d.mostPlayed) && d.mostPlayed.length) {
                        el('steam-featured').innerHTML = d.mostPlayed
                            .map(g => gameCard(g, esc(g.hoursTotal.toLocaleString()) + 'h total')).join('');
                        el('steam-featured-wrap').classList.remove('hidden');
                    }
                    if (Array.isArray(d.recent) && d.recent.length) {
                        el('steam-recent').innerHTML = d.recent
                            .map(g => gameCard(g, esc(g.hours2w) + 'h past 2 weeks')).join('');
                        el('steam-recent-wrap').classList.remove('hidden');
                    }
                    if (d.updated) {
                        el('steam-updated').textContent = 'Updated ' +
                            new Date(d.updated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                    }
                    document.querySelectorAll('.card-hscroll, .card-vscroll')
                        .forEach(s => s.dispatchEvent(new Event('sb-refresh')));
                })
                .catch(() => { });
        })();

        // Mouse, touch, keyboard, and button navigation for horizontal carousels.
        function attachDots(scroller, index) {
            const label = scroller.id === 'steam-featured' ? 'Most played games'
                : scroller.id === 'steam-recent' ? 'Recently played games'
                : scroller.closest('section')?.querySelector('h2')?.textContent.trim() || 'Profile';
            if (!scroller.id) scroller.id = 'carousel-' + index;
            scroller.tabIndex = 0;
            scroller.setAttribute('aria-label', label);
            const controls = document.createElement('div');
            controls.className = 'carousel-controls';
            const dots = document.createElement('div');
            dots.className = 'card-dots';
            const arrow = (direction, text) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'carousel-arrow';
                button.textContent = text;
                button.setAttribute('aria-label', direction + ': ' + label);
                button.setAttribute('aria-controls', scroller.id);
                return button;
            };
            const previous = arrow('Scroll left', '←');
            const next = arrow('Scroll right', '→');
            controls.append(previous, dots, next);
            scroller.after(controls);
            let count = -1;
            const maxScroll = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            const positions = () => [...scroller.children].map(child => Math.min(maxScroll(),
                child.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft));
            const go = left => scroller.scrollTo({left,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
            const step = direction => {
                const stops = positions();
                const target = direction > 0 ? stops.find(left => left > scroller.scrollLeft + 2)
                    : stops.reverse().find(left => left < scroller.scrollLeft - 2);
                go(target ?? (direction > 0 ? maxScroll() : 0));
            };
            previous.addEventListener('click', () => step(-1));
            next.addEventListener('click', () => step(1));
            const update = () => {
                const stops = positions();
                const closest = stops.reduce((best, left, i) =>
                    Math.abs(left - scroller.scrollLeft) < Math.abs(stops[best] - scroller.scrollLeft) ? i : best, 0);
                [...dots.children].forEach((dot, i) => {
                    dot.classList.toggle('active', i === closest);
                    dot.setAttribute('aria-current', i === closest ? 'true' : 'false');
                });
                previous.disabled = scroller.scrollLeft <= 2;
                next.disabled = scroller.scrollLeft >= maxScroll() - 2;
            };
            const build = () => {
                const n = scroller.children.length;
                if (n !== count) {
                    count = n;
                    dots.replaceChildren();
                    for (let i = 0; i < n; i++) {
                        const dot = document.createElement('button');
                        dot.type = 'button';
                        dot.className = 'card-dot';
                        dot.setAttribute('aria-label', label + ': go to item ' + (i + 1));
                        dot.addEventListener('click', () => go(positions()[i]));
                        dots.appendChild(dot);
                    }
                }
                controls.hidden = maxScroll() <= 1;
                scroller.tabIndex = controls.hidden ? -1 : 0;
                update();
            };
            scroller.addEventListener('keydown', e => {
                if (e.target !== scroller || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                e.preventDefault();
                if (e.key === 'Home') go(0);
                else if (e.key === 'End') go(maxScroll());
                else step(e.key === 'ArrowRight' ? 1 : -1);
            });
            let lastWheel = 0;
            scroller.addEventListener('wheel', e => {
                if (e.ctrlKey || e.shiftKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)
                    || e.target.closest('.card-scroll, .card-hscroll') !== scroller
                    || e.target.closest('.card-vscroll')) return;
                const direction = Math.sign(e.deltaY);
                if (!direction || maxScroll() <= 1 || (direction < 0 && scroller.scrollLeft <= 2)
                    || (direction > 0 && scroller.scrollLeft >= maxScroll() - 2)) return;
                e.preventDefault();
                if (performance.now() - lastWheel > 180) {
                    step(direction);
                    lastWheel = performance.now();
                }
            }, {passive: false});
            let drag = null, suppressClick = false;
            scroller.addEventListener('pointerdown', e => {
                if (e.pointerType !== 'mouse' || e.button !== 0 || maxScroll() <= 1
                    || e.target.closest('.card-scroll, .card-hscroll') !== scroller
                    || e.target.closest('button, input, textarea, select')
                    || (scroller.classList.contains('card-scroll') && e.target.closest('.card-vscroll'))) return;
                drag = {id: e.pointerId, x: e.clientX, left: scroller.scrollLeft, moved: false};
            });
            scroller.addEventListener('dragstart', e => { if (drag) e.preventDefault(); });
            scroller.addEventListener('pointermove', e => {
                if (!drag || e.pointerId !== drag.id) return;
                const delta = e.clientX - drag.x;
                if (!drag.moved && Math.abs(delta) < 6) return;
                if (!drag.moved) {
                    drag.moved = true;
                    scroller.classList.add('is-dragging');
                    scroller.setPointerCapture(e.pointerId);
                }
                e.preventDefault();
                scroller.scrollLeft = drag.left - delta;
            });
            const endDrag = e => {
                if (!drag || e.pointerId !== drag.id) return;
                suppressClick = drag.moved;
                drag = null;
                scroller.classList.remove('is-dragging');
                if (scroller.hasPointerCapture(e.pointerId)) scroller.releasePointerCapture(e.pointerId);
                setTimeout(() => { suppressClick = false; }, 0);
            };
            scroller.addEventListener('pointerup', endDrag);
            scroller.addEventListener('pointercancel', endDrag);
            scroller.addEventListener('pointerleave', () => { if (drag && !drag.moved) drag = null; });
            scroller.addEventListener('click', e => {
                if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
            }, true);
            scroller.addEventListener('scroll', update, {passive: true});
            window.addEventListener('resize', build);
            window.addEventListener('load', build);
            scroller.addEventListener('sb-refresh', build);
            new ResizeObserver(build).observe(scroller);
            build();
        }

        // Vertical scrollbar for the Steam card
        function attachVScrollbar(scroller) {
            const bar = document.createElement('div');
            bar.className = 'card-scrollbar-v';
            const thumb = document.createElement('div');
            thumb.className = 'card-scrollbar-thumb';
            bar.appendChild(thumb);
            scroller.parentElement.appendChild(bar);

            const update = () => {
                const { scrollHeight, clientHeight, scrollTop } = scroller;
                if (scrollHeight <= clientHeight + 1) { bar.style.display = 'none'; return; }
                bar.style.display = 'block';
                const track = bar.clientHeight;
                const t = Math.max(track * (clientHeight / scrollHeight), 24);
                const maxScroll = scrollHeight - clientHeight;
                const offset = maxScroll > 0 ? (scrollTop / maxScroll) * (track - t) : 0;
                thumb.style.height = t + 'px';
                thumb.style.transform = 'translateY(' + offset + 'px)';
            };

            scroller.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
            window.addEventListener('load', update);
            scroller.addEventListener('sb-refresh', update);
            setTimeout(update, 300);
            update();

            let start = 0, startScroll = 0, dragging = false;
            thumb.addEventListener('pointerdown', e => {
                dragging = true; start = e.clientY; startScroll = scroller.scrollTop;
                thumb.classList.add('dragging'); thumb.setPointerCapture(e.pointerId); e.preventDefault();
            });
            thumb.addEventListener('pointermove', e => {
                if (!dragging) return;
                const maxThumb = bar.clientHeight - thumb.offsetHeight;
                const delta = e.clientY - start;
                scroller.scrollTop = startScroll + (maxThumb > 0 ? (delta / maxThumb) * (scroller.scrollHeight - scroller.clientHeight) : 0);
            });
            const endDrag = () => { dragging = false; thumb.classList.remove('dragging'); };
            thumb.addEventListener('pointerup', endDrag);
            thumb.addEventListener('pointercancel', endDrag);
        }

        document.querySelectorAll('.card-scroll, .card-hscroll').forEach(attachDots);
        document.querySelectorAll('.card-vscroll').forEach(attachVScrollbar);

// Explore answers are sent only to the configured backend.
document.querySelectorAll('.explore-answer').forEach(form => {
    const field = form.elements.answer;
    const status = form.querySelector('.answer-status');
    const button = form.querySelector('button[type="submit"]');
    let sending = false;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (sending) return;
        const answer = field.value.trim();
        if (!answer) {
            status.textContent = 'Add your perspective before sharing.';
            field.focus();
            return;
        }
        const endpoint = window.SITE_CONFIG?.explore.endpoint;
        if (!endpoint) {
            status.textContent = 'Answers aren’t open yet. Please check back soon.';
            return;
        }
        sending = true;
        button.disabled = true;
        field.readOnly = true;
        button.textContent = 'Sharing…';
        status.textContent = '';
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId: form.dataset.questionId, answer })
            });
            if (!response.ok) throw new Error('Answer was not accepted');
            field.value = '';
            status.textContent = 'Thanks for sharing your perspective.';
        } catch (_) {
            status.textContent = 'Couldn’t send your answer. Please try again.';
        } finally {
            sending = false;
            button.disabled = false;
            field.readOnly = false;
            button.textContent = 'Share your perspective';
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    // --- White-Label Hydration ---
    const hydrateUI = () => {
        if (typeof SETTINGS === 'undefined') return;

        document.querySelectorAll('[data-hydrate]').forEach(el => {
            const key = el.dataset.hydrate;
            if (SETTINGS[key]) {
                if (el.tagName === 'TITLE') {
                    document.title = `${SETTINGS[key]} | ${SETTINGS.tagline}`;
                } else if (el.tagName === 'META' && key === 'metaDescription') {
                    el.content = SETTINGS[key];
                } else {
                    el.textContent = SETTINGS[key];
                }
            }
        });

        const root = document.documentElement;
        if (SETTINGS.theme) {
            Object.entries(SETTINGS.theme).forEach(([key, value]) => {
                const varName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                root.style.setProperty(varName, value);
            });
        }
    };

    hydrateUI();

    const menuApp = document.getElementById('menu-app');
    const categoryList = document.getElementById('category-list');

    const storageKey = typeof SETTINGS !== 'undefined' ? SETTINGS.storageKey : 'milsano_lang';
    const defaultLang = typeof SETTINGS !== 'undefined' ? SETTINGS.defaultLang : 'de';
    let currentLang = localStorage.getItem(storageKey) || defaultLang;

    let menuData;
    try {
        const res = await fetch(`./menu.json?t=${Date.now()}`, { cache: 'no-store' });
        menuData = await res.json();
    } catch (e) {
        menuApp.innerHTML = '<p style="text-align:center;color:#888;padding:4rem;">Speisekarte konnte nicht geladen werden.</p>';
        return;
    }

    const renderMenu = (lang) => {
        menuApp.innerHTML = '';
        categoryList.innerHTML = '';

        menuData.categories.forEach((cat) => {
            const catName = cat.name[lang] || cat.name['de'];

            // Ribbon Nav
            const li = document.createElement('li');
            li.innerHTML = `<a href="#${cat.id}">${catName}</a>`;
            categoryList.appendChild(li);

            // Section
            const section = document.createElement('section');
            section.id = cat.id;
            section.className = 'menu-section';
            section.style.scrollMarginTop = '150px';

            let itemsHtml = '';
            cat.items.forEach((item, idx) => {
                const itemName = item.name[lang] || item.name['de'];
                const itemDesc = item.desc ? (item.desc[lang] || item.desc['de']) : '';
                itemsHtml += `
                    <div class="menu-item" style="animation-delay: ${idx * 0.1}s">
                        <div class="item-header">
                            <span class="item-name">${itemName}</span>
                            <span class="item-price">€ ${item.price}</span>
                        </div>
                        ${itemDesc ? `<p class="item-desc">${itemDesc}</p>` : ''}
                    </div>
                `;
            });

            section.innerHTML = `
                <h2 class="section-title">${catName}</h2>
                <div class="items-grid">${itemsHtml}</div>
            `;
            menuApp.appendChild(section);
        });

        // Reveal animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.menu-item').forEach(item => observer.observe(item));

        // Category Highlight & Ribbon Tracking
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    document.querySelectorAll('.ribbon-list a').forEach(a => {
                        const isActive = a.getAttribute('href') === `#${id}`;
                        a.classList.toggle('active', isActive);

                        // Auto-scroll the ribbon to the active item
                        if (isActive) {
                            a.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }
                    });
                }
            });
        }, { rootMargin: '-20% 0px -70% 0px' });

        document.querySelectorAll('.menu-section').forEach(s => navObserver.observe(s));

        attachSmoothScroll();

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    };

    const attachSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (!target) return;

                const headerHeight = document.querySelector('.main-header').offsetHeight;

                window.scrollTo({
                    top: target.offsetTop - headerHeight - 20,
                    behavior: 'smooth'
                });
            });
        });
    };

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem(storageKey, currentLang);
            renderMenu(currentLang);
        });
    });

    renderMenu(currentLang);
});

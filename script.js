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
    const mobileCategoryList = document.getElementById('mobile-category-list');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const closeMobileMenu = document.getElementById('close-mobile-menu');

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
        mobileCategoryList.innerHTML = '';

        menuData.categories.forEach((cat) => {
            const catName = cat.name[lang] || cat.name['de'];

            // Desktop Nav
            const li = document.createElement('li');
            li.innerHTML = `<a href="#${cat.id}">${catName}</a>`;
            categoryList.appendChild(li);

            // Mobile Nav
            const mLi = document.createElement('li');
            mLi.innerHTML = `<a href="#${cat.id}">${catName}</a>`;
            mobileCategoryList.appendChild(mLi);

            // Section
            const section = document.createElement('section');
            section.id = cat.id;
            section.className = 'menu-section';
            section.style.marginBottom = '6rem';
            section.style.scrollMarginTop = '120px';

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

        // Category Highlight
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    document.querySelectorAll('.category-nav a, #mobile-category-list a').forEach(a => {
                        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
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
                mobileMenuOverlay.classList.remove('active');
                document.body.style.overflow = '';

                window.scrollTo({
                    top: target.offsetTop - headerHeight - 20,
                    behavior: 'smooth'
                });
            });
        });
    };

    mobileMenuToggle?.addEventListener('click', () => {
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeMobileMenu?.addEventListener('click', () => {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem(storageKey, currentLang);
            renderMenu(currentLang);
        });
    });

    renderMenu(currentLang);
});

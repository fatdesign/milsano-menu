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
    const menuType = document.body.dataset.menuType || 'mittag';
    const menuFile = menuType === 'abend' ? 'menu-abend.json' : 'menu.json';

    const storageKey = typeof SETTINGS !== 'undefined' ? SETTINGS.storageKey : 'milsano_lang';
    const defaultLang = typeof SETTINGS !== 'undefined' ? SETTINGS.defaultLang : 'de';
    let currentLang = localStorage.getItem(storageKey) || defaultLang;

    // --- Cart State ---
    let cart = JSON.parse(localStorage.getItem('milsano_cart') || '[]');

    const updateCartUI = () => {
        const cartCount = document.getElementById('cart-count');
        const cartToggle = document.getElementById('cart-toggle');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalPrice = document.getElementById('cart-total-price');

        if (!cartCount || !cartToggle || !cartItemsContainer || !cartTotalPrice) return;

        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        cartCount.textContent = totalItems;

        // Always show if items > 0, otherwise hide
        if (totalItems > 0) {
            cartToggle.classList.remove('hidden');
        } else {
            cartToggle.classList.add('hidden');
            document.getElementById('cart-drawer')?.classList.remove('active');
        }

        if (totalItems === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-msg">Deine Liste ist leer.</p>';
            cartTotalPrice.textContent = '€ 0.00';
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = cart.map((item, index) => {
            const itemPrice = parseFloat(item.price.replace(',', '.'));
            total += itemPrice * item.qty;
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-price">€ ${item.price}</span>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="updateCartItem(${index}, -1)">-</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn" onclick="updateCartItem(${index}, 1)">+</button>
                    </div>
                </div>
            `;
        }).join('');

        cartTotalPrice.textContent = `€ ${total.toFixed(2)}`;
        localStorage.setItem('milsano_cart', JSON.stringify(cart));
    };

    window.updateCartItem = (index, delta) => {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) cart.splice(index, 1);
        renderMenu(currentLang);
        updateCartUI();
    };

    window.addToCart = (itemName, itemPrice) => {
        const existing = cart.find(i => i.name === itemName);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ name: itemName, price: itemPrice, qty: 1 });
        }
        renderMenu(currentLang);
        updateCartUI();
    };

    window.removeFromCart = (itemName) => {
        const existing = cart.find(i => i.name === itemName);
        if (existing) {
            existing.qty -= 1;
            if (existing.qty <= 0) {
                cart = cart.filter(i => i.name !== itemName);
            }
        }
        renderMenu(currentLang);
        updateCartUI();
    };

    let menuData;
    try {
        const res = await fetch(`./${menuFile}?t=${Date.now()}`, { cache: 'no-store' });
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
                const cartItem = cart.find(i => i.name === itemName);
                const qty = cartItem ? cartItem.qty : 0;

                itemsHtml += `
                    <div class="menu-item" style="animation-delay: ${idx * 0.1}s">
                        <div class="item-header">
                            <span class="item-name">${itemName}</span>
                            <span class="item-price">€ ${item.price}</span>
                        </div>
                        ${itemDesc ? `<p class="item-desc">${itemDesc}</p>` : ''}
                        
                        <div class="item-actions-row">
                            <div class="qty-controls">
                                <button class="qty-btn" onclick="removeFromCart('${itemName.replace(/'/g, "\\'")}')">-</button>
                                <span class="qty-val">${qty}</span>
                                <button class="qty-btn" onclick="addToCart('${itemName.replace(/'/g, "\\'")}', '${item.price}')">+</button>
                            </div>
                        </div>
                    </div>
                `;
            });

            let dividerHtml = '';
            if (menuApp.children.length > 0) {
                dividerHtml = `
                    <div class="section-divider animate-fade-in">
                        <span class="line"></span>
                        <span class="icon">🔥</span>
                        <span class="line"></span>
                    </div>
                `;
            }

            section.innerHTML = `
                ${dividerHtml}
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
    updateCartUI();

    // Cart Listeners
    const cartDrawer = document.getElementById('cart-drawer');
    const cartToggle = document.getElementById('cart-toggle');
    const closeCart = document.getElementById('close-cart');
    const clearCart = document.getElementById('clear-cart');

    if (cartToggle) cartToggle.onclick = () => cartDrawer.classList.add('active');
    if (closeCart) closeCart.onclick = () => cartDrawer.classList.remove('active');
    if (clearCart) clearCart.onclick = () => {
        if (confirm('Liste wirklich leeren?')) {
            cart = [];
            renderMenu(currentLang);
            updateCartUI();
        }
    };
});

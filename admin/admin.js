// ============================================
// ADMIN PANEL - CORE LOGIC (MILSANO)
// ============================================

let sessionPassword = '';
let menuData = null;
let currentFileSha = null;
let currentMenuFile = 'menu.json'; // Default to lunch menu

// ---- DOM References ----
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const saveBtn = document.getElementById('save-btn');
const saveStatus = document.getElementById('save-status');
const logoutBtn = document.getElementById('logout-btn');
const categoriesContainer = document.getElementById('categories-container');
const addCategoryBtn = document.getElementById('add-category-btn');
const itemModal = document.getElementById('item-modal');
const itemForm = document.getElementById('item-form');
const modalTitle = document.getElementById('modal-title');
const modalCancel = document.getElementById('modal-cancel');
const catModal = document.getElementById('cat-modal');
const catForm = document.getElementById('cat-form');
const catModalCancel = document.getElementById('cat-modal-cancel');

// --- Multi-Menu Switcher ---
const btnMittag = document.getElementById('btn-mittag');
const btnAbend = document.getElementById('btn-abend');

if (btnMittag && btnAbend) {
    btnMittag.onclick = () => switchMenu('menu.json');
    btnAbend.onclick = () => switchMenu('menu-abend.json');
}

async function switchMenu(filename) {
    if (filename === currentMenuFile) return;

    // Check for unsaved changes (simple check)
    // For now we just switch
    currentMenuFile = filename;

    // Update UI active state
    btnMittag.classList.toggle('active', filename === 'menu.json');
    btnAbend.classList.toggle('active', filename === 'menu-abend.json');

    await loadMenu();
}

// --- White-Label Hydration ---
const hydrateAdminUI = () => {
    if (typeof SETTINGS === 'undefined') return;

    document.querySelectorAll('[data-hydrate]').forEach(el => {
        const key = el.dataset.hydrate;
        if (SETTINGS[key]) {
            el.textContent = SETTINGS[key];
        }
    });

    const root = document.documentElement;
    const theme = SETTINGS.theme;
    if (theme) {
        root.style.setProperty('--bg', theme.bgPrimary);
        root.style.setProperty('--bg-header', theme.bgHeader);
        root.style.setProperty('--gold', theme.accentPink);
        root.style.setProperty('--accent-pink', theme.accentPink);
        root.style.setProperty('--text', theme.textPrimary);
        root.style.setProperty('--text-muted', theme.textSecondary);
        root.style.setProperty('--font', theme.fontHeading);
        root.style.setProperty('--font-body', theme.fontBody);
    }
};

hydrateAdminUI();

// ---- Authentication ----
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    loginError.classList.add('hidden');

    sessionPassword = pw;

    try {
        await loadMenu();
        loginScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
    } catch (err) {
        sessionPassword = '';
        if (err.message.includes('401')) {
            loginError.textContent = 'Falsches Passwort.';
        } else {
            loginError.textContent = 'Verbindungsfehler: ' + err.message;
        }
        loginError.classList.remove('hidden');
        document.getElementById('password').value = '';
    } finally {
        submitBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => {
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
    document.getElementById('password').value = '';
    sessionPassword = '';
    menuData = null;
    currentFileSha = null;
});

// ---- API Helper ----
async function proxyRequest(method, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': sessionPassword,
            'X-Menu-File': currentMenuFile
        },
    };
    if (body) options.body = JSON.stringify(body);

    const proxyUrl = typeof SETTINGS !== 'undefined' ? SETTINGS.proxyUrl : '';
    const res = await fetch(proxyUrl, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${res.status}: ${err.error || 'Request failed'}`);
    }
    return res.json();
}

// ---- Load Menu ----
async function loadMenu() {
    categoriesContainer.innerHTML = '<p style="text-align:center;color:#888;padding:3rem;">Lade Speisekarte...</p>';

    try {
        const fileData = await proxyRequest('GET');
        currentFileSha = fileData.sha;
        const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
        menuData = JSON.parse(decoded);
        categoriesContainer.innerHTML = '';
        renderDashboard();
    } catch (err) {
        if (err.message.startsWith('401:')) throw err;

        console.warn('Proxy nicht erreichbar, lade lokale Datei:', currentMenuFile, err.message);
        try {
            const res = await fetch(`../${currentMenuFile}`);
            menuData = await res.json();
            currentFileSha = null;
            categoriesContainer.innerHTML = '';
            showConfigNotice(err.message);
            renderDashboard();
        } catch {
            categoriesContainer.innerHTML = `<div style="text-align:center;padding:3rem;color:#c0392b;"><p>❌ Fehler beim Laden der Speisekarte.</p></div>`;
        }
    }
}

function showConfigNotice(errMsg = '') {
    const notice = document.createElement('div');
    notice.style.background = 'rgba(212, 175, 55, 0.1)';
    notice.style.border = '1px solid var(--gold)';
    notice.style.padding = '1rem';
    notice.style.borderRadius = '8px';
    notice.style.marginBottom = '2rem';
    notice.innerHTML = `
        <p>⚠️ <strong>Lokaler Modus:</strong> Änderungen werden nicht dauerhaft gespeichert (GitHub Proxy erforderlich).</p>
        ${errMsg ? `<p style="font-size: 0.8rem; margin-top: 5px; opacity: 0.8;">Details: ${errMsg}</p>` : ''}
    `;
    categoriesContainer.appendChild(notice);
}

// ---- Render Dashboard ----
function renderDashboard() {
    const notice = categoriesContainer.querySelector('div[style*="gold"]');
    categoriesContainer.innerHTML = '';
    if (notice) categoriesContainer.appendChild(notice);

    menuData.categories.forEach((cat, catIdx) => {
        const block = document.createElement('div');
        block.className = 'category-block';

        const catName = cat.name['de'] || 'N/A';

        block.innerHTML = `
            <div class="category-header">
                <span class="category-name">${catName}</span>
                <div class="category-actions">
                    <button class="btn btn-ghost btn-sm edit-cat-btn" data-cat-idx="${catIdx}">✏️</button>
                    <button class="btn btn-ghost btn-sm delete-cat-btn" data-cat-idx="${catIdx}">🗑</button>
                </div>
            </div>
            <div class="item-list">
                ${cat.items.map((item, itemIdx) => renderItemRow(item, catIdx, itemIdx)).join('')}
            </div>
            <div style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                <button class="btn btn-secondary add-item-btn" data-cat-idx="${catIdx}">+ Gericht</button>
            </div>
        `;
        categoriesContainer.appendChild(block);
    });

    document.querySelectorAll('.add-item-btn').forEach(btn => btn.onclick = () => openItemModal(parseInt(btn.dataset.catIdx)));
    document.querySelectorAll('.edit-item-btn').forEach(btn => btn.onclick = () => openItemModal(parseInt(btn.dataset.catIdx), parseInt(btn.dataset.itemIdx)));
    document.querySelectorAll('.delete-item-btn').forEach(btn => btn.onclick = () => deleteItem(parseInt(btn.dataset.catIdx), parseInt(btn.dataset.itemIdx)));
    document.querySelectorAll('.delete-cat-btn').forEach(btn => btn.onclick = () => deleteCategory(parseInt(btn.dataset.catIdx)));
    document.querySelectorAll('.edit-cat-btn').forEach(btn => btn.onclick = () => openCatModal(parseInt(btn.dataset.catIdx)));
}

function renderItemRow(item, catIdx, itemIdx) {
    const name = item.name['de'] || 'N/A';
    const isSoldOut = item.isSoldOut === true;
    return `
        <div class="item-row ${isSoldOut ? 'is-unavailable' : ''}">
            <div class="item-info">
                <div class="item-row-name">${name} ${isSoldOut ? '<span class="badge-aus">AUS</span>' : ''}</div>
                <div class="item-row-desc">${item.desc?.de || ''}</div>
            </div>
            <div class="item-row-price">€ ${item.price}</div>
            <div class="item-actions">
                <button class="btn-icon edit-item-btn" data-cat-idx="${catIdx}" data-item-idx="${itemIdx}">✏️</button>
                <button class="btn-icon delete-item-btn" data-cat-idx="${catIdx}" data-item-idx="${itemIdx}">🗑</button>
            </div>
        </div>`;
}

// ---- Modals ----
function openItemModal(catIdx, itemIdx = null) {
    document.getElementById('item-cat-id').value = catIdx;
    document.getElementById('item-index').value = itemIdx !== null ? itemIdx : '';
    itemForm.reset();

    if (itemIdx !== null) {
        const item = menuData.categories[catIdx].items[itemIdx];
        modalTitle.textContent = 'Gericht bearbeiten';
        document.getElementById('item-name-de').value = item.name.de || '';
        document.getElementById('item-name-en').value = item.name.en || '';
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-available').checked = item.isSoldOut === true;
        document.getElementById('item-desc-de').value = item.desc?.de || '';
        document.getElementById('item-desc-en').value = item.desc?.en || '';
    } else {
        modalTitle.textContent = 'Gericht hinzufügen';
    }
    itemModal.classList.remove('hidden');
}

modalCancel.onclick = () => itemModal.classList.add('hidden');
itemForm.onsubmit = (e) => {
    e.preventDefault();
    const catIdx = parseInt(document.getElementById('item-cat-id').value);
    const itemIdx = document.getElementById('item-index').value !== '' ? parseInt(document.getElementById('item-index').value) : null;

    const item = {
        name: { de: document.getElementById('item-name-de').value.trim(), en: document.getElementById('item-name-en').value.trim() },
        price: document.getElementById('item-price').value.trim(),
        isSoldOut: document.getElementById('item-available').checked,
        desc: { de: document.getElementById('item-desc-de').value.trim(), en: document.getElementById('item-desc-en').value.trim() }
    };

    if (itemIdx !== null) menuData.categories[catIdx].items[itemIdx] = item;
    else menuData.categories[catIdx].items.push(item);

    itemModal.classList.add('hidden');
    renderDashboard();
};

function deleteItem(catIdx, itemIdx) {
    if (confirm('Gericht wirklich löschen?')) {
        menuData.categories[catIdx].items.splice(itemIdx, 1);
        renderDashboard();
    }
}

function openCatModal(catIdx = null) {
    editingCatIdx = catIdx;
    catForm.reset();
    if (catIdx !== null) {
        document.getElementById('cat-name-de').value = menuData.categories[catIdx].name.de;
        document.getElementById('cat-name-en').value = menuData.categories[catIdx].name.en;
    }
    catModal.classList.remove('hidden');
}

addCategoryBtn.onclick = () => openCatModal();
catModalCancel.onclick = () => catModal.classList.add('hidden');
catForm.onsubmit = (e) => {
    e.preventDefault();
    const name = { de: document.getElementById('cat-name-de').value.trim(), en: document.getElementById('cat-name-en').value.trim() };
    if (editingCatIdx !== null) menuData.categories[editingCatIdx].name = name;
    else menuData.categories.push({ id: name.de.toLowerCase().replace(/\s+/g, '-'), name, items: [] });
    catModal.classList.add('hidden');
    renderDashboard();
};

function deleteCategory(catIdx) {
    if (confirm('Kategorie wirklich löschen?')) {
        menuData.categories.splice(catIdx, 1);
        renderDashboard();
    }
}

// ---- Save ----
saveBtn.onclick = async () => {
    if (!currentFileSha) return alert('Speichern nur im Live-Modus (via Proxy) möglich.');
    saveBtn.disabled = true;
    saveStatus.textContent = 'Speichern...';
    try {
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(menuData, null, 2))));
        const res = await proxyRequest('POST', { content, sha: currentFileSha });
        currentFileSha = res.content.sha;
        saveStatus.textContent = '✓ Gespeichert (in ca. 30s aktuell!)';
        setTimeout(() => saveStatus.textContent = '', 3000);
    } catch (err) {
        saveStatus.textContent = '❌ Fehler';
        alert(err.message);
    } finally {
        saveBtn.disabled = false;
    }
};

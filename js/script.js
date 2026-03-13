// Отримуємо основні елементи
const gridContainer = document.getElementById('guides-grid');
const staticContainer = document.getElementById('static-content');
const modal = document.getElementById('guide-modal');
const modalBody = document.getElementById('modal-body');
const navList = document.getElementById('role-list');
const sidebar = document.querySelector('.sidebar');

// Елементи заголовка та банера
const pageHeader = document.getElementById('page-header');
const pageTitle = document.getElementById('page-title');
const pageDescription = document.getElementById('page-description');

const featuredBanner = document.getElementById('featured-banner');
const bannerChar = document.getElementById('banner-char');
const featuredTitle = document.getElementById('featured-title');
const featuredTextContent = document.getElementById('featured-text-content');
const featuredVisual = document.getElementById('featured-visual');

// === СЕКРЕТНИЙ РЕЖИМ РЕДАГУВАННЯ ===
const EDIT_MODE = false;

if (EDIT_MODE) {
    const exportBtn = document.createElement('button');
    exportBtn.innerHTML = '💾 Скопіювати Data.js';
    exportBtn.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999; padding:15px 25px; background:var(--accent); color:#fff; border:none; border-radius:12px; cursor:pointer; font-size: 1.1rem; font-weight:bold; box-shadow:0 10px 25px rgba(0,0,0,0.5); transition: 0.2s;';

    exportBtn.onmouseover = () => exportBtn.style.transform = 'translateY(-3px)';
    exportBtn.onmouseout = () => exportBtn.style.transform = 'translateY(0)';

    exportBtn.onclick = () => {
        const output = `// Конфігурація ролей
const rolesConfig = ${JSON.stringify(rolesConfig, null, 4)};

// Текст Вступу
const introContentData = ${JSON.stringify(introContentData, null, 4)};

// Масив Гайдів
const guidesData = ${JSON.stringify(guidesData, null, 4)};`;

        navigator.clipboard.writeText(output).then(() => {
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '✅ Скопійовано!';
            exportBtn.style.background = '#23a559';
            setTimeout(() => {
                exportBtn.innerHTML = originalText;
                exportBtn.style.background = 'var(--accent)';
            }, 2500);
        }).catch(err => alert('Помилка копіювання: ' + err));
    };
    document.body.appendChild(exportBtn);
}

function bindEdit(element, dataObj, key) {
    element.contentEditable = true;
    element.style.outline = '2px dashed rgba(88, 101, 242, 0.6)';
    element.style.outlineOffset = '4px';
    element.style.borderRadius = '4px';
    element.onblur = () => dataObj[key] = element.innerHTML;
}
// ===================================

// 1. РЕНДЕР НАВІГАЦІЇ
function renderNav() {
    navList.innerHTML = '';

    for (const [roleKey, roleData] of Object.entries(rolesConfig)) {
        const btn = document.createElement('div');
        btn.className = 'nav-item';
        btn.textContent = roleData.title;

        if (roleData.subroles) {
            btn.classList.add('has-sub');
            const subContainer = document.createElement('div');
            subContainer.className = 'sub-nav-list';

            btn.onclick = () => {
                subContainer.classList.toggle('open');
                btn.classList.toggle('active-parent');
            };

            for (const [subKey, subData] of Object.entries(roleData.subroles)) {
                const subBtn = document.createElement('div');
                subBtn.className = 'nav-item sub-item';
                subBtn.textContent = subData.title;

                subBtn.onclick = (e) => {
                    e.stopPropagation();
                    selectRole(subKey, subBtn, subData.title, subData.desc);
                    toggleMobileMenu(false);
                };
                subContainer.appendChild(subBtn);
            }
            navList.appendChild(btn);
            navList.appendChild(subContainer);
        } else {
            btn.onclick = () => {
                selectRole(roleKey, btn, roleData.title, roleData.desc);
                toggleMobileMenu(false);
            };
            navList.appendChild(btn);
        }
    }

    const firstBtn = navList.querySelector('.nav-item');
    if (firstBtn) {
        selectRole('intro', firstBtn, rolesConfig['intro'].title, rolesConfig['intro'].desc);
    }
}

// 2. ВИБІР РОЛІ ТА ОНОВЛЕННЯ КОНТЕНТУ
function selectRole(roleKey, element, title, desc) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    if (roleKey === 'intro') {
        pageHeader.classList.add('hidden');
        featuredBanner.classList.add('hidden');
        gridContainer.classList.add('hidden');
        staticContainer.classList.remove('hidden');

        renderContent(staticContainer, introContentData);
        triggerMainAnimation();
        return;
    }

    pageHeader.classList.remove('hidden');
    staticContainer.classList.add('hidden');
    gridContainer.classList.remove('hidden');

    pageTitle.textContent = title;
    pageDescription.textContent = desc || '';
    if (desc) pageDescription.classList.remove('hidden');
    else pageDescription.classList.add('hidden');

    let featuredData = null;
    if (rolesConfig[roleKey]?.featured) {
        featuredData = rolesConfig[roleKey].featured;
    } else {
        for (const r of Object.values(rolesConfig)) {
            if (r.subroles?.[roleKey]?.featured) {
                featuredData = r.subroles[roleKey].featured;
                break;
            }
        }
    }

    if (featuredData) {
        pageHeader.classList.add('with-banner');
        bannerChar.src = featuredData.charImg;
        featuredTitle.innerHTML = featuredData.title;
        featuredTextContent.innerHTML = featuredData.text;

        if (EDIT_MODE) {
            bindEdit(featuredTitle, featuredData, 'title');
            bindEdit(featuredTextContent, featuredData, 'text');
        } else {
            featuredTitle.contentEditable = false;
            featuredTextContent.contentEditable = false;
            featuredTitle.style.outline = 'none';
            featuredTextContent.style.outline = 'none';
        }

        featuredVisual.innerHTML = '';
        if (featuredData.visual?.type === 'comparison') {
            const compEl = document.createElement('div');
            compEl.className = 'comparison-container';
            compEl.innerHTML = `
                <div class="comparison-slider">
                    <img src="${featuredData.visual.after}" class="img-after">
                    <img src="${featuredData.visual.before}" class="img-before">
                    <div class="comparison-slider-line"></div>
                    <div class="comparison-slider-button">↔</div>
                </div>
            `;
            featuredVisual.appendChild(compEl);
            initComparisonSlider(compEl);
        }
        featuredBanner.classList.remove('hidden');
    } else {
        pageHeader.classList.remove('with-banner');
        featuredBanner.classList.add('hidden');
    }

    filterGuides(roleKey);
    triggerMainAnimation();
}

// Анімація контенту при зміні ролі
function triggerMainAnimation() {
    const mainContent = document.querySelector('.main-content');
    mainContent.style.animation = 'none';
    void mainContent.offsetHeight; // Рефлоу: примусово перезапускає анімацію
    mainContent.style.animation = 'fadeInSlide 0.4s ease-out forwards';
}

// 3. ФУНКЦІЯ СЛАЙДЕРА ПОРІВНЯННЯ
function initComparisonSlider(container) {
    const slider = container.querySelector('.comparison-slider');
    const beforeImg = container.querySelector('.img-before');
    const line = container.querySelector('.comparison-slider-line');
    const button = container.querySelector('.comparison-slider-button');

    let isDragging = false;

    const updateSlider = (e) => {
        if (!isDragging) return;

        const event = e.touches ? e.touches[0] : e;
        const rect = slider.getBoundingClientRect();
        let x = event.clientX - rect.left;

        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;

        const percentage = (x / rect.width) * 100;

        beforeImg.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
        line.style.left = `${percentage}%`;
        button.style.left = `${percentage}%`;
    };

    slider.addEventListener('mousedown', () => isDragging = true);
    slider.addEventListener('touchstart', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('mousemove', updateSlider);
    window.addEventListener('touchmove', updateSlider);
}

// 4. ФІЛЬТРАЦІЯ ТА РЕНДЕР КАРТОК
function filterGuides(roleKey) {
    const filtered = guidesData.filter(g => g.role === roleKey);
    renderGuides(filtered);
}

// ВИПРАВЛЕНА ФУНКЦІЯ
function renderGuides(guides) {
    gridContainer.innerHTML = '';

    if (guides.length === 0) {
        gridContainer.innerHTML = '<p style="color:var(--text-muted); padding: 20px;">У цьому розділі поки немає окремих гайдів.</p>';
        return;
    }

    guides.forEach(guide => {
        const card = document.createElement('div');
        card.className = 'guide-card';

        // Створюємо картинку окремо, щоб уникнути помилок синтаксису
        let imageHtml = '';
        if (guide.previewImage) {
            imageHtml = `<img src="${guide.previewImage}" alt="${guide.title}" class="card-preview">`;
        }

        card.innerHTML = imageHtml + `
            <div class="card-content-wrap">
                <div class="card-accent-block"></div>
                <div class="card-info">
                    <div class="card-category">${guide.category || 'Мануал'}</div>
                    <h3 class="card-title">${guide.title}</h3>
                    <div class="card-read-more">Читати далі →</div>
                </div>
            </div>
        `;
        card.onclick = () => openModal(guide);
        gridContainer.appendChild(card);
    });
}

// 5. РЕНДЕР КОНТЕНТУ
function renderContent(container, contentArray) {
    container.innerHTML = '';
    contentArray.forEach(item => {
        let el;
        switch (item.type) {
            case 'header':
                el = document.createElement('h1');
                el.innerHTML = item.text;
                if (EDIT_MODE) bindEdit(el, item, 'text');
                break;
            case 'subheader':
                el = document.createElement('h2');
                el.innerHTML = item.text;
                if (EDIT_MODE) bindEdit(el, item, 'text');
                break;
            case 'text':
                el = document.createElement('p');
                el.innerHTML = item.text;
                if (EDIT_MODE) bindEdit(el, item, 'text');
                break;
            case 'info':
                el = document.createElement('div');
                el.className = 'info-block';
                el.innerHTML = item.text;
                if (EDIT_MODE) bindEdit(el, item, 'text');
                break;
            case 'list':
                el = document.createElement('ul');
                item.items.forEach((text, i) => {
                    const li = document.createElement('li');
                    li.innerHTML = text;
                    if (EDIT_MODE) {
                        li.contentEditable = true;
                        li.style.outline = '2px dashed rgba(88, 101, 242, 0.6)';
                        li.onblur = () => item.items[i] = li.innerHTML;
                    }
                    el.appendChild(li);
                });
                break;
            case 'image':
                el = document.createElement('img');
                el.src = item.src;
                el.alt = item.alt || '';
                el.className = 'content-image';
                break;
            case 'comparison':
                el = document.createElement('div');
                el.className = 'comparison-container';
                el.innerHTML = `
                    <div class="comparison-slider">
                        <img src="${item.after}" class="img-after">
                        <img src="${item.before}" class="img-before">
                        <div class="comparison-slider-line"></div>
                        <div class="comparison-slider-button">↔</div>
                    </div>
                `;
                container.appendChild(el);
                initComparisonSlider(el);
                return;
        }
        if (el) container.appendChild(el);
    });
}

// 6. МОДАЛЬНЕ ВІКНО ТА ТЕМА
function openModal(guide) {
    renderContent(modalBody, [{ type: 'header', text: guide.title }, ...guide.content]);

    if (EDIT_MODE) {
        const h1 = modalBody.querySelector('h1');
        if (h1) h1.onblur = () => guide.title = h1.innerHTML;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    // 1. Спочатку додаємо спеціальний клас закриття, який запустить CSS-анімацію
    modal.classList.add('is-closing');

    // 2. Чекаємо 300мс (0.3с), поки програється анімація закриття
    setTimeout(() => {
        // 3. Лише після затримки повністю ховаємо вікно
        modal.classList.add('hidden');
        // 4. І прибираємо клас закриття, щоб наступного разу все спрацювало знову
        modal.classList.remove('is-closing');

        // Повертаємо прокрутку сторінки
        document.body.style.overflow = 'auto';

        // Логіка для режиму редагування (якщо є)
        if (typeof EDIT_MODE !== 'undefined' && EDIT_MODE) {
            const activeItem = document.querySelector('.nav-item.active');
            if (activeItem) activeItem.click();
        }
    }, 300); // Час затримки має збігатися з часом анімації в CSS (0.3s)
}

function toggleMobileMenu(forceState) {
    const isOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.add('open');
    } else {
        sidebar.classList.remove('open');
    }
}

const themeBtn = document.getElementById('theme-btn');
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeBtn.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.classList.add('light-theme');
        themeBtn.textContent = '☀️';
    }
}

window.onload = () => {
    initTheme();
    renderNav();
};
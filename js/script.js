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

// 1. РЕНДЕР НАВІГАЦІЇ
function renderNav() {
    navList.innerHTML = '';

    for (const[roleKey, roleData] of Object.entries(rolesConfig)) {
        const btn = document.createElement('div');
        btn.className = 'nav-item';
        btn.textContent = roleData.title;
        
        if (roleData.subroles) {
            btn.classList.add('has-sub');
            const subContainer = document.createElement('div');
            subContainer.className = 'sub-nav-list hidden';
            
            btn.onclick = () => {
                subContainer.classList.toggle('hidden');
                btn.classList.toggle('active-parent');
            };

            for (const[subKey, subData] of Object.entries(roleData.subroles)) {
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

    // Автоматично відкриваємо Вступ при завантаженні
    const firstBtn = navList.querySelector('.nav-item');
    if (firstBtn) {
        selectRole('intro', firstBtn, rolesConfig['intro'].title, rolesConfig['intro'].desc);
    }
}

// 2. ВИБІР РОЛІ ТА ОНОВЛЕННЯ КОНТЕНТУ
function selectRole(roleKey, element, title, desc) {
    // Підсвітка активного пункту
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if(element) element.classList.add('active');

    if (roleKey === 'intro') {
        pageHeader.classList.add('hidden');
        featuredBanner.classList.add('hidden');
        gridContainer.classList.add('hidden');
        staticContainer.classList.remove('hidden');
        
        renderContent(staticContainer, introContentData);
        return; 
    }

    pageHeader.classList.remove('hidden');
    staticContainer.classList.add('hidden');
    gridContainer.classList.remove('hidden');

    pageTitle.textContent = title;
    pageDescription.textContent = desc || '';
    if(desc) pageDescription.classList.remove('hidden');
    else pageDescription.classList.add('hidden');
    
    // Шукаємо дані для банера (featured)
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

    // Якщо є банер - рендеримо його і зсуваємо заголовок
    if (featuredData) {
        pageHeader.classList.add('with-banner'); 
        bannerChar.src = featuredData.charImg;
        featuredTitle.textContent = featuredData.title;
        featuredTextContent.innerHTML = featuredData.text;
        
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

function renderGuides(guides) {
    gridContainer.innerHTML = '';
    
    if (guides.length === 0) {
        gridContainer.innerHTML = '<p style="color:var(--text-muted); padding: 20px;">У цьому розділі поки немає окремих гайдів.</p>';
        return;
    }

    guides.forEach(guide => {
        const card = document.createElement('div');
        card.className = 'guide-card';
        card.innerHTML = `
            <div class="card-accent-block"></div>
            <div class="card-info">
                <div class="card-category">${guide.category || 'Мануал'}</div>
                <h3 class="card-title">${guide.title}</h3>
                <div class="card-read-more">Читати далі →</div>
            </div>
        `;
        card.onclick = () => openModal(guide);
        gridContainer.appendChild(card);
    });
}

// 5. РЕНДЕР КОНТЕНТУ (Для вступу та модалки)
function renderContent(container, contentArray) {
    container.innerHTML = '';
    contentArray.forEach(item => {
        let el;
        switch (item.type) {
            case 'header':
                el = document.createElement('h1');
                el.textContent = item.text;
                break;
            case 'subheader':
                el = document.createElement('h2');
                el.textContent = item.text;
                break;
            case 'text':
                el = document.createElement('p');
                el.innerHTML = item.text;
                break;
            case 'info':
                el = document.createElement('div');
                el.className = 'info-block';
                el.innerHTML = item.text;
                break;
            case 'list':
                el = document.createElement('ul');
                item.items.forEach(text => {
                    const li = document.createElement('li');
                    li.innerHTML = text;
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
    renderContent(modalBody,[{ type: 'header', text: guide.title }, ...guide.content]);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
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
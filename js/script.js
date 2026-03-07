// js/script.js

// Отримуємо елементи
const gridContainer = document.getElementById('guides-grid');
const staticContainer = document.getElementById('static-content');
const modal = document.getElementById('guide-modal');
const modalBody = document.getElementById('modal-body');
const navList = document.getElementById('role-list');
const pageTitle = document.getElementById('page-title');
const sidebar = document.querySelector('.sidebar'); // Для мобільного меню

// Логіка слайдера (залишаємо як було)
function initComparisonSlider(container) {
    // ... (код функції initComparisonSlider, який я давав раніше)
    const slider = container.querySelector('.comparison-slider-line');
    const beforeImg = container.querySelector('.img-before');
    const move = (e) => {
        let x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const rect = container.getBoundingClientRect();
        let position = ((x - rect.left) / rect.width) * 100;
        if (position < 0) position = 0;
        if (position > 100) position = 100;
        slider.style.left = position + '%';
        beforeImg.style.clipPath = `inset(0 ${100 - position}% 0 0)`;
    };
    const stopDrag = () => {
        window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchmove', move); window.removeEventListener('touchend', stopDrag);
    };
    const startDrag = (e) => {
        e.preventDefault();
        window.addEventListener('mousemove', move); window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchmove', move); window.addEventListener('touchend', stopDrag);
    };
    slider.addEventListener('mousedown', startDrag);
    slider.addEventListener('touchstart', startDrag, { passive: false });
}

// 1. РЕНДЕР НАВІГАЦІЇ
function renderNav() {
    const guidesRoles = [...new Set(guidesData.map(g => g.role))];
    const availableRoles = ['intro', ...guidesRoles];

    availableRoles.forEach(roleKey => {
        const btn = document.createElement('div');
        btn.className = 'nav-item';
        btn.textContent = rolesConfig[roleKey] || roleKey;
        
        // ПРАВКА ДЛЯ МОБІЛЬНИХ: Закриваємо меню після кліку
        btn.onclick = () => {
            selectRole(roleKey, btn);
            toggleMobileMenu(false); // Закрити меню
        };

        if (roleKey === 'intro') {
            // Не викликаємо selectRole тут одразу, щоб не було конфліктів при старті
            btn.classList.add('active'); 
        }
        navList.appendChild(btn);
    });

    // Старт
    const firstBtn = navList.firstChild;
    if (firstBtn) selectRole('intro', firstBtn);
}

// 2. ВИБІР РОЛІ
function selectRole(roleKey, btnElement) {
    if (roleKey === 'intro') {
        pageTitle.style.display = 'none';
    } else {
        pageTitle.style.display = 'block';
        pageTitle.textContent = rolesConfig[roleKey];
    }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    else {
        const btns = document.querySelectorAll('.nav-item');
        btns.forEach(b => {
            if(b.textContent === rolesConfig[roleKey]) b.classList.add('active');
        });
    }

    if (roleKey === 'intro') {
        gridContainer.classList.add('hidden'); 
        staticContainer.classList.remove('hidden');
        renderContent(staticContainer, introContentData);
    } else {
        staticContainer.classList.add('hidden');
        gridContainer.classList.remove('hidden');
        const roleGuides = guidesData.filter(g => g.role === roleKey);
        renderGrid(roleGuides);
    }
}

// 3. РЕНДЕР СІТКИ
function renderGrid(guides) {
    gridContainer.innerHTML = '';
    guides.forEach(guide => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openGuide(guide);

        const imgHtml = guide.previewImage 
            ? `<img src="${guide.previewImage}" alt="${guide.title}" onerror="this.style.display='none'">` 
            : `<div class="card-placeholder"></div>`;

        card.innerHTML = `
            <div class="card-image">${imgHtml}</div>
            <div class="card-content">
                <h3 class="card-title">${guide.title}</h3>
                <span class="card-tag">${guide.category}</span>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

// 4. КОНТЕНТ (Оновлена версія з Image Fix)
function renderContent(container, contentArray) {
    container.innerHTML = ''; 
    contentArray.forEach(block => {
        let element;
        if (block.type === 'header') {
            element = document.createElement('h1'); element.textContent = block.text;
        } else if (block.type === 'subheader') {
            element = document.createElement('h2'); element.textContent = block.text;
        } else if (block.type === 'text') {
            element = document.createElement('p'); element.innerHTML = block.text;
        } else if (block.type === 'info') {
            element = document.createElement('div'); element.className = 'info-box'; element.textContent = block.text;
        } else if (block.type === 'list') {
            element = document.createElement('ul');
            block.items.forEach(item => { const li = document.createElement('li'); li.innerHTML = item; element.appendChild(li); });
        } else if (block.type === 'image') {
            element = document.createElement('img');
            element.src = block.src;
            element.className = 'guide-img';
            element.onerror = function() { this.src = "https://placehold.co/600x300?text=Зображення"; };
        } else if (block.type === 'comparison') {
            const wrap = document.createElement('div');
            wrap.className = 'comparison-container';
            const imgAfter = block.after ? block.after : "https://placehold.co/600x300?text=After";
            const imgBefore = block.before ? block.before : "https://placehold.co/600x300?text=Before";
            wrap.innerHTML = `
                    <img src="${imgAfter}" class="comparison-img img-after">
                    <img src="${imgBefore}" class="comparison-img img-before">
                    <div class="comparison-slider-line"></div>
                `;
            element = wrap;
            setTimeout(() => initComparisonSlider(wrap), 100);
        } else if (block.type === 'spacer') {
            element = document.createElement('div');
            element.style.height = (block.height || 20) + 'px'; 
        }

        if (element) container.appendChild(element);
    });
}

// 5. МОДАЛКА
function openGuide(guide) {
    renderContent(modalBody, guide.content);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

modal.onclick = (e) => {
    if (e.target === modal) closeModal();
}

// 6. МОБІЛЬНЕ МЕНЮ (Функції)
function toggleMobileMenu(forceState) {
    // Якщо передано true/false, використовуємо це, інакше просто перемикаємо
    const isOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('open');
    
    if (isOpen) {
        sidebar.classList.add('open');
        document.body.style.overflow = 'hidden'; // Блокуємо прокрутку фону
    } else {
        sidebar.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
}

// Запуск
renderNav();

// ==========================================
// ЛОГІКА ЗМІНИ ТЕМИ
// ==========================================

const themeBtn = document.getElementById('theme-btn');
const body = document.body;

// 1. Функція перемикання
function toggleTheme() {
    body.classList.toggle('light-theme');
    
    // Перевіряємо, яка тема активна зараз, щоб змінити іконку
    const isLight = body.classList.contains('light-theme');
    
    // Змінюємо іконку: Місяць (для темної) <-> Сонце (для світлої)
    themeBtn.textContent = isLight ? '☀️' : '🌙';
    
    // Зберігаємо вибір у пам'ять браузера
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// 2. Перевірка при завантаженні сторінки
// (Цей код запускається сам, коли ти відкриваєш сайт)
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeBtn.textContent = '☀️';
    } else {
        body.classList.remove('light-theme');
        themeBtn.textContent = '🌙';
    }
}

// Запускаємо перевірку теми
initTheme();
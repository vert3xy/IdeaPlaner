    const statusMap = {
        'new': { label: 'НОВОЕ', color: 'bg-sky-500' },
        'planned': { label: 'В ПЛАНАХ', color: 'bg-amber-500' },
        'done': { label: 'ГОТОВО', color: 'bg-emerald-500' },
        'rejected': { label: 'ОТКЛОНЕНО', color: 'bg-rose-500' }
    };

        function showDetail(idea) {
            const content = document.getElementById('detailContent');
            const delPlaceholder = document.getElementById('detailDeletePlaceholder');
            
            // 1. Сначала подготавливаем данные (перевод и цвет)
            const s = statusMap[idea.status] || { label: idea.status, color: 'bg-slate-800' };
            
            let attrHtml = '';
            for (const [key, value] of Object.entries(idea.attributes)) {
                attrHtml += `
                    <div class="flex justify-between py-3 border-b border-slate-100">
                        <span class="text-slate-500 font-medium">${formatKey(key)}</span>
                        <span class="text-slate-900 font-semibold text-right ml-4">${value}</span>
                    </div>`;
            }

            // 2. Теперь вставляем уже готовые переменные в HTML
            content.innerHTML = `
                <div class="mb-6">
                    <div class="flex justify-between items-start mb-6 pr-10">
                        <span class="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-full uppercase italic">
                            ${idea.idea_type}
                        </span>
                        
                        <div class="flex items-center space-x-4">
                            <button onclick="deleteIdea(${idea.id}); closeDetail();" 
                                    class="text-slate-300 hover:text-rose-500 transition-colors p-1">
                                <i class="fa-solid fa-trash-can text-lg"></i>
                            </button>
                            
                            <button onclick="openStatusModal(${idea.id}, '${idea.status}')" 
                                    class="min-w-[130px] px-4 py-2.5 ${s.color} text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:brightness-110 transition-all shadow-md">
                                ${s.label} <i class="fa-solid fa-chevron-down ml-2 text-[8px] opacity-70"></i>
                            </button>
                        </div>
                    </div>
                    <h2 class="text-3xl font-bold text-slate-800 leading-tight">${idea.title}</h2>
                    <p class="text-slate-600 mt-4 text-lg leading-relaxed">${idea.description || 'Описание отсутствует'}</p>
                </div>
                <div class="bg-slate-50 rounded-2xl p-6">
                    <h4 class="text-sm font-bold text-slate-400 uppercase mb-4 tracking-widest text-center">Детали идеи</h4>
                    ${attrHtml}
                </div>
            `;
            

            document.getElementById('detailModal').classList.remove('hidden');
        }

        function closeDetail() {
            document.getElementById('detailModal').classList.add('hidden');
        }

        function formatKey(key) {
            const dictionary = {
                subcategory: 'Тип',
                location_type: 'Локация',
                rating_user_own: 'Моя оценка',
                
                genre: 'Жанр',
                theme: 'Тема',
                year_release: 'Год выхода',
                premiere_year: 'Год премьеры',
                duration: 'Длительность',
                wishlist_price: 'Стоимость',
                platforms: 'Платформы',
                players_count: 'Кол-во игроков',
                director: 'Режиссер',
                developer: 'Разработчик',
                artist: 'Исполнитель',

                exhibit_name: 'Название выставки',
                collection_name: 'Коллекция',
                artist_name: 'Автор/Художник',
                historical_period: 'Период',
                educational_value: 'Ценность',
                admission_fee: 'Входной билет',

                cuisine: 'Кухня',
                dish_recommendation: 'Что заказать',
                atmosphere: 'Атмосфера',
                price_level: 'Уровень цен',
                dietary_options: 'Особенности',
                is_new_place: 'Новое место',

                activity: 'Активность',
                difficulty: 'Сложность',
                duration_estimated: 'Примерное время',
                equipment_needed: 'Нужна экипировка',
                weather_dependency: 'Зависит от погоды',

                specific_item: 'Предмет/Название',
                mood_type: 'Настроение',
                participants_needed: 'Участников',
                materials_needed: 'Что подготовить',

                destination_type: 'Тип места',
                destination_name: 'Куда',
                duration_days: 'Сколько дней',
                budget_estimated: 'Бюджет',
                transport_type: 'Транспорт',
                accommodation_type: 'Жилье',
                must_see_places: 'Что посмотреть',

                recipient: 'Кому',
                occasion: 'Повод',
                gift_category: 'Вид подарка',
                budget_limit: 'Бюджет до',
                is_surprise: 'Сюрприз?',
                personal_note: 'Заметка',

                skill_to_learn: 'Навык',
                learning_format: 'Формат',
                source_recommendation: 'Источник',
                time_commitment: 'Временные затраты',
                learning_goal: 'Цель'
            };
            return dictionary[key] || key.replace('_', ' ');
        }
        
        let allCurrentIdeas = []; // Глобальное хранилище для фильтрации в браузере

    async function loadUser() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const user = await res.json();
                const display = document.getElementById('userNameDisplay');
                if (display) display.innerText = `Привет, ${user.username}!`;
            }
        } catch (e) {
            console.error("Ошибка загрузки профиля");
        }
    }

// 1. ГЛАВНАЯ ФУНКЦИЯ: Загрузка категории с сервера
async function loadIdeas(type = '') {
    // Подсветка активной основной вкладки
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-type') === type) {
            btn.className = "filter-btn px-6 py-2 bg-rose-500 text-white rounded-full shadow-md whitespace-nowrap transition-all";
        } else {
            btn.className = "filter-btn px-5 py-2 bg-white text-slate-600 rounded-full border border-slate-100 whitespace-nowrap hover:bg-rose-50 transition-all";
        }
    });

    const token = localStorage.getItem('token');
    const url = type ? `/ideas?idea_type=${encodeURIComponent(type)}&limit=100` : '/ideas?limit=100';
    
    try {
        const response = await fetch(url, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        
        allCurrentIdeas = await response.json();
        
        // Показываем суб-фильтры только если выбрана конкретная категория
        if (type) {
            renderSubFilters(allCurrentIdeas);
        } else {
            document.getElementById('subFiltersWrapper').classList.add('hidden');
        }

        renderCards(allCurrentIdeas);
        
    } catch (error) {
        console.error("Ошибка загрузки:", error);
    }

}

// 2. ФУНКЦИЯ ПОСТРОЕНИЯ СУБ-ФИЛЬТРОВ
function renderSubFilters(ideas) {
    const wrapper = document.getElementById('subFiltersWrapper');
    const container = document.getElementById('subFiltersContainer');
    
    // Собираем уникальные значения из поля subcategory внутри attributes
    const subcategories = [...new Set(ideas.map(i => i.attributes.subcategory).filter(Boolean))];

    if (subcategories.length > 0) {
        wrapper.classList.remove('hidden');
        container.innerHTML = `
            <button onclick="filterBySub('')" class="sub-btn px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg uppercase transition-all">Все</button>
            ${subcategories.map(sub => `
                <button onclick="filterBySub('${sub}')" class="sub-btn px-3 py-1 bg-white text-slate-500 border border-slate-200 text-[10px] font-bold rounded-lg uppercase hover:border-rose-300 transition-all">
                    ${sub}
                </button>
            `).join('')}
        `;
    } else {
        wrapper.classList.add('hidden');
    }
}

// 3. ФУНКЦИЯ ФИЛЬТРАЦИИ (срабатывает при клике на суб-фильтр)
function filterBySub(sub) {
    // Подсветка кнопок суб-фильтра
    document.querySelectorAll('.sub-btn').forEach(btn => {
        if (btn.innerText.toLowerCase() === (sub || 'все').toLowerCase()) {
            btn.className = "sub-btn px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg uppercase transition-all";
        } else {
            btn.className = "sub-btn px-3 py-1 bg-white text-slate-500 border border-slate-200 text-[10px] font-bold rounded-lg uppercase hover:border-rose-300 transition-all";
        }
    });

    // Фильтруем данные из памяти, не дергая сервер
    const filtered = sub 
        ? allCurrentIdeas.filter(i => i.attributes.subcategory === sub)
        : allCurrentIdeas;
    
    renderCards(filtered);
}

// 4. ФУНКЦИЯ ОТРИСОВКИ КАРТОЧЕК
function renderCards(ideas) {
    const grid = document.getElementById('ideasGrid');
    grid.innerHTML = '';

    if (ideas.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-slate-400">Пока здесь ничего нет... 💡</div>';
        return;
    }

    ideas.forEach(idea => {
        const card = document.createElement('div');
        card.className = "cursor-pointer bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group";
        card.onclick = () => showDetail(idea);

        const s = statusMap[idea.status] || { label: idea.status, color: 'bg-slate-500' };

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                    ${idea.idea_type}
                </span>
                
                <div class="flex items-center space-x-2">
                    <button onclick="event.stopPropagation(); openStatusModal(${idea.id}, '${idea.status}', event)" 
                            class="px-2.5 py-1 ${s.color} text-white text-[9px] font-black rounded-lg uppercase tracking-tighter hover:scale-105 transition shadow-sm">
                        ${s.label}
                    </button>
                    
                    <button onclick="event.stopPropagation(); deleteIdea(${idea.id})" 
                            class="text-slate-200 hover:text-rose-500 transition opacity-100 p-1">
                        <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                </div>
            </div>
            
            <h3 class="text-lg font-bold text-slate-800 mb-2 leading-tight">${idea.title}</h3>
            <p class="text-slate-500 text-xs mb-4 line-clamp-3">${idea.description || 'Нет описания'}</p>
            
            <div class="flex items-center text-rose-500 text-[10px] font-bold uppercase tracking-wider mt-auto">
                <span>Подробнее</span>
                <i class="fa-solid fa-arrow-right ml-2 transition-transform group-hover:translate-x-1"></i>
            </div>
        `;
        grid.appendChild(card);
    });
}

        
        async function changeStatus(id, newStatus) {
            const token = localStorage.getItem('token');
            const response = await fetch(`/ideas/${id}/status`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updatedIdea = await response.json();
                // Сразу обновляем контент в открытой модалке, чтобы не закрывать её
                showDetail(updatedIdea); 
                // Обновляем список на фоне
                loadIdeas(); 
            }
        }

        async function cycleStatus(id, currentStatus) {
            const statuses = ['new', 'planned', 'done', 'rejected'];
            let nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
            const newStatus = statuses[nextIndex];
            
            // Используем уже созданную ранее функцию changeStatus
            await changeStatus(id, newStatus);
        }

        let currentActiveId = null; // Для хранения ID идеи при смене статуса

        function openStatusModal(id, currentStatus, event) {
            if (event) event.stopPropagation(); // Не открывать деталку
            currentActiveId = id;
            const container = document.getElementById('statusOptions');
            const statuses = ['new', 'planned', 'done', 'rejected'];
            
            container.innerHTML = Object.entries(statusMap).map(([key, val]) => `
                <button onclick="applyStatusChange('${key}')" 
                        class="w-full py-3 rounded-xl font-bold text-sm transition-all
                        ${currentStatus === key ? val.color + ' text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}">
                    ${val.label}
                </button>
            `).join('');

            
            document.getElementById('statusModal').classList.remove('hidden');
        }

        function closeStatusModal() {
            document.getElementById('statusModal').classList.add('hidden');
        }

        async function applyStatusChange(newStatus) {
            await changeStatus(currentActiveId, newStatus);
            closeStatusModal();
        }

        
        // Логика модалки и формы
        function openModal() { document.getElementById('modal').classList.remove('hidden'); renderAttributes(); }
        function closeModal() { document.getElementById('modal').classList.add('hidden'); }

        function renderAttributes() {
            const type = document.getElementById('formType').value;
            const container = document.getElementById('dynamicAttrs');
            
            const configs = {
                'Entertainment': [['subcategory', 'Тип (Кино/Игра...)'], ['genre', 'Жанр'], ['director', 'Режиссер/Автор'], ['location_type', 'Место']],
                'Culture': [['subcategory', 'Тип (Музей/Выставка)'], ['artist_name', 'Имя автора'], ['admission_fee', 'Цена билета']],
                'Food & Drink': [['subcategory', 'Тип'], ['cuisine', 'Кухня'], ['dish_recommendation', 'Что заказать'], ['price_level', 'Уровень цен (1-4)']],
                'Active Recreation': [['subcategory', 'Вид спорта'], ['difficulty', 'Сложность'], ['equipment_needed', 'Что взять с собой']],
                'Home Leisure': [['subcategory', 'Чем займемся'], ['specific_item', 'Название (фильм/книга)'], ['materials_needed', 'Что купить']],
                'Travel': [['destination_name', 'Куда'], ['duration_days', 'Дней'], ['transport_type', 'Транспорт'], ['budget_estimated', 'Бюджет']],
                'Gifts & Surprises': [['recipient', 'Кому'], ['occasion', 'Повод'], ['gift_category', 'Тип (Впечатление/Вещь)']],
                'Learning / Development': [['subcategory', 'Формат'], ['skill_to_learn', 'Навык'], ['time_commitment', 'Сколько времени']]
            };

            container.innerHTML = (configs[type] || [['subcategory', 'Тип']]).map(field => `
                <div class="space-y-1">
                    <label class="text-[10px] text-slate-400 ml-2 uppercase font-bold">${field[1]}</label>
                    <input type="text" data-key="${field[0]}" placeholder="${field[1]}" class="attr-input w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-rose-400 text-sm">
                </div>
            `).join('');
        }

        document.getElementById('addForm').onsubmit = async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            const attributes = {};
            document.querySelectorAll('.attr-input').forEach(el => attributes[el.dataset.key] = el.value);

            const payload = {
                title: document.getElementById('formTitle').value,
                description: document.getElementById('formDesc').value,
                idea_type: document.getElementById('formType').value,
                attributes: attributes
            };

            const res = await fetch('/ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) { closeModal(); loadIdeas(); e.target.reset(); }
        };

        
        
        async function deleteIdea(id) {
            if (!confirm('Удалить эту идею?')) return;
            const token = localStorage.getItem('token');
            await fetch(`/ideas/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            loadIdeas();
        }

        function logout() { localStorage.removeItem('token'); window.location.href = '/login'; }

        loadIdeas();
        loadUser();
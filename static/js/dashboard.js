    const statusMap = {
        'new': { label: 'НОВОЕ', color: 'bg-sky-500' },
        'planned': { label: 'В ПЛАНАХ', color: 'bg-amber-500' },
        'done': { label: 'ГОТОВО', color: 'bg-emerald-500' },
        'rejected': { label: 'ОТКЛОНЕНО', color: 'bg-rose-500' }
    };
    let categoriesData = [];
    
async function initFilters() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/categories', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (!response.ok) throw new Error("Не удалось загрузить категории");

        // 1. Сохраняем данные глобально, чтобы функция renderAttributes могла их использовать
        categoriesData = await response.json(); 

        // --- БЛОК 1: ВЕРХНИЕ КНОПКИ-ФИЛЬТРЫ ---
        const container = document.getElementById('categoryFilters');
        
        // Сохраняем кнопку "Все"
        const allBtn = container.querySelector('[data-id=""]');
        container.innerHTML = ''; // Полная очистка
        if (allBtn) container.appendChild(allBtn);

        categoriesData.forEach(cat => {
            const btn = document.createElement('button');
            btn.setAttribute('data-id', cat.id); // Теперь работаем по ID базы
            btn.className = "filter-btn px-5 py-2 bg-white text-slate-600 rounded-full border border-slate-100 whitespace-nowrap hover:bg-rose-50 transition-all";
            btn.onclick = () => loadIdeas(cat.id);
            btn.innerHTML = `${cat.icon} ${cat.label}`;
            container.appendChild(btn);
        });

        // --- БЛОК 2: ВЫПАДАЮЩИЙ СПИСОК В ФОРМЕ ДОБАВЛЕНИЯ ---
        const formSelect = document.getElementById('formType');
        if (formSelect) {
            // Заполняем select категориями из базы
            formSelect.innerHTML = categoriesData.map(cat => `
                <option value="${cat.id}">${cat.icon} ${cat.label}</option>
            `).join('');

            // Сразу вызываем отрисовку полей для первой категории в списке
            renderAttributes(); 
        }

    } catch (error) {
        console.error("Критическая ошибка в initFilters:", error);
    }
}

function formatValue(value) {
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    return value;
}

function showDetail(idea) {
    const content = document.getElementById('detailContent');
    if (!content) return;

    const s = statusMap[idea.status] || { label: idea.status, color: 'bg-slate-800' };
    
    let attrHtml = '';
    // Проверяем, есть ли вообще атрибуты в идее
    if (idea.attributes) {
        for (const [key, value] of Object.entries(idea.attributes)) {
            // Безопасный поиск метки (label)
            let label = key;
            if (idea.category_ref && idea.category_ref.linked_attributes) {
                const attrMetadata = idea.category_ref.linked_attributes.find(a => a.name === key);
                if (attrMetadata) label = attrMetadata.label;
            }

            attrHtml += `
                <div class="flex justify-between py-3 border-b border-slate-100">
                    <span class="text-slate-500 font-medium">${label}</span>
                    <span class="text-slate-900 font-semibold text-right ml-4">
                        ${formatValue(value)}
                    </span>
                </div>`;
        }
    }

    content.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-start mb-6 pr-10">
                <span class="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-full uppercase italic">
                    ${idea.category_ref ? idea.category_ref.icon + ' ' + idea.category_ref.label : 'Без категории'}
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
            ${attrHtml || '<p class="text-center text-slate-400 text-xs">Нет дополнительных деталей</p>'}
        </div>
    `;
    document.getElementById('detailModal').classList.remove('hidden');
}


        function closeDetail() {
            document.getElementById('detailModal').classList.add('hidden');
        }
      
let allCurrentIdeas = [];

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

async function loadIdeas(categoryId = null) {
    // Подсветка кнопок по data-id
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const btnId = btn.getAttribute('data-id');
        if ((!categoryId && !btnId) || (btnId == categoryId)) {
            btn.className = "filter-btn px-6 py-2 bg-rose-500 text-white rounded-full shadow-md whitespace-nowrap transition-all";
        } else {
            btn.className = "filter-btn px-5 py-2 bg-white text-slate-600 rounded-full border border-slate-100 whitespace-nowrap hover:bg-rose-50 transition-all";
        }
    });

    const token = localStorage.getItem('token');
    // Формируем URL с category_id вместо idea_type
    let url = `/ideas/?limit=100`;
    if (categoryId) url += `&category_id=${categoryId}`;

    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    allCurrentIdeas = await response.json();

     if (categoryId) {
        // 1. Запрашиваем "Конфиг фильтров" для этой категории
        const res = await fetch(`/categories/${categoryId}/filters`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const config = await res.json();
        
        // 2. Рисуем фильтры на основе полученного конфига
        renderDynamicFilters(config);
    } else {
        document.getElementById('subFiltersWrapper').classList.add('hidden');
    }

    renderCards(allCurrentIdeas);
}

function renderDynamicFilters(config) {
    const wrapper = document.getElementById('subFiltersWrapper');
    const container = document.getElementById('subFiltersContainer');
    
    wrapper.classList.remove('hidden');
    container.innerHTML = ''; // Очищаем старое

    config.dynamic_filters.forEach(filter => {
        const filterBlock = document.createElement('div');
        filterBlock.className = "flex flex-col space-y-1 min-w-[120px]";
        
        filterBlock.innerHTML = `
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">${filter.label}</span>
            <select onchange="applyFilters('${filter.name}', this.value)" 
                    class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:ring-2 focus:ring-rose-400 outline-none transition-all">
                <option value="">Все</option>
                ${filter.values.map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
        `;
        container.appendChild(filterBlock);
    });
}

async function applyGlobalFilter(paramName, value) {
    const filtered = value 
        ? allCurrentIdeas.filter(i => i.attributes[paramName] == value)
        : allCurrentIdeas;
    
    renderCards(filtered);
}

let activeFilters = {};

function applyFilters(attrName, value) {
    // 1. Обновляем состояние фильтров
    if (value === "") {
        delete activeFilters[attrName]; // Если выбрали "Все", удаляем фильтр
    } else {
        activeFilters[attrName] = value;
    }

    // 2. Берем все идеи текущей категории и прогоняем через все фильтры сразу
    let filtered = allCurrentIdeas;

    Object.entries(activeFilters).forEach(([key, val]) => {
        filtered = filtered.filter(idea => {
            // Ищем либо в основных полях (status), либо в JSON (attributes)
            const ideaValue = idea[key] || (idea.attributes ? idea.attributes[key] : null);
            return String(ideaValue) === String(val);
        });
    });

    // 3. Рисуем результат
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
                    ${idea.category_ref.icon} ${idea.category_ref.label}
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
    const selectedId = document.getElementById('formType').value;
    const container = document.getElementById('dynamicAttrs');
    
    // Находим нужную категорию в сохраненных данных
    const category = categoriesData.find(c => c.id == selectedId);
    
    if (!category || !category.linked_attributes) {
        container.innerHTML = '';
        return;
    }

    // Рисуем поля на основе того, что пришло из БД
    container.innerHTML = category.linked_attributes.map(attr => `
        <div class="space-y-1">
            <label class="text-[10px] text-slate-400 ml-2 uppercase font-bold">${attr.label}</label>
            <input type="text" data-key="${attr.name}" placeholder="${attr.label}" 
                   class="attr-input w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-rose-400 text-sm">
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
        category_id: parseInt(document.getElementById('formType').value), // Передаем ID
        attributes: attributes
    };

    const res = await fetch('/ideas/', { // Проверь слэш в конце
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

async function startApp() {
    await loadUser();    
    await initFilters(); 
    await loadIdeas();  
}

startApp();

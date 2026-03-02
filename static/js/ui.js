import { statusMap, formatValue, escapeHTML } from './utils.js';

export const UI = {
    currentViewMode: 'grid', 

    renderCards(ideas, categoriesData) {
        const grid = document.getElementById('ideasGrid');
        if (!grid) return;
        grid.innerHTML = '';

        // Если идей нет, выводим красивое пустое состояние
        if (ideas.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <div class="text-4xl mb-4">💡</div>
                    <p class="text-slate-400 font-medium">В этой категории пока нет идей...</p>
                </div>
            `;
            return;
        }

        // Перебираем идеи, используя индекс для порядкового номера
        ideas.forEach((idea, index) => {
            const card = document.createElement('div');
            
            // Находим данные категории и статуса
            const cat = categoriesData.find(c => Number(c.id) === Number(idea.category_id)) || {};
            const s = statusMap[idea.status] || { label: idea.status, color: 'bg-slate-500' };

            // Порядковый номер (начинаем с 1)
            const orderNumber = index + 1;

            // Основные классы карточки (стиль плитки по умолчанию)
            card.className = "idea-card cursor-pointer bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all relative group flex flex-col";
            
            // Атрибуты для системы событий (делегирование)
            card.dataset.action = 'showDetail';
            card.dataset.id = idea.id;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                        <span class="cat-label">${cat.icon || '💡'} ${cat.label || 'Идея'}</span>
                    </span>
                    <button data-action="openStatus" data-id="${idea.id}" data-status="${idea.status}" 
                            class="px-2.5 py-1 ${s.color} text-white text-[9px] font-black rounded-lg uppercase tracking-tighter">
                        ${s.label}
                    </button>
                </div>

                <div class="flex items-center mb-2">
                    <span class="idea-index-badge">${orderNumber}</span>
                    <h3 class="text-lg font-bold text-slate-800 leading-tight group-hover:text-rose-500 transition-colors">
                        ${escapeHTML(idea.title)}
                    </h3>
                </div>

                <p class="text-slate-500 text-xs mb-4 line-clamp-3 leading-relaxed">
                    ${escapeHTML(idea.description) || 'Нет описания'}
                </p>
                <div class="flex items-center text-rose-500 text-[10px] font-black uppercase tracking-wider mt-auto pt-2">
                    <span>Подробнее</span>
                    <i class="fa-solid fa-arrow-right ml-2 transition-transform group-hover:translate-x-1"></i>
                </div>
            `;

            grid.appendChild(card);
        });
    },

    showDetail(idea, categoriesData) {
        const content = document.getElementById('sideDetailContent');
        const shell = document.getElementById('appShell');
        if (!content || !shell) return;

        document.querySelectorAll('.idea-card').forEach(c => c.classList.remove('is-active'));
        document.querySelector(`.idea-card[data-id="${idea.id}"]`)?.classList.add('is-active');

        const cat = categoriesData.find(c => Number(c.id) === Number(idea.category_id)) || {};
        const s = statusMap[idea.status] || { label: idea.status, color: 'bg-slate-800' };

        const attrHtml = (idea.attributes && cat.linked_attributes) ? cat.linked_attributes.map(attr => {
            const val = idea.attributes[attr.name];
            if (!val) return '';
            return `
                <div class="attr-row">
                    <span class="attr-label">${attr.label}</span>
                    <span class="attr-value">${escapeHTML(formatValue(val))}</span>
                </div>`;
        }).join('') : '';

        content.innerHTML = `
            <div class="animate-fadeIn max-w-5xl">
                <div class="detail-header flex justify-between items-start">
                    <div>
                        <div class="flex items-center space-x-2 mb-4">
                            <span class="text-xs font-bold text-rose-500 uppercase tracking-widest">${cat.icon} ${cat.label}</span>
                            <span class="text-[10px] text-slate-300 font-bold uppercase">#${idea.id}</span>
                        </div>
                        <h2 class="text-4xl font-black text-slate-900 leading-tight mb-4">${escapeHTML(idea.title)}</h2>
                        <div class="flex items-center space-x-3">
                            <span class="px-3 py-1 ${s.color} text-white text-[10px] font-bold rounded-full uppercase tracking-wider">${s.label}</span>
                            <button data-action="openStatus" data-id="${idea.id}" data-status="${idea.status}" class="text-slate-400 hover:text-rose-500 text-xs font-bold transition">Изменить</button>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <button data-action="delete" data-id="${idea.id}" class="text-slate-200 hover:text-rose-500 transition"><i class="fa-solid fa-trash-can text-xl"></i></button>
                        <button data-action="CloseSidePane" class="text-slate-300 hover:text-slate-600 transition"><i class="fa-solid fa-xmark text-3xl"></i></button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div class="lg:col-span-2">
                        <div class="description-text">
                            "${escapeHTML(idea.description) || 'Описания нет...'}"
                        </div>
                        
                        <div class="mt-12 p-10 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 hover:bg-rose-50 transition-all cursor-pointer group">
                            <i class="fa-solid fa-image text-4xl mb-4"></i>
                            <span class="text-[10px] font-black uppercase">Нажмите, чтобы добавить изображение</span>
                        </div>
                    </div>

                    <div class="lg:col-span-1">
                        <h4 class="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Параметры</h4>
                        <div class="mb-10">
                            ${attrHtml || '<p class="text-slate-400 text-sm italic">Нет данных</p>'}
                        </div>

                        <div class="pt-8 border-t border-slate-100">
                            <h4 class="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Метаданные</h4>
                            <div class="space-y-3 text-[11px]">
                                <div class="flex justify-between"><span class="text-slate-400 font-bold uppercase">Автор</span><span class="font-bold text-slate-700">admin</span></div>
                                <div class="flex justify-between"><span class="text-slate-400 font-bold uppercase">Создано</span><span class="font-bold text-slate-700">${new Date(idea.created_at || Date.now()).toLocaleDateString()}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        shell.classList.add('is-detailed');
    },

    closeSidePane() {
        const shell = document.getElementById('appShell');
        if (shell) {
            shell.classList.remove('is-detailed');
        }
        document.querySelectorAll('.idea-card').forEach(c => c.classList.remove('is-active'));
    },

    renderDynamicFilters(config) {
        const wrapper = document.getElementById('subFiltersWrapper');
        const container = document.getElementById('subFiltersContainer');
        if (!wrapper || !container) return;

        wrapper.classList.remove('hidden');
        container.innerHTML = '';

        config.dynamic_filters.forEach(filter => {
            const filterBlock = document.createElement('div');
            filterBlock.className = "flex flex-col space-y-1 min-w-[120px]";
            filterBlock.innerHTML = `
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">${filter.label}</span>
                <select data-action="filterChange" data-filter-name="${filter.name}" 
                        class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:ring-2 focus:ring-rose-400 outline-none transition-all">
                    <option value="">Все</option>
                    ${filter.values.map(v => `<option value="${v}">${v}</option>`).join('')}
                </select>
            `;
            container.appendChild(filterBlock);
        });
    },

    openStatusModal(id, currentStatus, event) {
        if (event) event.stopPropagation();
        const container = document.getElementById('statusOptions');
        if (!container) return;

        container.innerHTML = Object.entries(statusMap).map(([key, val]) => `
            <button data-action="selectStatus" data-status-key="${key}"  
                class="w-full py-3 rounded-xl font-bold text-sm transition-all
                ${currentStatus === key ? val.color + ' text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}">
                ${val.label}
            </button>
        `).join('');

        this.toggleModal('statusModal', true);
    },

    renderAttributes(categories) {
        const selectedId = document.getElementById('formType').value;
        const container = document.getElementById('dynamicAttrs');
        if (!container) return;

        const category = categories.find(c => c.id == selectedId);
        if (!category || !category.linked_attributes) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = category.linked_attributes.map(attr => `
            <div class="space-y-1">
                <label class="text-[10px] text-slate-400 ml-2 uppercase font-bold">${attr.label}</label>
                <input type="text" data-key="${attr.name}" placeholder="${escapeHTML(attr.label)}" 
                    class="attr-input w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-rose-400 text-sm">
            </div>
        `).join('');
    },

    initCategoryInterface(categories) {
        const filterContainer = document.getElementById('categoryFilters');
        if (filterContainer) {
            const allBtn = filterContainer.querySelector('[data-id=""]');
            filterContainer.innerHTML = '';
            if (allBtn) filterContainer.appendChild(allBtn);

            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.setAttribute('data-id', cat.id);
                btn.className = "filter-btn px-5 py-2 bg-white text-slate-600 rounded-full border border-slate-100 whitespace-nowrap hover:bg-rose-50 transition-all";
                btn.innerHTML = `${cat.icon} ${cat.label}`;
                filterContainer.appendChild(btn);
            });
        }

        const formSelect = document.getElementById('formType');
        if (formSelect && categories.length > 0) {
            formSelect.innerHTML = categories.map(cat => `
                <option value="${cat.id}">${cat.icon} ${cat.label}</option>
            `).join('');

            this.renderAttributes(categories);
        } else {
            console.warn("Элемент 'formType' не найден в HTML или список категорий пуст.");
        }
    },

    updateActiveCategoryBtn(categoryId) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const btnId = btn.getAttribute('data-id');
            const isActive = (!categoryId && !btnId) || (String(btnId) === String(categoryId));

            if (isActive) {
                btn.className = "filter-btn px-6 py-2 bg-rose-500 text-white rounded-full shadow-md whitespace-nowrap transition-all border-none ring-0";
            } else {
                btn.className = "filter-btn px-6 py-2 bg-white text-slate-600 rounded-full border border-slate-100 whitespace-nowrap hover:bg-rose-50 transition-all";
            }
        });
    },

    toggleModal(id, show = true) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.toggle('hidden', !show);
    },

    closeDetail() { this.toggleModal('detailModal', false); },
    closeStatusModal() { this.toggleModal('statusModal', false); },
    hideSubFilters() {
        const wrapper = document.getElementById('subFiltersWrapper');
        if (wrapper) wrapper.classList.add('hidden');
    }
};
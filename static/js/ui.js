import { statusMap, formatValue, escapeHTML } from './utils.js';

export const UI = {
    currentViewMode: 'grid',
    currentActiveId: null,  

    renderCards(ideas, categoriesData) {
        const grid = document.getElementById('ideasGrid');
        if (!grid) return;
        grid.classList.remove('view-transition');
        const mode = window.innerWidth < 1024 ? 'grid' : this.currentViewMode;
        grid.className = mode === 'list' ? 'view-list' : '';

        void grid.offsetWidth; 
        grid.classList.add('view-transition');
        grid.innerHTML = '';
        this.updateViewButtons(mode);

        ideas.forEach((idea, index) => {
            const card = document.createElement('div');
            const cat = categoriesData.find(c => Number(c.id) === Number(idea.category_id)) || {};
            const s = statusMap[idea.status] || { label: idea.status };
            
            const isActive = String(idea.id) === String(this.currentActiveId);
            const orderNumber = index + 1;

            card.className = `idea-card ${isActive ? 'is-active' : ''}`;
            card.dataset.action = 'showDetail';
            card.dataset.id = idea.id;

            card.innerHTML = `
                <!-- Блок только для ГРИДА -->
                <div class="grid-only flex justify-between items-start mb-4">
                    <div class="cat-tag-pill">
                        <span>${cat.icon || '💡'}</span>
                        <span>${cat.label}</span>
                    </div>
                    <span class="status-pill ${idea.status.toLowerCase()}">${s.label}</span>
                </div>

                <!-- Блок ЗАГОЛОВКА (Работает и в гриде, и в сайдбаре) -->
                <div class="card-header-main flex items-center">
                    <div class="indicator-container">
                        <span class="indicator-icon">${cat.icon || '💡'}</span>
                        <span class="indicator-number">${orderNumber}</span>
                    </div>
                    <h3 class="card-title">${escapeHTML(idea.title)}</h3>
                </div>

                <!-- Блок ОПИСАНИЯ (Скрывается в сайдбаре) -->
                <p class="card-desc">${escapeHTML(idea.description) || 'Описания пока нет...'}</p>
                
                <!-- ФУТЕР (Скрывается в сайдбаре) -->
                <div class="card-footer mt-auto flex justify-between items-center pt-4">
                    <span class="text-[10px] font-bold text-slate-300 tracking-widest">#${idea.id}</span>
                    <div class="go-arrow">
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    updateViewButtons(mode) {
        const gridBtn = document.getElementById('setViewGrid');
        const listBtn = document.getElementById('setViewList');
        
        if (!gridBtn || !listBtn) return;

        [gridBtn, listBtn].forEach(btn => {
            btn.classList.remove('text-rose-500', 'bg-white', 'shadow-sm');
            btn.classList.add('text-slate-300');
        });

        const activeBtn = mode === 'grid' ? gridBtn : listBtn;
        activeBtn.classList.add('text-rose-500', 'bg-white', 'shadow-sm');
        activeBtn.classList.remove('text-slate-300');
    },

    showDetail(idea, categoriesData) {
        this.currentActiveId = idea.id;
        const isMobile = window.innerWidth < 1024;
        const targetContainerId = isMobile ? 'detailContent' : 'sideDetailContent';
        const container = document.getElementById(targetContainerId);
        const shell = document.getElementById('appShell');
        
        if (!container) return;

        document.querySelectorAll('.idea-card').forEach(c => c.classList.remove('is-active'));
        document.querySelector(`.idea-card[data-id="${idea.id}"]`)?.classList.add('is-active');
        

        const cat = categoriesData.find(c => Number(c.id) === Number(idea.category_id)) || {};
        const s = statusMap[idea.status] || { label: idea.status, color: 'bg-slate-800' };

        const attrHtml = (idea.attributes && cat.linked_attributes) ? cat.linked_attributes.map(attr => {
            const val = idea.attributes[attr.name];
            if (!val) return '';
            return `<div class="flex justify-between items-center text-[10px] font-bold uppercase">
                        <span class="text-slate-400 tracking-wider">${attr.label}</span>
                        <span class="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">${escapeHTML(formatValue(val))}</span>
                    </div>`
        }).join('') : '';

        container.innerHTML = `
            <div class="animate-fadeIn max-w-6xl mx-auto">
                <div class="mb-8 pb-6 border-b border-slate-100">
                    
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center space-x-2">
                            <span class="text-[10px] font-bold text-rose-500 uppercase tracking-widest px-2 py-1 bg-rose-50 rounded-md">
                                ${cat.icon} ${cat.label}
                            </span>
                            <span class="text-[10px] text-slate-300 font-bold uppercase tracking-widest">#${idea.id}</span>
                        </div>
                        
                        <div class="flex items-center space-x-1">
                            <button data-action="delete" data-id="${idea.id}" 
                                    class="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                                <i class="fa-solid fa-trash-can text-base"></i>
                            </button>
                            <button data-action="CloseSidePane" 
                                    class="w-11 h-11 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition">
                                <i class="fa-solid fa-xmark text-xl" style="pointer-events: none;"></i>
                            </button>
                        </div>
                    </div>

                    <h2 class="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-5">
                        ${escapeHTML(idea.title)}
                    </h2>

                    <div class="flex items-center space-x-3">
                        <span class="px-3 py-1 ${s.color} text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                            ${s.label}
                        </span>
                        <button data-action="openStatus" data-id="${idea.id}" data-status="${idea.status}" 
                                class="text-slate-400 hover:text-rose-500 text-[10px] font-bold uppercase tracking-widest transition">
                            Изменить статус
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
                    
                    <div class="lg:col-span-2 space-y-10">
                        <div class="description-text">
                            "${escapeHTML(idea.description) || 'Описания нет...'}"
                        </div>
                        
                        <div class="p-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 hover:bg-rose-50/30 transition-all cursor-pointer group">
                            <i class="fa-solid fa-image text-4xl mb-3"></i>
                            <span class="text-[9px] font-black uppercase tracking-widest">Добавить изображение</span>
                        </div>
                    </div>

                    <div class="space-y-10">
                        <section>
                            <h4 class="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
                                <span class="w-6 h-[1px] bg-rose-500 mr-2"></span> Параметры
                            </h4>
                            <div class="space-y-3">${attrHtml || '<p class="text-slate-400 text-xs italic">Нет данных</p>'}</div>
                        </section>

                        <section class="pt-8 border-t border-slate-100">
                            <h4 class="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
                                <span class="w-6 h-[1px] bg-slate-200 mr-2"></span> Метаданные
                            </h4>
                            <div class="space-y-3 text-[10px] font-bold uppercase">
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-400 tracking-wider">Автор</span>
                                    <span class="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">${idea.author ? idea.author.username : 'system'}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-400 tracking-wider">Создано</span>
                                    <span class="text-slate-600">${new Date(idea.created_at).toLocaleDateString('ru-RU', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    })}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        `;

        if (isMobile) {
            shell.classList.remove('is-detailed');
            this.toggleModal('detailModal', true);
        } else {
            shell.classList.add('is-detailed');
            this.toggleModal('detailModal', false);
        }
    },

    closeSidePane() {
        const shell = document.getElementById('appShell');
        if (shell) {
            shell.classList.remove('is-detailed');
        }
        document.querySelectorAll('.idea-card').forEach(c => c.classList.remove('is-active'));
    },

    renderDynamicFilters(config) {
        const commonContainer = document.getElementById('commonFiltersContainer');
        const dynamicContainer = document.getElementById('subFiltersContainer');
        const dynamicWrapper = document.getElementById('subFiltersContainerWrapper');

        if (!commonContainer || !dynamicContainer) return;

        // Очистка
        commonContainer.innerHTML = '';
        dynamicContainer.innerHTML = '';

        if (!config) {
            dynamicWrapper?.classList.add('hidden');
            return;
        }

        const createSelect = (filter, isCommon = false) => {
            let options = `<option value="">Все</option>`;
            
            if (filter.name === 'created_at' || filter.type === 'date') {
                return `
                    <div class="flex flex-col space-y-2">
                        <label class="text-[10px] font-bold text-slate-400 ml-2 uppercase tracking-wider">${filter.label}</label>
                        <select name="sort" data-type="sort" class="filter-input bg-slate-50 border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-rose-400 outline-none">
                            <option value="new">Сначала новые</option>
                            <option value="old">Сначала старые</option>
                        </select>
                    </div>`;
            }

            if (filter.values) {
                options += filter.values.map(v => {
                    let displayLabel = v;
                    if (filter.name === 'status' && statusMap[v]) {
                        const rawLabel = statusMap[v].label;
                        displayLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase();
                    }
                    
                    return `<option value="${v}">${displayLabel}</option>`;
                }).join('');
            }

            return `
                <div class="flex flex-col space-y-2">
                    <label class="text-[10px] font-bold text-slate-400 ml-2 uppercase tracking-wider">${filter.label}</label>
                    <div class="relative">
                        <select name="${filter.name}" data-type="${isCommon ? 'common' : 'attribute'}" 
                                class="filter-input w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-rose-400 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
                            ${options}
                        </select>
                    </div>
                </div>`;
        };


        if (config.common_filters) {
            config.common_filters.forEach(f => {
                commonContainer.insertAdjacentHTML('beforeend', createSelect(f, true));
            });
        }

        if (config.dynamic_filters && config.dynamic_filters.length > 0) {
            dynamicWrapper.classList.remove('hidden');
            config.dynamic_filters.forEach(f => {
                dynamicContainer.insertAdjacentHTML('beforeend', createSelect(f, false));
            });
        } else {
            dynamicWrapper.classList.add('hidden');
        }
    },


    openStatusModal(id, currentStatus, event) {
        if (event) event.stopPropagation();
        const container = document.getElementById('statusOptions');
        if (!container) return;

        container.innerHTML = Object.entries(statusMap).map(([key, val]) => {
            const isActive = currentStatus === key;
            return `
                <button data-action="selectStatus" data-status-key="${key}"  
                    class="w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group
                    ${isActive 
                        ? val.color + ' text-white shadow-lg scale-[1.02]' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}">
                    
                    <span class="uppercase tracking-wider">${val.label}</span>
                    
                    ${isActive 
                        ? '<i class="fa-solid fa-check text-white"></i>' 
                        : '<i class="fa-solid fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>'}
                </button>
            `;
        }).join('');

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
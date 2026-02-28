import { statusMap, formatValue, escapeHTML } from './utils.js';

export const UI = {
    renderCards(ideas, categoriesData) {
        const grid = document.getElementById('ideasGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (ideas.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-20 text-slate-400">Пока здесь ничего нет... 💡</div>';
            return;
        }

        ideas.forEach(idea => {
            const card = document.createElement('div');
            card.className = "idea-card cursor-pointer bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all relative group";
            
            card.dataset.action = 'showDetail';
            card.dataset.id = idea.id;  

            const s = statusMap[idea.status] || { label: idea.status, color: 'bg-slate-500' };
            const cat = categoriesData.find(c => Number(c.id) === Number(idea.category_id)) || {};

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                        ${cat.icon || '💡'} ${cat.label || 'Идея'}
                    </span>
                    
                    <div class="flex items-center space-x-2">
                        <button data-action="openStatus" data-id="${idea.id}" data-status="${idea.status}"  
                                class="px-2.5 py-1 ${s.color} text-white text-[9px] font-black rounded-lg uppercase tracking-tighter hover:scale-105 transition shadow-sm">
                            ${s.label}
                        </button>
                        
                        <button data-action="delete" data-id="${idea.id}" 
                                class="text-slate-200 hover:text-rose-500 transition opacity-100 p-1">
                            <i class="fa-solid fa-trash-can text-sm"></i>
                        </button>
                    </div>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2 leading-tight">${escapeHTML(idea.title)}</h3>
                <p class="text-slate-500 text-xs mb-4 line-clamp-3">${escapeHTML(idea.description) || 'Описание отсутствует'}</p>
                <div class="flex items-center text-rose-500 text-[10px] font-bold uppercase tracking-wider mt-auto">
                    <span>Подробнее</span>
                    <i class="fa-solid fa-arrow-right ml-2 transition-transform group-hover:translate-x-1"></i>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    showDetail(idea, categoriesData) {
        const content = document.getElementById('detailContent');
        if (!content) return;

        const catInfo = categoriesData.find(c => Number(c.id) === Number(idea.category_id));
        
        const s = statusMap[idea.status] || { label: idea.status, color: 'bg-slate-800' };
        
        let attrHtml = '';
        if (idea.attributes && catInfo && catInfo.linked_attributes) {
            for (const [key, value] of Object.entries(idea.attributes)) {
                const attrMetadata = catInfo.linked_attributes.find(a => a.name === key);
                const label = attrMetadata ? attrMetadata.label : key;

                attrHtml += `
                    <div class="flex justify-between py-3 border-b border-slate-100">
                        <span class="text-slate-500 font-medium">${escapeHTML(label)}</span>
                        <span class="text-slate-900 font-semibold text-right ml-4">
                            ${escapeHTML(formatValue(value))}
                        </span>
                    </div>`;
            }
        }

        content.innerHTML = `
            <div class="mb-6">
                <div class="flex justify-between items-start mb-6 pr-10">
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-full uppercase italic">
                        ${catInfo ? catInfo.icon + ' ' + catInfo.label : 'Без категории'}
                    </span>
                    
                    <div class="flex items-center space-x-4">
                        <button data-action="delete" data-id="${idea.id}"
                                class="text-slate-300 hover:text-rose-500 transition-colors p-1">
                            <i class="fa-solid fa-trash-can text-lg"></i>
                        </button>
                        
                        <button data-action="openStatus" data-id="${idea.id}" data-status="${idea.status}"
                                class="min-w-[130px] px-4 py-2.5 ${s.color} text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:brightness-110 transition-all shadow-md">
                            ${s.label} <i class="fa-solid fa-chevron-down ml-2 text-[8px] opacity-70"></i>
                        </button>
                    </div>
                </div>
                <h2 class="text-3xl font-bold text-slate-800 leading-tight">${escapeHTML(idea.title)}</h2>
                <p class="text-slate-600 mt-4 text-lg leading-relaxed">${escapeHTML(idea.description) || 'Описание отсутствует'}</p>
            </div>
            <div class="bg-slate-50 rounded-2xl p-6">
                <h4 class="text-sm font-bold text-slate-400 uppercase mb-4 tracking-widest text-center">Детали идеи</h4>
                ${attrHtml || '<p class="text-center text-slate-400 text-xs">Нет дополнительных деталей</p>'}
            </div>
        `;
        this.toggleModal('detailModal', true);
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
                <input type="text" data-key="${attr.name}" placeholder="${attr.label}" 
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
            const isActive = (!categoryId && !btnId) || (btnId == categoryId);
            btn.classList.toggle('bg-rose-500', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('shadow-md', isActive);
            btn.classList.toggle('bg-white', !isActive);
            btn.classList.toggle('text-slate-600', !isActive);
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
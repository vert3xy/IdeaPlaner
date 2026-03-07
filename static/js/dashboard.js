import { API } from './api.js';
import { UI } from './ui.js';
import { initEventListeners } from './events.js';

let categoriesData = [];  
let allCurrentIdeas = []; 
let currentCategoryId = null;
let currentActiveId = null;
let activeFilters = {};

export const Actions = {
    async handleLoadCategory(categoryId = null, force = false) {
        if (!force && allCurrentIdeas.length > 0 && String(categoryId) === String(currentCategoryId)) {
            return;
        }

        activeFilters = {};
        currentCategoryId = categoryId;
        UI.updateActiveCategoryBtn(categoryId);

        try {
            allCurrentIdeas = await API.fetchIdeas(categoryId); 

            const filterId = categoryId || 'all'; 
            const config = await API.fetchCategoryFilters(filterId);
            
            UI.renderDynamicFilters(config); 

            UI.renderCards(allCurrentIdeas, categoriesData);
        } catch (error) {
            console.error("Ошибка при загрузке:", error);
        }
    },


    applyFilters() {
        let filtered = [...allCurrentIdeas];
        const inputs = document.querySelectorAll('.filter-input');
        
        let sortOrder = 'new';

        inputs.forEach(input => {
            const val = input.value;
            const name = input.name;
            const type = input.dataset.type;

            if (!val && type !== 'sort') return;

            if (type === 'sort') {
                sortOrder = val;
            } 
            else if (type === 'common') {
                if (name === 'author') {
                    filtered = filtered.filter(i => i.author && i.author.username === val);
                } else {
                    filtered = filtered.filter(i => String(i[name]) === String(val));
                }
            } 
            else if (type === 'attribute') {
                filtered = filtered.filter(i => i.attributes && String(i.attributes[name]) === String(val));
            }
        });

        filtered.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return sortOrder === 'new' ? dateB - dateA : dateA - dateB;
        });

        UI.renderCards(filtered, categoriesData);
    },


    async handleDelete(id) {
        if (!confirm('Удалить эту идею?')) return;
        try {
            await API.deleteIdea(id);
            UI.closeDetail();
            await Actions.handleLoadCategory(currentCategoryId, true);
            console.log("Список обновлен после удаления");
        } catch (e) { 
            console.error(e);
            alert("Ошибка при удалении: " + e.message); 
        }
    },

    handleOpenStatus(button, event) {
        currentActiveId = button.dataset.id;
        UI.openStatusModal(currentActiveId, button.dataset.status, event);
    },

    async handleApplyStatus(newStatus) {
        try {
            const updated = await API.changeStatus(currentActiveId, newStatus);
            if (updated) {
                UI.showDetail(updated, categoriesData);
                UI.closeStatusModal();
                await Actions.handleLoadCategory(currentCategoryId, true);
            }
        } catch (e) { alert(e.message); }
    },

    handleShowDetail(id) {
        const idea = allCurrentIdeas.find(i => String(i.id) === String(id));
        if (idea) {
            UI.showDetail(idea, categoriesData);
        }
    },

    handleCloseDetail() {
        const shell = document.getElementById('appShell');
        if (shell) shell.classList.remove('is-detailed');
        
        document.querySelectorAll('.idea-card').forEach(c => c.classList.remove('is-active'));
        
        const modal = document.getElementById('detailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        UI.toggleModal('modal', false);
    },


    async handleSaveIdea(event) {
        event.preventDefault();
        const form = event.target;
        
        const attributes = {};
        form.querySelectorAll('.attr-input').forEach(el => {
            attributes[el.dataset.key] = el.value;
        });

        const payload = {
            title: form.querySelector('#formTitle').value,
            description: form.querySelector('#formDesc').value,
            category_id: parseInt(form.querySelector('#formType').value),
            attributes: attributes
        };

        try {
            const newIdea = await API.saveIdea(payload);
            if (newIdea) {
                UI.toggleModal('modal', false);
                form.reset();
                await Actions.handleLoadCategory(currentCategoryId, true);
            }
        } catch (e) { alert(e.message); }
    },

    handleOpenAddModal() {
        UI.toggleModal('modal', true);
        UI.renderAttributes(categoriesData);
    },


    handleLogout: () => API.logout(),
    handleCloseModal: () => UI.toggleModal('modal', false),
    handleCloseStatus: () => UI.closeStatusModal(),
    handleFormTypeChange: () => UI.renderAttributes(categoriesData)
};

async function startApp() {
    try {
        const user = await API.fetchMe();
        const display = document.getElementById('userNameDisplay');
        if (user && display) display.innerText = `Привет, ${user.username}!`;

        categoriesData = await API.fetchCategories(); 
        UI.initCategoryInterface(categoriesData);
        
        initEventListeners();
        
        await Actions.handleLoadCategory(null);

    } catch (error) {
        if (error.message === "UNAUTHORIZED") {
            localStorage.removeItem('token'); 
            window.location.href = '/login';  
        } else {
            console.error("Критическая ошибка старта:", error);
        }
    }
}

startApp();
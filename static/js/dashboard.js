import { API } from './api.js';
import { UI } from './ui.js';
import { initEventListeners } from './events.js';

let categoriesData = [];  
let allCurrentIdeas = []; 
let currentCategoryId = null;
let currentActiveId = null;
let activeFilters = {};

export const Actions = {
    async handleLoadCategory(categoryId = null) {
        activeFilters = {};
        currentCategoryId = categoryId;
        
        UI.updateActiveCategoryBtn(categoryId);

        try {
            allCurrentIdeas = await API.fetchIdeas(categoryId); 

            if (categoryId) {
                const config = await API.fetchCategoryFilters(categoryId);
                UI.renderDynamicFilters(config);
            } else {
                UI.hideSubFilters();
            }

            UI.renderCards(allCurrentIdeas, categoriesData);
        } catch (error) {
            console.error("Ошибка загрузки идей:", error);
        }
    },

    async handleDelete(id) {
        if (!confirm('Удалить эту идею?')) return;
        try {
            await API.deleteIdea(id);
            UI.closeDetail();
            await this.handleLoadCategory(currentCategoryId);
        } catch (e) { alert(e.message); }
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
                await this.handleLoadCategory(currentCategoryId);
            }
        } catch (e) { alert(e.message); }
    },

    handleShowDetail(id) {
        const idea = allCurrentIdeas.find(i => String(i.id) === String(id));
        if (idea) UI.showDetail(idea, categoriesData);
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
                await this.handleLoadCategory(currentCategoryId);
            }
        } catch (e) { alert(e.message); }
    },

    handleLogout: () => API.logout(),
    handleCloseDetail: () => UI.toggleModal('detailModal', false),
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
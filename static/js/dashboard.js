import { API } from './api.js';
import { UI } from './ui.js';

window.categoriesData = [];   
window.allCurrentIdeas = []; 
window.currentCategoryId = null;
window.currentActiveId = null; 

async function startApp() {
    try {
        const user = await API.fetchMe();
        if (user) {
            const display = document.getElementById('userNameDisplay');
            if (display) display.innerText = `Привет, ${user.username}!`;
        }

        window.categoriesData = await API.fetchCategories();
        
        UI.initCategoryInterface(window.categoriesData);
        
        await loadIdeas();

    } catch (error) {
        console.error("Ошибка при запуске приложения:", error);
    }
}

async function loadIdeas(categoryId = null) {
    window.currentCategoryId = categoryId;
    
    UI.updateActiveCategoryBtn(categoryId);

    window.allCurrentIdeas = await API.fetchIdeas(categoryId);

    if (categoryId) {
        const config = await API.fetchCategoryFilters(categoryId);
        UI.renderDynamicFilters(config);
    } else {
        UI.hideSubFilters();
    }

    UI.renderCards(window.allCurrentIdeas, window.categoriesData);
}

document.getElementById('addForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const attributes = {};
    document.querySelectorAll('.attr-input').forEach(el => {
        attributes[el.dataset.key] = el.value;
    });

    const payload = {
        title: document.getElementById('formTitle').value,
        description: document.getElementById('formDesc').value,
        category_id: parseInt(document.getElementById('formType').value),
        attributes: attributes
    };

    const res = await API.saveIdea(payload);

    if (res.ok) {
        UI.toggleModal('modal', false);
        await loadIdeas(window.currentCategoryId);
        e.target.reset();
    } else {
        alert("Ошибка при сохранении идеи");
    }
};

window.loadIdeas = loadIdeas;
window.openModal = () => UI.toggleModal('modal', true);
window.closeModal = () => UI.toggleModal('modal', false);
window.showDetail = (idea) => UI.showDetail(idea, window.categoriesData);
window.closeDetail = () => UI.closeDetail();
window.logout = () => API.logout();

window.deleteIdea = async (id) => {
    if (!confirm('Удалить эту идею?')) return;
    const res = await API.deleteIdea(id);
    if (res.ok) {
        UI.closeDetail();
        await loadIdeas(window.currentCategoryId);
    }
};

window.applyStatusChange = async (newStatus) => {
    const res = await API.changeStatus(window.currentActiveId, newStatus);
    if (res.ok) {
        const updatedIdea = await res.json();
        UI.showDetail(updatedIdea);
        UI.closeStatusModal();
        await loadIdeas(window.currentCategoryId);
    }
};

window.openStatusModal = (id, status, event) => {
    window.currentActiveId = id;
    UI.openStatusModal(id, status, event);
};
window.closeStatusModal = () => UI.closeStatusModal();

startApp();
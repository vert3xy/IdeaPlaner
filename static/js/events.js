import { Actions } from './dashboard.js';

export function initEventListeners() {
    const ideasGrid = document.getElementById('ideasGrid');
    if (ideasGrid) {
        ideasGrid.addEventListener('click', (event) => {
            const element = event.target.closest('[data-action]');
            if (!element) return;

            const action = element.dataset.action;
            const id = element.dataset.id;

            if (action === 'delete') {
                event.stopPropagation();
                Actions.handleDelete(id);
            } 
            else if (action === 'openStatus') {
                event.stopPropagation();
                Actions.handleOpenStatus(element, event);
            } 
            else if (action === 'showDetail') {
                Actions.handleShowDetail(id);
            }
        });
    }

    document.getElementById('categoryFilters')?.addEventListener('click', (event) => {
        const btn = event.target.closest('.filter-btn');
        if (btn) {
            const catId = btn.getAttribute('data-id') || null;
            Actions.handleLoadCategory(catId);
        }
    });

    document.getElementById('detailModal')?.addEventListener('click', (event) => {
        const element = event.target.closest('[data-action]');
        if (!element) return;

        const action = element.dataset.action;
        const id = element.dataset.id;

        if (action === 'delete') Actions.handleDelete(id);
        if (action === 'openStatus') Actions.handleOpenStatus(element, event);
    });

    document.getElementById('statusModal')?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-status-key]');
        if (btn) Actions.handleApplyStatus(btn.dataset.statusKey);
        
        if (event.target.id === 'statusModal' || event.target.dataset.action === 'closeStatus') {
            Actions.handleCloseStatus();
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', Actions.handleLogout);
    document.getElementById('CloseDetail')?.addEventListener('click', Actions.handleCloseDetail);
    document.getElementById('CloseModal')?.addEventListener('click', Actions.handleCloseModal);
    
    document.getElementById('formType')?.addEventListener('change', Actions.handleFormTypeChange);
}
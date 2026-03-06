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

    document.getElementById('sideDetailPane')?.addEventListener('click', (event) => {
        const element = event.target.closest('[data-action]');
        if (!element) return;

        const action = element.dataset.action;
        const id = element.dataset.id;

        if (action === 'delete') Actions.handleDelete(id);
        if (action === 'openStatus') Actions.handleOpenStatus(element, event);
        if (action === 'CloseSidePane') Actions.handleCloseDetail();
    });

    document.getElementById('categoryFilters')?.addEventListener('click', (event) => {
        const btn = event.target.closest('.filter-btn');
        if (btn) {
            const catId = btn.getAttribute('data-id') || null;
            Actions.handleLoadCategory(catId);
        }
    });

    document.getElementById('detailModal')?.addEventListener('click', (event) => {
        const element = event.target.closest('[data-action]');
        
        if (!element) {
            if (event.target.id === 'detailModal') {
                Actions.handleCloseDetail();
            }
            return;
        }

        const action = element.dataset.action;
        const id = element.dataset.id;

        event.preventDefault();

        if (action === 'delete') Actions.handleDelete(id);
        if (action === 'openStatus') Actions.handleOpenStatus(element, event);
        
        if (action === 'CloseSidePane' || action === 'CloseDetail' || action === 'closeStatus') {
            Actions.handleCloseDetail();
        }
    });

    document.getElementById('statusModal')?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-status-key]');
        if (btn) Actions.handleApplyStatus(btn.dataset.statusKey);
        
        if (event.target.id === 'statusModal' || event.target.dataset.action === 'closeStatus') {
            Actions.handleCloseStatus();
        }
    });

    const openModalBtn = document.getElementById('OpenModal');
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            Actions.handleOpenAddModal();
        });
    }

    document.getElementById('setViewGrid')?.addEventListener('click', () => {
    UI.currentViewMode = 'grid';
        Actions.handleLoadCategory(currentCategoryId, true);
    });

    document.getElementById('setViewList')?.addEventListener('click', () => {
    UI.currentViewMode = 'list';
        Actions.handleLoadCategory(currentCategoryId, true);
    });

    document.getElementById('CloseSidePane')?.addEventListener('click', () => {
        UI.closeSidePane();
    });


    document.getElementById('logoutBtn')?.addEventListener('click', Actions.handleLogout);
    document.getElementById('CloseDetail')?.addEventListener('click', Actions.handleCloseDetail);
    document.getElementById('CloseModal')?.addEventListener('click', Actions.handleCloseModal);
    document.getElementById('formType')?.addEventListener('change', Actions.handleFormTypeChange);
    document.getElementById('addForm')?.addEventListener('submit', (e) => {
        Actions.handleSaveIdea(e);
    });
    document.getElementById('modal')?.addEventListener('click', (event) => {
        if (event.target.id === 'modal') {
            Actions.handleCloseModal();
        }
    });

    const toggleBtn = document.getElementById('toggleFilters');
    const filterPanel = document.getElementById('extraFiltersPanel');

    toggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        filterPanel?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (filterPanel && !filterPanel.contains(e.target) && !toggleBtn.contains(e.target)) {
            filterPanel.classList.add('hidden');
        }
    });

    ['sortDate', 'filterAuthor'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => Actions.applyFilters());
    });

    document.getElementById('subFiltersContainer')?.addEventListener('change', (e) => {
        if (e.target.classList.contains('dynamic-sub-filter')) {
            Actions.applyFilters();
        }
    });

    document.getElementById('resetFilters')?.addEventListener('click', () => {
        const authorSelect = document.getElementById('filterAuthor');
        const dateSelect = document.getElementById('sortDate');
        
        if (authorSelect) authorSelect.value = "";
        if (dateSelect) dateSelect.value = "new";
        
        document.querySelectorAll('.dynamic-sub-filter').forEach(select => {
            select.value = "";
        });

        Actions.applyFilters();
    });


}
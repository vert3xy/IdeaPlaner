const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const API = {
    async fetchMe() {
        const res = await fetch('/users/me', { headers: getHeaders() });
        return res.ok ? await res.json() : null;
    },

    async fetchCategories() {
        const res = await fetch('/categories', { headers: getHeaders() });
        if (!res.ok) throw new Error("Ошибка категорий");
        return await res.json();
    },

    async fetchIdeas(catId = null) {
        let url = `/ideas/?limit=100`;
        if (catId) url += `&category_id=${catId}`;
        const res = await fetch(url, { headers: getHeaders() });
        if (res.status === 401) { window.location.href = '/login'; return []; }
        return await res.json();
    },

    async fetchCategoryFilters(catId) {
        const res = await fetch(`/categories/${catId}/filters`, { headers: getHeaders() });
        return await res.json();
    },

    async changeStatus(id, newStatus) {
        return await fetch(`/ideas/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status: newStatus })
        });
    },

    async saveIdea(payload) {
        return await fetch('/ideas/', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },

    async deleteIdea(id) {
        return await fetch(`/ideas/${id}`, { 
            method: 'DELETE', 
            headers: getHeaders() 
        });
    },

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
};
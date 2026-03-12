const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

async function makeRequest(url, options = {}) {
    const config = {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            console.warn("Сессия истекла. Редирект на логин...");
            localStorage.removeItem('token');
            window.location.href = '/login';
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка API: ${response.status}`);
        }

        if (response.status === 204) return null;

        return await response.json();

    } catch (error) {
        console.error(`Ошибка при запросе к ${url}:`, error.message);
        throw error;
    }
}


export const API = {
    fetchMe: () => makeRequest('/users/me'),

    fetchAllUsers: () => makeRequest('/users/'),

    fetchCategories: () => makeRequest('/categories'),

    fetchIdeas(catId = null) {
        const url = catId ? `/ideas/?limit=100&category_id=${catId}` : `/ideas/?limit=100`;
        return makeRequest(url);
    },

    fetchCategoryFilters(catId) {
        return makeRequest(`/categories/${catId}/filters`);
    },

    updateUserRole: (userId, role) => makeRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    }),

    updateUserStatus: (userId, isActive) => makeRequest(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive })
    }),

    fetchAuditLogs: (limit = 50) => makeRequest(`/audit/logs?limit=${limit}`),

    saveIdea: (payload) => makeRequest('/ideas/', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    deleteIdea: (id) => makeRequest(`/ideas/${id}`, { 
        method: 'DELETE' 
    }),

    changeStatus: (id, newStatus) => makeRequest(`/ideas/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
    }),

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
};

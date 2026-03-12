import { API } from './api.js';

const DOM = {
    usersList: document.getElementById('usersList'),
    logsList: document.getElementById('logsList'),
    tabUsers: document.getElementById('tabUsers'),
    tabLogs: document.getElementById('tabLogs'),
    usersSection: document.getElementById('usersSection'),
    logsSection: document.getElementById('logsSection')
};

async function loadUsers() {
    const users = await API.fetchAllUsers();
    DOM.usersList.innerHTML = users.map(user => `
        <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-4 text-xs font-bold text-slate-300">#${user.id}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-xs">
                        ${user.username[0].toUpperCase()}
                    </div>
                    <span class="font-bold text-slate-700">${user.username}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <select onchange="window.adminActions.changeRole(${user.id}, this.value)" 
                    class="bg-slate-100 border-none rounded-lg text-xs font-bold px-3 py-1.5 focus:ring-2 focus:ring-rose-500/20">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>USER</option>
                    <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>MODERATOR</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ADMIN</option>
                </select>
            </td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${user.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}">
                    ${user.is_active ? 'Active' : 'Banned'}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="window.adminActions.toggleStatus(${user.id}, ${user.is_active})" 
                    class="text-xs font-bold ${user.is_active ? 'text-rose-400 hover:text-rose-600' : 'text-emerald-400 hover:text-emerald-600'} transition-colors">
                    ${user.is_active ? 'Забанить' : 'Разблокировать'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadLogs() {
    const logs = await API.fetchAuditLogs(50);
    DOM.logsList.innerHTML = logs.map(log => `
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all">
            <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-none">
                <i class="fa-solid ${log.action.includes('DELETE') ? 'fa-trash text-rose-400' : 'fa-bolt'}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-xs font-black uppercase tracking-widest text-slate-400">${log.action}</span>
                    <span class="text-[10px] text-slate-300">${new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p class="text-sm text-slate-600">
                    Юзер <b class="text-slate-900">${log.username || 'System'}</b> 
                    изменил <span class="font-bold text-rose-500">${log.resource_type}</span> #${log.resource_id || ''}
                </p>
                <pre class="mt-2 p-2 bg-slate-50 rounded-lg text-[10px] text-slate-400 overflow-x-auto font-mono">${JSON.stringify(log.details, null, 2)}</pre>
            </div>
        </div>
    `).join('');
}

// Глобальные действия
window.adminActions = {
    async changeRole(id, role) {
        try {
            await API.updateUserRole(id, role);
        } catch (e) { alert(e.message); }
    },
    async toggleStatus(id, current) {
        try {
            await API.updateUserStatus(id, !current);
            loadUsers();
        } catch (e) { alert(e.message); }
    }
};

// Переключение табов
function switchTab(mode) {
    if (mode === 'users') {
        DOM.tabUsers.className = "px-6 py-2 rounded-xl text-sm font-bold transition-all bg-white text-rose-500 shadow-sm";
        DOM.tabLogs.className = "px-6 py-2 rounded-xl text-sm font-bold transition-all text-slate-500 hover:text-rose-500";
        DOM.usersSection.classList.remove('hidden');
        DOM.logsSection.classList.add('hidden');
        loadUsers();
    } else {
        DOM.tabLogs.className = "px-6 py-2 rounded-xl text-sm font-bold transition-all bg-white text-rose-500 shadow-sm";
        DOM.tabUsers.className = "px-6 py-2 rounded-xl text-sm font-bold transition-all text-slate-500 hover:text-rose-500";
        DOM.logsSection.classList.remove('hidden');
        DOM.usersSection.classList.add('hidden');
        loadLogs();
    }
}

DOM.tabUsers.onclick = () => switchTab('users');
DOM.tabLogs.onclick = () => switchTab('logs');

// Старт
loadUsers();
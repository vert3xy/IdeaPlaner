export const statusMap = {
    'new': { label: 'НОВОЕ', color: 'bg-sky-500' },
    'planned': { label: 'В ПЛАНАХ', color: 'bg-amber-500' },
    'done': { label: 'ГОТОВО', color: 'bg-emerald-500' },
    'rejected': { label: 'ОТКЛОНЕНО', color: 'bg-rose-500' }
};

export function formatValue(value) {
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    return value;
}

export function getAttrLabel(idea, key) {
    if (idea.category_ref && idea.category_ref.linked_attributes) {
        const attr = idea.category_ref.linked_attributes.find(a => a.name === key);
        return attr ? attr.label : key;
    }
    return key;
}

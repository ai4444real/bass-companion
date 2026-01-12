import { IPersistence } from './IPersistence.js';

/**
 * LocalStoragePersistence - localStorage implementation of IPersistence
 *
 * Data is stored in browser localStorage:
 * - practice_items: array of PracticeItem objects
 * - practice_logs: array of PracticeLog objects
 *
 * This implementation is useful for:
 * - Development/testing without backend
 * - Offline-first usage
 * - Fallback when Supabase is unavailable
 */

export class LocalStoragePersistence extends IPersistence {
    constructor(kindDefinitions) {
        super();
        this.kindDefinitions = kindDefinitions;
        this.ITEMS_KEY = 'practice_items';
        this.LOGS_KEY = 'practice_logs';
    }

    async init() {
        // Ensure localStorage has the keys
        if (!localStorage.getItem(this.ITEMS_KEY)) {
            localStorage.setItem(this.ITEMS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.LOGS_KEY)) {
            localStorage.setItem(this.LOGS_KEY, JSON.stringify([]));
        }
    }

    async getKindDefinitions() {
        return this.kindDefinitions;
    }

    async listItems() {
        const items = localStorage.getItem(this.ITEMS_KEY);
        return items ? JSON.parse(items) : [];
    }

    async upsertItem(item) {
        const items = await this.listItems();
        const existingIndex = items.findIndex(i => i.id === item.id);

        if (existingIndex >= 0) {
            // Update existing
            items[existingIndex] = item;
        } else {
            // Insert new
            items.push(item);
        }

        localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
        return item;
    }

    async deleteItem(id) {
        const items = await this.listItems();
        const filtered = items.filter(i => i.id !== id);
        localStorage.setItem(this.ITEMS_KEY, JSON.stringify(filtered));

        // Also delete logs for this item
        const logs = await this.listLogs();
        const filteredLogs = logs.filter(l => l.itemId !== id);
        localStorage.setItem(this.LOGS_KEY, JSON.stringify(filteredLogs));
    }

    async listLogs(filters = {}) {
        const logs = localStorage.getItem(this.LOGS_KEY);
        let result = logs ? JSON.parse(logs) : [];

        // Apply filters
        if (filters.from) {
            result = result.filter(log => new Date(log.dateTime) >= new Date(filters.from));
        }
        if (filters.to) {
            result = result.filter(log => new Date(log.dateTime) <= new Date(filters.to));
        }
        if (filters.kind) {
            // Need to join with items to filter by kind
            const items = await this.listItems();
            const itemIds = items.filter(i => i.kind === filters.kind).map(i => i.id);
            result = result.filter(log => itemIds.includes(log.itemId));
        }
        if (filters.itemId) {
            result = result.filter(log => log.itemId === filters.itemId);
        }

        // Sort by dateTime descending (most recent first)
        result.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

        return result;
    }

    async addLog(log) {
        const logs = await this.listLogs();
        logs.push(log);
        localStorage.setItem(this.LOGS_KEY, JSON.stringify(logs));
        return log;
    }

    async deleteLog(id) {
        const logs = await this.listLogs();
        const filtered = logs.filter(l => l.id !== id);
        localStorage.setItem(this.LOGS_KEY, JSON.stringify(filtered));
    }
}

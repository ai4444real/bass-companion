/**
 * IPersistence - Abstract interface for persistence implementations
 *
 * Any persistence implementation (LocalStorage, Supabase, IndexedDB, etc.)
 * must implement this interface.
 */

export class IPersistence {
    /**
     * Initialize the persistence layer
     * @returns {Promise<void>}
     */
    async init() {
        throw new Error('Method init() must be implemented');
    }

    /**
     * Get kind definitions (map of kind → schema/config)
     * @returns {Promise<Object>} - Map of kind definitions
     */
    async getKindDefinitions() {
        throw new Error('Method getKindDefinitions() must be implemented');
    }

    /**
     * Get all practice items
     * @returns {Promise<Array>} - Array of PracticeItem objects
     */
    async listItems() {
        throw new Error('Method listItems() must be implemented');
    }

    /**
     * Create or update a practice item
     * @param {Object} item - PracticeItem to upsert
     * @returns {Promise<Object>} - The upserted item
     */
    async upsertItem(item) {
        throw new Error('Method upsertItem() must be implemented');
    }

    /**
     * Delete a practice item by ID
     * @param {string} id - Item ID
     * @returns {Promise<void>}
     */
    async deleteItem(id) {
        throw new Error('Method deleteItem() must be implemented');
    }

    /**
     * Get practice logs with optional filters
     * @param {Object} filters - { from, to, kind, itemId }
     * @returns {Promise<Array>} - Array of PracticeLog objects
     */
    async listLogs(filters = {}) {
        throw new Error('Method listLogs() must be implemented');
    }

    /**
     * Add a practice log
     * @param {Object} log - PracticeLog to add
     * @returns {Promise<Object>} - The added log
     */
    async addLog(log) {
        throw new Error('Method addLog() must be implemented');
    }

    /**
     * Delete a practice log by ID
     * @param {string} id - Log ID
     * @returns {Promise<void>}
     */
    async deleteLog(id) {
        throw new Error('Method deleteLog() must be implemented');
    }
}

import { LocalStoragePersistence } from './persistence/LocalStoragePersistence.js';
import { KIND_DEFINITIONS } from './kind-definitions.js';

/**
 * Practice Companion App
 *
 * Main application logic:
 * - Home view with launcher actions
 * - Burst timer (5 minutes default)
 * - Week view with daily notes
 * - Persistence via LocalStorage (later: Supabase)
 */

class PracticeApp {
    constructor() {
        // Initialize persistence
        this.persistence = new LocalStoragePersistence(KIND_DEFINITIONS);

        // State
        this.currentView = 'home';
        this.lastItemId = null;
        this.burstTimer = null;
        this.burstStartTime = null;
        this.burstDuration = 5 * 60; // 5 minutes in seconds
        this.currentBurstItem = null;

        // Elements
        this.elements = {
            // Navigation
            navTabs: document.querySelectorAll('.nav-tab'),

            // Views
            viewHome: document.getElementById('view-home'),
            viewWeek: document.getElementById('view-week'),
            viewItems: document.getElementById('view-items'),
            viewBassBuzz: document.getElementById('view-bassbuzz'),

            // Header
            notesCount: document.getElementById('notes-count'),

            // Home actions
            startBurstBtn: document.getElementById('start-burst-btn'),
            lastItemName: document.getElementById('last-item-name'),
            burstOnItemBtn: document.getElementById('burst-on-item-btn'),
            bassbuzzBtn: document.getElementById('bassbuzz-btn'),

            // Lists
            pinnedList: document.getElementById('pinned-list'),
            recentList: document.getElementById('recent-list'),

            // Week view
            weekGrid: document.getElementById('week-grid'),
            dayDetail: document.getElementById('day-detail'),
            dayDetailTitle: document.getElementById('day-detail-title'),
            backToWeek: document.getElementById('back-to-week'),
            logList: document.getElementById('log-list'),

            // Burst modal
            burstModal: document.getElementById('burst-modal'),
            burstItemName: document.getElementById('burst-item-name'),
            closeBurst: document.getElementById('close-burst'),
            timerText: document.getElementById('timer-text'),
            startTimerBtn: document.getElementById('start-timer-btn'),
            stopTimerBtn: document.getElementById('stop-timer-btn'),
            doneBurstBtn: document.getElementById('done-burst-btn'),
            runtimeValues: document.getElementById('runtime-values'),
            runtimeBpm: document.getElementById('runtime-bpm'),

            // Item selector modal
            itemSelectorModal: document.getElementById('item-selector-modal'),
            closeItemSelector: document.getElementById('close-item-selector'),
            itemSelectorList: document.getElementById('item-selector-list'),

            // Item detail modal
            itemDetailModal: document.getElementById('item-detail-modal'),
            closeItemDetail: document.getElementById('close-item-detail'),
            itemDetailTitle: document.getElementById('item-detail-title'),
            itemDetailKind: document.getElementById('item-detail-kind'),
            itemDetailContent: document.getElementById('item-detail-content'),
            itemDetailBurstBtn: document.getElementById('item-detail-burst-btn'),

            // Items view
            itemsList: document.getElementById('items-list'),
            newItemBtn: document.getElementById('new-item-btn'),

            // BassBuzz view
            bassbuzzList: document.getElementById('bassbuzz-list'),

            // Item form modal
            itemFormModal: document.getElementById('item-form-modal'),
            closeItemForm: document.getElementById('close-item-form'),
            itemFormTitle: document.getElementById('item-form-title'),
            itemForm: document.getElementById('item-form'),
            itemTitleInput: document.getElementById('item-title'),
            itemKindSelect: document.getElementById('item-kind'),
            itemKindFields: document.getElementById('item-kind-fields'),
            itemPinnedCheckbox: document.getElementById('item-pinned'),
            itemAllowBurstCheckbox: document.getElementById('item-allow-burst'),
            itemCompletedField: document.getElementById('item-completed-field'),
            itemCompletedCheckbox: document.getElementById('item-completed'),
            cancelItemForm: document.getElementById('cancel-item-form')
        };

        this.currentEditingItemId = null;

        this._setupEventListeners();
    }

    async init() {
        console.log('🎸 Practice Companion - Initializing...');

        // Initialize persistence
        await this.persistence.init();

        // Seed data if empty
        await this._seedDataIfEmpty();

        // Load last item
        await this._loadLastItem();

        // Render initial view
        await this.renderHome();
        await this.updateNotesCount();

        console.log('✅ App ready!');
    }

    // ===== EVENT LISTENERS =====
    _setupEventListeners() {
        // Navigation tabs
        this.elements.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                this.switchView(view);
            });
        });

        // Home actions
        this.elements.startBurstBtn.addEventListener('click', () => this.startBurstOnLastItem());
        this.elements.burstOnItemBtn.addEventListener('click', () => this.openItemSelector());
        this.elements.bassbuzzBtn.addEventListener('click', () => this.openBassBuzz());

        // Burst modal
        this.elements.closeBurst.addEventListener('click', () => this.closeBurstModal());
        this.elements.startTimerBtn.addEventListener('click', () => this.startTimer());
        this.elements.stopTimerBtn.addEventListener('click', () => this.stopTimer());
        this.elements.doneBurstBtn.addEventListener('click', () => this.completeBurst());

        // Week view
        this.elements.backToWeek.addEventListener('click', () => this.showWeekGrid());

        // Item selector modal
        this.elements.closeItemSelector.addEventListener('click', () => this.closeItemSelector());

        // Item detail modal
        this.elements.closeItemDetail.addEventListener('click', () => this.closeItemDetail());
        this.elements.itemDetailBurstBtn.addEventListener('click', () => {
            const itemId = this.elements.itemDetailBurstBtn.dataset.itemId;
            this.closeItemDetail();
            this.startBurstOnItem(itemId);
        });

        // Items view
        this.elements.newItemBtn.addEventListener('click', () => this.openItemForm());

        // Item form modal
        this.elements.closeItemForm.addEventListener('click', () => this.closeItemForm());
        this.elements.cancelItemForm.addEventListener('click', () => this.closeItemForm());
        this.elements.itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });
        this.elements.itemKindSelect.addEventListener('change', () => this._renderKindFields());
    }

    // ===== VIEW SWITCHING =====
    switchView(view) {
        this.currentView = view;

        // Update tabs
        this.elements.navTabs.forEach(tab => {
            if (tab.dataset.view === view) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Show/hide views
        this.elements.viewHome.classList.add('hidden');
        this.elements.viewWeek.classList.add('hidden');
        this.elements.viewItems.classList.add('hidden');
        this.elements.viewBassBuzz.classList.add('hidden');

        if (view === 'home') {
            this.elements.viewHome.classList.remove('hidden');
            this.renderHome();
        } else if (view === 'week') {
            this.elements.viewWeek.classList.remove('hidden');
            this.renderWeek();
        } else if (view === 'items') {
            this.elements.viewItems.classList.remove('hidden');
            this.renderItems();
        } else if (view === 'bassbuzz') {
            this.elements.viewBassBuzz.classList.remove('hidden');
            this.renderBassBuzz();
        }
    }

    // ===== HOME VIEW =====
    async renderHome() {
        const items = await this.persistence.listItems();

        // Pinned items
        const pinnedItems = items.filter(item => item.pinned);
        this._renderItemList(this.elements.pinnedList, pinnedItems);

        // Recent items (based on last logs)
        const recentItems = await this._getRecentItems(items, 5);
        this._renderItemList(this.elements.recentList, recentItems);
    }

    _renderItemList(container, items) {
        if (items.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light); font-size: 0.85em; padding: 10px;">Nessun item</p>';
            return;
        }

        container.innerHTML = items.map(item => {
            const preview = this._getItemPreview(item);
            return `
                <div class="item-card" data-id="${item.id}">
                    <div class="item-card-info" onclick="app.openItemDetail('${item.id}')" style="cursor: pointer;">
                        <div class="item-card-title">${this._escapeHtml(item.title)}</div>
                        <div class="item-card-kind">${KIND_DEFINITIONS[item.kind]?.label || item.kind}</div>
                        ${preview ? `<div class="item-card-preview">${this._escapeHtml(preview)}</div>` : ''}
                    </div>
                    <div class="item-card-actions">
                        ${item.allowBurst ? `<button class="btn btn-primary" onclick="app.startBurstOnItem('${item.id}'); event.stopPropagation();">▶</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    _getItemPreview(item) {
        const maxLength = 40;

        switch (item.kind) {
            case 'riff':
                if (item.values?.notes) {
                    const notes = item.values.notes.substring(0, maxLength);
                    return notes.length < item.values.notes.length ? notes + '...' : notes;
                }
                if (item.values?.targetBpm) {
                    return `Target: ${item.values.targetBpm} BPM`;
                }
                break;

            case 'stamina':
                const duration = item.values?.duration || 0;
                const bpm = item.values?.bpm || 0;
                return `${duration}s @ ${bpm} BPM`;

            case 'bassbuzz':
                return `M${item.values?.module || '?'} L${item.values?.lesson || '?'}`;

            case 'resource':
                if (item.values?.description) {
                    const desc = item.values.description.substring(0, maxLength);
                    return desc.length < item.values.description.length ? desc + '...' : desc;
                }
                break;

            case 'exercise':
                if (item.values?.focus) {
                    const focus = item.values.focus.substring(0, maxLength);
                    return focus.length < item.values.focus.length ? focus + '...' : focus;
                }
                break;
        }

        return null;
    }

    async _getRecentItems(items, limit = 5) {
        const logs = await this.persistence.listLogs();

        // Get unique item IDs from recent logs
        const recentItemIds = [];
        const seen = new Set();

        for (const log of logs) {
            if (!seen.has(log.itemId) && recentItemIds.length < limit) {
                seen.add(log.itemId);
                recentItemIds.push(log.itemId);
            }
        }

        // Return items in order of recency
        return recentItemIds.map(id => items.find(item => item.id === id)).filter(Boolean);
    }

    // ===== BURST FLOW =====
    async startBurstOnLastItem() {
        if (!this.lastItemId) {
            alert('Nessun item recente. Usa "Burst su item" per selezionarne uno.');
            return;
        }

        const items = await this.persistence.listItems();
        const item = items.find(i => i.id === this.lastItemId);

        if (!item) {
            alert('Item non trovato');
            return;
        }

        this.openBurstModal(item);
    }

    async startBurstOnItem(itemId) {
        const items = await this.persistence.listItems();
        const item = items.find(i => i.id === itemId);

        if (!item) {
            alert('Item non trovato');
            return;
        }

        this.openBurstModal(item);
    }

    openBurstModal(item) {
        this.currentBurstItem = item;
        this.elements.burstItemName.textContent = item.title;
        this.elements.timerText.textContent = '5:00';

        // Reset buttons
        this.elements.startTimerBtn.classList.remove('hidden');
        this.elements.stopTimerBtn.classList.add('hidden');
        this.elements.doneBurstBtn.classList.add('hidden');

        // Show runtime values if item is a riff (BPM)
        if (item.kind === 'riff') {
            this.elements.runtimeValues.classList.remove('hidden');
            this.elements.runtimeBpm.value = item.values?.targetBpm || '';
        } else {
            this.elements.runtimeValues.classList.add('hidden');
        }

        this.elements.burstModal.classList.remove('hidden');
    }

    closeBurstModal() {
        if (this.burstTimer) {
            this.stopTimer();
        }
        this.elements.burstModal.classList.add('hidden');
        this.currentBurstItem = null;
    }

    startTimer() {
        this.burstStartTime = Date.now();
        let remainingSeconds = this.burstDuration;

        this.elements.startTimerBtn.classList.add('hidden');
        this.elements.stopTimerBtn.classList.remove('hidden');

        this.burstTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.burstStartTime) / 1000);
            remainingSeconds = this.burstDuration - elapsed;

            if (remainingSeconds <= 0) {
                // Timer finished
                this.stopTimer();
                this.elements.doneBurstBtn.classList.remove('hidden');
                this.elements.timerText.textContent = '0:00';

                // Play sound and vibrate
                this._playBurstEndSound();
                this._vibrate();

                return;
            }

            // Update display
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            this.elements.timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.burstTimer) {
            clearInterval(this.burstTimer);
            this.burstTimer = null;
        }

        this.elements.startTimerBtn.classList.add('hidden');
        this.elements.stopTimerBtn.classList.add('hidden');
        this.elements.doneBurstBtn.classList.remove('hidden');
    }

    async completeBurst() {
        if (!this.currentBurstItem) return;

        // Calculate actual minutes practiced
        let actualMinutes = 5; // Default to 5 minutes
        if (this.burstStartTime) {
            const elapsed = Math.floor((Date.now() - this.burstStartTime) / 1000);
            actualMinutes = Math.max(1, Math.round(elapsed / 60)); // At least 1 minute
        }

        // Calculate notes awarded
        const kindDef = KIND_DEFINITIONS[this.currentBurstItem.kind];
        const notesAwarded = kindDef?.defaultReward || 1;

        // Collect runtime values
        const runtimeValues = {};
        if (this.currentBurstItem.kind === 'riff' && this.elements.runtimeBpm.value) {
            runtimeValues.bpm = parseInt(this.elements.runtimeBpm.value);
        }

        // Create log
        const log = {
            id: this._generateId(),
            dateTime: new Date().toISOString(),
            itemId: this.currentBurstItem.id,
            mode: 'burst',
            minutes: actualMinutes,
            values: runtimeValues,
            notesAwarded: notesAwarded
        };

        await this.persistence.addLog(log);

        // Update last item
        this.lastItemId = this.currentBurstItem.id;
        localStorage.setItem('lastItemId', this.lastItemId);
        await this._loadLastItem();

        // Update notes count
        await this.updateNotesCount();

        // Close modal
        this.closeBurstModal();

        // Show feedback
        alert(`✓ Burst completato! ${actualMinutes} min registrati, +${notesAwarded} ♪`);
    }

    // ===== WEEK VIEW =====
    async renderWeek() {
        const logs = await this.persistence.listLogs();

        // Get last 7 days
        const today = new Date();
        const days = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push(date);
        }

        // Calculate notes per day
        const dayNotes = days.map(date => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayLogs = logs.filter(log => {
                const logDate = new Date(log.dateTime);
                return logDate >= dayStart && logDate <= dayEnd;
            });

            const notes = dayLogs.reduce((sum, log) => sum + log.notesAwarded, 0);

            return { date, notes, logCount: dayLogs.length };
        });

        // Render week grid
        this.elements.weekGrid.innerHTML = dayNotes.map(({ date, notes, logCount }) => {
            const dayName = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][date.getDay()];
            const dayDate = date.getDate();

            return `
                <div class="day-card" data-date="${date.toISOString()}">
                    <div class="day-name">${dayName}</div>
                    <div class="day-date">${dayDate}</div>
                    <div class="day-notes">${notes > 0 ? `${notes} ♪` : '-'}</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        this.elements.weekGrid.querySelectorAll('.day-card').forEach(card => {
            card.addEventListener('click', () => {
                const date = card.dataset.date;
                this.showDayDetail(date);
            });
        });

        // Hide day detail, show week grid
        this.showWeekGrid();
    }

    showWeekGrid() {
        this.elements.weekGrid.classList.remove('hidden');
        this.elements.dayDetail.classList.add('hidden');
    }

    async showDayDetail(dateString) {
        const date = new Date(dateString);
        const dayName = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][date.getDay()];

        this.elements.dayDetailTitle.textContent = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;

        // Get logs for this day
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const logs = await this.persistence.listLogs({
            from: dayStart.toISOString(),
            to: dayEnd.toISOString()
        });

        // Get items for log details
        const items = await this.persistence.listItems();

        // Render logs
        if (logs.length === 0) {
            this.elements.logList.innerHTML = '<p style="color: var(--text-light); padding: 20px; text-align: center;">Nessuna pratica registrata</p>';
        } else {
            this.elements.logList.innerHTML = logs.map(log => {
                const item = items.find(i => i.id === log.itemId);
                const time = new Date(log.dateTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="log-card">
                        <div class="log-card-header">
                            <div class="log-card-title">${item ? this._escapeHtml(item.title) : 'Unknown'}</div>
                            <div class="log-card-notes">${log.notesAwarded} ♪</div>
                        </div>
                        <div class="log-card-details">
                            ${time} • ${log.minutes} min • ${log.mode}
                            ${log.values?.bpm ? ` • ${log.values.bpm} BPM` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Show day detail
        this.elements.weekGrid.classList.add('hidden');
        this.elements.dayDetail.classList.remove('hidden');
    }

    // ===== ITEM SELECTOR =====
    async openItemSelector() {
        const items = await this.persistence.listItems();
        const allowBurstItems = items.filter(item => item.allowBurst);

        this.elements.itemSelectorList.innerHTML = allowBurstItems.map(item => `
            <div class="item-card" data-id="${item.id}" style="cursor: pointer;">
                <div class="item-card-info">
                    <div class="item-card-title">${this._escapeHtml(item.title)}</div>
                    <div class="item-card-kind">${KIND_DEFINITIONS[item.kind]?.label || item.kind}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        this.elements.itemSelectorList.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', () => {
                const itemId = card.dataset.id;
                this.closeItemSelector();
                this.startBurstOnItem(itemId);
            });
        });

        this.elements.itemSelectorModal.classList.remove('hidden');
    }

    closeItemSelector() {
        this.elements.itemSelectorModal.classList.add('hidden');
    }

    // ===== ITEM DETAIL =====
    async openItemDetail(itemId) {
        const items = await this.persistence.listItems();
        const item = items.find(i => i.id === itemId);

        if (!item) {
            alert('Item non trovato');
            return;
        }

        // Set title and kind
        this.elements.itemDetailTitle.textContent = item.title;
        this.elements.itemDetailKind.textContent = KIND_DEFINITIONS[item.kind]?.label || item.kind;

        // Render content based on kind
        this.elements.itemDetailContent.innerHTML = this._renderItemDetailContent(item);

        // Set burst button (hide if not allowed)
        if (item.allowBurst) {
            this.elements.itemDetailBurstBtn.classList.remove('hidden');
            this.elements.itemDetailBurstBtn.dataset.itemId = item.id;
        } else {
            this.elements.itemDetailBurstBtn.classList.add('hidden');
        }

        // Show modal
        this.elements.itemDetailModal.classList.remove('hidden');
    }

    closeItemDetail() {
        this.elements.itemDetailModal.classList.add('hidden');
    }

    _renderItemDetailContent(item) {
        const fields = [];

        switch (item.kind) {
            case 'riff':
                if (item.values?.targetBpm) {
                    fields.push({
                        label: 'Target BPM',
                        value: item.values.targetBpm
                    });
                }
                if (item.values?.notes) {
                    fields.push({
                        label: 'Notes/Tab',
                        value: item.values.notes,
                        notes: true
                    });
                }
                break;

            case 'stamina':
                if (item.values?.duration) {
                    fields.push({
                        label: 'Duration',
                        value: `${item.values.duration} seconds`
                    });
                }
                if (item.values?.bpm) {
                    fields.push({
                        label: 'BPM',
                        value: item.values.bpm
                    });
                }
                if (item.values?.description) {
                    fields.push({
                        label: 'Description',
                        value: item.values.description
                    });
                }
                break;

            case 'bassbuzz':
                if (item.values?.module) {
                    fields.push({
                        label: 'Module',
                        value: item.values.module
                    });
                }
                if (item.values?.lesson) {
                    fields.push({
                        label: 'Lesson',
                        value: item.values.lesson
                    });
                }
                break;

            case 'resource':
                if (item.values?.link) {
                    fields.push({
                        label: 'Link',
                        value: `<a href="${this._escapeHtml(item.values.link)}" target="_blank">${this._escapeHtml(item.values.link)}</a>`,
                        isHtml: true
                    });
                }
                if (item.values?.description) {
                    fields.push({
                        label: 'Description',
                        value: item.values.description
                    });
                }
                break;

            case 'exercise':
                if (item.values?.focus) {
                    fields.push({
                        label: 'Focus',
                        value: item.values.focus
                    });
                }
                if (item.values?.link) {
                    fields.push({
                        label: 'Link',
                        value: `<a href="${this._escapeHtml(item.values.link)}" target="_blank">${this._escapeHtml(item.values.link)}</a>`,
                        isHtml: true
                    });
                }
                break;

            case 'warmup':
                if (item.values?.description) {
                    fields.push({
                        label: 'Description',
                        value: item.values.description
                    });
                }
                break;

            case 'theory':
                if (item.values?.topic) {
                    fields.push({
                        label: 'Topic',
                        value: item.values.topic
                    });
                }
                if (item.values?.link) {
                    fields.push({
                        label: 'Link',
                        value: `<a href="${this._escapeHtml(item.values.link)}" target="_blank">${this._escapeHtml(item.values.link)}</a>`,
                        isHtml: true
                    });
                }
                break;
        }

        if (fields.length === 0) {
            return '<p style="color: var(--text-light); text-align: center;">Nessun contenuto disponibile</p>';
        }

        return fields.map(field => {
            const classes = [];
            if (field.large) classes.push('large');
            if (field.notes) classes.push('notes');
            const classAttr = classes.length > 0 ? classes.join(' ') : '';

            return `
                <div class="item-detail-field">
                    <div class="item-detail-label">${field.label}</div>
                    <div class="item-detail-value ${classAttr}">${field.isHtml ? field.value : this._escapeHtml(String(field.value))}</div>
                </div>
            `;
        }).join('');
    }

    // ===== BASSBUZZ =====
    openBassBuzz() {
        this.switchView('bassbuzz');
    }

    async renderBassBuzz() {
        const items = await this.persistence.listItems();
        const bassbuzzItems = items.filter(item => item.kind === 'bassbuzz');

        if (bassbuzzItems.length === 0) {
            this.elements.bassbuzzList.innerHTML = '<p style="color: var(--text-light); padding: 20px; text-align: center;">Nessuna lezione BassBuzz. Aggiungile dal tab Items!</p>';
            return;
        }

        // Sort by module and lesson
        bassbuzzItems.sort((a, b) => {
            const moduleA = a.values?.module || 0;
            const moduleB = b.values?.module || 0;
            if (moduleA !== moduleB) return moduleA - moduleB;
            return (a.values?.lesson || 0) - (b.values?.lesson || 0);
        });

        this.elements.bassbuzzList.innerHTML = bassbuzzItems.map(item => {
            const module = item.values?.module || '?';
            const lesson = item.values?.lesson || '?';
            const link = item.values?.link || '';
            const completed = item.completed || false;
            const completedClass = completed ? 'completed' : '';
            const completedTitleClass = completed ? 'completed' : '';

            return `
                <div class="bassbuzz-lesson-card ${completedClass}">
                    <div class="bassbuzz-lesson-header">
                        <div class="bassbuzz-lesson-title ${completedTitleClass}">M${module} L${lesson}</div>
                        ${link ? `<div class="bassbuzz-lesson-link"><a href="${this._escapeHtml(link)}" target="_blank">🔗 Apri lezione</a></div>` : ''}
                    </div>

                    <div class="bassbuzz-lesson-controls">
                        <select class="bassbuzz-workout-select" id="workout-${item.id}">
                            <option value="lesson">Lesson</option>
                            <option value="slow">Slow workout</option>
                            <option value="middle">Middle workout</option>
                            <option value="fast">Fast workout</option>
                        </select>

                        <button class="btn btn-primary" onclick="app.logBassBuzzWorkout('${item.id}')">Log</button>

                        <div class="bassbuzz-lesson-completed">
                            <input type="checkbox" id="completed-${item.id}" ${completed ? 'checked' : ''} onchange="app.toggleLessonCompleted('${item.id}')" />
                            <label for="completed-${item.id}">Completata</label>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async toggleLessonCompleted(itemId) {
        const items = await this.persistence.listItems();
        const item = items.find(i => i.id === itemId);

        if (!item) return;

        // Toggle completed status
        item.completed = !item.completed;

        await this.persistence.upsertItem(item);
        await this.renderBassBuzz();
    }

    async logBassBuzzWorkout(itemId) {
        const workoutSelect = document.getElementById(`workout-${itemId}`);
        if (!workoutSelect) return;

        const workoutType = workoutSelect.value;

        // Create log
        const log = {
            id: this._generateId(),
            dateTime: new Date().toISOString(),
            itemId: itemId,
            mode: 'bassbuzz-' + workoutType,
            minutes: 0, // BassBuzz doesn't track time
            values: { workoutType },
            notesAwarded: 2 // BassBuzz awards 2 notes (double of burst)
        };

        await this.persistence.addLog(log);

        // Update notes count
        await this.updateNotesCount();

        // Visual feedback
        alert(`✓ ${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} registrato! +2 ♪`);

        // Refresh view
        await this.renderBassBuzz();
    }

    // ===== ITEMS MANAGEMENT =====
    async renderItems() {
        const items = await this.persistence.listItems();

        if (items.length === 0) {
            this.elements.itemsList.innerHTML = '<p style="color: var(--text-light); padding: 20px; text-align: center;">Nessun item. Crea il tuo primo item!</p>';
            return;
        }

        this.elements.itemsList.innerHTML = items.map(item => `
            <div class="item-manage-card">
                <div class="item-manage-info">
                    <div class="item-manage-title">${this._escapeHtml(item.title)}</div>
                    <div class="item-manage-kind">${KIND_DEFINITIONS[item.kind]?.label || item.kind}</div>
                </div>
                <div class="item-manage-actions">
                    <button class="btn btn-secondary" onclick="app.openItemForm('${item.id}')">Edit</button>
                    <button class="btn btn-secondary" onclick="app.deleteItem('${item.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    openItemForm(itemId = null) {
        this.currentEditingItemId = itemId;

        // Populate kind select
        this.elements.itemKindSelect.innerHTML = '<option value="">-- Seleziona --</option>' +
            Object.keys(KIND_DEFINITIONS).map(kind =>
                `<option value="${kind}">${KIND_DEFINITIONS[kind].label}</option>`
            ).join('');

        if (itemId) {
            // Edit mode
            this.elements.itemFormTitle.textContent = 'Modifica Item';
            this._loadItemToForm(itemId);
        } else {
            // Create mode
            this.elements.itemFormTitle.textContent = 'Nuovo Item';
            this.elements.itemForm.reset();
            this.elements.itemKindFields.innerHTML = '';
        }

        this.elements.itemFormModal.classList.remove('hidden');
    }

    async _loadItemToForm(itemId) {
        const items = await this.persistence.listItems();
        const item = items.find(i => i.id === itemId);

        if (!item) return;

        this.elements.itemTitleInput.value = item.title;
        this.elements.itemKindSelect.value = item.kind;
        this.elements.itemPinnedCheckbox.checked = item.pinned;
        this.elements.itemAllowBurstCheckbox.checked = item.allowBurst;

        // Load completed field for BassBuzz items
        if (item.kind === 'bassbuzz') {
            this.elements.itemCompletedCheckbox.checked = item.completed || false;
        }

        // Render kind fields and populate with values
        this._renderKindFields(item.values);
    }

    _renderKindFields(values = {}) {
        const kind = this.elements.itemKindSelect.value;

        if (!kind) {
            this.elements.itemKindFields.innerHTML = '';
            return;
        }

        const kindDef = KIND_DEFINITIONS[kind];

        if (!kindDef || !kindDef.fields) {
            this.elements.itemKindFields.innerHTML = '';
            return;
        }

        this.elements.itemKindFields.innerHTML = Object.entries(kindDef.fields).map(([fieldName, fieldDef]) => {
            const value = values[fieldName] !== undefined ? values[fieldName] : (fieldDef.default || '');
            const inputId = `item-field-${fieldName}`;

            let inputHtml = '';

            switch (fieldDef.type) {
                case 'number':
                    inputHtml = `<input type="number" id="${inputId}" value="${value}" ${fieldDef.required ? 'required' : ''} ${fieldDef.min !== undefined ? `min="${fieldDef.min}"` : ''} ${fieldDef.max !== undefined ? `max="${fieldDef.max}"` : ''} />`;
                    break;
                case 'url':
                    inputHtml = `<input type="url" id="${inputId}" value="${this._escapeHtml(value)}" ${fieldDef.required ? 'required' : ''} />`;
                    break;
                case 'text':
                default:
                    // Use textarea for notes/tab fields
                    if (fieldName === 'notes' || fieldName === 'tab') {
                        inputHtml = `<textarea id="${inputId}" ${fieldDef.required ? 'required' : ''}>${this._escapeHtml(value)}</textarea>`;
                    } else {
                        inputHtml = `<input type="text" id="${inputId}" value="${this._escapeHtml(value)}" ${fieldDef.required ? 'required' : ''} />`;
                    }
                    break;
            }

            return `
                <div class="form-field">
                    <label for="${inputId}">${fieldDef.label}${fieldDef.required ? ' *' : ''}</label>
                    ${inputHtml}
                </div>
            `;
        }).join('');

        // Show/hide completed field for BassBuzz items
        if (kind === 'bassbuzz') {
            this.elements.itemCompletedField.classList.remove('hidden');
        } else {
            this.elements.itemCompletedField.classList.add('hidden');
        }
    }

    async saveItem() {
        const title = this.elements.itemTitleInput.value.trim();
        const kind = this.elements.itemKindSelect.value;
        const pinned = this.elements.itemPinnedCheckbox.checked;
        const allowBurst = this.elements.itemAllowBurstCheckbox.checked;

        if (!title || !kind) {
            alert('Titolo e Tipo sono obbligatori');
            return;
        }

        // Collect kind field values
        const kindDef = KIND_DEFINITIONS[kind];
        const values = {};

        if (kindDef && kindDef.fields) {
            for (const fieldName of Object.keys(kindDef.fields)) {
                const input = document.getElementById(`item-field-${fieldName}`);
                if (input) {
                    const fieldDef = kindDef.fields[fieldName];
                    if (fieldDef.type === 'number') {
                        values[fieldName] = input.value ? parseInt(input.value) : (fieldDef.default || 0);
                    } else {
                        values[fieldName] = input.value || (fieldDef.default || '');
                    }
                }
            }
        }

        // Create or update item
        const item = {
            id: this.currentEditingItemId || this._generateId(),
            title,
            kind,
            values,
            pinned,
            allowBurst
        };

        // Add completed field for BassBuzz items
        if (kind === 'bassbuzz') {
            item.completed = this.elements.itemCompletedCheckbox.checked;
        }

        await this.persistence.upsertItem(item);

        // Close form and refresh views
        this.closeItemForm();
        await this.renderItems();
        await this.renderHome();
    }

    async deleteItem(itemId) {
        if (!confirm('Sei sicuro di voler eliminare questo item?')) {
            return;
        }

        await this.persistence.deleteItem(itemId);
        await this.renderItems();
        await this.renderHome();
    }

    closeItemForm() {
        this.elements.itemFormModal.classList.add('hidden');
        this.currentEditingItemId = null;
    }

    // ===== NOTES COUNT =====
    async updateNotesCount() {
        const logs = await this.persistence.listLogs();
        const totalNotes = logs.reduce((sum, log) => sum + log.notesAwarded, 0);
        this.elements.notesCount.textContent = totalNotes;
    }

    // ===== LAST ITEM =====
    async _loadLastItem() {
        this.lastItemId = localStorage.getItem('lastItemId');

        if (this.lastItemId) {
            const items = await this.persistence.listItems();
            const lastItem = items.find(i => i.id === this.lastItemId);

            if (lastItem) {
                this.elements.lastItemName.textContent = lastItem.title;
            } else {
                this.elements.lastItemName.textContent = '--';
            }
        } else {
            this.elements.lastItemName.textContent = '--';
        }
    }

    // ===== SEED DATA =====
    async _seedDataIfEmpty() {
        const items = await this.persistence.listItems();

        if (items.length === 0) {
            console.log('📦 Seeding initial data...');

            const seedItems = [
                {
                    id: this._generateId(),
                    title: 'Ladies Night',
                    kind: 'riff',
                    values: {
                        targetBpm: 110,
                        notes: 'a3 . a6 . d3 . d5 . ¦ a3 a3 a6 a6 d3 . . .'
                    },
                    pinned: true,
                    allowBurst: true
                },
                {
                    id: this._generateId(),
                    title: 'Another One Bites the Dust',
                    kind: 'riff',
                    values: {
                        targetBpm: 110,
                        notes: 'e0 e0 e0 . e0 ¦ e0 e0 e3 e0 e5'
                    },
                    pinned: true,
                    allowBurst: true
                },
                {
                    id: this._generateId(),
                    title: 'Stamina 60s @ 120 BPM',
                    kind: 'stamina',
                    values: {
                        duration: 60,
                        bpm: 120,
                        description: 'Ottavi continui per 60 secondi'
                    },
                    pinned: false,
                    allowBurst: true
                },
                {
                    id: 'note-trainer-fixed-id', // Fixed ID for bass-notes.html integration
                    title: 'Note Trainer',
                    kind: 'resource',
                    values: { link: './bass-notes.html', description: 'Bass notes learning tool' },
                    pinned: true,
                    allowBurst: false
                },
                {
                    id: this._generateId(),
                    title: 'BassBuzz M1 L1',
                    kind: 'bassbuzz',
                    values: { module: 1, lesson: 1 },
                    pinned: false,
                    allowBurst: true
                }
            ];

            for (const item of seedItems) {
                await this.persistence.upsertItem(item);
            }

            console.log('✅ Seed data added');
        }
    }

    // ===== SOUND & VIBRATION =====
    _playBurstEndSound() {
        try {
            // Create Web Audio API context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create oscillator (generates tone)
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Set frequency (A note = 440Hz, higher for pleasant ding)
            oscillator.frequency.value = 880; // A5
            oscillator.type = 'sine';

            // Set volume envelope (fade out)
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            // Play for 0.5 seconds
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Could not play burst end sound:', error);
        }
    }

    _vibrate() {
        // Vibrate on mobile (if supported)
        if ('vibrate' in navigator) {
            try {
                // Vibrate pattern: vibrate 200ms, pause 100ms, vibrate 200ms
                navigator.vibrate([200, 100, 200]);
            } catch (error) {
                console.warn('Could not vibrate:', error);
            }
        }
    }

    // ===== UTILS =====
    _generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== EXPORT/IMPORT =====
    async exportData() {
        const items = await this.persistence.listItems();
        const logs = await this.persistence.listLogs();

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            items: items,
            logs: logs
        };

        // Create JSON blob and download
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `practice-companion-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ Data exported successfully');
    }
}

// Initialize app
const app = new PracticeApp();
app.init();

// Expose app globally for inline event handlers
window.app = app;

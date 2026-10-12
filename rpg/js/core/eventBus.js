// [2026-10-12 13:15] - js/core/eventBus.js: v0.0.2 Zentrale Ereignisverwaltung
// Änderungen:
// - Unterstützung für Speicher- und Handelsereignisse (shop:open, shop:close, storage:save, storage:loaded).

class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(listener);
  }

  emit(eventName, data) {
    if (!this.events.has(eventName)) return;
    this.events.get(eventName).forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();

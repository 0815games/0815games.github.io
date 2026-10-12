// [2026-10-12 13:25] - js/core/eventBus.js: v0.0.4 Ereignisverwaltung
// Änderungen:
// - Zentrale Ereigniskommunikation für Fantasy-Kampf, Quests und Alchemist.

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

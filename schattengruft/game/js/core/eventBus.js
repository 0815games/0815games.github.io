// [2026-10-12 13:30] - js/core/eventBus.js: v0.0.5 Ereignisverwaltung
// Änderungen:
// - Zentrale Ereignisweiterleitung.

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

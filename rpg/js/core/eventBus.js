// [2026-10-12 13:50] - js/core/eventBus.js: v0.0.8 Ereignisverwaltung
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

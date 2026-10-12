// [2026-10-12 08:13] - js/core/eventBus.js: Entkoppeltes Event-System
// Änderungen:
// - Publish-Subscribe-Modell verhindert zirkuläre Abhängigkeiten zwischen Engine & UI.

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, payload) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(cb => cb(payload));
  }
}

export const eventBus = new EventBus();

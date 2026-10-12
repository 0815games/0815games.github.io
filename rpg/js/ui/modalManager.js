// [2026-10-12 13:35] - js/ui/modalManager.js: v0.0.6 Gothic Modal- & Dialogverwaltung
// Änderungen:
// - Verwaltet Dark-Fantasy Bestätigungsdialoge und Benachrichtigungen im Spieleigenen Look.
// - Schirmt alle Interaktionen ab und hebt Sperren nach Quittierung sauber auf.

import { state } from '../core/state.js';

export class ModalManager {
  constructor() {
    this.modalEl = document.getElementById('fantasy-modal');
    this.titleEl = document.getElementById('fantasy-modal-title');
    this.msgEl = document.getElementById('fantasy-modal-msg');
    this.iconEl = document.getElementById('fantasy-modal-icon');
    this.actionsEl = document.getElementById('fantasy-modal-actions');
  }

  showNotice(title, message, icon = '📜') {
    state.isInputLocked = true;
    this.titleEl.innerText = title;
    this.msgEl.innerText = message;
    this.iconEl.innerText = icon;

    this.actionsEl.innerHTML = '';
    const okBtn = document.createElement('button');
    okBtn.className = 'btn btn-gold';
    okBtn.innerText = 'VERSTANDEN';
    okBtn.onclick = () => {
      this.close();
    };
    this.actionsEl.appendChild(okBtn);
    this.modalEl.classList.remove('hidden');
  }

  showConfirm(title, message, onConfirm, icon = '⚔️') {
    state.isInputLocked = true;
    this.titleEl.innerText = title;
    this.msgEl.innerText = message;
    this.iconEl.innerText = icon;

    this.actionsEl.innerHTML = '';

    const yesBtn = document.createElement('button');
    yesBtn.className = 'btn btn-danger';
    yesBtn.innerText = 'BESTÄTIGEN';
    yesBtn.onclick = () => {
      this.close();
      onConfirm();
    };

    const noBtn = document.createElement('button');
    noBtn.className = 'btn';
    noBtn.innerText = 'ABBRECHEN';
    noBtn.onclick = () => {
      this.close();
    };

    this.actionsEl.appendChild(yesBtn);
    this.actionsEl.appendChild(noBtn);
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
    state.isInputLocked = false;
  }
}

export const modalManager = new ModalManager();

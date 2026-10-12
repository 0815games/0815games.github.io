// [2026-10-12 18:55] - js/ui/modalManager.js: v0.0.9 Sichere Dialog- und Benachrichtigungsverwaltung
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
    if (!this.modalEl) return;
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
    if (!this.modalEl) return;
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
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
    state.isInputLocked = false;
  }
}

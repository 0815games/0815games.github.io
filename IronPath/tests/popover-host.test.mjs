import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mountOverlayPopover } from '../popover-host.mjs';

function makeTree() {
  const createNode = (tagName, id = '') => {
    const attrs = new Map();
    const node = {
      tagName,
      id,
      nodeType: 1,
      parentNode: null,
      children: [],
      listeners: new Map(),
      getAttribute(k) { return attrs.has(k) ? attrs.get(k) : null; },
      hasAttribute(k) { return attrs.has(k); },
      setAttribute(k, v) { attrs.set(k, String(v)); },
      removeAttribute(k) { attrs.delete(k); },
      addEventListener(type, fn) {
        if (!this.listeners.has(type)) this.listeners.set(type, []);
        this.listeners.get(type).push(fn);
      },
      dispatch(type) {
        for (const fn of this.listeners.get(type) ?? []) fn({ type, target: this });
      },
      appendChild(child) {
        if (child.parentNode) {
          const i = child.parentNode.children.indexOf(child);
          if (i >= 0) child.parentNode.children.splice(i, 1);
        }
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      insertBefore(child, ref) {
        if (!ref) return this.appendChild(child);
        if (child.parentNode) {
          const i = child.parentNode.children.indexOf(child);
          if (i >= 0) child.parentNode.children.splice(i, 1);
        }
        const idx = this.children.indexOf(ref);
        child.parentNode = this;
        if (idx >= 0) this.children.splice(idx, 0, child);
        else this.children.push(child);
        return child;
      },
      get nextSibling() {
        if (!this.parentNode) return null;
        const i = this.parentNode.children.indexOf(this);
        return i >= 0 ? (this.parentNode.children[i + 1] ?? null) : null;
      },
    };
    return node;
  };

  const body = createNode('BODY');
  const armoryDialog = createNode('DIALOG', 'armoryDialog');
  const skillDialog = createNode('DIALOG', 'skillDialog');
  const firstRunGuide = createNode('ASIDE', 'firstRunGuide');
  const anchor = createNode('DIV', 'afterGuide');
  body.appendChild(armoryDialog);
  body.appendChild(skillDialog);
  body.appendChild(firstRunGuide);
  body.appendChild(anchor);

  let popoverCalls = 0;
  firstRunGuide.hidden = true;
  firstRunGuide.showPopover = () => { popoverCalls++; };

  const doc = {
    body,
    listeners: new Map(),
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(fn);
    },
    querySelectorAll(sel) {
      if (sel !== 'dialog[open]') return [];
      return [armoryDialog, skillDialog].filter(d => d.hasAttribute('open'));
    },
    dispatchCapture(type, target) {
      for (const fn of this.listeners.get(type) ?? []) fn({ type, target });
    },
  };

  return { doc, body, armoryDialog, skillDialog, firstRunGuide, anchor, getPopoverCalls: () => popoverCalls };
}

test('mountOverlayPopover hosts visible popovers inside the topmost open modal <dialog> and restores home cleanly', () => {
  const { doc, body, armoryDialog, skillDialog, firstRunGuide, getPopoverCalls } = makeTree();

  // No open dialog -> stays directly in <body>
  firstRunGuide.hidden = false;
  mountOverlayPopover(doc, firstRunGuide, { visible: true });
  assert.equal(firstRunGuide.parentNode, body);

  // Modal dialog opens -> popover moves inside it so it is never inert in top layer
  armoryDialog.setAttribute('open', '');
  mountOverlayPopover(doc, firstRunGuide, { visible: true });
  assert.equal(firstRunGuide.parentNode, armoryDialog);

  // Second stacked modal dialog opens -> topmost dialog becomes the host
  skillDialog.setAttribute('open', '');
  mountOverlayPopover(doc, firstRunGuide, { visible: true });
  assert.equal(firstRunGuide.parentNode, skillDialog);

  // Topmost dialog closes -> capture-phase close handler drops overlay safely onto underlying open dialog
  skillDialog.removeAttribute('open');
  doc.dispatchCapture('close', skillDialog);
  assert.equal(firstRunGuide.parentNode, armoryDialog);
  assert.ok(getPopoverCalls() >= 1);

  // Last dialog closes -> returns cleanly to original <body> slot right before #afterGuide
  armoryDialog.removeAttribute('open');
  doc.dispatchCapture('close', armoryDialog);
  assert.equal(firstRunGuide.parentNode, body);
  assert.equal(body.children.indexOf(firstRunGuide), 2);
});

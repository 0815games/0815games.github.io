// Keeps non-modal tutorial popovers (#firstRunGuide, #menuTour, #guideRecall)
// inside the topmost open modal <dialog> while one is active so WebKit / Safari
// and HTML top-layer inertness never block Minimize, Mute, or Next controls, and
// cleanly restores them back to their home DOM slot when modals close.

const slots = new WeakMap();
const tracked = new Map();
const watchedDocs = new WeakSet();

function rememberHome(node) {
  if (!node || slots.has(node)) return slots.get(node) || null;
  const parent = node.parentNode || null;
  const nextSibling = node.nextSibling || null;
  if (!parent) return null;
  const entry = { parent, nextSibling };
  slots.set(node, entry);
  return entry;
}

export function topmostOpenDialog(document) {
  if (!document) return null;
  if (typeof document.querySelectorAll === 'function') {
    const open = [...document.querySelectorAll('dialog[open]')];
    return open.at(-1) || null;
  }
  if (typeof document.querySelector === 'function') {
    return document.querySelector('dialog[open]') || null;
  }
  return null;
}

export function restorePopoverHome(node) {
  const home = slots.get(node);
  if (!home?.parent || node.parentNode === home.parent) return false;
  if (typeof home.parent.insertBefore === 'function' && home.nextSibling?.parentNode === home.parent) {
    home.parent.insertBefore(node, home.nextSibling);
    return true;
  }
  if (typeof home.parent.appendChild === 'function') {
    home.parent.appendChild(node);
    return true;
  }
  return false;
}

function syncVisibleNodes(document) {
  const host = topmostOpenDialog(document);
  const currentSet = tracked.get(document);
  if (!currentSet) return;
  for (const item of currentSet) {
    if (!item || item.hidden) continue;
    if (host) {
      if (item.parentNode !== host && typeof host.appendChild === 'function') {
        host.appendChild(item);
        try { item.showPopover?.(); } catch {}
      }
    } else if (restorePopoverHome(item)) {
      try { item.showPopover?.(); } catch {}
    }
  }
}

function registerDocWatcher(document, node) {
  if (!document || !node) return;
  let set = tracked.get(document);
  if (!set) {
    set = new Set();
    tracked.set(document, set);
  }
  set.add(node);
  if (watchedDocs.has(document)) return;
  watchedDocs.add(document);

  if (typeof document.addEventListener === 'function') {
    // <dialog> 'close' events do not bubble, so listen in capture phase.
    document.addEventListener('close', event => {
      const closing = event?.target;
      if (!closing || closing.tagName !== 'DIALOG') return;
      const currentSet = tracked.get(document);
      if (!currentSet) return;
      for (const item of currentSet) {
        if (!item || (closing !== item.parentNode && !closing.contains?.(item))) continue;
        const shouldShow = !item.hidden;
        const nextHost = topmostOpenDialog(document);
        if (nextHost && nextHost !== closing && typeof nextHost.appendChild === 'function') {
          nextHost.appendChild(item);
        } else {
          restorePopoverHome(item);
        }
        if (shouldShow) {
          try { item.showPopover?.(); } catch {}
        }
      }
    }, true);
  }

  if (typeof globalThis.MutationObserver === 'function' && document.documentElement) {
    try {
      const observer = new globalThis.MutationObserver(mutations => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.attributeName === 'open' && m.target?.tagName === 'DIALOG' && m.target.open) {
            syncVisibleNodes(document);
            break;
          }
        }
      });
      observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
    } catch { /* non-DOM mocks */ }
  }
}

export function mountOverlayPopover(document, node, { visible = true } = {}) {
  if (!node) return false;
  rememberHome(node);
  registerDocWatcher(document, node);
  if (!visible) {
    try { if (node.matches?.(':popover-open')) node.hidePopover?.(); } catch {}
    restorePopoverHome(node);
    return false;
  }
  const host = topmostOpenDialog(document);
  if (host && node.parentNode !== host && typeof host.appendChild === 'function') {
    host.appendChild(node);
  } else if (!host) {
    restorePopoverHome(node);
  }
  return true;
}

(() => {
"use strict";
function setup() {
if (document.getElementById("if-wave-controls")) return;
const start = document.getElementById("start");
const menu = document.getElementById("ui");
if (!start || !menu) {
console.error("Kompakte Steuerung: Menü oder Startbutton fehlt.");
return;
}
const speedButton = Array.from(menu.querySelectorAll("button")).find(button =>
/speed\s*=/.test(button.getAttribute("onclick") || "")
);
if (!speedButton) {
console.error("Kompakte Steuerung: Geschwindigkeitsbutton fehlt.");
return;
}
const row = document.createElement("div");
row.id = "if-wave-controls";
start.before(row);
row.append(start, speedButton);
speedButton.id = "if-speed-toggle";
speedButton.type = "button";
speedButton.removeAttribute("onclick");
function sync() {
const paused = speed === 0;
const fast = speed === 2;
const label = fast ? "2x" : "1x";
if (speedButton.textContent !== label) speedButton.textContent = label;
const state = fast ? "fast" : "normal";
if (speedButton.dataset.speed !== state) speedButton.dataset.speed = state;
speedButton.disabled = paused;
speedButton.title = paused ? "Spiel pausiert" : fast
? "Doppelte Geschwindigkeit – auf 1x wechseln"
: "Normale Geschwindigkeit – auf 2x wechseln";
speedButton.setAttribute("aria-label", speedButton.title);
}
speedButton.onclick = () => {
if (speed === 0) return;
speed = speed === 2 ? 1 : 2;
sync();
};
sync();
setInterval(sync, 250);
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", setup, {once:true});
} else setup();
})();
/* INKFALL_UI_NODE_POPOVER_V1 */
(() => {
"use strict";
function waveLabel(text, total) {
const match = text.match(/^(?:Nächste Welle (\d+) · (\d+) Gegner|Welle (\d+) · (\d+) übrig)$/);
return match ? `Welle ${match[1] || match[3]} von ${total} · ${match[2] || match[4]} Gegner` : text;
}
function popupPosition(anchor, bounds, width, height) {
const gap = 14, margin = 12;
const right = anchor.right + gap;
const leftCandidate = right + width <= bounds.right - margin
? right : anchor.left - gap - width;
return {
left: Math.max(bounds.left + margin, Math.min(leftCandidate, bounds.right - margin - width)),
top: Math.max(bounds.top + margin, Math.min(
(anchor.top + anchor.bottom - height) / 2,
bounds.bottom - margin - height
))
};
}
function setup() {
const bar = document.getElementById("if-window-titlebar");
const actions = document.getElementById("if-top-actions");
const row = document.getElementById("if-wave-controls");
const tree = document.getElementById("tree");
if (!bar || !actions || !row || !tree) {
console.error("UI-Erweiterung: Kopfleiste, Wellensteuerung oder Skilltree fehlt.");
return;
}
const oldParent = row.parentElement;
actions.append(row);
for (const button of row.querySelectorAll("button")) button.classList.add("if-top-action");
if (oldParent?.classList.contains("if-panel") &&
[...oldParent.children].every(child => child.tagName === "H2")) oldParent.hidden = true;
const style = document.createElement("style");
style.id = "if-node-popover-style";
style.textContent = `
#inkfall-window .if-panel[hidden] { display:none !important; }
#inkfall-window #if-window-titlebar #if-wave-controls {
display:flex; flex:0 1 auto; align-items:center; flex-wrap:wrap;
gap:7px; width:auto; min-width:0; margin:0; padding:0;
}
#inkfall-window #if-window-titlebar #if-wave-controls button {
width:auto; margin:0; min-height:35px;
}
#tree .if-tree-body { display:block; position:relative; flex:1; min-height:0; }
#tree .if-map-wrap { width:100%; height:100%; }
#tree #if-map { min-height:0; }
#tree #if-detail {
box-sizing:border-box; position:fixed; z-index:10;
width:max-content; max-width:min(340px, calc(100vw - 24px));
max-height:calc(100dvh - 24px); overflow:auto;
margin:0; padding:16px; border:2px solid #7785b0;
border-radius:14px; background:#20294ef5;
box-shadow:0 8px 28px #0008, inset 0 1px 0 #ffffff20;
transform-origin:var(--if-anchor-x, 0px) var(--if-anchor-y, 50%);
animation:if-node-popup-in 120ms ease-out;
overflow-wrap:anywhere;
}
#tree #if-detail[hidden] { display:none !important; }
#tree #if-detail h2 { font-size:20px; margin:8px 28px 8px 0; }
#tree #if-detail p { margin:8px 0; line-height:1.45; }
#tree #if-detail .if-popup-close {
position:absolute; right:7px; top:7px; width:30px; min-height:30px;
margin:0; padding:2px; border:0; box-shadow:none;
background:transparent; color:white; font-size:22px;
}
#tree #if-detail::before {
content:""; position:absolute; left:var(--if-anchor-x, 0px);
top:var(--if-anchor-y, 50%); width:7px; height:7px;
background:#ffe76c; border-radius:50%; pointer-events:none;
}
@keyframes if-node-popup-in {
from { opacity:0; transform:scale(.95); }
to { opacity:1; transform:scale(1); }
}
@media(prefers-reduced-motion:reduce) {
#tree #if-detail { animation:none; }
}
@media(pointer:coarse) {
#inkfall-window #if-window-titlebar #if-wave-controls button { min-height:44px; }
}
`;
document.head.append(style);
let dismissed = null;
let pending = false;
function schedule() {
if (pending) return;
pending = true;
requestAnimationFrame(() => { pending = false; update(); });
}
function closePopup() {
dismissed = tree.querySelector(".if-node.selected")?.dataset.node || null;
const panel = document.getElementById("if-detail");
if (panel) panel.hidden = true;
}
function update() {
const header = bar.querySelector(".if-wave-header-label");
if (header && typeof waves !== "undefined") {
const text = waveLabel(header.textContent, waves.length);
if (header.textContent !== text) header.textContent = text;
}
const panel = document.getElementById("if-detail");
if (!panel) return;
const node = tree.querySelector(".if-node.selected");
if (!tree.classList.contains("open") || !node || dismissed === node.dataset.node) {
panel.hidden = true;
return;
}
const map = tree.querySelector(".if-map-wrap");
if (!map) return;
if (panel.parentElement !== map) map.append(panel);
panel.setAttribute("role", "dialog");
panel.setAttribute("aria-label", "Fähigkeitsdetails");
if (!panel.querySelector(".if-popup-close")) {
const close = document.createElement("button");
close.type = "button";
close.className = "if-popup-close";
close.textContent = "×";
close.setAttribute("aria-label", "Fähigkeitsdetails schließen");
close.onclick = closePopup;
panel.prepend(close);
}
const anchor = node.getBoundingClientRect();
const bounds = map.getBoundingClientRect();
if (anchor.right < bounds.left || anchor.left > bounds.right ||
anchor.bottom < bounds.top || anchor.top > bounds.bottom) {
panel.hidden = true;
return;
}
panel.style.maxWidth = Math.max(1, Math.min(340, bounds.width - 24)) + "px";
panel.style.maxHeight = Math.max(1, bounds.height - 24) + "px";
panel.hidden = false;
const position = popupPosition(anchor, bounds, panel.offsetWidth, panel.offsetHeight);
panel.style.left = position.left + "px";
panel.style.top = position.top + "px";
panel.style.setProperty("--if-anchor-x", Math.max(3, Math.min(
panel.offsetWidth - 10, (anchor.left + anchor.right) / 2 - position.left
)) + "px");
panel.style.setProperty("--if-anchor-y", Math.max(3, Math.min(
panel.offsetHeight - 10, (anchor.top + anchor.bottom) / 2 - position.top
)) + "px");
}
new MutationObserver(schedule).observe(bar, {childList:true, subtree:true, characterData:true});
new MutationObserver(schedule).observe(tree, {
childList:true, subtree:true, characterData:true, attributes:true,
attributeFilter:["viewBox"]
});
if (typeof ResizeObserver !== "undefined") {
new ResizeObserver(schedule).observe(tree);
}
window.addEventListener("resize", schedule);
tree.addEventListener("click", event => {
if (event.target.closest?.("[data-node]")) dismissed = null;
else if (!event.target.closest?.("#if-detail")) closePopup();
schedule();
}, true);
tree.addEventListener("keydown", event => {
if ((event.key === "Enter" || event.key === " ") && event.target.closest?.("[data-node]")) {
dismissed = null;
schedule();
}
if (event.key === "Escape") {
const panel = document.getElementById("if-detail");
if (panel && !panel.hidden) {
event.preventDefault();
event.stopPropagation();
closePopup();
}
}
}, true);
schedule();
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", setup, {once:true});
} else setup();
})();

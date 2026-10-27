
/* INKFALL Constellarium: verwendet vorhandene TREE- und Save-Daten */
(() => {
  "use strict";

  const regions = [
    {name:"Klinge", color:"#ff617f", icon:"⚔"},
    {name:"Arkan", color:"#55dfff", icon:"✦"},
    {name:"Bastion", color:"#9bea59", icon:"⬟"},
    {name:"Schatten", color:"#bc8aff", icon:"◆"},
    {name:"Reichtum", color:"#ffd65b", icon:"✧"},
    {name:"Band", color:"#54efc2", icon:"∞"}
  ];

  const state = {
    selected:null, query:"",
    view:{x:-820,y:-700,w:1640,h:1400},
    previousSpeed:null, pointer:null
  };

  const esc = value => String(value).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const owned = id => Boolean(skills[id]);
  const byId = id => TREE.find(n => n.id === id);
  const colors = name => regions.find(r => r.name === name)?.color || "#fff";

  function layout() {
    const nodes = [];
    regions.forEach((region,index) => {
      const angle = -Math.PI/2 + index*Math.PI/3;
      TREE.filter(n => n.region === region.name).forEach((node,i) => {
        const radius = 175 + i*112;
        const bend = i === 0 ? 0 : (i%2 ? .13 : -.10);
        nodes.push({
          ...node,
          x:Math.cos(angle+bend)*radius,
          y:Math.sin(angle+bend)*radius,
          color:region.color,
          icon:region.icon,
          capstone: !TREE.some(other => other.req === node.id)
        });
      });
    });
    return nodes;
  }

  function requiredPath(id) {
    const result = [], visited = new Set();
    let node = byId(id);
    while(node && !owned(node.id) && !visited.has(node.id)) {
      visited.add(node.id);
      result.unshift(node);
      node = byId(node.req);
    }
    return result;
  }

  function applyView() {
    const svg = document.getElementById("if-map");
    if(svg) {
      const v = state.view;
      svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
    }
  }

  function overview() {
    state.view = {x:-820,y:-700,w:1640,h:1400};
    applyView();
  }

  function render() {
    const container = document.getElementById("treeContent");
    if(!container) return;

    container.innerHTML = `
      <header class="if-tree-head">
        <div class="if-tree-title">
          <h2>Tinten-Constellarium</h2>
          <small>${skillPoints} Skillpunkte · ${Object.keys(skills).length}
          / ${TREE.length} gelernt</small>
        </div>
        <input id="if-search" aria-label="Skills suchen"
          placeholder="Skills suchen …" value="${esc(state.query)}">
        <button id="if-overview">Gesamtansicht</button>
        <button id="if-center">Zum Helden</button>
        <button id="if-close">Schließen</button>
      </header>
      <div class="if-tree-body">
        <div class="if-map-wrap">
          <svg id="if-map" class="if-map"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Skillkarte">
          </svg>
          <div class="if-map-help">
            Ziehen: Karte verschieben · Mausrad: Zoom ·
            Knoten anklicken: Details · ✓ gelernt ·
            Gelb gestrichelt: Weg zum ausgewählten Ziel
          </div>
        </div>
        <aside id="if-detail" class="if-detail"></aside>
      </div>`;

    document.getElementById("if-close").onclick = window.closeTree;
    document.getElementById("if-overview").onclick = overview;
    document.getElementById("if-center").onclick = () => {
      state.view = {x:-400,y:-330,w:800,h:660};
      applyView();
    };
    document.getElementById("if-search").oninput = event => {
      state.query = event.target.value;
      drawMap();
    };

    drawMap();
    bindNavigation();
  }

  function drawMap() {
    const svg = document.getElementById("if-map");
    if(!svg) return;

    const nodes = layout();
    const positions = new Map(nodes.map(n => [n.id,n]));
    const planned = new Set(requiredPath(state.selected).map(n => n.id));
    const query = state.query.trim().toLocaleLowerCase("de");

    let markup = `
      <defs>
        <filter id="if-glow" x="-75%" y="-75%" width="250%" height="250%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>`;

    for(const n of nodes) {
      const parent = positions.get(n.req) || {x:0,y:0};
      const learned = owned(n.id);
      const targetPath = planned.has(n.id);
      markup += `<path class="if-link ${learned?"learned":targetPath?"planned":""}"
        style="${learned?`stroke:${n.color}`:""}"
        d="M ${parent.x} ${parent.y} L ${n.x} ${n.y}"/>`;
    }

    regions.forEach((r,i) => {
      const angle = -Math.PI/2+i*Math.PI/3;
      markup += `<text class="if-region-label"
        x="${Math.cos(angle)*690}" y="${Math.sin(angle)*690}"
        fill="${r.color}">${esc(r.name)}</text>`;
    });

    markup += `
      <g>
        <circle cx="0" cy="0" r="65" fill="#ffe76c"
          stroke="#090e23" stroke-width="7"/>
        <circle cx="0" cy="0" r="76" fill="none"
          stroke="#ffe76c" stroke-width="3" opacity=".6"/>
        <text x="0" y="-5" text-anchor="middle"
          fill="#141c38" font-size="26" font-weight="900">HELD</text>
        <text x="0" y="22" text-anchor="middle"
          fill="#141c38" font-size="13">DEIN ANFANG</text>
      </g>`;

    for(const n of nodes) {
      const learned = owned(n.id);
      const reachable = !n.req || owned(n.req);
      const affordable = skillPoints >= n.cost;
      const matches = !query ||
        `${n.name} ${n.desc} ${n.region}`.toLocaleLowerCase("de").includes(query);

      const fill = learned ? n.color : reachable ? "#304368" : "#202c49";
      const shape = n.capstone
        ? `<path class="node-body" fill="${fill}"
            d="M ${n.x} ${n.y-33} L ${n.x+32} ${n.y}
            L ${n.x} ${n.y+33} L ${n.x-32} ${n.y} Z"/>`
        : `<circle class="node-body" cx="${n.x}" cy="${n.y}"
            r="27" fill="${fill}"/>`;

      markup += `
        <g class="if-node ${learned?"owned":reachable&&affordable?"available":""}
          ${state.selected===n.id?"selected":""}"
          data-node="${esc(n.id)}" tabindex="0" role="button"
          aria-label="${esc(n.name)}: ${learned?"gelernt":n.cost+" Skillpunkte"}"
          opacity="${matches?1:.17}">
          <title>${esc(n.name)} — ${esc(n.desc)}</title>
          <circle class="node-ring" cx="${n.x}" cy="${n.y}" r="37"
            stroke="${learned||reachable&&affordable?n.color:"#425477"}"/>
          ${shape}
          <circle class="selection-ring" cx="${n.x}" cy="${n.y}" r="44"/>
          <text x="${n.x}" y="${n.y+8}" font-size="23">
            ${learned?"✓":esc(n.icon)}
          </text>
          <text x="${n.x}" y="${n.y+58}" font-size="12">
            ${learned?"✓":n.cost+" SP"}
          </text>
        </g>`;
    }

    svg.innerHTML = markup;
    applyView();

    svg.querySelectorAll("[data-node]").forEach(element => {
      const select = () => {
        state.selected = element.dataset.node;
        drawMap();
      };
      element.onclick = event => {
        event.stopPropagation();
        if(!state.didDrag) select();
      };
      element.onkeydown = event => {
        if(event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      };
    });

    drawDetails();
  }

  function drawDetails() {
    const panel = document.getElementById("if-detail");
    const node = byId(state.selected);

    if(!node) {
      panel.innerHTML = `
        <span class="if-tag">Deine Entwicklung</span>
        <h2>Wähle deinen Weg.</h2>
        <p>Wähle einen Knoten, um seine Wirkung,
        Voraussetzungen und Punktekosten zu sehen.</p>
        <p>Die farbigen Pfade zeigen bereits gelernte Skills.
        Große Rauten markieren die Endpunkte der aktuellen Äste.</p>
        <p>Dies ist der erste Karten-Prototyp mit den vorhandenen
        ${TREE.length} Skills. Echte zusätzliche Verzweigungen
        und neue Mechaniken folgen separat.</p>`;
      return;
    }

    const learned = owned(node.id);
    const reachable = !node.req || owned(node.req);
    const pathCost = requiredPath(node.id).reduce((sum,n) => sum+n.cost,0);
    const parent = byId(node.req);

    panel.innerHTML = `
      <span class="if-tag" style="color:${colors(node.region)}">
        ${esc(node.region)}
      </span>
      <h2>${esc(node.name)}</h2>
      <p>${esc(node.desc)}</p>
      <p>Status: ${learned?"Gelernt ✓":reachable?"Erreichbar":"Noch gesperrt"}</p>
      <p>Kosten: ${node.cost} SP<br>
      Verfügbar: ${skillPoints} SP<br>
      Voraussetzung: ${parent?esc(parent.name):"Heldenkern"}<br>
      Verbleibender Weg zum Ziel: ${pathCost} SP</p>
      <button id="if-learn"
        ${learned||!reachable||skillPoints<node.cost?"disabled":""}>
        ${learned?"Bereits gelernt":"Skill lernen"}
      </button>`;

    document.getElementById("if-learn").onclick = () => {
      const current = byId(state.selected);
      if(!current || owned(current.id) ||
        (current.req&&!owned(current.req)) ||
        skillPoints<current.cost) return;

      skillPoints -= current.cost;
      skills[current.id] = true;
      if(typeof log === "function") log("Skill gelernt: "+current.name);
      if(typeof ui === "function") ui();
      render();
    };
  }

  function bindNavigation() {
    const svg = document.getElementById("if-map");

    svg.addEventListener("wheel", event => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const v = state.view;
      const factor = event.deltaY > 0 ? 1.12 : 1/1.12;
      const newWidth = Math.min(3000,Math.max(420,v.w*factor));
      const ratio = newWidth/v.w;

      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const mouse = point.matrixTransform(svg.getScreenCTM().inverse());

      state.view = {
        x:mouse.x-(mouse.x-v.x)*ratio,
        y:mouse.y-(mouse.y-v.y)*ratio,
        w:newWidth,
        h:v.h*ratio
      };
      applyView();
    }, {passive:false});

    svg.addEventListener("pointerdown", event => {
      if(event.button !== 0) return;
      state.didDrag = false;
      const matrix = svg.getScreenCTM().inverse();
      state.pointer = {
        x:event.clientX, y:event.clientY,
        start:{...state.view}, matrix
      };
    });

    svg.addEventListener("pointermove", event => {
      const pointer = state.pointer;
      if(!pointer) return;
      const dx = event.clientX-pointer.x;
      const dy = event.clientY-pointer.y;
      if(Math.hypot(dx,dy)<5 && !state.didDrag) return;
      state.didDrag = true;
      svg.classList.add("dragging");

      state.view.x = pointer.start.x -
        (pointer.matrix.a*dx+pointer.matrix.c*dy);
      state.view.y = pointer.start.y -
        (pointer.matrix.b*dx+pointer.matrix.d*dy);
      applyView();
    });
  }

  window.addEventListener("pointerup", () => {
    state.pointer = null;
    document.getElementById("if-map")?.classList.remove("dragging");
    setTimeout(() => { state.didDrag = false; },0);
  });

  window.openTree = function() {
    if(state.previousSpeed === null) state.previousSpeed = speed;
    speed = 0;
    document.getElementById("tree").classList.add("open");
    render();
  };

  window.closeTree = function() {
    document.getElementById("tree").classList.remove("open");
    if(state.previousSpeed !== null) speed = state.previousSpeed;
    state.previousSpeed = null;
  };

  window.renderTree = render;

  window.addEventListener("keydown", event => {
    if(event.key === "Escape" &&
      document.getElementById("tree")?.classList.contains("open")) {
      window.closeTree();
    }
  });
})();

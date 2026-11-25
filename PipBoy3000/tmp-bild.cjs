const {JSDOM} = require('jsdom'); const fs=require('fs');
(async()=>{
  const dom = new JSDOM(fs.readFileSync('index.html','utf8'), {runScripts:'outside-only', pretendToBeVisual:true,
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>null; }});
  const w=dom.window, doc=w.document;
  // Beide Fenster mit ihren echten Texten in eine Seite legen
  w.eval(`var Network={myId:'x'}; var Game={state:{view:'map',inDialog:false}};
          var UI={lastInputTime:Date.now(), log:function(){}, logout:function(){}};`);
  w.eval(fs.readFileSync('src/ui/ui_afk.js','utf8'));
  w.eval(`AFK.start(); UI.lastInputTime=Date.now()-5*60*1000; AFK.pruefen();
          document.getElementById('update-banner').hidden=false;
          document.getElementById('update-banner-text').textContent='NEUE VERSION 14.0.99 VERFÜGBAR';
          document.getElementById('update-banner-stand').textContent='AKTUELL 14.0.18';
          document.getElementById('update-banner-now').hidden=false;`);
  // Nur das AFK-Fenster allein betrachten
  const akf = doc.getElementById('afk-popup');
  const htmlAkf = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>${fs.readFileSync('style.css','utf8').split('/* --- LEICHEN')[0].replace(/@tailwind[^;]*;/g,'')}
    body{margin:0;background:#0a0a0a;font-family:'DejaVu Sans Mono',monospace}
    .popup-mitte{background:rgba(0,0,0,.55)} .popup-feld{color:#1aff1a}</style></head>
    <body style="height:520px">${akf.outerHTML.replace('hidden','')}</body></html>`;
  fs.writeFileSync('/tmp/look/afk.html', htmlFenster = htmlAkf);
  const upd = doc.getElementById('update-banner');
  const htmlUpd = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>${fs.readFileSync('style.css','utf8').split('/* --- LEICHEN')[0].replace(/@tailwind[^;]*;/g,'')}
    body{margin:0;background:#0a0a0a;font-family:'DejaVu Sans Mono',monospace}
    .popup-mitte{background:rgba(0,0,0,.55)} .popup-feld{color:#1aff1a}</style></head>
    <body style="height:520px">${upd.outerHTML.replace(' hidden ','')}</body></html>`;
  fs.writeFileSync('/tmp/look/upd.html', htmlUpd);
  console.log('geschrieben');
})();

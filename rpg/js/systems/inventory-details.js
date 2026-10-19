export function equipmentBonus(item){
 const val=Number.isFinite(item?.val)?item.val:0;
 if(item?.type==='weapon'||item?.stat==='atk')return {atk:val,def:0};
 if(['armor','shield','helmet','boots'].includes(item?.type))return {atk:0,def:val};
 return {atk:0,def:0};
}
export function compareEquipment(item,equipped,items){
 if(!item?.slot)return null;
 const id=equipped?.[item.slot],current=id==null?null:items[id];
 if(id!=null&&(!current||current.slot!==item.slot))return {invalid:true};
 const before=equipmentBonus(current),after=equipmentBonus(item);
 return {current,rows:['atk','def'].filter(key=>before[key]!==0||after[key]!==0).map(key=>({key,before:before[key],after:after[key],delta:after[key]-before[key]}))};
}
export function renderItemDetails(box,item,entry,equipped,items){
 box.replaceChildren();
 const add=(tag,text,parent=box)=>{const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;};
 add('p',item.desc||'Keine Beschreibung vorhanden.');
 add('p',`Wert: ${item.price??0} Gold · Bestand: ${entry.count}`);
 const comparison=compareEquipment(item,equipped,items);
 if(!comparison)return;
 if(comparison.invalid){add('p','Aktuell angelegte Ausrüstung ungültig; kein verlässlicher Vergleich möglich.');return;}
 add('p',comparison.current?`Angelegt: ${comparison.current.name}`:'Aktuell nichts angelegt');
 add('p',`Ausgewählt: ${item.name}`);
 const table=add('table','');table.style.cssText='width:100%;border-collapse:collapse;text-align:left';
 const head=add('tr','',add('thead','',table));
 ['Wert','Angelegt','Auswahl','Unterschied'].forEach(t=>add('th',t,head));
 const body=add('tbody','',table);
 for(const row of comparison.rows){
  const tr=add('tr','',body);
  add('th',row.key==='atk'?'Angriff':'Verteidigung',tr).scope='row';
  add('td',String(row.before),tr);add('td',String(row.after),tr);
  const delta=add('td',row.delta>0?`+${row.delta}`:String(row.delta),tr);
  delta.style.color=row.delta>0?'#81e6a3':row.delta<0?'#ff9696':'inherit';
  delta.setAttribute('aria-label',row.delta>0?`${row.delta} besser`:row.delta<0?`${-row.delta} schlechter`:'Unverändert');
 }
 if(!comparison.rows.length)add('p','Keine Änderung an Angriff oder Verteidigung.');
}

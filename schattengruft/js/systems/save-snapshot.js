export function createPersistentSnapshot(source){
 const slot=source.currentSlot;
 if(!Number.isInteger(slot)||slot<0||slot>3){
  throw new TypeError('Ungültiger Spielstandslot.');
 }
 for(const key of ['player','world','meta']){
  const value=source[key];
  if(!value||typeof value!=='object'||Array.isArray(value)){
   throw new TypeError(`Spielstand unvollständig: ${key}.`);
  }
 }
 // Nur persistente Daten lesen; insbesondere source.user nicht kopieren.
 return structuredClone({
  player:source.player,
  world:source.world,
  meta:source.meta,
  currentSlot:slot
 });
}

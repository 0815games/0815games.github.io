/* Nachtfahrt – datengetriebene Lieferroute und sichtbare Zielzone. */
export const MISSIONS=[
  {id:'kiosk',title:'Ein Licht für den Kiosk',sender:'Mara · Garage Nord',recipient:'Leyla · Nachtkiosk',cargo:'Ersatzlampen und Sicherungen',story:'Leylas Außenbeleuchtung ist ausgefallen. Bring die Kiste zum Nachtkiosk und halte im orange markierten Lieferfeld an.',x:-198,z:-120,pay:80,part:{id:'led-modul',name:'LED-Leuchtmodul'}},
  {id:'cafe',title:'Nachtschicht für das Café',sender:'Leyla · Nachtkiosk',recipient:'Enzo · Café Nova',cargo:'Frische Kaffeebohnen',story:'Enzos Nachtcrew wartet auf Nachschub. Bring die Bohnen zum Café und halte vor der Eingangstür an.',x:42,z:-120,pay:100,part:{id:'werkzeugset',name:'Kompaktes Werkzeugset'}},
  {id:'depot',title:'Letzte Fracht zum Depot',sender:'Enzo · Café Nova',recipient:'Sven · Nachtdepot',cargo:'Versiegelte Fahrzeugteile',story:'Sven muss noch vor Schichtende ein Teilepaket erhalten. Fahr zum Depot und übergib die Fracht im Lieferfeld.',x:162,z:120,pay:140,part:{id:'reifenset',name:'Performance-Reifensatz'}}
];
export function createMissionManager(THREE,scene,startStage=0,startActive=false){
  let stage=Math.min(MISSIONS.length,Math.max(0,Math.floor(startStage)||0));
  let active=Boolean(startActive)&&stage<MISSIONS.length,hold=0,justDelivered=false;
  const group=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.RingGeometry(6.3,7.4,40),new THREE.MeshBasicMaterial({color:0xffbe79,side:THREE.DoubleSide,transparent:true,opacity:.9}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.24;group.add(ring);
  const glow=new THREE.Mesh(new THREE.CylinderGeometry(2.8,2.8,.05,32),new THREE.MeshBasicMaterial({color:0xffa45e,transparent:true,opacity:.22,depthWrite:false}));
  glow.position.y=.21;group.add(glow);
  const beaconMat=new THREE.MeshBasicMaterial({color:0xffcf93,transparent:true,opacity:.55,depthWrite:false});
  const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,8,12),beaconMat);
  beacon.position.y=4;group.add(beacon);scene.add(group);
  function place(){
    group.visible=active&&stage<MISSIONS.length;
    if(stage<MISSIONS.length)group.position.set(MISSIONS[stage].x,0,MISSIONS[stage].z);
  }
  place();
  return {
    get stage(){return stage},get active(){return active},get done(){return stage>=MISSIONS.length},
    get current(){return MISSIONS[stage]||null},
    start(){if(active||stage>=MISSIONS.length||justDelivered)return false;active=true;hold=0;place();return true},
    advance(){if(!justDelivered)return false;stage++;justDelivered=false;active=false;hold=0;place();return true},
    update(x,z,speed,dt,now){
      if(stage>=MISSIONS.length)return {text:'Alle Lieferungen erledigt'};
      if(!active)return {text:'Nächste Nachricht mit E annehmen'};
      const mission=MISSIONS[stage],distance=Math.hypot(x-mission.x,z-mission.z);
      beaconMat.opacity=.36+.16*Math.sin(now*.003);
      if(distance>9||Math.abs(speed)>=1.8){
        hold=0;
        return {text:distance<9?'Im Lieferfeld anhalten':mission.recipient.split(' · ')[1]+' · '+Math.round(distance)+' m'};
      }
      hold=Math.min(1.2,hold+dt);
      if(hold>=1.2){
        active=false;justDelivered=true;group.visible=false;
        return {text:'Lieferung übergeben',completed:mission};
      }
      return {text:'Übergabe · '+Math.round(hold/1.2*100)+' %'};
    }
  };
}

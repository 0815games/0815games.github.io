// Presentation only. Neither this renderer nor its preview blocks Firebase,
// signs users out, fetches release state or proves that an update is installed.
const COPY={
  de:{
    header:'FUNKSTELLE · 0815 GAMES', eyebrow:'FELDMELDUNG // EINSATZSTATUS', caption:'DIE LINIE HÄLT',
    group:'Update-Ablauf', footnote:'Nicht bestätigter Fortschritt kann verloren gehen. Dein Konto bleibt erhalten.',
    maintenance:{kicker:'DIE STELLUNG WIRD VORBEREITET',title:'Einsatzpause',lead:'Wir bringen Iron Path auf den neuesten Stand. Anmeldung und Einsätze pausieren während des Updates.',steps:['Anmeldung pausiert','Update wird vorbereitet','Aktuelle Version laden'],status:'WARTUNG LÄUFT',detail:'Neue Version wird nach der Freigabe geladen.',current:2},
    unavailable:{kicker:'DIE FUNKVERBINDUNG WIRD GEPRÜFT',title:'Signal verloren',lead:'Der Einsatzstatus kann gerade nicht bestätigt werden. Anmeldung und Spiel bleiben bis zur Prüfung gesperrt.',steps:['Anmeldung vorübergehend pausiert','Verbindung wird geprüft','Auf Freigabe warten'],status:'KEIN SIGNAL',detail:'Die Verbindung wird erneut geprüft.',current:2},
    updating:{kicker:'NEUE BEFEHLE SIND EINGETROFFEN',title:'Fast bereit',lead:'Die aktuelle Version wird geladen. Gleich geht es zurück zur Anmeldung.',steps:['Update freigegeben','Alte Sitzung beendet','Aktuelle Version laden'],status:'VERSION WIRD GELADEN',detail:'Bitte dieses Fenster geöffnet lassen.',current:3}
  },
  en:{
    header:'FIELD SIGNAL · 0815 GAMES', eyebrow:'FIELD TRANSMISSION // OPERATION STATUS', caption:'HOLD THE LINE',
    group:'Update process', footnote:'Unconfirmed progress may be lost. Your account remains available.',
    maintenance:{kicker:'PREPARING THE POSITION',title:'Operation paused',lead:'We are bringing Iron Path up to date. Sign-in and operations are paused during the update.',steps:['Sign-in paused','Update being prepared','Load the latest version'],status:'MAINTENANCE IN PROGRESS',detail:'The new version loads after clearance.',current:2},
    unavailable:{kicker:'CHECKING THE FIELD SIGNAL',title:'Signal lost',lead:'The operation status cannot be confirmed right now. Sign-in and play remain paused until it can be checked.',steps:['Sign-in temporarily paused','Checking the connection','Waiting for clearance'],status:'NO SIGNAL',detail:'The connection will be checked again.',current:2},
    updating:{kicker:'NEW ORDERS HAVE ARRIVED',title:'Almost ready',lead:'The latest version is loading. You will return to sign-in shortly.',steps:['Update cleared','Previous session ended','Load the latest version'],status:'LOADING NEW VERSION',detail:'Please keep this window open.',current:3}
  }
};

export function renderMaintenanceView(document, {state='maintenance', lang='en'} = {}) {
  if (!['maintenance','unavailable','updating'].includes(state) || !Object.hasOwn(COPY,lang)) throw Error('Invalid maintenance view');
  const copy=COPY[lang], phase=copy[state];
  const set=(id,value)=>{const node=document.getElementById(id);if(!node)throw Error(`Missing maintenance element: ${id}`);node.textContent=value;};
  document.documentElement.lang=lang;
  set('headerText',copy.header);set('eyebrow',copy.eyebrow);set('captionText',copy.caption);
  set('kicker',phase.kicker);set('titleText',phase.title);set('lead',phase.lead);
  phase.steps.forEach((text,index)=>set(`step${index+1}`,text));
  set('statusText',phase.status);set('statusDetail',phase.detail);set('footnote',copy.footnote);
  const group=document.getElementById('stepGroup');group.setAttribute('aria-label',copy.group);
  for(const index of [2,3])document.getElementById(`step${index}Row`).classList.toggle('is-current',index===phase.current);
}

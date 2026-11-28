// Keep the login usable as an error screen even if the Firebase CDN fails.
globalThis.__adminEntryStage='importing';
try{await import('./core/admin-firebase.mjs?v=20261121-adminacc1');globalThis.__adminEntryStage='loaded';}
catch(error){globalThis.__adminEntryStage='failed:'+String(error?.message||error);
 const button=document.getElementById('adminLoginButton'),message=document.getElementById('adminLoginMessage');
 if(button){button.disabled=true;button.textContent='VERBINDUNG NICHT VERFÜGBAR';}
 if(message)message.textContent='Die Admin-Verbindung konnte nicht geladen werden. Prüfe die Verbindung und lade diese Seite erneut.';
}

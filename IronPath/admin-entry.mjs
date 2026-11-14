// Keep the login usable as an error screen even if the Firebase CDN fails.
try{await import('./admin-firebase.mjs?v=20261031-update2');}
catch{
 const button=document.getElementById('adminLoginButton'),message=document.getElementById('adminLoginMessage');
 if(button){button.disabled=true;button.textContent='VERBINDUNG NICHT VERFÜGBAR';}
 if(message)message.textContent='Die Admin-Verbindung konnte nicht geladen werden. Prüfe die Verbindung und lade diese Seite erneut.';
}

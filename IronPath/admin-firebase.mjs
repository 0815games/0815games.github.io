import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {initializeAuth,browserSessionPersistence,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getDatabase,ref,get,onValue,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import {createAdminPanel} from './admin-panel.mjs?v=20261031-update2';

// The HTML contains only public Firebase web configuration, not an admin key.
// A distinct named app plus session-only Auth avoids replacing or signing out
// the game's default, locally persisted Firebase account in another tab.
const meta=name=>document.querySelector(`meta[name="ironpath-admin-${name}"]`)?.content;
const config={apiKey:meta('api-key'),authDomain:meta('auth-domain'),databaseURL:meta('database-url'),projectId:meta('project-id'),appId:meta('app-id')};
if(!Object.values(config).every(value=>typeof value==='string'&&value.length>0)||config.authDomain!==`${config.projectId}.firebaseapp.com`)throw Error('Invalid admin Firebase configuration');
const app=initializeApp(config,'ironpath-maintenance-admin');
const auth=initializeAuth(app,{persistence:browserSessionPersistence});
const db=getDatabase(app);
createAdminPanel({document,window,auth,db,databaseUrl:config.databaseURL,
 sdk:{onAuthStateChanged,signInWithEmailAndPassword,signOut,ref,get,onValue,runTransaction,serverTimestamp}});

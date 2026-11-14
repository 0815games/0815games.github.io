// Lightweight first step: the maintenance message must not depend on the
// Firebase SDK or any profile data loading successfully. Only after a fresh
// public status permits entry do we fetch/evaluate the full account module.
import {startMaintenanceBoot} from './maintenance-bootstrap.mjs?v=20261031-update1';

const databaseUrl=document.querySelector('meta[name="ironpath-maintenance-database"]')?.content;
const boot=startMaintenanceBoot({document,window,databaseUrl});
window.ironPathLoaded=true;
await boot.first;
try{await import('./account.js?v=20261031-update1');}
catch{
 // A failed SDK or game module load is not a successful login. Keep the
 // document blocked and offer a full reload rather than an uncaught rejection.
 boot.ui.loadFailure();
}

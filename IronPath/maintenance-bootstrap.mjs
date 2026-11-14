// Start the Firebase-only status gate without importing the Firebase SDK. This
// lets a maintenance or connection message appear even if the SDK CDN fails.
// The normal account module reuses this exact gate and rechecks after the
// version probe; the separately staged legacy guard does not use it.
import {createMaintenanceUI} from './maintenance-ui.mjs?v=20261031-update1';

let active=null;
export function startMaintenanceBoot({document,window,databaseUrl}={}){
 if(active)throw Error('Maintenance boot already started');
 const ui=createMaintenanceUI({document,window,databaseUrl});
 active=Object.freeze({databaseUrl,ui,first:ui.waitForOpen()});
 return active;
}
export const getMaintenanceBoot=()=>active;

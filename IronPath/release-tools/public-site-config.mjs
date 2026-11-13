// Strictly public browser configuration for an isolated release-site candidate.
// This is NOT a place for Admin credentials, tokens or arbitrary environment
// variables. A reviewed deployment must still verify that these resources belong
// to the intended Firebase project and that the exchange uses the same database.
import {firebaseControlUrl} from './release-control.mjs';

const publicFirebaseKeys=new Set(['apiKey','authDomain','databaseURL','projectId','appId','messagingSenderId','storageBucket']);
const plainObject=value=>value!==null && typeof value==='object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value)===Object.prototype || Object.getPrototypeOf(value)===null);

export function validatePublicSiteConfig(value) {
  if(!plainObject(value) || Object.keys(value).length!==2 ||
      !Object.hasOwn(value,'firebase') || !Object.hasOwn(value,'sessionEndpoint') || !plainObject(value.firebase)) {
    throw Error('Invalid public release configuration');
  }
  const input=value.firebase;
  if(Object.keys(input).some(key=>!publicFirebaseKeys.has(key)) ||
      !['apiKey','authDomain','databaseURL','projectId'].every(key=>Object.hasOwn(input,key)) ||
      typeof input.projectId!=='string' || !/^[a-z][a-z0-9-]{4,29}$/.test(input.projectId) ||
      typeof input.apiKey!=='string' || !/^[A-Za-z0-9_-]{3,256}$/.test(input.apiKey) ||
      input.authDomain!==`${input.projectId}.firebaseapp.com` || typeof input.databaseURL!=='string') {
    throw Error('Invalid public release configuration');
  }
  try{firebaseControlUrl(input.databaseURL);}catch{throw Error('Invalid public release configuration');}
  if(Object.hasOwn(input,'appId') && (typeof input.appId!=='string' || !/^1:[0-9]{1,20}:web:[a-zA-Z0-9]{1,64}$/.test(input.appId))) {
    throw Error('Invalid public release configuration');
  }
  if(Object.hasOwn(input,'messagingSenderId') && (typeof input.messagingSenderId!=='string' || !/^[0-9]{1,20}$/.test(input.messagingSenderId))) {
    throw Error('Invalid public release configuration');
  }
  if(Object.hasOwn(input,'storageBucket') && (typeof input.storageBucket!=='string' ||
      !/^[a-z0-9][a-z0-9.-]{2,200}$/.test(input.storageBucket) || input.storageBucket.includes('..'))) {
    throw Error('Invalid public release configuration');
  }
  let endpoint;
  try{endpoint=new URL(value.sessionEndpoint);}catch{throw Error('Invalid public release configuration');}
  if(typeof value.sessionEndpoint!=='string' || endpoint.href!==value.sessionEndpoint || endpoint.protocol!=='https:' ||
      endpoint.username || endpoint.password || endpoint.pathname!=='/api/session' || endpoint.search || endpoint.hash) {
    throw Error('Invalid public release configuration');
  }
  // Stable field ordering makes the launcher's copy comparable to the exact
  // per-build copy; unknown fields cannot accidentally be packaged as secrets.
  const firebase={apiKey:input.apiKey,authDomain:input.authDomain,databaseURL:input.databaseURL,projectId:input.projectId};
  for(const key of ['appId','messagingSenderId','storageBucket'])if(Object.hasOwn(input,key))firebase[key]=input[key];
  return Object.freeze({firebase:Object.freeze(firebase),sessionEndpoint:endpoint.href});
}

// The launcher, guarded document and operator checker must agree on transport.
// Plain HTTP is only accepted for loopback emulators/local tests.
export function validateSiteOrigin(origin) {
  let url;
  try{url=new URL(origin);}catch{throw Error('Invalid site origin');}
  if(url.origin!==origin || url.username || url.password ||
      !(url.protocol==='https:' || (url.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname)))) {
    throw Error('Invalid site origin');
  }
  return url.origin;
}

export function formatPublicSiteConfig(value) {
  const config=validatePublicSiteConfig(value);
  return `// Public browser settings only. Never put service credentials in this file.\nexport default ${JSON.stringify(config)};\n`;
}

// The normal game has a public default Firebase config in account.js. Guarded
// staging replaces the uniquely marked line with its target project's public
// settings, so a test artifact does not carry the game's production fallback.
export const ACCOUNT_CONFIG_MARKER='// @ironpath-account-firebase-config';
export function formatGuardedAccountConfig(value) {
  const {firebase}=validatePublicSiteConfig(value);
  return ` config:${JSON.stringify(firebase)}, ${ACCOUNT_CONFIG_MARKER}`;
}

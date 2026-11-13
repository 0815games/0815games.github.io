// Vercel Node function candidate. Nothing is deployed or enabled by this file.
// It uses a dedicated signing identity; NEVER log the request, token, config or
// service-account key. CORS is not an authorization or abuse-control boundary.
import {cert, initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {createReleaseSessionHttpHandler} from '../session-http.mjs';
import {controlUrl, createConfiguredSessionExchange} from '../session-service.mjs';

export function readServiceConfig(env) {
  const projectId = env.IRONPATH_FIREBASE_PROJECT_ID;
  const databaseUrl = env.IRONPATH_FIREBASE_DATABASE_URL;
  const origin = env.IRONPATH_GAME_ORIGIN;
  if (typeof projectId !== 'string' || !/^[a-z][a-z0-9-]{4,29}$/.test(projectId)) throw Error('Invalid service configuration');
  controlUrl(databaseUrl);
  let originUrl;
  try { originUrl = new URL(origin); } catch { throw Error('Invalid service configuration'); }
  if (originUrl.protocol !== 'https:' || originUrl.origin !== origin || originUrl.username || originUrl.password) {
    throw Error('Invalid service configuration');
  }
  if (env.FIREBASE_AUTH_EMULATOR_HOST || env.FIREBASE_DATABASE_EMULATOR_HOST) {
    throw Error('Emulator configuration is not accepted by the deployed service');
  }
  let serviceAccount;
  try { serviceAccount = JSON.parse(env.IRONPATH_FIREBASE_SERVICE_ACCOUNT); }
  catch { throw Error('Invalid service configuration'); }
  if (!serviceAccount || serviceAccount.type !== 'service_account' || serviceAccount.project_id !== projectId ||
      typeof serviceAccount.client_email !== 'string' || !serviceAccount.client_email.endsWith(`@${projectId}.iam.gserviceaccount.com`) ||
      typeof serviceAccount.private_key !== 'string' || !serviceAccount.private_key.startsWith('-----BEGIN PRIVATE KEY-----\n') ||
      !serviceAccount.private_key.includes('-----END PRIVATE KEY-----')) {
    throw Error('Invalid service configuration');
  }
  return {projectId, databaseUrl, origin, serviceAccount};
}

let handler, exchange;
function getHandler() {
  if (handler) return handler;
  const config = readServiceConfig(process.env);
  // Only the Auth Admin SDK is initialized. The public REST status reader does
  // not grant the function privileged access to Realtime Database contents.
  const app = initializeApp({projectId:config.projectId, credential:cert(config.serviceAccount)}, 'ironpath-release-service');
  exchange = createConfiguredSessionExchange({databaseUrl:config.databaseUrl, adminAuth:getAuth(app)});
  handler = createReleaseSessionHttpHandler({exchange, allowedOrigins:[config.origin], route:'/api/session'});
  return handler;
}

export default async function session(request, response) {
  // Do not expose config, thrown error messages, credentials or input. This
  // path also fails closed before Firebase or the Vercel project is configured.
  const unavailable = () => {
    if (!response.writableEnded && !response.destroyed) {
      response.writeHead(503, {'cache-control':'no-store', 'content-type':'application/json; charset=utf-8', 'x-content-type-options':'nosniff'});
      response.end('{"status":"unavailable"}');
    }
  };
  try {
    const handle = getHandler();
    await new Promise(resolve => {
      response.once('finish', resolve);
      response.once('close', resolve);
      try { handle(request, response); } catch { request.resume(); unavailable(); }
    });
  } catch { request.resume(); unavailable(); }
}

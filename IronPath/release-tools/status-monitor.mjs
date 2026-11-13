import {CONTROL_PATH, parseReleaseControl} from './release-control.mjs';

// Candidate for the future bootstrap / standalone maintenance page; not wired
// into the published game. A successful, fresh REST response is required on
// every check. Failure, an unknown record, a timeout, or a listener error must
// block the UI; a caller must also stop its SDK/game and replace the document.
// no-store cannot defeat a malicious service worker or prove browser integrity.
// onFatal is a required last-resort teardown if the onStatus consumer throws.
export function createReleaseStatusMonitor({statusUrl, onStatus, onFatal, fetcher=globalThis.fetch,
  intervalMs=5000, timeoutMs=8000} = {}) {
  let url;
  try { url = new URL(statusUrl); } catch { throw Error('Invalid status URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !url.pathname.endsWith(`/${CONTROL_PATH}.json`)) throw Error('Invalid status URL');
  if (typeof onStatus !== 'function' || typeof onFatal !== 'function' || typeof fetcher !== 'function' ||
      !Number.isInteger(intervalMs) || intervalMs < 1000 ||
      !Number.isInteger(timeoutMs) || timeoutMs < 1) throw Error('Invalid monitor configuration');

  let running=false, timer=null, active=null, generation=0;
  function stop() {
    running=false;generation++;clearTimeout(timer);timer=null;
    const previous=active;active=null;previous?.controller.abort();
  }
  function publish(value) {
    if (!running) return;
    try { onStatus(value); }
    catch (error) {
      // Do not leave polling running while a consumer may have failed halfway
      // through a transition. onFatal must synchronously initiate safe teardown.
      stop();
      try { onFatal(error); } catch {/* No monitor can repair a broken teardown callback. */}
    }
  }
  async function check(run) {
    const {controller}=run;let deadline;
    try {
      const work=(async()=>{
        const response=await fetcher(url.href, {method:'GET', cache:'no-store', credentials:'omit',
          mode:'cors', redirect:'error', referrerPolicy:'no-referrer', signal:controller.signal});
        if (!response?.ok) throw Error('status unavailable');
        const control=parseReleaseControl(await response.json());
        if (!control) throw Error('invalid status');
        return control;
      })();
      // A fetch double or broken implementation may ignore AbortSignal. The
      // abort race also permits a stopped monitor to restart immediately.
      const aborted=new Promise((_,reject)=>{
        if(controller.signal.aborted) reject(Error('status aborted'));
        else controller.signal.addEventListener('abort',()=>reject(Error('status aborted')),{once:true});
      });
      deadline=setTimeout(()=>controller.abort(),timeoutMs);
      const release=await Promise.race([work,aborted]);
      if (running && generation===run.generation) publish({kind:release.mode, release});
    } catch {
      if (running && generation===run.generation) publish({kind:'unavailable'});
    } finally { clearTimeout(deadline); }
  }
  function refresh() {
    if (!running) return Promise.resolve();
    if (active) return active.promise;
    clearTimeout(timer);timer=null;
    const run={generation,controller:new AbortController(),promise:null};
    active=run;
    run.promise=check(run).finally(()=>{
      if (active!==run) return; // A stop/restart owns a different generation.
      active=null;
      if (running && generation===run.generation) timer=setTimeout(()=>{timer=null;void refresh();},intervalMs);
    });
    return run.promise;
  }
  return Object.freeze({
    start(){if(running)return;running=true;generation++;publish({kind:'checking'});if(running)void refresh();},
    refresh,stop
  });
}

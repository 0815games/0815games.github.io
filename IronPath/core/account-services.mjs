// Account authentication boundary. The normal game still uses the existing
// Firebase SDK directly. A separately bootstrapped, guarded build may install a
// one-use session before importing account.js. This module alone does NOT turn
// on maintenance, publish rules, or protect any already-open game document.
export function requiresAccountGuard(marker) {
  if(marker===undefined)return false;
  if(marker==='required')return true;
  // A typo or empty marker in a future staged document must not silently
  // switch the account back to ordinary direct Firebase authentication.
  throw Error('Invalid guarded document marker');
}

export function createAccountServicesRegistry() {
  let installed=null,claimed=false;
  return Object.freeze({
    installGuarded({session,signal} = {}) {
      const methods=['onAuthStateChanged','signIn','register','resetPassword','logout'];
      if (claimed || installed || !session?.auth || !session?.db ||
          !methods.every(name=>typeof session[name]==='function') ||
          !signal || typeof signal.addEventListener!=='function' || signal.aborted) {
        throw Error('Invalid guarded account session');
      }
      installed={session,signal};
    },
    create({config,sdk,requireGuard=false} = {}) {
      if(claimed || typeof requireGuard!=='boolean')throw Error('Account services already claimed or invalid');
      if(installed) {
        const {session,signal}=installed;
        if(signal.aborted)throw Error('Guarded account session terminated');
        claimed=true;
        const alive=()=>{if(signal.aborted)throw Error('Guarded account session terminated');};
        return Object.freeze({
          guarded:true,auth:session.auth,db:session.db,signal,
          observe(next,onError){
            alive();
            if(typeof next!=='function' || (onError!==undefined && typeof onError!=='function'))throw Error('Invalid account observer');
            // The real guarded session fails closed on SDK observer errors and
            // aborts before notifying the game. Forward any session error that
            // arrives while still alive, but never deliver callbacks after abort.
            return session.onAuthStateChanged(user=>{if(!signal.aborted)next(user);},
              onError && (error=>{if(!signal.aborted)onError(error);}));
          },
          signIn:(email,password)=>{alive();return session.signIn(email,password);},
          register:(email,password)=>{alive();return session.register(email,password);},
          resetPassword:email=>{alive();return session.resetPassword(email);},
          logout:()=>session.logout()
        });
      }
      if(requireGuard)throw Error('Guarded account session required');
      const required=['initializeApp','getAuth','getDatabase','onAuthStateChanged',
        'signInWithEmailAndPassword','createUserWithEmailAndPassword','sendPasswordResetEmail','signOut'];
      if(!config || !required.every(name=>typeof sdk?.[name]==='function'))throw Error('Invalid Firebase account services');
      // Claim even on partial initialization: do not silently construct another
      // Firebase instance after a failed attempt in the same document.
      claimed=true;
      const app=sdk.initializeApp(config),auth=sdk.getAuth(app),db=sdk.getDatabase(app);
      return Object.freeze({
        guarded:false,auth,db,signal:null,
        observe:(next,onError)=>sdk.onAuthStateChanged(auth,next,onError),
        signIn:(email,password)=>sdk.signInWithEmailAndPassword(auth,email,password),
        register:(email,password)=>sdk.createUserWithEmailAndPassword(auth,email,password),
        resetPassword:email=>sdk.sendPasswordResetEmail(auth,email),
        logout:()=>sdk.signOut(auth)
      });
    }
  });
}

// Both the bootstrap and account.js must import this exact module URL. The
// versioned release directory isolates it from other builds and documents.
const registry=createAccountServicesRegistry();
export const installGuardedAccountSession=registry.installGuarded;
export const createAccountServices=registry.create;

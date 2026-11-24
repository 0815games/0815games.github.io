// Rotating dossier banner artwork on the sign-in screen.
// Advances sequentially on each login view / reload (persisted best-effort in
// localStorage) so returning players see a fresh painted outpost each time.
export const LOGIN_SCENE_STORAGE_KEY='ironpath:loginSceneIndex';
export const LOGIN_SCENE_VERSION='20261123-aim5';
export const LOGIN_SCENES=Object.freeze([
 'assets/login-bunker-watch.jpg',
 'assets/login-radio-rain.jpg',
 'assets/login-convoy-prep.jpg',
 'assets/login-tactical-map.jpg',
]);

let memoryIndex=-1;

export function nextLoginSceneIndex(storage=null){
 let prev=memoryIndex;
 try{
  const raw=storage?.getItem?.(LOGIN_SCENE_STORAGE_KEY);
  const parsed=raw===null||raw===undefined||raw===''?NaN:Number.parseInt(String(raw),10);
  if(Number.isInteger(parsed)&&parsed>=0)prev=parsed;
 }catch{/* Storage access can be blocked in privacy mode. */}
 const next=(Number.isInteger(prev)&&prev>=0?prev+1:0)%LOGIN_SCENES.length;
 memoryIndex=next;
 try{storage?.setItem?.(LOGIN_SCENE_STORAGE_KEY,String(next));}catch{}
 return next;
}

export function applyLoginScene({document,storage=null}={}){
 const index=nextLoginSceneIndex(storage);
 const src=`${LOGIN_SCENES[index]}?v=${LOGIN_SCENE_VERSION}`;
 const img=document?.getElementById?.('authSceneImg');
 if(img){
  if('src' in img)img.src=src;
  else img.setAttribute?.('src',src);
 }
 return {index,src};
}

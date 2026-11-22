// Experimental recovery reads must go to the database server, not the RTDB
// SDK's offline cache. Firebase ID tokens use the REST API's auth parameter.
// Never log this URL or propagate fetch errors that could contain the token.
export async function readRecoveryFromServer(reference,auth,{fetcher=globalThis.fetch,timeoutMs=10000}={}){
  const user=auth?.currentUser;if(!user||typeof user.getIdToken!=='function'||typeof fetcher!=='function')throw Error('Server checkpoint read unavailable');
  let url;try{url=new URL(reference.toString());}catch{throw Error('Invalid recovery database URL');}
  if(url.username||url.password||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname))))throw Error('Invalid recovery database URL');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const token=await user.getIdToken();if(auth.currentUser!==user||typeof token!=='string'||!token)throw Error('Identity changed');
    url.pathname=url.pathname.replace(/\/$/,'')+'.json';url.searchParams.set('auth',token);
    const response=await fetcher(url.toString(),{method:'GET',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal:controller.signal});
    if(!response.ok||auth.currentUser!==user)throw Error('Read failed');
    const result=await response.json();if(auth.currentUser!==user)throw Error('Identity changed');return result;
  }catch{throw Error('Server checkpoint read failed');}finally{clearTimeout(timer);}
}

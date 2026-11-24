// Read small, untrusted network responses without buffering an unbounded body.
// The caller owns its timeout/AbortController and must check the HTTP status.
export async function readBoundedBytes(response, maxBytes) {
  if (!response?.headers?.get || !response.body?.getReader ||
      !Number.isSafeInteger(maxBytes) || maxBytes < 1) throw Error('Invalid response');
  const length=response.headers.get('content-length');
  if(length && (!/^\d+$/.test(length) || Number(length)>maxBytes)){
    // Stop downloading an explicitly oversized response as early as possible.
    try{void response.body.cancel().catch(()=>{});}catch{}
    throw Error('Response too large');
  }
  const reader=response.body.getReader(),chunks=[];
  let size=0,finished=false;
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done){finished=true;break;}
      if(!(value instanceof Uint8Array))throw Error('Invalid response');
      size+=value.byteLength;
      if(size>maxBytes)throw Error('Response too large');
      chunks.push(value);
    }
  }finally{
    if(!finished)void reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return bytes;
}

export async function readBoundedJson(response, maxBytes) {
  const bytes=await readBoundedBytes(response,maxBytes);
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}

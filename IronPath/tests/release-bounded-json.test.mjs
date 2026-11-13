import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readBoundedJson} from '../release-tools/bounded-json.mjs';

test('reads a small UTF-8 JSON response across chunks',async()=>{
 const bytes=new TextEncoder().encode('{"signal":"bereit €"}');
 const body=new ReadableStream({start(controller){controller.enqueue(bytes.slice(0,7));controller.enqueue(bytes.slice(7));controller.close();}});
 assert.deepEqual(await readBoundedJson(new Response(body),128),{signal:'bereit €'});
});

test('rejects and cancels an oversized stream even without a content-length header',async()=>{
 let canceled=false;
 const body=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(9));},cancel(){canceled=true;}});
 await assert.rejects(readBoundedJson(new Response(body),8),/too large/);
 assert.equal(canceled,true);
});

test('rejects invalid lengths, invalid UTF-8, malformed JSON and missing bodies',async()=>{
 for(const response of [new Response('{}',{headers:{'content-length':'100'}}),
  new Response('{}',{headers:{'content-length':'abc'}}),new Response(new Uint8Array([0xff])),
  new Response('{'),new Response(null)]){
  await assert.rejects(readBoundedJson(response,8));
 }
});

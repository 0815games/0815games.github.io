import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {dogTag,dogTagSerial,dogTagIssueDate,dogTagBloodType,DOG_TAG_BRAND,renderDogTag} from '../dog-tag.mjs';

const soldier={name:'Ada Vale',gender:'female'};

test('the serial is derived from the account id and never invented',()=>{
 const a=dogTagSerial('uid-abc123');
 assert.match(a,/^[0-9A-F]{4}-[0-9A-F]{4}$/);
 assert.equal(dogTagSerial('uid-abc123'),a,'the same soldier always gets the same serial');
 assert.notEqual(dogTagSerial('uid-abc124'),a,'a different account gets a different serial');
 assert.equal(dogTagSerial(null),'0000-0000');
 assert.equal(dogTagSerial(undefined),'0000-0000');
 assert.equal(dogTagSerial(''),'0000-0000');
});

test('the tag carries name, gender, serial, brand and an issue date',()=>{
 const tag=dogTag({profile:soldier,accountId:'uid-abc123',issued:new Date('2026-03-09T12:00:00Z')});
 assert.equal(tag.name,'Ada Vale');
 assert.equal(tag.gender,'female');
 assert.equal(tag.serial,dogTagSerial('uid-abc123'));
 assert.equal(tag.brand,DOG_TAG_BRAND);
 assert.equal(tag.brand,'0815 GAMES · IRON PATH');
 assert.equal(tag.issued.text,'09.03.2026');
 assert.ok(Object.isFrozen(tag),'the tag is derived and immutable');
});

test('a missing profile or gender still yields a valid, honest tag',()=>{
 const tag=dogTag({profile:{name:'  Rook  ',gender:'colonel'},accountId:'x'});
 assert.equal(tag.name,'Rook','the name is trimmed');
 assert.equal(tag.gender,null,'an unknown gender draws no pictogram rather than guessing');
 assert.equal(dogTag({accountId:'x'}).name,'UNKNOWN');
 assert.equal(dogTag().serial,'0000-0000');
});

test('the issue date is stable input, not a clock read inside the tag',()=>{
 assert.equal(dogTagIssueDate(new Date(2026,0,1)).text,'01.01.2026');
 assert.equal(dogTagIssueDate(new Date('nonsense')).text,dogTagIssueDate(new Date()).text,'an invalid date falls back to today');
});

// A tiny DOM: enough to prove the SVG is built from the armory icon style and
// that nothing about the tag is written anywhere.
function fakeDocument(){
 const created=[];
 const make=tag=>{
  const node={tagName:tag,children:[],attributes:{},dataset:{},textContent:'',className:'',
   setAttribute(name,value){this.attributes[name]=String(value);},
   append(...kids){this.children.push(...kids);},
   replaceChildren(...kids){this.children=[...kids];}};
  created.push(node);return node;
 };
 return {created,createElement:make,createElementNS:(ns,tag)=>make(tag)};
}

test('rendering builds a tag in the armory icon style and writes nothing',()=>{
 const document=fakeDocument(),container=document.createElement('div');
 const tag=renderDogTag(document,container,{profile:{name:'Ada Vale',gender:'female'},accountId:'uid-abc123'});
 assert.equal(tag.className,'dog-tag');
 assert.equal(tag.dataset.serial,dogTagSerial('uid-abc123'),'the serial is on the element for styling and tests');
 const text=[];(function walk(node){if(node.textContent)text.push(node.textContent);for(const child of node.children||[])walk(child);})(tag);
 const joined=text.join(' | ');
 assert.match(joined,/ADA VALE|Ada Vale/);
 assert.match(joined,/0815 GAMES · IRON PATH/);
 assert.match(joined,new RegExp(dogTagSerial('uid-abc123')));
 assert.match(joined,/\d{2}\.\d{2}\.\d{4}/);
 const svgs=document.created.filter(node=>node.tagName==='svg');
 assert.ok(svgs.length>=2,'a gender pictogram and the armory badge are drawn as SVG');
 assert.ok(svgs.every(svg=>svg.attributes['aria-hidden']==='true'),'decorative art stays out of the a11y tree');
 assert.equal(document.created.filter(node=>node.tagName==='path').length>=2,true);
});

test('the caller can only render; the tag has no store of its own',()=>{
 const source=readFileSync(new URL('../dog-tag.mjs',import.meta.url),'utf8');
 assert.equal(/localStorage|sessionStorage|setItem|runTransaction|\.set\(/.test(source),false,'the dog tag never persists anything');
 assert.equal(/fetch\(|XMLHttpRequest/.test(source),false,'and it never asks a server');
});

test('the blood type is derived, spread over all eight types, and never stored',async()=>{
 const {BLOOD_TYPES}=await import('../dog-tag.mjs');
 assert.equal(BLOOD_TYPES.length,8);
 assert.deepEqual([...BLOOD_TYPES],['0 RH+','0 RH−','A RH+','A RH−','B RH+','B RH−','AB RH+','AB RH−']);
 const ids=Array.from({length:400},(_,i)=>`uid-${i}`);
 const seen=new Set(ids.map(id=>dogTag({accountId:id}).bloodType));
 assert.equal(seen.size,8,'every type actually occurs; the spread is not lopsided to one or two');
 for(const id of ids.slice(0,20))assert.equal(dogTag({accountId:id}).bloodType,dogTag({accountId:id}).bloodType,'the same soldier always reads the same');
 // No account id, no invented blood type.
 assert.equal(dogTagBloodType(null),null);
 assert.equal(dogTagBloodType(''),null);
 assert.equal(dogTag({profile:soldier}).bloodType,null,'a signed-out preview draws no blood type');
});

test('the blood type is not simply a slice of the serial',()=>{
 // Two accounts whose serials collide must still be able to differ, otherwise the
 // line would be decoration that leaks nothing but also says nothing new.
 const tags=Array.from({length:200},(_,i)=>dogTag({accountId:`acct-${i}`}));
 const pairs=tags.map(tag=>`${tag.serial}|${tag.bloodType}`);
 assert.ok(new Set(pairs).size>=190,'serial and blood type vary independently');
});

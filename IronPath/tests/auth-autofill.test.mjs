import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {setupAuthForm} from '../auth-form.mjs';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/<form id="authForm"[^>]*method="post"/);
assert.match(html,/<input id="email"[^>]*name="username"[^>]*type="email"[^>]*autocomplete="username"/);
assert.match(html,/<input id="password"[^>]*name="password"[^>]*type="password"[^>]*autocomplete="current-password"/);
assert.match(html,/<button id="authSubmit"[^>]*type="submit"/);
function element(){return {listeners:{},value:'',textContent:'',autocomplete:'',hidden:false,disabled:false,addEventListener(type,fn){this.listeners[type]=fn;}};}
const form=element(),email=element(),password=element(),submit=element(),register=element(),forgot=element(),calls=[],errors=[];
email.value=' soldier@example.com ';password.value='secret';let reject=false;
setupAuthForm({form,email,password,submit,register,forgot,onSignIn:async(...args)=>{calls.push(['login',...args]);if(reject)throw Error('bad');},onRegister:async(...args)=>calls.push(['register',...args]),onError:error=>errors.push(error)});
assert.equal(password.autocomplete,'current-password');assert.equal(submit.textContent,'SIGN IN');assert.equal(forgot.hidden,false);
let prevented=false;await form.listeners.submit({preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.deepEqual(calls[0],['login','soldier@example.com','secret']);assert.equal(submit.disabled,false);
register.listeners.click();assert.equal(password.autocomplete,'new-password');assert.equal(submit.textContent,'CREATE ACCOUNT');assert.equal(forgot.hidden,true);
await form.listeners.submit({preventDefault(){}});assert.deepEqual(calls[1],['register','soldier@example.com','secret']);
register.listeners.click();assert.equal(password.autocomplete,'current-password');assert.equal(forgot.hidden,false);
reject=true;await form.listeners.submit({preventDefault(){}});assert.equal(errors.at(-1).message,'bad');assert.equal(submit.disabled,false);assert.equal(password.value,'secret','failed sign-in leaves fields intact');
// A slow request cannot submit twice or switch modes until it settles.
let finish,slowCalls=0;const slow=new Promise(r=>{finish=r;}),form2=element(),submit2=element(),register2=element();
setupAuthForm({form:form2,email,password,submit:submit2,register:register2,forgot:element(),onSignIn:()=>{slowCalls++;return slow;},onRegister:()=>{},onError:()=>{}});
const pending=form2.listeners.submit({preventDefault(){}});assert.equal(submit2.disabled,true);register2.listeners.click();assert.equal(password.autocomplete,'current-password');await form2.listeners.submit({preventDefault(){}});assert.equal(slowCalls,1);finish();await pending;assert.equal(submit2.disabled,false);
const account=await readFile(new URL('../account.js',import.meta.url),'utf8');assert.ok(!account.includes("message('');$('password').value='';if(!currentUser)"),'initial signed-out auth callback must not erase AutoFill');assert.match(account,/setTimeout\(\(\)=>\{if\(auth\.currentUser\?\.uid===uid\)\$\('password'\)\.value='';\},1500\)/);
console.log('Sign-in and sign-up password-manager hints and submission tests passed.');
// Reported: "im Login-Screen steht teilweise noch englische Schrift" - the
// first paint is German, but switching between sign-in and account creation
// rewrote the buttons in hard-coded English. The mode switch must go through
// the dictionary like everything else.
const {productionModuleUrl}=await import('./production-module.mjs');
const {setupLanguage}=await import(productionModuleUrl('language.mjs'));
const languageNode=()=>({value:'',textContent:'',hidden:false,setAttribute(){},addEventListener(){},classList:{toggle(){},add(){},remove(){}}});
const savedDocument=globalThis.document;
globalThis.document={documentElement:{},getElementById:languageNode,querySelector:languageNode,querySelectorAll:()=>[],addEventListener(){},dispatchEvent(){}};
try{setupLanguage({document:globalThis.document,storage:{getItem:()=>'de'}});}finally{globalThis.document=savedDocument;}
const formDe=element(),emailDe=element(),passwordDe=element(),submitDe=element(),registerDe=element(),forgotDe=element();
setupAuthForm({form:formDe,email:emailDe,password:passwordDe,submit:submitDe,register:registerDe,forgot:forgotDe,onSignIn:async()=>{},onRegister:async()=>{}});
assert.equal(submitDe.textContent,'ANMELDEN','the German screen keeps German buttons');
registerDe.listeners.click();
assert.equal(submitDe.textContent,'KONTO ERSTELLEN');
assert.equal(registerDe.textContent,'ZURÜCK ZUR ANMELDUNG');
assert.equal(passwordDe.autocomplete,'new-password');
console.log('auth-autofill: German mode switch verified');

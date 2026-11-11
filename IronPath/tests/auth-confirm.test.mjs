import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {setupAuthForm} from '../auth-form.mjs';

// Point 3 of the list: "Passwort 2× + Gleichheitscheck". A typo in a hidden
// password field would lock the player out of the account they just created,
// so account creation asks for the password twice and refuses to submit on a
// mismatch - while plain sign-in never shows a second box.

function element(){
  return {listeners:{},value:'',textContent:'',autocomplete:'',hidden:false,disabled:false,required:false,focused:0,
    addEventListener(type,fn){this.listeners[type]=fn;},
    focus(){this.focused++;}};
}

function fixture({withConfirm=true}={}){
  const form=element(),email=element(),password=element(),submit=element(),register=element(),forgot=element();
  const confirm=withConfirm?element():null;
  const confirmField=withConfirm?element():null;
  const calls=[],errors=[];
  const ui=setupAuthForm({form,email,password,submit,register,forgot,confirm,confirmField,
    onSignIn:async(...args)=>{calls.push(['login',...args]);},
    onRegister:async(...args)=>{calls.push(['register',...args]);},
    onError:error=>errors.push(error)});
  return {ui,form,email,password,submit,register,forgot,confirm,confirmField,calls,errors};
}

test('the markup ships a hidden confirm field behind the password',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<div class="dossier-field" id="passwordConfirmField" hidden>/,'the field starts hidden');
  assert.match(html,/<input id="passwordConfirm" name="password-confirm" type="password" autocomplete="new-password"/,'password-manager purpose: a new password');
  assert.match(html,/data-i18n="auth.passwordConfirm"/,'the label is localized');
  const language=readFileSync(new URL('../language.mjs',import.meta.url),'utf8');
  assert.match(language,/'auth\.passwordConfirm':\{en:'CONFIRM PASSWORD',de:'PASSWORT BESTÄTIGEN'\}/);
});

test('the confirm box exists only while an account is created',()=>{
  const f=fixture();
  assert.equal(f.confirmField.hidden,true,'hidden in sign-in mode');
  assert.equal(f.confirm.required,false,'and not required, so native validation never blocks sign-in');
  f.register.listeners.click(); // switch to account creation
  assert.equal(f.confirmField.hidden,false,'visible in register mode');
  assert.equal(f.confirm.required,true,'and required');
  f.confirm.value='else';
  f.register.listeners.click(); // back to sign-in
  assert.equal(f.confirmField.hidden,true,'hidden again');
  assert.equal(f.confirm.value,'','a stale confirmation never leaks into the next attempt');
});

test('a mismatch refuses to create the account and says why',async()=>{
  const f=fixture();
  f.register.listeners.click();
  f.email.value='soldier@example.com';f.password.value='secret';f.confirm.value='secreT';
  await f.form.listeners.submit({preventDefault(){}});
  assert.deepEqual(f.calls,[],'no register call happens');
  assert.equal(typeof f.errors.at(-1),'string','the error is a ready-to-show message');
  assert.match(f.errors.at(-1),/passw/i);
  assert.equal(f.confirm.focused,1,'the mismatching box gets the focus');
  assert.equal(f.submit.disabled,false,'the form is not left busy');
  // The field is never cleared - the player sees what they typed.
  assert.equal(f.password.value,'secret');
  assert.equal(f.confirm.value,'secreT');
});

test('a match creates the account with the chosen password',async()=>{
  const f=fixture();
  f.register.listeners.click();
  f.email.value=' soldier@example.com ';f.password.value='secret';f.confirm.value='secret';
  await f.form.listeners.submit({preventDefault(){}});
  assert.deepEqual(f.calls,[['register','soldier@example.com','secret']]);
  assert.equal(f.errors.at(-1),null,'the previous error is cleared on the way in');
});

test('sign-in never asks for a confirmation',async()=>{
  const f=fixture();
  f.email.value='soldier@example.com';f.password.value='secret';f.confirm.value='whatever is left over';
  f.register.listeners.click();f.register.listeners.click(); // back to sign-in, confirm cleared
  await f.form.listeners.submit({preventDefault(){}});
  assert.deepEqual(f.calls,[['login','soldier@example.com','secret']]);
});

test('without the confirm elements the form keeps working',async()=>{
  const f=fixture({withConfirm:false});
  f.register.listeners.click();
  f.email.value='soldier@example.com';f.password.value='secret';
  await f.form.listeners.submit({preventDefault(){}});
  assert.deepEqual(f.calls,[['register','soldier@example.com','secret']]);
});

test('the account wires the confirm field and shows string errors',()=>{
  const source=readFileSync(new URL('../account.js',import.meta.url),'utf8');
  assert.match(source,/confirm:\$\('passwordConfirm'\),confirmField:\$\('passwordConfirmField'\)/,'both elements are handed to the form');
  assert.match(source,/onError:error=>message\(typeof error==='string'\?error:error\?errorText\(error\):''\)/,'a plain message string reaches the player untranslated by errorText');
  const de=readFileSync(new URL('../localization-more-static-de.mjs',import.meta.url),'utf8');
  assert.match(de,/"The passwords do not match\. Please type them again\.": "Die Passwörter stimmen nicht überein\. Bitte gib sie erneut ein\."/);
});

// Keep sign-in and account creation as real form submissions so password
// managers can identify the username and the appropriate password purpose.
import {translateText} from './language.mjs?v=20261112-avatar1';
export function setupAuthForm({form,email,password,submit,register,forgot,onSignIn,onRegister,onError=()=>{}}){
 let creating=false,busy=false;
 // Reported: "im Login-Screen steht teilweise noch englische Schrift". The
 // first paint is translated by the early language pass, but switching between
 // sign-in and account creation rewrote the buttons in hard-coded English.
 // The labels go through the dictionary like every other string now; the
 // message keys (auth.signin/auth.register) and these entries must stay in
 // sync - ANMELDEN / KONTO ERSTELLEN in German.
 function setMode(value){
  creating=value;password.autocomplete=creating?'new-password':'current-password';
  submit.textContent=creating?translateText('CREATE ACCOUNT'):translateText('SIGN IN');
  register.textContent=creating?translateText('BACK TO SIGN IN'):translateText('CREATE ACCOUNT');forgot.hidden=creating;
 }
 register.addEventListener('click',()=>{if(!busy)setMode(!creating);});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const address=email.value.trim(),secret=password.value,action=creating?onRegister:onSignIn;
  busy=true;submit.disabled=true;register.disabled=true;forgot.disabled=true;onError(null);
  try{await action(address,secret);}catch(error){onError(error);}finally{busy=false;submit.disabled=false;register.disabled=false;forgot.disabled=false;}
 });
 setMode(false);
}

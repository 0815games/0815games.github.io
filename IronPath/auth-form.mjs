// Keep sign-in and account creation as real form submissions so password
// managers can identify the username and the appropriate password purpose.
export function setupAuthForm({form,email,password,submit,register,forgot,onSignIn,onRegister,onError=()=>{}}){
 let creating=false,busy=false;
 function setMode(value){
  creating=value;password.autocomplete=creating?'new-password':'current-password';
  submit.textContent=creating?'CREATE ACCOUNT':'SIGN IN';register.textContent=creating?'BACK TO SIGN IN':'CREATE ACCOUNT';forgot.hidden=creating;
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

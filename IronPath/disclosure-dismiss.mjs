// Dismiss informational disclosures without triggering or cancelling any action.
export function bindDisclosureDismiss(document){
  document.addEventListener('click',event=>{
    for(const details of document.querySelectorAll('details[open]'))if(!details.contains(event.target))details.open=false;
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||document.querySelector('dialog[open]'))return;
    for(const details of document.querySelectorAll('details[open]'))details.open=false;
  });
}

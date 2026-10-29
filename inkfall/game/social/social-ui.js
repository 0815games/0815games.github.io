"use strict";
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.InkfallSocialUI=api;
})(globalThis,()=>{
  function ownCodeCard({doc,win,store}){
    const card=doc.createElement("div");
    let note=doc.createElement("p");
    note.id="if-social-own-code-note";
    card.append(note);

    function render(){
      card.children.length=0;
      note=doc.createElement("p");
      note.id="if-social-own-code-note";
      card.append(note);

      if(!store.has()){
        note.textContent="Social ist noch nicht freigeschaltet.";
        return;
      }

      const state=store.snapshot();
      if(!state.uid){
        note.textContent="Bitte anmelden.";
        return;
      }

      if(state.friendCode){
        const uid=state.uid;
        const code=state.friendCode;
        const input=doc.createElement("input");
        input.value=code;
        input.readOnly=true;
        input.setAttribute("aria-label","Eigener Freundescode");

        const button=doc.createElement("button");
        button.type="button";
        button.textContent="Code kopieren";
        button.onclick=async()=>{
          try{
            if(store.snapshot().uid!==uid||!card.isConnected)return;
            await win.navigator.clipboard.writeText(code);
            if(store.snapshot().uid!==uid||!card.isConnected)return;
            note.textContent="Freundescode kopiert.";
          }catch(error){
            if(store.snapshot().uid!==uid||!card.isConnected)return;
            input.select();
            input.setSelectionRange(0,code.length);
            note.textContent="Kopieren nicht möglich. Bitte Code manuell markieren und kopieren.";
          }
        };

        card.append(input,button);
        note.textContent="";
        return;
      }

      const button=doc.createElement("button");
      button.type="button";
      button.textContent="Freundescode laden";
      button.onclick=()=>{store.loadCode();};
      card.append(button);

      note.textContent=state.codeLoading
        ? "Freundescode wird geladen."
        : state.codeError
          ? "Freundescode konnte nicht geladen werden. Bitte erneut versuchen."
          : "Noch kein Freundescode vorhanden.";
    }

    render();
    return card;
  }

  function normalizePrivacy(value){
    if(value===null||value===undefined)return {profile:"private",characters:"private"};
    if(typeof value!=="object"||Array.isArray(value))throw new Error("invalid-privacy");
    const profile=value.profile??"private";
    const characters=value.characters??"private";
    if(!["private","friends"].includes(profile)||!["private","friends"].includes(characters))throw new Error("invalid-privacy");
    return {profile,characters};
  }

  function createPrivacyController({canUse,read,save}){
    if(typeof canUse!=="function"||typeof read!=="function"||typeof save!=="function")throw new Error("invalid-controller");
    let state={uid:null,loaded:false,loading:false,saving:false,saved:{profile:"private",characters:"private"},draft:{profile:"private",characters:"private"},dirty:false,message:null,error:null};
    let loadPromise=null;

    const snapshot=()=>({...state,enabled:canUse(),saved:{...state.saved},draft:{...state.draft}});

    function setUser(uid){
      state.uid=uid;
      state.loaded=false;
      state.loading=false;
      state.saving=false;
      state.saved={profile:"private",characters:"private"};
      state.draft={profile:"private",characters:"private"};
      state.dirty=false;
      state.message=null;
      state.error=null;
      loadPromise=null;
    }

    function load({discard=false}={}){
      if(!canUse()||!state.uid)return Promise.resolve();
      if(state.loading)return loadPromise;
      if(state.loaded&&!discard)return Promise.resolve();

      state.loading=true;
      state.error=null;
      const uid=state.uid;

      loadPromise=new Promise(resolve=>{
        resolve((async()=>{
          await Promise.resolve();
          if(state.uid!==uid){
            state.loading=false;
            loadPromise=null;
            return;
          }
          try{
            const normalized=normalizePrivacy(await read(uid));
            if(state.uid!==uid)return;
            state.saved=normalized;
            state.draft={...normalized};
            state.dirty=false;
            state.loaded=true;
          }catch(error){
            if(state.uid===uid){
              state.loaded=false;
              state.error="Einstellungen konnten nicht geladen werden.";
            }
          }finally{
            if(state.uid===uid){
              state.loading=false;
              loadPromise=null;
            }
          }
        })());
      });
      return loadPromise;
    }

    function set(field,value){
      if(!canUse()||!state.uid||!state.loaded||state.saving)return false;
      if(!["profile","characters"].includes(field)||!["private","friends"].includes(value))return false;
      state.draft[field]=value;
      state.dirty=state.draft.profile!==state.saved.profile||state.draft.characters!==state.saved.characters;
      return true;
    }

    function reset(){
      state.draft={...state.saved};
      state.dirty=false;
    }

    async function submit(){
      if(!canUse()||!state.uid||!state.loaded||state.saving||!state.dirty)return false;
      state.saving=true;
      state.message=null;
      state.error=null;
      const uid=state.uid;
      const values={profile:state.draft.profile,characters:state.draft.characters};
      try{
        const accepted=await save(values)===true;
        const confirmed=normalizePrivacy(await read(uid));
        if(state.uid!==uid){
          state.saving=false;
          return false;
        }
        state.saved=confirmed;
        state.dirty=state.draft.profile!==confirmed.profile||state.draft.characters!==confirmed.characters;
        if(accepted&&confirmed.profile===values.profile&&confirmed.characters===values.characters){
          state.draft={...confirmed};
          state.dirty=false;
          state.message="Einstellungen bestätigt.";
          return true;
        }
        state.error="Speichern nicht vollständig bestätigt.";
        return false;
      }catch(error){
        if(state.uid===uid){
          state.loaded=false;
          state.error="Speichern unbekannt. Bitte erneut prüfen.";
        }
        return false;
      }finally{
        if(state.uid===uid)state.saving=false;
      }
    }

    return Object.freeze({setUser,load,set,reset,submit,snapshot});
  }

  function privacyCard({doc,controller}){
    const card=doc.createElement("div");
    function render(){
      card.children.length=0;
      const state=controller.snapshot();
      const status=doc.createElement("p");
      status.dataset.focus="privacy-status";
      card.append(status);

      const disabled=!state.enabled;
      const enabled=state.loaded&&!state.saving&&!disabled;
      const makeSwitch=(field,label)=>{
        const button=doc.createElement("button");
        button.type="button";
        button.dataset.focus="privacy-"+field;
        button.setAttribute("role","switch");
        button.setAttribute("aria-checked",String(state.draft[field]==="friends"));
        button.textContent=label;
        button.disabled=!enabled;
        button.onclick=()=>{
          controller.set(field,state.draft[field]==="private"?"friends":"private");
          render();
        };
        return button;
      };

      card.append(
        makeSwitch("profile","Profil für Freunde sichtbar"),
        makeSwitch("characters","Charaktere für Freunde sichtbar")
      );

      const save=doc.createElement("button");
      save.type="button";
      save.dataset.focus="privacy-save";
      save.textContent="Speichern";
      save.disabled=!state.dirty||!enabled;
      save.onclick=async()=>{
        await controller.submit();
        render();
      };
      card.append(save);

      status.textContent=disabled
        ?"Social ist deaktiviert."
        :state.message
          ||state.error
          ||(state.saving?"Speichern läuft.":state.loaded?"":"Einstellungen konnten nicht geladen werden.");
      return card;
    }
    return render();
  }

  function create({document:doc,window:win,store,inspector={},readPrivacy}){
    let dialog=null;
    let controller=null;

    function open(){
      if(dialog)return;
      controller=createPrivacyController({
        canUse:()=>store.has()&&Boolean(store.snapshot().uid),
        read:uid=>readPrivacy(uid),
        save:values=>store.action("setPrivacy",values)
      });
      controller.setUser(store.snapshot().uid);

      dialog=doc.createElement("div");
      const settings=doc.createElement("button");
      settings.type="button";
      settings.dataset.focus="tab-settings";
      settings.textContent="Einstellungen";
      const content=doc.createElement("div");
      dialog.append(settings,content);
      doc.body.append(dialog);

      function renderPrivacy(){
        content.replaceChildren(privacyCard({doc,controller}));
      }

      settings.onclick=async()=>{
        await controller.load();
        renderPrivacy();
      };
    }

    function destroy(){
      dialog?.remove();
      dialog=null;
      controller=null;
    }

    return Object.freeze({open,destroy});
  }

  return Object.freeze({ownCodeCard,normalizePrivacy,createPrivacyController,privacyCard,create});
});

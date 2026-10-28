"use strict";
const {initializeApp}=require("firebase-admin/app");
const {getDatabase}=require("firebase-admin/database");
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {onValueWritten}=require("firebase-functions/v2/database");
const {defineString}=require("firebase-functions/params");
const {logger}=require("firebase-functions");
const {createSocialService,SocialError}=require("./social-service.cjs");
const app=initializeApp();
const region=defineString("INKFALL_DATABASE_REGION",{description:"Region der vorhandenen Realtime Database; vor Deployment prüfen."});
const instance=defineString("INKFALL_DATABASE_INSTANCE",{description:"Exakter Instanzname der vorhandenen Realtime Database."});
const databaseURL=defineString("INKFALL_DATABASE_URL",{description:"URL genau dieser Realtime-Database-Instanz."});
const service=()=>createSocialService({db:getDatabase(app,databaseURL.value())});
const options={region,enforceAppCheck:true,maxInstances:3,concurrency:10,timeoutSeconds:30};
function callable(method){return onCall(options,async request=>{
 try{return await service()[method](request.auth?.uid,request.data??{});}
 catch(error){if(error instanceof SocialError)throw new HttpsError(error.code,error.message);logger.error("Social backend operation failed",{method});throw new HttpsError("internal","Aktion konnte nicht abgeschlossen werden.");}
});}
exports.socialGetCode=callable("getCode");
exports.socialRequestByCode=callable("requestByCode");
exports.socialRespond=callable("respond");
exports.socialSetPrivacy=callable("setPrivacy");
exports.socialRepairIndexes=onValueWritten({ref:"/social/relationships/{a}/{b}",region,instance,retry:true,maxInstances:3},event=>service().reconcile(event.params.a,event.params.b));

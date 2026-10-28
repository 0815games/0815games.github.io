"use strict";
function merge(base,fragment){
 if(base.rules?.['.read']!==false||base.rules?.['.write']!==false)throw Error('Root rules must explicitly deny reads and writes');
 if(Object.hasOwn(base.rules,'social'))throw Error('Refusing to replace existing social rules');
 if(Object.keys(fragment.rules).join()!=='social')throw Error('Unexpected fragment roots');
 return {...base,rules:{...base.rules,social:fragment.rules.social}};
}
module.exports={merge};

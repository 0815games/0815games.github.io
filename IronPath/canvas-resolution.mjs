// Logical game coordinates remain fixed; the backing buffer follows the
// displayed size and device pixel ratio, within a predictable memory budget.
export function canvasResolution(width,height,rect,dpr=1){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Invalid logical canvas size');
 const ratio=Number.isFinite(dpr)&&dpr>0?dpr:1;
 const displayed=Number.isFinite(rect?.width)&&rect.width>0?rect.width/width:1;
 const scale=Math.max(1,Math.min(3,Math.sqrt(6000000/(width*height)),displayed*ratio));
 return {width:Math.round(width*scale),height:Math.round(height*scale)};
}

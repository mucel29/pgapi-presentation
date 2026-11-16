/** Preserve the display aspect with approximately three CSS pixels per texel. */
export function retroRaster(width:number,height:number){
 const scale=Math.max(1,width/480,height/270);
 return {width:Math.max(1,Math.round(width/scale)),height:Math.max(1,Math.round(height/scale))};
}

/** Explorer quality is independent of the lesson's deliberate 480×270 style. */
export function explorerRaster(width:number,height:number,scale=1){
 const aspect=width/Math.max(1,height),ceiling=Math.min(1,1280/Math.max(1,width),720/Math.max(1,height));
 const w=Math.max(1,Math.round(width*ceiling*Math.max(.25,Math.min(1,scale))));
 return {width:w,height:Math.max(1,Math.min(720,Math.round(w/aspect)))};
}

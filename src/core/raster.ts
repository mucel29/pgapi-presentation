/** Preserve the display aspect with approximately three CSS pixels per texel. */
export function retroRaster(width:number,height:number){
 const scale=Math.max(1,width/480,height/270);
 return {width:Math.max(1,Math.round(width/scale)),height:Math.max(1,Math.round(height/scale))};
}

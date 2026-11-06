// Live monitor image and matching full-screen lens at the geometric cut.
export const monitor={width:1.66,height:1.06,center:[-1.02,2.16,-1.047] as const};
export const portalCut=.62;
export function portalLens(aspect:number,fov=43){
 const tangent=Math.tan(fov*Math.PI/360),screenAspect=monitor.width/monitor.height;
 return {distance:Math.min(monitor.height/(2*tangent),monitor.width/(2*tangent*aspect)),textureFov:2*Math.atan(tangent*Math.max(1,aspect/screenAspect))*180/Math.PI};
}

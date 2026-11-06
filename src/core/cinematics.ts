import * as T from 'three';
import {add,mul,sub,type Vec3} from './math.ts';
import {route} from './route.ts';
import {monitor,portalLens,portalCut} from './portal.ts';
export type ShotMotion='hold'|'launch'|'travel'|'glass'|'portal'|'arrive';
export const clamp01=(t:number)=>Math.max(0,Math.min(1,t));
export const ease=(t:number)=>{const u=clamp01(t);return u*u*u*(u*(u*6-15)+10);};
const windowed=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
export function routePoint(progress:number,points:Vec3[]=route):Vec3{
 const i=Math.max(0,Math.min(points.length-2,Math.floor(progress))),f=clamp01(progress-i);return add(points[i],mul(sub(points[i+1],points[i]),f));
}
export function routeDistance(from:number,to:number,points:Vec3[]=route){
 let total=0,p=routePoint(from,points);
 for(let i=Math.floor(from)+1;i<=Math.ceil(to);i++){const next=routePoint(Math.min(i,to),points);total+=Math.hypot(...sub(next,p));p=next;}
 return total;
}
// Travel is measured in world distance. The very short glass segment is only
// slowed deliberately around its two physical interfaces, never accidentally.
export function progressAtDistance(from:number,to:number,distance:number,points:Vec3[]=route){
 let remaining=Math.max(0,distance),p=routePoint(from,points),cursor=from;
 for(let i=Math.floor(from)+1;i<=Math.ceil(to);i++){
  const end=Math.min(i,to),q=routePoint(end,points),length=Math.hypot(...sub(q,p));
  if(remaining<=length)return cursor+(end-cursor)*(length?remaining/length:0);
  remaining-=length;p=q;cursor=end;
 }
 return to;
}
export function shotState(motion:ShotMotion,t:number,from:number,to:number){
 const u=clamp01(t),total=routeDistance(from,to);let distance=total*windowed(u,.07,.79);
 const camera=motion==='glass'?windowed(u,.10,.49):motion==='hold'?1:motion==='portal'?ease(u):motion==='arrive'?windowed(u,0,.88):windowed(u,.16,.94);
 if(motion==='launch')distance=total*windowed(u,.13,.71);
 if(motion==='glass'){
  const entry=routeDistance(from,3),exit=routeDistance(from,4);
  distance=u<.5?entry*windowed(u,.08,.5):u<.6?entry:u<.74?entry+(exit-entry)*windowed(u,.6,.74):u<.82?exit:exit+(total-exit)*windowed(u,.82,.94);
 }
 const ray=total?progressAtDistance(from,to,distance):to;
 const phase=u<.13?'anticipation':u>.94?'arrival':motion==='glass'&&((u>=.5&&u<=.6)||(u>=.74&&u<=.82))?'interface':'travel';
 return {camera,ray:u===1?to:ray,phase};
}
export const portalStart:Vec3=[-56,5.5,60],portalEnd:Vec3=[-52,5.5,44],portalAim:Vec3=[-32,4,-2];
// The texture camera and world camera sample this SAME rail on both sides of
// the cut. Position, aim and first derivative are therefore continuous.
export function portalWorldPose(t:number,start:Vec3=portalStart){
 const u=clamp01(t),v=1-u,c1:Vec3=add(start,[1,0,-4]),c2:Vec3=[-54,5.5,50];
 const position=add(add(mul(start,v*v*v),mul(c1,3*v*v*u)),add(mul(c2,3*v*u*u),mul(portalEnd,u*u*u)));
 return {position,target:portalAim};
}

export interface ShotDefinition {camera:Vec3;target:Vec3;portraitCamera?:Vec3;portraitTarget?:Vec3;via?:Vec3[];aimVia?:Vec3[];motion?:ShotMotion;rayFrom:number;rayTo:number;layout:string;visual:string;}

function rail(points:Vec3[],t:number):Vec3{
 if(points.every(p=>Math.hypot(...sub(p,points[0]))<1e-9))return [...points[0]];
 return new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal').getPointAt(clamp01(t)).toArray() as Vec3;
}
export function shotPose(shot:ShotDefinition,previous:ShotDefinition,t:number,aspect=16/9){
 const state=shotState(shot.motion??'arrive',t,shot.rayFrom,shot.rayTo);
 if(shot.motion==='portal')return {...portalWorldPose(t),...state};
 const fromCamera=aspect<.9?previous.portraitCamera??previous.camera:previous.camera,toCamera=aspect<.9?shot.portraitCamera??shot.camera:shot.camera,fromTarget=aspect<.9?previous.portraitTarget??previous.target:previous.target,toTarget=aspect<.9?shot.portraitTarget??shot.target:shot.target;
 if(shot.motion==='glass'){
  // Sidecar witness: lag behind the ray, never overtake an independently
  // interpolated look-at target. Park before the entry hold, then show both
  // interfaces from this one stable oblique view.
  const settle=windowed(t,.1,.5),lag=.07*(1-windowed(t,.35,.5)),follow=shotState('glass',Math.min(.5,Math.max(0,t-lag)),shot.rayFrom,shot.rayTo).ray;
  const startOffset=sub(fromCamera,routePoint(shot.rayFrom)),endOffset=sub(toCamera,routePoint(3)),offset=add(startOffset,mul(sub(endOffset,startOffset),settle));
  const position=add(routePoint(follow),offset),head=routePoint(state.ray),target=add(head,mul(sub(toTarget,head),windowed(t,.35,.5)));
  return {position,target,...state};
 }
 const position=rail([fromCamera,...(shot.via??[]),toCamera],state.camera),target=rail([fromTarget,...(shot.aimVia??[]),toTarget],state.camera);
 return {position,target,...state};
}
// Canvas and lesson rail are physically disjoint; no projection offsets.
export function shotFraming(_shot:ShotDefinition,_aspect:number):[number,number]{return [0,0];}

export function roomApproachPose(t:number,aspect:number,from:Vec3=[2.4,2.6,5.9],fromTarget:Vec3=[...monitor.center]){
 const u=clamp01(t/portalCut),e=ease(u),center=new T.Vector3(...monitor.center),end=center.clone().add(new T.Vector3(0,0,portalLens(aspect).distance));
 const path=new T.CubicBezierCurve3(new T.Vector3(...from),new T.Vector3(-1.02,2.5,3.2),new T.Vector3(-1.02,2.16,2.4),end);
 return {position:path.getPoint(e).toArray() as Vec3,target:new T.Vector3(...fromTarget).lerp(center,Math.min(1,u/.55)).toArray() as Vec3};
}
